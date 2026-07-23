/**
 * 은혜와 기도 공통 작성/수정 화면
 * 신규 작성: 상단 고정 탭(기도·설교·성경통독)으로 유형 전환
 * 수정: 유형 잠금 + 기존 필드 유지
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Mic, HandHeart } from 'lucide-react';
import {
  getGraceNote, createGraceNote, updateGraceNote, resolveAllowComments,
  type GraceNoteInput, type GraceNoteType,
} from '../../data/graceNotes';
import { getAllProgresses, getPlanColor, type PlanId } from '../../data/readingPlans';
import { GraceNoteShareSelector, defaultShareState, shareStateToInput, type GraceNoteShareState } from './GraceNoteShareSelector';
import { GraceRelatedSourceSelector } from './GraceRelatedSourceSelector';
import { ReadingProgressList, buildReadingFormCtx } from './ReadingProgressPicker';
import { CommentPermissionSetting } from './CommentPermissionSetting';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ui';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';
import { getEligiblePastorsForUser } from '../../services/graceNoteShareScope';
import { buildSharedPastorSnapshots } from '../../services/graceShareFilterHelpers';
import { GRACE_CONTENT_MAX_LENGTH, GRACE_MENU_LABEL, graceContentFieldLabel } from '../../services/graceNoteDisplay';
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
  /** 수정 중 변경사항이 있을 때 뒤로가기 확인 */
  confirmLeaveWhenDirty?: boolean;
};

const WRITE_TABS: { id: GraceNoteType; label: string }[] = [
  { id: 'prayer', label: '기도' },
  { id: 'sermon', label: '설교' },
  { id: 'reading', label: '성경통독' },
];

const TYPE_OPTIONS: {
  id: GraceNoteType;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { id: 'reading', label: '성경통독', icon: BookOpen },
  { id: 'sermon', label: '설교', icon: Mic },
  { id: 'prayer', label: '기도', icon: HandHeart },
];

const EDITOR_META: Record<GraceNoteType, {
  title: string;
  editTitle: string;
  description: string;
  titlePlaceholder: string;
  contentPlaceholder: string;
}> = {
  reading: {
    title: GRACE_MENU_LABEL,
    editTitle: '성경통독 수정',
    description: '성경통독을 통해 받은 은혜를 기록합니다.',
    titlePlaceholder: '제목을 입력하세요',
    contentPlaceholder: '받은 은혜와 삶의 적용을 기록해 주세요.',
  },
  sermon: {
    title: GRACE_MENU_LABEL,
    editTitle: '설교 수정',
    description: '설교를 통해 받은 은혜를 기록합니다.',
    titlePlaceholder: '제목을 입력하세요',
    contentPlaceholder: '받은 은혜와 삶의 적용을 기록해 주세요.',
  },
  prayer: {
    title: GRACE_MENU_LABEL,
    editTitle: '기도 수정',
    description: '기도를 작성합니다.',
    titlePlaceholder: '기도 제목을 입력하세요',
    contentPlaceholder: '기도하고 싶은 내용을 자연스럽게 작성해 주세요.',
  },
};

const TYPE_SWITCH_LABEL: Record<GraceNoteType, string> = {
  prayer: '기도',
  sermon: '설교',
  reading: '성경통독',
};

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

