import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import {
  Image, Calendar, ArrowLeft, Grid2x2, Rows, Loader2, X,
  Download, ChevronLeft, ChevronRight, ZoomIn, Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canWriteContent, getAvailableScopes, type ContentScope } from '../../services/permissions';
import { getDistricts, getZones, getDepartments } from '../../services/orgData';
import { PageHeaderBar } from '../../components/common/ui';
import SearchSection from '../../components/layout/SearchSection';

type Album = {
  id: string;
  title: string;
  event_date?: string;
  description?: string;
  cover_image?: string;
  category?: string;
  visibility?: string;
  created_at: string;
};

type Photo = {
  id: string;
  url: string;
  caption?: string;
  sort_order?: number;
};

const DEMO_ALBUMS: Album[] = [
  { id: 'd1', title: '2026년 여름 수련회', event_date: '2026-07-15', category: '행사', description: '전교인 2박 3일 여름 수련회', cover_image: 'https://images.pexels.com/photos/6457547/pexels-photo-6457547.jpeg?auto=compress&cs=tinysrgb&w=600', created_at: '2026-07-17' },
  { id: 'd2', title: '어린이날 행사', event_date: '2026-05-05', category: '교회학교', description: '주일학교 어린이날 감사예배 및 행사', cover_image: 'https://images.pexels.com/photos/1001850/pexels-photo-1001850.jpeg?auto=compress&cs=tinysrgb&w=600', created_at: '2026-05-06' },
  { id: 'd3', title: '4월 부활절 예배', event_date: '2026-04-20', category: '행사', description: '부활절 특별예배 및 축하 행사', cover_image: 'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=600', created_at: '2026-04-21' },
  { id: 'd4', title: '1교구 야외 모임', event_date: '2026-04-12', category: '교구', description: '1교구 전체 야외 친교 모임', cover_image: 'https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=600', created_at: '2026-04-13' },
  { id: 'd5', title: '전교인 신년 예배', event_date: '2026-01-04', category: '행사', description: '2026년 새해 첫 주일예배', cover_image: 'https://images.pexels.com/photos/8815866/pexels-photo-8815866.jpeg?auto=compress&cs=tinysrgb&w=600', created_at: '2026-01-05' },
  { id: 'd6', title: '성탄절 칸타타', event_date: '2025-12-24', category: '행사', description: '성탄절 전야 특별 칸타타', cover_image: 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=600', created_at: '2025-12-25' },
];

const DEMO_PHOTOS: Photo[] = [
  { id: 'p1', url: 'https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '예배 후 단체 사진' },
  { id: 'p2', url: 'https://images.pexels.com/photos/6457547/pexels-photo-6457547.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '청년부 모임' },
  { id: 'p3', url: 'https://images.pexels.com/photos/1001850/pexels-photo-1001850.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'p4', url: 'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '교회 전경' },
  { id: 'p5', url: 'https://images.pexels.com/photos/8815866/pexels-photo-8815866.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'p6', url: 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '특별 예배' },
  { id: 'p7', url: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'p8', url: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '소그룹 모임' },
  { id: 'p9', url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const CAT_LABELS = ['전체', '교구', '부서', '교회학교', '행사'];

export default function AlbumPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const canWrite = canWriteContent(user);
  const orgData = { districts: getDistricts(), zones: getZones(), departments: getDepartments() };
  const availableScopes = getAvailableScopes(user, orgData);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
      setAlbums(data && data.length > 0 ? data : DEMO_ALBUMS);
      setLoading(false);
    })();
  }, []);

  /* keyboard nav in lightbox */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (lightboxIdx === null) return;
    if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? Math.min(i + 1, photos.length - 1) : 0);
    if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : 0);
    if (e.key === 'Escape') setLightboxIdx(null);
  }, [lightboxIdx, photos.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const openAlbum = async (album: Album) => {
    setSelected(album);
    setPhotosLoading(true);
    const { data } = await supabase.from('photos').select('*').eq('album_id', album.id).order('sort_order').order('created_at');
    setPhotos(data && data.length > 0 ? data : DEMO_PHOTOS);
    setPhotosLoading(false);
  };

  const downloadPhoto = (url: string, idx: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo-${idx + 1}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const handleCreateAlbum = (album: Album) => {
    setAlbums(prev => [album, ...prev]);
    setShowCreateForm(false);
  };

  const filteredAlbums = albums.filter(a => {
    const matchCat = catFilter === '전체' || a.category === catFilter;
    const matchSearch = !search || a.title.includes(search) || (a.description || '').includes(search);
    return matchCat && matchSearch;
  });

  /* ── Lightbox ── */
  if (lightboxIdx !== null && photos[lightboxIdx]) {
    const photo = photos[lightboxIdx];
    const hasPrev = lightboxIdx > 0;
    const hasNext = lightboxIdx < photos.length - 1;

    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
          <button onClick={() => setLightboxIdx(null)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <p className="text-white/60 text-sm">{lightboxIdx + 1} / {photos.length}</p>
          <button onClick={() => downloadPhoto(photo.url, lightboxIdx)} className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center relative px-12 py-4">
          <button
            onClick={() => hasPrev && setLightboxIdx(lightboxIdx - 1)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all ${!hasPrev ? 'opacity-0 pointer-events-none' : ''}`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={photo.url}
            alt={photo.caption || ''}
            className="max-w-full max-h-full object-contain rounded-xl select-none"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          />
          <button
            onClick={() => hasNext && setLightboxIdx(lightboxIdx + 1)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all ${!hasNext ? 'opacity-0 pointer-events-none' : ''}`}>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Caption + thumbnail strip */}
        <div className="bg-black/60 backdrop-blur-sm px-4 pb-4">
          {photo.caption && (
            <p className="text-white/80 text-sm text-center mb-3">{photo.caption}</p>
          )}
          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
            {photos.map((p, i) => (
              <button key={p.id} onClick={() => setLightboxIdx(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIdx ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Album detail ── */
  if (selected) {
    return (
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => { setSelected(null); setPhotos([]); }}
              className="flex items-center gap-1.5 text-primary-500 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> 앨범
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-sm truncate">{selected.title}</h2>
            </div>
          </div>
        </div>

        {/* Album info */}
        <div className="relative">
          {selected.cover_image && (
            <div className="h-44 overflow-hidden">
              <img src={selected.cover_image} alt={selected.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
          )}
          <div className={`px-4 py-4 ${selected.cover_image ? 'absolute bottom-0 left-0 right-0 text-white' : 'bg-white border-b border-gray-100'}`}>
            <h2 className={`text-xl font-bold ${selected.cover_image ? 'text-white' : 'text-gray-900'}`}>{selected.title}</h2>
            <div className={`flex items-center gap-3 mt-1 text-sm ${selected.cover_image ? 'text-white/80' : 'text-gray-500'}`}>
              {selected.event_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selected.event_date}</span>}
              <span className="flex items-center gap-1"><Image className="w-3.5 h-3.5" /> {photos.length}장</span>
            </div>
            {selected.description && (
              <p className={`text-sm mt-1 ${selected.cover_image ? 'text-white/70' : 'text-gray-500'}`}>{selected.description}</p>
            )}
          </div>
        </div>

        {photosLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary-400" /></div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 mx-4 mt-4 bg-white rounded-2xl border border-gray-100">
            <Image className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">사진이 없습니다</p>
          </div>
        ) : (
          <div className="px-4 mt-4">
            <div className="grid grid-cols-3 gap-1">
              {photos.map((photo, idx) => (
                <button key={photo.id} onClick={() => setLightboxIdx(idx)}
                  className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Album list ── */
  return (
    <div className="pb-8">
      <PageHeaderBar
        title="앨범"
        description="교회 공동체의 소중한 순간을 함께 나누세요."
        action={
          <div className="flex items-center gap-2">
            {canWrite && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-500 text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> 앨범 등록
              </button>
            )}
            <button onClick={() => setGridView(v => !v)} className="p-2 bg-gray-100 rounded-xl">
              {gridView ? <Rows className="w-4 h-4 text-gray-600" /> : <Grid2x2 className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        }
      />
      <SearchSection
        value={search}
        onChange={setSearch}
        placeholder="앨범 검색..."
        filters={CAT_LABELS.map(c => ({ id: c, label: c }))}
        activeFilter={catFilter}
        onFilterChange={setCatFilter}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary-400" /></div>
      ) : (
        <div className="">
          {filteredAlbums.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Image className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">앨범이 없습니다</p>
            </div>
          ) : gridView ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredAlbums.map(album => (
                <button key={album.id} onClick={() => openAlbum(album)}
                  className="text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    {album.cover_image ? (
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary-50 to-primary-100">
                        <Image className="w-10 h-10 text-primary-200" />
                      </div>
                    )}
                    {album.category && (
                      <div className="absolute bottom-1.5 left-1.5">
                        <span className="text-[9px] font-bold bg-black/40 text-white px-2 py-0.5 rounded-full">{album.category}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{album.title}</h3>
                    {album.event_date && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {album.event_date}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAlbums.map(album => (
                <button key={album.id} onClick={() => openAlbum(album)}
                  className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex items-stretch hover:shadow-md active:scale-[0.99] transition-all">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 overflow-hidden">
                    {album.cover_image ? (
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                        <Image className="w-8 h-8 text-primary-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {album.category && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{album.category}</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{album.title}</h3>
                    {album.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{album.description}</p>}
                    {album.event_date && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {album.event_date}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateAlbumModal
          availableScopes={availableScopes}
          onSave={handleCreateAlbum}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}

const SCOPE_TYPE_LABEL: Record<string, string> = {
  all: '전체 성도', district: '특정 교구', zone: '특정 구역', department: '특정 부서',
};

function CreateAlbumModal({
  availableScopes,
  onSave,
  onClose,
}: {
  availableScopes: ContentScope[];
  onSave: (a: Album) => void;
  onClose: () => void;
}) {
  const [title, setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('행사');
  const [scope, setScope]       = useState<ContentScope>(availableScopes[0] ?? { type: 'all', name: '전체 성도' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const album: Album = {
      id: `local-${Date.now()}`,
      title: title.trim(),
      description: description || undefined,
      event_date: eventDate || undefined,
      category,
      created_at: new Date().toISOString().slice(0, 10),
      cover_image: undefined,
    };
    onSave(album);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl z-10">
          <h3 className="font-bold text-gray-900">앨범 등록</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">앨범 제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="앨범 제목을 입력하세요"
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">카테고리</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                {CAT_LABELS.filter(c => c !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">행사 날짜</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="앨범 설명"
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">공개 범위</label>
            <select
              value={availableScopes.indexOf(scope)}
              onChange={e => setScope(availableScopes[Number(e.target.value)] ?? scope)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0"
            >
              {availableScopes.map((s, i) => (
                <option key={i} value={i}>{SCOPE_TYPE_LABEL[s.type]} {s.name && s.type !== 'all' ? `(${s.name})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
            <button type="submit" className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm hover:bg-primary-600">앨범 등록</button>
          </div>
        </form>
      </div>
    </div>
  );
}
