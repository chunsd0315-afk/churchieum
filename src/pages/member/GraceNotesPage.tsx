/**
 * 은혜기록 페이지
 * 말씀을 삶으로 이어가는 신앙 기록 공간
 */

import { useState, useEffect } from 'react';
import {
  Heart, BookOpen, Users, ArrowLeft,
} from 'lucide-react';
import {
  getAllGraceNotes, getSharedGraceNotesForPastor,
  type GraceNote, type GraceNoteType,
} from '../../data/graceNotes';
import { ensureGraceNoteDemoData, formatSharedPastorLabel, formatSharedGroupLabel } from '../../data/graceNoteSeed';
import { getFaithTimeline } from '../../data/faithTimeline';
import { getAllProgresses, getPlanColor } from '../../data/readingPlans';
import {
  GraceNoteFormView, SermonGraceFormView, PersonalGraceFormView,
  GraceNoteListView, GraceNoteDetailView, visibilityMeta,
  type GraceFormCtx, type SermonGraceFormCtx,
} from '../../components/member/GraceNotesView';
import { ReadingProgressPicker, buildReadingFormCtx } from '../../components/member/ReadingProgressPicker';
import { useAuth } from '../../contexts/AuthContext';
import { FeatureHubPage } from '../../components/common/feature-hub';
import { GRACE_HUB } from '../../config/featureHub/memberHubs';
import { MobileFullScreenPage } from '../../components/layout/ContentEditorLayout';

