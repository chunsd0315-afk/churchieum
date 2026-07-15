/**
 * 은혜기록 공통 작성 화면
 * - 기록 유형(성경통독 / 설교 / 자유) 선택
 * - 유형별 입력 항목만 동적 표시
 * - 저장은 기존 GraceNote(reading | sermon | personal) 구조 유지
 */

import { useState, useEffect } from 'react';
import {
  Heart, BookOpen, CheckCircle, BookMarked, Sparkles, Mic, PenLine, Star,
} from 'lucide-react';
import {
  getGraceNote, createGraceNote, updateGraceNote,
  type GraceNoteInput, type GraceNoteType,
} from '../../data/graceNotes';
import { getPlanColor, type PlanId } from '../../data/readingPlans';
import { GraceNoteShareSelector, defaultShareState, shareStateToInput, type GraceNoteShareState } from './GraceNoteShareSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ui';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';

export type ReadingEditorCtx = {
  progressId: string;
  planId: string;
  planName: string;
  planColor: string;
  day: number;
  readingReferences?: string;
};

export type SermonEditorCtx = {
  sermonId?: string;
  sermonTitle?: string;
  sermonPreacher?: string;
  sermonDate?: string;
  bibleReference?: string;
  worshipType?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  /** 설교 페이지에서 연결된 경우 — 설교 정보 읽기 전용 */
  linkedFromSermon?: boolean;
};

export type GraceNoteEditorProps = {
  onSave: (id: string) => void;
  onBack: () => void;
  /** 수정 시 */
  editId?: string;
  /** 초기 / 고정 유형 */
  initialType?: GraceNoteType;
  /** 유형 변경 잠금 (수정·설교 연동·통독센터 등) */
  lockType?: boolean;
  readingCtx?: ReadingEditorCtx | null;
  sermonCtx?: SermonEditorCtx | null;
  /** 성경통독 선택 시 진행 중 통독이 아직 없으면 호출 */
  onNeedReadingPick?: () => void;
};

const TYPE_OPTIONS: {
  id: GraceNoteType;
  label: string;
  icon: typeof BookOpen;
  desc: string;
}[] = [
  { id: 'reading', label: '성경통독', icon: BookOpen, desc: '통독 말씀의 은혜' },
  { id: 'sermon', label: '설교', icon: Mic, desc: '설교를 통한 은혜' },
  { id: 'personal', label: '자유', icon: PenLine, desc: '일상 속 감사와 은혜' },
];

function persistGraceNote(input: GraceNoteInput, editId: string | undefined, userId?: string): string {
  const payload = { ...input, userId: input.userId ?? userId };
  if (editId) {
    updateGraceNote(editId, payload);
    return editId;
  }
  return createGraceNote(payload, userId).id;
}

function FieldBlock({
  icon, label, required, value, onChange, placeholder, rows,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
        {icon}
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:border-primary-400 resize-none placeholder-gray-300"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function TextInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-800 mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-400"
      />
    </div>
  );
}

