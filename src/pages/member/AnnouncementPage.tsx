import { useState, useMemo, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  Megaphone, Calendar, Star, Paperclip, ImageIcon,
  SlidersHorizontal, LayoutGrid, List, Plus,
} from 'lucide-react';
import { getAllAnnouncements, formatAnnouncementDate, type Announcement } from '../../services/announcementStorage';
import { buildNoticeScopeBadges } from '../../services/announcementHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { AppUser } from '../../services/permissions';
import { PageHeaderBar, useToast } from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';
import {
  AnnouncementSearchPanel,
  AnnouncementFilterChips,
  EMPTY_FILTER,
  isFilterActive,
  countActiveFilters,
  type AnnouncementSearchFilter,
} from '../../components/announcement/AnnouncementSearchPanel';
import { AnnouncementDetailView } from '../../components/announcement/AnnouncementDetailView';
import { AnnouncementEditView } from '../../components/announcement/AnnouncementEditView';
import { getAllOrganizations } from '../../services/organizationStorage';
import { getUserCoreOrganizationIds } from '../../services/userOrganizationTree';

function isAnnouncementVisible(ann: Announcement, user: AppUser | null): boolean {
  if (!user) return ann.scope === 'all';
  if (user.role === 'super_admin') return true;
  if (ann.scope === 'all') return true;

  if (ann.scope === 'organizations') {
    const shared = ann.sharedOrganizationIds ?? [];
    if (shared.length === 0) return false;
    const core = getUserCoreOrganizationIds(user);
    return shared.some(id => core.includes(id));
  }

  if (user.role === 'pastor') {
    if (ann.scope === 'level1') return user.assignedDistrictIds?.includes(ann.scopeId ?? '') ?? false;
    if (ann.scope === 'level2') return user.assignedZoneIds?.includes(ann.scopeId ?? '') ?? false;
    if (ann.scope === 'department') return user.assignedDepartmentIds?.includes(ann.scopeId ?? '') ?? false;
  }
  if (user.role === 'member') {
    if (ann.scope === 'level1') return ann.scopeId === user.districtId;
    if (ann.scope === 'level2') return ann.scopeId === user.zoneId;
    if (ann.scope === 'department') return user.departmentIds?.includes(ann.scopeId ?? '') ?? false;
  }
  return false;
}

function isImportantNotice(a: Announcement): boolean {
  return a.isPinned || a.isImportant;
}

function byNewest(a: Announcement, b: Announcement): number {
  const aTs = a.created_at || a.date || '';
  const bTs = b.created_at || b.date || '';
  const byCreated = bTs.localeCompare(aTs);
  if (byCreated !== 0) return byCreated;
  return (b.date || '').localeCompare(a.date || '');
}

// ─── History (은혜와 기도와 동일 패턴) ───────────────────────────────────────

const HISTORY_KEY = 'churchieum_ann_layer';

type AnnView = 'list' | 'detail' | 'edit';

type AnnHistoryState = {
  [HISTORY_KEY]: true;
  layer: 'detail' | 'edit';
  id: string;
};

function readAnnHistory(): AnnHistoryState | null {
  const s = window.history.state as AnnHistoryState | null;
  if (s?.[HISTORY_KEY] && (s.layer === 'detail' || s.layer === 'edit') && s.id) return s;
  return null;
}

