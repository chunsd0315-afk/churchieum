import { useState, useMemo, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  Megaphone, Star, Paperclip, ImageIcon, Plus,
} from 'lucide-react';
import { getAllAnnouncements, formatAnnouncementDate, type Announcement } from '../../services/announcementStorage';
import { buildNoticeScopeBadges, isAnnouncementVisible } from '../../services/announcementHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  PageHeaderBar,
  useToast,
  ContentListToolbar,
  CONTENT_CARD_CLASS,
  CONTENT_CARD_GRID_CLASS,
  CONTENT_LIST_SHELL_CLASS,
  readStoredViewMode,
  writeStoredViewMode,
  type ContentViewMode,
} from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';
import {
  AnnouncementSearchPanel,
  AnnouncementFilterChips,
  EMPTY_FILTER,
  isFilterActive,
  countDetailSettingFilters,
  announcementMatchesDetailFilter,
  getAnnouncementMyOrgSelectableIds,
  type AnnouncementSearchFilter,
} from '../../components/announcement/AnnouncementSearchPanel';
import { AnnouncementDetailView } from '../../components/announcement/AnnouncementDetailView';
import { AnnouncementEditView } from '../../components/announcement/AnnouncementEditView';
import { getAllOrganizations } from '../../services/organizationStorage';

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

  const [viewMode, setViewModeState] = useState<ContentViewMode>(() =>
    readStoredViewMode('announcement', 'card'),
  );
  const setViewMode = useCallback((mode: ContentViewMode) => {
    setViewModeState(mode);
    writeStoredViewMode('announcement', mode);
  }, []);
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

  const orgNameById = useMemo(
    () => new Map(getAllOrganizations().map(o => [o.id, o.name])),
    [],
  );

  const myOrgFallbackIds = useMemo(
    () => getAnnouncementMyOrgSelectableIds(user, searchFilter.showFullOrgTree),
    [user, searchFilter.showFullOrgTree],
  );

  const filtered = useMemo(
    () => visibleAnnouncements.filter(a =>
      announcementMatchesDetailFilter(a, searchFilter, myOrgFallbackIds, orgNameById),
    ),
    [visibleAnnouncements, searchFilter, myOrgFallbackIds, orgNameById],
  );

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
  viewMode: ContentViewMode;
  setViewMode: (m: ContentViewMode) => void;
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
  const setKeyword = (keyword: string) => {
    setSearchFilter({ ...searchFilter, keyword });
    setDraftFilter({ ...draftFilter, keyword });
  };

  const handleDraftChange = (f: AnnouncementSearchFilter) => {
    setDraftFilter(f);
    if (f.keyword !== searchFilter.keyword) {
      setSearchFilter({ ...searchFilter, keyword: f.keyword });
    }
  };

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
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              공지 작성
            </button>
          ) : undefined
        }
        mobileFab={canManage ? { label: '공지 작성', onClick: onCreate } : undefined}
      />

      <ContentListToolbar
        search={searchFilter.keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="키워드, 제목, 내용 검색"
        onOpenDetailSettings={() => {
          if (!showSearch) setDraftFilter(searchFilter);
          setShowSearch(s => !s);
        }}
        detailSettingsActive={showSearch}
        activeFilterCount={countDetailSettingFilters(searchFilter)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {showSearch && isMobile && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[24px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-bold text-gray-900">상세설정</h3>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <AnnouncementSearchPanel
              asSheet
              value={draftFilter}
              onChange={handleDraftChange}
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
          onChange={handleDraftChange}
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
      ) : viewMode === 'list' ? (
        <div className={CONTENT_LIST_SHELL_CLASS}>
          {sortedList.map(a => (
            <div key={a.id} className="px-4">
              <AnnListCard item={a} onClick={() => onOpenDetail(a.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className={CONTENT_CARD_GRID_CLASS}>
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
  const scopeBadges = buildNoticeScopeBadges(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 py-3.5 min-h-[88px] touch-target rounded-xl
        ${important ? 'bg-amber-50/70' : 'hover:bg-primary-50/40'} transition-colors`}
    >
      {hasThumb ? (
        <div className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={images[0]}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h3>
        {preview ? (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{preview}</p>
        ) : null}
        <p className="text-xs text-gray-400 mt-1">
          {item.author} · {formatAnnouncementDate(item) || item.date || ''}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {important ? (
            <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-100 text-amber-700 text-[10px] rounded-full h-5">
              <Star className="w-2.5 h-2.5" /> 중요
            </span>
          ) : null}
          {scopeBadges.map((b, i) => (
            <StatusBadge key={i} label={b.label} variant={b.variant} />
          ))}
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
    </button>
  );
}

function AnnGridCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const images = Array.isArray(item.images) ? item.images : [];
  const hasThumb = images.length > 0;
  const important = isImportantNotice(item);
  const preview = (item.content || '').split('\n').filter(Boolean)[0] ?? '';
  const scopeBadges = buildNoticeScopeBadges(item);
  const primaryBadge = important
    ? { label: '중요', className: 'bg-amber-100 text-amber-700' }
    : scopeBadges[0]
      ? { label: scopeBadges[0].label, className: 'bg-gray-100 text-gray-600' }
      : { label: '공지', className: 'bg-gray-100 text-gray-600' };

  return (
    <article className={CONTENT_CARD_CLASS}>
      {hasThumb ? (
        <button type="button" onClick={onClick} className="w-full text-left">
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            <img
              src={images[0]}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200 ease-out"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {images.length > 1 ? (
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-semibold backdrop-blur-sm">
                <ImageIcon className="w-3 h-3" />
                {images.length}
              </span>
            ) : null}
          </div>
        </button>
      ) : null}

      <div className="p-4 sm:p-5 space-y-2">
        <div className="flex items-start gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${primaryBadge.className}`}>
            {important ? <Star className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" /> : null}
            {primaryBadge.label}
          </span>
          {!important && scopeBadges.slice(1).map((b, i) => (
            <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
              {b.label}
            </span>
          ))}
        </div>

        <button type="button" onClick={onClick} className="w-full text-left touch-target">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-800 transition-colors">
            {item.title}
          </h3>
          {preview ? (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{preview}</p>
          ) : null}
          <p className="text-xs text-gray-500 mt-3">{item.author}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatAnnouncementDate(item) || item.date || ''}
          </p>
        </button>
      </div>
    </article>
  );
}
