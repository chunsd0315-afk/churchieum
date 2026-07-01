import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadAlbumPhoto, uploadCoverPhoto } from '../../lib/albumStorage';
import {
  Image, Plus, Trash2, X, Upload, Lock, Globe,
  ArrowLeft, Loader2, AlertTriangle, Calendar, CheckCircle,
  Star, Download, Edit3, Users, BookOpen, Save,
} from 'lucide-react';
import ContentEditorLayout from '../shared/ContentEditorLayout';
import { PageHeaderBar } from '../ui';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/* ─── Types ─────────────────────────────────────────── */
type Visibility = '전체성도' | '교구별' | '부서별' | '교회학교' | '관리자만';
type AlbumCategory = '전체' | '교구' | '부서' | '교회학교' | '행사';

type Album = {
  id: string;
  title: string;
  category: string;
  event_date?: string;
  description?: string;
  cover_image?: string;
  visibility?: string;
  created_at: string;
};

type SavedPhoto = {
  id: string;
  album_id: string;
  url: string;
  caption?: string;
  sort_order: number;
  isLocal?: boolean;
};

type PendingPhoto = {
  previewId: string;
  file: File;
  previewUrl: string;
  caption: string;
  uploading: boolean;
  error: string;
  progress: number;
};

/* ─── Constants ─────────────────────────────────────── */
const CATEGORIES: AlbumCategory[] = ['전체', '교구', '부서', '교회학교', '행사'];
const VISIBILITIES: { key: Visibility; icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
  { key: '전체성도',  icon: Globe,      label: '전체 성도',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: '교구별',   icon: Users,      label: '교구별',     color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: '부서별',   icon: BookOpen,   label: '부서별',     color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { key: '교회학교', icon: BookOpen,   label: '교회학교',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: '관리자만', icon: Lock,       label: '관리자만',   color: 'text-gray-600 bg-gray-100 border-gray-200' },
];

const EMPTY_FORM = {
  title: '',
  category: '행사' as AlbumCategory,
  event_date: new Date().toISOString().split('T')[0],
  visibility: '전체성도' as Visibility,
  description: '',
};

/* ─── Uploaded image entry (demo / future Firebase) ─── */
type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;  // URL.createObjectURL — swap with Firebase URL when ready
  fileName: string;
  caption: string;
};

