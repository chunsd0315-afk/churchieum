/**
 * 은혜와 기도 페이지
 * 목록 → 상세 → 수정 → 상세 → 목록 흐름을 유지합니다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Heart, Edit3, Trash2 } from 'lucide-react';
import {
  getAllGraceNotes,
  deleteGraceNote,
  type GraceNote, type GraceNoteType,
} from '../../data/graceNotes';
import { ensureGraceNoteDemoData } from '../../data/graceNoteSeed';
import { getFaithTimeline } from '../../data/faithTimeline';
import {
  GraceNoteEditor,
  GraceNoteListView, GraceNoteDetailView,
  type ReadingEditorCtx, type SermonEditorCtx,
} from '../../components/member/GraceNotesView';
import { GraceNoteListRow } from '../../components/member/GraceNoteListRow';
import { ReadingProgressPicker, buildReadingFormCtx } from '../../components/member/ReadingProgressPicker';
import { getAllProgresses } from '../../data/readingPlans';
import { useAuth } from '../../contexts/AuthContext';
import { getGraceListBadge } from '../../services/graceNoteShareScope';
import { ensurePrayersMigratedToGraceNotes } from '../../services/prayerGraceNoteMigration';

type SubView =
  | 'today'
  | 'write'
  | 'reading-pick'
  | 'all-list'
  | 'detail'
  | 'timeline';

const HISTORY_KEY = 'churchieum-grace-nav';

type GraceHistoryState = {
  [HISTORY_KEY]: true;
  layer: 'detail' | 'edit';
  id: string;
};

function formatDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, '.');
}

function readGraceHistory(): GraceHistoryState | null {
  const state = window.history.state as GraceHistoryState | null;
  if (state?.[HISTORY_KEY] && (state.layer === 'detail' || state.layer === 'edit') && state.id) {
    return state;
  }
  return null;
}

function EditTargetMissing({ onGoList }: { onGoList: () => void }) {
  useEffect(() => {
    onGoList();
  }, [onGoList]);
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-gray-600">기록을 찾을 수 없어 목록으로 이동합니다.</p>
    </div>
  );
}

export default function GraceNotesPage({
  onOpenSermon,
}: {
  onOpenSermon?: (sermonId: string) => void;
} = {}) {
  const { user } = useAuth();
  const [view, setView] = useState<SubView>('all-list');
  const [, setRefresh] = useState(0);
  const [listMineReset, setListMineReset] = useState(0);
  const listScrollRef = useRef(0);
  const pendingSaveDetailIdRef = useRef<string | null>(null);

  useEffect(() => {
    ensureGraceNoteDemoData();
    ensurePrayersMigratedToGraceNotes();
    setRefresh(n => n + 1);
  }, []);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [writeType, setWriteType] = useState<GraceNoteType | undefined>(undefined);
  const [lockWriteType, setLockWriteType] = useState(false);
  const [readingCtx, setReadingCtx] = useState<ReadingEditorCtx | null>(null);
  const [sermonCtx, setSermonCtx] = useState<SermonEditorCtx | null>(null);
  const [pickReturn, setPickReturn] = useState<SubView>('write');

  const allNotes = getAllGraceNotes();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayNotes = allNotes.filter(n => n.createdAt.slice(0, 10) === todayStr);

  const captureListScroll = () => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop || 0;
  };

  const restoreListScroll = useCallback(() => {
    const top = listScrollRef.current;
    requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: 'auto' });
    });
  }, []);

  const clearWriteState = () => {
    setEditId(undefined);
    setReadingCtx(null);
    setSermonCtx(null);
    setWriteType(undefined);
    setLockWriteType(false);
  };

  const goToCollection = useCallback(() => {
    clearWriteState();
    setDetailId(null);
    setView('all-list');
    restoreListScroll();
  }, [restoreListScroll]);

  const goToDetail = useCallback((id: string, opts?: { pushHistory?: boolean; replaceHistory?: boolean }) => {
    clearWriteState();
    setDetailId(id);
    setView('detail');
    const hist: GraceHistoryState = { [HISTORY_KEY]: true, layer: 'detail', id };
    if (opts?.replaceHistory) {
      window.history.replaceState(hist, '');
    } else if (opts?.pushHistory) {
      window.history.pushState(hist, '');
    }
  }, []);

  const navToDetail = (id: string) => {
    captureListScroll();
    goToDetail(id, { pushHistory: true });
  };

  const handleDetailBack = useCallback(() => {
    const hist = readGraceHistory();
    if (hist?.layer === 'detail') {
      window.history.back();
      return;
    }
    goToCollection();
  }, [goToCollection]);

  const openEdit = (note: GraceNote, opts?: { fromDetail?: boolean }) => {
    if (!opts?.fromDetail) {
      captureListScroll();
      setDetailId(note.id);
      // 목록에서 바로 수정해도 뒤로가기는 상세로 — detail 이력을 먼저 쌓음
      window.history.pushState(
        { [HISTORY_KEY]: true, layer: 'detail', id: note.id } satisfies GraceHistoryState,
        '',
      );
    }
    setEditId(note.id);
    setWriteType(note.type);
    setLockWriteType(true);
    setReadingCtx(null);
    setSermonCtx(null);
    setView('write');
    window.history.pushState(
      { [HISTORY_KEY]: true, layer: 'edit', id: note.id } satisfies GraceHistoryState,
      '',
    );
  };

  const handleEditBack = useCallback(() => {
    const id = editId ?? detailId;
    const hist = readGraceHistory();
    if (hist?.layer === 'edit') {
      window.history.back();
      return;
    }
    if (id) {
      goToDetail(id);
      return;
    }
    goToCollection();
  }, [editId, detailId, goToDetail, goToCollection]);

  const handleEditSave = useCallback((savedId: string) => {
    clearWriteState();
    setListMineReset(n => n + 1);
    const hist = readGraceHistory();
    if (hist?.layer === 'edit') {
      // edit 이력 제거 후 상세 이력으로 — 다음 뒤로가기는 목록
      pendingSaveDetailIdRef.current = savedId;
      window.history.back();
      return;
    }
    setDetailId(savedId);
    setView('detail');
  }, []);

  const handleDetailDelete = useCallback(() => {
    const hist = readGraceHistory();
    if (hist?.layer === 'detail' || hist?.layer === 'edit') {
      window.history.replaceState({}, '');
    }
    goToCollection();
    setRefresh(n => n + 1);
  }, [goToCollection]);

  useEffect(() => {
    const onPopState = () => {
      const pendingSaveId = pendingSaveDetailIdRef.current;
      if (pendingSaveId) {
        pendingSaveDetailIdRef.current = null;
        clearWriteState();
        setDetailId(pendingSaveId);
        setView('detail');
        window.history.replaceState(
          { [HISTORY_KEY]: true, layer: 'detail', id: pendingSaveId } satisfies GraceHistoryState,
          '',
        );
        return;
      }

      const hist = readGraceHistory();
      if (hist?.layer === 'edit') {
        setDetailId(hist.id);
        setEditId(hist.id);
        const note = getAllGraceNotes().find(n => n.id === hist.id);
        setWriteType(note?.type);
        setLockWriteType(true);
        setView('write');
        return;
      }
      if (hist?.layer === 'detail') {
        clearWriteState();
        setDetailId(hist.id);
        setView('detail');
        return;
      }
      clearWriteState();
      setDetailId(null);
      setView(prev => (prev === 'detail' || prev === 'write' ? 'all-list' : prev));
      restoreListScroll();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreListScroll]);

  const openWrite = (opts?: {
    type?: GraceNoteType;
    lockType?: boolean;
    reading?: ReadingEditorCtx | null;
    sermon?: SermonEditorCtx | null;
  }) => {
    // 신규 작성 — 유형 선택 화면 없이 바로 작성 (기본: 기도)
    setDetailId(null);
    setEditId(undefined);
    setWriteType(opts?.type ?? 'prayer');
    setLockWriteType(Boolean(opts?.lockType));
    setReadingCtx(opts?.reading ?? null);
    setSermonCtx(opts?.sermon ?? null);
    setView('write');
  };

  const startReadingPick = (from: SubView) => {
    setPickReturn(from);
    setView('reading-pick');
  };

  if (view === 'reading-pick') {
    const readingProgresses = getAllProgresses().filter(
      p => p.status === 'active' || p.status === 'paused',
    );
    return (
      <ReadingProgressPicker
        progresses={readingProgresses}
        onBack={() => setView(pickReturn)}
        onSelect={progress => {
          const ctx = buildReadingFormCtx(progress);
          setReadingCtx(ctx);
          setWriteType('reading');
          setLockWriteType(true);
          setView('write');
        }}
      />
    );
  }

  // 신규 작성 (editId 없음) — 목록 언마운트 허용
  if (view === 'write' && !editId) {
    return (
      <GraceNoteEditor
        onSave={() => {
          clearWriteState();
          setView('all-list');
          setListMineReset(n => n + 1);
        }}
        onBack={() => {
          clearWriteState();
          setView('all-list');
        }}
        initialType={writeType ?? 'prayer'}
        lockType={lockWriteType}
        readingCtx={readingCtx}
        sermonCtx={sermonCtx}
        onNeedReadingPick={() => startReadingPick('write')}
      />
    );
  }

  const showList =
    view === 'all-list' || view === 'detail' || (view === 'write' && Boolean(editId));
  const showDetail = view === 'detail' && Boolean(detailId);
  const showEdit = view === 'write' && Boolean(editId);

  if (showList || showDetail || showEdit) {
    const detailExists = detailId ? Boolean(getAllGraceNotes().find(n => n.id === detailId)) : false;
    const editExists = editId ? Boolean(getAllGraceNotes().find(n => n.id === editId)) : false;

    return (
      <>
        {showList && (
          <div
            style={{ display: view === 'all-list' ? undefined : 'none' }}
            aria-hidden={view !== 'all-list'}
          >
            <GraceNoteListView
              isRootPage
              onBack={() => setView('all-list')}
              resetToMineSignal={listMineReset}
              onWrite={() => openWrite()}
              onDetail={id => navToDetail(id)}
              onEdit={note => openEdit(note, { fromDetail: false })}
            />
          </div>
        )}

        {showDetail && detailId && (
          detailExists ? (
            <GraceNoteDetailView
              noteId={detailId}
              onBack={handleDetailBack}
              onEdit={() => {
                const note = getAllGraceNotes().find(n => n.id === detailId);
                if (note) openEdit(note, { fromDetail: true });
              }}
              onDelete={handleDetailDelete}
              onOpenSermon={onOpenSermon}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-600 mb-4">기록을 찾을 수 없습니다.</p>
              <button
                type="button"
                onClick={goToCollection}
                className="text-primary-600 font-semibold text-sm touch-target"
              >
                목록으로 돌아가기
              </button>
            </div>
          )
        )}

        {showEdit && editId && (
          editExists ? (
            <GraceNoteEditor
              onSave={handleEditSave}
              onBack={handleEditBack}
              editId={editId}
              initialType={writeType}
              lockType
              confirmLeaveWhenDirty
            />
          ) : (
            <EditTargetMissing onGoList={goToCollection} />
          )
        )}
      </>
    );
  }

  if (view === 'today') {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button type="button" onClick={() => setView('all-list')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">오늘의 은혜</h2>
            <p className="text-xs text-gray-400">{formatDate(todayStr)}</p>
          </div>
        </div>
        <div className="flex-1 bg-white p-4 md:p-6">
          {todayNotes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
              <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-600 text-sm">오늘 기록된 은혜가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1 mb-5">오늘 받은 은혜를 기록해보세요.</p>
            </div>
          ) : (
            <div className="church-list">
              {todayNotes.map(note => {
                const isOwn = Boolean(user?.id && note.userId === user.id);
                return (
                  <GraceNoteListRow
                    key={note.id}
                    note={note}
                    shareBadge={getGraceListBadge(note, user, isOwn ? 'mine' : 'shared')}
                    onClick={() => navToDetail(note.id)}
                    menuItems={isOwn ? [
                      {
                        label: '수정',
                        icon: <Edit3 style={{ width: '15px', height: '15px' }} />,
                        onClick: () => openEdit(note, { fromDetail: false }),
                      },
                      {
                        label: '삭제',
                        icon: <Trash2 style={{ width: '15px', height: '15px' }} />,
                        danger: true,
                        onClick: () => {
                          deleteGraceNote(note.id);
                          setRefresh(n => n + 1);
                        },
                      },
                    ] : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'timeline') {
    const events = getFaithTimeline(40);
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button type="button" onClick={() => setView('all-list')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">신앙 성장 타임라인</h2>
            <p className="text-xs text-gray-400">시간순 신앙 활동 기록</p>
          </div>
        </div>
        <div className="flex-1 bg-white p-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">아직 기록된 활동이 없습니다.</p>
          ) : events.map(ev => (
            <div key={ev.id} className="flex gap-3 items-start">
              <span className="text-xl shrink-0 w-8 text-center">{ev.emoji}</span>
              <div className="flex-1 min-w-0 pb-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{ev.title}</p>
                {ev.subtitle && <p className="text-xs text-gray-500 mt-0.5">{ev.subtitle}</p>}
                <p className="text-[10px] text-gray-400 mt-1">{formatDate(ev.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
