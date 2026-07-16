/**
 * 은혜기록 페이지
 * 말씀을 삶으로 이어가는 신앙 기록 공간
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, BookOpen, Users, ArrowLeft, PenLine,
} from 'lucide-react';
import {
  getAllGraceNotes, getSharedGraceNotesForPastor, getMyRecentGraceNotes,
  type GraceNote, type GraceNoteType,
} from '../../data/graceNotes';
import { ensureGraceNoteDemoData, formatSharedPastorLabel, formatSharedGroupLabel } from '../../data/graceNoteSeed';
import { getFaithTimeline } from '../../data/faithTimeline';
import { getAllProgresses, getPlanColor } from '../../data/readingPlans';
import {
  GraceNoteEditor,
  GraceNoteListView, GraceNoteDetailView, visibilityMeta,
  type ReadingEditorCtx, type SermonEditorCtx,
} from '../../components/member/GraceNotesView';
import { ReadingProgressPicker, buildReadingFormCtx } from '../../components/member/ReadingProgressPicker';
import { useAuth } from '../../contexts/AuthContext';
import { FeatureHubPage } from '../../components/common/feature-hub';
import { GRACE_HUB } from '../../config/featureHub/memberHubs';
import { MobileFullScreenPage } from '../../components/layout/ContentEditorLayout';

type SubView =
  | 'main'
  | 'today'
  | 'write'
  | 'reading-pick'
  | 'all-list'
  | 'detail'
  | 'pastor-notes'
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

const NOTE_TYPE_LABEL: Record<GraceNoteType, string> = {
  reading: '성경통독',
  sermon: '설교',
  personal: '자유',
};

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
  const recentNotes = getMyRecentGraceNotes(user?.id, allNotes, 5);

  const activeProgresses = getAllProgresses().filter(p => p.status === 'active');

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
    setEditId(opts?.editId);
    setWriteType(opts?.type);
    setLockWriteType(Boolean(opts?.lockType || opts?.editId));
    setReadingCtx(opts?.reading ?? null);
    setSermonCtx(opts?.sermon ?? null);
    if (opts?.from) setBackView(opts.from);
    setView('write');
  };

  const navToEdit = (note: GraceNote, from: SubView) => {
    setBackView(from === 'detail' ? backView : from);
    if (note.type === 'reading') {
      openWrite({
        type: 'reading',
        lockType: true,
        editId: note.id,
        reading: {
          progressId: note.sourceId ?? '',
          planId: note.planId ?? '',
          planName: note.planName ?? '',
          planColor: note.planColor ?? (note.planId ? getPlanColor(note.planId as import('../../data/readingPlans').PlanId) : 'from-primary-500 to-primary-700'),
          day: note.day ?? 1,
          readingReferences: note.bibleReference ?? '',
        },
        from,
      });
      return;
    }
    if (note.type === 'sermon') {
      openWrite({
        type: 'sermon',
        lockType: true,
        editId: note.id,
        sermon: {
          sermonId: note.sourceId,
          sermonTitle: note.sermonTitle,
          sermonPreacher: note.sermonPreacher,
          sermonDate: note.sermonDate,
          bibleReference: note.bibleReference,
        },
        from,
      });
      return;
    }
    openWrite({ type: 'personal', lockType: true, editId: note.id, from });
  };

  const startReadingPick = (returnTo: SubView = 'write') => {
    setPickReturn(returnTo);
    if (activeProgresses.length === 0) {
      setView('reading-pick');
      return;
    }
    if (activeProgresses.length === 1) {
      const ctx = buildReadingFormCtx(activeProgresses[0]);
      openWrite({
        type: 'reading',
        lockType: false,
        reading: ctx,
        from: returnTo === 'write' ? 'main' : returnTo,
      });
      setWriteType('reading');
      setReadingCtx(ctx);
      setView('write');
      return;
    }
    setView('reading-pick');
  };

  // ── sub-views ──────────────────────────────────────────────────────────────

  if (view === 'reading-pick') {
    if (activeProgresses.length === 0) {
      return (
        <div className="flex flex-col p-6 text-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">진행 중인 성경통독이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">성경통독센터에서 플랜을 시작해보세요.</p>
          <button type="button" onClick={() => setView(pickReturn === 'write' ? 'main' : pickReturn)} className="text-primary-600 font-semibold text-sm">
            돌아가기
          </button>
        </div>
      );
    }
    return (
      <ReadingProgressPicker
        progresses={activeProgresses}
        onSelect={(prog) => {
          const ctx = buildReadingFormCtx(prog);
          setReadingCtx(ctx);
          setWriteType('reading');
          setLockWriteType(false);
          setEditId(undefined);
          setSermonCtx(null);
          setView('write');
        }}
        onBack={() => setView(pickReturn === 'write' ? 'write' : pickReturn)}
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
          if (backView === 'all-list' || backView === 'pastor-notes') {
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
  const showPastor = view === 'pastor-notes' || (view === 'detail' && backView === 'pastor-notes');
  const showDetail = view === 'detail' && Boolean(detailId);

  if (showList || showPastor || showDetail) {
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

        {showPastor && isPastor && (
          <div
            style={{ display: view === 'detail' ? 'none' : undefined }}
            aria-hidden={view === 'detail'}
          >
            <MobileFullScreenPage
              title="담당 성도 은혜기록"
              description="성도들이 공유한 은혜기록을 확인합니다."
              onBack={() => setView('main')}
            >
              <PastorNotesList
                user={user}
                onDetail={id => navToDetail(id, 'pastor-notes')}
              />
            </MobileFullScreenPage>
          </div>
        )}

        {showPastor && !isPastor && view === 'pastor-notes' && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">접근 권한이 없습니다.</p>
            <button type="button" onClick={() => setView('main')} className="text-primary-600 font-semibold text-sm">
              돌아가기
            </button>
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
                  className="church-list-row">
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

  // ── Main view ──────────────────────────────────────────────────────────────

  const handleHubSelect = (id: string) => {
    if (id === 'write') {
      setBackView('main');
      setEditId(undefined);
      setWriteType(undefined);
      setLockWriteType(false);
      setReadingCtx(null);
      setSermonCtx(null);
      setView('write');
      return;
    }
    if (id === 'all-list') {
      setView('all-list');
      return;
    }
    if (id === 'pastor-notes') {
      if (!isPastor) return;
      setView('pastor-notes');
    }
  };

  return (
    <FeatureHubPage
      title={GRACE_HUB.title}
      description={GRACE_HUB.description}
      features={GRACE_HUB.features}
      viewer={{ isPastor, isAdmin, role: user?.role }}
      onSelect={handleHubSelect}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">최근 은혜기록</h2>
        {recentNotes.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
            <Heart className="w-10 h-10 text-rose-200 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">아직 작성한 은혜기록이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">말씀과 삶 속에서 받은 은혜를 기록해 보세요.</p>
            <button
              type="button"
              onClick={() => handleHubSelect('write')}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-2xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 touch-target"
            >
              <PenLine className="w-4 h-4" />
              은혜기록 작성
            </button>
          </div>
        ) : (
          <div className="church-list">
            {recentNotes.map(note => (
              <RecentNoteRow
                key={note.id}
                note={note}
                onClick={() => navToDetail(note.id, 'main')}
              />
            ))}
          </div>
        )}
      </section>
    </FeatureHubPage>
  );
}

function PastorNotesList({
  user,
  onDetail,
}: {
  user: ReturnType<typeof useAuth>['user'];
  onDetail: (id: string) => void;
}) {
  const sharedNotes = getSharedGraceNotesForPastor(user);
  if (sharedNotes.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="font-semibold text-gray-500 text-sm">공유된 은혜기록이 없습니다</p>
      </div>
    );
  }
  return (
    <div className="church-list">
      {sharedNotes.map(note => {
        const vm = visibilityMeta(note.visibility ?? 'private', note.sharedGroupAll);
        const shareDetail =
          note.visibility === 'pastor_share'
            ? formatSharedPastorLabel(note)
            : note.visibility === 'organization_share'
              ? formatSharedGroupLabel(note)
              : '';
        return (
          <button
            key={note.id}
            type="button"
            onClick={() => onDetail(note.id)}
            className="church-list-row"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {note.authorName && <span className="text-xs font-semibold text-gray-700">{note.authorName}</span>}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${vm.color}`}>
                  {vm.icon} {vm.label}
                </span>
                {shareDetail && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                    {shareDetail}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">{formatDate(note.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{note.graceContent}</p>
          </button>
        );
      })}
    </div>
  );
}

function RecentNoteRow({ note, onClick }: { note: GraceNote; onClick: () => void }) {
  const vm = visibilityMeta(note.visibility ?? 'private', note.sharedGroupAll);
  const title =
    note.graceTitle
    || (note.type === 'sermon' ? note.sermonTitle : null)
    || (note.type === 'reading' ? note.bibleReference : null)
    || excerpt(note.graceContent, 28);

  const linkedInfo =
    note.type === 'sermon'
      ? [note.sermonPreacher, note.bibleReference].filter(Boolean).join(' · ')
      : note.type === 'reading'
        ? [note.planName, note.day ? `${note.day}일차` : null].filter(Boolean).join(' · ')
        : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="church-list-row"
    >
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          {NOTE_TYPE_LABEL[note.type]}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${vm.color}`}>
          {vm.label}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-gray-900 line-clamp-1 mb-1">{title}</p>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
        {excerpt(note.graceContent, 80)}
      </p>
      {linkedInfo && (
        <p className="text-[12px] text-gray-500 line-clamp-1 mb-1.5">{linkedInfo}</p>
      )}
      <p className="text-[11px] text-gray-400">
        {formatDate(note.createdAt)} · {vm.label}
      </p>
    </button>
  );
}
