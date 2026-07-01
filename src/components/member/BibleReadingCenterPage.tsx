import { useState, useCallback } from 'react';
import {
  BookOpen, Target, CheckCircle, Circle, ChevronDown, ChevronRight,
  Flame, BarChart2, Bookmark, Calendar, Award, X, Pause, Play,
  BookMarked, Smartphone, MoreHorizontal, ArrowLeft, Settings,
  RotateCcw, TrendingUp, Heart, Users,
} from 'lucide-react';
import { PageHeaderBar } from '../ui';
import {
  READING_PLANS, getTodayReading,
  getAllProgresses, addProgress, markProgressDayComplete, toggleProgressDay,
  setProgressStatus, removeProgressById, restartProgress, getProgressPercent,
  type PlanId, type ReadingPlan, type ReadingProgress,
  type PreviousDaysStatus, type ProgressStatus,
} from '../../data/readingPlans';
import { getSavedVerses, analyzeSavedVerses } from '../../data/bibleData';
import { getAllGraceNotes, analyzeGraceNotes } from '../../data/graceNotes';
import {
  GraceNoteFormView, GraceNoteListView, GraceNoteDetailView,
  PlanGraceNotesSummary, type GraceFormCtx,
} from './GraceNotesView';
import type { Page } from './Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  type TranslationMode,
  loadWebBible, getChapterWEB, getParallelChapter,
  getStoredTranslationMode, setStoredTranslationMode,
} from '../../lib/bibleTranslation';
import TranslationSelector from './TranslationSelector';

type Props = { onNavigate?: (page: Page) => void; onGoToBible?: (ref: { book: string; chapter: number }) => void };
type View = 'main' | 'detail' | 'saved' | 'stats' | 'grace-form' | 'grace-list' | 'grace-detail';

const PLAN_META: Record<PlanId, { scope: string; feature: string; dailyAmount: string }> = {
  '1year':    { scope: '성경 전체', feature: '균형 있는 속도로 1년 완독',  dailyAmount: '약 3장/일' },
  '4month':   { scope: '성경 전체', feature: '120일 집중 완독',            dailyAmount: '약 9장/일' },
  '6month':   { scope: '성경 전체', feature: '6개월 균형 통독',            dailyAmount: '약 6장/일' },
  '90day':    { scope: '성경 전체', feature: '90일 속독 프로그램',         dailyAmount: '약 13장/일' },
  '30day-nt': { scope: '신약 전체', feature: '신약 260장 30일 완독',       dailyAmount: '약 9장/일' },
  'mccheyne': { scope: '성경 전체', feature: '구약 2곳 + 신약 2곳 교차',   dailyAmount: '4장/일' },
  'history':  { scope: '성경 전체', feature: '역사적 사건 순서 배열',      dailyAmount: '약 3장/일' },
};

const STATUS_LABEL: Record<ProgressStatus, string> = {
  active: '진행중', paused: '일시중지', completed: '완독', abandoned: '중단',
};

// ─── Reading Method Modal ─────────────────────────────────────────────────────

const READING_METHODS = [
  { id: 'bible', icon: BookMarked,     label: '성경책으로 읽음',    desc: '종이 성경책으로 읽었습니다.' },
  { id: 'app',   icon: Smartphone,     label: '앱으로 읽음',        desc: '이 앱에서 본문을 읽었습니다.' },
  { id: 'other', icon: MoreHorizontal, label: '기타 방법으로 읽음', desc: '오디오 성경, 다른 앱 등' },
];