export default function AnnouncementPage() {
  const { user, isPastor, isAdmin } = useAuth();
  const toast = useToast();
  const { isMobile } = useBreakpoint();
  const canManage = isPastor || isAdmin;

  const [view, setView] = useState<AnnView>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [listTick, setListTick] = useState(0);
  const pendingSaveDetailIdRef = useRef<string | null>(null);
  const listScrollRef = useRef(0);

  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const effectiveViewMode = isMobile ? 'list' : viewMode;
  const [showSearch, setShowSearch] = useState(false);

  const [searchFilter, setSearchFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);
  const [draftFilter, setDraftFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);

  const captureListScroll = useCallback(() => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  const restoreListScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: 'auto' });
    });
  }, []);

  const goToList = useCallback(() => {
    setDetailId(null);
    setEditId(null);
    setView('list');
    restoreListScroll();
  }, [restoreListScroll]);

  const goToDetail = useCallback((id: string, opts?: { pushHistory?: boolean; replaceHistory?: boolean }) => {
    setEditId(null);
    setDetailId(id);
    setView('detail');
    const hist: AnnHistoryState = { [HISTORY_KEY]: true, layer: 'detail', id };
    if (opts?.replaceHistory) {
      window.history.replaceState(hist, '');
    } else if (opts?.pushHistory) {
      window.history.pushState(hist, '');
    }
  }, []);

  const navToDetail = (id: string) => {
    captureListScroll();
    goToDetail(id, { pushHistory: true });
  };

  const handleDetailBack = useCallback(() => {
    const hist = readAnnHistory();
    if (hist?.layer === 'detail') {
      window.history.back();
      return;
    }
    goToList();
  }, [goToList]);

  const openEdit = useCallback((id: string, opts?: { fromDetail?: boolean }) => {
    if (!opts?.fromDetail) {
      captureListScroll();
      setDetailId(id);
      window.history.pushState(
        { [HISTORY_KEY]: true, layer: 'detail', id } satisfies AnnHistoryState,
        '',
      );
    }
    setEditId(id);
    setView('edit');
    window.history.pushState(
      { [HISTORY_KEY]: true, layer: 'edit', id } satisfies AnnHistoryState,
      '',
    );
  }, [captureListScroll]);

  const handleEditBack = useCallback(() => {
    const hist = readAnnHistory();
    if (hist?.layer === 'edit') {
      window.history.back();
      return;
    }
    if (editId && editId !== '__new__') {
      goToDetail(editId);
      return;
    }
    if (detailId) {
      goToDetail(detailId);
      return;
    }
    goToList();
  }, [editId, detailId, goToDetail, goToList]);

  const handleEditSave = useCallback((savedId: string) => {
    setListTick(n => n + 1);
    const hist = readAnnHistory();
    if (hist?.layer === 'edit') {
      pendingSaveDetailIdRef.current = savedId;
      window.history.back();
      return;
    }
    setEditId(null);
    setDetailId(savedId);
    setView('detail');
  }, []);

  const handleDetailDelete = useCallback(() => {
    const hist = readAnnHistory();
    if (hist?.layer === 'detail' || hist?.layer === 'edit') {
      window.history.replaceState({}, '');
    }
    setListTick(n => n + 1);
    goToList();
  }, [goToList]);

  useEffect(() => {
    const onPopState = () => {
      const pendingSaveId = pendingSaveDetailIdRef.current;
      if (pendingSaveId) {
        pendingSaveDetailIdRef.current = null;
        setEditId(null);
        setDetailId(pendingSaveId);
        setView('detail');
        window.history.replaceState(
          { [HISTORY_KEY]: true, layer: 'detail', id: pendingSaveId } satisfies AnnHistoryState,
          '',
        );
        return;
      }

      const hist = readAnnHistory();
      if (hist?.layer === 'edit') {
        if (hist.id === '__new__') {
          setEditId('__new__');
          setDetailId(null);
          setView('edit');
          return;
        }
        setEditId(hist.id);
        setDetailId(hist.id);
        setView('edit');
        return;
      }
      if (hist?.layer === 'detail') {
        setEditId(null);
        setDetailId(hist.id);
        setView('detail');
        return;
      }
      setEditId(null);
      setDetailId(null);
      setView('list');
      restoreListScroll();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreListScroll]);

  const visibleAnnouncements = useMemo(
    () => getAllAnnouncements().filter(a => isAnnouncementVisible(a, user)),
    // listTick: 수정·삭제 후 목록 갱신
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, listTick],
  );

  const orgMap = useMemo(
    () => new Map(getAllOrganizations().map(o => [o.id, o])),
    [],
  );

  const filtered = useMemo(() => {
    const f = searchFilter;
    return visibleAnnouncements
      .filter(a => {
        if (f.scopeMode === 'my_org' && f.selectedOrgIds.length > 0) {
          return f.selectedOrgIds.some(orgId => {
            const org = orgMap.get(orgId);
            if (!org) return false;
            if (a.scope === 'all') return true;
            if (a.sharedOrganizationIds?.includes(orgId)) return true;
            return a.scopeId === orgId || a.scopeId === org.id;
          });
        }
        return true;
      })
      .filter(a => {
        const { dateFrom, dateTo } = f;
        if (!dateFrom && !dateTo) return true;
        if (dateFrom && a.date < dateFrom) return false;
        if (dateTo && a.date > dateTo) return false;
        return true;
      })
      .filter(a => {
        if (!f.keyword) return true;
        const q = f.keyword.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q)
        );
      });
  }, [visibleAnnouncements, searchFilter, orgMap]);

  const sortedList = useMemo(
    () => [...filtered].sort((a, b) => {
      const aImp = isImportantNotice(a) ? 0 : 1;
      const bImp = isImportantNotice(b) ? 0 : 1;
      if (aImp !== bImp) return aImp - bImp;
      return byNewest(a, b);
    }),
    [filtered],
  );

  const resetFilters = () => {
    setSearchFilter(EMPTY_FILTER);
    setDraftFilter(EMPTY_FILTER);
    setShowSearch(false);
  };

  const handleCreate = () => {
    if (!canManage) {
      toast.info('관리자 모드의 공지 메뉴에서 등록·관리할 수 있습니다.');
      return;
    }
    captureListScroll();
    setEditId('__new__');
    setDetailId(null);
    setView('edit');
    window.history.pushState(
      { [HISTORY_KEY]: true, layer: 'edit', id: '__new__' } satisfies AnnHistoryState,
      '',
    );
  };

  // ─── Detail / Edit layers (목록은 display:none 유지 — 스크롤·필터 보존) ───

  const showList = view === 'list' || view === 'detail' || view === 'edit';
  const showDetail = view === 'detail' && Boolean(detailId);
  const showEdit = view === 'edit';

  return (
    <>
      {showList && (
        <div
          style={{ display: view === 'list' ? undefined : 'none' }}
          aria-hidden={view !== 'list'}
        >
          <AnnouncementListBody
            canManage={canManage}
            isMobile={isMobile}
            effectiveViewMode={effectiveViewMode}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            draftFilter={draftFilter}
            setDraftFilter={setDraftFilter}
            resetFilters={resetFilters}
            sortedList={sortedList}
            onCreate={handleCreate}
            onOpenDetail={navToDetail}
          />
        </div>
      )}

      {showDetail && detailId && (
        <AnnouncementDetailView
          announcementId={detailId}
          canManage={canManage}
          onBack={handleDetailBack}
          onEdit={() => openEdit(detailId, { fromDetail: true })}
          onDelete={handleDetailDelete}
        />
      )}

      {showEdit && (
        <AnnouncementEditView
          announcementId={editId === '__new__' ? null : editId}
          onBack={handleEditBack}
          onSaved={handleEditSave}
        />
      )}
    </>
  );
}

