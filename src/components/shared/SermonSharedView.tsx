import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Edit3, Trash2, X, Calendar, Youtube,
  ChevronRight, Play, Search, Settings, ChevronLeft, FolderOpen, Check, Save,
} from 'lucide-react';
import {
  getAllSermons, addSermon, updateSermon, deleteSermon,
  getAllFolders, addFolder, updateFolder, deleteFolder,
  getYouTubeId, type Sermon, type SermonFolder,
} from '../../lib/sermonStorage';
import ContentEditorLayout from './ContentEditorLayout';
import { PageHeaderBar } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SermonSharedViewProps = {
  isAdmin: boolean;
  renderActions?: (sermon: Sermon) => React.ReactNode;
};

type FormData = {
  title: string;
  scripture: string;
  preacher: string;
  sermonDate: string;
  folderId: string;
  folderName: string;
  videoUrl: string;
  youtubeVideoId: string | null;
};

const INPUT = 'w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0 focus:outline-none';
const LABEL = 'block text-xs font-semibold text-gray-600 mb-1.5';

function emptyForm(folders: SermonFolder[]): FormData {
  const first = folders[0];
  return {
    title: '', scripture: '', preacher: '',
    sermonDate: new Date().toISOString().split('T')[0],
    folderId: first?.id ?? '', folderName: first?.name ?? '',
    videoUrl: '', youtubeVideoId: null,
  };
}

// ─── YouTube Thumbnail ───────────────────────────────────────────────────────

function YtThumbnail({ videoId, title, className = '' }: { videoId: string; title: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 ${className}`}>
      <Youtube className="w-8 h-8 text-white opacity-80" />
    </div>
  );
  return (
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt={title} className={`object-cover ${className}`}
      onError={() => setErr(true)}
    />
  );
}

// ─── Sermon Form ─────────────────────────────────────────────────────────────

function SermonForm({
  folders, editing, initialData, onSave, onClose, isInline, saveTriggerRef, onDirty,
}: {
  folders: SermonFolder[];
  editing: boolean;
  initialData: FormData;
  onSave: (data: FormData) => void;
  onClose: () => void;
  isInline?: boolean;
  saveTriggerRef?: React.MutableRefObject<(() => void) | null>;
  onDirty?: () => void;
}) {
  const [form, setForm] = useState<FormData>(initialData);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const setField = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    onDirty?.();
    setForm(p => ({ ...p, [k]: v }));
  };

  const handleVideoUrl = (url: string) => {
    onDirty?.();
    const ytId = getYouTubeId(url);
    setForm(p => ({ ...p, videoUrl: url, youtubeVideoId: ytId }));
  };

  const handleFolderChange = (id: string) => {
    const f = folders.find(x => x.id === id);
    setForm(p => ({ ...p, folderId: id, folderName: f?.name ?? '' }));
  };

  const handleNewFolder = () => {
    if (!newFolderName.trim()) return;
    const f = addFolder(newFolderName.trim());
    setForm(p => ({ ...p, folderId: f.id, folderName: f.name }));
    setNewFolderName('');
    setNewFolderMode(false);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.preacher.trim() || !form.sermonDate) return;
    onSave(form);
  };

  useEffect(() => {
    if (saveTriggerRef) saveTriggerRef.current = handleSave;
  });

  const fields = (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>설교 제목 *</label>
        <input value={form.title} onChange={e => setField('title', e.target.value)}
          required placeholder="예: 믿음의 출발" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>성경 본문</label>
        <input value={form.scripture} onChange={e => setField('scripture', e.target.value)}
          placeholder="예: 히브리서 11:1" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>설교자 *</label>
        <input value={form.preacher} onChange={e => setField('preacher', e.target.value)}
          required placeholder="예: 김성기 목사" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>설교 날짜 *</label>
        <input type="date" value={form.sermonDate}
          onChange={e => setField('sermonDate', e.target.value)} required className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>설교 폴더</label>
        {!newFolderMode ? (
          <div className="flex gap-2">
            <select value={form.folderId} onChange={e => handleFolderChange(e.target.value)}
              className={`${INPUT} flex-1`}>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button type="button" onClick={() => setNewFolderMode(true)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-primary-600 font-medium hover:bg-primary-50 whitespace-nowrap">
              + 새 폴더
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              placeholder="폴더명 입력" className={`${INPUT} flex-1`} autoFocus />
            <button type="button" onClick={handleNewFolder}
              className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">확인</button>
            <button type="button" onClick={() => setNewFolderMode(false)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm">취소</button>
          </div>
        )}
      </div>
      <div>
        <label className={LABEL}>동영상 URL</label>
        <input value={form.videoUrl} onChange={e => handleVideoUrl(e.target.value)}
          placeholder="YouTube 링크를 입력하세요" className={INPUT} />
        {form.youtubeVideoId && (
          <div className="mt-2 rounded-xl overflow-hidden aspect-video bg-black">
            <img src={`https://img.youtube.com/vi/${form.youtubeVideoId}/hqdefault.jpg`}
              alt="preview" className="w-full h-full object-cover opacity-80" />
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) return fields;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 sticky top-0 bg-white z-10 shrink-0">
        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-gray-900 text-base flex-1">{editing ? '설교 수정' : '설교 등록'}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {fields}
      </div>
      <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button type="button" onClick={onClose}
          className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
        <button type="button" onClick={handleSave}
          className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm hover:bg-primary-600 transition-colors">저장</button>
      </div>
    </div>
  );
}

