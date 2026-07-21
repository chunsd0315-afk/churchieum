/**
 * 은혜기록 관련 화면 컴포넌트
 * - GraceNoteListView     : 모아보기 (검색·필터)
 * - GraceNoteDetailView   : 상세 보기
 * - PlanGraceNotesSummary : 통독 계획 내 은혜기록 요약 (BibleReadingCenter에서 사용)
 *
 * 작성 화면은 GraceNoteEditor.tsx 로 통합됨
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Heart, BookOpen, Edit3, Trash2, Copy,
  ChevronDown, Sparkles,
  Mic, Lock, Users, Eye, MessageCircle, HandHeart, Plus,
} from 'lucide-react';
import {
  getAllGraceNotes, getGraceNote, getGraceNotesByProgress,
  deleteGraceNote,
  toggleGraceNoteLike, addGraceNotePrayer, addGraceNoteAmen, addGraceNoteComment,
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
  GRACE_COLLECTION_UI_TABS,
  type GraceCollectTab,
} from '../../services/graceNoteShareScope';
import {
  matchesShareTypeFilter,
  matchesOrganizationFilterForRecord,
} from '../../services/sharedContentAccess';
import type { ShareTypeFilter, VisibilityFilter } from '../../types/sharedContent';
import { migrateVisibility, VISIBILITY_LABELS } from '../../types/sharedContent';
import {
  getGraceShareTypeFilterLabel,
  getGraceShareTypeFilterOptions,
} from '../../services/graceShareTypeFilterLabels';
import {
  SharedContentSegmentButtons,
  SharedContentListToolbar,
  SharedContentDetailSettingsPage,
  SharedContentVisibilityFilterSection,
  SharedContentShareTypeFilterSection,
  SharedContentAuthorRoleFilterSection,
  SharedContentAuthorQueryField,
} from '../common/shared-content';
import { UserOrganizationTreeSelector } from '../common/shared-content/UserOrganizationTreeSelector';
import { PastorOrgFilterSelector } from '../common/shared-content/PastorOrgFilterSelector';
import { PastorFlatFilterSelector } from '../common/shared-content/PastorFlatFilterSelector';
import {
  getOrganizationPathLabel,
  getUserCoreOrganizationIds,
  resolveOrgTreeMode,
} from '../../services/userOrganizationTree';
import { isSuperAdmin } from '../../services/permissions';
import { resolveGraceNoteAuthorDisplay } from '../../services/graceNoteAuthorDisplay';
import {
  getGraceNoteListTitle,
  graceRecordTypeLabel,
  graceShareBadgeClass,
  graceTypeBadgeClass,
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

const PASTORAL_AUTHOR_ROLES = new Set([
  'pastor', 'admin', 'super_admin',
  '담임목사', '부목사', '목사', '전도사', '교육전도사', '선교사', '간사',
]);

function isPastoralGraceAuthorRole(role?: string): boolean {
  if (!role) return false;
  if (PASTORAL_AUTHOR_ROLES.has(role)) return true;
  return role.includes('목사') || role.includes('전도사');
}

const GRACE_RECORD_TYPE_OPTIONS = [
  { id: '' as const, label: '전체' },
  { id: 'reading' as const, label: '성경통독' },
  { id: 'sermon' as const, label: '설교' },
  { id: 'personal' as const, label: '자유' },
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
  shareType: ShareTypeFilter;
  organizationIds: string[];
  selectedPastorIds: string[];
  authorRole: 'all' | 'member' | 'pastor';
  authorQuery: string;
};

const EMPTY_FILTER: GraceListFilterState = {
  typeFilter: '',
  visibilityFilter: 'all',
  shareType: 'all',
  organizationIds: [],
  selectedPastorIds: [],
  authorRole: 'all',
  authorQuery: '',
};

function hasSharedTabSecondaryFilters(applied: GraceListFilterState): boolean {
  return (
    applied.shareType !== 'all' ||
    applied.organizationIds.length > 0 ||
    applied.selectedPastorIds.length > 0 ||
    applied.authorRole !== 'all' ||
    applied.authorQuery.trim() !== ''
  );
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
    orgTreeDefaultScope,
    orgTreeSectionTitle,
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
  const [applied, setApplied] = useState<GraceListFilterState>({
    ...EMPTY_FILTER,
    typeFilter: initialType ?? '',
  });
  const [draft, setDraft] = useState<GraceListFilterState>({
    ...EMPTY_FILTER,
    typeFilter: initialType ?? '',
  });
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notes, setNotes] = useState(() => getAllGraceNotes());

  const planFilter = initialPlanId ?? '';
  const isAdminUser = isSuperAdmin(user);
  const isPastorUser = user?.role === 'pastor' && !isAdminUser;
  const isMemberUser = !isAdminUser && !isPastorUser;

  const tabNotes = useMemo(
    () => getGraceNotesForCollectTab(notes, user, tab),
    [notes, user, tab],
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
      setDraft(prev => ({ ...prev, shareType: 'all' }));
    }
  }, [hidePastorShareTypeOption, draft.shareType]);

  useEffect(() => {
    if (!draftFlags.showOrgTree && draft.organizationIds.length > 0) {
      setDraft(prev => ({ ...prev, organizationIds: [] }));
    }
  }, [draftFlags.showOrgTree, draft.organizationIds.length]);

  useEffect(() => {
    if (!draftFlags.showPastorPicker && draft.selectedPastorIds.length > 0) {
      setDraft(prev => ({ ...prev, selectedPastorIds: [] }));
    }
  }, [draftFlags.showPastorPicker, draft.selectedPastorIds.length]);

  const openFilter = () => {
    setDraft({ ...applied });
    setCollectionView('filter');
  };

  const applyFilter = () => {
    setApplied({ ...draft });
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

  const handleDraftShareTypeChange = (next: ShareTypeFilter) => {
    setDraft(prev => ({
      ...prev,
      shareType: next,
      organizationIds: [],
      selectedPastorIds: [],
      ...(next !== 'pastor_share' ? { authorRole: 'all' as const } : {}),
    }));
  };

  const filtered = useMemo(() => {
    const {
      typeFilter,
      visibilityFilter,
      shareType,
      organizationIds,
      selectedPastorIds,
      authorRole,
      authorQuery,
    } = applied;
    const { showOrgTree, showPastorPicker } = appliedFlags;

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
        if (showShareTypeFilter && !matchesShareTypeFilter(n, shareType)) return false;

        if (showOrgTree && organizationIds.length > 0 && shareType === 'organization_share') {
          if (!matchesOrganizationFilterForRecord(n, organizationIds)) return false;
        }

        if (showPastorPicker && selectedPastorIds.length > 0) {
          if (!matchesSharedPastorFilter(n, selectedPastorIds)) return false;
        }

        if ((isPastorUser || isAdminUser) && authorRole !== 'all') {
          const isPastoral = isPastoralGraceAuthorRole(n.authorRole);
          if (authorRole === 'member' && isPastoral) return false;
          if (authorRole === 'pastor' && !isPastoral) return false;
        }

        if ((isPastorUser || isAdminUser) && authorQuery.trim()) {
          const authorLabel = resolveGraceNoteAuthorDisplay(n).label.toLowerCase();
          if (!authorLabel.includes(authorQuery.trim().toLowerCase())) {
            return false;
          }
        }
      }

      if (planFilter && n.planId !== planFilter) return false;

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
    list = sortGraceNotesForMemberView(list, user, 'newest');
    return list;
  }, [
    tabNotes, tab, applied, appliedFlags, planFilter, showShareTypeFilter,
    isPastorUser, isAdminUser, search, user,
  ]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
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
    if (showShareTypeFilter && applied.shareType !== 'all') {
      chips.push({
        key: 'shareType',
        label: getGraceShareTypeFilterLabel(
          user,
          applied.shareType,
          shareTypeChipVariant,
          !hidePastorShareTypeOption,
        ),
        clear: () => setApplied(prev => ({
          ...prev,
          shareType: 'all',
          organizationIds: [],
          selectedPastorIds: [],
          authorRole: 'all',
        })),
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
        })),
      });
    }
    if (tab === 'shared' && applied.authorRole !== 'all') {
      chips.push({
        key: 'authorRole',
        label: applied.authorRole === 'member' ? '성도' : '교역자',
        clear: () => setApplied(prev => ({ ...prev, authorRole: 'all' })),
      });
    }
    if (applied.authorQuery.trim()) {
      chips.push({
        key: 'author',
        label: `작성자: ${applied.authorQuery.trim()}`,
        clear: () => setApplied(prev => ({ ...prev, authorQuery: '' })),
      });
    }
    return chips;
  }, [tab, applied, appliedFlags, showShareTypeFilter, pastorLookupFlat, user, shareTypeChipVariant, hidePastorShareTypeOption]);

  const resetAppliedFilters = () => {
    setApplied({ ...EMPTY_FILTER, typeFilter: '' });
  };

  const isMineMode = tab === 'mine';

  const mineTabCount = useMemo(
    () => getGraceNotesForCollectTab(notes, user, 'mine').length,
    [notes, user],
  );
  const sharedTabCount = useMemo(
    () => getGraceNotesForCollectTab(notes, user, 'shared').length,
    [notes, user],
  );

  const switchCollectionMode = (mode: GraceCollectTab) => {
    if (mode === tab) return;
    if (mode === 'mine') {
      setTab('mine');
      setApplied(prev => ({
        ...prev,
        shareType: 'all',
        organizationIds: [],
        selectedPastorIds: [],
        authorRole: 'all',
        authorQuery: '',
      }));
    } else {
      setTab('shared');
      setApplied(prev => ({
        ...prev,
        visibilityFilter: 'all',
        typeFilter: '',
        selectedPastorIds: [],
        organizationIds: [],
      }));
    }
  };

  const hasAppliedFilters =
    activeChips.length > 0 ||
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
    if (tab === 'mine') {
      if (hasAppliedFilters) {
        return {
          title: '조건에 맞는 내 은혜기록이 없습니다.',
          desc: '상세설정 조건을 바꾸거나 초기화해 보세요.',
        };
      }
      return {
        title: '작성한 은혜기록이 없습니다.',
        desc: '말씀과 삶 속에서 받은 은혜를 기록해 보세요.',
      };
    }

    if (hasAppliedFilters) {
      if (applied.typeFilter && !hasSharedTabSecondaryFilters(applied)) {
        return {
          title: `공유받은 ${graceRecordTypeLabel(applied.typeFilter)} 은혜기록이 없습니다.`,
          desc: '다른 상세설정을 선택하거나 초기화해 보세요.',
        };
      }
      return {
        title: '선택한 상세설정에 맞는 은혜기록이 없습니다.',
        desc: '상세설정 조건을 바꾸거나 초기화해 보세요.',
      };
    }

    if (applied.shareType === 'pastor_share') {
      return {
        title: '교역자에게 직접 공유받은 은혜기록이 없습니다.',
        desc: isMemberUser
          ? '담당 교역자가 직접 공유하면 이곳에 나타납니다.'
          : '성도·교역자가 교역자와 공유한 기록이 이곳에 나타납니다.',
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
          ? `${getOrganizationPathLabel(applied.organizationIds[0])}에 공유된 은혜기록이 없습니다.`
          : applied.organizationIds.length > 1
            ? '선택한 교구·부서에 공유된 은혜기록이 없습니다.'
            : '내 교구·부서에 공유된 은혜기록이 없습니다.';
      return {
        title,
        desc: isMemberUser
          ? '소속 교구·부서에서 공유하면 이곳에 나타납니다.'
          : '직접 공유되거나 소속 조직에 공유된 기록이 이곳에 나타납니다.',
      };
    }

    if (isMemberUser) {
      return {
        title: '내 교구·부서에 공유된 은혜기록이 없습니다.',
        desc: '소속 교구·부서에서 공유하면 이곳에 나타납니다.',
      };
    }
    if (isPastorUser) {
      return {
        title: '나에게 공유된 은혜기록이 없습니다.',
        desc: '직접 공유되거나 소속 조직에 공유된 기록이 이곳에 나타납니다.',
      };
    }
    return {
      title: '조회 가능한 공유 은혜기록이 없습니다.',
      desc: '공유된 은혜기록이 이곳에 나타납니다.',
    };
  }, [tab, applied, applied.organizationIds, coreOrgIds.length, isMemberUser, isPastorUser, hasAppliedFilters]);

  if (collectionView === 'filter') {
    return (
      <SharedContentDetailSettingsPage
        onBack={() => setCollectionView('list')}
        onReset={() => setDraft({ ...EMPTY_FILTER, typeFilter: '' })}
        onApply={applyFilter}
        description="조건에 맞는 은혜기록을 찾아보세요."
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
            onChange={ids => setDraft(prev => ({ ...prev, organizationIds: ids }))}
            defaultScope={draftFlags.orgTreeDefaultScope}
            sectionTitle={draftFlags.orgTreeSectionTitle}
          />
        )}

        {draftFlags.showPastorPicker && tab === 'shared' && (
          <PastorOrgFilterSelector
            groups={draftPastorFilterData.groups}
            selectedPastorIds={draft.selectedPastorIds}
            onChange={ids => setDraft(prev => ({ ...prev, selectedPastorIds: ids }))}
            sectionTitle="공유받은 교역자"
          />
        )}

        {tab === 'shared' && (isPastorUser || isAdminUser) && (
          <>
            <SharedContentAuthorRoleFilterSection
              value={draft.authorRole}
              onChange={id => setDraft(prev => ({ ...prev, authorRole: id }))}
            />
            <SharedContentAuthorQueryField
              value={draft.authorQuery}
              onChange={q => setDraft(prev => ({ ...prev, authorQuery: q }))}
            />
          </>
        )}
      </SharedContentDetailSettingsPage>
    );
  }

  const pageDescription = isMineMode
    ? '내가 작성한 은혜기록을 확인합니다.'
    : '나에게 또는 내 교구·부서에 공유된 은혜기록을 확인합니다.';

  const collectionTabs = (
    <div
      role="tablist"
      aria-label="은혜기록 보기"
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
            ? 'bg-[#2F8F62] text-white shadow-sm'
            : 'bg-white text-gray-600 border border-[#E5E7EB]'
        }`}
      >
        <span className="hidden sm:inline">내 기록 보기</span>
        <span className="sm:hidden">내 기록</span>
        {' '}
        <span className={isMineMode ? 'text-white/90' : 'text-gray-400'}>{mineTabCount}</span>
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
            ? 'bg-[#2F8F62] text-white shadow-sm'
            : 'bg-white text-gray-600 border border-[#E5E7EB]'
        }`}
      >
        <span className="hidden sm:inline">공유받은 기록 보기</span>
        <span className="sm:hidden">공유받은 기록</span>
        {' '}
        <span className={!isMineMode ? 'text-white/90' : 'text-gray-400'}>{sharedTabCount}</span>
      </button>
    </div>
  );

  const writeBtn = onWrite && user ? (
    <button type="button" onClick={onWrite} className={sermonPrimaryBtnClass}>
      <Plus className="w-5 h-5" /> 은혜기록 작성
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
          onClear: c.clear,
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
            <h3 className="font-bold text-gray-900 mb-2">은혜기록을 삭제하시겠습니까?</h3>
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
            title="은혜기록"
            description={pageDescription}
            action={writeBtn}
          />
          <div className="pt-4">{listBody}</div>
          {onWrite && user && (
            <MobileFab label="은혜기록 작성" onClick={onWrite} />
          )}
        </>
      ) : (
        <MobileFullScreenPage
          title="은혜기록"
          description={pageDescription}
          onBack={onBack}
          saveButton={
            <span className="text-xs text-gray-400 font-medium px-2 shrink-0">
              {filtered.length}개
            </span>
          }
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
    title: '성경통독 은혜기록',
    description: '말씀을 통해 받은 은혜를 확인합니다.',
  },
  sermon: {
    title: '설교 은혜기록',
    description: '설교를 통해 받은 은혜를 확인합니다.',
  },
  personal: {
    title: '자유 은혜기록',
    description: '일상 속에서 기록한 은혜를 확인합니다.',
  },
};

export function GraceNoteDetailView({ noteId, onBack, onEdit, onDelete }: {
  noteId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [note, setNote] = useState(() => getGraceNote(noteId));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(() => isGraceNoteLikedByMe(noteId));
  const [likeCount, setLikeCount] = useState(() => getGraceNote(noteId)?.likeCount ?? 0);
  const [prayCount, setPrayCount] = useState(() => getGraceNote(noteId)?.prayCount ?? 0);
  const [amenCount, setAmenCount] = useState(() => getGraceNote(noteId)?.amenCount ?? 0);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fresh = getGraceNote(noteId);
    if (fresh) {
      setNote(fresh);
      setLikeCount(fresh.likeCount ?? 0);
      setPrayCount(fresh.prayCount ?? 0);
      setAmenCount(fresh.amenCount ?? 0);
      setLiked(isGraceNoteLikedByMe(noteId));
    }
  }, [noteId]);

  const sharedPastorDetails = useMemo(
    () => (note ? getSharedPastorDetailEntries(note) : []),
    [note],
  );

  const header = note
    ? DETAIL_HEADERS[note.type]
    : { title: '은혜기록 상세', description: '기록한 은혜를 확인합니다.' };

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
          <p className="text-gray-500 text-sm font-semibold">볼 수 있는 은혜기록이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">이 기록은 공개 범위 밖으로 조회할 수 없습니다.</p>
          <button type="button" onClick={onBack} className="mt-3 text-primary-500 text-sm font-medium">← 돌아가기</button>
        </div>
      </MobileFullScreenPage>
    );
  }

  const isOwn = Boolean(user?.id && note.userId === user.id);
  const isPublic = note.visibility !== 'private';
  const shareLabel = shareSummary(note);
  const authorName = user?.name ?? '성도';
  const vm = visibilityMeta(note.visibility ?? 'private', note.sharedGroupAll);
  const typeLabel = graceRecordTypeLabel(note.type);
  const typeBadgeClass = graceTypeBadgeClass(note.type);
  const authorDisplay = resolveGraceNoteAuthorDisplay(note);
  const listTitle = getGraceNoteListTitle(note);

  const refreshNote = () => {
    const fresh = getGraceNote(noteId);
    if (fresh) setNote(fresh);
  };

  const handleCopy = () => {
    const text = [
      listTitle,
      note.createdAt.slice(0, 10),
      '',
      note.graceContent,
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

  const headerActions = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold touch-target ${
          copied ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}
        aria-label="복사"
      >
        {copied ? '복사됨' : <Copy className="w-3.5 h-3.5" />}
      </button>
      {isOwn && (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold touch-target"
            aria-label="수정"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 touch-target"
            aria-label="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  const engagementFooter = isPublic && isMobile ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLike}
        className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold touch-target ${
          liked ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-700'
        }`}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
        공감 {likeCount}
      </button>
      <button
        type="button"
        onClick={handlePray}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 touch-target"
      >
        <HandHeart className="w-4 h-4" />
        기도 {prayCount}
      </button>
      <button
        type="button"
        onClick={() => setShowComments(true)}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 touch-target"
      >
        <MessageCircle className="w-4 h-4" />
        댓글 {(note.comments ?? []).length}
      </button>
    </div>
  ) : undefined;

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">은혜기록을 삭제하시겠습니까?</h3>
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
              {note.isFavorite && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700">
                  ★ 즐겨찾기
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-snug">{listTitle}</h2>

            <p
              className="text-[13px] font-medium"
              style={{ color: '#6B7280' }}
            >
              {authorDisplay.label}
              <span className="text-gray-300 mx-1.5">·</span>
              {note.createdAt.slice(0, 10).replace(/-/g, '.')}
            </p>

            <section>
              <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> 은혜 내용
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

            {isPublic && (!isMobile || showComments) && (
              <section className="pt-2 border-t border-gray-100 space-y-4">
                {!isMobile && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold touch-target ${
                        liked ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-gray-50 text-gray-700 border border-gray-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                      공감 {likeCount}
                    </button>
                    <button
                      type="button"
                      onClick={handlePray}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-100 touch-target"
                    >
                      <Sparkles className="w-4 h-4" />
                      함께 기도합니다 {prayCount}
                    </button>
                    <button
                      type="button"
                      onClick={handleAmen}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-100 touch-target"
                    >
                      <HandHeart className="w-4 h-4" />
                      아멘 {amenCount}
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> 댓글 {(note.comments ?? []).length}
                    </h3>
                    {isMobile && (
                      <button type="button" onClick={() => setShowComments(false)} className="text-xs text-gray-400">
                        접기
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
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
                      type="button"
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 touch-target"
                    >
                      등록
                    </button>
                  </div>
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
