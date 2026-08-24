import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PageHeaderBar, ChurchDropdownMenu, ChurchList, CHURCH_LIST_ROW_CLASS, DetailSettingsButton, ViewModeToggle, readStoredViewMode, writeStoredViewMode, type ContentViewMode } from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';
import {
  Megaphone, Plus, Edit2, Trash2, Pin, Star,
  Calendar, ImageIcon, Paperclip, Bell, Search, X, AlertTriangle,
} from 'lucide-react';
import {
  getAllAnnouncements, updateAnnouncement, deleteAnnouncement,
  formatAnnouncementDate,
  type Announcement,
} from '../../services/announcementStorage';
import { buildNoticeScopeBadges, isAnnouncementVisible, type ScopeBadge } from '../../services/announcementHelpers';
import { AnnouncementDetailView } from '../../components/announcement/AnnouncementDetailView';
import { AnnouncementEditView } from '../../components/announcement/AnnouncementEditView';
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
import { getAllOrganizations } from '../../services/organizationStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const HISTORY_KEY = 'churchieum_admin_ann_layer';
type AnnAdminHistory = { [HISTORY_KEY]: true; layer: 'detail' | 'edit'; id: string };
function readAdminAnnHistory(): AnnAdminHistory | null {
  const st = window.history.state as AnnAdminHistory | null;
  if (st?.[HISTORY_KEY] && (st.layer === 'detail' || st.layer === 'edit') && st.id) return st;
  return null;
}

