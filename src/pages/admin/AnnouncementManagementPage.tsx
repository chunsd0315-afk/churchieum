import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PageHeaderBar, ChurchDropdownMenu, ChurchList, CHURCH_LIST_ROW_CLASS } from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';
import {
  Megaphone, Plus, Edit2, Trash2, Pin, Star,
  Calendar, ImageIcon, Paperclip,
  AlertTriangle, LayoutGrid, List,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getAllAnnouncements, updateAnnouncement, deleteAnnouncement,
  formatAnnouncementDate,
  type Announcement,
} from '../../services/announcementStorage';
import {
  getAllDistricts, getZones, getAllDepartments,
} from '../../services/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { buildNoticeScopeBadges, type ScopeBadge } from '../../services/announcementHelpers';
import { AnnouncementDetailView } from '../../components/announcement/AnnouncementDetailView';
import { AnnouncementEditView } from '../../components/announcement/AnnouncementEditView';

const HISTORY_KEY = 'churchieum_admin_ann_layer';
type AnnAdminHistory = { [HISTORY_KEY]: true; layer: 'detail' | 'edit'; id: string };
function readAdminAnnHistory(): AnnAdminHistory | null {
  const st = window.history.state as AnnAdminHistory | null;
  if (st?.[HISTORY_KEY] && (st.layer === 'detail' || st.layer === 'edit') && st.id) return st;
  return null;
}

const SELECT = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700';

