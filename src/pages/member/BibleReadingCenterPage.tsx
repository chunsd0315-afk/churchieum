import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BookOpen, Target, CheckCircle, Circle, ChevronDown, ChevronRight,
  Flame, BarChart2, Bookmark, Calendar, Award, X, Pause, Play,
  BookMarked, Smartphone, MoreHorizontal, ArrowLeft, Settings,
  RotateCcw, TrendingUp, Heart, Users,
} from 'lucide-react';
import { PageHeaderBar } from '../../components/common/ui';
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
} from '../../components/member/GraceNotesView';
import type { Page } from '../../components/member/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  type TranslationMode,
  loadWebBible, getChapterWEB, getParallelChapter,
  getStoredTranslationMode, setStoredTranslationMode,
} from '../../services/bibleTranslation';
import TranslationSelector from '../../components/member/TranslationSelector';

type Props = { onNavigate?: (page: Page) => void; onGoToBible?: (book: string, chapter: number) => void };
type View = 'main' | 'detail' | 'saved' | 'stats' | 'grace-form' | 'grace-list' | 'grace-detail';

/** Bible reading center palette — Ivory / Gold / Brown only */
const BR = {
  bg: '#FFF9F2',
  surface: '#FFFFFF',
  gold: '#E7B447',
  brown: '#6E4429',
  text: '#2A211C',
  muted: '#8A7E75',
  border: '#EADFD5',
  track: '#F2E8DC',
  softGoldBg: '#FFF6E5',
  softGreen: '#7BA87A',
  softGreenBg: '#F0F5EF',
  softRed: '#C47865',
  secondaryBorder: '#DCC9B5',
} as const;

const brCard = 'bg-white rounded-[20px] border border-[#EADFD5] shadow-[0_6px_20px_rgba(80,50,30,0.05)]';
const brPrimaryBtn =
  'inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 bg-[#E7B447] text-[#2A211C] text-sm font-bold rounded-[18px] hover:bg-[#D7A63A] transition-colors disabled:opacity-50';
const brSecondaryBtn =
  'inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 bg-[#FFF9F2] text-[#2A211C] text-sm font-semibold rounded-[18px] border border-[#DCC9B5] hover:bg-[#F2E8DC] transition-colors';