type ListBodyProps = {
  canManage: boolean;
  isMobile: boolean;
  effectiveViewMode: 'card' | 'list';
  viewMode: 'card' | 'list';
  setViewMode: (m: 'card' | 'list') => void;
  showSearch: boolean;
  setShowSearch: Dispatch<SetStateAction<boolean>>;
  searchFilter: AnnouncementSearchFilter;
  setSearchFilter: (f: AnnouncementSearchFilter) => void;
  draftFilter: AnnouncementSearchFilter;
  setDraftFilter: (f: AnnouncementSearchFilter) => void;
  resetFilters: () => void;
  sortedList: Announcement[];
  onCreate: () => void;
  onOpenDetail: (id: string) => void;
};

function AnnouncementListBody({
  canManage,
  isMobile,
  effectiveViewMode,
  viewMode,
  setViewMode,
  showSearch,
  setShowSearch,
  searchFilter,
  setSearchFilter,
  draftFilter,
  setDraftFilter,
  resetFilters,
  sortedList,
  onCreate,
  onOpenDetail,
}: ListBodyProps) {
  return (
    <div className="space-y-5 pb-24 md:pb-8 max-w-[900px] mx-auto">
      <PageHeaderBar
        title="공지사항"
        description="교회 소식과 중요한 안내를 확인하세요."
        action={
          canManage ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[14px] bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 touch-target"
            >
              <Plus className="w-4 h-4" />
              공지 등록
            </button>
          ) : undefined
        }
        mobileFab={canManage ? { label: '공지 등록', onClick: onCreate } : undefined}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!showSearch) setDraftFilter(searchFilter);
                setShowSearch(s => !s);
              }}
              className={`flex items-center gap-2 px-4 rounded-[14px] border text-sm font-semibold transition-all touch-target ${
                showSearch || isFilterActive(searchFilter)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={{ height: '44px' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              상세검색
              {countActiveFilters(searchFilter) > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  showSearch ? 'bg-white/20' : 'bg-primary-100 text-primary-700'
                }`}>
                  {countActiveFilters(searchFilter)}
                </span>
              )}
            </button>

            {!isMobile && (
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px]">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  title="카드 보기"
                  className={`flex items-center justify-center rounded-xl transition-all ${
                    viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ width: '36px', height: '36px' }}
                >
                  <LayoutGrid className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="목록 보기"
                  className={`flex items-center justify-center rounded-xl transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ width: '36px', height: '36px' }}
                >
                  <List className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && isMobile && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[24px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-bold text-gray-900">상세검색</h3>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target"
              >
                ✕
              </button>
            </div>
            <AnnouncementSearchPanel
              asSheet
              value={draftFilter}
              onChange={setDraftFilter}
              onApply={() => {
                setSearchFilter(draftFilter);
                setShowSearch(false);
              }}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      {showSearch && !isMobile && (
        <AnnouncementSearchPanel
          value={draftFilter}
          onChange={setDraftFilter}
          onApply={() => {
            setSearchFilter(draftFilter);
            setShowSearch(false);
          }}
          onReset={resetFilters}
        />
      )}

      {isFilterActive(searchFilter) && !showSearch && (
        <AnnouncementFilterChips
          filter={searchFilter}
          onChange={f => { setSearchFilter(f); setDraftFilter(f); }}
        />
      )}

      {sortedList.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="공지사항이 없습니다"
          description="아직 등록된 공지사항이 없어요."
        />
      ) : effectiveViewMode === 'list' ? (
        <div className="church-list">
          {sortedList.map(a => (
            <AnnListCard key={a.id} item={a} onClick={() => onOpenDetail(a.id)} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedList.map(a => (
            <AnnGridCard key={a.id} item={a} onClick={() => onOpenDetail(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnListCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const images = Array.isArray(item.images) ? item.images : [];
  const files = Array.isArray(item.files) ? item.files : [];
  const hasThumb = images.length > 0;
  const important = isImportantNotice(item);
  const preview = (item.content || '').split('\n').filter(Boolean)[0] ?? '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`church-list-row min-h-[88px] md:min-h-[110px] md:py-5
        ${important ? 'bg-amber-50/70 border-l-[3px] border-l-amber-500' : ''}`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        {hasThumb && (
          <div className="block md:hidden shrink-0 overflow-hidden bg-gray-100 rounded-[12px]"
            style={{ width: '96px', height: '72px' }}>
            <img src={images[0]} alt="" className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        {hasThumb && (
          <div className="hidden md:block shrink-0 overflow-hidden bg-gray-100 rounded-[12px]"
            style={{ width: '120px', height: '80px' }}>
            <img src={images[0]} alt="" className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {important && (
              <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-100 text-amber-700 text-[10px] rounded-full"
                style={{ height: '20px' }}>
                <Star className="w-2.5 h-2.5" /> 중요
              </span>
            )}
            {buildNoticeScopeBadges(item).map((b, i) => (
              <StatusBadge key={i} label={b.label} variant={b.variant} />
            ))}
          </div>
          <h3 className="font-bold text-gray-900 leading-snug line-clamp-2" style={{ fontSize: '15px' }}>
            {item.title}
          </h3>
          {preview && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-snug">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatAnnouncementDate(item) || item.date || ''}
            </span>
            <span className="text-[11px] text-gray-400">{item.author}</span>
            {(images.length > 0 || files.length > 0) && (
              <span className="text-[11px] text-gray-400 flex items-center gap-2 ml-auto">
                {images.length > 0 && (
                  <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" /> {images.length}</span>
                )}
                {files.length > 0 && (
                  <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" /> {files.length}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function AnnGridCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const images = Array.isArray(item.images) ? item.images : [];
  const hasThumb = images.length > 0;
  const important = isImportantNotice(item);
  const preview = (item.content || '').split('\n').filter(Boolean)[0] ?? '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border rounded-[20px] flex flex-col
        transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden
        ${important
          ? 'bg-amber-50/70 border-amber-200 border-l-4 border-l-amber-500'
          : 'bg-white border-gray-200'
        }`}
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      {hasThumb && (
        <div className="w-full overflow-hidden bg-gray-100" style={{ height: '140px' }}>
          <img src={images[0]} alt="" className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {important && (
            <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-100 text-amber-700 text-[10px] rounded-full"
              style={{ height: '20px' }}>
              <Star className="w-2.5 h-2.5" /> 중요
            </span>
          )}
          {buildNoticeScopeBadges(item).map((b, i) => (
            <StatusBadge key={i} label={b.label} variant={b.variant} />
          ))}
        </div>
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{item.title}</h3>
        {preview && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-snug">
            {preview}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-auto">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{formatAnnouncementDate(item) || item.date || ''}</span>
          <span className="ml-1">{item.author}</span>
        </div>
      </div>
    </button>
  );
}