/* ─── Component ─────────────────────────────────────── */
export default function AlbumManagementPage() {
  const { isDesktop: _isDesktop } = useBreakpoint();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<AlbumCategory>('전체');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [toast, setToast] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [editCaptionId, setEditCaptionId] = useState<string | null>(null);
  const [editCaptionVal, setEditCaptionVal] = useState('');
  const [deleteSavedId, setDeleteSavedId] = useState<string | null>(null);
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  /* ── Quick-upload panel state (album list page) ── */
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadTargetAlbum, setUploadTargetAlbum] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAlbums(); }, []);

  /* ── Data fetching ── */
  const fetchAlbums = async () => {
    setLoading(true);
    const { data } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
    setAlbums(data || []);
    setLoading(false);
  };

  const openAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setPendingPhotos([]);
    setPhotosLoading(true);
    const { data } = await supabase.from('photos').select('*').eq('album_id', album.id).order('sort_order').order('created_at');
    setSavedPhotos((data || []).map((p, i) => ({ ...p, sort_order: p.sort_order ?? i })));
    setPhotosLoading(false);
  };

  /* ── Toast ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }, []);

  /* ══════════════════════════════════════════════════
     QUICK-UPLOAD PANEL handlers
     uploadedImages uses URL.createObjectURL (demo).
     Replace uploadAlbumPhoto call to swap in Firebase.
  ══════════════════════════════════════════════════ */

  /**
   * handleFileUpload — adds files to the uploadedImages preview list.
   * Uses URL.createObjectURL for instant browser preview (demo mode).
   * To connect Firebase Storage: replace createObjectURL with
   *   ref(storage, path) → uploadBytes → getDownloadURL
   */
  const handleFileUpload = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!accepted.length) return;
    const entries: UploadedImage[] = accepted.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),  // demo preview — no server call
      fileName: file.name,
      caption: '',
    }));
    setUploadedImages(prev => [...prev, ...entries]);
  };

  const removeUploadedImage = (id: string) => {
    setUploadedImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearUploadPanel = () => {
    uploadedImages.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setUploadedImages([]);
    setUploadTargetAlbum('');
    setIsDraggingPanel(false);
  };

  const handlePanelDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingPanel(true); };
  const handlePanelDragLeave = () => setIsDraggingPanel(false);
  const handlePanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPanel(false);
    if (e.dataTransfer.files?.length) handleFileUpload(e.dataTransfer.files);
  };

  /** Confirm: save uploadedImages to the chosen album via Supabase */
  const handleConfirmUpload = async () => {
    if (!uploadTargetAlbum || uploadedImages.length === 0) return;
    const album = albums.find(a => a.id === uploadTargetAlbum);
    if (!album) return;
    setSaving(true);
    let saved = 0;
    const startOrder = 0;
    for (let i = 0; i < uploadedImages.length; i++) {
      const img = uploadedImages[i];
      try {
        const result = await uploadAlbumPhoto(img.file, uploadTargetAlbum, undefined, i, uploadedImages.length);
        const { data: photo } = await supabase.from('photos').insert({
          album_id: uploadTargetAlbum,
          url: result.url,
          caption: img.caption || null,
          sort_order: startOrder + i,
          uploaded_by: null,
        }).select().single();
        if (photo) {
          saved++;
          if (i === 0 && !album.cover_image) {
            await supabase.from('albums').update({ cover_image: result.url }).eq('id', uploadTargetAlbum);
            setAlbums(prev => prev.map(a => a.id === uploadTargetAlbum ? { ...a, cover_image: result.url } : a));
          }
        }
      } catch { /* continue */ }
    }
    setSaving(false);
    clearUploadPanel();
    setShowUploadPanel(false);
    showToast(`${saved}장이 앨범에 추가되었습니다`);
  };

  /* ── Album CRUD ── */
  const handleAlbumBack = () => {
    if (form.title.trim() && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleCreate = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setSaving(true);
    const { data } = await supabase.from('albums').insert({
      title: form.title,
      category: form.category,
      event_date: form.event_date || null,
      description: form.description || null,
      visibility: form.visibility,
    }).select().single();
    if (data) setAlbums(prev => [data, ...prev]);
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    showToast('앨범이 생성되었습니다');
  };

  const handleDeleteAlbum = async (id: string) => {
    await supabase.from('albums').delete().eq('id', id);
    setAlbums(prev => prev.filter(a => a.id !== id));
    setDeleteAlbumId(null);
    showToast('앨범이 삭제되었습니다');
  };

  const handleSaveEditAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAlbum) return;
    await supabase.from('albums').update({
      title: editForm.title,
      category: editForm.category,
      event_date: editForm.event_date || null,
      description: editForm.description || null,
      visibility: editForm.visibility,
    }).eq('id', editAlbum.id);
    const updated = { ...editAlbum, ...editForm };
    setAlbums(prev => prev.map(a => a.id === editAlbum.id ? updated : a));
    setSelectedAlbum(updated);
    setEditAlbum(null);
    showToast('앨범 정보가 수정되었습니다');
  };

  /* ── Pending photo management ── */
  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    const newPending: PendingPhoto[] = arr.map(file => ({
      previewId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      uploading: false,
      error: '',
      progress: 0,
    }));
    setPendingPhotos(prev => [...prev, ...newPending]);
  };

  const removePending = (previewId: string) => {
    setPendingPhotos(prev => {
      const item = prev.find(p => p.previewId === previewId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(p => p.previewId !== previewId);
    });
  };

  const updatePendingCaption = (previewId: string, caption: string) => {
    setPendingPhotos(prev => prev.map(p => p.previewId === previewId ? { ...p, caption } : p));
  };

  /* ── Upload all pending ── */
  const handleUploadAll = async () => {
    if (!selectedAlbum || pendingPhotos.length === 0) return;
    setUploadingAll(true);
    const startOrder = savedPhotos.length;
    const uploaded: SavedPhoto[] = [];
    let fail = 0;

    for (let i = 0; i < pendingPhotos.length; i++) {
      const p = pendingPhotos[i];
      setPendingPhotos(prev => prev.map(x => x.previewId === p.previewId ? { ...x, uploading: true, progress: 0 } : x));
      try {
        const result = await uploadAlbumPhoto(p.file, selectedAlbum.id, undefined, i, pendingPhotos.length);
        const { data: photo } = await supabase.from('photos').insert({
          album_id: selectedAlbum.id,
          url: result.url,
          caption: p.caption || null,
          sort_order: startOrder + i,
          uploaded_by: null,
        }).select().single();

        if (photo) {
          uploaded.push({ ...photo, isLocal: result.isLocal });
          setPendingPhotos(prev => prev.map(x => x.previewId === p.previewId ? { ...x, uploading: false, progress: 100 } : x));
          URL.revokeObjectURL(p.previewUrl);
        } else {
          fail++;
          setPendingPhotos(prev => prev.map(x => x.previewId === p.previewId ? { ...x, uploading: false, error: 'DB 저장 실패' } : x));
        }
      } catch (err: unknown) {
        fail++;
        const msg = err instanceof Error ? err.message : '업로드 실패';
        setPendingPhotos(prev => prev.map(x => x.previewId === p.previewId ? { ...x, uploading: false, error: msg } : x));
      }
    }

    setSavedPhotos(prev => [...prev, ...uploaded]);
    setPendingPhotos(prev => prev.filter(p => p.error !== '' && p.progress === 0)); // keep failed only

    // Auto-set cover if none
    if (uploaded.length > 0 && !selectedAlbum.cover_image) {
      await supabase.from('albums').update({ cover_image: uploaded[0].url }).eq('id', selectedAlbum.id);
      const updated = { ...selectedAlbum, cover_image: uploaded[0].url };
      setSelectedAlbum(updated);
      setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? updated : a));
    }

    setUploadingAll(false);
    showToast(fail > 0 ? `${uploaded.length}장 업로드 완료 (${fail}장 실패)` : `${uploaded.length}장 업로드 완료`);
  };

  /* ── Cover photo ── */
  const handleUpdateCover = async (file: File) => {
    if (!selectedAlbum) return;
    try {
      const url = await uploadCoverPhoto(file, selectedAlbum.id);
      await supabase.from('albums').update({ cover_image: url }).eq('id', selectedAlbum.id);
      const updated = { ...selectedAlbum, cover_image: url };
      setSelectedAlbum(updated);
      setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? updated : a));
      showToast('대표 사진이 변경되었습니다');
    } catch { showToast('업로드 실패'); }
  };

  const setCoverFromSaved = async (photo: SavedPhoto) => {
    if (!selectedAlbum) return;
    await supabase.from('albums').update({ cover_image: photo.url }).eq('id', selectedAlbum.id);
    const updated = { ...selectedAlbum, cover_image: photo.url };
    setSelectedAlbum(updated);
    setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? updated : a));
    showToast('대표 사진이 설정되었습니다');
  };

  /* ── Saved photo actions ── */
  const handleDeleteSaved = async (id: string) => {
    await supabase.from('photos').delete().eq('id', id);
    setSavedPhotos(prev => prev.filter(p => p.id !== id));
    setDeleteSavedId(null);
    showToast('사진이 삭제되었습니다');
  };

  const handleSaveCaption = async (photo: SavedPhoto) => {
    await supabase.from('photos').update({ caption: editCaptionVal || null }).eq('id', photo.id);
    setSavedPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: editCaptionVal } : p));
    setEditCaptionId(null);
    showToast('설명이 저장되었습니다');
  };

  const movePhoto = async (fromIdx: number, toIdx: number) => {
    const arr = [...savedPhotos];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    const reordered = arr.map((p, i) => ({ ...p, sort_order: i }));
    setSavedPhotos(reordered);
    await Promise.all(reordered.map(p => supabase.from('photos').update({ sort_order: p.sort_order }).eq('id', p.id)));
  };

  const downloadPhoto = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo-${Date.now()}.jpg`;
    a.target = '_blank';
    a.click();
  };

  /* ── Drag & Drop ── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const filtered = catFilter === '전체' ? albums : albums.filter(a => a.category === catFilter);

  /* ═══════════════════════════════════════════════════
     ALBUM DETAIL VIEW
  ═══════════════════════════════════════════════════ */
  if (selectedAlbum) {
    const visInfo = VISIBILITIES.find(v => v.key === selectedAlbum.visibility);
    const allPhotosCount = savedPhotos.length + pendingPhotos.length;

    return (
      <div className="space-y-4 max-w-5xl">
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium pointer-events-none">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => { setSelectedAlbum(null); setPendingPhotos([]); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4" /> 목록
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 truncate">{selectedAlbum.title}</h2>
              {visInfo && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${visInfo.color}`}>{visInfo.label}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedAlbum.event_date && <span>{selectedAlbum.event_date} · </span>}
              {savedPhotos.length}장 저장됨
              {pendingPhotos.length > 0 && <span className="text-primary-500"> · {pendingPhotos.length}장 대기</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setEditAlbum(selectedAlbum); setEditForm({ title: selectedAlbum.title, category: (selectedAlbum.category || '행사') as AlbumCategory, event_date: selectedAlbum.event_date || '', visibility: (selectedAlbum.visibility || '전체성도') as Visibility, description: selectedAlbum.description || '' }); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> 앨범 수정
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { handleUpdateCover(f); e.target.value = ''; } }} />
            <button onClick={() => coverInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl font-medium transition-colors">
              <Star className="w-3.5 h-3.5" /> 대표 사진
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <input ref={photoInputRef} type="file" accept="image/*,image/webp" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; } }} />
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => photoInputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none
            ${isDragging ? 'border-primary-400 bg-primary-50 scale-[1.01]' : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'}`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">사진을 선택하거나 여기에 드래그하세요</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · 여러 장 동시 선택 가능 · 최대 10MB/장</p>
          </div>
        </div>

        {/* Pending preview section */}
        {pendingPhotos.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> 업로드 대기 중 ({pendingPhotos.length}장)
              </p>
              <div className="flex gap-2">
                <button onClick={() => { pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl)); setPendingPhotos([]); }}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2.5 py-1.5 hover:bg-amber-100 rounded-lg">
                  전체 취소
                </button>
                <button
                  onClick={handleUploadAll}
                  disabled={uploadingAll || pendingPhotos.every(p => p.uploading)}
                  className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-1.5 rounded-xl disabled:opacity-60 transition-colors">
                  {uploadingAll ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 업로드 중...</> : <><Upload className="w-3.5 h-3.5" /> 전체 업로드</>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pendingPhotos.map(p => (
                <div key={p.previewId} className="relative group bg-white rounded-xl border border-amber-200 overflow-hidden">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    {p.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {p.error && (
                      <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center p-2">
                        <p className="text-white text-[10px] font-bold text-center">{p.error}</p>
                      </div>
                    )}
                    {!p.uploading && (
                      <button onClick={() => removePending(p.previewId)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    <input
                      type="text"
                      value={p.caption}
                      onChange={e => updatePendingCaption(p.previewId, e.target.value)}
                      placeholder="설명 입력 (선택)"
                      className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved photos grid */}
        {photosLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary-400" /></div>
        ) : savedPhotos.length === 0 && pendingPhotos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Image className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">사진이 없습니다. 위 영역에서 사진을 선택해 업로드하세요.</p>
          </div>
        ) : savedPhotos.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">저장된 사진 ({savedPhotos.length}장)</p>
              <p className="text-[10px] text-gray-400">좌우 버튼으로 순서 변경 가능</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {savedPhotos.map((photo, idx) => (
                <div key={photo.id} className="relative group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {selectedAlbum.cover_image === photo.url && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5" /> 대표
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {/* Hover actions */}
                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setCoverFromSaved(photo)} title="대표 사진으로 설정"
                        className="p-1.5 bg-amber-400/90 text-white rounded-lg hover:bg-amber-500">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => downloadPhoto(photo.url)} title="다운로드"
                        className="p-1.5 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteSavedId(photo.id)} title="삭제"
                        className="p-1.5 bg-red-500/90 text-white rounded-lg hover:bg-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Reorder arrows */}
                    <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => idx > 0 && movePhoto(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 bg-black/50 text-white rounded-lg hover:bg-black/70 disabled:opacity-30 text-xs font-bold">
                        ←
                      </button>
                      <button
                        onClick={() => idx < savedPhotos.length - 1 && movePhoto(idx, idx + 1)}
                        disabled={idx === savedPhotos.length - 1}
                        className="p-1 bg-black/50 text-white rounded-lg hover:bg-black/70 disabled:opacity-30 text-xs font-bold">
                        →
                      </button>
                    </div>
                  </div>
                  {/* Caption */}
                  <div className="p-2">
                    {editCaptionId === photo.id ? (
                      <div className="flex gap-1">
                        <input autoFocus value={editCaptionVal} onChange={e => setEditCaptionVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveCaption(photo); if (e.key === 'Escape') setEditCaptionId(null); }}
                          className="flex-1 text-xs px-2 py-1 bg-gray-50 border border-primary-300 rounded-lg focus:outline-none" />
                        <button onClick={() => handleSaveCaption(photo)} className="p-1 bg-primary-500 text-white rounded-lg text-xs hover:bg-primary-600">
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditCaptionId(null)} className="p-1 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-gray-200">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditCaptionId(photo.id); setEditCaptionVal(photo.caption || ''); }}
                        className="w-full text-left text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 group/caption">
                        <Edit3 className="w-3 h-3 opacity-0 group-hover/caption:opacity-60 flex-shrink-0" />
                        <span className="truncate">{photo.caption || <span className="text-gray-300 italic">설명 추가...</span>}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Delete saved photo confirm */}
        {deleteSavedId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">사진을 삭제하시겠습니까?</h3>
              <p className="text-sm text-gray-500 mb-5">삭제된 사진은 복구할 수 없습니다.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteSavedId(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 text-sm">취소</button>
                <button onClick={() => handleDeleteSaved(deleteSavedId)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 text-sm">삭제</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit album modal */}
        {editAlbum && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">앨범 정보 수정</h3>
                <button onClick={() => setEditAlbum(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSaveEditAlbum} className="p-5 space-y-4">
                <AlbumFormFields form={editForm} setForm={setEditForm} />
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditAlbum(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 text-sm">취소</button>
                  <button type="submit" className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 text-sm">저장</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     ALBUM LIST VIEW
  ═══════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 max-w-5xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium pointer-events-none">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {toast}
        </div>
      )}

      <PageHeaderBar
        title="앨범"
        description="교회 공동체의 소중한 순간을 함께 나누세요."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowUploadPanel(v => !v); if (!showUploadPanel) clearUploadPanel(); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                showUploadPanel
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
              }`}>
              <Upload className="w-4 h-4" />
              {showUploadPanel ? '업로드 닫기' : '+ 사진 업로드'}
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> 앨범 생성
            </button>
          </div>
        }
      />

      {/* ★ Quick-upload panel */}
      {showUploadPanel && (
        <div className="bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
            <p className="font-bold text-blue-800 flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4" /> 사진 업로드
            </p>
            <button onClick={() => { setShowUploadPanel(false); clearUploadPanel(); }} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Album selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">업로드할 앨범 선택</label>
              <select
                value={uploadTargetAlbum}
                onChange={e => setUploadTargetAlbum(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none">
                <option value="">-- 앨범을 선택하세요 --</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>{a.title}{a.event_date ? ` (${a.event_date})` : ''}</option>
                ))}
              </select>
            </div>

            {/* file input (hidden) */}
            <input
              ref={quickUploadInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files?.length) { handleFileUpload(e.target.files); e.target.value = ''; } }}
            />

            {/* Drag & drop zone */}
            <div
              onDragOver={handlePanelDragOver}
              onDragLeave={handlePanelDragLeave}
              onDrop={handlePanelDrop}
              onClick={() => quickUploadInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed rounded-2xl cursor-pointer select-none transition-all
                ${isDraggingPanel
                  ? 'border-blue-400 bg-blue-50 scale-[1.005]'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDraggingPanel ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Upload className={`w-7 h-7 transition-colors ${isDraggingPanel ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">사진을 끌어오거나 클릭해서 업로드하세요</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · 여러 장 동시 선택 · 최대 10MB/장</p>
              </div>
            </div>

            {/* Preview grid */}
            {uploadedImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-600">{uploadedImages.length}장 선택됨</p>
                  <button onClick={() => { uploadedImages.forEach(i => URL.revokeObjectURL(i.previewUrl)); setUploadedImages([]); }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">
                    전체 삭제
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {uploadedImages.map(img => (
                    <div key={img.id} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      {/* Thumbnail */}
                      <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <img src={img.previewUrl} alt={img.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        {/* Delete button */}
                        <button
                          onClick={() => removeUploadedImage(img.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* File name */}
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] text-gray-500 truncate font-medium" title={img.fileName}>{img.fileName}</p>
                        <p className="text-[9px] text-gray-400">{(img.file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {uploadedImages.length > 0 && !uploadTargetAlbum && (
                  <span className="text-amber-500 font-medium">앨범을 먼저 선택해주세요</span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowUploadPanel(false); clearUploadPanel(); }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
                  취소
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={!uploadTargetAlbum || uploadedImages.length === 0 || saving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
                    : <><CheckCircle className="w-4 h-4" /> {uploadedImages.length > 0 ? `${uploadedImages.length}장 저장` : '저장'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              catFilter === c ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
            }`}>
            {c}
            <span className={`ml-1.5 text-xs ${catFilter === c ? 'text-white/80' : 'text-gray-400'}`}>
              {c === '전체' ? albums.length : albums.filter(a => a.category === c).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Image className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">앨범이 없습니다</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600">
            첫 앨범 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map(album => {
            const visInfo = VISIBILITIES.find(v => v.key === album.visibility);
            return (
              <div key={album.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                <div className="relative h-36 overflow-hidden cursor-pointer" onClick={() => openAlbum(album)}>
                  {album.cover_image ? (
                    <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col items-center justify-center gap-2">
                      <Image className="w-10 h-10 text-primary-200" />
                      <p className="text-xs text-primary-300 font-medium">사진 없음</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {visInfo && (
                    <div className="absolute top-2 left-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${visInfo.color}`}>{visInfo.label}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-3 text-white text-xs font-medium opacity-90">
                    {album.category && <span className="bg-black/30 px-2 py-0.5 rounded-full">{album.category}</span>}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openAlbum(album)}>
                      <p className="font-bold text-gray-900 text-sm truncate">{album.title}</p>
                      {album.event_date && (
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {album.event_date}
                        </p>
                      )}
                      {album.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{album.description}</p>}
                    </div>
                    <button onClick={() => setDeleteAlbumId(album.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                  <button onClick={() => openAlbum(album)}
                    className="w-full mt-2.5 py-2 bg-gray-50 hover:bg-primary-50 hover:text-primary-600 text-gray-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                    <Upload className="w-3 h-3" /> 사진 업로드
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete album confirm */}
      {deleteAlbumId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">앨범을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">앨범의 모든 사진이 함께 삭제됩니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAlbumId(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
              <button onClick={() => handleDeleteAlbum(deleteAlbumId)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 text-sm">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Create album — ContentEditorLayout */}
      {showForm && (
        <ContentEditorLayout
          title="새 앨범 생성"
          onBack={handleAlbumBack}
          saveButton={
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? '생성 중...' : '앨범 생성'}
            </button>
          }
        >
          <AlbumFormFields form={form} setForm={setForm} />
        </ContentEditorLayout>
      )}
    </div>
  );
}

/* ─── Shared form fields ──────────────────────────────── */
type AlbumFormState = {
  title: string;
  category: AlbumCategory;
  event_date: string;
  visibility: Visibility;
  description: string;
};

function AlbumFormFields({
  form,
  setForm,
}: {
  form: AlbumFormState;
  setForm: React.Dispatch<React.SetStateAction<AlbumFormState>>;
}) {
  const f = <K extends keyof AlbumFormState>(k: K, v: AlbumFormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">앨범 제목 *</label>
        <input type="text" value={form.title} onChange={e => f('title', e.target.value)} required
          placeholder="앨범 제목을 입력하세요"
          className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">카테고리</label>
          <select value={form.category} onChange={e => f('category', e.target.value as AlbumCategory)}
            className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none">
            {(['교구', '부서', '교회학교', '행사'] as AlbumCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">행사 날짜</label>
          <input type="date" value={form.event_date} onChange={e => f('event_date', e.target.value)}
            className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">공개 범위</label>
        <div className="grid grid-cols-5 gap-1.5">
          {VISIBILITIES.map(v => {
            const Icon = v.icon;
            const active = form.visibility === v.key;
            return (
              <button type="button" key={v.key} onClick={() => f('visibility', v.key)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-[10px] font-semibold ${
                  active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">설명</label>
        <input type="text" value={form.description} onChange={e => f('description', e.target.value)}
          placeholder="간단한 설명 (선택)"
          className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none" />
      </div>
    </>
  );
}
