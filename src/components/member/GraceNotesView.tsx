/**
 * 은혜기록 관련 화면 컴포넌트
 * - ReadingGraceFormView  : 성경통독 은혜기록 작성/수정
 * - SermonGraceFormView   : 설교 은혜기록 작성/수정
 * - GraceNoteListView     : 모아보기 (검색·필터)
 * - GraceNoteDetailView   : 상세 보기
 * - PlanGraceNotesSummary : 통독 계획 내 은혜기록 요약 (BibleReadingCenter에서 사용)
 */

import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Heart, BookOpen, Edit3, Trash2, Copy, Search,
  Filter, X, CheckCircle, ChevronDown, BookMarked,
  Sparkles, Mic, Lock, Users, Eye, MessageCircle, HandHeart, Star,
} from 'lucide-react';
import {
  getAllGraceNotes, getGraceNote, getGraceNotesByProgress,
  createGraceNote, updateGraceNote, deleteGraceNote,
  toggleGraceNoteLike, addGraceNotePrayer, addGraceNoteAmen, addGraceNoteComment,
  isGraceNoteLikedByMe, formatReadingLabel,
  type GraceNote, type GraceNoteInput, type GraceNoteType, type GraceNoteVisibility,
} from '../../data/graceNotes';
import { formatSharedPastorLabel, formatSharedGroupLabel } from '../../data/graceNoteSeed';
import { READING_PLANS, getPlanColor } from '../../data/readingPlans';
import { GraceNoteShareSelector, defaultShareState, shareStateToInput, type GraceNoteShareState } from './GraceNoteShareSelector';
import { useAuth } from '../../contexts/AuthContext';
import { readOrgSettings } from '../../contexts/OrgSettingsContext';
import { useToast } from '../common/ui';
import ContentEditorLayout, { ContentFormCard, MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { getGraceNoteViewInfo, getVisibleGraceNotesForMember, sortGraceNotesForMemberView, type GraceNoteViewKind } from '../../services/graceNoteShareScope';

/** 은혜기록 작성 화면 공통 제목·설명 */
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
} as const;