type SubView =
  | 'main'
  | 'today'
  | 'reading-pick'
  | 'reading-form'
  | 'sermon-form'
  | 'personal-form'
  | 'reading-list'
  | 'sermon-list'
  | 'all-list'
  | 'detail'
  | 'pastor-notes'
  | 'timeline';

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
  const [readingCtx, setReadingCtx] = useState<GraceFormCtx | null>(null);
  const [sermonCtx, setSermonCtx] = useState<SermonGraceFormCtx | null>(null);
  const [personalEditId, setPersonalEditId] = useState<string | undefined>(undefined);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [listType, setListType] = useState<GraceNoteType | undefined>(undefined);
  const [, setEditNote] = useState<GraceNote | null>(null);
  const [backView, setBackView] = useState<SubView>('main');

  const allNotes = getAllGraceNotes();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayNotes = allNotes.filter(n => n.createdAt.slice(0, 10) === todayStr);
  const recentNotes = [...allNotes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const activeProgresses = getAllProgresses().filter(p => p.status === 'active');

  const navToDetail = (id: string, from: SubView) => {
    setDetailId(id);
    setBackView(from);
    setView('detail');
  };

  const navToEdit = (note: GraceNote, from: SubView) => {
    setBackView(from);
    setEditNote(note);
    if (note.type === 'reading') {
      setReadingCtx({
        progressId: note.sourceId ?? '',
        planId: note.planId ?? '',
        planName: note.planName ?? '',
        planColor: note.planColor ?? (note.planId ? getPlanColor(note.planId as import('../../data/readingPlans').PlanId) : 'from-primary-500 to-primary-700'),
        day: note.day ?? 1,
        readingReferences: note.bibleReference ?? '',
        editId: note.id,
      });
      setView('reading-form');
    } else if (note.type === 'personal') {
      setPersonalEditId(note.id);
      setView('personal-form');
    } else {
      setSermonCtx({
        sermonId: note.sourceId,
        sermonTitle: note.sermonTitle,
        sermonPreacher: note.sermonPreacher,
        sermonDate: note.sermonDate,
        bibleReference: note.bibleReference,
        editId: note.id,
      });
      setView('sermon-form');
    }
  };

  const startNewReading = () => {
    if (activeProgresses.length === 0) {
      setBackView('main');
      setView('reading-pick');
      return;
    }
    if (activeProgresses.length === 1) {
      setReadingCtx(buildReadingFormCtx(activeProgresses[0]));
      setBackView('main');
      setView('reading-form');
      return;
    }
    setBackView('main');
    setView('reading-pick');
  };

  const openReadingForm = (prog: typeof activeProgresses[0]) => {
    setReadingCtx(buildReadingFormCtx(prog));
    setBackView(view === 'reading-pick' ? 'main' : backView);
    setView('reading-form');
  };

  // ── sub-views ──────────────────────────────────────────────────────────────

  if (view === 'reading-pick') {
    if (activeProgresses.length === 0) {
      return (
        <div className="flex flex-col p-6 text-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">진행 중인 성경통독이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">성경통독센터에서 플랜을 시작해보세요.</p>
          <button onClick={() => setView('main')} className="text-primary-600 font-semibold text-sm">돌아가기</button>
        </div>
      );
    }
    return (
      <ReadingProgressPicker
        progresses={activeProgresses}
        onSelect={openReadingForm}
        onBack={() => setView('main')}
      />
    );
  }

  if (view === 'reading-form' && readingCtx) {
    return (
      <GraceNoteFormView
        ctx={readingCtx}
        onSave={id => { navToDetail(id, backView); }}
        onBack={() => setView(backView)}
      />
    );
  }

  if (view === 'sermon-form') {
    return (
      <SermonGraceFormView
        ctx={sermonCtx ?? {}}
        onSave={id => { navToDetail(id, backView); }}
        onBack={() => { setSermonCtx(null); setView(backView); }}
      />
    );
  }

  if (view === 'personal-form') {
    return (
      <PersonalGraceFormView
        editId={personalEditId}
        onSave={id => { navToDetail(id, backView); }}
        onBack={() => { setPersonalEditId(undefined); setView(backView); }}
      />
    );
  }

  if (view === 'all-list' || view === 'reading-list' || view === 'sermon-list') {
    return (
      <GraceNoteListView
        onBack={() => setView('main')}
        onDetail={id => navToDetail(id, view)}
        onEdit={note => navToEdit(note, view)}
        initialType={listType}
      />
    );
  }

  if (view === 'detail' && detailId) {
    return (
      <GraceNoteDetailView
        noteId={detailId}
        onBack={() => setView(backView)}
        onEdit={() => {
          const note = getAllGraceNotes().find(n => n.id === detailId);
          if (note) navToEdit(note, 'detail');
        }}
        onDelete={() => setView(backView)}
      />
    );
  }

  if (view === 'today') {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">오늘의 은혜</h2>
            <p className="text-xs text-gray-400">{formatDate(todayStr)}</p>
          </div>
        </div>
        <div className="flex-1 bg-white p-4 md:p-6 space-y-3">
          {todayNotes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
              <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-600 text-sm">오늘 기록된 은혜가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1 mb-5">오늘 받은 은혜를 기록해보세요.</p>
            </div>
          ) : todayNotes.map(note => (
            <button
              key={note.id}
              onClick={() => navToDetail(note.id, 'today')}
              className="w-full text-left bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:bg-gray-100/80 transition-colors touch-target">
              <p className="text-base text-gray-800 leading-relaxed line-clamp-4">
                &ldquo;{excerpt(note.graceContent, 120)}&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-3">{formatDate(note.createdAt)}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'pastor-notes') {
    if (!isPastor) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">접근 권한이 없습니다.</p>
          <button type="button" onClick={() => setView('main')} className="text-primary-600 font-semibold text-sm">
            돌아가기
          </button>
        </div>
      );
    }
    const sharedNotes = getSharedGraceNotesForPastor(user);
    return (
      <MobileFullScreenPage
        title="담당 성도 은혜기록"
        description="성도들이 공유한 은혜기록을 확인합니다."
        onBack={() => setView('main')}
      >
        <div className="space-y-3">
          {sharedNotes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 text-sm">공유된 은혜기록이 없습니다</p>
            </div>
          ) : sharedNotes.map(note => {
            const vm = visibilityMeta(note.visibility ?? 'private');
            const shareDetail =
              note.visibility === 'pastor'
                ? formatSharedPastorLabel(note)
                : note.visibility === 'group'
                  ? formatSharedGroupLabel(note)
                  : '';
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => navToDetail(note.id, 'pastor-notes')}
                className="w-full text-left bg-gray-50 rounded-2xl border border-gray-100 p-4 hover:bg-gray-100/80 transition-colors touch-target">
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
      </MobileFullScreenPage>
    );
  }

  if (view === 'timeline') {
    const events = getFaithTimeline(40);
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
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
    if (id === 'reading') {
      startNewReading();
      return;
    }
    if (id === 'sermon') {
      setBackView('main');
      setSermonCtx(null);
      setView('sermon-form');
      return;
    }
    if (id === 'personal') {
      setBackView('main');
      setPersonalEditId(undefined);
      setView('personal-form');
      return;
    }
    if (id === 'all-list') {
      setListType(undefined);
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
            <p className="text-sm text-gray-500">아직 기록된 은혜가 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">위 카드를 눌러 첫 은혜기록을 남겨보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
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

function RecentNoteRow({ note, onClick }: { note: GraceNote; onClick: () => void }) {
  const subtitle =
    note.type === 'sermon'
      ? (note.sermonTitle ?? note.bibleReference)
      : note.type === 'reading'
        ? (note.planName ? `${note.planName}${note.bibleReference ? ` · ${note.bibleReference}` : ''}` : note.bibleReference)
        : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50/80 transition-colors touch-target"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          {NOTE_TYPE_LABEL[note.type]}
        </span>
        <span className="text-[11px] text-gray-400 shrink-0">{formatDate(note.createdAt)}</span>
      </div>
      {subtitle && (
        <p className="text-[13px] font-medium text-gray-700 line-clamp-1 mb-1">{subtitle}</p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{excerpt(note.graceContent, 80)}</p>
    </button>
  );
}
