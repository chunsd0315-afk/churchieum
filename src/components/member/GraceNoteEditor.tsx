/**
 * 은혜기록 공통 작성/수정 화면
 * 성경통독·설교·자유 — 동일 필드 순서, 관련 기록 영역만 유형별 분기
 */

import { useState, useEffect } from 'react';
import { BookOpen, Mic, PenLine, Star } from 'lucide-react';
import {
  getGraceNote, createGraceNote, updateGraceNote,
  type GraceNoteInput, type GraceNoteType,
} from '../../data/graceNotes';
import { getPlanColor, type PlanId } from '../../data/readingPlans';
import { GraceNoteShareSelector, defaultShareState, shareStateToInput, type GraceNoteShareState } from './GraceNoteShareSelector';
import { GraceRelatedSourceSelector } from './GraceRelatedSourceSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ui';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';
import { getEligiblePastorsForUser } from '../../services/graceNoteShareScope';
import { buildSharedPastorSnapshots } from '../../services/graceShareFilterHelpers';
import { GRACE_CONTENT_MAX_LENGTH } from '../../services/graceNoteDisplay';
import type { AppUser } from '../../services/permissions';
import type { SharedPastorSnapshot } from '../../data/graceNotes';

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
  linkedFromSermon?: boolean;
};

export type GraceNoteEditorProps = {
  onSave: (id: string) => void;
  onBack: () => void;
  editId?: string;
  initialType?: GraceNoteType;
  lockType?: boolean;
  readingCtx?: ReadingEditorCtx | null;
  sermonCtx?: SermonEditorCtx | null;
  onNeedReadingPick?: () => void;
};

const TYPE_OPTIONS: {
  id: GraceNoteType;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { id: 'reading', label: '성경통독', icon: BookOpen },
  { id: 'sermon', label: '설교', icon: Mic },
  { id: 'personal', label: '자유', icon: PenLine },
];

function persistGraceNote(input: GraceNoteInput, editId: string | undefined, userId?: string): string {
  const payload = { ...input, userId: input.userId ?? userId };
  if (editId) {
    updateGraceNote(editId, payload);
    return editId;
  }
  return createGraceNote(payload, userId).id;
}

