/**
 * 은혜기록 관련 화면 컴포넌트
 * - GraceNoteListView     : 모아보기 (검색·필터)
 * - GraceNoteDetailView   : 상세 보기
 * - PlanGraceNotesSummary : 통독 계획 내 은혜기록 요약 (BibleReadingCenter에서 사용)
 *
 * 작성 화면은 GraceNoteEditor.tsx 로 통합됨
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Heart, BookOpen, Edit3, Trash2,
  ChevronDown,
  Mic, Lock, Users, Eye, MessageCircle, MessageCircleOff, Plus,
} from 'lucide-react';
import {
  getAllGraceNotes, getGraceNote, getGraceNotesByProgress,
  deleteGraceNote,
  toggleGraceNoteLike, addGraceNoteComment,
  deleteGraceNoteComment, resolveAllowComments, GRACE_COMMENT_MAX_LENGTH,
  isGraceNoteLikedByMe,
  type GraceNote, type GraceNoteType, type GraceNoteVisibility,
} from '../../data/graceNotes';
import { formatSharedPastorLabel, formatSharedGroupLabel } from '../../data/graceNoteSeed';
import { useAuth } from '../../contexts/AuthContext';
import { readOrgSettings } from '../../contexts/OrgSettingsContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { MobileFab, PageHeaderBar } from '../common/ui';
import { sermonPrimaryBtnClass } from '../common/sermon/sermonDesign';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import {
  getGraceNoteViewInfo,
  getGraceNotesForCollectTab,
  getGraceListBadge,
  sortGraceNotesForMemberView,
  matchesAuthorOrganizationFilter,
  UNASSIGNED_AUTHOR_ORG_ID,
  GRACE_COLLECTION_UI_TABS,
  type GraceCollectTab,
} from '../../services/graceNoteShareScope';
import {
  matchesShareTypeFilter,
  matchesOrganizationFilterForRecord,
} from '../../services/sharedContentAccess';
import type { ReceivedShareType, VisibilityFilter } from '../../types/sharedContent';
import { migrateVisibility, VISIBILITY_LABELS } from '../../types/sharedContent';
import {
  getGraceShareTypeFilterLabel,
  getGraceShareTypeFilterOptions,
} from '../../services/graceShareTypeFilterLabels';
import {
  buildSharedContentUserTitle,
  getDefaultReceivedShareType,
  normalizeReceivedShareType,
  normalizeShareTypeForUser,
} from '../../services/sharedContentShareTypeFilterLabels';
import {
  buildAuthorOrganizationGroups,
  buildAuthorsWithOrganizationIds,
  filterAuthorsBySelectedOrganizations,
  pruneSelectedAuthorIds,
} from '../../services/graceShareAuthorOrgGroups';
import {
  SharedContentSegmentButtons,
  SharedContentListToolbar,
  SharedContentDetailSettingsPage,
  SharedContentVisibilityFilterSection,
  SharedContentShareTypeFilterSection,
  SharedContentAuthorRoleFilterSection,
  SharedContentAuthorSelector,
  AuthorOrgFilterSelector,
  PeriodFilterSection,
} from '../common/shared-content';
import {
  EMPTY_PERIOD_FILTER,
  isPeriodActive,
  isRecordWithinPeriod,
  periodFilterChipLabel,
  validatePeriodFilter,
  type PeriodFilter,
} from '../../services/periodFilter';
import { UserOrganizationTreeSelector } from '../common/shared-content/UserOrganizationTreeSelector';
import { PastorOrgFilterSelector } from '../common/shared-content/PastorOrgFilterSelector';
import { PastorFlatFilterSelector } from '../common/shared-content/PastorFlatFilterSelector';
import {
  getOrganizationPathLabel,
  getUserCoreOrganizationIds,
  resolveOrgTreeMode,
} from '../../services/userOrganizationTree';
import { isSuperAdmin } from '../../services/permissions';
import {
  formatGraceNoteAuthorLine,
  resolveGraceNoteAuthorDisplay,
} from '../../services/graceNoteAuthorDisplay';
import { GracePrayerCommentItem } from './CommentAuthorMeta';
import { resolveCommentAuthorId } from '../../services/graceCommentAuthorMeta';
import {
  buildGraceSharedAuthorPool,
  buildGraceSharedListDescription,
  classifyGraceNoteAuthorRole,
  getGraceAuthorRoleHint,
  isPastoralGraceAuthorRole,
} from '../../services/graceShareAuthorPool';
import {
  getGraceNoteListTitle,
  graceRecordTypeLabel,
  graceShareBadgeClass,
  graceTypeBadgeClass,
  GRACE_MENU_LABEL,
  graceContentFieldLabel,
} from '../../services/graceNoteDisplay';
import {
  getPastorFilterGroupsForMine,
  getFilterPastorsForUser,
  getSharedPastorDetailEntries,
  matchesSharedPastorFilter,
  pastorLabel,
} from '../../services/graceShareFilterHelpers';
import { GraceNoteListRow } from './GraceNoteListRow';
import { GraceRelatedSourceDetail } from './GraceRelatedSourceDetail';

export {
  GraceNoteEditor,
  GraceNoteFormView,
  SermonGraceFormView,
  PersonalGraceFormView,
  GRACE_FORM_HEADERS,
  type GraceFormCtx,
  type SermonGraceFormCtx,
  type ReadingEditorCtx,
  type SermonEditorCtx,
  type GraceNoteEditorProps,
} from './GraceNoteEditor';

// ─── Visibility helpers ───────────────────────────────────────────────────────

export function visibilityMeta(v: GraceNoteVisibility, sharedGroupAll?: boolean) {
  if (v === 'organization_share' && sharedGroupAll) {
    return {
      value: 'organization_share' as const,
      label: '전체 공개',
      desc: '교회 성도 모두에게 공개',
      icon: <Eye className="w-3.5 h-3.5" />,
      color: 'text-violet-600 bg-violet-50',
    };
  }
  const opts = [
    { value: 'private' as const, label: '나만 보기', desc: '나만 볼 수 있어요', icon: <Lock className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-100' },
    { value: 'pastor_share' as const, label: '담당 교역자와 공유', desc: '선택한 교역자와 공유', icon: <Eye className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
    { value: 'organization_share' as const, label: `${readOrgSettings().level1Label}/${readOrgSettings().departmentLabel} 공유`, desc: `선택한 ${readOrgSettings().level1Label}·${readOrgSettings().departmentLabel}와 공유`, icon: <Users className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50' },
  ];
  return opts.find(o => o.value === v) ?? opts[0];
}

function shareSummary(note: GraceNote): string | null {
  if (note.visibility === 'pastor_share') return formatSharedPastorLabel(note);
  if (note.visibility === 'organization_share') return formatSharedGroupLabel(note);
  return null;
}

const GRACE_RECORD_TYPE_OPTIONS = [
  { id: '' as const, label: '전체' },
  { id: 'prayer' as const, label: '기도' },
  { id: 'sermon' as const, label: '설교' },
  { id: 'reading' as const, label: '성경통독' },
] as const;

function GraceRecordTypeFilterButtons({
  value,
  onChange,
}: {
  value: GraceNoteType | '';
  onChange: (next: GraceNoteType | '') => void;
}) {
  return (
    <SharedContentSegmentButtons
      title="기록유형"
      options={GRACE_RECORD_TYPE_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}

// ─── Grace Note List View (모아보기) ─────────────────────────────────────────

type GraceListFilterState = {
  typeFilter: GraceNoteType | '';
  visibilityFilter: VisibilityFilter;
  shareType: ReceivedShareType;
  organizationIds: string[];
  selectedPastorIds: string[];
  /** 교역자 pastor_share — 작성자 소속 조직 */
  selectedAuthorOrganizationIds: string[];
  selectedAuthorIds: string[];
  authorRole: 'all' | 'member' | 'pastor';
  authorQuery: string;
  period: PeriodFilter;
};

