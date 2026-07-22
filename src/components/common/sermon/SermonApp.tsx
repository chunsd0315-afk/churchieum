import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus, Search, X, BookOpen, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Youtube,
  Pencil, Trash2, PenLine,
} from 'lucide-react';
import { countGraceNotesBySermon } from '../../../data/graceNotes';
import type { Sermon, SermonFolder, SermonStatus } from '../../../types/sermon';
import {
  getAllSermons, addSermon, updateSermon, deleteSermon, getSelectableFolders,
} from '../../../services/sermonStorage';
import { deleteCommentsForSermon } from '../../../services/sermonCommentStorage';
import { deleteLikesForSermon } from '../../../services/sermonEngagementStorage';
import {
  filterSermonsForUser, filterSermonList, trySyncSermonToSupabase,
  SERMON_DRAFT_TAB_ID, canViewSermonDrafts,
} from '../../../services/sermonHelpers';
import { useAuth } from '../../../contexts/AuthContext';
import { PageHeaderBar, MobileFab, ChurchDropdownMenu } from '../ui';
import ContentEditorLayout from '../../layout/ContentEditorLayout';
import SermonDetail from './SermonDetail';
import SermonForm, { type SermonFormData } from './SermonForm';
import SermonFolderManager from './SermonFolderManager';
import SermonFolderTabs from './SermonFolderTabs';
import { SermonYoutubeThumb, formatShortDate } from './sermonUiUtils';
import {
  SermonShell, SermonCard, sermonPrimaryBtnClass, sermonInputClass,
} from './sermonDesign';

export type SermonAppProps = {
  canManage: boolean;
  canManageFolders?: boolean;
  renderExtraActions?: (sermon: Sermon) => React.ReactNode;
  /** 설교 플레이어에서 은혜기록 작성 */
  onGraceWrite?: (sermon: Sermon) => void;
  /** 은혜기록 작성 후 돌아올 때 유지할 설교 ID */
  initialSelectedId?: string | null;
};

type View = 'list' | 'detail' | 'form';

const PAGE_SIZE = 10;

