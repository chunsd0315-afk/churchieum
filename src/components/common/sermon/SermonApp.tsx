import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Search, X, BookOpen, ChevronLeft, ChevronRight, Filter, Play, Youtube } from 'lucide-react';
import type { Sermon, SermonFolder } from '../../../types/sermon';
import {
  getAllSermons, addSermon, updateSermon, deleteSermon, getUniquePreachers,
  getSelectableFolders,
} from '../../../services/sermonStorage';
import { deleteCommentsForSermon } from '../../../services/sermonCommentStorage';
import { deleteLikesForSermon, getLikeCountForSermon } from '../../../services/sermonEngagementStorage';
import { filterSermonsForUser, filterSermonList, trySyncSermonToSupabase } from '../../../services/sermonHelpers';
import { useAuth } from '../../../contexts/AuthContext';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import ContentEditorLayout from '../../layout/ContentEditorLayout';
import SermonListCard from './SermonListCard';
import SermonDetail from './SermonDetail';
import SermonForm, { type SermonFormData } from './SermonForm';
import SermonFolderManager from './SermonFolderManager';
import SermonFolderTabs from './SermonFolderTabs';
import { SermonYoutubeThumb, formatShortDate } from './sermonUiUtils';
import type { SermonStatus } from '../../../types/sermon';
import {
  SermonShell, SermonPageHeader, SermonCard, sermonPrimaryBtnClass, sermonGhostBtnClass, sermonInputClass,
} from './sermonDesign';

export type SermonAppProps = {
  canManage: boolean;
  canManageFolders?: boolean;
  renderExtraActions?: (sermon: Sermon) => React.ReactNode;
};

type View = 'list' | 'detail' | 'form';

