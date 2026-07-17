/**
 * 은혜기록 페이지
 * 말씀을 삶으로 이어가는 신앙 기록 공간
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import {
  getAllGraceNotes,
  type GraceNote, type GraceNoteType,
} from '../../data/graceNotes';
import { ensureGraceNoteDemoData } from '../../data/graceNoteSeed';
import { getFaithTimeline } from '../../data/faithTimeline';
import {
  GraceNoteEditor,
  GraceNoteListView, GraceNoteDetailView,
  type ReadingEditorCtx, type SermonEditorCtx,
} from '../../components/member/GraceNotesView';
import { ReadingProgressPicker, buildReadingFormCtx } from '../../components/member/ReadingProgressPicker';
import { useAuth } from '../../contexts/AuthContext';
import { FeatureHubPage } from '../../components/common/feature-hub';
import { GRACE_HUB } from '../../config/featureHub/memberHubs';

type SubView =
  | 'main'
  | 'today'
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

function excerpt(text: string, max = 60) {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max) + '…';
}

export default function GraceNotesPage() {
  const { isPastor, isAdmin, user } = useAuth();
  const [view, setView] = useState<SubView>('main');
  const [, setRefresh] = useState(0);

  useEffect(() => {
    ensureGraceNoteDemoData();
    setRefresh(n => n + 1);
  }, []);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [backView, setBackView] = useState<SubView>('main');
  const backViewRef = useRef<SubView>('main');
  backViewRef.current = backView;

  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [writeType, setWriteType] = useState<GraceNoteType | undefined>(undefined);
  const [lockWriteType, setLockWriteType] = useState(false);
  const [readingCtx, setReadingCtx] = useState<ReadingEditorCtx | null>(null);
  const [sermonCtx, setSermonCtx] = useState<SermonEditorCtx | null>(null);
  const [pickReturn, setPickReturn] = useState<SubView>('write');

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
  }) => {
    setBackView(opts?.from ?? 'main');
    setEditId(opts?.editId);
    setWriteType(opts?.type);
    setLockWriteType(Boolean(opts?.lockType));
    setReadingCtx(opts?.reading ?? null);
    setSermonCtx(opts?.sermon ?? null);
    setView('write');
  };

  const navToEdit = (note: GraceNote, from: SubView) => {
    openWrite({
      editId: note.id,
      type: note.type,
      from,
    });
  };

  const startReadingPick = (from: SubView) => {
    setPickReturn(from);
    setView('reading-pick');
  };

  if (view === 'reading-pick') {
    return (
      <ReadingProgressPicker
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

  if (view === 'write') {
    return (
      <GraceNoteEditor
        onSave={id => navToDetail(id, backView === 'detail' ? 'main' : backView)}
        onBack={() => {
          setEditId(undefined);
          setReadingCtx(null);
          setSermonCtx(null);
          setWriteType(undefined);
          if (backView === 'all-list') {
            setView(backView);
          } else {
            setView('main');
          }
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
              onBack={() => setView('main')}
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
          <button type="button" onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
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
              {todayNotes.map(note => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => navToDetail(note.id, 'today')}
                  className="church-list-row"
                >
                  <p className="text-base text-gray-800 leading-relaxed line-clamp-4">
                    &ldquo;{excerpt(note.graceContent, 120)}&rdquo;
                  </p>
                  <p className="text-xs text-gray-400 mt-3">{formatDate(note.createdAt)}</p>
                </button>
              ))}
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
          <button type="button" onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
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

  const handleHubSelect = (id: string) => {
    if (id === 'write') {
      openWrite({ from: 'main' });
      return;
    }
    if (id === 'all-list') {
      setView('all-list');
    }
  };

  return (
    <FeatureHubPage
      title={GRACE_HUB.title}
      description={GRACE_HUB.description}
      features={GRACE_HUB.features}
      viewer={{ isPastor, isAdmin, role: user?.role }}
      onSelect={handleHubSelect}
    />
  );
}