export default function SermonApp({
  canManage,
  canManageFolders = false,
  renderExtraActions,
  onGraceWrite,
  initialSelectedId,
}: SermonAppProps) {
  const { user } = useAuth();

  const [sermons, setSermons] = useState(() => getAllSermons());
  const [folders, setFolders] = useState<SermonFolder[]>(() => getSelectableFolders());
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [showFolderMgr, setShowFolderMgr] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState(false);
  const [page, setPage] = useState(1);

  const refresh = useCallback(() => {
    setSermons(getAllSermons());
    setFolders(getSelectableFolders());
  }, []);

  // 외부에서 선택 설교 복원 (은혜기록 작성 후 돌아올 때)
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
      setPlaying(true);
    }
  }, [initialSelectedId]);

  const visible = useMemo(() => filterSermonsForUser(sermons, user), [sermons, user]);
  const filtered = useMemo(
    () => filterSermonList(visible, {
      folderId: activeFolder,
      query: search.trim() || undefined,
    }),
    [visible, activeFolder, search],
  );

  const selected = filtered.find(s => s.id === selectedId) ?? filtered[0] ?? null;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 폴더/검색 변경 시 첫 페이지로 이동 + 플레이어 썸네일 상태로 초기화
  useEffect(() => { setPage(1); setPlaying(false); }, [activeFolder, search]);

  const folderTabs = useMemo(() => {
    const tabs = [{ id: 'all', label: '전체' }];
    if (canViewSermonDrafts(user)) {
      tabs.push({ id: SERMON_DRAFT_TAB_ID, label: '임시저장' });
    }
    tabs.push(...folders.map(f => ({ id: f.id, label: f.name })));
    return tabs;
  }, [folders, user]);

  // 임시저장 탭은 최고관리자만 — 권한 없으면 전체로 되돌림
  useEffect(() => {
    if (activeFolder === SERMON_DRAFT_TAB_ID && !canViewSermonDrafts(user)) {
      setActiveFolder('all');
    }
  }, [activeFolder, user]);

  // 삭제되었거나 더 이상 선택할 수 없는 폴더를 보고 있으면 안전하게 전체로 복귀한다.
  useEffect(() => {
    if (activeFolder === 'all' || activeFolder === SERMON_DRAFT_TAB_ID) return;
    if (!folders.some(folder => folder.id === activeFolder)) {
      setActiveFolder('all');
    }
  }, [activeFolder, folders]);

  // 폼/상세로 이동할 때 폴더 오버레이가 남아있지 않도록 상태를 정리한다.
  useEffect(() => {
    if (view !== 'list' && showFolderMgr) {
      setShowFolderMgr(false);
    }
  }, [view, showFolderMgr]);

  const openCreate = () => {
    setShowFolderMgr(false);
    setEditing(null);
    setView('form');
  };
  const openEdit = (s: Sermon) => {
    setShowFolderMgr(false);
    setEditing(s);
    setView('form');
  };

  // 카드 선택 → 상단 고정 플레이어에서 재생
  const playSermon = (s: Sermon) => {
    setSelectedId(s.id);
    setPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (data: SermonFormData, status: SermonStatus) => {
    const payload = {
      ...data,
      thumbnailUrl: data.thumbnailUrl || undefined,
      summary: '',
      tags: [] as string[],
      attachments: [],
      status,
    };
    let saved: Sermon | null = null;
    if (editing) {
      saved = updateSermon(editing.id, payload);
      if (saved) trySyncSermonToSupabase(saved);
    } else {
      saved = addSermon(payload);
      trySyncSermonToSupabase(saved);
    }
    refresh();
    setView('list');
    setEditing(null);
    if (status === 'draft') {
      setActiveFolder(SERMON_DRAFT_TAB_ID);
    } else if (saved?.folderId) {
      setActiveFolder(saved.folderId);
    } else {
      setActiveFolder('all');
    }
  };

  const handleDelete = (id: string) => {
    // 현재 선택된 설교가 삭제되면 이전 설교(없으면 첫 번째)를 자동 선택
    if (selected?.id === id) {
      const idx = filtered.findIndex(s => s.id === id);
      const rest = filtered.filter(s => s.id !== id);
      const next = rest[Math.max(0, idx - 1)] ?? rest[0] ?? null;
      setSelectedId(next?.id ?? null);
      setPlaying(false);
    }
    deleteSermon(id); deleteCommentsForSermon(id); deleteLikesForSermon(id);
    setDeleteId(null);
    setView('list');
    refresh();
  };

  const registerBtn = canManage ? (
    <button type="button" onClick={openCreate} className={sermonPrimaryBtnClass}>
      <Plus className="w-5 h-5" /> 설교 등록
    </button>
  ) : undefined;

  /* ── 등록 / 수정 폼 ── */
  if (view === 'form') {
    return (
      <SermonShell>
        <ContentEditorLayout
          title={editing ? '설교 수정' : '설교 등록'}
          onBack={() => { setEditing(null); setView('list'); }}
        >
          <SermonCard className="p-5 md:p-7">
            <SermonForm editing={editing} onSave={handleSave}
              onCancel={() => { setEditing(null); setView('list'); }} />
          </SermonCard>
        </ContentEditorLayout>
      </SermonShell>
    );
  }

  /* ── 설교 상세 (댓글 · 은혜기록 등) ── */
  if (view === 'detail' && selected) {
    return (
      <SermonShell>
        <div className="sticky top-14 md:top-0 z-30 -mx-6 px-6 py-3 mb-4 flex items-center gap-2 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E5E7EB]">
          <button type="button" onClick={() => setView('list')} className="p-2.5 hover:bg-white rounded-[14px]">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-extrabold text-gray-900 truncate flex-1">설교 상세</h2>
        </div>
        <div className="max-w-[900px] mx-auto">
          <SermonDetail sermon={selected} user={user} canManage={canManage}
            onEdit={() => openEdit(selected)} onDelete={() => setDeleteId(selected.id)}
            renderExtraActions={renderExtraActions} />
        </div>
        {deleteId && <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />}
      </SermonShell>
    );
  }

  /* ── 목록 (제목 → 폴더 탭 → 플레이어 → 검색·목록 → 페이지네이션, 단일 세로 스크롤) ── */
  return (
    <SermonShell>
      {/* 메뉴명 + 설명 + 등록 버튼 (PC 전용 — 모바일은 고정 App Header 사용) */}
      <PageHeaderBar
        title="설교"
        description="예배 설교 말씀을 다시 보고 묵상하세요."
        action={registerBtn}
      />

      {/* 예배 폴더 탭 + 플레이어 — sticky/fixed 없이 본문과 함께 스크롤 */}
      <div className="-mx-6 bg-[#F8FAFC]">
        <div className="px-6 pt-1">
          <div className="max-w-[900px] mx-auto">
            <SermonFolderTabs
              tabs={folderTabs}
              activeId={activeFolder}
              onSelect={setActiveFolder}
              onManageFolders={canManageFolders ? () => setShowFolderMgr(true) : undefined}
            />
          </div>
        </div>
        <div className="px-6 pt-1 pb-3 border-b border-[#E5E7EB]">
          <div className="max-w-[900px] mx-auto">
            <SermonPlayer
              sermon={selected}
              playing={playing}
              onPlay={() => setPlaying(true)}
              canManage={canManage}
              onEdit={() => { if (selected) openEdit(selected); }}
              onDelete={() => { if (selected) setDeleteId(selected.id); }}
              onGraceWrite={onGraceWrite ? () => { if (selected) onGraceWrite(selected); } : undefined}
            />
          </div>
        </div>
      </div>

      {/* 모바일 전용: 플로팅 설교 등록 버튼 */}
      {canManage && <MobileFab label="설교 등록" onClick={openCreate} />}

      {/* 검색 · 카드 목록 · 페이지네이션 — 내부 스크롤/고정 높이 없음 */}
      <div className="max-w-[900px] mx-auto pt-4 space-y-3">
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

        {filtered.length > 0 ? (
          <>
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
              {pageItems.map(s => (
                <SermonCardRow
                  key={s.id}
                  sermon={s}
                  active={selected?.id === s.id}
                  onSelect={() => playSermon(s)}
                  canManage={canManage}
                  onEdit={() => openEdit(s)}
                  onDelete={() => setDeleteId(s.id)}
                />
              ))}
            </div>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        ) : (
          <SermonCard className="py-16 text-center">
            <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-[#6B7280] text-base">
              {activeFolder === SERMON_DRAFT_TAB_ID
                ? '임시저장된 설교가 없습니다'
                : search || (activeFolder !== 'all' && activeFolder !== SERMON_DRAFT_TAB_ID)
                  ? '검색 결과가 없습니다'
                  : '등록된 설교가 없습니다'}
            </p>
            {canManage && !search && (
              <button type="button" onClick={openCreate} className={`${sermonPrimaryBtnClass} mt-5`}>설교 등록</button>
            )}
          </SermonCard>
        )}
      </div>

      {showFolderMgr && <SermonFolderManager onClose={() => setShowFolderMgr(false)} onRefresh={refresh} />}
      {deleteId && <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />}
    </SermonShell>
  );
}

/* ── 설교 수정/삭제 (공지사항과 동일한 ⋮ 메뉴) ── */
function SermonManageActions({
  onEdit, onDelete, className = '', layer = 'top',
}: {
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
  /** player → top, list → belowPlayer */
  layer?: 'top' | 'belowPlayer';
}) {
  return (
    <div className={`shrink-0 ${className}`}>
      <ChurchDropdownMenu
        layer={layer}
        ariaLabel="설교 관리 메뉴"
        items={[
          {
            label: '수정하기',
            icon: <Pencil style={{ width: '15px', height: '15px' }} />,
            onClick: onEdit,
          },
          {
            label: '삭제하기',
            icon: <Trash2 style={{ width: '15px', height: '15px' }} />,
            danger: true,
            onClick: onDelete,
          },
        ]}
      />
    </div>
  );
}

/* ── 설교 플레이어 (본문 스크롤과 함께 이동) ── */
function SermonPlayer({
  sermon, playing, onPlay, canManage, onEdit, onDelete, onGraceWrite,
}: {
  sermon: Sermon | null;
  playing: boolean;
  onPlay: () => void;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onGraceWrite?: () => void;
}) {
  if (!sermon) {
    return (
      <div className="rounded-2xl bg-white border border-[#E5E7EB] py-12 text-center px-4">
        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-[15px] font-semibold text-[#6B7280]">아래 목록에서 설교를 선택하세요</p>
        {onGraceWrite && (
          <p className="text-[13px] text-gray-400 mt-3">작성할 설교를 먼저 선택해주세요.</p>
        )}
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

      <div className="p-3">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[16px] font-extrabold text-gray-900 leading-snug line-clamp-2">
            {sermon.title}
          </h3>
          {canManage && (
            <SermonManageActions layer="top" className="shrink-0" onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1">
          <div className="flex items-center gap-2 min-w-0 flex-1 text-[12px] text-[#6B7280]">
            {sermon.scripture && (
              <span className="text-primary-600 font-semibold truncate">{sermon.scripture}</span>
            )}
            {sermon.scripture && <span className="text-gray-300 shrink-0">·</span>}
            <span className="truncate">{sermon.preacher}</span>
            <span className="text-gray-300 shrink-0">·</span>
            <span className="shrink-0">{formatShortDate(sermon.sermonDate)}</span>
          </div>
          {onGraceWrite && (
            <button
              type="button"
              onClick={onGraceWrite}
              className="inline-flex items-center justify-center gap-1 shrink-0 h-8 sm:h-[34px] px-2.5 sm:px-3 rounded-lg sm:rounded-[10px] text-[12px] sm:text-[13px] font-semibold bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">은혜 작성</span>
              <span className="sm:hidden">작성</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 설교 카드 (썸네일 · 제목 · 본문 · 설교자 · 날짜) ── */
function SermonCardRow({
  sermon, active, onSelect, canManage, onEdit, onDelete,
}: {
  sermon: Sermon;
  active: boolean;
  onSelect: () => void;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ytId = sermon.youtubeVideoId;
  const graceCount = countGraceNotesBySermon(sermon.id);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={`w-full text-left cursor-pointer flex items-center gap-3 p-3 border-b border-[#E5E7EB] last:border-b-0 transition-colors ${
        active ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="relative shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ width: 104, height: 64 }}>
        {ytId ? (
          <>
            <SermonYoutubeThumb videoId={ytId} title={sermon.title} className="w-full h-full" />
            <span className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </span>
            </span>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
            <BookOpen className="w-6 h-6 text-white/60" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-1">
            {sermon.title || '(제목 없음)'}
          </p>
          {sermon.status === 'draft' && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
              임시저장
            </span>
          )}
        </div>
        {sermon.scripture && (
          <p className="text-[13px] text-primary-600 font-semibold mt-1 truncate">{sermon.scripture}</p>
        )}
        <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">
          {sermon.preacher} · {formatShortDate(sermon.sermonDate)}
        </p>
        {graceCount > 0 && (
          <p className="text-[11px] text-primary-600 font-semibold mt-1 flex items-center gap-1">
            <PenLine className="w-3 h-3" /> 기록 {graceCount}개
          </p>
        )}
      </div>

      {canManage ? (
        <SermonManageActions layer="belowPlayer" className="shrink-0" onEdit={onEdit} onDelete={onDelete} />
      ) : active ? (
        <Play className="w-5 h-5 shrink-0 text-primary-600 fill-primary-600" />
      ) : (
        <ChevronRight className="w-5 h-5 shrink-0 text-gray-300" />
      )}
    </div>
  );
}

/* ── 페이지네이션  <<  <  1 2 3 4 5  >  >> ── */
function Pagination({
  page, totalPages, onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const edgeBtn = 'w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors';

  return (
    <nav className="flex items-center justify-center gap-1 pt-4" aria-label="설교 목록 페이지">
      <button type="button" className={edgeBtn} disabled={page === 1} onClick={() => onChange(1)} aria-label="첫 페이지">
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button type="button" className={edgeBtn} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="이전 페이지">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {nums.map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-[14px] font-bold transition-colors ${
            n === page
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
          {n}
        </button>
      ))}
      <button type="button" className={edgeBtn} disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="다음 페이지">
        <ChevronRight className="w-4 h-4" />
      </button>
      <button type="button" className={edgeBtn} disabled={page === totalPages} onClick={() => onChange(totalPages)} aria-label="마지막 페이지">
        <ChevronsRight className="w-4 h-4" />
      </button>
    </nav>
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