function GraceFormSaveButton({
  saved,
  disabled,
  onClick,
}: {
  saved: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors ${
        saved
          ? 'bg-green-500 text-white'
          : disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      {saved ? '저장됨 ✓' : '저장'}
    </button>
  );
}

function persistGraceNote(input: GraceNoteInput, editId: string | undefined, userId?: string): string {
  const payload = { ...input, userId: input.userId ?? userId };
  if (editId) {
    updateGraceNote(editId, payload);
    return editId;
  }
  return createGraceNote(payload, userId).id;
}

// ─── Reading Grace Form Context ───────────────────────────────────────────────

export type GraceFormCtx = {
  progressId: string;
  planId: string;
  planName: string;
  planColor: string;
  day: number;
  readingReferences: string;
  editId?: string;
};

// ─── Sermon Grace Form Context ────────────────────────────────────────────────

export type SermonGraceFormCtx = {
  sermonId?: string;
  sermonTitle?: string;
  sermonPreacher?: string;
  sermonDate?: string;
  bibleReference?: string;
  worshipType?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  editId?: string;
  /** 설교 페이지에서 연결된 경우 — 설교 정보 읽기 전용 */
  linkedFromSermon?: boolean;
};

// ─── Shared field row ─────────────────────────────────────────────────────────

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

// ─── Visibility helpers ───────────────────────────────────────────────────────

export function visibilityMeta(v: GraceNoteVisibility) {
  const opts = [
    { value: 'private' as const, label: '나만 보기', desc: '나만 볼 수 있어요', icon: <Lock className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-100' },
    { value: 'pastor' as const, label: '담당 교역자와 공유', desc: '선택한 교역자와 공유', icon: <Eye className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
    { value: 'group' as const, label: `${readOrgSettings().level1Label}/${readOrgSettings().departmentLabel} 공유`, desc: `선택한 ${readOrgSettings().level1Label}·${readOrgSettings().departmentLabel}와 공유`, icon: <Users className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50' },
    { value: 'public' as const, label: '전체 공개', desc: '교회 성도 모두에게 공개', icon: <Eye className="w-3.5 h-3.5" />, color: 'text-violet-600 bg-violet-50' },
  ];
  return opts.find(o => o.value === v) ?? opts[0];
}

function shareSummary(note: GraceNote): string | null {
  if (note.visibility === 'pastor') return formatSharedPastorLabel(note);
  if (note.visibility === 'group') return formatSharedGroupLabel(note);
  return null;
}

// ─── Reading Grace Form View ──────────────────────────────────────────────────

export function GraceNoteFormView({ ctx, onSave, onBack }: {
  ctx: GraceFormCtx;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const existing = ctx.editId ? getGraceNote(ctx.editId) : null;

  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [memorableVerse, setMemorableVerse] = useState(existing?.memorableVerse ?? '');
  const [application, setApplication] = useState(existing?.application ?? '');
  const [prayer, setPrayer] = useState(existing?.prayer ?? '');
  const [share, setShare] = useState<GraceNoteShareState>(() => defaultShareState(existing ?? undefined));
  const [saved, setSaved] = useState(false);
  const [readingRef, setReadingRef] = useState(existing?.bibleReference ?? ctx.readingReferences);
  const planColor = ctx.planId ? getPlanColor(ctx.planId as import('../../data/readingPlans').PlanId) : ctx.planColor;

  const handleSave = () => {
    if (!graceContent.trim()) return;
    const input: GraceNoteInput = {
      type: 'reading',
      authorName: existing?.authorName ?? user?.name,
      ...shareStateToInput(share),
      sourceId: ctx.progressId,
      sourceTitle: ctx.planName,
      planId: ctx.planId,
      planName: ctx.planName,
      planColor,
      day: ctx.day,
      bibleReference: readingRef,
      memorableVerse,
      graceContent,
      application,
      prayer,
    };
    try {
      const id = persistGraceNote(input, ctx.editId, user?.id);
      setSaved(true);
      setTimeout(() => { onSave(id); }, 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  };

  const hasContent = graceContent.trim().length > 0;
  const headerTitle = ctx.editId ? GRACE_FORM_HEADERS.reading.editTitle : GRACE_FORM_HEADERS.reading.title;
  const saveBtn = (
    <GraceFormSaveButton saved={saved} disabled={!hasContent || saved} onClick={handleSave} />
  );

  return (
    <ContentEditorLayout
      title={headerTitle}
      description={GRACE_FORM_HEADERS.reading.description}
      onBack={onBack}
      saveButton={saveBtn}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-5">
        <div className={`bg-gradient-to-br ${planColor} rounded-2xl p-4 text-white`}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 opacity-80" />
            <span className="font-bold">{ctx.planName}</span>
          </div>
          <p className="text-white/70 text-xs">{ctx.day}일차</p>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <BookMarked className="w-4 h-4 text-primary-500" /> 오늘 읽은 말씀
          </label>
          <input
            value={readingRef}
            onChange={e => setReadingRef(e.target.value)}
            placeholder="예: 창세기 12장"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50 font-semibold text-gray-800"
          />
        </div>

        <FieldBlock
          icon={<Heart className="w-4 h-4 text-rose-500" />}
          label="받은 은혜" required
          value={graceContent} onChange={setGraceContent}
          placeholder="하나님께서 오늘 말씀을 통해 주신 은혜를 적어보세요."
          rows={5}
        />
        <FieldBlock
          icon={<BookMarked className="w-4 h-4 text-primary-500" />}
          label="마음에 남은 말씀"
          value={memorableVerse} onChange={setMemorableVerse}
          placeholder="예: 창세기 1장 1절 - 태초에 하나님이 천지를 창조하시니라"
          rows={3}
        />
        <FieldBlock
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
          label="적용할 점"
          value={application} onChange={setApplication}
          placeholder="예: 하루의 시작을 말씀과 기도로 시작하겠습니다."
          rows={3}
        />
        <FieldBlock
          icon={<Sparkles className="w-4 h-4 text-violet-500" />}
          label="기도문"
          value={prayer} onChange={setPrayer}
          placeholder="예: 주님, 오늘도 말씀 안에서 하루를 시작하게 하소서."
          rows={3}
        />
        <GraceNoteShareSelector value={share} onChange={setShare} />
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

// ─── Sermon Grace Form View ───────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export function SermonGraceFormView({ ctx, onSave, onBack }: {
  ctx: SermonGraceFormCtx;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const existing = ctx.editId ? getGraceNote(ctx.editId) : null;
  const linked = ctx.linkedFromSermon && !ctx.editId;

  const [sermonTitle] = useState(existing?.sermonTitle ?? ctx.sermonTitle ?? '');
  const [sermonPreacher] = useState(existing?.sermonPreacher ?? ctx.sermonPreacher ?? '');
  const [sermonDate] = useState(existing?.sermonDate ?? ctx.sermonDate ?? new Date().toISOString().slice(0, 10));
  const [bibleRef] = useState(existing?.bibleReference ?? ctx.bibleReference ?? '');
  const [worshipType] = useState(existing?.worshipType ?? ctx.worshipType ?? '');
  const [graceTitle, setGraceTitle] = useState(existing?.graceTitle ?? '');
  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [memorableVerse, setMemorableVerse] = useState(existing?.memorableVerse ?? '');
  const [application, setApplication] = useState(existing?.application ?? '');
  const [prayer, setPrayer] = useState(existing?.prayer ?? '');
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false);
  const [share, setShare] = useState<GraceNoteShareState>(() => defaultShareState(existing ?? undefined));
  const [saved, setSaved] = useState(false);

  // 수동 입력 모드 (은혜기록 메뉴에서 직접 작성)
  const [editTitle, setEditTitle] = useState(sermonTitle);
  const [editPreacher, setEditPreacher] = useState(sermonPreacher);
  const [editDate, setEditDate] = useState(sermonDate);
  const [editBibleRef, setEditBibleRef] = useState(bibleRef);

  const finalTitle = linked ? sermonTitle : editTitle;
  const finalPreacher = linked ? sermonPreacher : editPreacher;
  const finalDate = linked ? sermonDate : editDate;
  const finalBibleRef = linked ? bibleRef : editBibleRef;

  const hasContent = graceContent.trim().length > 0;

  const handleSave = () => {
    if (!hasContent) return;
    const input: GraceNoteInput = {
      type: 'sermon',
      authorName: existing?.authorName ?? user?.name,
      ...shareStateToInput(share),
      sourceId: ctx.sermonId,
      sourceTitle: finalTitle,
      sermonTitle: finalTitle,
      sermonPreacher: finalPreacher,
      sermonDate: finalDate,
      bibleReference: finalBibleRef,
      worshipType: worshipType || ctx.worshipType,
      thumbnailUrl: ctx.thumbnailUrl,
      videoUrl: ctx.videoUrl,
      graceTitle: graceTitle.trim() || undefined,
      isFavorite,
      memorableVerse: linked ? '' : memorableVerse,
      graceContent,
      application: linked ? '' : application,
      prayer: linked ? '' : prayer,
    };
    try {
      const id = persistGraceNote(input, ctx.editId, user?.id);
      setSaved(true);
      setTimeout(() => { onSave(id); }, linked ? 400 : 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  };

  const headerTitle = ctx.editId ? GRACE_FORM_HEADERS.sermon.editTitle : GRACE_FORM_HEADERS.sermon.title;
  const saveBtn = (
    <GraceFormSaveButton saved={saved} disabled={!hasContent || saved} onClick={handleSave} />
  );

  return (
    <ContentEditorLayout
      title={headerTitle}
      description={GRACE_FORM_HEADERS.sermon.description}
      onBack={onBack}
      saveButton={saveBtn}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500">연결된 설교</p>
          {linked ? (
            <>
              {ctx.thumbnailUrl && (
                <img src={ctx.thumbnailUrl} alt="" className="w-full h-36 object-cover rounded-xl" />
              )}
              <ReadOnlyField label="설교 제목" value={sermonTitle} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadOnlyField label="설교자" value={sermonPreacher} />
                <ReadOnlyField label="예배 종류" value={worshipType} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadOnlyField label="설교 날짜" value={sermonDate?.replace(/-/g, '.')} />
                <ReadOnlyField label="성경 본문" value={bibleRef} />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">설교 제목</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">설교자</label>
                  <input value={editPreacher} onChange={e => setEditPreacher(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">날짜</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">성경 본문</label>
                <input value={editBibleRef} onChange={e => setEditBibleRef(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50" />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">은혜 제목 (선택)</label>
          <input
            value={graceTitle}
            onChange={e => setGraceTitle(e.target.value)}
            placeholder="예: 십자가의 사랑이 마음에 와닿았습니다"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-400"
          />
        </div>
        <FieldBlock
          icon={<Heart className="w-4 h-4 text-rose-500" />}
          label="은혜 내용" required
          value={graceContent} onChange={setGraceContent}
          placeholder="설교를 통해 하나님께서 주신 은혜를 적어보세요."
          rows={linked ? 8 : 5}
        />
        {!linked && (
          <>
            <FieldBlock icon={<BookMarked className="w-4 h-4 text-primary-500" />} label="마음에 남은 말씀"
              value={memorableVerse} onChange={setMemorableVerse} placeholder="마음에 남은 말씀을 적어보세요." rows={3} />
            <FieldBlock icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} label="결단 / 적용"
              value={application} onChange={setApplication} placeholder="삶에 적용할 내용을 적어보세요." rows={3} />
            <FieldBlock icon={<Sparkles className="w-4 h-4 text-violet-500" />} label="기도문"
              value={prayer} onChange={setPrayer} placeholder="기도의 마음을 적어보세요." rows={3} />
          </>
        )}
        <GraceNoteShareSelector value={share} onChange={setShare} />
        <label className="flex items-center gap-3 touch-target cursor-pointer py-2">
          <button type="button" onClick={() => setIsFavorite(v => !v)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors ${
              isFavorite ? 'border-amber-400 bg-amber-50 text-amber-500' : 'border-gray-200 text-gray-400'
            }`}>
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
          <span className="text-sm font-semibold text-gray-700">즐겨찾기에 추가</span>
        </label>
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

// ─── Personal (Free) Grace Form View ──────────────────────────────────────────

export function PersonalGraceFormView({ editId, onSave, onBack }: {
  editId?: string;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const existing = editId ? getGraceNote(editId) : null;

  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [memorableVerse, setMemorableVerse] = useState(existing?.memorableVerse ?? '');
  const [application, setApplication] = useState(existing?.application ?? '');
  const [prayer, setPrayer] = useState(existing?.prayer ?? '');
  const [share, setShare] = useState<GraceNoteShareState>(() => defaultShareState(existing ?? undefined));
  const [saved, setSaved] = useState(false);

  const hasContent = graceContent.trim().length > 0;

  const handleSave = () => {
    if (!hasContent) return;
    const input: GraceNoteInput = {
      type: 'personal',
      authorName: existing?.authorName ?? user?.name,
      ...shareStateToInput(share),
      memorableVerse,
      graceContent,
      application,
      prayer,
    };
    try {
      const id = persistGraceNote(input, editId, user?.id);
      setSaved(true);
      setTimeout(() => { onSave(id); }, 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  };

  const headerTitle = editId ? GRACE_FORM_HEADERS.personal.editTitle : GRACE_FORM_HEADERS.personal.title;
  const saveBtn = (
    <GraceFormSaveButton saved={saved} disabled={!hasContent || saved} onClick={handleSave} />
  );

  return (
    <ContentEditorLayout
      title={headerTitle}
      description={GRACE_FORM_HEADERS.personal.description}
      onBack={onBack}
      saveButton={saveBtn}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-5">
        <FieldBlock
          icon={<Heart className="w-4 h-4 text-rose-500" />}
          label="받은 은혜" required
          value={graceContent} onChange={setGraceContent}
          placeholder="하나님께서 주신 은혜와 감사한 마음을 적어보세요."
          rows={6}
        />
        <FieldBlock
          icon={<BookMarked className="w-4 h-4 text-primary-500" />}
          label="마음에 남은 말씀 (선택)"
          value={memorableVerse} onChange={setMemorableVerse}
          placeholder="떠오르는 성경 구절이 있다면 적어보세요."
          rows={3}
        />
        <FieldBlock
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
          label="적용할 점 (선택)"
          value={application} onChange={setApplication}
          placeholder="오늘 삶에 적용하고 싶은 한 가지를 적어보세요."
          rows={3}
        />
        <FieldBlock
          icon={<Sparkles className="w-4 h-4 text-violet-500" />}
          label="기도문 (선택)"
          value={prayer} onChange={setPrayer}
          placeholder="감사와 기도의 마음을 적어보세요."
          rows={3}
        />
        <GraceNoteShareSelector value={share} onChange={setShare} />
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

// ─── Grace Note List View (모아보기) ─────────────────────────────────────────

export function GraceNoteListView({ onBack, onDetail, onEdit, initialPlanId, initialType }: {
  onBack: () => void;
  onDetail: (id: string) => void;
  onEdit: (note: GraceNote) => void;
  initialPlanId?: string;
  initialType?: GraceNoteType;
}) {
  const { user } = useAuth();
  const orgLabels = readOrgSettings();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<GraceNoteType | ''>(initialType ?? '');
  const [planFilter, setPlanFilter] = useState(initialPlanId ?? '');
  type RelationFilter = '' | 'own' | 'pastor_author' | 'group_org' | 'group_dept' | 'public';
  const [relationFilter, setRelationFilter] = useState<RelationFilter>('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notes, setNotes] = useState(() => getAllGraceNotes());

  const accessible = useMemo(() => {
    return getVisibleGraceNotesForMember(notes, user);
  }, [notes, user]);

  const filtered = useMemo(() => {
    let list = accessible.filter(n => {
      if (typeFilter && n.type !== typeFilter) return false;
      if (planFilter && n.planId !== planFilter) return false;
      if (favoritesOnly && !n.isFavorite) return false;
      if (dateFrom && n.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && n.createdAt.slice(0, 10) > dateTo) return false;
      if (relationFilter) {
        const info = getGraceNoteViewInfo(n, user);
        if (!info) return false;
        if (relationFilter === 'own' && info.kind !== 'own') return false;
        if (relationFilter === 'pastor_author' && info.kind !== 'pastor_author') return false;
        if (relationFilter === 'group_org' && info.kind !== 'group_upper' && info.kind !== 'group_lower') return false;
        if (relationFilter === 'group_dept' && info.kind !== 'group_department') return false;
        if (relationFilter === 'public' && info.kind !== 'public') return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const searchable = [
          n.authorName, n.authorRole, n.planName, n.sermonTitle, n.sermonPreacher, n.bibleReference,
          n.graceContent, n.memorableVerse, n.application, n.prayer,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
    list = sortGraceNotesForMemberView(list, user, sortOrder);
    return list;
  }, [accessible, search, typeFilter, planFilter, relationFilter, favoritesOnly, dateFrom, dateTo, sortOrder, user]);

  const isOwn = (note: GraceNote) => Boolean(user?.id && note.userId === user.id);

  const handleDelete = (id: string) => {
    deleteGraceNote(id);
    setNotes(getAllGraceNotes());
    setDeleteId(null);
  };

  const typeLabel = (type: GraceNoteType) =>
    type === 'reading' ? '성경통독' : type === 'sermon' ? '설교' : '자유';
  const typeBadgeClass = (type: GraceNoteType) =>
    type === 'reading' ? 'bg-green-50 text-green-700' : type === 'sermon' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';

  const relationBadgeClass = (kind: GraceNoteViewKind) => {
    if (kind === 'own') return 'bg-primary-50 text-primary-700';
    if (kind === 'pastor_author') return 'bg-blue-50 text-blue-700';
    if (kind === 'public') return 'bg-violet-50 text-violet-700';
    return 'bg-emerald-50 text-emerald-700';
  };

  const relationTabs: { id: RelationFilter; label: string }[] = [
    { id: '', label: '전체' },
    { id: 'own', label: '내 기록' },
    { id: 'pastor_author', label: '담당 교역자' },
    { id: 'group_org', label: '조직 공유' },
    { id: 'group_dept', label: `${orgLabels.departmentLabel} 공유` },
    { id: 'public', label: '전체 공개' },
  ];

  return (
    <>
      {deleteId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">은혜기록을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}

      <MobileFullScreenPage
        title="은혜기록 모아보기"
        description="나와 관련된 은혜기록을 확인합니다."
        onBack={onBack}
        saveButton={
          <span className="text-xs text-gray-400 font-medium px-2 shrink-0">
            {filtered.length}개
          </span>
        }
      >
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="키워드, 말씀, 설교 검색"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 bg-gray-50"
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${showFilters ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {(['', 'reading', 'sermon', 'personal'] as const).map(t => (
                <button
                  key={t || 'all-type'}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    typeFilter === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t === '' ? '유형 전체' : typeLabel(t)}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {relationTabs.map(tab => (
                <button
                  key={tab.id || 'all-rel'}
                  type="button"
                  onClick={() => setRelationFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    relationFilter === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSortOrder(o => (o === 'newest' ? 'oldest' : 'newest'))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {sortOrder === 'newest' ? '최신순' : '오래된순'}
              </button>
              <button
                type="button"
                onClick={() => setFavoritesOnly(v => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${favoritesOnly ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                즐겨찾기
              </button>
            </div>

            {showFilters && (
              <div className="space-y-2 pt-1">
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50">
                  <option value="">전체 통독 플랜</option>
                  {READING_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-400">시작일</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400">종료일</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearch(''); setPlanFilter(''); setDateFrom(''); setDateTo('');
                    setTypeFilter(''); setRelationFilter(''); setFavoritesOnly(false); setSortOrder('newest');
                  }}
                  className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> 필터 초기화
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400">{filtered.length}개의 기록</p>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 text-sm">볼 수 있는 은혜기록이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">내 기록이나 공유받은 기록만 표시됩니다.</p>
            </div>
          ) : filtered.map(note => {
            const plan = note.planId ? READING_PLANS.find(p => p.id === note.planId) : undefined;
            const accentColor = plan?.color ?? 'from-primary-500 to-secondary-500';
            const viewInfo = getGraceNoteViewInfo(note, user);
            return (
              <div key={note.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${accentColor}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeBadgeClass(note.type)}`}>
                        {typeLabel(note.type)}
                      </span>
                      {viewInfo && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${relationBadgeClass(viewInfo.kind)}`}>
                          {viewInfo.badgeLabel}
                        </span>
                      )}
                      {note.authorName && (
                        <span className="text-[10px] text-gray-500">{note.authorName}</span>
                      )}
                      {note.type === 'reading' && note.planName && (
                        <span className="text-[10px] text-gray-600 font-medium">{note.planName}</span>
                      )}
                      {note.type === 'sermon' && note.sermonTitle && (
                        <span className="text-[10px] text-gray-600 font-medium">{note.sermonTitle}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {note.createdAt.slice(0, 10).replace(/-/g, '.')}
                    </span>
                  </div>

                  {note.type === 'reading' && note.bibleReference && (
                    <p className="text-sm font-semibold text-gray-800 mb-1">{note.bibleReference}</p>
                  )}
                  {note.type !== 'reading' && note.bibleReference && (
                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {note.bibleReference}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{note.graceContent}</p>

                  {(note.visibility !== 'private') && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{note.likeCount ?? 0}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{(note.comments ?? []).length}</span>
                      <span className="flex items-center gap-0.5"><HandHeart className="w-3 h-3" />{note.prayCount ?? 0}</span>
                    </div>
                  )}

                  {note.memorableVerse && (
                    <div className="mt-2 bg-primary-50 rounded-xl px-3 py-2 border-l-2 border-primary-300">
                      <p className="text-xs text-primary-700 font-medium line-clamp-1">
                        <BookMarked className="w-3 h-3 inline mr-1" />{note.memorableVerse}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <button type="button" onClick={() => onDetail(note.id)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 touch-target">
                      상세 보기
                    </button>
                    {isOwn(note) && (
                      <>
                        <button type="button" onClick={() => onEdit(note)}
                          className="px-3 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 touch-target"
                          aria-label="수정">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteId(note.id)}
                          className="px-3 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 touch-target"
                          aria-label="삭제">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </MobileFullScreenPage>
    </>
  );
}
// ─── Grace Note Detail View ───────────────────────────────────────────────────

export function GraceNoteDetailView({ noteId, onBack, onEdit, onDelete }: {
  noteId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const [note, setNote] = useState(() => getGraceNote(noteId));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(() => isGraceNoteLikedByMe(noteId));
  const [likeCount, setLikeCount] = useState(() => getGraceNote(noteId)?.likeCount ?? 0);
  const [prayCount, setPrayCount] = useState(() => getGraceNote(noteId)?.prayCount ?? 0);
  const [amenCount, setAmenCount] = useState(() => getGraceNote(noteId)?.amenCount ?? 0);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fresh = getGraceNote(noteId);
    if (fresh) {
      setNote(fresh);
      setLikeCount(fresh.likeCount ?? 0);
      setPrayCount(fresh.prayCount ?? 0);
      setAmenCount(fresh.amenCount ?? 0);
    }
  }, [noteId]);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-48">
        <p className="text-gray-400 text-sm">기록을 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-3 text-primary-500 text-sm font-medium">← 돌아가기</button>
      </div>
    );
  }

  const plan = note.planId ? READING_PLANS.find(p => p.id === note.planId) : undefined;
  const bannerGradient = note.type === 'sermon'
    ? 'from-secondary-500 to-primary-600'
    : note.type === 'personal'
      ? 'from-amber-400 to-orange-500'
      : (note.planColor ?? plan?.color ?? 'from-primary-500 to-primary-700');
  const isPublic = note.visibility !== 'private';
  const shareLabel = shareSummary(note);
  const authorName = user?.name ?? '성도';

  const refreshNote = () => {
    const fresh = getGraceNote(noteId);
    if (fresh) setNote(fresh);
  };

  const handleCopy = () => {
    const typeStr = note.type === 'reading'
      ? formatReadingLabel(note)
      : `[설교] ${note.sermonTitle ?? ''} · ${note.sermonPreacher ?? ''} (${note.bibleReference ?? ''})`;
    const text = [
      typeStr,
      note.createdAt.slice(0, 10),
      '',
      '받은 은혜', note.graceContent,
      note.memorableVerse ? `\n마음에 남은 말씀\n${note.memorableVerse}` : '',
      note.application ? `\n적용할 점\n${note.application}` : '',
      note.prayer ? `\n기도문\n${note.prayer}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDelete = () => {
    deleteGraceNote(noteId);
    setNote(null);
    onDelete();
  };

  const handleLike = () => {
    const result = toggleGraceNoteLike(noteId);
    setLiked(result.liked);
    setLikeCount(result.likeCount);
  };

  const handlePray = () => {
    setPrayCount(addGraceNotePrayer(noteId, authorName));
    refreshNote();
  };

  const handleAmen = () => {
    setAmenCount(addGraceNoteAmen(noteId, authorName));
    refreshNote();
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addGraceNoteComment(noteId, authorName, commentText);
    setCommentText('');
    refreshNote();
  };

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">은혜기록을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-sm">은혜기록</h2>
            <p className="text-xs text-gray-400">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${copied ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {copied ? '복사됨' : <><Copy className="w-3.5 h-3.5 inline mr-1" />복사</>}
            </button>
            <button onClick={onEdit} className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold hover:bg-primary-100">
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />수정
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 p-4 space-y-4">
          <div className={`bg-gradient-to-br ${bannerGradient} rounded-2xl p-4 text-white`}>
            {note.authorName && (
              <p className="text-white/80 text-xs mb-2">{note.authorName}{note.authorRole ? ` · ${note.authorRole}` : ''}</p>
            )}
            {note.type === 'reading' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 opacity-80" />
                  <span className="font-bold text-sm">{note.planName}</span>
                </div>
                <p className="text-white/90 text-sm font-medium">{note.bibleReference}</p>
                {note.day && <p className="text-white/60 text-xs mt-1">{note.day}일차</p>}
              </>
            ) : note.type === 'personal' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 opacity-80" />
                  <span className="font-bold text-sm">자유 은혜기록</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 opacity-80" />
                  <span className="font-bold text-sm">{note.sermonTitle ?? '설교 은혜기록'}</span>
                </div>
                <p className="text-white/70 text-xs">
                  {[note.sermonPreacher, note.bibleReference, note.sermonDate].filter(Boolean).join(' · ')}
                </p>
              </>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(() => {
                const vm = visibilityMeta(note.visibility ?? 'private');
                return (
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white/80 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {vm.icon} {vm.label}
                  </span>
                );
              })()}
              {shareLabel && (
                <span className="inline-flex items-center gap-1 bg-white/20 text-white/80 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {shareLabel}
                </span>
              )}
            </div>
          </div>

          <Section icon={<Heart className="w-3.5 h-3.5 text-rose-500" />} label="받은 은혜" text={note.graceContent} />
          {note.memorableVerse && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-primary-500" /> 마음에 남은 말씀
              </h3>
              <div className="bg-primary-50 rounded-xl px-4 py-3 border-l-4 border-primary-400">
                <p className="text-sm text-primary-800 leading-relaxed italic whitespace-pre-wrap">{note.memorableVerse}</p>
              </div>
            </div>
          )}
          {note.application && (
            <Section icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              label={note.type === 'sermon' ? '결단 / 적용' : '적용할 점'} text={note.application} />
          )}
          {note.prayer && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" /> 기도문
              </h3>
              <div className="bg-violet-50 rounded-xl px-4 py-3 border-l-4 border-violet-400">
                <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-wrap">{note.prayer}</p>
              </div>
            </div>
          )}

          {isPublic && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold touch-target ${
                    liked ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}>
                  <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                  좋아요 {likeCount}
                </button>
                <button
                  onClick={handlePray}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-100 touch-target">
                  <Sparkles className="w-4 h-4" />
                  기도합니다 {prayCount}
                </button>
                <button
                  onClick={handleAmen}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-100 touch-target">
                  <HandHeart className="w-4 h-4" />
                  아멘 {amenCount}
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> 댓글 {(note.comments ?? []).length}
                </h3>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {(note.comments ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">아직 댓글이 없습니다.</p>
                  ) : (note.comments ?? []).map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{c.authorName}</span>
                        <span className="text-[10px] text-gray-400">
                          {c.type === 'prayer' ? '기도' : c.type === 'amen' ? '아멘' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{c.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="댓글을 남겨보세요"
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50"
                    onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 touch-target">
                    등록
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon} {label}
      </h3>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ─── Plan Grace Notes Summary (used inside BibleReadingCenter DetailView) ─────

export function PlanGraceNotesSummary({ progressId, planName: _planName, planColor, onViewAll, onWrite, onViewNote }: {
  progressId: string;
  planName: string;
  planColor: string;
  onViewAll: () => void;
  onWrite: () => void;
  onViewNote: (id: string) => void;
}) {
  const notes = getGraceNotesByProgress(progressId).slice(0, 3);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-sm text-gray-900">은혜기록</span>
          {notes.length > 0 && (
            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-semibold">{notes.length}개</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <button
            onClick={onWrite}
            className={`w-full mt-3 py-3 bg-gradient-to-r ${planColor} text-white text-sm font-bold rounded-2xl hover:opacity-90 shadow-sm flex items-center justify-center gap-2`}>
            <Heart className="w-4 h-4" />
            오늘 받은 은혜 기록하기
          </button>

          {notes.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-4 pb-2">아직 기록된 은혜가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {notes.map(note => (
                <button key={note.id} onClick={() => onViewNote(note.id)}
                  className="w-full text-left bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">{note.day}일차</span>
                    <span className="text-[10px] text-gray-400">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{note.graceContent}</p>
                </button>
              ))}
              <button onClick={onViewAll} className="w-full py-2 text-xs text-primary-600 font-semibold hover:text-primary-700">
                전체 기록 보기 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
