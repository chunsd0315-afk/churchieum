import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import {
  getAllPrayers,
  getPrayerById,
  addPrayer,
  markPrayerAnswered,
  toAuthorRole,
  defaultOrganizationScope,
} from '../../services/prayerStorage';
import type { Prayer } from '../../types/prayer';
import { CHURCH_WIDE_SCOPE } from '../../types/prayer';
import type { ShareTypeFilter, VisibilityFilter } from '../../types/sharedContent';
import { migrateVisibility, VISIBILITY_LABELS } from '../../types/sharedContent';
import {
  filterSharedContentByTab,
  matchesSharedContentSearch,
  matchesShareTypeFilter,
  matchesOrganizationFilterForRecord,
} from '../../services/sharedContentAccess';
import {
  SharedContentListToolbar,
  SharedContentDetailSettingsPage,
  SharedContentShareTypeFilterSection,
  SharedContentVisibilityFilterSection,
  SharedContentAuthorRoleFilterSection,
  SharedContentCollectionTabs,
  SharedContentAuthorSelector,
  VisibilityBadge,
  SharedTargetSummary,
  PrayerStatusBadge,
  UserOrganizationTreeSelector,
  PastorOrgFilterSelector,
  PastorFlatFilterSelector,
  type SharedContentFilterChip,
  type SharedContentAuthorOption,
} from '../../components/common/shared-content';
import {
  getSharedContentShareTypeFilterLabel,
  getSharedContentShareTypeFilterOptions,
} from '../../services/sharedContentShareTypeFilterLabels';
import {
  getFilterPastorsForUser,
  getPastorFilterGroupsForMine,
  matchesSharedPastorFilter,
  pastorLabel,
} from '../../services/graceShareFilterHelpers';
import type { GraceNote } from '../../data/graceNotes';
import { resolveOrgTreeMode, getOrganizationPathLabel } from '../../services/userOrganizationTree';
import { isSuperAdmin } from '../../services/permissions';
import { useAuth } from '../../contexts/AuthContext';
import PrayerDetailSheet from '../../components/layout/PrayerDetailSheet';
import { PrayerWriteForm } from '../../components/member/PrayerWriteForm';
import { getCommentCount } from '../../services/prayerCommentStorage';
import { Heart, Plus, Check, Star, MessageCircle, Loader } from 'lucide-react';
import { MobileFab, PageHeaderBar, useToast } from '../../components/common/ui';
import { ensurePrayerDemoData } from '../../data/prayerSeed';

type PrayerCollectTab = 'mine' | 'shared';
type PrayerPageView = 'collection' | 'filter' | 'write' | 'detail';

type PrayerCollectionFilterState = {
  visibilityFilter: VisibilityFilter;
  shareType: ShareTypeFilter;
  organizationIds: string[];
  selectedPastorIds: string[];
  authorRole: 'all' | 'member' | 'pastor';
  selectedAuthorIds: string[];
};

const EMPTY_PRAYER_FILTER: PrayerCollectionFilterState = {
  visibilityFilter: 'all',
  shareType: 'all',
  organizationIds: [],
  selectedPastorIds: [],
  authorRole: 'all',
  selectedAuthorIds: [],
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : d.toLocaleDateString('ko-KR');
}

function activePrayers(prayers: Prayer[]): Prayer[] {
  return prayers.filter(p => !p.deleted);
}

function getPrayersForCollectTab(
  prayers: Prayer[],
  user: ReturnType<typeof useAuth>['user'],
  tab: PrayerCollectTab,
): Prayer[] {
  return filterSharedContentByTab(activePrayers(prayers), user, tab);
}

function matchesPrayerSearch(prayer: Prayer, query: string): boolean {
  if (!query.trim()) return true;
  if (matchesSharedContentSearch(prayer, query)) return true;
  const q = query.trim().toLowerCase();
  const roleHay = prayer.authorRole === 'pastor' ? '교역자' : prayer.authorRole === 'admin' ? '목사' : '성도';
  return roleHay.includes(q);
}