export default function SermonApp({
  canManage,
  canManageFolders = false,
  renderExtraActions,
}: SermonAppProps) {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();

  const [sermons, setSermons] = useState(() => getAllSermons());
  const [folders, setFolders] = useState<SermonFolder[]>(() => getSelectableFolders());
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [showFolderMgr, setShowFolderMgr] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFolder, setActiveFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [filterPreacher, setFilterPreacher] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [playing, setPlaying] = useState(false);

  const refresh = useCallback(() => {
    setSermons(getAllSermons());
    setFolders(getSelectableFolders());
  }, []);
  const visible = useMemo(() => filterSermonsForUser(sermons, user), [sermons, user]);
  const filtered = useMemo(
    () => filterSermonList(visible, {
      folderId: activeFolder, preacher: filterPreacher,
      dateFrom: filterDateFrom || undefined, dateTo: filterDateTo || undefined,
      query: search.trim() || undefined,
    }),
    [visible, activeFolder, filterPreacher, filterDateFrom, filterDateTo, search],
  );
  const preachers = useMemo(() => getUniquePreachers(visible), [visible]);
  const selected = filtered.find(s => s.id === selectedId) ?? filtered[0] ?? null;

  // 폴더 변경 시 고정 플레이어는 썸네일 상태로 초기화
  useEffect(() => { setPlaying(false); }, [activeFolder]);

  const openDetail = (s: Sermon) => { setSelectedId(s.id); if (isMobile) setView('detail'); };
  const openCreate = () => { setEditing(null); setView('form'); };
  const openEdit = (s: Sermon) => { setEditing(s); setView('form'); };

  // 모바일: 목록 항목 탭 → 상단 고정 플레이어에서 재생
  const playSermon = (s: Sermon) => {
    setSelectedId(s.id);
    setPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (data: SermonFormData, status: SermonStatus) => {
    if (editing) { const u = updateSermon(editing.id, { ...data, status }); if (u) trySyncSermonToSupabase(u); }
    else { const c = addSermon({ ...data, status }); trySyncSermonToSupabase(c); }
    refresh(); setView('list'); setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteSermon(id); deleteCommentsForSermon(id); deleteLikesForSermon(id);
    setDeleteId(null); refresh();
    if (selectedId === id) { setSelectedId(null); setView('list'); }
  };

  const folderTabs = useMemo(
    () => [
      { id: 'all', label: '전체' },
      ...folders.map(f => ({ id: f.id, label: f.name })),
    ],
    [folders],
  );

  const registerBtn = canManage ? (
    <button type="button" onClick={openCreate} className={sermonPrimaryBtnClass}>
      <Plus className="w-5 h-5" /> 설교 등록
    </button>
  ) : undefined;

  if (view === 'form') {
    return (
      <SermonShell>
        <ContentEditorLayout
          title={editing ? '설교 수정' : '설교 등록'}
          onBack={() => { setEditing(null); setView(selected ? 'detail' : 'list'); }}
        >
          <SermonCard className="p-5 md:p-7 max-w-2xl mx-auto">
            <SermonForm editing={editing} user={user} onSave={handleSave}
              onCancel={() => { setEditing(null); setView('list'); }} />
          </SermonCard>
        </ContentEditorLayout>
      </SermonShell>
    );
  }

  const listPanel = (
    <div className="space-y-4">
      <SermonFolderTabs
        tabs={folderTabs}
        activeId={activeFolder}
        onSelect={setActiveFolder}
        onManageFolders={canManageFolders ? () => setShowFolderMgr(true) : undefined}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="제목, 본문, 설교자 검색"
          className={`${sermonInputClass} pl-12 pr-12 !bg-white`}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      <button type="button" onClick={() => setShowFilters(f => !f)} className={sermonGhostBtnClass}>
        <Filter className="w-4 h-4" />
        {showFilters ? '필터 닫기' : '필터'}
      </button>

      {showFilters && (
        <SermonCard className="p-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-800 mb-2 block">설교자</label>
            <select value={filterPreacher} onChange={e => setFilterPreacher(e.target.value)} className={sermonInputClass}>
              <option value="all">전체</option>
              {preachers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">시작일</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={sermonInputClass} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">종료일</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={sermonInputClass} />
            </div>
          </div>
        </SermonCard>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(s => (
            <SermonListCard key={s.id} sermon={s} selected={selected?.id === s.id}
              likeCount={Math.max(s.likeCount, getLikeCountForSermon(s.id))} onSelect={() => openDetail(s)} />
          ))}
        </div>
      ) : (
        <SermonCard className="py-16 text-center">
          <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-[#6B7280] text-base">
            {search || activeFolder !== 'all' ? '검색 결과가 없습니다' : '등록된 설교가 없습니다'}
          </p>
          {canManage && !search && (
            <button type="button" onClick={openCreate} className={`${sermonPrimaryBtnClass} mt-5`}>설교 등록</button>
          )}
        </SermonCard>
      )}
    </div>
  );

  if (isMobile && view === 'detail' && selected) {
    return (
      <SermonShell>
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 flex items-center gap-2 bg-[#F7F9FB]/95 backdrop-blur-sm border-b border-[#E5E7EB]">
          <button type="button" onClick={() => setView('list')} className="p-2.5 hover:bg-white rounded-[14px]">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-extrabold text-gray-900 truncate flex-1">설교 상세</h2>
          {canManage && (
            <button type="button" onClick={() => openEdit(selected)}
              className="px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 rounded-[14px]">수정</button>
          )}
        </div>
        <SermonDetail sermon={selected} user={user} canManage={canManage}
          onEdit={() => openEdit(selected)} onDelete={() => setDeleteId(selected.id)}
          renderExtraActions={renderExtraActions} />
        {deleteId && <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />}
      </SermonShell>
    );
  }

  // ── 모바일: 폴더 리스트 → 고정 플레이어 → 번호 목록 ──
  const mobileListView = (
    <>
      {/* 상단 고정: 예배 폴더 탭 + 플레이어 */}
      <div className="sticky top-14 z-20 -mx-4 bg-[#F8FAFC]">
        <SermonFolderTabs
          tabs={folderTabs}
          activeId={activeFolder}
          onSelect={setActiveFolder}
          onManageFolders={canManageFolders ? () => setShowFolderMgr(true) : undefined}
        />
        <div className="px-4 pt-3 pb-3 border-b border-[#E5E7EB]">
          <MobileStickyPlayer
            sermon={selected}
            playing={playing}
            onPlay={() => setPlaying(true)}
            onOpenDetail={() => selected && setView('detail')}
          />
        </div>
      </div>

      {/* 검색 + 등록 */}
      <div className="pt-3 space-y-3">
        {canManage && (
          <button type="button" onClick={openCreate}
            className="w-full flex items-center justify-center gap-2 h-12 bg-primary-600 text-white rounded-[14px] font-bold text-[15px] hover:bg-primary-700 transition-colors">
            <Plus className="w-5 h-5" /> 설교 등록
          </button>
        )}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="제목, 본문, 설교자 검색"
            className={`${sermonInputClass} pl-12 pr-12 !bg-white`}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* 번호 목록 */}
        {filtered.length > 0 ? (
          <div className="space-y-2.5">
            {filtered.map((s, i) => (
              <NumberedSermonRow
                key={s.id}
                index={i + 1}
                sermon={s}
                active={selected?.id === s.id}
                onSelect={() => playSermon(s)}
              />
            ))}
          </div>
        ) : (
          <SermonCard className="py-16 text-center">
            <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-[#6B7280] text-base">
              {search || activeFolder !== 'all' ? '검색 결과가 없습니다' : '등록된 설교가 없습니다'}
            </p>
          </SermonCard>
        )}
      </div>
    </>
  );

  return (
    <SermonShell>
      {!isMobile ? (
        <>
          <SermonPageHeader title="설교" description="예배 설교 말씀을 다시 보고 묵상하세요." action={registerBtn} />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
            <div className="lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1">{listPanel}</div>
            <div className="min-w-0">
              {selected ? (
                <SermonDetail sermon={selected} user={user} canManage={canManage}
                  onEdit={() => openEdit(selected)} onDelete={() => setDeleteId(selected.id)}
                  renderExtraActions={renderExtraActions} />
              ) : (
                <SermonCard className="py-24 text-center">
                  <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-[#6B7280] font-semibold text-base">왼쪽에서 설교를 선택하세요</p>
                </SermonCard>
              )}
            </div>
          </div>
        </>
      ) : (
        mobileListView
      )}

      {showFolderMgr && <SermonFolderManager onClose={() => setShowFolderMgr(false)} onRefresh={refresh} />}
      {deleteId && <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />}
    </SermonShell>
  );
}

/* ── 모바일 상단 고정 플레이어 ── */
function MobileStickyPlayer({
  sermon, playing, onPlay, onOpenDetail,
}: {
  sermon: Sermon | null;
  playing: boolean;
  onPlay: () => void;
  onOpenDetail: () => void;
}) {
  if (!sermon) {
    return (
      <div className="rounded-2xl bg-white border border-[#E5E7EB] py-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-[15px] font-semibold text-[#6B7280]">아래 목록에서 설교를 선택하세요</p>
      </div>
    );
  }

  const ytId = sermon.youtubeVideoId;

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-sm">
      <div className="relative w-full aspect-video bg-gray-900">
        {playing && ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            className="w-full h-full"
            title={sermon.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : ytId ? (
          <button type="button" onClick={onPlay} className="absolute inset-0">
            <SermonYoutubeThumb videoId={ytId} title={sermon.title} className="w-full h-full" />
            <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full bg-red-600/95 flex items-center justify-center shadow-xl">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </span>
            </span>
            <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 rounded-lg">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] text-white font-bold">YouTube</span>
            </span>
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
            <BookOpen className="w-16 h-16 text-white/30" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-extrabold text-gray-900 leading-snug line-clamp-1">{sermon.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-[12px] text-[#6B7280]">
            {sermon.scripture && <span className="text-primary-600 font-semibold truncate">{sermon.scripture}</span>}
            {sermon.scripture && <span className="text-gray-300">·</span>}
            <span className="truncate">{sermon.preacher}</span>
            <span className="text-gray-300">·</span>
            <span className="shrink-0">{formatShortDate(sermon.sermonDate)}</span>
          </div>
        </div>
        <button type="button" onClick={onOpenDetail}
          className="shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-[12px] bg-[#F1F5F9] text-gray-700 text-[13px] font-bold hover:bg-gray-200 transition-colors">
          상세 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── 모바일 번호 목록 항목 ── */
function NumberedSermonRow({
  index, sermon, active, onSelect,
}: {
  index: number;
  sermon: Sermon;
  active: boolean;
  onSelect: () => void;
}) {
  const ytId = sermon.youtubeVideoId;
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <div className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-colors ${
        active ? 'bg-primary-50 border-primary-300' : 'bg-white border-[#E5E7EB] hover:bg-gray-50'
      }`}>
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-extrabold ${
          active ? 'bg-primary-600 text-white' : 'bg-[#F1F5F9] text-[#6B7280]'
        }`}>
          {index}
        </span>

        <div className="relative shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ width: 72, height: 46 }}>
          {ytId ? (
            <>
              <SermonYoutubeThumb videoId={ytId} title={sermon.title} className="w-full h-full" />
              <span className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                </span>
              </span>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
              <BookOpen className="w-5 h-5 text-white/60" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-1">{sermon.title}</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">
            {sermon.scripture ? `${sermon.scripture} · ` : ''}{sermon.preacher}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formatShortDate(sermon.sermonDate)}</p>
        </div>

        {active
          ? <Play className="w-5 h-5 shrink-0 text-primary-600 fill-primary-600" />
          : <ChevronRight className="w-5 h-5 shrink-0 text-gray-300" />}
      </div>
    </button>
  );
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[20px] w-full max-w-sm p-6 border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,.08)]">
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">이 설교를 삭제하시겠습니까?</h3>
        <p className="text-[15px] text-[#6B7280] mb-6">삭제한 설교는 복구할 수 없습니다.</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm}
            className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-[14px] font-bold text-base">삭제</button>
          <button type="button" onClick={onCancel}
            className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-[14px] font-bold text-base">취소</button>
        </div>
      </div>
    </div>
  );
}
