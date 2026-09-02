/**
 * 앨범 — 사진 중심 카드형 목록 (공지·주보와 동일 검색/상세설정/보기전환 UX)
 */

import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react';
import { Image, Plus, Search, X, Loader } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { canWriteContent, getAvailableScopes, type ContentScope } from '../../services/permissions';
import { getDistricts, getZones, getDepartments } from '../../services/orgData';
import { getAllOrganizations } from '../../services/organizationStorage';
import {
  PageHeaderBar,
  DetailSettingsButton,
  ViewModeToggle,
  readStoredViewMode,
  writeStoredViewMode,
  ConfirmDialog,
  type ContentViewMode,
} from '../../components/common/ui';
import EmptyState from '../../components/layout/EmptyState';
import ContentEditorLayout from '../../components/layout/ContentEditorLayout';
import {
  AnnouncementSearchPanel,
  AnnouncementFilterChips,
  EMPTY_FILTER,
  isFilterActive,
  countDetailSettingFilters,
  getAnnouncementMyOrgSelectableIds,
  type AnnouncementSearchFilter,
} from '../../components/announcement/AnnouncementSearchPanel';
import { AlbumDetailView } from '../../components/album/AlbumDetailView';
import { AlbumGridCard, AlbumListRow } from '../../components/album/AlbumListViews';
import {
  DEMO_ALBUMS,
  DEMO_PHOTOS,
  mergeAlbumList,
  saveAlbumScope,
  isAlbumVisible,
  albumMatchesDetailFilter,
  countMediaFromPhotos,
  type AlbumItem,
  type AlbumPhoto,
} from '../../services/albumHelpers';

const HISTORY_KEY = 'churchieum_album_layer';

type AlbumHistory = {
  [HISTORY_KEY]: true;
  layer: 'detail';
  id: string;
};

function readAlbumHistory(): AlbumHistory | null {
  const s = window.history.state as AlbumHistory | null;
  if (s?.[HISTORY_KEY] && s.layer === 'detail' && s.id) return s;
  return null;
}

const CAT_LABELS = ['교구', '부서', '교회학교', '행사'];

const SCOPE_TYPE_LABEL: Record<string, string> = {
  all: '전체 성도',
  district: '특정 교구',
  zone: '특정 구역',
  department: '특정 부서',
};

type AlbumForm = {
  title: string;
  description: string;
  event_date: string;
  category: string;
  scope: ContentScope;
};

const EMPTY_FORM: AlbumForm = {
  title: '',
  description: '',
  event_date: new Date().toISOString().split('T')[0],
  category: '행사',
  scope: { type: 'all', name: '전체 성도' },
};

async function enrichAlbumCounts(albums: AlbumItem[]): Promise<AlbumItem[]> {
  try {
    const { data: photos } = await supabase.from('photos').select('album_id, url');
    if (!photos?.length) return albums;
    const counts = new Map<string, { photo_count: number; video_count: number }>();
    for (const p of photos) {
      const cur = counts.get(p.album_id) ?? { photo_count: 0, video_count: 0 };
      const media = countMediaFromPhotos([{ url: p.url }]);
      cur.photo_count += media.photo_count;
      cur.video_count += media.video_count;
      counts.set(p.album_id, cur);
    }
    return albums.map(a => {
      const c = counts.get(a.id);
      if (!c) return a;
      return { ...a, photo_count: c.photo_count, video_count: c.video_count };
    });
  } catch {
    return albums;
  }
}

