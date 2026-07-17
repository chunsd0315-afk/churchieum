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
import type { Prayer, PrayerAttachment } from '../../types/prayer';
import { CHURCH_WIDE_SCOPE, ATTACHMENT_TYPE_LABELS } from '../../types/prayer';
import type { VisibilityType } from '../../types/sharedContent';
import { migrateVisibility } from '../../types/sharedContent';
import {
  filterSharedContentByTab,
  getShareablePastorsForWriter,
  getShareableOrganizationsForWriter,
  matchesSharedContentSearch,
  matchesShareTypeFilter,
  matchesOrganizationFilterForRecord,
  PRAYER_LIST_TAB_LABELS,
  type SharedListTab,
} from '../../services/sharedContentAccess';
import { getDistrictNameById } from '../../services/orgData';
import {
  VisibilitySelector,
  PastorShareSelector,
  OrganizationShareSelector,
  VisibilityBadge,
  SharedTargetSummary,
  PrayerStatusBadge,
  SharedContentSearchFilter,
  type SharedContentFilterState,
} from '../../components/common/shared-content';
import { useAuth } from '../../contexts/AuthContext';
import PrayerAttachmentPicker from '../../components/layout/PrayerAttachmentPicker';
import PrayerDetailSheet from '../../components/layout/PrayerDetailSheet';
import { getCommentCount } from '../../services/prayerCommentStorage';
import {
  Heart, Plus, Check, Star, Paperclip, MessageCircle, Loader,
} from 'lucide-react';
import { TabBar, MobileEditorModal, MobileFab, useToast } from '../../components/common/ui';
import EmptyState from '../../components/layout/EmptyState';
import { FeatureHubPage, HubBackBar } from '../../components/common/feature-hub';
import { PRAYER_HUB } from '../../config/featureHub/memberHubs';

const MEMBER_TABS: SharedListTab[] = ['mine', 'shared'];
const PASTOR_TABS: SharedListTab[] = ['mine', 'pastor_members', 'organization'];
const ADMIN_TABS: SharedListTab[] = ['mine', 'admin_shared', 'admin_audit'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : d.toLocaleDateString('ko-KR');
}