function shareInputWithSnapshots(
  share: GraceNoteShareState,
  user: AppUser | null | undefined,
  existingSnapshots?: SharedPastorSnapshot[],
) {
  const base = shareStateToInput(share);
  const isPastorShare = base.visibility === 'pastor_share' && !base.sharedPastorAll;
  return {
    ...base,
    sharedPastorSnapshots: isPastorShare
      ? buildSharedPastorSnapshots(
          base.sharedPastorIds ?? [],
          getEligiblePastorsForUser(user ?? null),
          existingSnapshots,
        )
      : [],
  };
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
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false);
  const [share, setShare] = useState<GraceNoteShareState>(() => defaultShareState(existing ?? undefined));
  const [saved, setSaved] = useState(false);

  const [readingRef, setReadingRef] = useState(
    existing?.bibleReference ?? readingCtx?.readingReferences ?? '',
  );

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
    if (!canChangeType || next === noteType) return;
    if (next === 'reading' && !readingCtx && !existing) {
      onNeedReadingPick?.();
      return;
    }
    if (next !== 'reading') {
      setReadingRef('');
    }
    if (next !== 'sermon') {
      setEditSermonTitle('');
      setEditPreacher('');
      setEditSermonDate(new Date().toISOString().slice(0, 10));
      setEditBibleRef('');
    }
    setNoteType(next);
  };

  const buildInput = (): GraceNoteInput => {
    const shareFields = shareInputWithSnapshots(share, user, existing?.sharedPastorSnapshots);
    const legacyEmpty = { memorableVerse: '', application: '', prayer: '' };

    if (noteType === 'reading') {
      const planColor = readingCtx?.planColor
        ?? existing?.planColor
        ?? (existing?.planId ? getPlanColor(existing.planId as PlanId) : 'from-primary-500 to-primary-700');
      return {
        type: 'reading',
        authorName: existing?.authorName ?? user?.name,
        authorRole: existing?.authorRole ?? user?.position,
        ...shareFields,
        sourceId: readingCtx?.progressId ?? existing?.sourceId,
        sourceTitle: readingCtx?.planName ?? existing?.planName,
        planId: readingCtx?.planId ?? existing?.planId,
        planName: readingCtx?.planName ?? existing?.planName,
        planColor,
        day: readingCtx?.day ?? existing?.day,
        bibleReference: readingRef.trim() || existing?.bibleReference,
        graceTitle: graceTitle.trim(),
        graceContent: graceContent.trim(),
        ...legacyEmpty,
        isFavorite,
      };
    }

    if (noteType === 'sermon') {
      const finalTitle = linked ? (sermonCtx?.sermonTitle ?? '') : editSermonTitle;
      const finalPreacher = linked ? (sermonCtx?.sermonPreacher ?? '') : editPreacher;
      const finalDate = linked ? (sermonCtx?.sermonDate ?? '') : editSermonDate;
      const finalBibleRef = linked ? (sermonCtx?.bibleReference ?? '') : editBibleRef;
      return {
        type: 'sermon',
        authorName: existing?.authorName ?? user?.name,
        authorRole: existing?.authorRole ?? user?.position,
        ...shareFields,
        sourceId: sermonCtx?.sermonId ?? existing?.sourceId,
        sourceTitle: finalTitle,
        sermonTitle: finalTitle,
        sermonPreacher: finalPreacher,
        sermonDate: finalDate,
        bibleReference: finalBibleRef,
        worshipType: sermonCtx?.worshipType ?? existing?.worshipType,
        thumbnailUrl: sermonCtx?.thumbnailUrl ?? existing?.thumbnailUrl,
        videoUrl: sermonCtx?.videoUrl ?? existing?.videoUrl,
        graceTitle: graceTitle.trim(),
        graceContent: graceContent.trim(),
        ...legacyEmpty,
        isFavorite,
      };
    }

    return {
      type: 'personal',
      authorName: existing?.authorName ?? user?.name,
      authorRole: existing?.authorRole ?? user?.position,
      ...shareFields,
      graceTitle: graceTitle.trim(),
      graceContent: graceContent.trim(),
      ...legacyEmpty,
      isFavorite,
    };
  };

  const handleSave = () => {
    if (!graceTitle.trim()) {
      toast.error('은혜기록 제목을 입력해 주세요.');
      return;
    }
    if (!graceContent.trim()) {
      toast.error('은혜 내용을 입력해 주세요.');
      return;
    }
    if (noteType === 'reading' && !readingCtx && !existing?.sourceId) {
      onNeedReadingPick?.();
      return;
    }

    try {
      const id = persistGraceNote(buildInput(), editId, user?.id);
      setSaved(true);
      setTimeout(() => { onSave(id); }, linked ? 400 : 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  };

  const canSave = graceTitle.trim().length > 0 && graceContent.trim().length > 0 && !saved;
  const saveLabel = editId ? '수정사항 저장' : '은혜기록 저장';

  const saveBtn = (
    <button
      type="button"
      onClick={handleSave}
      disabled={!canSave}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors ${
        saved
          ? 'bg-green-500 text-white'
          : !canSave
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      {saved ? '저장됨 ✓' : saveLabel}
    </button>
  );

  return (
    <ContentEditorLayout
      title={editId ? '은혜기록 수정' : '은혜기록 작성'}
      description="말씀과 삶 속에서 받은 은혜를 기록해 보세요."
      onBack={onBack}
      saveButton={saveBtn}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-5">
        {/* 1. 기록유형 */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">기록유형</p>
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

        {/* 2. 제목 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">
            제목 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={graceTitle}
            onChange={e => setGraceTitle(e.target.value)}
            placeholder="은혜기록 제목을 입력하세요"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        {/* 3. 은혜 내용 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">
            은혜 내용 <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={graceContent}
            onChange={e => setGraceContent(e.target.value.slice(0, GRACE_CONTENT_MAX_LENGTH))}
            placeholder="받은 은혜와 삶의 적용을 기록해 주세요."
            rows={6}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:border-primary-400 resize-none placeholder-gray-300"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {graceContent.length} / {GRACE_CONTENT_MAX_LENGTH}
          </p>
        </div>

        {/* 4. 관련 기록 (자유 유형은 표시하지 않음) */}
        {noteType !== 'personal' && (
          <GraceRelatedSourceSelector
          noteType={noteType}
          existing={existing}
          readingCtx={readingCtx}
          readingRef={readingRef}
          onReadingRefChange={setReadingRef}
          onPickReading={onNeedReadingPick}
          sermonCtx={sermonCtx}
          linked={linked}
          editSermonTitle={editSermonTitle}
          editPreacher={editPreacher}
          editSermonDate={editSermonDate}
          editBibleRef={editBibleRef}
          onEditSermonTitle={setEditSermonTitle}
          onEditPreacher={setEditPreacher}
          onEditSermonDate={setEditSermonDate}
          onEditBibleRef={setEditBibleRef}
          />
        )}

        {/* 5. 공개범위 */}
        <GraceNoteShareSelector value={share} onChange={setShare} />

        {/* 6. 즐겨찾기 */}
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
          <span className="text-sm font-semibold text-gray-700">
            {isFavorite ? '즐겨찾기에 추가됨' : '즐겨찾기에 추가'}
          </span>
        </label>
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

/** @deprecated GraceNoteEditor로 통합 */
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
    title: '은혜기록 작성',
    editTitle: '은혜기록 수정',
    description: '오늘 읽은 말씀의 은혜를 기록해 보세요.',
  },
  sermon: {
    title: '은혜기록 작성',
    editTitle: '은혜기록 수정',
    description: '설교를 통해 받은 은혜를 기록해 보세요.',
  },
  personal: {
    title: '은혜기록 작성',
    editTitle: '은혜기록 수정',
    description: '일상 속 하나님의 은혜를 자유롭게 기록해 보세요.',
  },
  write: {
    title: '은혜기록 작성',
    editTitle: '은혜기록 수정',
    description: '말씀과 삶 속에서 받은 은혜를 기록해 보세요.',
  },
} as const;
