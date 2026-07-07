/**
 * 은혜기록 페이지
 * 성경통독 은혜기록 + 설교 은혜기록 + 모아보기
 */

import { useState } from 'react';
import {
  Heart, BookOpen, Mic, ChevronRight, Plus,
  BookMarked, Sparkles, ArrowLeft, BarChart2, Users,
} from 'lucide-react';
import {
  getAllGraceNotes, analyzeGraceNotes,
  type GraceNote, type GraceNoteType,
} from '../../data/graceNotes';
import { getAllProgresses } from '../../data/readingPlans';
import {
  GraceNoteFormView, SermonGraceFormView,
  GraceNoteListView, GraceNoteDetailView, visibilityMeta,
  type GraceFormCtx, type SermonGraceFormCtx,
} from '../../components/member/GraceNotesView';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeaderBar, MobileFab } from '../../components/common/ui';

type SubView =
  | 'main'
  | 'today'
  | 'reading-form'
  | 'sermon-form'
  | 'reading-list'
  | 'sermon-list'
  | 'all-list'
  | 'detail'
  | 'pastor-notes';

export default function GraceNotesPage() {
  const { isPastor } = useAuth();
  const [view, setView] = useState<SubView>('main');
  const [readingCtx, setReadingCtx] = useState<GraceFormCtx | null>(null);
  const [sermonCtx, setSermonCtx] = useState<SermonGraceFormCtx | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [listType, setListType] = useState<GraceNoteType | undefined>(undefined);
  const [, setEditNote] = useState<GraceNote | null>(null);
  const [backView, setBackView] = useState<SubView>('main');

  const allNotes = getAllGraceNotes();
  const analytics = analyzeGraceNotes(allNotes);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayNotes = allNotes.filter(n => n.createdAt.slice(0, 10) === todayStr);

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
        planColor: note.planColor ?? 'from-primary-500 to-primary-700',
        day: note.day ?? 1,
        readingReferences: note.bibleReference ?? '',
        editId: note.id,
      });
      setView('reading-form');
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

  // ── reading form: new note from progress picker ─────────────────────────────
  const startNewReading = (prog?: typeof activeProgresses[0]) => {
    if (!prog) return;
    setReadingCtx({
      progressId: prog.id,
      planId: prog.planId,
      planName: prog.planName,
      planColor: 'from-primary-500 to-primary-700',
      day: prog.currentDay,
      readingReferences: `${prog.planName} ${prog.currentDay}일차`,
      editId: undefined,
    });
    setBackView('main');
    setView('reading-form');
  };

  // ── render sub-views ────────────────────────────────────────────────────────

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

  if ((view === 'all-list' || view === 'reading-list' || view === 'sermon-list')) {
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
          <button onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">오늘의 은혜기록</h2>
            <p className="text-xs text-gray-400">{todayStr.replace(/-/g, '.')}</p>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 p-4 space-y-3">
          {todayNotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 text-sm">오늘 기록된 은혜가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1 mb-5">오늘 받은 은혜를 기록해보세요.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => { setBackView('today'); setView('sermon-form'); }}
                  className="px-4 py-2.5 bg-gradient-to-r from-secondary-500 to-primary-600 text-white text-sm font-bold rounded-2xl flex items-center gap-2">
                  <Mic className="w-4 h-4" /> 설교 은혜기록
                </button>
                {activeProgresses.length > 0 && (
                  <button
                    onClick={() => startNewReading(activeProgresses[0])}
                    className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-bold rounded-2xl flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> 성경통독 은혜기록
                  </button>
                )}
              </div>
            </div>
          ) : todayNotes.map(note => (
            <button
              key={note.id}
              onClick={() => navToDetail(note.id, 'today')}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${note.type === 'reading' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {note.type === 'reading' ? '성경통독' : '설교'}
                </span>
                {note.type === 'reading' && note.planName && (
                  <span className="text-xs text-gray-500">{note.planName} · {note.day}일차</span>
                )}
                {note.type === 'sermon' && note.sermonTitle && (
                  <span className="text-xs text-gray-500">{note.sermonTitle}</span>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{note.graceContent}</p>
              <div className="flex items-center justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Pastor view: 담당 성도 은혜기록 ─────────────────────────────────────────

  if (view === 'pastor-notes') {
    const sharedNotes = getAllGraceNotes().filter(n =>
      n.visibility === 'pastor' || n.visibility === 'group'
    );
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">담당 성도 은혜기록</h2>
            <p className="text-xs text-gray-400">성도들이 공유한 은혜기록</p>
          </div>
          <span className="text-xs text-gray-400">{sharedNotes.length}개</span>
        </div>
        <div className="flex-1 bg-gray-50 p-4 space-y-3">
          {sharedNotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 text-sm">공유된 은혜기록이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">성도들이 은혜기록을 공유하면 여기에 표시됩니다.</p>
            </div>
          ) : sharedNotes.map(note => {
            const vm = visibilityMeta(note.visibility ?? 'private');
            return (
              <div key={note.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${note.type === 'reading' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {note.type === 'reading' ? '성경통독' : '설교'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${vm.color}`}>
                      {vm.icon} {vm.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {note.type === 'reading'
                    ? `${note.planName ?? ''} ${note.day ?? ''}일차`
                    : (note.sermonTitle ?? '설교 은혜기록')}
                </p>
                {note.bibleReference && (
                  <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {note.bibleReference}
                  </p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{note.graceContent}</p>
                {note.memorableVerse && (
                  <div className="mt-2 bg-primary-50 rounded-xl px-3 py-2 border-l-2 border-primary-300">
                    <p className="text-xs text-primary-700 font-medium line-clamp-1">
                      <BookMarked className="w-3 h-3 inline mr-1" />{note.memorableVerse}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <div className="pb-8">
      <PageHeaderBar
        title="은혜기록"
        description="말씀과 삶 속에서 받은 은혜를 기록하고 나누세요."
      />
      <MobileFab
        label="은혜기록 작성"
        onClick={() => { setBackView('main'); setSermonCtx(null); setView('sermon-form'); }}
      />
      {/* Hero */}
      <div className="pt-1 pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 p-5 shadow-xl">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">은혜기록</h1>
                <p className="text-white/70 text-xs">말씀과 설교로 받은 은혜를 남겨보세요</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="전체" value={analytics.total} />
              <StatPill label="이번 주" value={analytics.last7Days} />
              <StatPill label="오늘" value={todayNotes.length} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-2 mb-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">은혜기록 작성</h2>
        {/* Reading: pick active progress */}
        {activeProgresses.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400">참여 중인 통독 플랜이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-0.5">성경통독센터에서 플랜을 시작해보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeProgresses.slice(0, 2).map(prog => (
              <button
                key={prog.id}
                onClick={() => startNewReading(prog)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{prog.planName}</p>
                  <p className="text-xs text-gray-400">{prog.currentDay}일차 · 성경통독 은혜기록</p>
                </div>
                <Plus className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => { setBackView('main'); setSermonCtx(null); setView('sermon-form'); }}
          className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">설교 은혜기록</p>
            <p className="text-xs text-gray-400">설교를 듣고 받은 은혜를 기록하세요</p>
          </div>
          <Plus className="w-5 h-5 text-gray-300 flex-shrink-0" />
        </button>
      </div>

      {/* Menu cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MenuCard
          icon={<Heart className="w-5 h-5 text-white" />}
          bg="from-rose-400 to-rose-500"
          label="오늘의 은혜기록"
          count={todayNotes.length}
          onClick={() => setView('today')}
        />
        <MenuCard
          icon={<BookOpen className="w-5 h-5 text-white" />}
          bg="from-green-400 to-emerald-500"
          label="성경통독 은혜기록"
          count={analytics.readingCount}
          onClick={() => { setListType('reading'); setView('reading-list'); }}
        />
        <MenuCard
          icon={<Mic className="w-5 h-5 text-white" />}
          bg="from-secondary-400 to-primary-600"
          label="설교 은혜기록"
          count={analytics.sermonCount}
          onClick={() => { setListType('sermon'); setView('sermon-list'); }}
        />
        <MenuCard
          icon={<BookMarked className="w-5 h-5 text-white" />}
          bg="from-primary-500 to-primary-700"
          label="은혜기록 모아보기"
          count={analytics.total}
          onClick={() => { setListType(undefined); setView('all-list'); }}
        />
        {isPastor && (
          <MenuCard
            icon={<Users className="w-5 h-5 text-white" />}
            bg="from-amber-400 to-orange-500"
            label="담당 성도 은혜기록"
            count={allNotes.filter(n => n.visibility === 'pastor' || n.visibility === 'group').length}
            onClick={() => setView('pastor-notes')}
          />
        )}
      </div>

      {/* Analytics */}
      {analytics.total > 0 && (
        <div className="">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">통계</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            {analytics.topPlan && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> 가장 많이 기록한 곳</span>
                <span className="font-bold text-gray-900 truncate max-w-[140px]">{analytics.topPlan}</span>
              </div>
            )}
            {analytics.topBook && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-primary-400" /> 가장 많이 기록한 성경</span>
                <span className="font-bold text-gray-900">{analytics.topBook}</span>
              </div>
            )}
            <div className="pt-1 border-t border-gray-50">
              <div className="flex gap-4 text-center">
                <div className="flex-1">
                  <p className="text-xl font-bold text-primary-600">{analytics.readingCount}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">성경통독</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="flex-1">
                  <p className="text-xl font-bold text-secondary-600">{analytics.sermonCount}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">설교</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="flex-1">
                  <p className="text-xl font-bold text-rose-500">{analytics.last7Days}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">이번 주</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent notes */}
      {allNotes.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">최근 은혜기록</h2>
            <button onClick={() => { setListType(undefined); setView('all-list'); }} className="text-xs text-primary-500 font-semibold">
              전체 보기
            </button>
          </div>
          <div className="space-y-2">
            {allNotes.slice(0, 3).map(note => (
              <button
                key={note.id}
                onClick={() => navToDetail(note.id, 'main')}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md active:scale-[0.98] transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${note.type === 'reading' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {note.type === 'reading' ? '성경통독' : '설교'}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                  {note.type === 'reading'
                    ? `${note.planName ?? ''} ${note.day ?? ''}일차`
                    : (note.sermonTitle ?? '설교 은혜기록')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{note.graceContent}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/15 rounded-xl px-3 py-2 text-center">
      <p className="text-white font-bold text-lg leading-tight">{value}</p>
      <p className="text-white/70 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}

function MenuCard({ icon, bg, label, count, onClick }: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md active:scale-[0.98] transition-all text-left">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{count}개</p>
      </div>
    </button>
  );
}
