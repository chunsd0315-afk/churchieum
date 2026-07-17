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
  Heart, BookOpen, Edit3, Trash2, Copy, Search,
  Filter, X, CheckCircle, ChevronDown, BookMarked,
  Sparkles, Mic, Lock, Users, Eye, MessageCircle, HandHeart,
} from 'lucide-react';
import {
  getAllGraceNotes, getGraceNote, getGraceNotesByProgress,
  deleteGraceNote,
  toggleGraceNoteLike, addGraceNotePrayer, addGraceNoteAmen, addGraceNoteComment,
  isGraceNoteLikedByMe, formatReadingLabel,
  type GraceNote, type GraceNoteType, type GraceNoteVisibility,
} from '../../data/graceNotes';
import { formatSharedPastorLabel, formatSharedGroupLabel } from '../../data/graceNoteSeed';
import { useAuth } from '../../contexts/AuthContext';
import { readOrgSettings } from '../../contexts/OrgSettingsContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { ChurchDropdownMenu } from '../common/ui/ChurchDropdownMenu';
import {
  getGraceNoteViewInfo,
  getGraceNotesForCollectTab,
  getGraceListBadge,
  sortGraceNotesForMemberView,
  matchesAuthorOrganizationFilter,
  GRACE_COLLECTION_UI_TABS,
  type GraceCollectTab,
  type GraceNoteListSort,
} from '../../services/graceNoteShareScope';
import {
  matchesShareTypeFilter,
  matchesOrganizationFilterForRecord,
  SHARE_TYPE_FILTER_LABELS,
} from '../../services/sharedContentAccess';
import type { ShareTypeFilter, VisibilityFilter } from '../../types/sharedContent';
import { migrateVisibility, VISIBILITY_LABELS } from '../../types/sharedContent';
import { UserOrganizationTreeSelector } from '../common/shared-content/UserOrganizationTreeSelector';
import {
  getOrganizationPathLabel,
  getUserCoreOrganizationIds,
  resolveOrgTreeMode,
} from '../../services/userOrganizationTree';
import { isSuperAdmin } from '../../services/permissions';

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

// ─── Grace Note List View (모아보기) ─────────────────────────────────────────