// ─── Folder Manager ───────────────────────────────────────────────────────────

function FolderManager({ folders, onClose, onRefresh }: {
  folders: SermonFolder[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateFolder(id, editName.trim());
    setEditingId(null);
    onRefresh();
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addFolder(newName.trim());
    setNewName('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    deleteFolder(id);
    setConfirmDelete(null);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-gray-900">폴더 관리</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {folders.map(f => (
            <div key={f.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              {editingId === f.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-white border border-primary-300 rounded-lg focus:outline-none" autoFocus />
                  <button onClick={() => handleSaveEdit(f.id)}
                    className="px-2.5 py-1 bg-primary-500 text-white rounded-lg text-xs font-semibold">저장</button>
                  <button onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs">취소</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-800">{f.name}</span>
                  {f.isDefault && <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">기본</span>}
                  <button onClick={() => { setEditingId(f.id); setEditName(f.name); }}
                    className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-primary-500 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(f.id)}
                    className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="새 폴더명" onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none" />
            <button onClick={handleAdd}
              className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors">추가</button>
          </div>
        </div>
      </div>
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-3xl p-6 mx-4 w-full max-w-sm shadow-2xl">
            <h4 className="font-bold text-gray-900 mb-2">폴더를 삭제하시겠습니까?</h4>
            <p className="text-sm text-gray-500 mb-5">해당 폴더의 설교는 기타로 이동됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold">삭제</button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Folder Tabs ─────────────────────────────────────────────────────────────

function FolderTabs({
  folders, activeFolder, onSelect, isAdmin, onManage,
}: {
  folders: SermonFolder[];
  activeFolder: string;
  onSelect: (id: string) => void;
  isAdmin: boolean;
  onManage: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, folders]);

  // Auto-scroll active tab to center when selection changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.querySelector(`[data-fid="${activeFolder}"]`) as HTMLElement | null;
    if (!btn) return;
    const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
    const target = Math.max(0, btnCenter - el.clientWidth / 2);
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [activeFolder]);

  const scrollBy = (delta: number) =>
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  const ALL_TABS = [{ id: 'all', name: '전체' }, ...folders.map(f => ({ id: f.id, name: f.name }))];

  return (
    <div className="flex items-center border-b border-gray-100 bg-white sticky top-0 z-20">
      {/* Scroll area + arrow overlay */}
      <div className="relative flex-1 overflow-hidden">
        {/* Fade + left arrow */}
        {canLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
            <button
              onClick={() => scrollBy(-250)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-gray-100 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}

        {/* Scrollable tabs */}
        <div
          ref={scrollRef}
          className="flex items-end overflow-x-auto pl-4"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <style>{`.sermon-tabs::-webkit-scrollbar{display:none}`}</style>
          {ALL_TABS.map(tab => {
            const active = activeFolder === tab.id;
            return (
              <button
                key={tab.id}
                data-fid={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`shrink-0 px-4 py-3 text-sm whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'font-bold text-primary-600 border-primary-500'
                    : 'font-medium text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
          {/* Trailing padding so last tab isn't clipped by arrow */}
          <div className="shrink-0 w-10" />
        </div>

        {/* Fade + right arrow */}
        {canRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            <button
              onClick={() => scrollBy(250)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-gray-100 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Admin folder settings */}
      {isAdmin && (
        <button
          onClick={onManage}
          className="shrink-0 p-2 mx-1 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main shared view ─────────────────────────────────────────────────────────

export default function SermonSharedView({ isAdmin, renderActions }: SermonSharedViewProps) {
  const [sermons, setSermons] = useState<Sermon[]>(() => getAllSermons());
  const [folders, setFolders] = useState<SermonFolder[]>(() => getAllFolders());
  const [activeFolder, setActiveFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [playingNow, setPlayingNow] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [showFolderMgr, setShowFolderMgr] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTriggerRef = useRef<(() => void) | null>(null);
  const formDirtyRef = useRef(false);

  const refresh = () => {
    setSermons(getAllSermons());
    setFolders(getAllFolders());
  };

  const filtered = sermons.filter(s => {
    const folderMatch = activeFolder === 'all' || s.folderId === activeFolder;
    const q = search.toLowerCase();
    const searchMatch = !q || [s.title, s.scripture, s.preacher, s.folderName, s.sermonDate]
      .some(v => v.toLowerCase().includes(q));
    return folderMatch && searchMatch;
  });

  // Init selectedSermon to first filtered result
  useEffect(() => {
    if (!selectedSermon && filtered.length > 0) {
      setSelectedSermon(filtered[0]);
    }
  }, []);

  // When folder/search changes, reset selected to first result
  useEffect(() => {
    if (filtered.length > 0 && (!selectedSermon || !filtered.find(s => s.id === selectedSermon.id))) {
      setSelectedSermon(filtered[0]);
      setPlayingNow(false);
    }
  }, [activeFolder, search]);

  const handleSelectSermon = (sermon: Sermon) => {
    if (selectedSermon?.id === sermon.id) return;
    setSelectedSermon(sermon);
    setPlayingNow(false);
    // Scroll to top of container
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCreate = () => { setEditingSermon(null); setShowForm(true); };
  const openEdit = (s: Sermon) => { setEditingSermon(s); setShowForm(true); };

  const handleFormBack = () => {
    if (formDirtyRef.current && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false);
    setEditingSermon(null);
    formDirtyRef.current = false;
  };

  const handleSave = (data: FormData) => {
    if (editingSermon) {
      updateSermon(editingSermon.id, { ...data, visibility: 'all', createdAt: editingSermon.createdAt, updatedAt: new Date().toISOString() });
    } else {
      addSermon({ ...data, visibility: 'all' });
    }
    formDirtyRef.current = false;
    setShowForm(false);
    setEditingSermon(null);
    const updated = getAllSermons();
    setSermons(updated);
    setFolders(getAllFolders());
  };

  const handleDelete = (id: string) => {
    deleteSermon(id);
    setDeleteId(null);
    const updated = getAllSermons();
    setSermons(updated);
    if (selectedSermon?.id === id) {
      setSelectedSermon(updated[0] ?? null);
      setPlayingNow(false);
    }
  };

  const formInitialData: FormData = editingSermon
    ? {
        title: editingSermon.title, scripture: editingSermon.scripture,
        preacher: editingSermon.preacher, sermonDate: editingSermon.sermonDate,
        folderId: editingSermon.folderId, folderName: editingSermon.folderName,
        videoUrl: editingSermon.videoUrl, youtubeVideoId: editingSermon.youtubeVideoId,
      }
    : emptyForm(folders);

  const ytId = selectedSermon?.youtubeVideoId ?? null;

  /* ── Form view (ContentEditorLayout) ── */
  if (showForm) {
    return (
      <ContentEditorLayout
        title={editingSermon ? '설교 수정' : '설교 등록'}
        onBack={handleFormBack}
        saveButton={
          <button
            onClick={() => saveTriggerRef.current?.()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" /> 저장
          </button>
        }
      >
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <SermonForm
            folders={getAllFolders()}
            editing={!!editingSermon}
            initialData={formInitialData}
            onSave={handleSave}
            onClose={handleFormBack}
            isInline
            saveTriggerRef={saveTriggerRef}
            onDirty={() => { formDirtyRef.current = true; }}
          />
        </div>
      </ContentEditorLayout>
    );
  }

  return (
    <div ref={containerRef} className="pb-10">
      <PageHeaderBar
        title="설교"
        description="예배 설교 말씀을 다시 보고 묵상하세요."
        action={
          isAdmin ? (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> 설교 등록
            </button>
          ) : undefined
        }
      />

      {/* ── Folder tabs ── */}
      <FolderTabs
        folders={folders}
        activeFolder={activeFolder}
        onSelect={id => setActiveFolder(id)}
        isAdmin={isAdmin}
        onManage={() => setShowFolderMgr(true)}
      />

      <div className="pt-4 space-y-3">
        {/* ── Featured / Selected Sermon Player ── */}
        <div ref={featuredRef} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
          {selectedSermon ? (
            <>
              {/* Player */}
              <div className="relative w-full aspect-video bg-gray-900">
                {playingNow && ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : ytId ? (
                  <>
                    <YtThumbnail videoId={ytId} title={selectedSermon.title} className="w-full h-full" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
                      onClick={() => setPlayingNow(true)}>
                      <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 rounded-lg">
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[11px] text-white font-semibold">YouTube</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
                    <BookOpen className="w-16 h-16 text-white opacity-30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">{selectedSermon.title}</h2>
                    {selectedSermon.scripture && (
                      <p className="text-sm text-primary-600 mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" /> {selectedSermon.scripture}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      <span>{selectedSermon.preacher}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selectedSermon.sermonDate}</span>
                      {selectedSermon.folderName && (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-[11px] font-medium">
                          {selectedSermon.folderName}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(selectedSermon)}
                        className="p-2 hover:bg-primary-50 text-primary-600 rounded-xl transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(selectedSermon.id)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Grace notes or custom actions */}
                {renderActions && (
                  <div className="mt-3">
                    {renderActions(selectedSermon)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <BookOpen className="w-14 h-14 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">설교를 선택하세요</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="제목, 설교자, 본문, 날짜 검색..."
            className="w-full pl-11 pr-9 bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            style={{ height: '44px', borderRadius: '14px' }} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* ── Sermon list ── */}
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map(s => {
              const isSelected = selectedSermon?.id === s.id;
              const cardYtId = s.youtubeVideoId;
              return (
                <div key={s.id}
                  onClick={() => handleSelectSermon(s)}
                  className={`rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-50 border-primary-200 border-l-4 border-l-primary-500 shadow-sm'
                      : 'bg-white border-gray-100 hover:shadow-md'
                  }`}>
                  <div className="flex items-stretch">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 shrink-0 bg-gray-100">
                      {cardYtId ? (
                        <>
                          <YtThumbnail videoId={cardYtId} title={s.title} className="w-full h-full" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-red-600/80 flex items-center justify-center">
                              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
                          <BookOpen className="w-7 h-7 text-white opacity-50" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 px-3 py-2.5 min-w-0">
                      <p className={`font-bold text-sm truncate leading-tight ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                        {s.title}
                      </p>
                      {s.scripture && (
                        <p className="text-xs text-primary-600 mt-0.5 truncate">{s.scripture}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{s.preacher}</span>
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{s.sermonDate}</span>
                        {s.folderName && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-500">{s.folderName}</span>
                        )}
                      </p>
                    </div>
                    {/* Admin actions */}
                    {isAdmin && (
                      <div className="flex flex-col justify-center gap-1 px-2 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(s.id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center pr-2 shrink-0">
                      {isSelected
                        ? <Check className="w-4 h-4 text-primary-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-300" />
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-400 text-sm">
              {search ? '검색 결과가 없습니다' : '등록된 설교가 없습니다'}
            </p>
            {isAdmin && !search && (
              <button onClick={openCreate}
                className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors">
                설교 등록
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Overlays ── */}
      {showFolderMgr && (
        <FolderManager
          folders={folders}
          onClose={() => setShowFolderMgr(false)}
          onRefresh={refresh}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">이 설교를 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 설교는 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
