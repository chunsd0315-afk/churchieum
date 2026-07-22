/**
 * 은혜기록 페이지
 * 은혜와 기도 — 말씀·기도 기록 공간
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
import { GraceNoteWritePicker } from '../../components/member/GraceNoteWritePicker';
import { GraceNotesHomeView } from '../../components/member/GraceNotesHomeView';
import { GraceNoteListRow } from '../../components/member/GraceNoteListRow';
import { ReadingProgressPicker, buildReadingFormCtx } from '../../components/member/ReadingProgressPicker';
import { getAllProgresses } from '../../data/readingPlans';
import { useAuth } from '../../contexts/AuthContext';
import { getGraceListBadge } from '../../services/graceNoteShareScope';
import { ensurePrayersMigratedToGraceNotes } from '../../services/prayerGraceNoteMigration';

type SubView =
  | 'home'
  | 'today'
  | 'write-pick'
  | 'write'
  | 'reading-pick'
  | 'all-list'
  | 'detail'
  | 'timeline';

const LIST_VIEWS: SubView[] = ['all-list'];
const HISTORY_DETAIL = 'churchieum-grace-detail';

function formatDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, '.');
}

export default function GraceNotesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<SubView>('home');
  const [, setRefresh] = useState(0);
  const [listMineReset, setListMineReset] = useState(0);

  useEffect(() => {
    ensureGraceNoteDemoData();
    ensurePrayersMigratedToGraceNotes();
    setRefresh(n => n + 1);
  }, []);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [backView, setBackView] = useState<SubView>('all-list');
  const backViewRef = useRef<SubView>('all-list');
  backViewRef.current = backView;

  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [writeType, setWriteType] = useState<GraceNoteType | undefined>(undefined);
  const [lockWriteType, setLockWriteType] = useState(false);
  const [readingCtx, setReadingCtx] = useState<ReadingEditorCtx | null>(null);
  const [sermonCtx, setSermonCtx] = useState<SermonEditorCtx | null>(null);
  const [pickReturn, setPickReturn] = useState<SubView>('write-pick');

  const allNotes = getAllGraceNotes();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayNotes = allNotes.filter(n => n.createdAt.slice(0, 10) === todayStr);

  const closeDetail = useCallback(() => {
    setView(backViewRef.current);
  }, []);

  const navToDetail = (id: string, from: SubView) => {
    setDetailId(id);
    setBackView(from);
    setView('detail');
    window.history.pushState({ [HISTORY_DETAIL]: true, from }, '');
  };

  const handleDetailBack = useCallback(() => {
    const state = window.history.state as Record<string, unknown> | null;
    if (state?.[HISTORY_DETAIL]) {
      window.history.back();
      return;
    }
    closeDetail();
  }, [closeDetail]);

  useEffect(() => {
    const onPopState = () => {
      setView(prev => (prev === 'detail' ? backViewRef.current : prev));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openWrite = (opts?: {
    type?: GraceNoteType;
    lockType?: boolean;
    editId?: string;
    reading?: ReadingEditorCtx | null;
    sermon?: SermonEditorCtx | null;
    from?: SubView;
    skipPicker?: boolean;
  }) => {
    setBackView(opts?.from ?? 'home');
    setEditId(opts?.editId);
    setWriteType(opts?.type);
    setLockWriteType(Boolean(opts?.lockType ?? Boolean(opts?.type)));
    setReadingCtx(opts?.reading ?? null);
    setSermonCtx(opts?.sermon ?? null);
    if (opts?.editId || opts?.skipPicker || opts?.type || opts?.reading || opts?.sermon) {
      setView('write');
    } else {
      setView('write-pick');
    }
  };

  const navToEdit = (note: GraceNote, from: SubView) => {
    openWrite({
      editId: note.id,
      type: note.type,
      from,
      skipPicker: true,
    });
  };

  const startReadingPick = (from: SubView) => {
    setPickReturn(from);
    setView('reading-pick');
  };

  if (view === 'home') {
    return (
      <GraceNotesHomeView
        onViewRecords={() => setView('all-list')}
        onWrite={() => openWrite({ from: 'home' })}
      />
    );
  }

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

  if (view === 'write-pick') {
    return (
      <GraceNoteWritePicker
        onBack={() => setView(backViewRef.current === 'all-list' ? 'all-list' : 'home')}
        onSelectReading={() => startReadingPick('write-pick')}
        onSelectSermon={() => openWrite({ type: 'sermon', lockType: true, from: backView, skipPicker: true })}
        onSelectPrayer={() => openWrite({ type: 'prayer', lockType: true, from: backView, skipPicker: true })}
      />
    );
  }

  if (view === 'write') {
    const writeBackTarget = editId
      ? (backView === 'detail' ? 'detail' : 'all-list')
      : 'write-pick';
    return (
      <GraceNoteEditor
        onSave={() => {
          setEditId(undefined);
          setReadingCtx(null);
          setSermonCtx(null);
          setWriteType(undefined);
          setView('all-list');
          setListMineReset(n => n + 1);
        }}
        onBack={() => {
          setEditId(undefined);
          setReadingCtx(null);
          setSermonCtx(null);
          setWriteType(undefined);
          setView(writeBackTarget);
        }}
        editId={editId}
        initialType={writeType}
        lockType={lockWriteType}
        readingCtx={readingCtx}
        sermonCtx={sermonCtx}
        onNeedReadingPick={() => startReadingPick('write')}
      />
    );
  }

  const showList = LIST_VIEWS.includes(view) || (view === 'detail' && LIST_VIEWS.includes(backView));
  const showDetail = view === 'detail' && Boolean(detailId);

  if (showList || showDetail) {
    return (
      <>
        {showList && (
          <div
            style={{ display: view === 'detail' ? 'none' : undefined }}
            aria-hidden={view === 'detail'}
          >
            <GraceNoteListView
              isRootPage={false}
              onBack={() => setView('home')}
              resetToMineSignal={listMineReset}
              onWrite={() => openWrite({ from: 'all-list' })}
              onDetail={id => navToDetail(id, 'all-list')}
              onEdit={note => navToEdit(note, 'all-list')}
            />
          </div>
        )}

        {showDetail && detailId && (
          <GraceNoteDetailView
            noteId={detailId}
            onBack={handleDetailBack}
            onEdit={() => {
              const note = getAllGraceNotes().find(n => n.id === detailId);
              if (note) navToEdit(note, 'detail');
            }}
            onDelete={handleDetailBack}
          />
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
                    onClick={() => navToDetail(note.id, 'today')}
                    menuItems={isOwn ? [
                      {
                        label: '수정',
                        icon: <Edit3 style={{ width: '15px', height: '15px' }} />,
                        onClick: () => navToEdit(note, 'today'),
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