export default function AlbumPage() {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const canManage = canWriteContent(user);

  const orgData = { districts: getDistricts(), zones: getZones(), departments: getDepartments() };
  const availableScopes = getAvailableScopes(user, orgData);

  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AlbumItem | null>(null);
  const [form, setForm] = useState<AlbumForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const [viewMode, setViewModeState] = useState<ContentViewMode>(() =>
    readStoredViewMode('album', 'card'),
  );
  const setViewMode = (mode: ContentViewMode) => {
    setViewModeState(mode);
    writeStoredViewMode('album', mode);
  };

  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);
  const [draftFilter, setDraftFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);

  const listScrollRef = useRef(0);

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of getAllOrganizations()) map.set(o.id, o.name);
    return map;
  }, []);

  const myOrgIds = useMemo(
    () => getAnnouncementMyOrgSelectableIds(user, searchFilter.showFullOrgTree),
    [user, searchFilter.showFullOrgTree],
  );

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const base = mergeAlbumList(data && data.length > 0 ? (data as AlbumItem[]) : DEMO_ALBUMS);
      setAlbums(await enrichAlbumCounts(base));
    } catch {
      setAlbums(await enrichAlbumCounts(mergeAlbumList(DEMO_ALBUMS)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const captureListScroll = useCallback(() => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  const restoreListScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: 'auto' });
    });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const hist = readAlbumHistory();
      if (hist?.layer === 'detail') {
        setDetailId(hist.id);
        setShowForm(false);
        return;
      }
      setDetailId(null);
      setShowForm(false);
      restoreListScroll();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreListScroll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const visibleAlbums = useMemo(
    () => albums.filter(a => isAlbumVisible(user, a)),
    [albums, user],
  );

  const filtered = useMemo(
    () =>
      visibleAlbums
        .filter(a => albumMatchesDetailFilter(a, searchFilter, myOrgIds, orgNameById))
        .sort((a, b) => (b.event_date || b.created_at).localeCompare(a.event_date || a.created_at)),
    [visibleAlbums, searchFilter, myOrgIds, orgNameById],
  );

  const detailAlbum = detailId ? albums.find(a => a.id === detailId) ?? null : null;

  const loadPhotos = useCallback(async (albumId: string) => {
    setPhotosLoading(true);
    try {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .order('sort_order')
        .order('created_at');
      setPhotos(
        data && data.length > 0
          ? data
          : DEMO_PHOTOS.filter(p => p.album_id === albumId).length > 0
            ? DEMO_PHOTOS.filter(p => p.album_id === albumId)
            : albumId.startsWith('d') ? DEMO_PHOTOS : [],
      );
    } catch {
      setPhotos(DEMO_PHOTOS);
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (detailId) loadPhotos(detailId);
    else setPhotos([]);
  }, [detailId, loadPhotos]);

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

  const resetFilters = () => {
    setSearchFilter(EMPTY_FILTER);
    setDraftFilter(EMPTY_FILTER);
    setShowSearch(false);
  };

  const openDetail = (album: AlbumItem) => {
    captureListScroll();
    setDetailId(album.id);
    window.history.pushState(
      { [HISTORY_KEY]: true, layer: 'detail', id: album.id } satisfies AlbumHistory,
      '',
    );
  };

  const openNew = () => {
    if (!canManage) return;
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      scope: availableScopes[0] ?? { type: 'all', name: '전체 성도' },
    });
    setShowForm(true);
  };

  const openEdit = (album: AlbumItem) => {
    if (!canManage) return;
    const merged = mergeAlbumList([album])[0];
    setEditing(merged);
    setForm({
      title: merged.title,
      description: merged.description || '',
      event_date: merged.event_date || new Date().toISOString().split('T')[0],
      category: merged.category || '행사',
      scope: {
        type: merged.visibility_type ?? 'all',
        id: merged.scope_id,
        name: merged.scope_name,
      },
    });
    setDetailId(null);
    setShowForm(true);
  };

  const handleFormBack = () => {
    if (form.title.trim() && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canManage || saving || !form.title.trim()) return;
    setSaving(true);

    const visibilityMap: Record<string, string> = {
      all: '전체성도',
      district: '교구별',
      zone: '교구별',
      department: '부서별',
    };

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      category: form.category,
      visibility: visibilityMap[form.scope.type] ?? '전체성도',
    };

    try {
      if (editing) {
        await supabase.from('albums').update(payload).eq('id', editing.id);
        saveAlbumScope(editing.id, {
          visibility_type: form.scope.type,
          scope_id: form.scope.id,
          scope_name: form.scope.name,
        });
        showToast('앨범이 수정되었습니다');
      } else {
        const { data } = await supabase.from('albums').insert(payload).select().single();
        if (data) {
          saveAlbumScope(data.id, {
            visibility_type: form.scope.type,
            scope_id: form.scope.id,
            scope_name: form.scope.name,
          });
        } else {
          const local: AlbumItem = {
            id: `local-${Date.now()}`,
            ...payload,
            description: payload.description ?? undefined,
            event_date: payload.event_date ?? undefined,
            created_at: new Date().toISOString().slice(0, 10),
            author_name: user?.name,
            author_position: user?.position,
          };
          saveAlbumScope(local.id, {
            visibility_type: form.scope.type,
            scope_id: form.scope.id,
            scope_name: form.scope.name,
          });
          setAlbums(prev => [mergeAlbumList([local])[0], ...prev]);
        }
        showToast('앨범이 등록되었습니다');
      }
      setShowForm(false);
      setEditing(null);
      await fetchAlbums();
    } catch {
      if (!editing) {
        const local: AlbumItem = {
          id: `local-${Date.now()}`,
          title: form.title.trim(),
          description: form.description || undefined,
          event_date: form.event_date || undefined,
          category: form.category,
          visibility: payload.visibility,
          created_at: new Date().toISOString().slice(0, 10),
          author_name: user?.name,
          author_position: user?.position,
          photo_count: 0,
        };
        saveAlbumScope(local.id, {
          visibility_type: form.scope.type,
          scope_id: form.scope.id,
          scope_name: form.scope.name,
        });
        setAlbums(prev => [mergeAlbumList([local])[0], ...prev]);
        showToast('앨범이 등록되었습니다 (로컬 저장)');
        setShowForm(false);
        setEditing(null);
      } else {
        showToast('저장에 실패했습니다');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    try {
      await supabase.from('albums').delete().eq('id', id);
    } catch {
      /* demo fallback */
    }
    setAlbums(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    setDetailId(null);
    showToast('삭제되었습니다');
    restoreListScroll();
  };

  /* ── Form ── */
  if (showForm && canManage) {
    return (
      <ContentEditorLayout
        title={editing ? '앨범 수정' : '앨범 작성'}
        onBack={handleFormBack}
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
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">앨범 제목 *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="앨범 제목을 입력하세요"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">카테고리</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
              >
                {CAT_LABELS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">행사 날짜</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">설명</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="앨범 설명"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">공개 범위</label>
            <select
              value={Math.max(0, availableScopes.findIndex(s => s.type === form.scope.type && s.id === form.scope.id))}
              onChange={e => setForm({ ...form, scope: availableScopes[Number(e.target.value)] ?? form.scope })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            >
              {availableScopes.map((s, i) => (
                <option key={i} value={i}>
                  {SCOPE_TYPE_LABEL[s.type]} {s.name && s.type !== 'all' ? `(${s.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ContentEditorLayout>
    );
  }

  /* ── Detail ── */
  if (detailAlbum && !showForm) {
    return (
      <>
        <AlbumDetailView
          album={detailAlbum}
          photos={photos}
          photosLoading={photosLoading}
          canManage={canManage}
          onBack={() => {
            const hist = readAlbumHistory();
            if (hist?.layer === 'detail') {
              window.history.back();
              return;
            }
            setDetailId(null);
            restoreListScroll();
          }}
          onEdit={() => openEdit(detailAlbum)}
          onDelete={() => setDeleteConfirm(detailAlbum.id)}
        />
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          title="앨범 삭제"
          description="앨범과 사진이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
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
        title="앨범"
        description="교회의 소중한 순간을 함께 나눠보세요."
        action={
          canManage ? (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              앨범 작성
            </button>
          ) : undefined
        }
        mobileFab={canManage ? { label: '앨범 작성', onClick: openNew } : undefined}
      />

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={searchFilter.keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="키워드, 앨범 검색"
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
          onChange={f => {
            setSearchFilter(f);
            setDraftFilter(f);
          }}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Image}
          title="앨범이 없습니다"
          description="등록된 앨범이 없거나 검색 조건에 맞는 앨범이 없습니다."
        />
      ) : viewMode === 'list' ? (
        <div className="divide-y divide-gray-100 bg-white rounded-[24px] border border-[#ECECEC] overflow-hidden">
          {filtered.map(album => (
            <div key={album.id} className="px-4">
              <AlbumListRow
                album={album}
                canManage={canManage}
                onOpen={() => openDetail(album)}
                onEdit={() => openEdit(album)}
                onDelete={() => setDeleteConfirm(album.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(album => (
            <AlbumGridCard
              key={album.id}
              album={album}
              canManage={canManage}
              onOpen={() => openDetail(album)}
              onEdit={() => openEdit(album)}
              onDelete={() => setDeleteConfirm(album.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="앨범 삭제"
        description="앨범과 사진이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
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