function emptyShare(): GraceNoteShareState {
  return defaultShareState(undefined);
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
  confirmLeaveWhenDirty = false,
}: GraceNoteEditorProps) {
  const { user } = useAuth();
  const toast = useToast();
  const existing = editId ? getGraceNote(editId) : null;
  const isCreate = !editId;
  const showWriteTabs = isCreate && !lockType;

  const [noteType, setNoteType] = useState<GraceNoteType>(
    existing?.type ?? initialType ?? 'prayer',
  );
  const [graceTitle, setGraceTitle] = useState(existing?.graceTitle ?? '');
  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [share, setShare] = useState<GraceNoteShareState>(() => defaultShareState(existing ?? undefined));
  const initialAllow = existing
    ? (existing.visibility === 'private' ? false : resolveAllowComments(existing))
    : true;
  const [allowComments, setAllowComments] = useState(initialAllow);
  const allowBeforePrivateRef = useRef(initialAllow || true);
  const [saved, setSaved] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [tabConfirm, setTabConfirm] = useState<GraceNoteType | null>(null);

  const [activeReadingCtx, setActiveReadingCtx] = useState<ReadingEditorCtx | null>(
    readingCtx ?? null,
  );

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

  const initialSnapshot = useRef({
    graceTitle: existing?.graceTitle ?? '',
    graceContent: existing?.graceContent ?? '',
    share: JSON.stringify(defaultShareState(existing ?? undefined)),
    allowComments: initialAllow,
    readingRef: existing?.bibleReference ?? readingCtx?.readingReferences ?? '',
    editSermonTitle: existing?.sermonTitle ?? sermonCtx?.sermonTitle ?? '',
    editPreacher: existing?.sermonPreacher ?? sermonCtx?.sermonPreacher ?? '',
    editSermonDate: existing?.sermonDate ?? sermonCtx?.sermonDate ?? new Date().toISOString().slice(0, 10),
    editBibleRef: existing?.bibleReference ?? sermonCtx?.bibleReference ?? '',
  });

  const isDirty = useMemo(() => {
    if (!confirmLeaveWhenDirty || !editId || saved) return false;
    const snap = initialSnapshot.current;
    return (
      graceTitle !== snap.graceTitle
      || graceContent !== snap.graceContent
      || JSON.stringify(share) !== snap.share
      || allowComments !== snap.allowComments
      || readingRef !== snap.readingRef
      || editSermonTitle !== snap.editSermonTitle
      || editPreacher !== snap.editPreacher
      || editSermonDate !== snap.editSermonDate
      || editBibleRef !== snap.editBibleRef
    );
  }, [
    confirmLeaveWhenDirty, editId, saved, graceTitle, graceContent, share, allowComments,
    readingRef, editSermonTitle, editPreacher, editSermonDate, editBibleRef,
  ]);

  const createDraftDirty = useMemo(() => {
    if (!isCreate || saved) return false;
    return (
      graceTitle.trim().length > 0
      || graceContent.trim().length > 0
      || readingRef.trim().length > 0
      || editSermonTitle.trim().length > 0
      || editPreacher.trim().length > 0
      || editBibleRef.trim().length > 0
      || JSON.stringify(share) !== JSON.stringify(emptyShare())
      || allowComments !== true
      || Boolean(activeReadingCtx)
    );
  }, [
    isCreate, saved, graceTitle, graceContent, readingRef,
    editSermonTitle, editPreacher, editBibleRef, share, allowComments, activeReadingCtx,
  ]);

  const handleBack = () => {
    if (isDirty) {
      setLeaveConfirm(true);
      return;
    }
    onBack();
  };

  useEffect(() => {
    if (initialType && !editId && lockType) setNoteType(initialType);
  }, [initialType, editId, lockType]);

  useEffect(() => {
    if (readingCtx) {
      setActiveReadingCtx(readingCtx);
      if (readingCtx.readingReferences) {
        setReadingRef(readingCtx.readingReferences);
      }
    }
  }, [readingCtx]);

  const resetFormForType = (next: GraceNoteType) => {
    setNoteType(next);
    setGraceTitle('');
    setGraceContent('');
    setShare(emptyShare());
    setAllowComments(true);
    allowBeforePrivateRef.current = true;
    setReadingRef('');
    setEditSermonTitle(sermonCtx?.sermonTitle ?? '');
    setEditPreacher(sermonCtx?.sermonPreacher ?? '');
    setEditSermonDate(sermonCtx?.sermonDate ?? new Date().toISOString().slice(0, 10));
    setEditBibleRef(sermonCtx?.bibleReference ?? '');
    setActiveReadingCtx(null);
    setSaved(false);
  };

  const requestTypeChange = (next: GraceNoteType) => {
    if (next === noteType) return;
    if (createDraftDirty) {
      setTabConfirm(next);
      return;
    }
    resetFormForType(next);
  };

  const confirmTypeChange = () => {
    if (!tabConfirm) return;
    resetFormForType(tabConfirm);
    setTabConfirm(null);
  };

  const readingProgresses = useMemo(
    () => getAllProgresses().filter(p => p.status === 'active' || p.status === 'paused'),
    [],
  );

  const needsReadingPick = noteType === 'reading' && isCreate && !activeReadingCtx && !existing?.sourceId;

  const buildInput = (): GraceNoteInput => {
    const shareFields = shareInputWithSnapshots(share, user, existing?.sharedPastorSnapshots);
    const legacyEmpty = { memorableVerse: '', application: '', prayer: '' };
    /** 수정 시 기존 값 보존 · 신규는 false (UI 없음) */
    const isFavorite = existing?.isFavorite ?? false;
    const ctx = activeReadingCtx;

    if (noteType === 'reading') {
      const planColor = ctx?.planColor
        ?? existing?.planColor
        ?? (existing?.planId ? getPlanColor(existing.planId as PlanId) : 'from-primary-500 to-primary-700');
      return {
        type: 'reading',
        authorName: existing?.authorName ?? user?.name,
        authorRole: existing?.authorRole ?? user?.position,
        ...shareFields,
        sourceId: ctx?.progressId ?? existing?.sourceId,
        sourceTitle: ctx?.planName ?? existing?.planName,
        planId: ctx?.planId ?? existing?.planId,
        planName: ctx?.planName ?? existing?.planName,
        planColor,
        day: ctx?.day ?? existing?.day,
        bibleReference: readingRef.trim() || existing?.bibleReference,
        graceTitle: graceTitle.trim(),
        graceContent: graceContent.trim(),
        ...legacyEmpty,
        isFavorite,
        allowComments: share.visibility === 'private' ? false : allowComments,
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
        allowComments: share.visibility === 'private' ? false : allowComments,
      };
    }

    return {
      type: 'prayer',
      authorName: existing?.authorName ?? user?.name,
      authorRole: existing?.authorRole ?? user?.position,
      ...shareFields,
      graceTitle: graceTitle.trim(),
      graceContent: graceContent.trim(),
      ...legacyEmpty,
      isFavorite,
      allowComments: share.visibility === 'private' ? false : allowComments,
    };
  };

  const meta = EDITOR_META[noteType];
  const contentLabel = graceContentFieldLabel(noteType);
  const headerTitle = editId ? meta.editTitle : meta.title;
  const headerDescription = meta.description;

  const handleSave = () => {
    if (needsReadingPick) {
      toast.error('관련 성경통독을 선택해 주세요.');
      return;
    }
    if (!graceTitle.trim()) {
      toast.error('제목을 입력해 주세요.');
      return;
    }
    if (!graceContent.trim()) {
      toast.error(`${contentLabel}을 입력해 주세요.`);
      return;
    }
    if (noteType === 'reading' && !activeReadingCtx && !existing?.sourceId) {
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

  const canSave =
    !needsReadingPick
    && graceTitle.trim().length > 0
    && graceContent.trim().length > 0
    && !saved;
  const saveLabel = editId ? '수정사항 저장' : '저장';

  const saveBtn = needsReadingPick ? undefined : (
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

  const writeTabs = showWriteTabs ? (
    <div className="flex items-center gap-2" role="tablist" aria-label="작성 유형">
      {WRITE_TABS.map(tab => {
        const active = noteType === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => requestTypeChange(tab.id)}
            className={`flex-1 h-11 min-h-[44px] rounded-[12px] text-sm font-semibold transition-colors touch-target ${
              active
                ? 'bg-primary-500 text-white border border-primary-500 shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 hover:text-primary-700'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  ) : undefined;

  const handlePickReadingInline = (progress: Parameters<typeof buildReadingFormCtx>[0]) => {
    const ctx = buildReadingFormCtx(progress);
    setActiveReadingCtx(ctx);
    setReadingRef(ctx.readingReferences ?? '');
  };

  const handleNeedReadingPick = () => {
    if (isCreate && showWriteTabs) {
      setActiveReadingCtx(null);
      setReadingRef('');
      return;
    }
    onNeedReadingPick?.();
  };

  return (
    <ContentEditorLayout
      title={headerTitle}
      description={headerDescription}
      onBack={handleBack}
      saveButton={saveBtn}
      mobileHeaderVariant="subpage"
      belowHeader={writeTabs}
    >
      {leaveConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">수정 중인 내용이 저장되지 않았습니다.</h3>
            <p className="text-sm text-gray-500 mb-5">나가시겠습니까?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLeaveConfirm(false)}
                className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-bold touch-target"
              >
                계속 수정
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveConfirm(false);
                  onBack();
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold touch-target"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {tabConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">
              {TYPE_SWITCH_LABEL[tabConfirm]} 작성으로 변경하시겠습니까?
            </h3>
            <p className="text-sm text-gray-500 mb-5">작성 중인 내용은 저장되지 않습니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTabConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold touch-target"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmTypeChange}
                className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-bold touch-target"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {needsReadingPick ? (
        <ContentFormCard>
          <p className="text-sm font-bold text-gray-800 mb-3">진행 중인 성경통독</p>
          <ReadingProgressList
            progresses={readingProgresses}
            onSelect={handlePickReadingInline}
          />
        </ContentFormCard>
      ) : (
        <ContentFormCard className="space-y-5">
          {/* 기록유형 — 수정 시에만 읽기 전용 표시 */}
          {editId && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-3">기록유형</p>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(opt => {
                  const active = noteType === opt.id;
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.id}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border-2 ${
                        active
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 bg-gray-50 text-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="text-sm font-bold text-gray-800 mb-2 block">
              제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={graceTitle}
              onChange={e => setGraceTitle(e.target.value)}
              placeholder={meta.titlePlaceholder}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          {/* 은혜/기도 내용 */}
          <div>
            <label className="text-sm font-bold text-gray-800 mb-2 block">
              {contentLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={graceContent}
              onChange={e => setGraceContent(e.target.value.slice(0, GRACE_CONTENT_MAX_LENGTH))}
              placeholder={meta.contentPlaceholder}
              rows={6}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:border-primary-400 resize-none placeholder-gray-300"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {graceContent.length} / {GRACE_CONTENT_MAX_LENGTH}
            </p>
          </div>

          {/* 관련 기록 (기도 유형은 표시하지 않음) */}
          {noteType !== 'prayer' && (
            <GraceRelatedSourceSelector
              noteType={noteType}
              existing={existing}
              readingCtx={activeReadingCtx}
              readingRef={readingRef}
              onReadingRefChange={setReadingRef}
              onPickReading={handleNeedReadingPick}
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

          {/* 공개범위 */}
          <GraceNoteShareSelector
            value={share}
            onChange={next => {
              const wasPrivate = share.visibility === 'private';
              const nowPrivate = next.visibility === 'private';
              if (!wasPrivate && nowPrivate) {
                allowBeforePrivateRef.current = allowComments;
                setAllowComments(false);
              } else if (wasPrivate && !nowPrivate) {
                setAllowComments(allowBeforePrivateRef.current);
              }
              setShare(next);
            }}
            existingPastorSnapshots={existing?.sharedPastorSnapshots}
          />

          {/* 댓글 설정 */}
          <CommentPermissionSetting
            visibility={share.visibility}
            allowComments={allowComments}
            onChange={next => {
              setAllowComments(next);
              if (share.visibility !== 'private') {
                allowBeforePrivateRef.current = next;
              }
            }}
          />
        </ContentFormCard>
      )}
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

export function PrayerGraceFormView({
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
      initialType="prayer"
      lockType
    />
  );
}

/** @deprecated PrayerGraceFormView 사용 */
export const PersonalGraceFormView = PrayerGraceFormView;

export const GRACE_FORM_HEADERS = {
  reading: {
    title: GRACE_MENU_LABEL,
    editTitle: '성경통독 수정',
    description: '성경통독을 통해 받은 은혜를 기록합니다.',
  },
  sermon: {
    title: GRACE_MENU_LABEL,
    editTitle: '설교 수정',
    description: '설교를 통해 받은 은혜를 기록합니다.',
  },
  prayer: {
    title: GRACE_MENU_LABEL,
    editTitle: '기도 수정',
    description: '기도를 작성합니다.',
  },
  write: {
    title: GRACE_MENU_LABEL,
    editTitle: `${GRACE_MENU_LABEL} 수정`,
    description: '하나님의 은혜와 기도를 기록하고 함께 나눕니다.',
  },
} as const;