export function GraceNoteEditor({
  onSave,
  onBack,
  editId,
  initialType,
  lockType = false,
  readingCtx = null,
  sermonCtx = null,
  onNeedReadingPick,
}: GraceNoteEditorProps) {
  const { user } = useAuth();
  const toast = useToast();
  const existing = editId ? getGraceNote(editId) : null;

  const [noteType, setNoteType] = useState<GraceNoteType>(
    existing?.type ?? initialType ?? 'personal',
  );

  const [graceTitle, setGraceTitle] = useState(existing?.graceTitle ?? '');
  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [memorableVerse, setMemorableVerse] = useState(existing?.memorableVerse ?? '');
  const [application, setApplication] = useState(existing?.application ?? '');
  const [prayer, setPrayer] = useState(existing?.prayer ?? '');
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false);
  const [share, setShare] = useState<GraceNoteShareState>(() => defaultShareState(existing ?? undefined));
  const [saved, setSaved] = useState(false);

  // reading
  const [readingRef, setReadingRef] = useState(
    existing?.bibleReference ?? readingCtx?.readingReferences ?? '',
  );

  // sermon (수동 입력)
  const linked = Boolean(sermonCtx?.linkedFromSermon && !editId);
  const [editSermonTitle, setEditSermonTitle] = useState(
    existing?.sermonTitle ?? sermonCtx?.sermonTitle ?? '',
  );
  const [editPreacher, setEditPreacher] = useState(
    existing?.sermonPreacher ?? sermonCtx?.sermonPreacher ?? '',
  );
  const [editSermonDate, setEditSermonDate] = useState(
    existing?.sermonDate ?? sermonCtx?.sermonDate ?? new Date().toISOString().slice(0, 10),
  );
  const [editBibleRef, setEditBibleRef] = useState(
    existing?.bibleReference ?? sermonCtx?.bibleReference ?? '',
  );

  useEffect(() => {
    if (initialType && !editId) setNoteType(initialType);
  }, [initialType, editId]);

  useEffect(() => {
    if (readingCtx?.readingReferences && !readingRef) {
      setReadingRef(readingCtx.readingReferences);
    }
  }, [readingCtx, readingRef]);

  const canChangeType = !lockType && !editId && !linked;

  const selectType = (next: GraceNoteType) => {
    if (!canChangeType) return;
    if (next === 'reading' && !readingCtx) {
      onNeedReadingPick?.();
      return;
    }
    setNoteType(next);
  };

  const hasContent = graceContent.trim().length > 0;

  const handleSave = () => {
    if (!hasContent) return;

    if (noteType === 'reading' && !readingCtx && !existing) {
      onNeedReadingPick?.();
      return;
    }

    let input: GraceNoteInput;

    if (noteType === 'reading') {
      const planColor = readingCtx?.planColor
        ?? existing?.planColor
        ?? (existing?.planId ? getPlanColor(existing.planId as PlanId) : 'from-primary-500 to-primary-700');
      input = {
        type: 'reading',
        authorName: existing?.authorName ?? user?.name,
        ...shareStateToInput(share),
        sourceId: readingCtx?.progressId ?? existing?.sourceId,
        sourceTitle: readingCtx?.planName ?? existing?.planName,
        planId: readingCtx?.planId ?? existing?.planId,
        planName: readingCtx?.planName ?? existing?.planName,
        planColor,
        day: readingCtx?.day ?? existing?.day,
        bibleReference: readingRef,
        memorableVerse,
        graceContent,
        application,
        prayer,
        graceTitle: graceTitle.trim() || undefined,
        isFavorite,
      };
    } else if (noteType === 'sermon') {
      const finalTitle = linked ? (sermonCtx?.sermonTitle ?? '') : editSermonTitle;
      const finalPreacher = linked ? (sermonCtx?.sermonPreacher ?? '') : editPreacher;
      const finalDate = linked ? (sermonCtx?.sermonDate ?? '') : editSermonDate;
      const finalBibleRef = linked ? (sermonCtx?.bibleReference ?? '') : editBibleRef;
      input = {
        type: 'sermon',
        authorName: existing?.authorName ?? user?.name,
        ...shareStateToInput(share),
        sourceId: sermonCtx?.sermonId ?? existing?.sourceId,
        sourceTitle: finalTitle,
        sermonTitle: finalTitle,
        sermonPreacher: finalPreacher,
        sermonDate: finalDate,
        bibleReference: finalBibleRef,
        worshipType: sermonCtx?.worshipType ?? existing?.worshipType,
        thumbnailUrl: sermonCtx?.thumbnailUrl ?? existing?.thumbnailUrl,
        videoUrl: sermonCtx?.videoUrl ?? existing?.videoUrl,
        graceTitle: graceTitle.trim() || undefined,
        isFavorite,
        memorableVerse: linked ? '' : memorableVerse,
        graceContent,
        application: linked ? '' : application,
        prayer: linked ? '' : prayer,
      };
    } else {
      input = {
        type: 'personal',
        authorName: existing?.authorName ?? user?.name,
        ...shareStateToInput(share),
        graceTitle: graceTitle.trim() || undefined,
        memorableVerse, // 감사 제목
        graceContent,
        application: '',
        prayer,
        isFavorite,
      };
    }

    try {
      const id = persistGraceNote(input, editId, user?.id);
      setSaved(true);
      setTimeout(() => { onSave(id); }, linked ? 400 : 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  };

  const saveBtn = (
    <button
      type="button"
      onClick={handleSave}
      disabled={!hasContent || saved}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors ${
        saved
          ? 'bg-green-500 text-white'
          : !hasContent || saved
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      {saved ? '저장됨 ✓' : '저장'}
    </button>
  );

  const planColor = readingCtx?.planColor
    ?? existing?.planColor
    ?? 'from-primary-500 to-primary-700';

  return (
    <ContentEditorLayout
      title={editId ? '은혜기록 수정' : '은혜기록 작성'}
      description="말씀과 삶 속에서 받은 은혜를 기록해 보세요."
      onBack={onBack}
      saveButton={saveBtn}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-5">
        {/* 기록 유형 */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">기록 유형</p>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(opt => {
              const active = noteType === opt.id;
              const Icon = opt.icon;
              const disabled = !canChangeType && !active;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectType(opt.id)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border-2 transition-colors touch-target ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : disabled
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 성경통독 ── */}
        {noteType === 'reading' && (
          <>
            {(readingCtx || existing?.planName) && (
              <div className={`bg-gradient-to-br ${planColor} rounded-2xl p-4 text-white`}>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 opacity-80" />
                  <span className="font-bold">{readingCtx?.planName ?? existing?.planName}</span>
                </div>
                <p className="text-white/70 text-xs">
                  {(readingCtx?.day ?? existing?.day) ?? ''}일차
                </p>
              </div>
            )}
            <TextInput
              label="오늘 읽은 말씀"
              value={readingRef}
              onChange={setReadingRef}
              placeholder="예: 창세기 12장"
            />
            <FieldBlock
              icon={<BookMarked className="w-4 h-4 text-primary-500" />}
              label="마음에 남은 말씀"
              value={memorableVerse}
              onChange={setMemorableVerse}
              placeholder="예: 창세기 1장 1절 - 태초에 하나님이 천지를 창조하시니라"
              rows={3}
            />
            <FieldBlock
              icon={<Heart className="w-4 h-4 text-rose-500" />}
              label="받은 은혜"
              required
              value={graceContent}
              onChange={setGraceContent}
              placeholder="하나님께서 오늘 말씀을 통해 주신 은혜를 적어보세요."
              rows={5}
            />
            <FieldBlock
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
              label="적용할 점"
              value={application}
              onChange={setApplication}
              placeholder="예: 하루의 시작을 말씀과 기도로 시작하겠습니다."
              rows={3}
            />
            <FieldBlock
              icon={<Sparkles className="w-4 h-4 text-violet-500" />}
              label="기도문"
              value={prayer}
              onChange={setPrayer}
              placeholder="예: 주님, 오늘도 말씀 안에서 하루를 시작하게 하소서."
              rows={3}
            />
          </>
        )}

        {/* ── 설교 ── */}
        {noteType === 'sermon' && (
          <>
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500">연결된 설교</p>
              {linked ? (
                <>
                  {sermonCtx?.thumbnailUrl && (
                    <img src={sermonCtx.thumbnailUrl} alt="" className="w-full h-36 object-cover rounded-xl" />
                  )}
                  <ReadOnlyField label="설교 제목" value={sermonCtx?.sermonTitle} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReadOnlyField label="설교자" value={sermonCtx?.sermonPreacher} />
                    <ReadOnlyField label="예배 종류" value={sermonCtx?.worshipType} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReadOnlyField label="설교 날짜" value={sermonCtx?.sermonDate?.replace(/-/g, '.')} />
                    <ReadOnlyField label="성경 본문" value={sermonCtx?.bibleReference} />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <TextInput label="설교 제목" value={editSermonTitle} onChange={setEditSermonTitle} placeholder="설교 제목" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <TextInput label="설교자" value={editPreacher} onChange={setEditPreacher} placeholder="설교자" />
                    <TextInput label="날짜" value={editSermonDate} onChange={setEditSermonDate} type="date" />
                  </div>
                  <TextInput label="성경 본문" value={editBibleRef} onChange={setEditBibleRef} placeholder="예: 요한복음 3:16" />
                </div>
              )}
            </div>
            <TextInput
              label="은혜 제목 (선택)"
              value={graceTitle}
              onChange={setGraceTitle}
              placeholder="예: 십자가의 사랑이 마음에 와닿았습니다"
            />
            <FieldBlock
              icon={<Heart className="w-4 h-4 text-rose-500" />}
              label="받은 은혜"
              required
              value={graceContent}
              onChange={setGraceContent}
              placeholder="설교를 통해 하나님께서 주신 은혜를 적어보세요."
              rows={linked ? 8 : 5}
            />
            {!linked && (
              <>
                <FieldBlock
                  icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                  label="적용할 점"
                  value={application}
                  onChange={setApplication}
                  placeholder="삶에 적용할 내용을 적어보세요."
                  rows={3}
                />
                <FieldBlock
                  icon={<Sparkles className="w-4 h-4 text-violet-500" />}
                  label="기도문"
                  value={prayer}
                  onChange={setPrayer}
                  placeholder="기도의 마음을 적어보세요."
                  rows={3}
                />
              </>
            )}
          </>
        )}

        {/* ── 자유 ── */}
        {noteType === 'personal' && (
          <>
            <TextInput
              label="은혜 제목"
              value={graceTitle}
              onChange={setGraceTitle}
              placeholder="예: 오늘 감사한 일"
            />
            <FieldBlock
              icon={<Heart className="w-4 h-4 text-rose-500" />}
              label="오늘 받은 은혜"
              required
              value={graceContent}
              onChange={setGraceContent}
              placeholder="하나님께서 주신 은혜와 마음을 적어보세요."
              rows={6}
            />
            <TextInput
              label="감사 제목"
              value={memorableVerse}
              onChange={setMemorableVerse}
              placeholder="특별히 감사한 한 가지를 적어보세요."
            />
            <FieldBlock
              icon={<Sparkles className="w-4 h-4 text-violet-500" />}
              label="기도문"
              value={prayer}
              onChange={setPrayer}
              placeholder="감사와 기도의 마음을 적어보세요."
              rows={3}
            />
          </>
        )}

        <GraceNoteShareSelector value={share} onChange={setShare} />

        <label className="flex items-center gap-3 touch-target cursor-pointer py-2">
          <button
            type="button"
            onClick={() => setIsFavorite(v => !v)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors ${
              isFavorite ? 'border-amber-400 bg-amber-50 text-amber-500' : 'border-gray-200 text-gray-400'
            }`}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
          <span className="text-sm font-semibold text-gray-700">즐겨찾기에 추가</span>
        </label>
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

/** @deprecated GraceNoteEditor로 통합 — 통독센터·기존 import 호환 */
export type GraceFormCtx = ReadingEditorCtx & { editId?: string; readingReferences: string };
/** @deprecated */
export type SermonGraceFormCtx = SermonEditorCtx & { editId?: string };

export function GraceNoteFormView({
  ctx, onSave, onBack,
}: {
  ctx: GraceFormCtx;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <GraceNoteEditor
      onSave={onSave}
      onBack={onBack}
      editId={ctx.editId}
      initialType="reading"
      lockType
      readingCtx={ctx}
    />
  );
}

export function SermonGraceFormView({
  ctx, onSave, onBack,
}: {
  ctx: SermonGraceFormCtx;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <GraceNoteEditor
      onSave={onSave}
      onBack={onBack}
      editId={ctx.editId}
      initialType="sermon"
      lockType
      sermonCtx={ctx}
    />
  );
}

export function PersonalGraceFormView({
  editId, onSave, onBack,
}: {
  editId?: string;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <GraceNoteEditor
      onSave={onSave}
      onBack={onBack}
      editId={editId}
      initialType="personal"
      lockType
    />
  );
}

export const GRACE_FORM_HEADERS = {
  reading: {
    title: '성경통독 은혜기록',
    editTitle: '성경통독 은혜기록 수정',
    description: '오늘 읽은 말씀의 은혜를 기록해 보세요.',
  },
  sermon: {
    title: '설교 은혜기록',
    editTitle: '설교 은혜기록 수정',
    description: '설교를 통해 받은 은혜를 기록해 보세요.',
  },
  personal: {
    title: '자유 은혜기록',
    editTitle: '자유 은혜기록 수정',
    description: '일상 속 하나님의 은혜를 자유롭게 기록해 보세요.',
  },
  write: {
    title: '은혜기록 작성',
    editTitle: '은혜기록 수정',
    description: '말씀과 삶 속에서 받은 은혜를 기록해 보세요.',
  },
} as const;
