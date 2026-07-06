import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus, Search, X, Settings, BookOpen, ChevronLeft, Filter,
} from 'lucide-react';
import type { Sermon } from '../../types/sermon';
import { WORSHIP_TYPE_LABELS, WORSHIP_TAB_TYPES } from '../../types/sermon';
import {
  getAllSermons, addSermon, updateSermon, deleteSermon, getUniquePreachers,
} from '../../lib/sermonStorage';
import { deleteCommentsForSermon } from '../../lib/sermonCommentStorage';
import { deleteLikesForSermon } from '../../lib/sermonEngagementStorage';
import {
  filterSermonsForUser, filterSermonList, trySyncSermonToSupabase,
} from '../../lib/sermonHelpers';
import { getLikeCountForSermon } from '../../lib/sermonEngagementStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import ContentEditorLayout from '../shared/ContentEditorLayout';
import { PageHeaderBar } from '../ui';
import SermonListCard from './SermonListCard';
import SermonDetail from './SermonDetail';
import SermonForm, { type SermonFormData } from './SermonForm';
import SermonFolderManager from './SermonFolderManager';
import type { SermonStatus } from '../../types/sermon';

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
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [showFolderMgr, setShowFolderMgr] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [worshipTab, setWorshipTab] = useState('all');
  const [search, setSearch] = useState('');
  const [filterPreacher, setFilterPreacher] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const refresh = useCallback(() => setSermons(getAllSermons()), []);

  const visible = useMemo(
    () => filterSermonsForUser(sermons, user),
    [sermons, user],
  );

  const filtered = useMemo(
    () => filterSermonList(visible, {
      worshipType: worshipTab,
      preacher: filterPreacher,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      query: search.trim() || undefined,
    }),
    [visible, worshipTab, filterPreacher, filterDateFrom, filterDateTo, search],
  );

  const preachers = useMemo(() => getUniquePreachers(visible), [visible]);
  const selected = filtered.find(s => s.id === selectedId) ?? filtered[0] ?? null;

  const openDetail = (s: Sermon) => {
    setSelectedId(s.id);
    if (isMobile) setView('detail');
  };

  const openCreate = () => {
    setEditing(null);
    setView('form');
  };

  const openEdit = (s: Sermon) => {
    setEditing(s);
    setView('form');
  };

  const handleSave = (data: SermonFormData, status: SermonStatus) => {
    const payload = { ...data, status };
    if (editing) {
      const updated = updateSermon(editing.id, payload);
      if (updated) trySyncSermonToSupabase(updated);
    } else {
      const created = addSermon(payload);
      trySyncSermonToSupabase(created);
    }
    refresh();
    setView(isMobile ? 'list' : 'list');
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteSermon(id);
    deleteCommentsForSermon(id);
    deleteLikesForSermon(id);
    setDeleteId(null);
    refresh();
    if (selectedId === id) {
      setSelectedId(null);
      setView('list');
    }
  };

  const worshipTabs = [
    { id: 'all', label: '전체' },
    ...WORSHIP_TAB_TYPES.map(wt => ({ id: wt, label: WORSHIP_TYPE_LABELS[wt] })),
  ];

  if (view === 'form') {
    return (
      <ContentEditorLayout
        title={editing ? '설교 수정' : '설교 등록'}
        onBack={() => { setEditing(null); setView(selected ? 'detail' : 'list'); }}
      >
        <div className="bg-white rounded-[20px] p-5 sm:p-6 max-w-2xl mx-auto"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <SermonForm
            editing={editing}
            user={user}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setView('list'); }}
          />
        </div>
      </ContentEditorLayout>
    );
  }

  const listPanel = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {worshipTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setWorshipTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              worshipTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {canManageFolders && (
          <button type="button" onClick={() => setShowFolderMgr(true)}
            className="shrink-0 p-2.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            aria-label="폴더 관리">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="제목, 본문, 설교자 검색"
          className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      <button type="button" onClick={() => setShowFilters(f => !f)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 px-1">
        <Filter className="w-4 h-4" />
        {showFilters ? '필터 닫기' : '필터'}
      </button>

      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">설교자</label>
            <select value={filterPreacher} onChange={e => setFilterPreacher(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base">
              <option value="all">전체</option>
              {preachers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">시작일</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">종료일</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(s => (
            <SermonListCard
              key={s.id}
              sermon={s}
              selected={selected?.id === s.id}
              likeCount={Math.max(s.likeCount, getLikeCountForSermon(s.id))}
              onSelect={() => openDetail(s)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-400 text-base">
            {search || worshipTab !== 'all' ? '검색 결과가 없습니다' : '등록된 설교가 없습니다'}
          </p>
          {canManage && !search && (
            <button type="button" onClick={openCreate}
              className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl text-base font-bold">
              설교 등록
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile && view === 'detail' && selected) {
    return (
      <div className="pb-10">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-2 py-2 flex items-center gap-2">
          <button type="button" onClick={() => setView('list')}
            className="p-2.5 hover:bg-gray-100 rounded-xl">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="font-bold text-gray-900 truncate flex-1">설교 상세</h2>
          {canManage && (
            <button type="button" onClick={() => openEdit(selected)}
              className="px-4 py-2 text-sm font-semibold text-primary-600">수정</button>
          )}
        </div>
        <div className="p-4">
          <SermonDetail
            sermon={selected}
            user={user}
            canManage={canManage}
            onEdit={() => openEdit(selected)}
            onDelete={() => setDeleteId(selected.id)}
            renderExtraActions={renderExtraActions}
          />
        </div>
        {deleteId && (
          <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
        )}
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeaderBar
        title="설교"
        description="예배 설교 말씀을 다시 보고 묵상하세요."
        action={
          canManage ? (
            <button type="button" onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 shadow-sm">
              <Plus className="w-5 h-5" /> 설교 등록
            </button>
          ) : undefined
        }
      />

      {!isMobile ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-5 mt-4">
          <div className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
            {listPanel}
          </div>
          <div className="min-w-0">
            {selected ? (
              <SermonDetail
                sermon={selected}
                user={user}
                canManage={canManage}
                onEdit={() => openEdit(selected)}
                onDelete={() => setDeleteId(selected.id)}
                renderExtraActions={renderExtraActions}
              />
            ) : (
              <div className="py-24 text-center bg-white rounded-2xl border border-gray-100">
                <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">왼쪽에서 설교를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">{listPanel}</div>
      )}

      {showFolderMgr && (
        <SermonFolderManager onClose={() => setShowFolderMgr(false)} onRefresh={refresh} />
      )}
      {deleteId && (
        <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
      )}
    </div>
  );
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-2">이 설교를 삭제하시겠습니까?</h3>
        <p className="text-sm text-gray-500 mb-5">삭제한 설교는 복구할 수 없습니다.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onConfirm}
            className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-base font-bold">삭제</button>
          <button type="button" onClick={onCancel}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl text-base font-bold">취소</button>
        </div>
      </div>
    </div>
  );
}
