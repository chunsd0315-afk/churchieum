/**
 * 은혜기록 페이지
 * 말씀을 삶으로 이어가는 신앙 기록 공간
 */

import { useState, useEffect } from 'react';
import {
  Heart, BookOpen, Mic, ChevronRight, PenLine, Users, ArrowLeft,
} from 'lucide-react';
import {
  getAllGraceNotes, getSharedGraceNotesForPastor,
  type GraceNote, type GraceNoteType,
} from '../../data/graceNotes';
import { ensureGraceNoteDemoData } from '../../data/graceNoteSeed';
import { getFaithTimeline } from '../../data/faithTimeline';
import { getAllProgresses, getPlanColor } from '../../data/readingPlans';
import {
  GraceNoteFormView, SermonGraceFormView, PersonalGraceFormView,
  GraceNoteListView, GraceNoteDetailView, visibilityMeta,
  type GraceFormCtx, type SermonGraceFormCtx,
} from '../../components/member/GraceNotesView';
import { ReadingProgressPicker, buildReadingFormCtx } from '../../components/member/ReadingProgressPicker';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeaderBar } from '../../components/common/ui';

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

const WRITE_BUTTONS = [
  {
    key: 'reading',
    icon: BookOpen,
    title: '성경통독 은혜기록',
    description: '오늘 읽은 말씀에서 받은 은혜를 기록합니다.',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    key: 'sermon',
    icon: Mic,
    title: '설교 은혜기록',
    description: '예배와 설교를 통해 받은 은혜를 기록합니다.',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    key: 'personal',
    icon: PenLine,
    title: '자유 은혜기록',
    description: '일상 속 은혜와 감사를 자유롭게 기록합니다.',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
] as const;

export default function GraceNotesPage() {
  const { isPastor, user } = useAuth();
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
    const sharedNotes = getSharedGraceNotesForPastor(user);
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg touch-target">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">담당 성도 은혜기록</h2>
            <p className="text-xs text-gray-400">성도들이 공유한 은혜기록</p>
          </div>
        </div>
        <div className="flex-1 bg-white p-4 space-y-3">
          {sharedNotes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 text-sm">공유된 은혜기록이 없습니다</p>
            </div>
          ) : sharedNotes.map(note => {
            const vm = visibilityMeta(note.visibility ?? 'private');
            return (
              <button
                key={note.id}
                onClick={() => navToDetail(note.id, 'pastor-notes')}
                className="w-full text-left bg-gray-50 rounded-2xl border border-gray-100 p-4 hover:bg-gray-100/80 transition-colors touch-target">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.authorName && <span className="text-xs font-semibold text-gray-700">{note.authorName}</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${vm.color}`}>
                      {vm.icon} {vm.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatDate(note.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{note.graceContent}</p>
              </button>
            );
          })}
        </div>
      </div>
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

  const handleWriteClick = (key: typeof WRITE_BUTTONS[number]['key']) => {
    if (key === 'reading') {
      startNewReading();
      return;
    }
    if (key === 'sermon') {
      setBackView('main');
      setSermonCtx(null);
      setView('sermon-form');
      return;
    }
    setBackView('main');
    setPersonalEditId(undefined);
    setView('personal-form');
  };

  return (
    <div className="pb-10 bg-white">
      <PageHeaderBar
        title="은혜기록"
        description="말씀과 삶을 연결하는 나만의 신앙노트입니다. 설교와 성경통독에서 받은 은혜를 기록하며 믿음의 발자취를 남겨보세요."
      />

      <div className="flex flex-col md:grid md:grid-cols-3 gap-3 mb-8">
        {WRITE_BUTTONS.map(btn => (
          <WriteActionCard
            key={btn.key}
            icon={btn.icon}
            iconBg={btn.iconBg}
            iconColor={btn.iconColor}
            title={btn.title}
            description={btn.description}
            onClick={() => handleWriteClick(btn.key)}
          />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">최근 은혜기록</h2>
        {recentNotes.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
            <Heart className="w-10 h-10 text-rose-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 기록된 은혜가 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">위 버튼을 눌러 첫 은혜기록을 남겨보세요.</p>
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

        <button
          type="button"
          onClick={() => { setListType(undefined); setView('all-list'); }}
          className="w-full flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-100 px-5 min-h-[56px] hover:bg-gray-100/60 transition-colors touch-target text-left"
        >
          <span className="text-[15px] font-semibold text-gray-800">은혜기록 모아보기</span>
          <span className="text-sm text-primary-600 font-medium flex items-center gap-1">
            전체 보기 <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {isPastor && (
          <button
            type="button"
            onClick={() => setView('pastor-notes')}
            className="w-full flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-100 px-5 min-h-[56px] hover:bg-gray-100/60 transition-colors touch-target text-left"
          >
            <span className="text-[15px] font-semibold text-gray-800">담당 성도 은혜기록</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </section>
    </div>
  );
}

function WriteActionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  onClick,
}: {
  icon: typeof BookOpen;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} — ${description}`}
      className="w-full flex items-center gap-3.5 px-4 py-4 min-h-[88px]
        md:flex-col md:items-start md:gap-2 md:p-5 md:min-h-[120px]
        bg-white rounded-[18px] border border-[#E5E7EB]
        shadow-[0_2px_8px_rgba(0,0,0,0.05)]
        hover:bg-gray-50/60 active:bg-gray-50 active:scale-[0.98]
        transition-all cursor-pointer touch-target text-left
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div
        className={`w-11 h-11 md:w-8 md:h-8 rounded-xl md:rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-5 h-5 md:w-4 md:h-4 ${iconColor}`} aria-hidden />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="font-bold text-gray-900 text-[15px] md:text-[15px] leading-snug">{title}</p>
        <p className="text-[12px] md:text-[13px] text-[#6B7280] leading-snug mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 md:hidden" aria-hidden />
    </button>
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