export function GraceNoteListView({ onBack, onDetail, onEdit, initialPlanId, initialType }: {
  onBack: () => void;
  onDetail: (id: string) => void;
  onEdit: (note: GraceNote) => void;
  initialPlanId?: string;
  initialType?: GraceNoteType;
}) {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState<GraceCollectTab>('mine');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<GraceNoteType | ''>(initialType ?? '');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [sortOrder, setSortOrder] = useState<GraceNoteListSort>('newest');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [shareType, setShareType] = useState<ShareTypeFilter>('all');
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [authorQuery, setAuthorQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
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

  const dateRange = useMemo(() => {
    const today = new Date();
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    if (datePreset === 'today') {
      const t = toIso(today);
      return { from: t, to: t };
    }
    if (datePreset === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      return { from: toIso(start), to: toIso(today) };
    }
    if (datePreset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toIso(start), to: toIso(today) };
    }
    if (datePreset === 'custom') {
      return { from: dateFrom, to: dateTo };
    }
    return { from: '', to: '' };
  }, [datePreset, dateFrom, dateTo]);

  const showShareTypeFilter = tab === 'shared';
  /** 공유 유형이 세부일 때만 조직 트리 표시 */
  const showOrgTree =
    tab === 'shared' &&
    (shareType === 'organization_share' ||
      ((isPastorUser || isAdminUser) && shareType === 'pastor_share'));

  const coreOrgIds = useMemo(() => getUserCoreOrganizationIds(user), [user]);
  const orgTreeMode = useMemo(() => resolveOrgTreeMode(user), [user]);
  const orgTreeDefaultScope =
    isAdminUser && (shareType === 'organization_share' || shareType === 'pastor_share')
      ? 'all'
      : 'mine';

  /** 성도: 담당 교역자 공유 필터 숨김 */
  const hidePastorShareTypeOption = isMemberUser;

  useEffect(() => {
    if (hidePastorShareTypeOption && shareType === 'pastor_share') {
      setShareType('all');
    }
  }, [hidePastorShareTypeOption, shareType]);

  useEffect(() => {
    if (!showOrgTree && organizationIds.length > 0) {
      setOrganizationIds([]);
    }
  }, [showOrgTree, organizationIds.length]);

  const handleShareTypeChange = (next: ShareTypeFilter) => {
    setShareType(next);
    setOrganizationIds([]);
  };

  const filtered = useMemo(() => {
    let list = tabNotes.filter(n => {
      if (tab === 'mine') {
        if (typeFilter && n.type !== typeFilter) return false;
        if (visibilityFilter !== 'all' && migrateVisibility(n.visibility) !== visibilityFilter) {
          return false;
        }
      }

      if (tab === 'shared') {
        if (showShareTypeFilter && !matchesShareTypeFilter(n, shareType)) return false;

        if (showOrgTree && organizationIds.length > 0) {
          if (shareType === 'pastor_share') {
            if (!matchesAuthorOrganizationFilter(n, organizationIds)) return false;
          } else if (shareType === 'organization_share') {
            if (!matchesOrganizationFilterForRecord(n, organizationIds)) return false;
          }
        }

        if ((isPastorUser || isAdminUser) && authorQuery.trim()) {
          if (!n.authorName?.toLowerCase().includes(authorQuery.trim().toLowerCase())) {
            return false;
          }
        }
      }

      if (planFilter && n.planId !== planFilter) return false;
      if (dateRange.from && n.createdAt.slice(0, 10) < dateRange.from) return false;
      if (dateRange.to && n.createdAt.slice(0, 10) > dateRange.to) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const searchable = [
          n.authorName, n.authorRole, n.graceTitle, n.planName, n.sermonTitle,
          n.sermonPreacher, n.bibleReference, n.graceContent, n.memorableVerse,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
    list = sortGraceNotesForMemberView(list, user, sortOrder === 'oldest' ? 'oldest' : 'newest');
    return list;
  }, [
    tabNotes, tab, typeFilter, visibilityFilter, planFilter, dateRange,
    shareType, organizationIds, showShareTypeFilter, showOrgTree,
    authorQuery, isPastorUser, isAdminUser, search, sortOrder, user,
  ]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (tab === 'mine' && typeFilter) {
      chips.push({
        key: 'type',
        label: typeFilter === 'reading' ? '성경통독' : typeFilter === 'sermon' ? '설교' : '자유',
        clear: () => setTypeFilter(''),
      });
    }
    if (tab === 'mine' && visibilityFilter !== 'all') {
      chips.push({
        key: 'visibility',
        label: VISIBILITY_LABELS[visibilityFilter],
        clear: () => setVisibilityFilter('all'),
      });
    }
    if (datePreset === 'today') chips.push({ key: 'date', label: '오늘', clear: () => setDatePreset('all') });
    if (datePreset === 'week') chips.push({ key: 'date', label: '이번 주', clear: () => setDatePreset('all') });
    if (datePreset === 'month') chips.push({ key: 'date', label: '이번 달', clear: () => setDatePreset('all') });
    if (datePreset === 'custom' && (dateFrom || dateTo)) {
      chips.push({
        key: 'date',
        label: `${dateFrom || '…'} ~ ${dateTo || '…'}`,
        clear: () => { setDatePreset('all'); setDateFrom(''); setDateTo(''); },
      });
    }
    if (sortOrder === 'oldest') {
      chips.push({ key: 'sort', label: '오래된순', clear: () => setSortOrder('newest') });
    }
    if (showShareTypeFilter && shareType !== 'all') {
      chips.push({
        key: 'shareType',
        label: SHARE_TYPE_FILTER_LABELS[shareType],
        clear: () => { setShareType('all'); setOrganizationIds([]); },
      });
    }
    for (const id of organizationIds) {
      chips.push({
        key: `org:${id}`,
        label: getOrganizationPathLabel(id),
        clear: () => setOrganizationIds(prev => prev.filter(x => x !== id)),
      });
    }
    if (authorQuery.trim()) {
      chips.push({
        key: 'author',
        label: `작성자: ${authorQuery.trim()}`,
        clear: () => setAuthorQuery(''),
      });
    }
    return chips;
  }, [
    tab, typeFilter, visibilityFilter, datePreset, dateFrom, dateTo, sortOrder,
    shareType, showShareTypeFilter, organizationIds, authorQuery,
  ]);

  const resetFilters = () => {
    setTypeFilter('');
    setVisibilityFilter('all');
    setSortOrder('newest');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setShareType('all');
    setOrganizationIds([]);
    setAuthorQuery('');
    setSearch('');
  };

  const isOwn = (note: GraceNote) => Boolean(user?.id && note.userId === user.id);

  const handleDelete = (id: string) => {
    deleteGraceNote(id);
    setNotes(getAllGraceNotes());
    setDeleteId(null);
  };

  const typeLabel = (type: GraceNoteType) =>
    type === 'reading' ? '성경통독' : type === 'sermon' ? '설교' : '자유';
  const typeBadgeClass = (type: GraceNoteType) =>
    type === 'reading' ? 'bg-green-50 text-green-700'
      : type === 'sermon' ? 'bg-blue-50 text-blue-700'
        : 'bg-amber-50 text-amber-700';

  const shareBadgeClass = (label: string) => {
    if (label.includes('나만')) return 'bg-gray-100 text-gray-600';
    if (label.includes('전체 공개')) return 'bg-violet-50 text-violet-700';
    if (label.includes('교역자')) return 'bg-blue-50 text-blue-700';
    return 'bg-emerald-50 text-emerald-700';
  };

  const tabs = GRACE_COLLECTION_UI_TABS;

  useEffect(() => {
    if (!tabs.some(t => t.id === tab)) setTab('mine');
  }, [tabs, tab]);

  const emptyState = useMemo((): { title: string; desc: string } => {
    if (tab === 'mine') {
      return {
        title: '아직 작성한 은혜기록이 없습니다.',
        desc: '말씀과 삶 속에서 받은 은혜를 기록해 보세요.',
      };
    }

    if (shareType === 'pastor_share') {
      return {
        title: '교역자에게 직접 공유받은 은혜기록이 없습니다.',
        desc: isMemberUser
          ? '담당 교역자가 직접 공유하면 이곳에 나타납니다.'
          : '성도·교역자가 교역자와 공유한 기록이 이곳에 나타납니다.',
      };
    }

    if (shareType === 'organization_share') {
      if (coreOrgIds.length === 0 && isMemberUser) {
        return {
          title: '소속된 교구·부서가 없습니다.',
          desc: '내정보 또는 조직관리에서 소속 조직을 확인해 주세요.',
        };
      }
      const title =
        organizationIds.length === 1
          ? `${getOrganizationPathLabel(organizationIds[0])}에 공유된 은혜기록이 없습니다.`
          : organizationIds.length > 1
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
        title: '공유받은 은혜기록이 없습니다.',
        desc: '소속 교구·부서에서 공유하면 이곳에 나타납니다.',
      };
    }
    return {
      title: '공유받은 기록이 없습니다.',
      desc: '직접 공유되거나 소속 조직에 공유된 기록이 이곳에 나타납니다.',
    };
  }, [tab, shareType, coreOrgIds.length, organizationIds, isMemberUser]);

  const orgTreeSectionTitle =
    shareType === 'pastor_share' ? '작성자 소속 조직' : '공유 조직';

  const filterPanel = (
    <div className="space-y-5">
      {tab === 'mine' && (
        <>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-2">기록 유형</p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: '' as const, label: '전체' },
                { id: 'reading' as const, label: '성경통독' },
                { id: 'sermon' as const, label: '설교' },
                { id: 'personal' as const, label: '자유' },
              ]).map(opt => (
                <button
                  key={opt.id || 'all'}
                  type="button"
                  onClick={() => setTypeFilter(opt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold touch-target ${
                    typeFilter === opt.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-800 mb-2">공개범위</p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'all' as const, label: '전체' },
                { id: 'private' as const, label: VISIBILITY_LABELS.private },
                { id: 'pastor_share' as const, label: VISIBILITY_LABELS.pastor_share },
                { id: 'organization_share' as const, label: VISIBILITY_LABELS.organization_share },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibilityFilter(opt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold touch-target ${
                    visibilityFilter === opt.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <p className="text-sm font-bold text-gray-800 mb-2">기간</p>
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'all' as const, label: '전체' },
            { id: 'today' as const, label: '오늘' },
            { id: 'week' as const, label: '이번 주' },
            { id: 'month' as const, label: '이번 달' },
            { id: 'custom' as const, label: '직접 선택' },
          ]).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDatePreset(opt.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold touch-target ${
                datePreset === opt.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50" />
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-gray-800 mb-2">정렬</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSortOrder('newest')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold touch-target ${
              sortOrder === 'newest' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}>최신순</button>
          <button type="button" onClick={() => setSortOrder('oldest')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold touch-target ${
              sortOrder === 'oldest' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}>오래된순</button>
        </div>
      </div>

      {showShareTypeFilter && (
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2">공유 유형</p>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'all' as const, label: SHARE_TYPE_FILTER_LABELS.all },
              ...(!hidePastorShareTypeOption
                ? [{ id: 'pastor_share' as const, label: SHARE_TYPE_FILTER_LABELS.pastor_share }]
                : []),
              { id: 'organization_share' as const, label: SHARE_TYPE_FILTER_LABELS.organization_share },
            ]).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleShareTypeChange(opt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold touch-target ${
                  shareType === opt.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showOrgTree && (
        <UserOrganizationTreeSelector
          user={user}
          mode={orgTreeMode}
          selectedOrganizationIds={organizationIds}
          onChange={setOrganizationIds}
          defaultScope={orgTreeDefaultScope}
          sectionTitle={orgTreeSectionTitle}
        />
      )}

      {tab === 'shared' && (isPastorUser || isAdminUser) && (
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2">작성자</p>
          <input
            type="text"
            value={authorQuery}
            onChange={e => setAuthorQuery(e.target.value)}
            placeholder="작성자 이름"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50"
          />
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={resetFilters}
          className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gray-100 text-gray-700 touch-target">
          초기화
        </button>
        <button type="button" onClick={() => setShowFilterPanel(false)}
          className="flex-1 py-3 rounded-2xl text-sm font-bold bg-primary-600 text-white touch-target">
          적용
        </button>
      </div>
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

      {showFilterPanel && (
        isMobile ? (
          <div className="fixed inset-0 z-[350] flex flex-col justify-end bg-black/40" onClick={() => setShowFilterPanel(false)}>
            <div
              className="bg-white rounded-t-3xl p-5 max-h-[85dvh] overflow-y-auto"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 text-base mb-4">필터</h3>
              {filterPanel}
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[350] flex items-start justify-center bg-black/30 p-6 pt-24" onClick={() => setShowFilterPanel(false)}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 text-base mb-4">필터</h3>
              {filterPanel}
            </div>
          </div>
        )
      )}

      <MobileFullScreenPage
        title="은혜기록 모아보기"
        description="내가 작성한 기록과 공유받은 은혜를 함께 확인하세요."
        onBack={onBack}
        saveButton={
          <span className="text-xs text-gray-400 font-medium px-2 shrink-0">
            {filtered.length}개
          </span>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="키워드, 말씀, 설교 검색"
                className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-primary-300 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilterPanel(true)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold touch-target ${
                activeChips.length > 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
              {activeChips.length > 0 && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{activeChips.length}</span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setShareType('all'); setOrganizationIds([]); setVisibilityFilter('all'); setAuthorQuery(''); }}
                className={`py-3 rounded-2xl text-xs sm:text-sm font-bold touch-target transition-colors ${
                  tab === t.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeChips.map(chip => (
                <button
                  key={chip.key + chip.label}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700"
                >
                  {chip.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button type="button" onClick={resetFilters} className="text-[11px] text-gray-500 font-medium px-2 py-1.5">
                초기화
              </button>
            </div>
          )}

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
            const title =
              note.graceTitle
              || (note.type === 'sermon' ? note.sermonTitle : null)
              || (note.type === 'reading' ? note.bibleReference : null)
              || note.graceContent.slice(0, 28);
            const linked =
              note.type === 'sermon'
                ? [note.sermonTitle && note.graceTitle ? note.sermonTitle : null, note.sermonPreacher, note.bibleReference]
                    .filter(Boolean).join(' · ')
                : note.type === 'reading'
                  ? [note.planName, note.bibleReference && note.graceTitle ? note.bibleReference : null]
                      .filter(Boolean).join(' · ')
                  : '';
            const authorLine = [
              note.authorName ? `${note.authorName}${note.authorRole ? ` ${note.authorRole}` : ''}` : null,
              note.createdAt.slice(0, 10).replace(/-/g, '.'),
            ].filter(Boolean).join(' · ');

            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => onDetail(note.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDetail(note.id);
                  }
                }}
                className="church-list-row cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeBadgeClass(note.type)}`}>
                      {typeLabel(note.type)}
                    </span>
                    {badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${shareBadgeClass(badge)}`}>
                        {badge}
                      </span>
                    )}
                  </div>
                  {isOwn(note) && (
                    <ChurchDropdownMenu
                      items={[
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
                      ]}
                    />
                  )}
                </div>
                <p className="text-[15px] font-bold text-gray-900 line-clamp-1 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">{note.graceContent}</p>
                <p className="text-[11px] text-gray-400 mb-1">{authorLine}</p>
                {linked && (
                  <p className="text-[12px] text-gray-500 line-clamp-1">{linked}</p>
                )}
              </div>
            );
          })}
            </div>
          )}
        </div>
      </MobileFullScreenPage>
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
  const typeLabel = note.type === 'reading' ? '성경통독' : note.type === 'sermon' ? '설교' : '자유';
  const typeBadgeClass =
    note.type === 'reading' ? 'bg-green-50 text-green-700'
      : note.type === 'sermon' ? 'bg-blue-50 text-blue-700'
        : 'bg-amber-50 text-amber-700';

  const refreshNote = () => {
    const fresh = getGraceNote(noteId);
    if (fresh) setNote(fresh);
  };

  const handleCopy = () => {
    const typeStr = note.type === 'reading'
      ? formatReadingLabel(note)
      : note.type === 'personal'
        ? '[자유 은혜기록]'
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
            </div>

            {note.graceTitle && (
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{note.graceTitle}</h2>
            )}

            <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
              <span>
                {note.authorName ?? '성도'}
                {note.authorRole ? ` · ${note.authorRole}` : ''}
              </span>
              <span className="shrink-0 text-xs text-gray-400">
                {note.createdAt.slice(0, 10).replace(/-/g, '.')}
              </span>
            </div>

            {(note.type === 'sermon' || note.type === 'reading' || note.bibleReference) && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1.5">
                {note.type === 'sermon' && (
                  <>
                    {note.sermonTitle && (
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-secondary-500 shrink-0" />
                        {note.sermonTitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {[note.sermonPreacher, note.bibleReference, note.sermonDate].filter(Boolean).join(' · ')}
                    </p>
                  </>
                )}
                {note.type === 'reading' && (
                  <>
                    {note.planName && (
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        {note.planName}{note.day ? ` · ${note.day}일차` : ''}
                      </p>
                    )}
                    {note.bibleReference && (
                      <p className="text-xs text-gray-500">{note.bibleReference}</p>
                    )}
                  </>
                )}
                {note.type === 'personal' && note.bibleReference && (
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    {note.bibleReference}
                  </p>
                )}
              </div>
            )}

            <section>
              <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> 받은 은혜
              </h3>
              <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">{note.graceContent}</p>
            </section>

            {note.memorableVerse && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                  <BookMarked className="w-3.5 h-3.5 text-primary-500" />
                  {note.type === 'personal' ? '감사 제목' : '마음에 남은 말씀'}
                </h3>
                <div className="bg-primary-50 rounded-xl px-4 py-3 border-l-4 border-primary-400">
                  <p className="text-sm text-primary-800 leading-relaxed italic whitespace-pre-wrap">{note.memorableVerse}</p>
                </div>
              </section>
            )}

            {note.application && note.type !== 'personal' && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {note.type === 'sermon' ? '결단 / 적용' : '적용할 점'}
                </h3>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.application}</p>
              </section>
            )}

            {note.prayer && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" /> 기도문
                </h3>
                <div className="bg-violet-50 rounded-xl px-4 py-3 border-l-4 border-violet-400">
                  <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-wrap">{note.prayer}</p>
                </div>
              </section>
            )}

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