function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div className={`rounded-full h-2 overflow-hidden ${className}`} style={{ background: BR.track }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: BR.gold }}
      />
    </div>
  );
}

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
      <div className={`${brCard} w-full max-w-sm overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#EADFD5] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: BR.muted }}>{planName}</p>
            <h2 className="text-base font-bold" style={{ color: BR.text }}>{dayNumber}일차 읽기 완료</h2>
            <p className="text-sm mt-0.5" style={{ color: BR.muted }}>어떻게 읽으셨나요?</p>
          </div>
          <button onClick={onClose} className="p-1 mt-0.5" style={{ color: BR.muted }} aria-label="닫기"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2">
          {READING_METHODS.map(({ id, icon: Icon, label, desc }) => (
            <button key={id} onClick={() => setSelected(id)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                selected === id ? 'border-[#E7B447] bg-[#FFF6E5]' : 'border-[#EADFD5] hover:border-[#DCC9B5]'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                selected === id ? 'bg-[#E7B447]/20' : 'bg-[#F2E8DC]'
              }`}>
                <Icon className={`w-5 h-5 ${selected === id ? 'text-[#6E4429]' : 'text-[#8A7E75]'}`} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: BR.text }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: BR.muted }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button disabled={!selected} onClick={() => selected && onConfirm()}
            className={`flex-1 ${brPrimaryBtn} ${!selected ? 'opacity-40 cursor-not-allowed' : ''}`}>
            완료 체크
          </button>
          <button onClick={onClose} className={brSecondaryBtn}>취소</button>
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
      <div className={`${brCard} w-full max-w-md overflow-hidden`}>
        <div className="px-5 py-4 relative" style={{ background: BR.softGoldBg, borderBottom: `1px solid ${BR.border}` }}>
          <button onClick={onClose} className="absolute right-4 top-4 p-1" style={{ color: BR.muted }} aria-label="닫기"><X className="w-5 h-5" /></button>
          <p className="text-xs font-semibold mb-0.5" style={{ color: BR.brown }}>{plan.badge}</p>
          <h2 className="text-lg font-bold" style={{ color: BR.text }}>{plan.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: BR.muted }}>통독 참여 설정</p>
        </div>
        <div className="flex border-b border-[#EADFD5]">
          {(['day-select', 'prev-status'] as ModalStep[]).map((s, i) => (
            <div key={s} className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 ${
              step === s ? 'text-[#6E4429] border-[#E7B447]' : 'text-[#8A7E75] border-transparent'
            }`}>
              {i + 1}. {s === 'day-select' ? '진도 선택' : '이전 일차 처리'}
            </div>
          ))}
        </div>
        <div className="p-5">
          {step === 'day-select' && (
            <>
              <h3 className="font-bold mb-1" style={{ color: BR.text }}>시작 일차 선택</h3>
              <p className="text-sm mb-4" style={{ color: BR.muted }}>처음부터 시작하거나 원하는 일차부터 시작할 수 있습니다.</p>
              <div className="space-y-2 mb-4">
                {[
                  { label: '1일차부터 시작', desc: '처음부터 성경통독을 시작합니다.', value: 1 },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setSelectedDay(1)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                      selectedDay === 1 ? 'border-[#E7B447] bg-[#FFF6E5]' : 'border-[#EADFD5] hover:border-[#DCC9B5]'
                    }`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedDay === 1 ? 'border-[#E7B447] bg-[#E7B447]' : 'border-[#DCC9B5]'
                    }`}>
                      {selectedDay === 1 && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: BR.text }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: BR.muted }}>{opt.desc}</p>
                    </div>
                  </button>
                ))}
                <button onClick={() => { if (selectedDay === 1) setSelectedDay(2); }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                    selectedDay > 1 ? 'border-[#E7B447] bg-[#FFF6E5]' : 'border-[#EADFD5] hover:border-[#DCC9B5]'
                  }`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedDay > 1 ? 'border-[#E7B447] bg-[#E7B447]' : 'border-[#DCC9B5]'
                  }`}>
                    {selectedDay > 1 && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: BR.text }}>원하는 일차부터 시작</p>
                    <p className="text-xs mt-0.5" style={{ color: BR.muted }}>이미 읽은 부분이 있다면 원하는 일차를 선택하세요.</p>
                  </div>
                </button>
              </div>
              {selectedDay > 1 && (
                <div className="mb-4">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: BR.brown }}>일차 선택</label>
                  <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}
                    className="w-full border border-[#EADFD5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E7B447] bg-white"
                    style={{ color: BR.text }}>
                    {days.slice(1).map(d => <option key={d} value={d}>{d}일차</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleDayNext} className={`w-full ${brPrimaryBtn}`}>
                {selectedDay === 1 ? '통독 참여하기' : `${selectedDay}일차부터 참여 →`}
              </button>
            </>
          )}
          {step === 'prev-status' && (
            <>
              <h3 className="font-bold mb-1" style={{ color: BR.text }}>{selectedDay}일차부터 참여</h3>
              <p className="text-sm mb-4" style={{ color: BR.muted }}>이전 {selectedDay - 1}일차의 처리 방식을 선택하세요.</p>
              <div className="space-y-2 mb-5">
                {prevStatusOptions.map(opt => (
                  <button key={opt.value} onClick={() => setPrevStatus(opt.value)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                      prevStatus === opt.value ? 'border-[#E7B447] bg-[#FFF6E5]' : 'border-[#EADFD5] hover:border-[#DCC9B5]'
                    }`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      prevStatus === opt.value ? 'border-[#E7B447] bg-[#E7B447]' : 'border-[#DCC9B5]'
                    }`}>
                      {prevStatus === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: BR.text }}>{opt.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: BR.muted }}>{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button disabled={!prevStatus} onClick={() => prevStatus && onConfirm(selectedDay, prevStatus)}
                className={`w-full ${brPrimaryBtn} ${!prevStatus ? 'opacity-40 cursor-not-allowed' : ''}`}>
                통독 참여하기
              </button>
              <button onClick={() => setStep('day-select')} className="w-full mt-2 py-2.5 text-sm font-medium" style={{ color: BR.muted }}>← 다시 선택</button>
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
    <div className={`${brCard} p-4`}>
      <h3 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: BR.text }}>
        <Calendar className="w-4 h-4" style={{ color: BR.gold }} /> 통독 달력
        <span className="text-xs font-normal ml-auto" style={{ color: BR.muted }}>탭하여 완료/미완료 체크</span>
      </h3>
      <div className="flex items-center gap-3 mb-3 text-[10px]" style={{ color: BR.muted }}>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: BR.softGreen }} />완료</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block ring-2 ring-[#E7B447]/40" style={{ background: BR.gold }} />오늘</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block bg-[#F2E8DC]" />미완료</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {displayDays.map(day => {
          const done = completedSet.has(day);
          const isCurrent = day === currentDay;
          return (
            <button key={day} onClick={() => onToggle(day)}
              title={`${day}일차`}
              className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all min-h-[36px]"
              style={
                done
                  ? { background: BR.softGreenBg, color: BR.brown }
                  : isCurrent
                  ? { background: BR.softGoldBg, color: BR.brown, border: `1.5px solid ${BR.gold}` }
                  : { background: BR.track, color: BR.muted }
              }>
              {done ? <CheckCircle className="w-3.5 h-3.5" style={{ color: BR.softGreen }} /> : day}
            </button>
          );
        })}
      </div>
      {total > windowSize && (
        <p className="text-[10px] text-center mt-2" style={{ color: BR.muted }}>{windowStart}–{windowEnd}일차 표시 중 (전체 {total}일)</p>
      )}
    </div>
  );
}

// ─── Active Plan Card (compact) ───────────────────────────────────────────────

function ActivePlanCard({ progress, plan, onDetail, onComplete, onRefresh, onGoToBible, selected = false }: {
  progress: ReadingProgress;
  plan: ReadingPlan;
  onDetail: () => void;
  onComplete: () => void;
  onRefresh: () => void;
  onGoToBible?: (book: string, chapter: number) => void;
  selected?: boolean;
}) {
  const pct = getProgressPercent(progress);
  const todayReading = getTodayReading(plan.id, progress.currentDay);
  const isCurrentDone = progress.completedDays.includes(progress.currentDay);

  const statusLabel = STATUS_LABEL[progress.status];

  return (
    <div
      className={`${brCard} overflow-hidden transition-shadow hover:shadow-[0_8px_24px_rgba(80,50,30,0.07)]`}
      style={selected ? { borderColor: BR.gold, borderWidth: 1.5 } : undefined}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: BR.softGoldBg }}
          >
            <BookOpen className="w-5 h-5" style={{ color: BR.brown }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-[15px]" style={{ color: BR.text }}>{plan.name}</p>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={
                  progress.status === 'completed'
                    ? { background: BR.softGreenBg, color: BR.softGreen }
                    : progress.status === 'paused'
                    ? { background: BR.track, color: BR.muted }
                    : { background: BR.softGoldBg, color: BR.brown }
                }
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: BR.muted }}>
              {plan.durationDays}일 · 현재 {progress.completedDays.length}일 완료
              {progress.streakDays > 0 && (
                <span className="ml-2 inline-flex items-center gap-0.5" style={{ color: BR.brown }}>
                  <Flame className="w-3 h-3" />{progress.streakDays}일 연속
                </span>
              )}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <ProgressBar pct={pct} className="flex-1" />
              <span className="text-sm font-bold shrink-0" style={{ color: BR.brown }}>{pct}%</span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: BR.bg }}>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: BR.muted }}>
            오늘 읽을 말씀 · {progress.currentDay}일차
          </p>
          <p className="text-sm font-medium leading-tight" style={{ color: BR.text }}>{todayReading.fullLabel}</p>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {onGoToBible && todayReading.assignments.length > 0 && (
            <button
              onClick={() => {
                const a = todayReading.assignments[0];
                onGoToBible(a.book, a.chapters[0] ?? 1);
              }}
              className={`${brPrimaryBtn} flex-1 !min-h-[44px] !py-2 text-xs`}
            >
              <BookOpen className="w-3.5 h-3.5" /> 읽기 시작
            </button>
          )}
          {progress.status !== 'completed' && (
            <button
              onClick={isCurrentDone ? undefined : onComplete}
              className={`${isCurrentDone ? brSecondaryBtn : brSecondaryBtn} !min-h-[44px] !py-2 text-xs ${
                isCurrentDone ? 'cursor-default' : ''
              }`}
              style={isCurrentDone ? { color: BR.softGreen, borderColor: '#C5D9C4' } : undefined}
            >
              {isCurrentDone
                ? <><CheckCircle className="w-3.5 h-3.5" /> 완료</>
                : <><Circle className="w-3.5 h-3.5" /> 완료 체크</>}
            </button>
          )}
          <button onClick={onDetail} className={`${brSecondaryBtn} !min-h-[44px] !py-2 text-xs`}>
            상세 <ChevronRight className="w-3 h-3" />
          </button>
          {progress.status === 'active' && (
            <button
              onClick={() => { setProgressStatus(progress.id, 'paused'); onRefresh(); }}
              className="p-2.5 rounded-xl border border-[#EADFD5] hover:bg-[#F2E8DC] transition-colors"
              style={{ color: BR.muted }}
              aria-label="일시중지"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {progress.status === 'paused' && (
            <button
              onClick={() => { setProgressStatus(progress.id, 'active'); onRefresh(); }}
              className="p-2.5 rounded-xl border border-[#EADFD5] hover:bg-[#FFF6E5] transition-colors"
              style={{ color: BR.brown }}
              aria-label="재개"
            >
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
    <div className={`${brCard} overflow-hidden`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: BR.softGoldBg }}
          >
            <BookOpen className="w-5 h-5" style={{ color: BR.brown }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-[15px]" style={{ color: BR.text }}>{plan.name}</p>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: BR.track, color: BR.brown }}
              >
                {plan.badge}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: BR.muted }}>{plan.description}</p>
            {meta && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: BR.bg, color: BR.muted }}>{meta.scope}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: BR.softGoldBg, color: BR.brown }}>{meta.dailyAmount}</span>
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(v => !v)} className="p-1 shrink-0" style={{ color: BR.muted }} aria-label="자세히">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {expanded && meta && (
          <div className="mt-3 pt-3 border-t border-[#EADFD5]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl p-2.5" style={{ background: BR.bg }}>
                <p className="mb-0.5" style={{ color: BR.muted }}>기간</p>
                <p className="font-semibold" style={{ color: BR.text }}>{plan.durationDays}일</p>
              </div>
              <div className="rounded-xl p-2.5" style={{ background: BR.bg }}>
                <p className="mb-0.5" style={{ color: BR.muted }}>하루 분량</p>
                <p className="font-semibold" style={{ color: BR.text }}>{meta.dailyAmount}</p>
              </div>
              <div className="rounded-xl p-2.5 col-span-2" style={{ background: BR.bg }}>
                <p className="mb-0.5" style={{ color: BR.muted }}>특징</p>
                <p className="font-semibold" style={{ color: BR.text }}>{meta.feature}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={onStart} className={`flex-1 ${brPrimaryBtn} !min-h-[44px] !py-2.5`}>
          시작하기
        </button>
        <button onClick={() => setExpanded(v => !v)} className={`${brSecondaryBtn} !min-h-[44px] !py-2.5`}>
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

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)', background: BR.bg }}>
        {/* Sticky back header */}
        <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10" style={{ borderBottom: `1px solid ${BR.border}` }}>
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[#F2E8DC]" aria-label="뒤로"><ArrowLeft className="w-5 h-5" style={{ color: BR.brown }} /></button>
          <h2 className="font-bold text-sm flex-1 truncate" style={{ color: BR.text }}>{plan.name}</h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={
              progress.status === 'completed'
                ? { background: BR.softGreenBg, color: BR.softGreen }
                : progress.status === 'paused'
                ? { background: BR.track, color: BR.muted }
                : { background: BR.softGoldBg, color: BR.brown }
            }
          >
            {STATUS_LABEL[progress.status]}
          </span>
        </div>

        {/* Plan banner — calm ivory/gold */}
        <div className="px-5 py-5 relative overflow-hidden" style={{ background: BR.softGoldBg, borderBottom: `1px solid ${BR.border}` }}>
          <p className="text-xs mb-1" style={{ color: BR.muted }}>시작일: {progress.startedAt.split('T')[0]}</p>
          <h2 className="font-bold text-xl mb-1" style={{ color: BR.text }}>{plan.name}</h2>
          <p className="text-sm" style={{ color: BR.muted }}>{progress.currentDay}일차 진행 중 · {plan.durationDays}일 목표</p>
          <div className="mt-3">
            <ProgressBar pct={pct} />
          </div>
          <p className="text-xs mt-1.5 font-bold" style={{ color: BR.brown }}>{pct}% 완료</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 px-4 pt-4">
          {[
            { icon: Flame, val: progress.streakDays, label: '연속' },
            { icon: Calendar, val: progress.completedDays.length, label: '완료' },
            { icon: TrendingUp, val: remaining, label: '남은 일' },
            { icon: Award, val: `${pct}%`, label: '진행률' },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className={`${brCard} p-3 text-center`}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: BR.gold }} />
              <p className="text-base font-bold" style={{ color: BR.text }}>{val}</p>
              <p className="text-[10px]" style={{ color: BR.muted }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Today's reading */}
          <div className={`${brCard} overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: BR.text }}>
                  <Target className="w-4 h-4" style={{ color: BR.gold }} /> 오늘 읽을 말씀
                  <span className="text-xs font-normal" style={{ color: BR.muted }}>{progress.currentDay}일차</span>
                </h3>
                {isCurrentDone ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: BR.softGreenBg, color: BR.softGreen }}>
                    <CheckCircle className="w-3.5 h-3.5" /> 완료
                  </span>
                ) : (
                  <button onClick={() => setMethodModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
                    style={{ background: BR.gold, color: BR.text }}>
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
                      <div className="w-2 h-2 rounded-full" style={{ background: BR.gold }} />
                      <p className="text-sm font-semibold" style={{ color: BR.text }}>{a.label}</p>
                    </div>
                    <button onClick={() => setExpandedDay(expandedDay === todayReading.dayNumber ? null : todayReading.dayNumber)}
                      className="text-xs font-medium" style={{ color: BR.brown }}>본문 {expandedDay === todayReading.dayNumber ? '▲' : '▼'}</button>
                  </div>
                ))}
              </div>
              {expandedDay === todayReading.dayNumber && todayReading.verses.length > 0 && (
                <div className="mt-3 pt-3 space-y-1.5 max-h-60 overflow-y-auto" style={{ borderTop: `1px solid ${BR.border}` }}>
                  {(() => {
                    if (translationMode === 'korean') {
                      return todayReading.verses.map(v => (
                        <div key={`${v.chapter}-${v.verse}`} className="flex gap-2">
                          <span className="text-xs font-bold shrink-0 w-4 text-right" style={{ color: BR.gold }}>{v.verse}</span>
                          <p className="text-xs leading-relaxed" style={{ color: BR.text }}>{v.text}</p>
                        </div>
                      ));
                    }
                    const firstAssignment = todayReading.assignments[0];
                    const bookName = firstAssignment?.book ?? '';
                    const chapterNum = firstAssignment?.chapters?.[0] ?? 1;
                    const webVerses = getChapterWEB(bookName, chapterNum);
                    if (translationMode === 'web') {
                      return webVerses.length > 0 ? webVerses.map(v => (
                        <div key={v.verse} className="flex gap-2">
                          <span className="text-xs font-bold shrink-0 w-4 text-right" style={{ color: BR.gold }}>{v.verse}</span>
                          <p className="text-xs leading-relaxed italic" style={{ color: BR.muted }}>{v.text}</p>
                        </div>
                      )) : (
                        <p className="text-xs text-center py-2" style={{ color: BR.muted }}>WEB 데이터가 없습니다 (데모: 창 1, 시 23, 요 3, 롬 8)</p>
                      );
                    }
                    const parallelVerses = getParallelChapter(bookName, chapterNum);
                    return parallelVerses.map(pv => (
                      <div key={pv.verse} className="flex gap-2">
                        <span className="text-xs font-bold shrink-0 w-4 text-right" style={{ color: BR.gold }}>{pv.verse}</span>
                        <div className="flex-1">
                          {pv.korean && <p className="text-xs leading-relaxed" style={{ color: BR.text }}>{pv.korean}</p>}
                          {pv.english && <p className="text-xs leading-relaxed italic" style={{ color: BR.muted }}>{pv.english}</p>}
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
          <div className={`${brCard} p-4`}>
            <h3 className="text-sm font-bold mb-3" style={{ color: BR.brown }}>플랜 관리</h3>
            <div className="grid grid-cols-2 gap-2">
              {progress.status === 'active' && (
                <button onClick={() => { setProgressStatus(progressId, 'paused'); refresh(); }}
                  className={`${brSecondaryBtn} !min-h-[44px] !py-2.5 text-xs`}>
                  <Pause className="w-3.5 h-3.5" /> 플랜 일시중지
                </button>
              )}
              {progress.status === 'paused' && (
                <button onClick={() => { setProgressStatus(progressId, 'active'); refresh(); }}
                  className={`${brPrimaryBtn} !min-h-[44px] !py-2.5 text-xs`}>
                  <Play className="w-3.5 h-3.5" /> 플랜 재개
                </button>
              )}
              <button onClick={() => setConfirmRestart(true)}
                className={`${brSecondaryBtn} !min-h-[44px] !py-2.5 text-xs`}>
                <RotateCcw className="w-3.5 h-3.5" /> 새로 시작하기
              </button>
              <button onClick={() => { removeProgressById(progressId); onRefresh(); onBack(); }}
                className={`${brSecondaryBtn} !min-h-[44px] !py-2.5 text-xs`}
                style={{ color: BR.softRed }}>
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
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)', background: BR.bg }}>
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10" style={{ borderBottom: `1px solid ${BR.border}` }}>
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[#F2E8DC]" aria-label="뒤로"><ArrowLeft className="w-5 h-5" style={{ color: BR.brown }} /></button>
        <h2 className="font-bold" style={{ color: BR.text }}>저장한 말씀</h2>
        <span className="ml-auto text-xs" style={{ color: BR.muted }}>{saved.length}개</span>
      </div>
      <div className="flex-1 p-4">
        {saved.length === 0 ? (
          <div className={`${brCard} p-10 text-center mt-4`}>
            <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: BR.muted }} />
            <p className="font-medium" style={{ color: BR.muted }}>저장한 말씀이 없습니다</p>
            {onNavigate && (
              <button onClick={() => onNavigate('bible')} className={`${brPrimaryBtn} mt-3`}>
                성경 읽기로 이동
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map(v => (
              <div key={v.id} className={`${brCard} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: BR.softGoldBg, color: BR.brown }}>{v.book} {v.chapter}:{v.verse}</span>
                  <span className="text-[10px]" style={{ color: BR.muted }}>{new Date(v.savedAt).toLocaleDateString('ko-KR')}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BR.text }}>{v.text}</p>
                {v.memo && (
                  <p className="mt-2 text-xs rounded-lg px-3 py-1.5 border-l-2" style={{ background: BR.bg, color: BR.muted, borderColor: BR.gold }}>{v.memo}</p>
                )}
              </div>
            ))}
          </div>
        )}
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
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)', background: BR.bg }}>
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10" style={{ borderBottom: `1px solid ${BR.border}` }}>
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[#F2E8DC]" aria-label="뒤로"><ArrowLeft className="w-5 h-5" style={{ color: BR.brown }} /></button>
        <h2 className="font-bold" style={{ color: BR.text }}>내 통독 분석</h2>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { icon: BookOpen, val: active.length, label: '진행중 플랜' },
            { icon: Award, val: completed.length, label: '완독 플랜' },
            { icon: Flame, val: totalStreak, label: '최대 연속일' },
            { icon: Heart, val: graceAnalytics.total, label: '은혜 기록' },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className={`${brCard} p-4 text-center`}>
              <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: BR.gold }} />
              <p className="text-2xl font-bold" style={{ color: BR.text }}>{val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: BR.muted }}>{label}</p>
            </div>
          ))}
        </div>
        <div className={`${brCard} text-center py-4 text-sm`} style={{ color: BR.muted }}>
          <BarChart2 className="w-8 h-8 mx-auto mb-2" style={{ color: BR.track }} />
          총 {totalDays}일 완료 · {progresses.length}개 플랜 참여
        </div>

        <div className={`${brCard} p-4`}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BR.text }}>
            <Heart className="w-4 h-4" style={{ color: BR.gold }} /> 은혜 기록 분석
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-3 text-center" style={{ background: BR.softGoldBg }}>
              <p className="text-xl font-bold" style={{ color: BR.brown }}>{graceAnalytics.total}</p>
              <p className="text-[10px]" style={{ color: BR.muted }}>전체 기록</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: BR.bg }}>
              <p className="text-xl font-bold" style={{ color: BR.brown }}>{graceAnalytics.last7Days}</p>
              <p className="text-[10px]" style={{ color: BR.muted }}>최근 7일</p>
            </div>
          </div>
          {graceAnalytics.topPlan && (
            <p className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: BR.bg, color: BR.text }}>
              가장 많이 기록한 플랜: <strong>{graceAnalytics.topPlan}</strong>
            </p>
          )}
          {graceAnalytics.topBook && (
            <p className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: BR.bg, color: BR.text }}>
              가장 많이 기록한 성경: <strong>{graceAnalytics.topBook}</strong>
            </p>
          )}
          {months.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: BR.muted }}>월별 은혜 기록</p>
              <div className="space-y-1.5">
                {months.map(([month, count]) => {
                  const maxCount = Math.max(...months.map(([, c]) => c));
                  return (
                    <div key={month} className="flex items-center gap-2">
                      <span className="text-xs w-14 shrink-0" style={{ color: BR.muted }}>{month.slice(0, 7)}</span>
                      <ProgressBar pct={(count / maxCount) * 100} className="flex-1" />
                      <span className="text-xs font-medium w-4 text-right" style={{ color: BR.brown }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {graceAnalytics.total === 0 && (
            <p className="text-xs text-center py-2" style={{ color: BR.muted }}>아직 은혜 기록이 없습니다. 통독 중 받은 은혜를 기록해보세요!</p>
          )}
        </div>

        <div className="space-y-3">
          {progresses.map(p => {
            const pl = READING_PLANS.find(r => r.id === p.planId)!;
            const pct = getProgressPercent(p);
            return (
              <div key={p.id} className={`${brCard} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm" style={{ color: BR.text }}>{pl.name}</p>
                  <span className="text-xs font-bold" style={{ color: BR.brown }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} />
                <p className="text-xs mt-1" style={{ color: BR.muted }}>{p.completedDays.length}일 완료 · {pl.durationDays}일 목표</p>
              </div>
            );
          })}
        </div>
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
        className={`w-full flex items-center justify-between ${brCard} px-4 py-3 hover:bg-[#FFF6E5] transition-colors`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BR.softGoldBg }}>
            <Users className="w-4 h-4" style={{ color: BR.brown }} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm" style={{ color: BR.text }}>담당 성도 통독 현황</p>
            <p className="text-xs" style={{ color: BR.muted }}>{demoMembers.length}명의 통독 현황 확인</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: BR.muted }} />
      </button>

      {expanded && (
        <div className={`mt-2 ${brCard} overflow-hidden`}>
          <div className="px-4 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ background: BR.bg, borderBottom: `1px solid ${BR.border}`, color: BR.muted }}>
            <span className="col-span-3">이름</span>
            <span className="col-span-3">소속</span>
            <span className="col-span-3">통독 플랜</span>
            <span className="col-span-2 text-center">진도</span>
            <span className="col-span-1 text-center">상태</span>
          </div>
          {demoMembers.map(m => (
            <div key={m.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center" style={{ borderBottom: `1px solid ${BR.border}` }}>
              <div className="col-span-3">
                <p className="text-sm font-semibold truncate" style={{ color: BR.text }}>{m.name}</p>
                <p className="text-[10px]" style={{ color: BR.muted }}>{m.lastDate}</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs truncate" style={{ color: BR.text }}>{m.districtName}</p>
                <p className="text-[10px] truncate" style={{ color: BR.muted }}>{m.zoneName}</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs truncate" style={{ color: BR.text }}>{m.planName}</p>
                <p className="text-[10px]" style={{ color: BR.muted }}>{m.completedDays}/{m.totalDays}일</p>
              </div>
              <div className="col-span-2">
                <ProgressBar pct={m.progressPct} />
                <p className="text-[10px] text-center mt-0.5" style={{ color: BR.muted }}>{m.progressPct}%</p>
              </div>
              <div className="col-span-1 flex justify-center">
                {m.done ? (
                  <CheckCircle className="w-4 h-4" style={{ color: BR.softGreen }} />
                ) : (
                  <TrendingUp className="w-4 h-4" style={{ color: BR.gold }} />
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
  const [graceDetailFromList, setGraceDetailFromList] = useState(false);
  const [graceFormFromList, setGraceFormFromList] = useState(false);
  const graceDetailFromListRef = useRef(false);
  graceDetailFromListRef.current = graceDetailFromList;
  const graceReturnRef = useRef(graceReturn);
  graceReturnRef.current = graceReturn;

  const refresh = useCallback(() => {
    setProgresses(getAllProgresses());
  }, []);

  const navToGraceForm = (ctx: GraceFormCtx, fromView: View, fromDetailId: string | null) => {
    setGraceFormCtx(ctx);
    if (fromView === 'grace-list') {
      setGraceFormFromList(true);
    } else {
      setGraceFormFromList(false);
      if (fromView !== 'grace-detail') {
        setGraceReturn({ view: fromView, detailId: fromDetailId });
      }
    }
    setView('grace-form');
  };

  const navToGraceList = (planId: string | undefined, fromView: View, fromDetailId: string | null) => {
    setGraceListPlanId(planId);
    setGraceReturn({ view: fromView, detailId: fromDetailId });
    setView('grace-list');
  };

  const HISTORY_GRACE_DETAIL = 'churchieum-bible-grace-detail';

  const navToGraceDetail = (noteId: string, fromView: View, fromDetailId: string | null) => {
    setGraceDetailId(noteId);
    if (fromView === 'grace-list') {
      setGraceDetailFromList(true);
    } else {
      setGraceDetailFromList(false);
      setGraceReturn({ view: fromView, detailId: fromDetailId });
    }
    setView('grace-detail');
    window.history.pushState({ [HISTORY_GRACE_DETAIL]: true }, '');
  };

  const backFromGrace = () => {
    setView(graceReturn.view);
    setDetailId(graceReturn.detailId);
  };

  const backFromGraceForm = () => {
    if (graceFormFromList) {
      setView('grace-list');
      return;
    }
    if (graceDetailId) {
      setView('grace-detail');
      return;
    }
    backFromGrace();
  };

  const closeGraceDetail = useCallback(() => {
    if (graceDetailFromListRef.current) {
      setView('grace-list');
      return;
    }
    const ret = graceReturnRef.current;
    setView(ret.view);
    setDetailId(ret.detailId);
  }, []);

  const handleGraceDetailBack = useCallback(() => {
    const state = window.history.state as Record<string, unknown> | null;
    if (state?.[HISTORY_GRACE_DETAIL]) {
      window.history.back();
      return;
    }
    closeGraceDetail();
  }, [closeGraceDetail]);

  useEffect(() => {
    const onPopState = () => {
      setView(prev => {
        if (prev !== 'grace-detail') return prev;
        if (graceDetailFromListRef.current) return 'grace-list';
        const ret = graceReturnRef.current;
        setDetailId(ret.detailId);
        return ret.view;
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const activeProgresses = progresses.filter(p => p.status === 'active' || p.status === 'paused');
  const activePlanIds = new Set(activeProgresses.map(p => p.planId));
  const availablePlans = READING_PLANS.filter(p => !activePlanIds.has(p.id));

  const primaryProgress = activeProgresses[0] ?? null;
  const primaryPlan = primaryProgress
    ? READING_PLANS.find(p => p.id === primaryProgress.planId) ?? null
    : null;
  const primaryToday = primaryPlan && primaryProgress
    ? getTodayReading(primaryPlan.id, primaryProgress.currentDay)
    : null;
  const primaryPct = primaryProgress ? getProgressPercent(primaryProgress) : 0;
  const primaryDone = primaryProgress
    ? primaryProgress.completedDays.includes(primaryProgress.currentDay)
    : false;
  const todayDateLabel = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const recentRecords = (() => {
    if (!primaryProgress || !primaryPlan) return [];
    const current = primaryProgress.currentDay;
    const rows: { day: number; label: string; status: 'today' | 'done' | 'incomplete' }[] = [];
    for (let d = current; d >= Math.max(1, current - 6); d -= 1) {
      const reading = getTodayReading(primaryPlan.id, d);
      const done = primaryProgress.completedDays.includes(d);
      rows.push({
        day: d,
        label: reading.fullLabel,
        status: d === current ? (done ? 'done' : 'today') : (done ? 'done' : 'incomplete'),
      });
    }
    return rows;
  })();

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
        onSave={(id) => {
          setGraceDetailId(id);
          setView('grace-detail');
          window.history.pushState({ [HISTORY_GRACE_DETAIL]: true }, '');
        }}
        onBack={backFromGraceForm}
      />
    );
  }

  const showGraceList = view === 'grace-list' || (view === 'grace-detail' && graceDetailFromList);
  const showGraceDetail = view === 'grace-detail' && Boolean(graceDetailId);

  if (showGraceList || showGraceDetail) {
    return (
      <>
        {showGraceList && (
          <div
            style={{ display: view === 'grace-detail' ? 'none' : undefined }}
            aria-hidden={view === 'grace-detail'}
          >
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
                  planColor: note.planColor || (plan?.color ?? 'from-[#E7B447] to-[#C7952F]'),
                  day: note.day ?? 1,
                  readingReferences: note.bibleReference ?? '',
                  editId: note.id,
                }, 'grace-list', null);
              }}
            />
          </div>
        )}
        {showGraceDetail && graceDetailId && (
          <GraceNoteDetailView
            noteId={graceDetailId}
            onBack={handleGraceDetailBack}
            onEdit={() => {
              const note = getAllGraceNotes().find(n => n.id === graceDetailId);
              if (!note) return;
              const plan = READING_PLANS.find(p => p.id === note.planId);
              navToGraceForm({
                progressId: note.sourceId ?? '',
                planId: note.planId ?? '',
                planName: note.planName ?? '',
                planColor: note.planColor || (plan?.color ?? 'from-[#E7B447] to-[#C7952F]'),
                day: note.day ?? 1,
                readingReferences: note.bibleReference ?? '',
                editId: note.id,
              }, graceDetailFromList ? 'grace-list' : 'grace-detail', null);
            }}
            onDelete={handleGraceDetailBack}
          />
        )}
      </>
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

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)', background: BR.bg }}>
        <PageHeaderBar
          title="성경통독"
          description="말씀과 함께 하루하루 걸어가세요."
          action={
            <div className="flex items-center gap-1">
              <button onClick={() => navToGraceList(undefined, 'main', null)} className="p-2 rounded-xl transition-colors hover:bg-[#F2E8DC]" title="은혜 기록 모아보기" aria-label="은혜 기록">
                <Heart className="w-4 h-4" style={{ color: BR.brown }} />
              </button>
              <button onClick={() => setView('saved')} className="p-2 rounded-xl transition-colors hover:bg-[#F2E8DC]" aria-label="저장 말씀">
                <Bookmark className="w-4 h-4" style={{ color: BR.brown }} />
              </button>
              <button onClick={() => setView('stats')} className="p-2 rounded-xl transition-colors hover:bg-[#F2E8DC]" aria-label="내 분석">
                <BarChart2 className="w-4 h-4" style={{ color: BR.brown }} />
              </button>
            </div>
          }
        />

        <div className="flex-1 max-w-[1100px] w-full mx-auto">
          {/* Summary: Today + Progress */}
          {primaryProgress && primaryPlan && primaryToday && (
            <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className={`${brCard} p-4 md:p-5`}
                style={{ borderColor: BR.gold, borderWidth: 1.5, background: BR.softGoldBg }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[15px] font-bold" style={{ color: BR.text }}>오늘의 통독</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: BR.gold, color: BR.text }}>오늘</span>
                </div>
                <p className="text-xs mb-2" style={{ color: BR.muted }}>{todayDateLabel} · {primaryProgress.currentDay}일차</p>
                <div className="space-y-1 mb-4">
                  {primaryToday.assignments.map(a => (
                    <p key={a.label} className="text-[15px] font-semibold" style={{ color: BR.text }}>{a.label}</p>
                  ))}
                  {primaryToday.assignments.length === 0 && (
                    <p className="text-[15px] font-semibold" style={{ color: BR.text }}>{primaryToday.fullLabel}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {onGoToBible && primaryToday.assignments.length > 0 && (
                    <button
                      onClick={() => {
                        const a = primaryToday.assignments[0];
                        onGoToBible(a.book, a.chapters[0] ?? 1);
                      }}
                      className={`${brPrimaryBtn} flex-1 !min-h-[48px]`}
                    >
                      <BookOpen className="w-4 h-4" /> 읽기 시작
                    </button>
                  )}
                  {!primaryDone && (
                    <button onClick={() => setMethodFor(primaryProgress.id)} className={`${brSecondaryBtn} !min-h-[48px]`}>
                      <Circle className="w-4 h-4" /> 완료 체크
                    </button>
                  )}
                  {primaryDone && (
                    <span className={`${brSecondaryBtn} !min-h-[48px] cursor-default`} style={{ color: BR.softGreen, borderColor: '#C5D9C4' }}>
                      <CheckCircle className="w-4 h-4" /> 완료
                    </span>
                  )}
                </div>
              </div>

              <div className={`${brCard} p-4 md:p-5`}>
                <p className="text-[15px] font-bold mb-2" style={{ color: BR.text }}>나의 진행률</p>
                <p className="text-xs mb-1" style={{ color: BR.muted }}>
                  전체 {primaryPlan.durationDays}일 중
                </p>
                <p className="text-[22px] font-bold mb-1" style={{ color: BR.brown }}>{primaryPct}%</p>
                <p className="text-sm mb-3" style={{ color: BR.text }}>
                  {primaryProgress.completedDays.length} / {primaryPlan.durationDays}일 완료
                </p>
                <ProgressBar pct={primaryPct} className="h-2.5" />
                {primaryProgress.streakDays > 0 && (
                  <p className="text-xs mt-3 flex items-center gap-1" style={{ color: BR.muted }}>
                    <Flame className="w-3.5 h-3.5" style={{ color: BR.gold }} />
                    {primaryProgress.streakDays}일 연속 읽기
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Active plans */}
          {activeProgresses.length > 0 && (
            <div className="px-4 pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: BR.text }}>통독 계획</p>
                <span className="text-xs" style={{ color: BR.muted }}>{activeProgresses.length}개 진행중</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {activeProgresses.map((prog, idx) => {
                  const plan = READING_PLANS.find(p => p.id === prog.planId)!;
                  return (
                    <ActivePlanCard
                      key={prog.id}
                      progress={prog}
                      plan={plan}
                      selected={idx === 0}
                      onDetail={() => { setDetailId(prog.id); setView('detail'); }}
                      onComplete={() => setMethodFor(prog.id)}
                      onRefresh={refresh}
                      onGoToBible={onGoToBible}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent records */}
          {recentRecords.length > 0 && (
            <div className="px-4 pt-5">
              <p className="text-sm font-bold mb-3" style={{ color: BR.text }}>최근 기록</p>
              <div className={`${brCard} overflow-hidden`}>
                {recentRecords.map((row, i) => (
                  <div
                    key={row.day}
                    className="flex items-center gap-3 px-4 py-3 min-h-[52px]"
                    style={i < recentRecords.length - 1 ? { borderBottom: `1px solid ${BR.border}` } : undefined}
                  >
                    <div className="w-16 shrink-0">
                      <p className="text-xs font-semibold" style={{ color: BR.text }}>{row.day}일차</p>
                    </div>
                    <p className="flex-1 text-sm min-w-0 truncate" style={{ color: BR.text }}>{row.label}</p>
                    {row.status === 'today' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: BR.softGoldBg, color: BR.brown, border: `1px solid ${BR.gold}` }}>오늘</span>
                    )}
                    {row.status === 'done' && (
                      <span className="text-[11px] font-semibold flex items-center gap-1 shrink-0" style={{ color: BR.softGreen }}>
                        <CheckCircle className="w-3.5 h-3.5" /> 완료
                      </span>
                    )}
                    {row.status === 'incomplete' && (
                      <span className="text-[11px] shrink-0" style={{ color: BR.muted }}>미완료</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPastor && <PastorMemberProgressSection />}

          {/* Available plans */}
          <div className="px-4 pt-5 pb-8 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: BR.text }}>
                {activeProgresses.length > 0 ? '다른 통독 계획' : '통독 계획'}
              </p>
              <span className="text-xs" style={{ color: BR.muted }}>{availablePlans.length}개</span>
            </div>

            {availablePlans.length === 0 ? (
              <div className={`${brCard} p-6 text-center`}>
                <Award className="w-10 h-10 mx-auto mb-2" style={{ color: BR.gold }} />
                <p className="font-semibold text-sm" style={{ color: BR.text }}>모든 플랜에 참여 중입니다</p>
                <p className="text-xs mt-1" style={{ color: BR.muted }}>진행 중인 플랜에 집중해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePlans.map(plan => (
                  <AvailablePlanCard key={plan.id} plan={plan} onStart={() => setModalPlan(plan)} />
                ))}
              </div>
            )}

            <div className={`${brCard} border-dashed p-5 text-center`} style={{ borderStyle: 'dashed' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: BR.track }}>
                <Settings className="w-6 h-6" style={{ color: BR.muted }} />
              </div>
              <p className="font-bold text-sm" style={{ color: BR.text }}>맞춤형 통독</p>
              <p className="text-xs mt-1" style={{ color: BR.muted }}>직접 일정과 범위를 설정하는 맞춤 플랜</p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: BR.softGoldBg, color: BR.brown }}>준비 중</span>
            </div>

            {activeProgresses.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button onClick={() => navToGraceList(undefined, 'main', null)}
                  className={`${brCard} flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-medium hover:border-[#E7B447] transition-all`}
                  style={{ color: BR.text }}>
                  <Heart className="w-4 h-4" style={{ color: BR.gold }} /> 은혜 기록
                </button>
                <button onClick={() => setView('saved')}
                  className={`${brCard} flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-medium hover:border-[#E7B447] transition-all`}
                  style={{ color: BR.text }}>
                  <Bookmark className="w-4 h-4" style={{ color: BR.gold }} /> 저장 말씀
                </button>
                <button onClick={() => setView('stats')}
                  className={`${brCard} flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-medium hover:border-[#E7B447] transition-all`}
                  style={{ color: BR.text }}>
                  <BarChart2 className="w-4 h-4" style={{ color: BR.gold }} /> 내 분석
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