function createEmptyFilter(
  user: { role?: string } | null | undefined,
  typeFilter: GraceNoteType | '' = '',
): GraceListFilterState {
  return {
    typeFilter,
    visibilityFilter: 'all',
    shareType: getDefaultReceivedShareType(
      user?.role === 'super_admin' || user?.role === 'pastor' || user?.role === 'member'
        ? user.role
        : null,
    ),
    organizationIds: [],
    selectedPastorIds: [],
    selectedAuthorOrganizationIds: [],
    selectedAuthorIds: [],
    authorRole: 'all',
    authorQuery: '',
    period: { ...EMPTY_PERIOD_FILTER },
  };
}

function hasSharedTabSecondaryFilters(applied: GraceListFilterState): boolean {
  return (
    applied.organizationIds.length > 0 ||
    applied.selectedPastorIds.length > 0 ||
    applied.selectedAuthorOrganizationIds.length > 0 ||
    applied.selectedAuthorIds.length > 0 ||
    applied.authorRole !== 'all' ||
    applied.authorQuery.trim() !== '' ||
    isPeriodActive(applied.period)
  );
}

function hasNonPeriodDetailFilters(applied: GraceListFilterState, tab: GraceCollectTab): boolean {
  if (applied.typeFilter) return true;
  if (tab === 'mine' && applied.visibilityFilter !== 'all') return true;
  // 공유유형은 항상 선택되어 있으므로 "추가 조건"으로만 세부 필터를 본다
  if (tab === 'shared' && hasSharedTabSecondaryFilters(applied)) return true;
  if (tab === 'mine' && (
    applied.organizationIds.length > 0
    || applied.selectedPastorIds.length > 0
  )) return true;
  return false;
}

function deriveGraceListShowFlags(
  f: GraceListFilterState,
  tab: GraceCollectTab,
  isAdminUser: boolean,
  isPastorUser: boolean,
  isMemberUser: boolean,
) {
  const showMineOrgTree =
    tab === 'mine' &&
    f.visibilityFilter === 'organization_share';

  /** 교구/부서 공유에만 작성자·공유 조직 트리 표시 (담당 교역자 공유는 제외) */
  const showSharedOrgTree =
    tab === 'shared' && f.shareType === 'organization_share';

  const showOrgTree = showMineOrgTree || showSharedOrgTree;

  const showPastorPicker =
    (tab === 'mine' && f.visibilityFilter === 'pastor_share') ||
    (tab === 'shared' && isAdminUser && f.shareType === 'pastor_share');

  /** 교역자: 본인에게 직접 공유한 작성자를 조직별로 선택 */
  const showAuthorOrgPicker =
    tab === 'shared'
    && isPastorUser
    && f.shareType === 'pastor_share';

  const orgTreeDefaultScope =
    isAdminUser &&
    ((tab === 'mine' && f.visibilityFilter === 'organization_share') ||
      (tab === 'shared' && f.shareType === 'organization_share'))
      ? 'all' as const
      : 'mine' as const;

  const orgTreeSectionTitle =
    tab === 'mine'
      ? '공유 조직'
      : f.shareType === 'pastor_share'
        ? '작성자 소속 조직'
        : '공유 조직';

  return {
    showMineOrgTree,
    showSharedOrgTree,
    showOrgTree,
    showPastorPicker,
    showAuthorOrgPicker,
    orgTreeDefaultScope,
    orgTreeSectionTitle,
  };
}