export default function PrayerPage() {
  const { user, isPastor, isAdmin } = useAuth();
  const toast = useToast();
  const [hubView, setHubView] = useState(true);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = isAdmin ? ADMIN_TABS : isPastor ? PASTOR_TABS : MEMBER_TABS;
  const [activeTab, setActiveTab] = useState<SharedListTab>('mine');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>('private');
  const [sharedPastorIds, setSharedPastorIds] = useState<string[]>([]);
  const [sharedOrganizationIds, setSharedOrganizationIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<PrayerAttachment[]>([]);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [commentTick, setCommentTick] = useState(0);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<SharedContentFilterState>({
    visibility: 'all',
    shareType: 'all',
    organizationIds: [],
    prayerStatus: 'all',
    authorRole: 'all',
  });

  const filterMode = isAdmin ? 'admin' : isPastor ? 'pastor' : 'member';
  const selectorVariant = isAdmin || isPastor ? 'pastor' : 'member';

  const shareablePastors = useMemo(() => getShareablePastorsForWriter(user), [user]);
  const shareableOrganizations = useMemo(() => getShareableOrganizationsForWriter(user), [user]);

  const openForm = () => {
    setVisibility('private');
    setSharedPastorIds([]);
    setSharedOrganizationIds([]);
    setAttachments([]);
    setShowForm(true);
  };

  const closeForm = () => {
    attachments.forEach(a => {
      if (a.url.startsWith('blob:')) {
        try { URL.revokeObjectURL(a.url); } catch { /* ignore */ }
      }
    });
    setShowForm(false);
    setTitle('');
    setContent('');
    setVisibility('private');
    setSharedPastorIds([]);
    setSharedOrganizationIds([]);
    setAttachments([]);
  };

  const refreshPrayers = useCallback(() => {
    setPrayers(getAllPrayers());
  }, []);

  useEffect(() => {
    refreshPrayers();
    setLoading(false);
  }, [refreshPrayers]);

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    (visibility !== 'pastor_share' || sharedPastorIds.length > 0) &&
    (visibility !== 'organization_share' || sharedOrganizationIds.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setSaving(true);

    const payload = {
      churchId: 'demo',
      authorId: user.id,
      authorName: user.name,
      authorRole: toAuthorRole(user.role),
      title,
      content,
      visibility,
      status: 'praying' as const,
      organizationScope: visibility === 'private' ? CHURCH_WIDE_SCOPE : defaultOrganizationScope(user),
      sharedPastorIds: visibility === 'pastor_share' ? sharedPastorIds : [],
      sharedOrganizationIds: visibility === 'organization_share' ? sharedOrganizationIds : [],
      attachments,
    };

    try {
      await supabase.from('prayers').insert({
        title,
        content,
        is_private: visibility === 'private',
        is_answered: false,
        category: visibility === 'organization_share' ? 'intercession' : 'personal',
      });
    } catch { /* demo fallback */ }

    addPrayer(payload);
    refreshPrayers();
    closeForm();
    setSaving(false);
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

  const filterOrganizations = useMemo(() => {
    return shareableOrganizations.all.map(g => ({
      ...g,
      parentName:
        g.kind === 'zone' && g.parentId
          ? (() => {
              const n = getDistrictNameById(g.parentId!);
              return n && n !== '-' ? n : undefined;
            })()
          : undefined,
    }));
  }, [shareableOrganizations]);

  const tabPrayers = useMemo(() => {
    const showShareType = activeTab === 'shared' || activeTab === 'admin_shared';
    const applyOrgFilter =
      activeTab === 'organization' ||
      (showShareType && filterState.shareType === 'organization_share');
    const bucket = filterSharedContentByTab(prayers, user, activeTab, {
      canAuditPrivate: isAdmin,
    });
    return bucket
      .filter(p => {
        if (showShareType && !matchesShareTypeFilter(p, filterState.shareType ?? 'all')) {
          return false;
        }
        if (
          applyOrgFilter &&
          !matchesOrganizationFilterForRecord(p, filterState.organizationIds ?? [])
        ) {
          return false;
        }
        if (filterState.visibility && filterState.visibility !== 'all') {
          if (migrateVisibility(p.visibility) !== filterState.visibility) return false;
        }
        if (filterState.prayerStatus && filterState.prayerStatus !== 'all') {
          if (p.status !== filterState.prayerStatus) return false;
        }
        if (filterState.authorRole && filterState.authorRole !== 'all') {
          const wanted = filterState.authorRole === 'super_admin' ? 'admin' : filterState.authorRole;
          if (p.authorRole !== wanted) return false;
        }
        if (filterState.authorQuery) {
          if (!p.authorName.toLowerCase().includes(filterState.authorQuery.toLowerCase())) return false;
        }
        if (filterState.dateFrom && p.createdAt.slice(0, 10) < filterState.dateFrom) return false;
        if (filterState.dateTo && p.createdAt.slice(0, 10) > filterState.dateTo) return false;
        if (search.trim() && !matchesSharedContentSearch(p, search)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [prayers, user, activeTab, filterState, search, isAdmin]);

  const hidePastorShareTypeOption = useMemo(() => {
    if (filterMode !== 'member') return false;
    if (activeTab !== 'shared') return false;
    const bucket = filterSharedContentByTab(prayers, user, 'shared');
    return !bucket.some(p => migrateVisibility(p.visibility) === 'pastor_share');
  }, [filterMode, activeTab, prayers, user]);

  const showShareTypeOnTab = activeTab === 'shared' || activeTab === 'admin_shared';
  const showOrgFilterOnTab =
    showShareTypeOnTab || activeTab === 'organization';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (hubView) {
    return (
      <FeatureHubPage
        title={PRAYER_HUB.title}
        description={PRAYER_HUB.description}
        features={PRAYER_HUB.features}
        viewer={{ isPastor, isAdmin, role: user?.role }}
        onSelect={id => {
          if (id === 'create') {
            setHubView(false);
            openForm();
            return;
          }
          if (id === 'answered') {
            setActiveTab('mine');
            setFilterState(f => ({ ...f, prayerStatus: 'answered' }));
            setHubView(false);
            toast.info('나의 기도에서 응답된 기도를 확인할 수 있습니다.');
            return;
          }
          if (id === 'pastor-inbox') {
            setActiveTab(isAdmin ? 'admin_shared' : 'pastor_members');
            setHubView(false);
            return;
          }
          if (id === 'church') {
            setActiveTab(tabs[1] ?? 'mine');
            setHubView(false);
            return;
          }
          if (id === 'my') {
            setActiveTab('mine');
          }
          setHubView(false);
        }}
      />
    );
  }

  return (
    <div className="pb-8">
      <HubBackBar
        title="기도"
        description="기도제목을 나누고 함께 기도하세요."
        onBack={() => setHubView(true)}
      />
      <div className="hidden md:flex justify-end mb-4">
        <button
          onClick={openForm}
          className="flex items-center gap-1.5 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> 기도제목
        </button>
      </div>

      <TabBar
        tabs={tabs.map(t => ({
          id: t,
          label: PRAYER_LIST_TAB_LABELS[t],
        }))}
        activeTab={activeTab}
        onChange={id => setActiveTab(id as SharedListTab)}
        variant="segment"
        className="mb-3"
      />

      <SharedContentSearchFilter
        value={filterState}
        onChange={setFilterState}
        search={search}
        onSearchChange={setSearch}
        mode={filterMode}
        showPrayerStatus
        showShareTypeFilter={showShareTypeOnTab}
        hidePastorShareTypeOption={hidePastorShareTypeOption}
        forceShowOrganizationFilter={activeTab === 'organization'}
        filterOrganizations={showOrgFilterOnTab ? filterOrganizations : []}
        className="mb-4"
      />

      <MobileFab label="기도 작성" onClick={openForm} />

      {tabPrayers.length > 0 ? (
        <div className="church-list">
          {tabPrayers.map(p => (
            <PrayerCard
              key={`${p.id}-${commentTick}`}
              prayer={p}
              isOwn={p.authorId === user?.id}
              commentCount={getCommentCount(p.id)}
              onAnswer={
                activeTab === 'mine' && p.authorId === user?.id && p.status === 'praying'
                  ? () => handleAnswer(p.id)
                  : undefined
              }
              onOpen={() => setSelectedPrayer(p)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={activeTab === 'mine' ? '기도제목을 등록해보세요' : '표시할 기도제목이 없습니다'}
          description={
            activeTab === 'mine'
              ? '나의 기도제목을 기록하고 응답을 기다려요.'
              : '조건에 맞는 기도제목이 아직 없습니다.'
          }
          action={
            activeTab === 'mine' ? (
              <button
                onClick={openForm}
                className="px-5 py-2 bg-primary-500 text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                기도제목 추가하기
              </button>
            ) : undefined
          }
        />
      )}

      {showForm && (
        <MobileEditorModal title="기도 작성" onClose={closeForm}>
          <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="기도 제목"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 text-sm"
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="기도 내용을 입력하세요"
              required
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 text-sm resize-none"
            />
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">공개 범위</p>
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <VisibilitySelector
                  value={visibility}
                  onChange={v => {
                    setVisibility(v);
                    if (v !== 'pastor_share') setSharedPastorIds([]);
                    if (v !== 'organization_share') setSharedOrganizationIds([]);
                  }}
                  variant={selectorVariant}
                />
              </div>
            </div>

            {visibility === 'pastor_share' && (
              <PastorShareSelector
                pastors={shareablePastors}
                selectedIds={sharedPastorIds}
                onChange={setSharedPastorIds}
                searchable={isAdmin}
              />
            )}

            {visibility === 'organization_share' && (
              <OrganizationShareSelector
                organizations={shareableOrganizations}
                selectedIds={sharedOrganizationIds}
                onChange={setSharedOrganizationIds}
                searchable={isAdmin}
              />
            )}

            <PrayerAttachmentPicker
              value={attachments}
              onChange={setAttachments}
            />
            <button
              type="submit"
              disabled={saving || !user || !canSubmit}
              className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '등록하기'}
            </button>
          </form>
        </MobileEditorModal>
      )}

      {selectedPrayer && (
        <PrayerDetailSheet
          prayer={selectedPrayer}
          user={user}
          auditMode={isAdmin && activeTab === 'admin_audit'}
          onClose={() => setSelectedPrayer(null)}
          onCommentAdded={() => setCommentTick(t => t + 1)}
          onPrayerUpdated={() => {
            refreshPrayers();
            const updated = getPrayerById(selectedPrayer.id);
            if (updated) setSelectedPrayer(updated);
          }}
        />
      )}
    </div>
  );
}

function PrayerCard({
  prayer,
  isOwn,
  onAnswer,
  onOpen,
  commentCount = 0,
}: {
  prayer: Prayer;
  isOwn?: boolean;
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
            className="p-1.5 hover:bg-success-100 rounded-lg text-success-500 flex-shrink-0 transition-colors"
            title="응답받은 기도로 표시"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <VisibilityBadge visibility={prayer.visibility} />
        <PrayerStatusBadge status={prayer.status} />
        {!isOwn && <SharedTargetSummary content={prayer} />}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{prayer.content}</p>

      {answered && prayer.answerContent && (
        <p className="text-xs text-success-600 mt-1.5 italic">{prayer.answerContent}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{formatDate(prayer.createdAt)}</span>
          <span>· {prayer.authorName}</span>
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-primary-500">
              <MessageCircle className="w-3 h-3" /> {commentCount}
            </span>
          )}
          {prayer.attachments.length > 0 && (
            <span
              className="flex items-center gap-0.5"
              title={prayer.attachments.map(a => ATTACHMENT_TYPE_LABELS[a.type]).join(', ')}
            >
              <Paperclip className="w-3 h-3" /> {prayer.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}