function isPastoralPrayerAuthor(role: Prayer['authorRole']): boolean {
  return role === 'pastor' || role === 'admin';
}

function derivePrayerFilterFlags(
  f: PrayerCollectionFilterState,
  tab: PrayerCollectTab,
  isAdminUser: boolean,
) {
  const showMineOrgTree = tab === 'mine' && f.visibilityFilter === 'organization_share';
  const showSharedOrgTree = tab === 'shared' && f.shareType === 'organization_share';
  const showPastorPickerMine = tab === 'mine' && f.visibilityFilter === 'pastor_share';
  const showPastorPickerShared = tab === 'shared' && isAdminUser && f.shareType === 'pastor_share';
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
    showPastorPickerMine,
    showPastorPickerShared,
    orgTreeDefaultScope,
    orgTreeSectionTitle,
  };
}

function buildAuthorPool(prayers: Prayer[], user: ReturnType<typeof useAuth>['user']): SharedContentAuthorOption[] {
  const bucket = getPrayersForCollectTab(prayers, user, 'shared');
  const map = new Map<string, SharedContentAuthorOption>();
  for (const p of bucket) {
    if (map.has(p.authorId)) continue;
    map.set(p.authorId, {
      id: p.authorId,
      name: p.authorName,
      role: p.authorRole,
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export default function PrayerPage() {
  const { user, isPastor, isAdmin } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<PrayerPageView>('collection');
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PrayerCollectTab>('mine');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<PrayerCollectionFilterState>(EMPTY_PRAYER_FILTER);
  const [draft, setDraft] = useState<PrayerCollectionFilterState>(EMPTY_PRAYER_FILTER);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [commentTick, setCommentTick] = useState(0);
  const [saving, setSaving] = useState(false);

  const isAdminUser = isSuperAdmin(user);
  const isPastorUser = user?.role === 'pastor' && !isAdminUser;
  const isMemberUser = !isAdminUser && !isPastorUser;

  const orgTreeMode = useMemo(() => resolveOrgTreeMode(user), [user]);
  const authorPool = useMemo(() => buildAuthorPool(prayers, user), [prayers, user]);

  const hidePastorShareTypeOption = isMemberUser;

  const shareTypeFilterOptions = useMemo(
    () => getSharedContentShareTypeFilterOptions(user, 'prayer', {
      includePastorShare: !hidePastorShareTypeOption,
    }),
    [user, hidePastorShareTypeOption],
  );

  const draftFlags = derivePrayerFilterFlags(draft, tab, isAdminUser);
  const appliedFlags = derivePrayerFilterFlags(applied, tab, isAdminUser);

  const minePastorSharePrayers = useMemo(() => {
    if (!user?.id) return [];
    return activePrayers(prayers).filter(
      p =>
        p.authorId === user.id &&
        migrateVisibility(p.visibility) === 'pastor_share',
    );
  }, [prayers, user?.id]);

  const pastorFilterGroups = useMemo(
    () => getPastorFilterGroupsForMine(user, minePastorSharePrayers as unknown as GraceNote[]),
    [user, minePastorSharePrayers],
  );

  const pastorLookupFlat = useMemo(() => {
    const map = new Map<string, { id: string; name: string; position: string }>();
    for (const p of [...pastorFilterGroups.current, ...pastorFilterGroups.historical]) {
      map.set(p.id, { id: p.id, name: p.name, position: p.position ?? '' });
    }
    for (const p of getFilterPastorsForUser(user, applied.organizationIds).flat) {
      map.set(p.id, p);
    }
    return map;
  }, [pastorFilterGroups, user, applied.organizationIds]);

  const draftPastorFilterData = useMemo(
    () => getFilterPastorsForUser(
      user,
      tab === 'shared' && draft.shareType === 'pastor_share' ? [] : draft.organizationIds,
    ),
    [user, draft.organizationIds, draft.shareType, tab],
  );

  const refreshPrayers = useCallback(() => {
    setPrayers(getAllPrayers());
  }, []);

  useEffect(() => {
    ensurePrayerDemoData();
    refreshPrayers();
    setLoading(false);
  }, [refreshPrayers]);

  const switchTab = (next: PrayerCollectTab) => {
    if (next === tab) return;
    setTab(next);
    if (next === 'mine') {
      setApplied(prev => ({
        ...prev,
        shareType: 'all',
        organizationIds: [],
        selectedPastorIds: [],
        authorRole: 'all',
        selectedAuthorIds: [],
      }));
    } else {
      setApplied(prev => ({
        ...prev,
        visibilityFilter: 'all',
        organizationIds: [],
        selectedPastorIds: [],
      }));
    }
    setSearch('');
  };

  const openFilter = () => {
    setDraft({ ...applied });
    setView('filter');
  };

  const applyFilter = () => {
    setApplied({ ...draft });
    setView('collection');
  };

  const resetAppliedFilters = () => {
    setApplied(EMPTY_PRAYER_FILTER);
    setDraft(EMPTY_PRAYER_FILTER);
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
      ...(next !== 'pastor_share' ? { authorRole: 'all' as const, selectedAuthorIds: [] } : {}),
    }));
  };

  const filtered = useMemo(() => {
    const bucket = getPrayersForCollectTab(prayers, user, tab);
    const { showSharedOrgTree, showPastorPickerShared } = appliedFlags;

    return bucket
      .filter(p => {
        if (tab === 'mine') {
          if (
            applied.visibilityFilter !== 'all' &&
            migrateVisibility(p.visibility) !== applied.visibilityFilter
          ) {
            return false;
          }
          if (applied.visibilityFilter === 'pastor_share' && applied.selectedPastorIds.length > 0) {
            if (!matchesSharedPastorFilter(p, applied.selectedPastorIds)) return false;
          }
          if (
            applied.visibilityFilter === 'organization_share' &&
            applied.organizationIds.length > 0
          ) {
            if (!matchesOrganizationFilterForRecord(p, applied.organizationIds)) return false;
          }
        }

        if (tab === 'shared') {
          if (!matchesShareTypeFilter(p, applied.shareType)) return false;
          if (showSharedOrgTree && applied.organizationIds.length > 0) {
            if (!matchesOrganizationFilterForRecord(p, applied.organizationIds)) return false;
          }
          if (showPastorPickerShared && applied.selectedPastorIds.length > 0) {
            if (!matchesSharedPastorFilter(p, applied.selectedPastorIds)) return false;
          }
          if (applied.authorRole === 'member' && isPastoralPrayerAuthor(p.authorRole)) return false;
          if (applied.authorRole === 'pastor' && !isPastoralPrayerAuthor(p.authorRole)) return false;
          if (applied.selectedAuthorIds.length > 0 && !applied.selectedAuthorIds.includes(p.authorId)) {
            return false;
          }
        }

        if (!matchesPrayerSearch(p, search)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [prayers, user, tab, applied, appliedFlags, search]);

  const mineCount = useMemo(
    () => getPrayersForCollectTab(prayers, user, 'mine').length,
    [prayers, user],
  );
  const sharedCount = useMemo(
    () => getPrayersForCollectTab(prayers, user, 'shared').length,
    [prayers, user],
  );

  const activeChips = useMemo((): SharedContentFilterChip[] => {
    const chips: SharedContentFilterChip[] = [];

    if (tab === 'mine' && applied.visibilityFilter !== 'all') {
      chips.push({
        key: 'visibility',
        label: VISIBILITY_LABELS[applied.visibilityFilter],
        onClear: () => setApplied(prev => ({
          ...prev,
          visibilityFilter: 'all',
          organizationIds: [],
          selectedPastorIds: [],
        })),
      });
    }

    if (tab === 'shared' && applied.shareType !== 'all') {
      chips.push({
        key: 'shareType',
        label: getSharedContentShareTypeFilterLabel(
          user,
          'prayer',
          applied.shareType,
          'chip',
          !hidePastorShareTypeOption,
        ),
        onClear: () => setApplied(prev => ({
          ...prev,
          shareType: 'all',
          organizationIds: [],
          selectedPastorIds: [],
        })),
      });
    }

    if (appliedFlags.showMineOrgTree || appliedFlags.showSharedOrgTree) {
      for (const id of applied.organizationIds) {
        chips.push({
          key: `org:${id}`,
          label: getOrganizationPathLabel(id),
          onClear: () => setApplied(prev => ({
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
        onClear: () => setApplied(prev => ({
          ...prev,
          selectedPastorIds: prev.selectedPastorIds.filter(x => x !== id),
        })),
      });
    }

    if (tab === 'shared' && applied.authorRole !== 'all') {
      chips.push({
        key: 'authorRole',
        label: applied.authorRole === 'member' ? '성도' : '교역자',
        onClear: () => setApplied(prev => ({ ...prev, authorRole: 'all', selectedAuthorIds: [] })),
      });
    }

    for (const id of applied.selectedAuthorIds) {
      const author = authorPool.find(a => a.id === id);
      chips.push({
        key: `author:${id}`,
        label: author ? `${author.name} ${author.role === 'member' ? '성도' : '교역자'}` : id,
        onClear: () => setApplied(prev => ({
          ...prev,
          selectedAuthorIds: prev.selectedAuthorIds.filter(x => x !== id),
        })),
      });
    }

    return chips;
  }, [tab, applied, appliedFlags, user, hidePastorShareTypeOption, pastorLookupFlat, authorPool]);

  const hasAppliedFilters = activeChips.length > 0 || search.trim() !== '';

  const emptyState = useMemo(() => {
    if (tab === 'mine') {
      if (hasAppliedFilters) {
        return { title: '조건에 맞는 내 기도가 없습니다.', desc: '검색어나 상세설정을 바꿔 보세요.' };
      }
      return { title: '작성한 기도가 없습니다.', desc: '기도작성 버튼으로 첫 기도를 남겨 보세요.' };
    }
    if (hasAppliedFilters) {
      return { title: '선택한 상세설정에 맞는 기도가 없습니다.', desc: '상세설정 조건을 바꾸거나 초기화해 보세요.' };
    }
    if (isMemberUser) {
      return { title: '내 교구·부서에 공유된 기도가 없습니다.', desc: '교구·부서에 공유된 기도가 이곳에 나타납니다.' };
    }
    if (isPastorUser) {
      return { title: '나에게 또는 담당 교구·부서에 공유된 기도가 없습니다.', desc: '공유된 기도가 이곳에 나타납니다.' };
    }
    return { title: '조회 가능한 공동체 기도가 없습니다.', desc: '공유된 기도가 이곳에 나타납니다.' };
  }, [tab, hasAppliedFilters, isMemberUser, isPastorUser]);

  const pageDescription = tab === 'mine'
    ? '내가 작성한 기도제목을 확인합니다.'
    : '나에게 또는 내 교구·부서에 공유된 기도제목을 확인합니다.';

  const handleSavePrayer = async (payload: {
    title: string;
    content: string;
    visibility: Prayer['visibility'];
    sharedPastorIds: string[];
    sharedOrganizationIds: string[];
  }) => {
    if (!user) return;
    setSaving(true);

    const body = {
      churchId: 'demo',
      authorId: user.id,
      authorName: user.name,
      authorRole: toAuthorRole(user.role),
      title: payload.title,
      content: payload.content,
      visibility: payload.visibility,
      status: 'praying' as const,
      organizationScope: payload.visibility === 'private' ? CHURCH_WIDE_SCOPE : defaultOrganizationScope(user),
      sharedPastorIds: payload.sharedPastorIds,
      sharedOrganizationIds: payload.sharedOrganizationIds,
      attachments: [],
    };

    try {
      await supabase.from('prayers').insert({
        title: payload.title,
        content: payload.content,
        is_private: payload.visibility === 'private',
        is_answered: false,
        category: payload.visibility === 'organization_share' ? 'intercession' : 'personal',
      });
    } catch { /* demo fallback */ }

    addPrayer(body);
    refreshPrayers();
    setSaving(false);
    setView('collection');
    setTab('mine');
    setSearch('');
    toast.success('기도가 저장되었습니다.');
  };

  const handleAnswer = (id: string) => {
    try {
      supabase.from('prayers').update({
        is_answered: true,
        answered_date: new Date().toISOString().split('T')[0],
      }).eq('id', id);
    } catch { /* ignore */ }
    markPrayerAnswered(id);
    refreshPrayers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (view === 'write') {
    return (
      <PrayerWriteForm
        onBack={() => setView('collection')}
        onSave={handleSavePrayer}
        saving={saving}
      />
    );
  }

  if (view === 'filter') {
    return (
      <SharedContentDetailSettingsPage
        onBack={() => setView('collection')}
        onReset={() => setDraft(EMPTY_PRAYER_FILTER)}
        onApply={applyFilter}
        description="조건에 맞는 기도를 찾아보세요."
      >
        {tab === 'mine' && (
          <>
            <SharedContentVisibilityFilterSection
              value={draft.visibilityFilter}
              onChange={handleDraftVisibilityChange}
            />

            {draftFlags.showMineOrgTree && user && (
              <UserOrganizationTreeSelector
                user={user}
                mode={orgTreeMode}
                selectedOrganizationIds={draft.organizationIds}
                onChange={ids => setDraft(prev => ({ ...prev, organizationIds: ids }))}
                defaultScope={draftFlags.orgTreeDefaultScope}
                sectionTitle={draftFlags.orgTreeSectionTitle}
              />
            )}

            {draftFlags.showPastorPickerMine && (
              <PastorFlatFilterSelector
                pastorGroups={pastorFilterGroups}
                selectedPastorIds={draft.selectedPastorIds}
                onChange={ids => setDraft(prev => ({ ...prev, selectedPastorIds: ids }))}
              />
            )}
          </>
        )}

        {tab === 'shared' && (
          <>
            <SharedContentShareTypeFilterSection
              options={shareTypeFilterOptions}
              value={draft.shareType}
              onChange={handleDraftShareTypeChange}
            />

            {draftFlags.showSharedOrgTree && user && (
              <UserOrganizationTreeSelector
                user={user}
                mode={orgTreeMode}
                selectedOrganizationIds={draft.organizationIds}
                onChange={ids => setDraft(prev => ({ ...prev, organizationIds: ids }))}
                defaultScope={draftFlags.orgTreeDefaultScope}
                allowFullOrgTree={isAdminUser}
                sectionTitle="공유 조직"
              />
            )}

            {draftFlags.showPastorPickerShared && (
              <PastorOrgFilterSelector
                groups={draftPastorFilterData.groups}
                selectedPastorIds={draft.selectedPastorIds}
                onChange={ids => setDraft(prev => ({ ...prev, selectedPastorIds: ids }))}
                sectionTitle="공유받은 교역자"
              />
            )}

            <SharedContentAuthorRoleFilterSection
              value={draft.authorRole}
              onChange={role => setDraft(prev => ({
                ...prev,
                authorRole: role === 'super_admin' ? 'all' : role,
                selectedAuthorIds: [],
              }))}
            />

            <SharedContentAuthorSelector
              authors={authorPool}
              selectedIds={draft.selectedAuthorIds}
              onChange={ids => setDraft(prev => ({ ...prev, selectedAuthorIds: ids }))}
              roleFilter={draft.authorRole}
            />
          </>
        )}
      </SharedContentDetailSettingsPage>
    );
  }

  const writeBtn = user ? (
    <button type="button" onClick={() => setView('write')} className={sermonPrimaryBtnClass}>
      <Plus className="w-5 h-5" /> 기도작성
    </button>
  ) : undefined;

  const listBody = (
    <div
      id={`prayer-collection-panel-${tab}`}
      role="tabpanel"
      className="space-y-3 pb-24 md:pb-0"
    >
      <SharedContentCollectionTabs
        ariaLabel="기도 보기"
        activeTab={tab}
        onChange={id => switchTab(id as PrayerCollectTab)}
        tabs={[
          { id: 'mine', label: '내 기도', shortLabel: '내 기도', count: mineCount },
          { id: 'shared', label: '공동체 기도', shortLabel: '공동체 기도', count: sharedCount },
        ]}
      />

      <SharedContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="제목, 내용, 작성자를 검색하세요."
        onOpenDetailSettings={openFilter}
        activeFilterCount={activeChips.length}
        chips={activeChips}
        onResetFilters={resetAppliedFilters}
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 text-sm">{emptyState.title}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{emptyState.desc}</p>
          {tab === 'mine' && !hasAppliedFilters && user && (
            <button
              type="button"
              onClick={() => setView('write')}
              className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-full text-sm font-semibold touch-target"
            >
              기도작성
            </button>
          )}
        </div>
      ) : (
        <div className="church-list">
          {filtered.map(p => (
            <PrayerCard
              key={`${p.id}-${commentTick}`}
              prayer={p}
              isOwn={p.authorId === user?.id}
              showAuthor={tab === 'shared'}
              commentCount={getCommentCount(p.id)}
              onAnswer={
                tab === 'mine' && p.authorId === user?.id && p.status === 'praying'
                  ? () => handleAnswer(p.id)
                  : undefined
              }
              onOpen={() => setSelectedPrayer(p)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageHeaderBar
        title="기도"
        description={pageDescription}
        action={writeBtn}
      />
      <div className="pt-4">{listBody}</div>
      {user && <MobileFab label="기도작성" onClick={() => setView('write')} />}

      {selectedPrayer && (
        <PrayerDetailSheet
          prayer={selectedPrayer}
          user={user}
          auditMode={false}
          onClose={() => setSelectedPrayer(null)}
          onCommentAdded={() => setCommentTick(t => t + 1)}
          onPrayerUpdated={() => {
            refreshPrayers();
            const updated = getPrayerById(selectedPrayer.id);
            if (updated) setSelectedPrayer(updated);
          }}
        />
      )}
    </>
  );
}

function PrayerCard({
  prayer,
  isOwn,
  showAuthor,
  onAnswer,
  onOpen,
  commentCount = 0,
}: {
  prayer: Prayer;
  isOwn?: boolean;
  showAuthor?: boolean;
  onAnswer?: () => void;
  onOpen?: () => void;
  commentCount?: number;
}) {
  const answered = prayer.status === 'answered';
  return (
    <div
      className={`church-list-row cursor-pointer ${answered ? 'bg-success-50/60' : ''}`}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen?.(); }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm min-w-0">
          {prayer.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
          <span className="truncate">{prayer.title}</span>
        </h3>
        {onAnswer && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAnswer(); }}
            className="p-1.5 hover:bg-success-100 rounded-lg text-success-500 flex-shrink-0 transition-colors touch-target"
            title="응답받음"
            aria-label="응답받음"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <VisibilityBadge visibility={prayer.visibility} />
        <PrayerStatusBadge status={prayer.status} />
        {!isOwn && showAuthor && <SharedTargetSummary content={prayer} />}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{prayer.content}</p>

      {answered && prayer.answerContent && (
        <p className="text-xs text-success-600 mt-1.5 italic">{prayer.answerContent}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{formatDate(prayer.createdAt)}</span>
          {(showAuthor || !isOwn) && <span>· {prayer.authorName}</span>}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-primary-500">
              <MessageCircle className="w-3 h-3" /> {commentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