export default function AnnouncementManagementPage() {
  const { l1, l2, dept } = useOrgSettings();
  const { isMobile } = useBreakpoint();
  const districts   = getAllDistricts().filter(d => d.is_active);
  const departments = getAllDepartments().filter(d => d.is_active);

  /* ─── List state ─────────────────────────────────────────────────── */
  const [data, setData]           = useState<Announcement[]>(() => getAllAnnouncements());
  const [viewMode, setViewMode]   = useState<'card' | 'list'>('list');
  const effectiveViewMode         = isMobile ? 'list' : viewMode;
  const [showSearch, setShowSearch] = useState(false);

  /* advanced filters */
  const [fDistrict, setFDistrict] = useState('');   // '' | 'church' | district.id
  const [fZone, setFZone]         = useState('');
  const [fDept, setFDept]         = useState('');
  const [fDate, setFDate]         = useState('');
  const [fText, setFText]         = useState('');

  /* zones for selected district */
  const zonesInDistrict = useMemo(() => {
    if (!fDistrict || fDistrict === 'church') return [];
    return getZones(fDistrict).filter(z => z.is_active);
  }, [fDistrict]);

  const resetFilters = () => {
    setFDistrict(''); setFZone(''); setFDept(''); setFDate(''); setFText('');
  };

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
  const filtered = useMemo(() => {
    return data
      .filter(a => {
        if (!fDistrict && !fDept) return true;
        if (fDistrict === 'church') return a.scope === 'all';
        if (fZone) {
          return (
            (a.scope === 'level2' && a.scopeId === fZone)
            || (a.scope === 'organizations' && a.sharedOrganizationIds?.includes(fZone))
          );
        }
        if (fDistrict) {
          return (
            (a.scope === 'level1' && a.scopeId === fDistrict)
            || (a.scope === 'organizations' && a.sharedOrganizationIds?.includes(fDistrict))
          );
        }
        if (fDept) {
          return (
            (a.scope === 'department' && a.scopeId === fDept)
            || (a.scope === 'organizations' && a.sharedOrganizationIds?.includes(fDept))
          );
        }
        return true;
      })
      .filter(a => !fDate || a.date === fDate)
      .filter(a => {
        if (!fText) return true;
        const q = fText.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
  }, [data, fDistrict, fZone, fDept, fDate, fText]);

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
            className="flex items-center gap-2 text-white font-bold rounded-btn transition-colors hover:bg-primary-600"
            style={{ background: '#2563EB', height: '44px', padding: '0 18px', fontSize: '14px', gap: '8px' }}>
            <Plus className="w-4 h-4" /> 공지 작성
          </button>
        }
        mobileFab={{ label: '공지사항 등록', onClick: openNew }}
      />

      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowSearch(s => !s)}
          className={`flex items-center gap-2 px-4 rounded-[14px] border text-sm font-semibold transition-all ${
            showSearch
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
          style={{ height: '44px' }}
        >
          <SlidersHorizontal style={{ width: '16px', height: '16px' }} />
          상세검색
        </button>

        {/* View mode toggle: PC only */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px]">
            <button
              onClick={() => setViewMode('card')}
              title="카드 보기"
              className={`flex items-center justify-center rounded-xl transition-all ${
                viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: '36px', height: '36px' }}
            >
              <LayoutGrid style={{ width: '18px', height: '18px' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="목록 보기"
              className={`flex items-center justify-center rounded-xl transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: '36px', height: '36px' }}
            >
              <List style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}
      </div>

      {/* Advanced search panel */}
      {showSearch && (
        <div className="bg-white border border-gray-200 rounded-[20px] p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 상위조직 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">{l1}</label>
              <select
                value={fDistrict}
                onChange={e => { setFDistrict(e.target.value); setFZone(''); }}
                className={SELECT}
              >
                <option value="">전체</option>
                <option value="church">교회공지</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* 하위조직 */}
            <div>
              <label className={`text-xs font-semibold mb-2 block ${
                fDistrict && fDistrict !== 'church' ? 'text-gray-600' : 'text-gray-300'
              }`}>{l2}</label>
              <select
                value={fZone}
                onChange={e => setFZone(e.target.value)}
                disabled={!fDistrict || fDistrict === 'church'}
                className={`${SELECT} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">전체</option>
                {zonesInDistrict.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* 부서 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">{dept}</label>
              <select value={fDept} onChange={e => setFDept(e.target.value)} className={SELECT}>
                <option value="">전체</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* 날짜 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">날짜</label>
              <input
                type="date" value={fDate}
                onChange={e => setFDate(e.target.value)}
                className={SELECT}
              />
            </div>

            {/* 검색어 */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-2 block">검색어</label>
              <input
                type="text" value={fText}
                onChange={e => setFText(e.target.value)}
                placeholder="제목 또는 내용을 검색하세요."
                className={SELECT}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={resetFilters}
              className="px-5 py-2 border border-gray-200 rounded-[14px] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="px-5 py-2 bg-primary-500 text-white rounded-[14px] text-sm font-bold hover:bg-primary-600 transition-colors"
            >
              조회
            </button>
          </div>
        </div>
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
              {effectiveViewMode === 'list' ? (
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
              {effectiveViewMode === 'list' ? (
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
  const hasThumb = ann.images.length > 0;
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
              src={ann.images[0]}
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
              src={ann.images[0]}
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
          <p className="text-sm text-gray-500 line-clamp-2 mb-1.5 md:mb-2">{ann.content.split('\n').filter(Boolean)[0]}</p>
          {/* Meta */}
          <div className="flex items-center gap-3 text-[12px] text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatAnnouncementDate(ann)}</span>
            <span>{ann.author}</span>
            {ann.images.length > 0 && (
              <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" />{ann.images.length}</span>
            )}
            {ann.files.length > 0 && (
              <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{ann.files.length}</span>
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
  const hasThumb = ann.images.length > 0;
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
            src={ann.images[0]}
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
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">{ann.content.split('\n').filter(Boolean)[0]}</p>
        {/* Author */}
        <p className="text-[12px] text-gray-400">{ann.author}</p>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 text-[12px] text-gray-400">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatAnnouncementDate(ann)}</span>
          {(ann.images.length > 0 || ann.files.length > 0) && (
            <span className="flex items-center gap-1">
              {ann.images.length > 0 && <><ImageIcon className="w-3 h-3" />{ann.images.length}</>}
              {ann.files.length > 0 && <><Paperclip className="w-3 h-3" />{ann.files.length}</>}
            </span>
          )}
        </div>
        <CardMenu ann={ann} onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} onNotify={onNotify} />
      </div>
    </div>
  );
}