function ReadingMethodModal({ dayNumber, planName, onConfirm, onClose }: {
  dayNumber: number; planName: string;
  onConfirm: () => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">{planName}</p>
            <h2 className="text-base font-bold text-gray-900">{dayNumber}일차 읽기 완료</h2>
            <p className="text-sm text-gray-500 mt-0.5">어떻게 읽으셨나요?</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 mt-0.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2">
          {READING_METHODS.map(({ id, icon: Icon, label, desc }) => (
            <button key={id} onClick={() => setSelected(id)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selected === id ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected === id ? 'bg-primary-100' : 'bg-gray-100'}`}>
                <Icon className={`w-5 h-5 ${selected === id ? 'text-primary-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button disabled={!selected} onClick={() => selected && onConfirm()}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${selected ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            완료 체크
          </button>
          <button onClick={onClose} className="px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 rounded-2xl font-medium">취소</button>
        </div>
      </div>
    </div>
  );
}

// ─── Start Modal ──────────────────────────────────────────────────────────────

type ModalStep = 'day-select' | 'prev-status';

function StartModal({ plan, onConfirm, onClose }: {
  plan: ReadingPlan;
  onConfirm: (startDay: number, status: PreviousDaysStatus) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<ModalStep>('day-select');
  const [selectedDay, setSelectedDay] = useState(1);
  const [prevStatus, setPrevStatus] = useState<PreviousDaysStatus | null>(null);
  const days = Array.from({ length: plan.durationDays }, (_, i) => i + 1);

  const handleDayNext = () => {
    if (selectedDay === 1) { onConfirm(1, 'incomplete'); }
    else { setStep('prev-status'); }
  };

  const prevStatusOptions: { value: PreviousDaysStatus; title: string; desc: string }[] = [
    { value: 'completed',  title: `${selectedDay - 1}일차까지 읽었음`, desc: `1~${selectedDay - 1}일차를 완료 처리하고 ${selectedDay}일차부터 시작합니다.` },
    { value: 'incomplete', title: `${selectedDay - 1}일차까지 안 읽었음`, desc: `1~${selectedDay - 1}일차는 미완료로 남기고 ${selectedDay}일차부터 시작합니다.` },
    { value: 'undecided',  title: '나중에 직접 체크', desc: `통독 달력에서 이전 일차를 직접 체크할 수 있습니다.` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className={`bg-gradient-to-r ${plan.color} px-5 py-4 text-white relative`}>
          <button onClick={onClose} className="absolute right-4 top-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          <p className="text-xs text-white/70 mb-0.5">{plan.badge}</p>
          <h2 className="text-lg font-bold">{plan.name}</h2>
          <p className="text-xs text-white/70 mt-0.5">통독 참여 설정</p>
        </div>
        <div className="flex border-b border-gray-100">
          {(['day-select', 'prev-status'] as ModalStep[]).map((s, i) => (
            <div key={s} className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 ${step === s ? 'text-primary-600 border-primary-500' : 'text-gray-400 border-transparent'}`}>
              {i + 1}. {s === 'day-select' ? '진도 선택' : '이전 일차 처리'}
            </div>
          ))}
        </div>
        <div className="p-5">
          {step === 'day-select' && (
            <>
              <h3 className="font-bold text-gray-900 mb-1">시작 일차 선택</h3>
              <p className="text-sm text-gray-500 mb-4">처음부터 시작하거나 원하는 일차부터 시작할 수 있습니다.</p>
              <div className="space-y-2 mb-4">
                {[
                  { label: '1일차부터 시작', desc: '처음부터 성경통독을 시작합니다.', value: 1 },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setSelectedDay(1)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selectedDay === 1 ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedDay === 1 ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                      {selectedDay === 1 && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div><p className="font-semibold text-sm text-gray-800">{opt.label}</p><p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p></div>
                  </button>
                ))}
                <button onClick={() => { if (selectedDay === 1) setSelectedDay(2); }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selectedDay > 1 ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedDay > 1 ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                    {selectedDay > 1 && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">원하는 일차부터 시작</p>
                    <p className="text-xs text-gray-500 mt-0.5">이미 읽은 부분이 있다면 원하는 일차를 선택하세요.</p>
                  </div>
                </button>
              </div>
              {selectedDay > 1 && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">일차 선택</label>
                  <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-primary-400 bg-white">
                    {days.slice(1).map(d => <option key={d} value={d}>{d}일차</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleDayNext}
                className={`w-full py-3 rounded-2xl text-sm font-bold bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-sm`}>
                {selectedDay === 1 ? '통독 참여하기' : `${selectedDay}일차부터 참여 →`}
              </button>
            </>
          )}
          {step === 'prev-status' && (
            <>
              <h3 className="font-bold text-gray-900 mb-1">{selectedDay}일차부터 참여</h3>
              <p className="text-sm text-gray-500 mb-4">이전 {selectedDay - 1}일차의 처리 방식을 선택하세요.</p>
              <div className="space-y-2 mb-5">
                {prevStatusOptions.map(opt => (
                  <button key={opt.value} onClick={() => setPrevStatus(opt.value)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${prevStatus === opt.value ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${prevStatus === opt.value ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                      {prevStatus === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div><p className="font-semibold text-sm text-gray-800">{opt.title}</p><p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p></div>
                  </button>
                ))}
              </div>
              <button disabled={!prevStatus} onClick={() => prevStatus && onConfirm(selectedDay, prevStatus)}
                className={`w-full py-3 rounded-2xl text-sm font-bold shadow-sm ${prevStatus ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90` : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                통독 참여하기
              </button>
              <button onClick={() => setStep('day-select')} className="w-full mt-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium">← 다시 선택</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reading Calendar ─────────────────────────────────────────────────────────

function ReadingCalendar({ progress, plan, onToggle }: {
  progress: ReadingProgress; plan: ReadingPlan; onToggle: (day: number) => void;
}) {
  const completedSet = new Set(progress.completedDays);
  const total = plan.durationDays;
  const currentDay = progress.currentDay;
  const windowSize = 35;
  const windowStart = Math.max(1, currentDay - 17);
  const windowEnd = Math.min(total, windowStart + windowSize - 1);
  const displayDays = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary-500" /> 통독 달력
        <span className="text-xs text-gray-400 font-normal ml-auto">탭하여 완료/미완료 체크</span>
      </h3>
      <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500 inline-block" />완료</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />오늘</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />미완료</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {displayDays.map(day => {
          const done = completedSet.has(day);
          const isCurrent = day === currentDay;
          return (
            <button key={day} onClick={() => onToggle(day)}
              title={`${day}일차`}
              className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all
                ${done ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : isCurrent ? 'bg-emerald-400 text-white hover:bg-emerald-500 ring-2 ring-emerald-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {day}
            </button>
          );
        })}
      </div>
      {total > windowSize && (
        <p className="text-[10px] text-gray-400 text-center mt-2">{windowStart}–{windowEnd}일차 표시 중 (전체 {total}일)</p>
      )}
    </div>
  );
}

// ─── Active Plan Card (compact) ───────────────────────────────────────────────

function ActivePlanCard({ progress, plan, onDetail, onComplete, onRefresh, onGoToBible }: {
  progress: ReadingProgress;
  plan: ReadingPlan;
  onDetail: () => void;
  onComplete: () => void;
  onRefresh: () => void;
  onGoToBible?: (book: string, chapter: number) => void;
}) {
  const pct = getProgressPercent(progress);
  const todayReading = getTodayReading(plan.id, progress.currentDay);
  const isCurrentDone = progress.completedDays.includes(progress.currentDay);
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<ProgressStatus, string> = {
    active:    'bg-primary-50 text-primary-700',
    paused:    'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    abandoned: 'bg-gray-50 text-gray-500',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className={`h-1.5 bg-gradient-to-r ${plan.color}`} style={{ width: `${pct}%` }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[progress.status]}`}>
                {STATUS_LABEL[progress.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">{progress.currentDay}일차</span>
              <span className="text-xs font-bold text-primary-600">{pct}%</span>
              {progress.streakDays > 0 && (
                <span className="text-xs text-orange-500 flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />{progress.streakDays}일 연속
                </span>
              )}
            </div>
            <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className={`bg-gradient-to-r ${plan.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Today's reading compact */}
        <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-medium mb-0.5">오늘 읽을 말씀 · {progress.currentDay}일차</p>
              <p className="text-sm text-gray-700 font-medium leading-tight">{todayReading.fullLabel}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {onGoToBible && todayReading.assignments.length > 0 && (
                <button
                  onClick={() => {
                    const a = todayReading.assignments[0];
                    onGoToBible(a.book, a.chapters[0] ?? 1);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-500 text-white rounded-lg text-[11px] font-semibold hover:bg-primary-600 transition-colors">
                  <BookOpen className="w-3 h-3" /> 본문 보기
                </button>
              )}
              <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 p-1">
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          {expanded && todayReading.verses.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5 max-h-40 overflow-y-auto">
              {todayReading.verses.slice(0, 10).map(v => (
                <div key={`${v.chapter}-${v.verse}`} className="flex gap-2">
                  <span className="text-xs font-bold text-primary-500 shrink-0 w-4 text-right">{v.verse}</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{v.text}</p>
                </div>
              ))}
              {todayReading.verses.length > 10 && <p className="text-xs text-gray-400 text-center">...</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {progress.status !== 'completed' && (
            <button onClick={isCurrentDone ? undefined : onComplete}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex-1 justify-center ${
                isCurrentDone ? 'bg-green-50 text-green-600 cursor-default' : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
              }`}>
              {isCurrentDone ? <><CheckCircle className="w-3.5 h-3.5" /> 완료됨</> : <><Circle className="w-3.5 h-3.5" /> 오늘 읽기 완료</>}
            </button>
          )}
          <button onClick={onDetail}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors">
            상세보기 <ChevronRight className="w-3 h-3" />
          </button>
          {progress.status === 'active' && (
            <button onClick={() => { setProgressStatus(progress.id, 'paused'); onRefresh(); }}
              className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-colors">
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {progress.status === 'paused' && (
            <button onClick={() => { setProgressStatus(progress.id, 'active'); onRefresh(); }}
              className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors">
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Available Plan Card ──────────────────────────────────────────────────────

function AvailablePlanCard({ plan, onStart }: { plan: ReadingPlan; onStart: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLAN_META[plan.id];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${plan.color} text-white`}>{plan.badge}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
            {meta && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{meta.scope}</span>
                <span className="text-[11px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-medium">{meta.dailyAmount}</span>
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {expanded && meta && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-xl p-2.5"><p className="text-gray-400 mb-0.5">기간</p><p className="font-semibold text-gray-800">{plan.durationDays}일</p></div>
              <div className="bg-gray-50 rounded-xl p-2.5"><p className="text-gray-400 mb-0.5">하루 분량</p><p className="font-semibold text-gray-800">{meta.dailyAmount}</p></div>
              <div className="bg-gray-50 rounded-xl p-2.5 col-span-2"><p className="text-gray-400 mb-0.5">특징</p><p className="font-semibold text-gray-800">{meta.feature}</p></div>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={onStart}
          className={`flex-1 py-2.5 bg-gradient-to-r ${plan.color} text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm`}>
          시작하기
        </button>
        <button onClick={() => setExpanded(v => !v)}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
          {expanded ? '접기' : '자세히'}
        </button>
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ progressId, onBack, onRefresh, onGraceWrite, onGraceViewAll, onGraceViewNote }: {
  progressId: string;
  onBack: () => void;
  onRefresh: () => void;
  onGraceWrite: (ctx: GraceFormCtx) => void;
  onGraceViewAll: () => void;
  onGraceViewNote: (id: string) => void;
}) {
  const [progress, setProgress] = useState(() => getAllProgresses().find(p => p.id === progressId)!);
  const [methodModal, setMethodModal] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [translationMode, setTranslationMode] = useState<TranslationMode>(getStoredTranslationMode);

  // Ensure WEB data is loaded
  useState(() => { loadWebBible(); });

  const refresh = useCallback(() => {
    const updated = getAllProgresses().find(p => p.id === progressId);
    if (updated) setProgress(updated);
    onRefresh();
  }, [progressId, onRefresh]);

  if (!progress) return null;
  const plan = READING_PLANS.find(p => p.id === progress.planId)!;
  const pct = getProgressPercent(progress);
  const todayReading = getTodayReading(plan.id, progress.currentDay);
  const isCurrentDone = progress.completedDays.includes(progress.currentDay);
  const remaining = plan.durationDays - progress.completedDays.length;

  return (
    <>
      {methodModal && (
        <ReadingMethodModal
          dayNumber={progress.currentDay}
          planName={plan.name}
          onConfirm={() => { markProgressDayComplete(progressId, progress.currentDay); setMethodModal(false); refresh(); }}
          onClose={() => setMethodModal(false)}
        />
      )}

      {confirmRestart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-base mb-2">새로 시작하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">현재 진행 중인 기록은 중단 처리되고 1일차부터 새로 시작됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => { const n = restartProgress(progressId); onRefresh(); onBack(); setConfirmRestart(false); void n; }}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">새로 시작</button>
              <button onClick={() => setConfirmRestart(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Sticky back header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <h2 className="font-bold text-gray-900 text-sm flex-1 truncate">{plan.name}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${progress.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : progress.status === 'paused' ? 'bg-amber-50 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
            {STATUS_LABEL[progress.status]}
          </span>
        </div>

        {/* Plan banner */}
        <div className={`bg-gradient-to-br ${plan.color} px-5 py-5 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/70 text-xs mb-1">시작일: {progress.startedAt.split('T')[0]}</p>
            <h2 className="font-bold text-xl mb-1">{plan.name}</h2>
            <p className="text-white/70 text-sm">{progress.currentDay}일차 진행 중 · {plan.durationDays}일 목표</p>
            <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-white/60 text-xs mt-1.5">{pct}% 완료</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 px-4 pt-4">
          {[
            { icon: Flame, val: progress.streakDays, label: '연속', color: 'text-orange-500' },
            { icon: Calendar, val: progress.completedDays.length, label: '완료', color: 'text-primary-500' },
            { icon: TrendingUp, val: remaining, label: '남은 일', color: 'text-secondary-500' },
            { icon: Award, val: `${pct}%`, label: '진행률', color: 'text-amber-500' },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className="text-base font-bold text-gray-900">{val}</p>
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Today's reading */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-500" /> 오늘 읽을 말씀
                  <span className="text-xs text-gray-400 font-normal">{progress.currentDay}일차</span>
                </h3>
                {isCurrentDone ? (
                  <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 완료
                  </span>
                ) : (
                  <button onClick={() => setMethodModal(true)}
                    className={`text-xs text-white font-semibold bg-gradient-to-r ${plan.color} px-3 py-1.5 rounded-full flex items-center gap-1 hover:opacity-90`}>
                    <Circle className="w-3.5 h-3.5" /> 읽기 완료
                  </button>
                )}
              </div>
              <TranslationSelector
                mode={translationMode}
                onChange={m => { setTranslationMode(m); setStoredTranslationMode(m); }}
                compact
              />
              <div className="space-y-2">
                {todayReading.assignments.map(a => (
                  <div key={a.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${plan.color}`} />
                      <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                    </div>
                    <button onClick={() => setExpandedDay(expandedDay === todayReading.dayNumber ? null : todayReading.dayNumber)}
                      className="text-xs text-primary-600 hover:text-primary-700">본문 {expandedDay === todayReading.dayNumber ? '▲' : '▼'}</button>
                  </div>
                ))}
              </div>
              {expandedDay === todayReading.dayNumber && todayReading.verses.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 max-h-60 overflow-y-auto">
                  {(() => {
                    if (translationMode === 'korean') {
                      return todayReading.verses.map(v => (
                        <div key={`${v.chapter}-${v.verse}`} className="flex gap-2">
                          <span className="text-xs font-bold text-primary-500 shrink-0 w-4 text-right">{v.verse}</span>
                          <p className="text-xs text-gray-700 leading-relaxed">{v.text}</p>
                        </div>
                      ));
                    }
                    // For WEB or parallel, get the book/chapter from the first assignment
                    const firstAssignment = todayReading.assignments[0];
                    const bookName = firstAssignment?.book ?? '';
                    const chapterNum = firstAssignment?.chapters?.[0] ?? 1;
                    const webVerses = getChapterWEB(bookName, chapterNum);
                    if (translationMode === 'web') {
                      return webVerses.length > 0 ? webVerses.map(v => (
                        <div key={v.verse} className="flex gap-2">
                          <span className="text-xs font-bold text-primary-500 shrink-0 w-4 text-right">{v.verse}</span>
                          <p className="text-xs text-gray-500 leading-relaxed italic">{v.text}</p>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-400 text-center py-2">WEB 데이터가 없습니다 (데모: 창 1, 시 23, 요 3, 롬 8)</p>
                      );
                    }
                    // parallel
                    const parallelVerses = getParallelChapter(bookName, chapterNum);
                    return parallelVerses.map(pv => (
                      <div key={pv.verse} className="flex gap-2">
                        <span className="text-xs font-bold text-primary-500 shrink-0 w-4 text-right">{pv.verse}</span>
                        <div className="flex-1">
                          {pv.korean && <p className="text-xs text-gray-700 leading-relaxed">{pv.korean}</p>}
                          {pv.english && <p className="text-xs text-gray-400 leading-relaxed italic">{pv.english}</p>}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <ReadingCalendar progress={progress} plan={plan} onToggle={day => { toggleProgressDay(progressId, day); refresh(); }} />

          {/* Grace notes section */}
          <PlanGraceNotesSummary
            progressId={progressId}
            planName={plan.name}
            planColor={plan.color}
            onWrite={() => {
              const todayRef = getTodayReading(plan.id, progress.currentDay);
              onGraceWrite({
                progressId,
                planId: plan.id,
                planName: plan.name,
                planColor: plan.color,
                day: progress.currentDay,
                readingReferences: todayRef.fullLabel,
              });
            }}
            onViewAll={onGraceViewAll}
            onViewNote={onGraceViewNote}
          />

          {/* Plan management buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">플랜 관리</h3>
            <div className="grid grid-cols-2 gap-2">
              {progress.status === 'active' && (
                <button onClick={() => { setProgressStatus(progressId, 'paused'); refresh(); }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors">
                  <Pause className="w-3.5 h-3.5" /> 플랜 일시중지
                </button>
              )}
              {progress.status === 'paused' && (
                <button onClick={() => { setProgressStatus(progressId, 'active'); refresh(); }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors">
                  <Play className="w-3.5 h-3.5" /> 플랜 재개
                </button>
              )}
              <button onClick={() => setConfirmRestart(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> 새로 시작하기
              </button>
              <button onClick={() => { removeProgressById(progressId); onRefresh(); onBack(); }}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-gray-500 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" /> 플랜 중단
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Saved View ───────────────────────────────────────────────────────────────

function SavedView({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: Page) => void }) {
  const saved = getSavedVerses();
  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-bold text-gray-900">저장한 말씀</h2>
        <span className="ml-auto text-xs text-gray-400">{saved.length}개</span>
      </div>
      <div className="flex-1 bg-gray-50 p-4 space-y-3">
        {saved.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 mt-4">
            <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">저장한 말씀이 없습니다</p>
            {onNavigate && <button onClick={() => onNavigate('bible')} className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold">성경 읽기로 이동</button>}
          </div>
        ) : saved.map(v => (
          <div key={v.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{v.book} {v.chapter}:{v.verse}</span>
              <span className="text-[10px] text-gray-400">{new Date(v.savedAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{v.text}</p>
            {v.memo && <p className="mt-2 text-xs text-gray-500 bg-amber-50 rounded-lg px-3 py-1.5 border-l-2 border-amber-300">{v.memo}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats View ───────────────────────────────────────────────────────────────

function StatsView({ onBack, progresses }: { onBack: () => void; progresses: ReadingProgress[] }) {
  const analytics = analyzeSavedVerses();
  void analytics; // kept for saved verses compatibility
  const graceNotes = getAllGraceNotes();
  const graceAnalytics = analyzeGraceNotes(graceNotes);
  const active = progresses.filter(p => p.status === 'active');
  const completed = progresses.filter(p => p.status === 'completed');
  const totalStreak = active.reduce((s, p) => Math.max(s, p.streakDays), 0);
  const totalDays = progresses.reduce((s, p) => s + p.completedDays.length, 0);
  const months = Object.entries(graceAnalytics.byMonth).sort().slice(-6);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-bold text-gray-900">내 통독 분석</h2>
      </div>
      <div className="flex-1 bg-gray-50 p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { icon: BookOpen, val: active.length, label: '진행중 플랜', color: 'text-primary-500' },
            { icon: Award, val: completed.length, label: '완독 플랜', color: 'text-amber-500' },
            { icon: Flame, val: totalStreak, label: '최대 연속일', color: 'text-orange-500' },
            { icon: Heart, val: graceAnalytics.total, label: '은혜 기록', color: 'text-rose-500' },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="text-center py-4 text-gray-500 text-sm bg-white rounded-2xl border border-gray-100">
          <BarChart2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          총 {totalDays}일 완료 · {progresses.length}개 플랜 참여
        </div>

        {/* Grace analytics */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> 은혜 기록 분석
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-rose-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-rose-600">{graceAnalytics.total}</p>
              <p className="text-[10px] text-rose-500">전체 기록</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-600">{graceAnalytics.last7Days}</p>
              <p className="text-[10px] text-amber-500">최근 7일</p>
            </div>
          </div>
          {graceAnalytics.topPlan && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-2">
              가장 많이 기록한 플랜: <strong>{graceAnalytics.topPlan}</strong>
            </p>
          )}
          {graceAnalytics.topBook && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-2">
              가장 많이 기록한 성경: <strong>{graceAnalytics.topBook}</strong>
            </p>
          )}
          {months.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">월별 은혜 기록</p>
              <div className="space-y-1.5">
                {months.map(([month, count]) => {
                  const maxCount = Math.max(...months.map(([, c]) => c));
                  return (
                    <div key={month} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-14 shrink-0">{month.slice(0, 7)}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-400 h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {graceAnalytics.total === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">아직 은혜 기록이 없습니다. 통독 중 받은 은혜를 기록해보세요!</p>
          )}
        </div>

        {progresses.map(p => {
          const pl = READING_PLANS.find(r => r.id === p.planId)!;
          const pct = getProgressPercent(p);
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-gray-800">{pl.name}</p>
                <span className="text-xs font-bold text-primary-600">{pct}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`bg-gradient-to-r ${pl.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{p.completedDays.length}일 완료 · {pl.durationDays}일 목표</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pastor Member Progress Section ──────────────────────────────────────────

function PastorMemberProgressSection() {
  const [expanded, setExpanded] = useState(false);

  // In demo mode, we show demo member data since there's no real multi-user backend.
  const demoMembers = [
    { id: 'm1', name: '홍길동', districtName: '1교구', zoneName: '1구역', planName: '1년 통독', progressPct: 42, completedDays: 153, totalDays: 365, lastDate: '2026.06.24', done: false },
    { id: 'm2', name: '김민지', districtName: '1교구', zoneName: '1구역', planName: '신약 30일', progressPct: 100, completedDays: 30, totalDays: 30, lastDate: '2026.06.20', done: true },
    { id: 'm3', name: '이준호', districtName: '1교구', zoneName: '1구역', planName: '6개월 통독', progressPct: 17, completedDays: 31, totalDays: 183, lastDate: '2026.06.18', done: false },
    { id: 'm4', name: '박서연', districtName: '1교구', zoneName: '2구역', planName: '맥체인 통독', progressPct: 68, completedDays: 248, totalDays: 365, lastDate: '2026.06.25', done: false },
  ];

  return (
    <div className="px-4 pt-4">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-gray-900">담당 성도 통독 현황</p>
            <p className="text-xs text-gray-400">{demoMembers.length}명의 통독 현황 확인</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="col-span-3">이름</span>
            <span className="col-span-3">소속</span>
            <span className="col-span-3">통독 플랜</span>
            <span className="col-span-2 text-center">진도</span>
            <span className="col-span-1 text-center">상태</span>
          </div>
          {demoMembers.map(m => (
            <div key={m.id} className="px-4 py-3 border-b border-gray-50 last:border-0 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                <p className="text-[10px] text-gray-400">{m.lastDate}</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-gray-600 truncate">{m.districtName}</p>
                <p className="text-[10px] text-gray-400 truncate">{m.zoneName}</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-gray-700 truncate">{m.planName}</p>
                <p className="text-[10px] text-gray-400">{m.completedDays}/{m.totalDays}일</p>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.done ? 'bg-emerald-400' : 'bg-primary-500'}`}
                      style={{ width: `${m.progressPct}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center mt-0.5">{m.progressPct}%</p>
              </div>
              <div className="col-span-1 flex justify-center">
                {m.done ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-primary-500" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BibleReadingCenterPage({ onNavigate: _onNavigate, onGoToBible }: Props) {
  const { isPastor } = useAuth();
  const [view, setView] = useState<View>('main');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modalPlan, setModalPlan] = useState<ReadingPlan | null>(null);
  const [progresses, setProgresses] = useState<ReadingProgress[]>(() => getAllProgresses());
  const [methodFor, setMethodFor] = useState<string | null>(null);
  // Grace note state
  const [graceFormCtx, setGraceFormCtx] = useState<GraceFormCtx | null>(null);
  const [graceDetailId, setGraceDetailId] = useState<string | null>(null);
  const [graceListPlanId, setGraceListPlanId] = useState<string | undefined>(undefined);
  const [graceReturn, setGraceReturn] = useState<{ view: View; detailId: string | null }>({ view: 'main', detailId: null });

  const refresh = useCallback(() => {
    setProgresses(getAllProgresses());
  }, []);

  const navToGraceForm = (ctx: GraceFormCtx, fromView: View, fromDetailId: string | null) => {
    setGraceFormCtx(ctx);
    setGraceReturn({ view: fromView, detailId: fromDetailId });
    setView('grace-form');
  };

  const navToGraceList = (planId: string | undefined, fromView: View, fromDetailId: string | null) => {
    setGraceListPlanId(planId);
    setGraceReturn({ view: fromView, detailId: fromDetailId });
    setView('grace-list');
  };

  const navToGraceDetail = (noteId: string, fromView: View, fromDetailId: string | null) => {
    setGraceDetailId(noteId);
    setGraceReturn({ view: fromView, detailId: fromDetailId });
    setView('grace-detail');
  };

  const backFromGrace = () => {
    setView(graceReturn.view);
    setDetailId(graceReturn.detailId);
  };

  const activeProgresses = progresses.filter(p => p.status === 'active' || p.status === 'paused');
  const activePlanIds = new Set(activeProgresses.map(p => p.planId));
  const availablePlans = READING_PLANS.filter(p => !activePlanIds.has(p.id));

  const handleStartPlan = (startDay: number, status: PreviousDaysStatus) => {
    if (!modalPlan) return;
    addProgress(modalPlan.id, startDay, status);
    setModalPlan(null);
    refresh();
  };

  const handleMethodConfirm = (progressId: string) => {
    const prog = progresses.find(p => p.id === progressId);
    if (!prog) return;
    markProgressDayComplete(progressId, prog.currentDay);
    setMethodFor(null);
    refresh();
  };

  // ── Grace note routes ──
  if (view === 'grace-form' && graceFormCtx) {
    return (
      <GraceNoteFormView
        ctx={graceFormCtx}
        onSave={(id) => { setGraceDetailId(id); setView('grace-detail'); setGraceReturn(graceReturn); }}
        onBack={backFromGrace}
      />
    );
  }
  if (view === 'grace-list') {
    return (
      <GraceNoteListView
        onBack={backFromGrace}
        initialPlanId={graceListPlanId}
        onDetail={(id) => navToGraceDetail(id, 'grace-list', null)}
        onEdit={(note) => {
          const plan = READING_PLANS.find(p => p.id === note.planId);
          navToGraceForm({
            progressId: note.sourceId ?? '',
            planId: note.planId ?? '',
            planName: note.planName ?? '',
            planColor: note.planColor || (plan?.color ?? 'from-primary-500 to-primary-700'),
            day: note.day ?? 1,
            readingReferences: note.bibleReference ?? '',
            editId: note.id,
          }, 'grace-list', null);
        }}
      />
    );
  }
  if (view === 'grace-detail' && graceDetailId) {
    return (
      <GraceNoteDetailView
        noteId={graceDetailId}
        onBack={backFromGrace}
        onEdit={() => {
          const note = getAllGraceNotes().find(n => n.id === graceDetailId);
          if (!note) return;
          const plan = READING_PLANS.find(p => p.id === note.planId);
          navToGraceForm({
            progressId: note.sourceId ?? '',
            planId: note.planId ?? '',
            planName: note.planName ?? '',
            planColor: note.planColor || (plan?.color ?? 'from-primary-500 to-primary-700'),
            day: note.day ?? 1,
            readingReferences: note.bibleReference ?? '',
            editId: note.id,
          }, 'grace-detail', null);
        }}
        onDelete={backFromGrace}
      />
    );
  }

  if (view === 'detail' && detailId) {
    return (
      <DetailView
        progressId={detailId}
        onBack={() => { setView('main'); setDetailId(null); }}
        onRefresh={refresh}
        onGraceWrite={(ctx) => navToGraceForm(ctx, 'detail', detailId)}
        onGraceViewAll={() => navToGraceList(undefined, 'detail', detailId)}
        onGraceViewNote={(id) => navToGraceDetail(id, 'detail', detailId)}
      />
    );
  }
  if (view === 'saved') return <SavedView onBack={() => setView('main')} onNavigate={_onNavigate} />;
  if (view === 'stats') return <StatsView onBack={() => setView('main')} progresses={progresses} />;

  return (
    <>
      {modalPlan && <StartModal plan={modalPlan} onConfirm={handleStartPlan} onClose={() => setModalPlan(null)} />}
      {methodFor && (() => {
        const p = progresses.find(pr => pr.id === methodFor)!;
        const pl = READING_PLANS.find(r => r.id === p.planId)!;
        return (
          <ReadingMethodModal
            dayNumber={p.currentDay}
            planName={pl.name}
            onConfirm={() => handleMethodConfirm(methodFor)}
            onClose={() => setMethodFor(null)}
          />
        );
      })()}

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Page header */}
          <PageHeaderBar
            title="성경통독"
            description="말씀 통독 계획과 진행률을 확인하세요."
            action={
              <div className="flex items-center gap-1">
                <button onClick={() => navToGraceList(undefined, 'main', null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors" title="은혜 기록 모아보기">
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setView('saved')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Bookmark className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setView('stats')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <BarChart2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            }
          />

        <div className="flex-1 bg-gray-50">
          {/* Section A: Active progresses */}
          {activeProgresses.length > 0 && (
            <div className="px-4 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">나의 참여 중인 통독 플랜</p>
                <span className="text-xs text-gray-400">{activeProgresses.length}개</span>
              </div>
              {activeProgresses.map(prog => {
                const plan = READING_PLANS.find(p => p.id === prog.planId)!;
                return (
                  <ActivePlanCard
                    key={prog.id}
                    progress={prog}
                    plan={plan}
                    onDetail={() => { setDetailId(prog.id); setView('detail'); }}
                    onComplete={() => setMethodFor(prog.id)}
                    onRefresh={refresh}
                    onGoToBible={onGoToBible}
                  />
                );
              })}
            </div>
          )}

          {/* Section B: Pastor member progress */}
          {isPastor && <PastorMemberProgressSection />}

          {/* Section C: Available plans */}
          <div className="px-4 pt-4 pb-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">새 통독 플랜 시작하기</p>
              <span className="text-xs text-gray-400">{availablePlans.length}개</span>
            </div>

            {availablePlans.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <Award className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 text-sm">모든 플랜에 참여 중입니다!</p>
                <p className="text-xs text-gray-400 mt-1">진행 중인 플랜에 집중해보세요.</p>
              </div>
            ) : (
              availablePlans.map(plan => (
                <AvailablePlanCard key={plan.id} plan={plan} onStart={() => setModalPlan(plan)} />
              ))
            )}

            {/* Custom plan placeholder */}
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-bold text-gray-700 text-sm">맞춤형 통독</p>
              <p className="text-xs text-gray-400 mt-1">직접 일정과 범위를 설정하는 맞춤 플랜</p>
              <span className="inline-block mt-2 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">준비 중</span>
            </div>

            {/* Quick shortcuts */}
            {activeProgresses.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button onClick={() => navToGraceList(undefined, 'main', null)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-rose-200 text-xs font-medium text-gray-700 transition-all">
                  <Heart className="w-4 h-4 text-rose-400" /> 은혜 기록
                </button>
                <button onClick={() => setView('saved')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary-200 text-xs font-medium text-gray-700 transition-all">
                  <Bookmark className="w-4 h-4 text-amber-500" /> 저장 말씀
                </button>
                <button onClick={() => setView('stats')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary-200 text-xs font-medium text-gray-700 transition-all">
                  <BarChart2 className="w-4 h-4 text-secondary-500" /> 내 분석
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
