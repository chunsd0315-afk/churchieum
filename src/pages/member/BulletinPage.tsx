/**
 * 주보 — 최고관리자·교역자·성도 공통 목록 UI
 * 검색 / 상세설정 / 카드·목록보기 / 상세 / 권한별 작성·수정·삭제
 */

import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react';
import {
  FileText, Calendar, Plus, Edit2, Trash2, MoreVertical, Loader,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  PageHeaderBar,
  ContentListToolbar,
  CONTENT_CARD_CLASS,
  CONTENT_LIST_SHELL_CLASS,
  readStoredViewMode,
  writeStoredViewMode,
  ChurchDropdownMenu,
  ConfirmDialog,
  type ContentViewMode,
} from '../../components/common/ui';
import EmptyState from '../../components/layout/EmptyState';
import ContentEditorLayout from '../../components/layout/ContentEditorLayout';
import {
  BulletinSearchPanel,
  BulletinFilterChips,
  EMPTY_BULLETIN_FILTER,
  isBulletinFilterActive,
  countBulletinDetailFilters,
  bulletinMatchesFilter,
  type BulletinSearchFilter,
} from '../../components/bulletin/BulletinSearchPanel';
import {
  BulletinDetailView,
  type BulletinItem,
} from '../../components/bulletin/BulletinDetailView';

type Bulletin = BulletinItem & {
  created_at?: string;
};

type FormData = {
  title: string;
  description: string;
  bulletin_date: string;
  pdf_url: string;
  image_url: string;
};

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  bulletin_date: new Date().toISOString().split('T')[0],
  pdf_url: '',
  image_url: '',
};

const DEMO: Bulletin[] = [
  { id: '1', title: '2026년 6월 4주차 주보', description: '성령 강림 후 제5주 주일예배 주보', bulletin_date: '2026-06-22', view_count: 128, is_archived: false },
  { id: '2', title: '2026년 6월 3주차 주보', description: '성령 강림 후 제4주 주일예배 주보', bulletin_date: '2026-06-15', view_count: 98, is_archived: false },
  { id: '3', title: '2026년 6월 2주차 주보', description: '성령 강림 후 제3주 주일예배 주보', bulletin_date: '2026-06-08', view_count: 115, is_archived: false },
  { id: '4', title: '2026년 6월 1주차 주보', description: '성령 강림 후 제2주 주일예배 주보', bulletin_date: '2026-06-01', view_count: 143, is_archived: false },
  { id: '5', title: '2026년 5월 4주차 주보', description: '성령 강림 후 제1주 주일예배 주보', bulletin_date: '2026-05-25', view_count: 201, is_archived: false },
  { id: '6', title: '2026년 5월 3주차 주보', description: '부활절 후 제7주 주일예배 주보', bulletin_date: '2026-05-18', view_count: 187, is_archived: false },
  { id: '7', title: '2026년 5월 2주차 주보', description: '부활절 후 제6주 주일예배 주보', bulletin_date: '2026-05-11', view_count: 165, is_archived: false },
  { id: '8', title: '2026년 5월 1주차 주보', description: '부활절 후 제5주 주일예배 주보', bulletin_date: '2026-05-04', view_count: 212, is_archived: false },
];

function formatDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-');
  if (!y || !m || !day) return d;
  return `${y}.${m}.${day}`;
}

function isFormDirty(form: FormData): boolean {
  return !!(form.title.trim() || form.pdf_url || form.image_url);
}