export default function AnnouncementManagementPage() {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();

  /* ─── List state ─────────────────────────────────────────────────── */
  const [data, setData]           = useState<Announcement[]>(() => getAllAnnouncements());
  const [viewMode, setViewModeState] = useState<ContentViewMode>(() =>
    readStoredViewMode('announcement', 'list'),
  );
  const setViewMode = (mode: ContentViewMode) => {
    setViewModeState(mode);
    writeStoredViewMode('announcement', mode);
  };
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);
  const [draftFilter, setDraftFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);

  /* ─── Form state ─────────────────────────────────────────────────── */
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Announcement | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [returnToDetailId, setReturnToDetailId] = useState<string | null>(null);
  const pendingSaveDetailIdRef = useRef<string | null>(null);
  const listScrollRef = useRef(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── Filter logic ─────────────────────────────────────────────── */
  const visibleData = useMemo(
    () => data.filter(a => isAnnouncementVisible(a, user)),
    [data, user],
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
    () => visibleData
      .filter(a => announcementMatchesDetailFilter(a, searchFilter, myOrgFallbackIds, orgNameById))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.date.localeCompare(a.date);
      }),
    [visibleData, searchFilter, myOrgFallbackIds, orgNameById],
  );

  const resetFilters = () => {
    setSearchFilter(EMPTY_FILTER);
    setDraftFilter(EMPTY_FILTER);
    setShowSearch(false);
  };

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

  const pinned  = filtered.filter(a => a.isPinned);
  const regular = filtered.filter(a => !a.isPinned);

  /* ─── CRUD handlers ─────────────────────────────────────────────── */
  const captureListScroll = useCallback(() => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  const restoreListScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: 'auto' });
    });
  }, []);

  const goToDetail = useCallback((id: string, opts?: { pushHistory?: boolean }) => {
    setShowForm(false);
    setEditing(null);
    setReturnToDetailId(null);
    setDetailId(id);
    if (opts?.pushHistory) {
      window.history.pushState(
        { [HISTORY_KEY]: true, layer: 'detail', id } satisfies AnnAdminHistory,
        '',
      );
    }
  }, []);

  const openNew = () => {
    setReturnToDetailId(null);
    setDetailId(null);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (ann: Announcement, opts?: { fromDetail?: boolean }) => {
    if (opts?.fromDetail) {
      setReturnToDetailId(ann.id);
      window.history.pushState(
        { [HISTORY_KEY]: true, layer: 'edit', id: ann.id } satisfies AnnAdminHistory,
        '',
      );
    } else {
      setReturnToDetailId(null);
      captureListScroll();
    }
    setEditing(ann);
    setShowForm(true);
  };

  const openDetail = (ann: Announcement) => {
    captureListScroll();
    goToDetail(ann.id, { pushHistory: true });
  };

  const handleBack = () => {
    if (!window.confirm('작성 중인 내용이 있을 수 있습니다.\n나가시겠습니까?')) return;
    const hist = readAdminAnnHistory();
    if (hist?.layer === 'edit') {
      window.history.back();
      return;
    }
    if (returnToDetailId) {
      const id = returnToDetailId;
      setShowForm(false);
      setEditing(null);
      setReturnToDetailId(null);
      setDetailId(id);
      return;
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleFormSaved = (savedId: string) => {
    setData(getAllAnnouncements());
    setShowForm(false);
    setEditing(null);

    const hist = readAdminAnnHistory();
    if (hist?.layer === 'edit' && savedId) {
      pendingSaveDetailIdRef.current = savedId;
      window.history.back();
      return;
    }
    if (returnToDetailId && savedId) {
      setReturnToDetailId(null);
      setDetailId(savedId);
      return;
    }
    setReturnToDetailId(null);
    goToDetail(savedId, { pushHistory: true });
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    setData(getAllAnnouncements());
    setDeleteConfirm(null);
    const hist = readAdminAnnHistory();
    if (hist?.layer === 'detail' || hist?.layer === 'edit') {
      window.history.replaceState({}, '');
    }
    setDetailId(null);
    setReturnToDetailId(null);
    setShowForm(false);
  };

  useEffect(() => {
    const onPopState = () => {
      const pendingSaveId = pendingSaveDetailIdRef.current;
      if (pendingSaveId) {
        pendingSaveDetailIdRef.current = null;
        setShowForm(false);
        setEditing(null);
        setReturnToDetailId(null);
        setDetailId(pendingSaveId);
        window.history.replaceState(
          { [HISTORY_KEY]: true, layer: 'detail', id: pendingSaveId } satisfies AnnAdminHistory,
          '',
        );
        return;
      }
      const hist = readAdminAnnHistory();
      if (hist?.layer === 'edit') {
        const ann = getAllAnnouncements().find(a => a.id === hist.id);
        if (ann) {
          setReturnToDetailId(ann.id);
          setEditing(ann);
          setShowForm(true);
          setDetailId(ann.id);
        }
        return;
      }
      if (hist?.layer === 'detail') {
        setShowForm(false);
        setEditing(null);
        setReturnToDetailId(null);
        setDetailId(hist.id);
        return;
      }
      setShowForm(false);
      setEditing(null);
      setReturnToDetailId(null);
      setDetailId(null);
      restoreListScroll();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreListScroll]);

  const togglePin = (id: string) => {
    const ann = data.find(a => a.id === id);
    if (!ann) return;
    updateAnnouncement(id, { isPinned: !ann.isPinned });
    setData(getAllAnnouncements());
  };

  const toggleImportant = (id: string) => {
    const ann = data.find(a => a.id === id);
    if (!ann) return;
    updateAnnouncement(id, { isImportant: !ann.isImportant });
    setData(getAllAnnouncements());
  };

  /* ── 상세 전체 페이지 (은혜와 기도와 동일) ── */
  if (detailId && !showForm) {
    return (
      <>
        <AnnouncementDetailView
          announcementId={detailId}
          canManage
          onBack={() => {
            const hist = readAdminAnnHistory();
            if (hist?.layer === 'detail') {
              window.history.back();
              return;
            }
            setDetailId(null);
            restoreListScroll();
          }}
          onEdit={() => {
            const ann = data.find(a => a.id === detailId) ?? getAllAnnouncements().find(a => a.id === detailId);
            if (ann) openEdit(ann, { fromDetail: true });
          }}
          onDelete={() => {
            setData(getAllAnnouncements());
            const hist = readAdminAnnHistory();
            if (hist?.layer === 'detail' || hist?.layer === 'edit') {
              window.history.replaceState({}, '');
            }
            setDetailId(null);
            restoreListScroll();
          }}
        />
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">공지 삭제</p>
                  <p className="text-sm text-gray-500">이 공지를 삭제하시겠습니까?</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">취소</button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">삭제</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── 작성/수정 화면 ── */
  if (showForm) {
    return (
      <AnnouncementEditView
        announcementId={editing?.id}
        onBack={handleBack}
        onSaved={handleFormSaved}
      />
    );
  }

  /* ══════════════════════════════════════════════
     목록 화면
  ══════════════════════════════════════════════ */
  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <PageHeaderBar
        title="공지사항"
        description="교회 소식과 안내를 확인하세요."
        action={
          <button onClick={openNew}
            className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target">
            <Plus className="w-4 h-4" /> 공지 작성
          </button>
        }
        mobileFab={{ label: '공지사항 등록', onClick: openNew }}
      />

      {/* Toolbar: 검색 + 상세설정 + 보기전환 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={searchFilter.keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="키워드, 제목, 내용 검색"
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 text-sm bg-white min-h-[48px] focus:border-primary-400 focus:outline-none"
          />
          {searchFilter.keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 touch-target"
              aria-label="검색어 지우기"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DetailSettingsButton
            onClick={() => {
              if (!showSearch) setDraftFilter(searchFilter);
              setShowSearch(s => !s);
            }}
            active={showSearch}
            activeCount={countDetailSettingFilters(searchFilter)}
            aria-expanded={showSearch}
            className="flex-1 sm:flex-none"
          />
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

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

      {/* Announcement list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="공지사항이 없습니다"
          description="등록된 공지사항이 없거나 필터 조건에 맞는 글이 없습니다."
        />
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-red-400" /> 상단 고정 공지
              </p>
              {viewMode === 'list' ? (
                <ChurchList>
                  {pinned.map(ann => (
                    <AnnListCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => openDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </ChurchList>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinned.map(ann => (
                    <AnnGridCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => openDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </div>
              )}
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> 일반 공지
                </p>
              )}
              {viewMode === 'list' ? (
                <ChurchList>
                  {regular.map(ann => (
                    <AnnListCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => openDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </ChurchList>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regular.map(ann => (
                    <AnnGridCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => openDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">공지 삭제</p>
                <p className="text-sm text-gray-500">이 공지를 삭제하시겠습니까?</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div
            className="flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white text-sm font-semibold shadow-xl animate-fade-in"
            style={{ borderRadius: '14px', whiteSpace: 'nowrap' }}
          >
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Card action menu ───────────────────────────────────────────────────── */
function CardMenu({ ann, onEdit, onDelete, onTogglePin, onNotify }: {
  ann: Announcement;
  onEdit: () => void; onDelete: () => void;
  onTogglePin: () => void; onNotify: () => void;
}) {
  return (
    <ChurchDropdownMenu
      items={[
        {
          label: '수정하기',
          icon: <Edit2 style={{ width: '15px', height: '15px' }} />,
          onClick: onEdit,
        },
        {
          label: ann.isPinned ? '상위고정 해제' : '상위고정',
          icon: <Pin style={{ width: '15px', height: '15px' }} />,
          onClick: onTogglePin,
        },
        {
          label: '알림 보내기',
          icon: <Bell style={{ width: '15px', height: '15px' }} />,
          onClick: onNotify,
        },
        {
          label: '삭제하기',
          icon: <Trash2 style={{ width: '15px', height: '15px' }} />,
          danger: true,
          onClick: onDelete,
        },
      ]}
    />
  );
}

/* ─── Shared action buttons ──────────────────────────────────────────────── */
type CardActions = {
  ann: Announcement;
  badges: ScopeBadge[];
  onView: () => void; onEdit: () => void; onDelete: () => void;
  onTogglePin: () => void; onToggleImportant: () => void;
  onNotify: () => void;
};

/* ─── List Card (default) ────────────────────────────────────────────────── */
function AnnListCard({ ann, badges, onView, onEdit, onDelete, onTogglePin, onToggleImportant: _onToggleImportant, onNotify }: CardActions) {
  const images = Array.isArray(ann.images) ? ann.images : [];
  const files = Array.isArray(ann.files) ? ann.files : [];
  const hasThumb = images.length > 0;
  const preview = (ann.content || '').split('\n').filter(Boolean)[0] ?? '';
  return (
    <div
      className={`${CHURCH_LIST_ROW_CLASS} cursor-pointer ${
        ann.isPinned ? 'border-l-4 border-l-red-400' : ''
      }`}
    >
      <div className="flex items-start gap-3 md:gap-4 min-h-[88px] md:min-h-[110px]">
        {/* Mobile thumbnail: 96×72 side */}
        {hasThumb && (
          <div
            className="block md:hidden shrink-0 overflow-hidden bg-gray-100 rounded-[12px] cursor-pointer"
            style={{ width: '96px', height: '72px' }}
            onClick={onView}
          >
            <img
              src={images[0]}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        {/* Desktop thumbnail: 120×80 side */}
        {hasThumb && (
          <div
            className="hidden md:block shrink-0 overflow-hidden bg-gray-100 rounded-[12px] cursor-pointer"
            style={{ width: '120px', height: '80px' }}
            onClick={onView}
          >
            <img
              src={images[0]}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0" onClick={onView}>
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-1.5 md:mb-2 flex-wrap">
            {badges.map((b, i) => (
              <StatusBadge key={i} label={b.label} variant={b.variant} />
            ))}
            {ann.isPinned && (
              <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-red-50 text-red-500 border border-red-200 text-[11px]"
                style={{ height: '22px', borderRadius: '999px' }}>
                <Pin className="w-2.5 h-2.5" /> 고정
              </span>
            )}
            {ann.isImportant && (
              <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-amber-50 text-amber-500 border border-amber-200 text-[11px]"
                style={{ height: '22px', borderRadius: '999px' }}>
                <Star className="w-2.5 h-2.5" /> 중요
              </span>
            )}
          </div>
          {/* Title */}
          <h4 className="font-bold text-gray-900 mb-1 leading-tight line-clamp-2" style={{ fontSize: '15px' }}>{ann.title}</h4>
          {/* Summary */}
          {preview && <p className="text-sm text-gray-500 line-clamp-2 mb-1.5 md:mb-2">{preview}</p>}
          {/* Meta */}
          <div className="flex items-center gap-3 text-[12px] text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatAnnouncementDate(ann)}</span>
            <span>{ann.author}</span>
            {images.length > 0 && (
              <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" />{images.length}</span>
            )}
            {files.length > 0 && (
              <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{files.length}</span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="shrink-0">
          <CardMenu ann={ann} onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} onNotify={onNotify} />
        </div>
      </div>
    </div>
  );
}

/* ─── Grid Card ──────────────────────────────────────────────────────────── */
function AnnGridCard({ ann, badges, onView, onEdit, onDelete, onTogglePin, onNotify }: CardActions) {
  const images = Array.isArray(ann.images) ? ann.images : [];
  const files = Array.isArray(ann.files) ? ann.files : [];
  const hasThumb = images.length > 0;
  const preview = (ann.content || '').split('\n').filter(Boolean)[0] ?? '';
  return (
    <div
      className={`bg-white border rounded-[20px] flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
        ann.isPinned ? 'border-l-4 border-l-red-400 border-t-gray-200 border-r-gray-200 border-b-gray-200' : 'border-gray-200'
      }`}
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      {/* Top thumbnail */}
      {hasThumb && (
        <div
          className="w-full shrink-0 overflow-hidden bg-gray-100 cursor-pointer"
          style={{ height: '140px' }}
          onClick={onView}
        >
          <img
            src={images[0]}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className={`flex-1 cursor-pointer ${hasThumb ? 'p-4' : 'p-5'}`} onClick={onView}>
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {badges.map((b, i) => (
            <StatusBadge key={i} label={b.label} variant={b.variant} />
          ))}
          {ann.isPinned && (
            <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-red-50 text-red-500 border border-red-200 text-[11px]"
              style={{ height: '22px', borderRadius: '999px' }}>
              <Pin className="w-2.5 h-2.5" /> 고정
            </span>
          )}
        </div>
        {/* Title */}
        <h4 className="font-bold text-gray-900 mb-2 leading-snug line-clamp-2" style={{ fontSize: '15px' }}>{ann.title}</h4>
        {/* Summary */}
        {preview && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">{preview}</p>}
        {/* Author */}
        <p className="text-[12px] text-gray-400">{ann.author}</p>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 text-[12px] text-gray-400">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatAnnouncementDate(ann)}</span>
          {(images.length > 0 || files.length > 0) && (
            <span className="flex items-center gap-1">
              {images.length > 0 && <><ImageIcon className="w-3 h-3" />{images.length}</>}
              {files.length > 0 && <><Paperclip className="w-3 h-3" />{files.length}</>}
            </span>
          )}
        </div>
        <CardMenu ann={ann} onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} onNotify={onNotify} />
      </div>
    </div>
  );
}