/** 탭별 상세설정·검색 적용 (페이지네이션 전 전체 결과) */
function filterGraceNotesForTab(
  tabNotes: GraceNote[],
  tab: GraceCollectTab,
  applied: GraceListFilterState,
  search: string,
  opts: {
    planFilter: string;
    isAdminUser: boolean;
    isPastorUser: boolean;
    isMemberUser: boolean;
    user: { id?: string } | null;
  },
): GraceNote[] {
  const {
    typeFilter,
    visibilityFilter,
    shareType,
    organizationIds,
    selectedPastorIds,
    selectedAuthorOrganizationIds,
    selectedAuthorIds,
    authorRole,
    authorQuery,
  } = applied;
  const authorOrgIds = selectedAuthorOrganizationIds ?? [];
  const flags = deriveGraceListShowFlags(
    applied,
    tab,
    opts.isAdminUser,
    opts.isPastorUser,
    opts.isMemberUser,
  );
  const showShareTypeFilter = tab === 'shared';

  let list = tabNotes.filter(n => {
    if (tab === 'mine') {
      if (typeFilter && n.type !== typeFilter) return false;
      if (visibilityFilter !== 'all' && migrateVisibility(n.visibility) !== visibilityFilter) {
        return false;
      }
      if (visibilityFilter === 'pastor_share' && selectedPastorIds.length > 0) {
        if (!matchesSharedPastorFilter(n, selectedPastorIds)) return false;
      }
      if (visibilityFilter === 'organization_share' && organizationIds.length > 0) {
        if (!matchesOrganizationFilterForRecord(n, organizationIds)) return false;
      }
    }

    if (tab === 'shared') {
      if (typeFilter && n.type !== typeFilter) return false;
      const shareTypeNorm = normalizeReceivedShareType(shareType, opts.user ?? null);
      if (showShareTypeFilter && !matchesShareTypeFilter(n, shareTypeNorm)) return false;

      if (flags.showOrgTree && organizationIds.length > 0 && shareTypeNorm === 'organization_share') {
        if (!matchesOrganizationFilterForRecord(n, organizationIds)) return false;
      }

      if (flags.showPastorPicker && selectedPastorIds.length > 0) {
        if (!matchesSharedPastorFilter(n, selectedPastorIds)) return false;
      }

      if (flags.showAuthorOrgPicker && authorOrgIds.length > 0) {
        if (!matchesAuthorOrganizationFilter(n, authorOrgIds)) return false;
      }

      if ((opts.isPastorUser || opts.isAdminUser) && authorRole !== 'all') {
        const role = classifyGraceNoteAuthorRole(n);
        const isPastoral = role === 'pastor' || role === 'admin' || isPastoralGraceAuthorRole(n.authorRole);
        if (authorRole === 'member' && isPastoral) return false;
        if (authorRole === 'pastor' && !isPastoral) return false;
      }

      if ((opts.isPastorUser || opts.isAdminUser) && selectedAuthorIds.length > 0) {
        const authorId = n.userId?.trim();
        if (!authorId || !selectedAuthorIds.includes(authorId)) return false;
      }

      if ((opts.isPastorUser || opts.isAdminUser) && authorQuery.trim()) {
        const authorLabel = resolveGraceNoteAuthorDisplay(n).label.toLowerCase();
        if (!authorLabel.includes(authorQuery.trim().toLowerCase())) {
          return false;
        }
      }
    }

    if (opts.planFilter && n.planId !== opts.planFilter) return false;
    if (!isRecordWithinPeriod(n.createdAt, applied.period)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const authorLabel = resolveGraceNoteAuthorDisplay(n).label;
      const searchable = [
        authorLabel, n.graceTitle, n.planName, n.sermonTitle,
        n.sermonPreacher, n.bibleReference, n.graceContent, n.memorableVerse,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  return sortGraceNotesForMemberView(list, opts.user, 'newest');
}

function cloneFilter(f: GraceListFilterState): GraceListFilterState {
  return {
    ...f,
    organizationIds: [...f.organizationIds],
    selectedPastorIds: [...f.selectedPastorIds],
    selectedAuthorOrganizationIds: [...(f.selectedAuthorOrganizationIds ?? [])],
    selectedAuthorIds: [...f.selectedAuthorIds],
    period: { ...f.period },
  };
}

export function GraceNoteListView({ onBack, onWrite, onDetail, onEdit, initialPlanId, initialType, isRootPage, resetToMineSignal }: {
  onBack: () => void;
  onWrite?: () => void;
  onDetail: (id: string) => void;
  onEdit: (note: GraceNote) => void;
  initialPlanId?: string;
  initialType?: GraceNoteType;
  /** 은혜기록 메뉴 루트 — 설교 페이지와 동일한 PageHeaderBar 레이아웃 */
  isRootPage?: boolean;
  /** 작성 완료 등 — 내 기록 화면으로 복귀 */
  resetToMineSignal?: number;
}) {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState<GraceCollectTab>('mine');
  const [collectionView, setCollectionView] = useState<'list' | 'filter'>('list');
  const [appliedByTab, setAppliedByTab] = useState<Record<GraceCollectTab, GraceListFilterState>>(() => ({
    mine: cloneFilter(createEmptyFilter(null, initialType ?? '')),
    shared: cloneFilter(createEmptyFilter(null)),
  }));
  const [searchByTab, setSearchByTab] = useState<Record<GraceCollectTab, string>>({
    mine: '',
    shared: '',
  });
  const [draft, setDraft] = useState<GraceListFilterState>(() =>
    cloneFilter(createEmptyFilter(null, initialType ?? '')),
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notes, setNotes] = useState(() => getAllGraceNotes());
  const [periodError, setPeriodError] = useState<string | null>(null);

  const applied = appliedByTab[tab];
  const search = searchByTab[tab];

  const setApplied = useCallback((
    updater: GraceListFilterState | ((prev: GraceListFilterState) => GraceListFilterState),
  ) => {
    setAppliedByTab(prev => {
      const current = prev[tab];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [tab]: next };
    });
  }, [tab]);

  const setSearch = useCallback((value: string) => {
    setSearchByTab(prev => ({ ...prev, [tab]: value }));
  }, [tab]);

  const planFilter = initialPlanId ?? '';
  const isAdminUser = isSuperAdmin(user);
  const isPastorUser = user?.role === 'pastor' && !isAdminUser;
  const isMemberUser = !isAdminUser && !isPastorUser;

  const filterOpts = useMemo(() => ({
    planFilter,
    isAdminUser,
    isPastorUser,
    isMemberUser,
    user,
  }), [planFilter, isAdminUser, isPastorUser, isMemberUser, user]);

  const mineNotes = useMemo(
    () => getGraceNotesForCollectTab(notes, user, 'mine'),
    [notes, user],
  );
  const sharedNotes = useMemo(
    () => getGraceNotesForCollectTab(notes, user, 'shared'),
    [notes, user],
  );

  const showShareTypeFilter = tab === 'shared';
  const draftFlags = deriveGraceListShowFlags(draft, tab, isAdminUser, isPastorUser, isMemberUser);
  const appliedFlags = deriveGraceListShowFlags(applied, tab, isAdminUser, isPastorUser, isMemberUser);

  const coreOrgIds = useMemo(() => getUserCoreOrganizationIds(user), [user]);
  const orgTreeMode = useMemo(() => resolveOrgTreeMode(user), [user]);

  const minePastorShareNotes = useMemo(() => {
    if (!user?.id) return [];
    return notes.filter(
      n =>
        n.userId === user.id &&
        migrateVisibility(n.visibility) === 'pastor_share',
    );
  }, [notes, user?.id]);

  const pastorFilterGroups = useMemo(
    () => getPastorFilterGroupsForMine(user, minePastorShareNotes),
    [user, minePastorShareNotes],
  );

  /** 공유받은 · 담당 교역자 공유 — 조직 트리 없이 전체 교역자 목록 사용 */
  const pastorFilterOrgScope = (f: GraceListFilterState) =>
    tab === 'shared' && f.shareType === 'pastor_share' ? [] : f.organizationIds;

  const draftPastorFilterData = useMemo(
    () => getFilterPastorsForUser(user, pastorFilterOrgScope(draft)),
    [user, draft, tab],
  );
  const appliedPastorFilterData = useMemo(
    () => getFilterPastorsForUser(user, pastorFilterOrgScope(applied)),
    [user, applied, tab],
  );

  const pastorLookupFlat = useMemo(() => {
    const map = new Map<string, { id: string; name: string; position: string }>();
    for (const p of [...pastorFilterGroups.current, ...pastorFilterGroups.historical]) {
      map.set(p.id, { id: p.id, name: p.name, position: p.position ?? '' });
    }
    for (const p of appliedPastorFilterData.flat) {
      map.set(p.id, p);
    }
    return map;
  }, [pastorFilterGroups, appliedPastorFilterData.flat]);

  /** 성도: 담당 교역자 공유 필터 숨김 */
  const hidePastorShareTypeOption = isMemberUser;

  const shareTypeFilterOptions = useMemo(
    () => getGraceShareTypeFilterOptions(user, { includePastorShare: !hidePastorShareTypeOption }),
    [user, hidePastorShareTypeOption],
  );

  const shareTypeChipVariant = isMobile ? 'chip' as const : 'full' as const;

  useEffect(() => {
    if (hidePastorShareTypeOption && draft.shareType === 'pastor_share') {
      setDraft(prev => ({
        ...prev,
        shareType: 'organization_share',
        selectedPastorIds: [],
        selectedAuthorOrganizationIds: [],
        selectedAuthorIds: [],
      }));
    }
  }, [hidePastorShareTypeOption, draft.shareType]);

  useEffect(() => {
    if (!draftFlags.showOrgTree && draft.organizationIds.length > 0) {
      setDraft(prev => ({ ...prev, organizationIds: [] }));
    }
  }, [draftFlags.showOrgTree, draft.organizationIds.length]);

  useEffect(() => {
    if (!draftFlags.showPastorPicker && draft.selectedPastorIds.length > 0) {
      setDraft(prev => ({ ...prev, selectedPastorIds: [], selectedAuthorIds: [] }));
    }
  }, [draftFlags.showPastorPicker, draft.selectedPastorIds.length]);

  useEffect(() => {
    if (!draftFlags.showAuthorOrgPicker && draft.selectedAuthorOrganizationIds.length > 0) {
      setDraft(prev => ({ ...prev, selectedAuthorOrganizationIds: [] }));
    }
  }, [draftFlags.showAuthorOrgPicker, draft.selectedAuthorOrganizationIds.length]);

  const draftAuthorPool = useMemo(
    () => buildGraceSharedAuthorPool(sharedNotes, {
      typeFilter: draft.typeFilter,
      shareType: draft.shareType,
      organizationIds: draft.organizationIds,
      selectedPastorIds: draft.selectedPastorIds,
      showPastorPicker: draftFlags.showPastorPicker,
      showOrgTree: draftFlags.showSharedOrgTree,
    }),
    [sharedNotes, draft, draftFlags.showPastorPicker, draftFlags.showSharedOrgTree],
  );

  const draftAuthorOrgGroups = useMemo(() => {
    if (!draftFlags.showAuthorOrgPicker) return [];
    const authors = buildAuthorsWithOrganizationIds(
      sharedNotes,
      {
        typeFilter: draft.typeFilter,
        shareType: draft.shareType,
        organizationIds: [],
        selectedPastorIds: [],
        showPastorPicker: false,
        showOrgTree: false,
      },
      draft.authorRole,
    );
    return buildAuthorOrganizationGroups(authors);
  }, [
    draftFlags.showAuthorOrgPicker,
    sharedNotes,
    draft.typeFilter,
    draft.shareType,
    draft.authorRole,
  ]);

  const authorRoleHint = useMemo(
    () => getGraceAuthorRoleHint({
      authorRole: draft.authorRole,
      shareType: draft.shareType,
      isAdmin: isAdminUser,
      isPastor: isPastorUser,
      userTitle: user ? buildSharedContentUserTitle(user) : undefined,
    }),
    [draft.authorRole, draft.shareType, isAdminUser, isPastorUser, user],
  );

  /** 역할 전환 시 all / pastor_share 등 잘못된 선택값 정규화 */
  useEffect(() => {
    if (!user) return;
    setDraft(prev => {
      const nextShare = normalizeReceivedShareType(prev.shareType, user);
      if (nextShare === prev.shareType && !(isMemberUser && prev.selectedPastorIds.length > 0)) {
        return prev;
      }
      return {
        ...prev,
        shareType: nextShare,
        selectedPastorIds: isMemberUser ? [] : prev.selectedPastorIds,
        selectedAuthorIds: nextShare === prev.shareType ? prev.selectedAuthorIds : [],
      };
    });
    setAppliedByTab(prev => {
      let changed = false;
      const next = { ...prev };
      for (const key of ['mine', 'shared'] as const) {
        const f = prev[key];
        const nextShare = normalizeReceivedShareType(f.shareType, user);
        const clearPastors = isMemberUser && f.selectedPastorIds.length > 0;
        if (nextShare !== f.shareType || clearPastors) {
          changed = true;
          next[key] = {
            ...f,
            shareType: nextShare,
            selectedPastorIds: isMemberUser ? [] : f.selectedPastorIds,
            selectedAuthorIds: nextShare === f.shareType ? f.selectedAuthorIds : [],
          };
        }
      }
      return changed ? next : prev;
    });
  }, [user?.id, user?.role, isMemberUser]);

  const openFilter = () => {
    setDraft(cloneFilter(applied));
    setPeriodError(null);
    setCollectionView('filter');
  };

  const applyFilter = () => {
    const err = validatePeriodFilter(draft.period);
    if (err) {
      setPeriodError(err);
      return;
    }
    setPeriodError(null);
    setApplied(cloneFilter(draft));
    setCollectionView('list');
  };

  const handleDraftVisibilityChange = (next: VisibilityFilter) => {
    setDraft(prev => ({
      ...prev,
      visibilityFilter: next,
      organizationIds: [],
      selectedPastorIds: [],
    }));
  };

  const handleDraftShareTypeChange = (next: ReceivedShareType) => {
    const normalized = normalizeReceivedShareType(next, user);
    setDraft(prev => ({
      ...prev,
      shareType: normalized,
      organizationIds: [],
      selectedPastorIds: [],
      selectedAuthorOrganizationIds: [],
      selectedAuthorIds: [],
      ...(normalized !== 'pastor_share' ? { authorRole: 'all' as const } : {}),
    }));
  };

  const filteredMine = useMemo(
    () => filterGraceNotesForTab(mineNotes, 'mine', appliedByTab.mine, searchByTab.mine, filterOpts),
    [mineNotes, appliedByTab.mine, searchByTab.mine, filterOpts],
  );
  const filteredShared = useMemo(
    () => filterGraceNotesForTab(sharedNotes, 'shared', appliedByTab.shared, searchByTab.shared, filterOpts),
    [sharedNotes, appliedByTab.shared, searchByTab.shared, filterOpts],
  );
  const filtered = tab === 'mine' ? filteredMine : filteredShared;
  const mineTabCount = filteredMine.length;
  const sharedTabCount = filteredShared.length;

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear?: () => void }[] = [];
    if (applied.typeFilter) {
      chips.push({
        key: 'type',
        label: graceRecordTypeLabel(applied.typeFilter),
        clear: () => setApplied(prev => ({ ...prev, typeFilter: '' })),
      });
    }
    if (tab === 'mine' && applied.visibilityFilter !== 'all') {
      chips.push({
        key: 'visibility',
        label: VISIBILITY_LABELS[applied.visibilityFilter],
        clear: () => setApplied(prev => ({
          ...prev,
          visibilityFilter: 'all',
          organizationIds: [],
          selectedPastorIds: [],
        })),
      });
    }
    if (showShareTypeFilter) {
      const shareChipLabel = getGraceShareTypeFilterLabel(
        user,
        applied.shareType,
        shareTypeChipVariant,
        !hidePastorShareTypeOption,
      );
      chips.push({
        key: 'shareType',
        label: shareChipLabel,
        ...(isMemberUser
          ? {}
          : {
              clear: () => setApplied(prev => ({
                ...createEmptyFilter(user, prev.typeFilter),
                period: { ...EMPTY_PERIOD_FILTER },
                typeFilter: prev.typeFilter,
              })),
            }),
      });
    }
    if (appliedFlags.showMineOrgTree || appliedFlags.showSharedOrgTree) {
      for (const id of applied.organizationIds) {
        chips.push({
          key: `org:${id}`,
          label: getOrganizationPathLabel(id),
          clear: () => setApplied(prev => ({
            ...prev,
            organizationIds: prev.organizationIds.filter(x => x !== id),
            selectedAuthorIds: [],
          })),
        });
      }
    }
    if (appliedFlags.showAuthorOrgPicker) {
      for (const id of applied.selectedAuthorOrganizationIds) {
        chips.push({
          key: `authorOrg:${id}`,
          label: id === UNASSIGNED_AUTHOR_ORG_ID
            ? '소속 미지정'
            : getOrganizationPathLabel(id),
          clear: () => setApplied(prev => ({
            ...prev,
            selectedAuthorOrganizationIds: prev.selectedAuthorOrganizationIds.filter(x => x !== id),
            selectedAuthorIds: [],
          })),
        });
      }
    }
    for (const id of applied.selectedPastorIds) {
      const p = pastorLookupFlat.get(id);
      chips.push({
        key: `pastor:${id}`,
        label: p ? pastorLabel(p) : id,
        clear: () => setApplied(prev => ({
          ...prev,
          selectedPastorIds: prev.selectedPastorIds.filter(x => x !== id),
          selectedAuthorIds: [],
        })),
      });
    }
    if (tab === 'shared' && applied.authorRole !== 'all') {
      chips.push({
        key: 'authorRole',
        label: applied.authorRole === 'member' ? '성도 작성' : '교역자 작성',
        clear: () => setApplied(prev => ({ ...prev, authorRole: 'all', selectedAuthorIds: [] })),
      });
    }
    for (const id of applied.selectedAuthorIds) {
      const label = resolveGraceNoteAuthorDisplay({ userId: id }).label;
      chips.push({
        key: `authorId:${id}`,
        label,
        clear: () => setApplied(prev => ({
          ...prev,
          selectedAuthorIds: prev.selectedAuthorIds.filter(x => x !== id),
        })),
      });
    }
    if (applied.authorQuery.trim()) {
      chips.push({
        key: 'author',
        label: `작성자: ${applied.authorQuery.trim()}`,
        clear: () => setApplied(prev => ({ ...prev, authorQuery: '' })),
      });
    }
    const periodLabel = periodFilterChipLabel(applied.period);
    if (periodLabel) {
      chips.push({
        key: 'period',
        label: periodLabel,
        clear: () => {
          setApplied(prev => ({
            ...prev,
            period: { ...EMPTY_PERIOD_FILTER },
          }));
        },
      });
    }
    return chips;
  }, [tab, applied, appliedFlags, showShareTypeFilter, pastorLookupFlat, user, shareTypeChipVariant, hidePastorShareTypeOption, setApplied, isMemberUser]);

  const resetAppliedFilters = () => {
    setApplied(cloneFilter(createEmptyFilter(user, '')));
  };

  const isMineMode = tab === 'mine';

  const switchCollectionMode = (mode: GraceCollectTab) => {
    if (mode === tab) return;
    setTab(mode);
  };

  const hasAppliedFilters =
    activeChips.some(c => c.key !== 'shareType') ||
    search.trim() !== '';

  const isOwn = (note: GraceNote) => Boolean(user?.id && note.userId === user.id);

  const handleDelete = (id: string) => {
    deleteGraceNote(id);
    setNotes(getAllGraceNotes());
    setDeleteId(null);
  };

  const tabs = GRACE_COLLECTION_UI_TABS;

  useEffect(() => {
    if (!tabs.some(t => t.id === tab)) setTab('mine');
  }, [tabs, tab]);

  useEffect(() => {
    if (resetToMineSignal !== undefined && resetToMineSignal > 0) {
      setTab('mine');
      setNotes(getAllGraceNotes());
    }
  }, [resetToMineSignal]);

  const emptyState = useMemo((): { title: string; desc: string } => {
    const periodOnly =
      isPeriodActive(applied.period) && !hasNonPeriodDetailFilters(applied, tab) && !search.trim();

    if (tab === 'mine') {
      if (hasAppliedFilters) {
        if (periodOnly) {
          return {
            title: '선택한 기간에 작성한 기록이 없습니다.',
            desc: '다른 기간을 선택하거나 상세설정을 초기화해 보세요.',
          };
        }
        return {
          title: '설정한 조건에 맞는 기록이 없습니다.',
          desc: '상세설정 조건을 바꾸거나 초기화해 보세요.',
        };
      }
      return {
        title: '작성한 기록이 없습니다.',
        desc: '말씀과 삶 속에서 받은 은혜를 기록해 보세요.',
      };
    }

    if (hasAppliedFilters) {
      if (periodOnly) {
        return {
          title: '선택한 기간에 공유받은 기록이 없습니다.',
          desc: '다른 기간을 선택하거나 상세설정을 초기화해 보세요.',
        };
      }
      if (applied.typeFilter && !hasSharedTabSecondaryFilters(applied)) {
        return {
          title: `공유받은 ${graceRecordTypeLabel(applied.typeFilter)} 기록이 없습니다.`,
          desc: '다른 상세설정을 선택하거나 초기화해 보세요.',
        };
      }
      return {
        title: '설정한 조건에 맞는 기록이 없습니다.',
        desc: '상세설정 조건을 바꾸거나 초기화해 보세요.',
      };
    }

    if (applied.shareType === 'pastor_share') {
      return {
        title: isAdminUser
          ? '조건에 맞는 교역자 직접 공유 기록이 없습니다.'
          : isPastorUser
            ? '나에게 직접 공유된 기록이 없습니다.'
            : '교역자에게 직접 공유받은 기록이 없습니다.',
        desc: isMemberUser
          ? '성도 모드에서는 다른 사람의 교역자 직접 공유 기록을 보지 않습니다.'
          : '성도·교역자가 교역자에게 직접 공유한 기록이 이곳에 나타납니다.',
      };
    }

    if (applied.shareType === 'organization_share') {
      if (coreOrgIds.length === 0 && isMemberUser) {
        return {
          title: '소속된 교구·부서가 없습니다.',
          desc: '내정보 또는 조직관리에서 소속 조직을 확인해 주세요.',
        };
      }
      const title =
        applied.organizationIds.length === 1
          ? `${getOrganizationPathLabel(applied.organizationIds[0])}에 공유된 기록이 없습니다.`
          : applied.organizationIds.length > 1
            ? '선택한 교구·부서에 공유된 기록이 없습니다.'
            : isAdminUser
              ? '조건에 맞는 교구·부서 공유 기록이 없습니다.'
              : '내 교구·부서에 공유된 기록이 없습니다.';
      return {
        title,
        desc: isMemberUser
          ? '소속 교구·부서에서 공유하면 이곳에 나타납니다.'
          : '소속·담당 조직에 공유된 기록이 이곳에 나타납니다.',
      };
    }

    if (isMemberUser) {
      return {
        title: '내 교구·부서에 공유된 기록이 없습니다.',
        desc: '소속 교구·부서에서 공유하면 이곳에 나타납니다.',
      };
    }
    if (isPastorUser) {
      return {
        title: '나에게 공유된 기록이 없습니다.',
        desc: '직접 공유되거나 소속 조직에 공유된 기록이 이곳에 나타납니다.',
      };
    }
    return {
      title: '조회 가능한 공유 기록이 없습니다.',
      desc: '공유된 기록이 이곳에 나타납니다.',
    };
  }, [tab, applied, applied.organizationIds, coreOrgIds.length, isMemberUser, isPastorUser, hasAppliedFilters, search]);

  if (collectionView === 'filter') {
    return (
      <SharedContentDetailSettingsPage
        onBack={() => {
          setPeriodError(null);
          setCollectionView('list');
        }}
        onReset={() => {
          setPeriodError(null);
          setDraft(createEmptyFilter(user, ''));
        }}
        onApply={applyFilter}
        description="조건에 맞는 기록을 찾아보세요."
      >
        <GraceRecordTypeFilterButtons
          value={draft.typeFilter}
          onChange={id => setDraft(prev => ({ ...prev, typeFilter: id }))}
        />

        {tab === 'mine' && (
          <>
            <SharedContentVisibilityFilterSection
              value={draft.visibilityFilter}
              onChange={handleDraftVisibilityChange}
            />

            {draftFlags.showMineOrgTree && (
              <UserOrganizationTreeSelector
                user={user}
                mode={orgTreeMode}
                selectedOrganizationIds={draft.organizationIds}
                onChange={ids => setDraft(prev => ({ ...prev, organizationIds: ids }))}
                defaultScope={draftFlags.orgTreeDefaultScope}
                sectionTitle={draftFlags.orgTreeSectionTitle}
              />
            )}

            {tab === 'mine' && draft.visibilityFilter === 'pastor_share' && (
              <PastorFlatFilterSelector
                pastorGroups={pastorFilterGroups}
                selectedPastorIds={draft.selectedPastorIds}
                onChange={ids => setDraft(prev => ({ ...prev, selectedPastorIds: ids }))}
              />
            )}
          </>
        )}

        {showShareTypeFilter && (
          <SharedContentShareTypeFilterSection
            options={shareTypeFilterOptions}
            value={draft.shareType}
            onChange={handleDraftShareTypeChange}
          />
        )}

        {draftFlags.showSharedOrgTree && (
          <UserOrganizationTreeSelector
            user={user}
            mode={orgTreeMode}
            selectedOrganizationIds={draft.organizationIds}
            onChange={ids => setDraft(prev => ({
              ...prev,
              organizationIds: ids,
              selectedAuthorIds: [],
            }))}
            defaultScope={draftFlags.orgTreeDefaultScope}
            sectionTitle={draftFlags.orgTreeSectionTitle}
          />
        )}

        {draftFlags.showPastorPicker && tab === 'shared' && (
          <PastorOrgFilterSelector
            groups={draftPastorFilterData.groups}
            selectedPastorIds={draft.selectedPastorIds}
            onChange={ids => setDraft(prev => ({
              ...prev,
              selectedPastorIds: ids,
              selectedAuthorIds: [],
            }))}
            sectionTitle="공유받은 교역자"
            sectionDescription="성도 또는 다른 교역자가 직접 공유 대상으로 선택한 교역자를 선택합니다."
          />
        )}

        {tab === 'shared' && (isPastorUser || isAdminUser) && (
          <>
            <SharedContentAuthorRoleFilterSection
              value={draft.authorRole}
              onChange={id => setDraft(prev => ({
                ...prev,
                authorRole: id === 'super_admin' ? 'pastor' : id,
                selectedAuthorIds: [],
              }))}
              description={authorRoleHint}
            />
            {draftFlags.showAuthorOrgPicker ? (
              <AuthorOrgFilterSelector
                groups={draftAuthorOrgGroups}
                selectedOrganizationIds={draft.selectedAuthorOrganizationIds}
                selectedAuthorIds={draft.selectedAuthorIds}
                onChangeOrganizations={ids => {
                  const authors = buildAuthorsWithOrganizationIds(
                    sharedNotes,
                    {
                      typeFilter: draft.typeFilter,
                      shareType: draft.shareType,
                      organizationIds: [],
                      selectedPastorIds: [],
                      showPastorPicker: false,
                      showOrgTree: false,
                    },
                    draft.authorRole,
                  );
                  const scoped = filterAuthorsBySelectedOrganizations(authors, ids);
                  setDraft(prev => ({
                    ...prev,
                    selectedAuthorOrganizationIds: ids,
                    selectedAuthorIds: pruneSelectedAuthorIds(prev.selectedAuthorIds, scoped),
                  }));
                }}
                onChangeAuthors={ids => setDraft(prev => ({
                  ...prev,
                  selectedAuthorIds: [...new Set(ids)],
                }))}
              />
            ) : (
              <SharedContentAuthorSelector
                authors={draftAuthorPool}
                selectedIds={draft.selectedAuthorIds}
                onChange={ids => setDraft(prev => ({ ...prev, selectedAuthorIds: ids }))}
                roleFilter={draft.authorRole}
              />
            )}
          </>
        )}

        <PeriodFilterSection
          value={draft.period}
          onChange={next => {
            setPeriodError(null);
            setDraft(prev => ({ ...prev, period: next }));
          }}
          error={periodError}
        />
      </SharedContentDetailSettingsPage>
    );
  }

  const pageDescription = isMineMode
    ? '내가 작성한 기록을 확인합니다.'
    : buildGraceSharedListDescription({
        user,
        applied,
        isAdmin: isAdminUser,
        isPastor: isPastorUser,
        isMember: isMemberUser,
        pastorLookup: pastorLookupFlat,
      });

  const collectionTabs = (
    <div
      role="tablist"
      aria-label={`${GRACE_MENU_LABEL} 보기`}
      className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 w-full"
    >
      <button
        type="button"
        role="tab"
        id="grace-tab-mine"
        aria-selected={isMineMode}
        aria-controls="grace-collection-panel"
        onClick={() => switchCollectionMode('mine')}
        className={`min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-target ${
          isMineMode
            ? 'bg-primary-500 text-white shadow-sm'
            : 'bg-white text-gray-600 border border-[#E5E7EB]'
        }`}
      >
        <span className="hidden sm:inline">내 기록 보기</span>
        <span className="sm:hidden">내 기록</span>
        {' '}
        <span className={`tabular-nums min-w-[1.5ch] inline-block ${isMineMode ? 'text-white/90' : 'text-gray-400'}`}>
          {mineTabCount}
        </span>
      </button>
      <button
        type="button"
        role="tab"
        id="grace-tab-shared"
        aria-selected={!isMineMode}
        aria-controls="grace-collection-panel"
        onClick={() => switchCollectionMode('shared')}
        className={`min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-target ${
          !isMineMode
            ? 'bg-primary-500 text-white shadow-sm'
            : 'bg-white text-gray-600 border border-[#E5E7EB]'
        }`}
      >
        <span className="hidden sm:inline">공유받은 기록 보기</span>
        <span className="sm:hidden">공유받은 기록</span>
        {' '}
        <span className={`tabular-nums min-w-[1.5ch] inline-block ${!isMineMode ? 'text-white/90' : 'text-gray-400'}`}>
          {sharedTabCount}
        </span>
      </button>
    </div>
  );

  const writeBtn = onWrite && user ? (
    <button type="button" onClick={onWrite} className={sermonPrimaryBtnClass}>
      <Plus className="w-5 h-5" /> 작성
    </button>
  ) : undefined;

  const listBody = (
    <div
      id="grace-collection-panel"
      role="tabpanel"
      aria-labelledby={isMineMode ? 'grace-tab-mine' : 'grace-tab-shared'}
      className={`space-y-3 ${isRootPage && onWrite && user ? 'pb-24 md:pb-0' : ''}`}
    >
      {collectionTabs}

      <SharedContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="키워드, 말씀, 설교 검색"
        onOpenDetailSettings={openFilter}
        activeFilterCount={activeChips.length}
        chips={activeChips.map(c => ({
          key: c.key,
          label: c.label,
          ...(c.clear ? { onClear: c.clear } : {}),
        }))}
        onResetFilters={resetAppliedFilters}
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 text-sm">{emptyState.title ?? '기록이 없습니다.'}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{emptyState.desc ?? ''}</p>
        </div>
      ) : (
        <div className="church-list">
          {filtered.map(note => {
            const badge = getGraceListBadge(note, user, tab);
            return (
              <GraceNoteListRow
                key={note.id}
                note={note}
                shareBadge={badge}
                onClick={() => onDetail(note.id)}
                menuItems={isOwn(note) ? [
                  {
                    label: '수정',
                    icon: <Edit3 style={{ width: '15px', height: '15px' }} />,
                    onClick: () => onEdit(note),
                  },
                  {
                    label: '삭제',
                    icon: <Trash2 style={{ width: '15px', height: '15px' }} />,
                    danger: true,
                    onClick: () => setDeleteId(note.id),
                  },
                ] : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {deleteId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">기록을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold">삭제</button>
              <button type="button" onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold">취소</button>
            </div>
          </div>
        </div>
      )}

      {isRootPage ? (
        <>
          <PageHeaderBar
            title={GRACE_MENU_LABEL}
            description={pageDescription}
            action={writeBtn}
          />
          {/* 모바일: Layout 헤더는 고정 안내 — 탭별 안내 문구는 본문에 표시 */}
          <p className="md:hidden text-sm text-gray-500 mb-3 leading-relaxed">
            {pageDescription}
          </p>
          <div className="pt-1 md:pt-4">{listBody}</div>
          {onWrite && user && (
            <MobileFab label="작성" onClick={onWrite} />
          )}
        </>
      ) : (
        <MobileFullScreenPage
          title={GRACE_MENU_LABEL}
          description={pageDescription}
          onBack={onBack}
        >
          {listBody}
        </MobileFullScreenPage>
      )}
    </>
  );
}

// ─── Grace Note Detail View ───────────────────────────────────────────────────

const DETAIL_HEADERS: Record<GraceNoteType, { title: string; description: string }> = {
  reading: {
    title: '성경통독',
    description: '말씀을 통해 받은 은혜를 확인합니다.',
  },
  sermon: {
    title: '설교',
    description: '설교를 통해 받은 은혜를 확인합니다.',
  },
  prayer: {
    title: '기도',
    description: '기록한 기도를 확인합니다.',
  },
};

export function GraceNoteDetailView({ noteId, onBack, onEdit, onDelete }: {
  noteId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const { isMobile } = useBreakpoint();
  const [note, setNote] = useState(() => getGraceNote(noteId));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [liked, setLiked] = useState(() => isGraceNoteLikedByMe(noteId));
  const [likeCount, setLikeCount] = useState(() => getGraceNote(noteId)?.likeCount ?? 0);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    const fresh = getGraceNote(noteId);
    if (fresh) {
      setNote(fresh);
      setLikeCount(fresh.likeCount ?? 0);
      setLiked(isGraceNoteLikedByMe(noteId));
    }
  }, [noteId]);

  const sharedPastorDetails = useMemo(
    () => (note ? getSharedPastorDetailEntries(note) : []),
    [note],
  );

  const header = note
    ? DETAIL_HEADERS[note.type]
    : { title: `${GRACE_MENU_LABEL} 상세`, description: '기록한 내용을 확인합니다.' };

  if (!note) {
    return (
      <MobileFullScreenPage title={header.title} description={header.description} onBack={onBack}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm">기록을 찾을 수 없습니다.</p>
          <button type="button" onClick={onBack} className="mt-3 text-primary-500 text-sm font-medium">← 돌아가기</button>
        </div>
      </MobileFullScreenPage>
    );
  }

  if (!getGraceNoteViewInfo(note, user)) {
    return (
      <MobileFullScreenPage title={header.title} description={header.description} onBack={onBack}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500 text-sm font-semibold">볼 수 있는 기록이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">이 기록은 공개 범위 밖으로 조회할 수 없습니다.</p>
          <button type="button" onClick={onBack} className="mt-3 text-primary-500 text-sm font-medium">← 돌아가기</button>
        </div>
      </MobileFullScreenPage>
    );
  }

  const isOwn = Boolean(user?.id && note.userId === user.id);
  const visibility = migrateVisibility(note.visibility);
  const isPublic = visibility !== 'private';
  /** 공유 기록만 공감 표시 (댓글 허용과 독립) */
  const canShowReaction = isPublic;
  const allowComments = resolveAllowComments(note);
  const canWriteComment = isPublic && allowComments;
  /** 화면 표시용 — prayer·amen 반응 댓글은 보존하되 미표시 */
  const visibleComments = (note.comments ?? []).filter(c => c.type === 'comment');
  const commentCount = visibleComments.length;
  const likeLabel = likeCount.toLocaleString('ko-KR');
  const shareLabel = shareSummary(note);
  const vm = visibilityMeta(note.visibility ?? 'private', note.sharedGroupAll);
  const typeLabel = graceRecordTypeLabel(note.type);
  const typeBadgeClass = graceTypeBadgeClass(note.type);
  const authorLine = formatGraceNoteAuthorLine(note);
  const listTitle = getGraceNoteListTitle(note);
  const relatedOrganizationIds = [
    ...(note.sharedOrganizationIds ?? note.sharedGroupIds ?? []),
    ...(note.sharedUpperOrganizationIds ?? []),
    ...(note.sharedLowerOrganizationIds ?? []),
    ...(note.sharedDepartmentIds ?? []),
  ];

  const refreshNote = () => {
    const fresh = getGraceNote(noteId);
    if (fresh) setNote(fresh);
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

  const handleComment = () => {
    if (!canWriteComment || commentSubmitting || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const commentAuthorLabel = resolveGraceNoteAuthorDisplay({
        userId: user?.id,
        authorName: user?.name,
        authorRole: user?.position,
      }).label;
      addGraceNoteComment(noteId, commentAuthorLabel, commentText, {
        authorId: user?.id,
        canView: true,
      });
      setCommentText('');
      refreshNote();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteGraceNoteComment(noteId, commentId, {
      userId: user?.id,
      isAdmin,
    });
    refreshNote();
  };

  const headerActions = isOwn ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="px-2.5 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold touch-target"
        aria-label="기록 수정"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 touch-target"
        aria-label="기록 삭제"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  ) : undefined;

  const likeButton = (
    <button
      type="button"
      onClick={handleLike}
      aria-label={liked ? '공감 취소' : '공감하기'}
      aria-pressed={liked}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold touch-target transition-colors ${
        liked
          ? 'bg-rose-50 text-rose-600 border border-rose-200'
          : 'bg-gray-50 text-gray-700 border border-gray-100'
      }`}
    >
      <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
      공감 {likeLabel}
    </button>
  );

  const engagementFooter = isMobile && canShowReaction ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLike}
        aria-label={liked ? '공감 취소' : '공감하기'}
        aria-pressed={liked}
        className={`flex-1 flex items-center justify-center gap-1.5 py-3 min-h-[48px] rounded-xl text-sm font-semibold touch-target ${
          liked ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-700'
        }`}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
        공감 {likeLabel}
      </button>
      <button
        type="button"
        onClick={() => setShowComments(true)}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 min-h-[48px] rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 touch-target"
      >
        <MessageCircle className="w-4 h-4" />
        댓글 {commentCount.toLocaleString('ko-KR')}
      </button>
    </div>
  ) : undefined;

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">기록을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}

      <MobileFullScreenPage
        title={header.title}
        description={header.description}
        onBack={onBack}
        saveButton={headerActions}
        footer={engagementFooter}
      >
        <article className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${typeBadgeClass}`}>
                {typeLabel}
              </span>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${vm.color}`}>
                {vm.icon} {vm.label}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-snug">{listTitle}</h2>

            <p className="text-[13px] font-medium text-gray-500">
              {authorLine}
            </p>

            <section>
              <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> {graceContentFieldLabel(note.type)}
              </h3>
              <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">{note.graceContent}</p>
            </section>

            <GraceRelatedSourceDetail note={note} />

            <section className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 mb-2">공개범위</h3>
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${vm.color}`}>
                  {vm.icon} {vm.label}
                </span>
                {shareLabel && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                    {shareLabel}
                  </span>
                )}
              </div>
              {sharedPastorDetails.length > 0 && (
                <div className="mt-3 space-y-2">
                  {sharedPastorDetails.map(entry => (
                    <div
                      key={entry.pastorId}
                      className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-gray-800">
                          {entry.displayName}
                        </span>
                        {entry.statusBadge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700">
                            {entry.statusBadge}
                          </span>
                        )}
                      </div>
                      {entry.shareOrganizationName && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          공유 당시: {entry.shareOrganizationName}
                        </p>
                      )}
                      {entry.currentOrganizationLabel && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          현재: {entry.currentOrganizationLabel}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 공감 — 공유 기록만. 댓글과 독립. PC만 본문에 표시(모바일은 하단 푸터) */}
            {!isMobile && canShowReaction && (
              <section className="pt-2 border-t border-gray-100">
                {likeButton}
              </section>
            )}

            {isPublic && (!isMobile || showComments) && (
              <section className="pt-2 border-t border-gray-100 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> 댓글 {commentCount.toLocaleString('ko-KR')}
                    </h3>
                    {isMobile && (
                      <button type="button" onClick={() => setShowComments(false)} className="text-xs text-gray-400">
                        접기
                      </button>
                    )}
                  </div>

                  {!allowComments && visibleComments.length === 0 ? (
                    <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-gray-50 border border-gray-100">
                      <MessageCircleOff className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500">작성자가 댓글을 허용하지 않은 기록입니다.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-0 mb-3 max-h-56 overflow-y-auto divide-y divide-gray-100">
                        {visibleComments.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">아직 댓글이 없습니다.</p>
                        ) : visibleComments.map(c => {
                          const resolvedAuthorId = resolveCommentAuthorId(c, {
                            allowSeedNameLookup: true,
                          });
                          const canManage = Boolean(
                            isAdmin || (user?.id && resolvedAuthorId && resolvedAuthorId === user.id),
                          );
                          return (
                            <GracePrayerCommentItem
                              key={c.id}
                              comment={c}
                              relatedOrganizationIds={relatedOrganizationIds}
                              deleteButton={canManage ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 touch-target"
                                  aria-label="댓글 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : undefined}
                            />
                          );
                        })}
                      </div>

                      {canWriteComment ? (
                        <div className="flex gap-2">
                          <input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value.slice(0, GRACE_COMMENT_MAX_LENGTH))}
                            placeholder="따뜻한 댓글을 남겨 주세요."
                            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50 min-h-[48px]"
                            onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                            disabled={commentSubmitting}
                          />
                          <button
                            type="button"
                            onClick={handleComment}
                            disabled={!commentText.trim() || commentSubmitting}
                            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 touch-target min-h-[48px]"
                          >
                            등록
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100">
                          <MessageCircleOff className="w-4 h-4 text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-500">작성자가 새 댓글 작성을 허용하지 않았습니다.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </article>
      </MobileFullScreenPage>
    </>
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
          <span className="font-bold text-sm text-gray-900">{GRACE_MENU_LABEL}</span>
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
            <div className="mt-3 church-list">
              {notes.map(note => (
                <GraceNoteListRow
                  key={note.id}
                  note={note}
                  compact
                  onClick={() => onViewNote(note.id)}
                />
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