export default function BulletinPage() {
  const { isPastor, isAdmin } = useAuth();
  const { isMobile } = useBreakpoint();
  const canManage = isPastor || isAdmin;

  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bulletin | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [toast, setToast] = useState('');

  const [viewMode, setViewModeState] = useState<ContentViewMode>(() =>
    readStoredViewMode('bulletin', 'card'),
  );
  const setViewMode = (mode: ContentViewMode) => {
    setViewModeState(mode);
    writeStoredViewMode('bulletin', mode);
  };

  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState<BulletinSearchFilter>(EMPTY_BULLETIN_FILTER);
  const [draftFilter, setDraftFilter] = useState<BulletinSearchFilter>(EMPTY_BULLETIN_FILTER);

  const listScrollRef = useRef(0);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const pdfUpload = useFileUpload({ bucket: 'bulletins', folder: 'pdf', maxSizeMB: 50 });
  const imgUpload = useFileUpload({ bucket: 'bulletins', folder: 'covers', maxSizeMB: 10 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('bulletin_date', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setBulletins(data as Bulletin[]);
      } else {
        setBulletins(DEMO);
      }
    } catch {
      setBulletins(DEMO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const captureListScroll = useCallback(() => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  const restoreListScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: 'auto' });
    });
  }, []);

  const filtered = useMemo(
    () =>
      bulletins
        .filter(b => bulletinMatchesFilter(b, searchFilter))
        .sort((a, b) => (b.bulletin_date || '').localeCompare(a.bulletin_date || '')),
    [bulletins, searchFilter],
  );

  const detailBulletin = detailId
    ? bulletins.find(b => b.id === detailId) ?? null
    : null;

  const setKeyword = (keyword: string) => {
    setSearchFilter({ ...searchFilter, keyword });
    setDraftFilter({ ...draftFilter, keyword });
  };

  const handleDraftChange = (f: BulletinSearchFilter) => {
    setDraftFilter(f);
    if (f.keyword !== searchFilter.keyword) {
      setSearchFilter({ ...searchFilter, keyword: f.keyword });
    }
  };

  const resetFilters = () => {
    setSearchFilter(EMPTY_BULLETIN_FILTER);
    setDraftFilter(EMPTY_BULLETIN_FILTER);
    setShowSearch(false);
  };

  const openDetail = (b: Bulletin) => {
    captureListScroll();
    setDetailId(b.id);
    void (async () => {
      try {
        await supabase
          .from('bulletins')
          .update({ view_count: (b.view_count || 0) + 1 })
          .eq('id', b.id);
        setBulletins(prev =>
          prev.map(x =>
            x.id === b.id ? { ...x, view_count: (x.view_count || 0) + 1 } : x,
          ),
        );
      } catch {
        /* ignore */
      }
    })();
  };

  const openNew = () => {
    if (!canManage) return;
    setDetailId(null);
    setEditing(null);
    setForm({ ...EMPTY_FORM, bulletin_date: new Date().toISOString().split('T')[0] });
    setImagePreview('');
    setShowForm(true);
  };

  const openEdit = (b: Bulletin) => {
    if (!canManage) return;
    setEditing(b);
    setForm({
      title: b.title,
      description: b.description || '',
      bulletin_date: b.bulletin_date,
      pdf_url: b.pdf_url || '',
      image_url: b.image_url || '',
    });
    setImagePreview(b.image_url || '');
    setShowForm(true);
  };

  const handleBackFromForm = () => {
    if (isFormDirty(form) && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canManage || saving) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        bulletin_date: form.bulletin_date,
        pdf_url: form.pdf_url || null,
        image_url: form.image_url || null,
      };
      if (editing) {
        await supabase.from('bulletins').update(payload).eq('id', editing.id);
        showToast('주보가 수정되었습니다');
      } else {
        await supabase
          .from('bulletins')
          .insert({ ...payload, view_count: 0, is_archived: false });
        showToast('주보가 등록되었습니다');
      }
      setShowForm(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    try {
      await supabase.from('bulletins').delete().eq('id', id);
      setDeleteConfirm(null);
      setDetailId(null);
      showToast('삭제되었습니다');
      await fetchData();
      restoreListScroll();
    } catch {
      showToast('삭제에 실패했습니다.');
    }
  };

  /* ── Form ── */
  if (showForm && canManage) {
    return (
      <ContentEditorLayout
        title={editing ? '주보 수정' : '주보 작성'}
        onBack={handleBackFromForm}
        saveButton={
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving || !form.title.trim()}
            className="inline-flex items-center gap-1.5 h-12 px-5 bg-primary-500 hover:bg-primary-600 text-[#1A1A1A] rounded-[18px] text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : editing ? '수정' : '등록'}
          </button>
        }
      >
        <div className="space-y-4 max-w-[900px] mx-auto">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">주보 날짜 *</label>
            <input
              type="date"
              value={form.bulletin_date}
              onChange={e => setForm({ ...form, bulletin_date: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="2026년 8월 4주차 주보"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">설명 (선택)</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="주일예배 주보"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">PDF</label>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await pdfUpload.upload(file);
                if (url) setForm(f => ({ ...f, pdf_url: url }));
                e.target.value = '';
              }}
            />
            {form.pdf_url ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">PDF 등록됨</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, pdf_url: '' }))}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  제거
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfUpload.uploading}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors disabled:opacity-50 min-h-[48px]"
              >
                {pdfUpload.uploading ? '업로드 중...' : 'PDF 선택 (최대 50MB)'}
              </button>
            )}
            {pdfUpload.error && <p className="text-xs text-red-500 mt-1">{pdfUpload.error}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">표지 이미지</label>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await imgUpload.upload(file);
                if (url) {
                  setForm(f => ({ ...f, image_url: url }));
                  setImagePreview(url);
                }
                e.target.value = '';
              }}
            />
            {imagePreview ? (
              <div className="relative mt-1 w-24 h-32 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="표지"
                  className="w-full h-full object-cover"
                  onError={() => setImagePreview('')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setForm(f => ({ ...f, image_url: '' }));
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={imgUpload.uploading}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors disabled:opacity-50 min-h-[48px]"
              >
                {imgUpload.uploading ? '업로드 중...' : '표지 이미지 선택 (최대 10MB)'}
              </button>
            )}
            {imgUpload.error && <p className="text-xs text-red-500 mt-1">{imgUpload.error}</p>}
          </div>
        </div>
      </ContentEditorLayout>
    );
  }

  /* ── Detail ── */
  if (detailBulletin && !showForm) {
    return (
      <>
        <BulletinDetailView
          bulletin={detailBulletin}
          canManage={canManage}
          onBack={() => {
            setDetailId(null);
            restoreListScroll();
          }}
          onEdit={() => openEdit(detailBulletin)}
          onDelete={() => setDeleteConfirm(detailBulletin.id)}
        />
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          title="주보 삭제"
          description="이 작업은 되돌릴 수 없습니다."
          variant="danger"
        />
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
            {toast}
          </div>
        )}
      </>
    );
  }

  /* ── List ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 md:pb-8 max-w-[900px] mx-auto">
      <PageHeaderBar
        title="주보"
        description="교회의 주보를 확인하세요."
        action={
          canManage ? (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              주보 작성
            </button>
          ) : undefined
        }
        mobileFab={canManage ? { label: '주보 작성', onClick: openNew } : undefined}
      />

      <ContentListToolbar
        search={searchFilter.keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="키워드, 주보 검색"
        onOpenDetailSettings={() => {
          if (!showSearch) setDraftFilter(searchFilter);
          setShowSearch(s => !s);
        }}
        detailSettingsActive={showSearch}
        activeFilterCount={countBulletinDetailFilters(searchFilter)}
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
            <BulletinSearchPanel
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
        <BulletinSearchPanel
          value={draftFilter}
          onChange={handleDraftChange}
          onApply={() => {
            setSearchFilter(draftFilter);
            setShowSearch(false);
          }}
          onReset={resetFilters}
        />
      )}

      {isBulletinFilterActive(searchFilter) && !showSearch && (
        <BulletinFilterChips
          filter={searchFilter}
          onChange={f => {
            setSearchFilter(f);
            setDraftFilter(f);
          }}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="주보가 없습니다"
          description="등록된 주보가 없거나 검색 조건에 맞는 주보가 없습니다."
        />
      ) : viewMode === 'list' ? (
        <div className={CONTENT_LIST_SHELL_CLASS}>
          {filtered.map(b => (
            <div key={b.id} className="px-4">
              <BulletinListRow
                bulletin={b}
                canManage={canManage}
                onOpen={() => openDetail(b)}
                onEdit={() => openEdit(b)}
                onDelete={() => setDeleteConfirm(b.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(b => (
            <BulletinGridCard
              key={b.id}
              bulletin={b}
              canManage={canManage}
              onOpen={() => openDetail(b)}
              onEdit={() => openEdit(b)}
              onDelete={() => setDeleteConfirm(b.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="주보 삭제"
        description="이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}

function BulletinListRow({
  bulletin,
  canManage,
  onOpen,
  onEdit,
  onDelete,
}: {
  bulletin: Bulletin;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 group">
      <button
        type="button"
        onClick={onOpen}
        className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-gray-100 touch-target"
      >
        {bulletin.image_url ? (
          <img src={bulletin.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <FileText className="w-7 h-7 text-primary-200" />
          </div>
        )}
      </button>
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left touch-target">
        <h4 className="font-semibold text-gray-900 text-sm truncate">{bulletin.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">주보</p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(bulletin.bulletin_date)}
        </p>
      </button>
      {canManage && (
        <ChurchDropdownMenu
          trigger={
            <button
              type="button"
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target"
              aria-label="더보기"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            { label: '수정', icon: <Edit2 className="w-4 h-4" />, onClick: onEdit },
            { label: '삭제', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, danger: true },
          ]}
        />
      )}
    </div>
  );
}

function BulletinGridCard({
  bulletin,
  canManage,
  onOpen,
  onEdit,
  onDelete,
}: {
  bulletin: Bulletin;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={CONTENT_CARD_CLASS}>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {bulletin.image_url ? (
            <img
              src={bulletin.image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
              <FileText className="w-10 h-10 text-primary-200" />
            </div>
          )}
        </div>
      </button>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
            주보
          </span>
          {canManage && (
            <div onClick={e => e.stopPropagation()}>
              <ChurchDropdownMenu
                trigger={
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 touch-target shrink-0"
                    aria-label="더보기"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                }
                items={[
                  { label: '수정', icon: <Edit2 className="w-4 h-4" />, onClick: onEdit },
                  { label: '삭제', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, danger: true },
                ]}
              />
            </div>
          )}
        </div>

        <button type="button" onClick={onOpen} className="w-full text-left">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-800 transition-colors">
            {bulletin.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1.5">{formatDate(bulletin.bulletin_date)}</p>
        </button>
      </div>
    </article>
  );
}
