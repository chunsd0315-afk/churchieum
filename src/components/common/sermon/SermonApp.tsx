import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Search, X, BookOpen, ChevronLeft, Filter } from 'lucide-react';
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

  const openDetail = (s: Sermon) => { setSelectedId(s.id); if (isMobile) setView('detail'); };
  const openCreate = () => { setEditing(null); setView('form'); };
  const openEdit = (s: Sermon) => { setEditing(s); setView('form'); };

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

  return (
    <SermonShell>
      <SermonPageHeader title="설교" description="예배 설교 말씀을 다시 보고 묵상하세요." action={registerBtn} />

      {!isMobile ? (
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
      ) : (
        listPanel
      )}

      {showFolderMgr && <SermonFolderManager onClose={() => setShowFolderMgr(false)} onRefresh={refresh} />}
      {deleteId && <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />}
    </SermonShell>
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
