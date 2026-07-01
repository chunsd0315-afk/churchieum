/**
 * 성경 통독 플랜 정의 및 오늘 읽을 말씀 계산
 */

import { BOOK_LIST } from '../lib/bibleVersesKR';
import { getChapter, hasChapterData, type BibleVerse } from './bibleData';

export type PlanId =
  | '1year' | '4month' | '6month' | '90day'
  | '30day-nt' | 'mccheyne' | 'history';

export type PreviousDaysStatus = 'completed' | 'incomplete' | 'undecided';

export type ReadingPlan = {
  id: PlanId;
  name: string;
  description: string;
  durationDays: number;
  scope: 'all' | 'nt' | 'ot' | 'psalms-proverbs';
  chaptersPerDay: number;
  color: string;
  badge: string;
};

export type DailyAssignment = {
  book: string;
  chapters: number[];
  label: string;
};

export type TodayReading = {
  planId: PlanId;
  dayNumber: number;
  assignments: DailyAssignment[];
  fullLabel: string;
  verses: BibleVerse[];
};

// Extended progress type: day-number-based tracking
export type PlanProgress = {
  planId: PlanId;
  planName: string;
  startDay: number;           // which day number the user started from
  startDate: string;          // ISO date string when they enrolled
  previousDaysStatus: PreviousDaysStatus;
  completedDays: number[];    // day numbers that are marked complete
  currentDay: number;         // the day they're currently on
  streakDays: number;
  createdAt: string;
};

export const READING_PLANS: ReadingPlan[] = [
  {
    id: '1year',
    name: '1년 성경통독',
    description: '365일 동안 성경 전체를 완독합니다. 하루 약 3장',
    durationDays: 365,
    scope: 'all',
    chaptersPerDay: 3,
    color: 'from-primary-500 to-primary-700',
    badge: '365일',
  },
  {
    id: '4month',
    name: '4개월 성경일독',
    description: '120일 집중 통독 프로그램. 하루 약 9장',
    durationDays: 120,
    scope: 'all',
    chaptersPerDay: 9,
    color: 'from-amber-500 to-orange-600',
    badge: '120일',
  },
  {
    id: '6month',
    name: '6개월 성경읽기',
    description: '180일 균형 있는 통독 프로그램. 하루 약 6장',
    durationDays: 180,
    scope: 'all',
    chaptersPerDay: 6,
    color: 'from-emerald-500 to-teal-600',
    badge: '180일',
  },
  {
    id: '90day',
    name: '90일 성경통독',
    description: '90일 속독 프로그램. 하루 약 13장',
    durationDays: 90,
    scope: 'all',
    chaptersPerDay: 13,
    color: 'from-red-500 to-rose-600',
    badge: '90일',
  },
  {
    id: '30day-nt',
    name: '30일 신약통독',
    description: '신약 260장을 30일 안에 완독합니다',
    durationDays: 30,
    scope: 'nt',
    chaptersPerDay: 9,
    color: 'from-blue-500 to-indigo-600',
    badge: '30일',
  },
  {
    id: 'mccheyne',
    name: '맥체인 성경읽기표',
    description: '하루 4곳 — 구약 2곳, 신약 2곳을 교차 읽는 전통적 방법',
    durationDays: 365,
    scope: 'all',
    chaptersPerDay: 4,
    color: 'from-violet-500 to-purple-600',
    badge: '맥체인',
  },
  {
    id: 'history',
    name: '역사순 일년일독',
    description: '성경 사건의 역사적 순서대로 읽는 1년 통독',
    durationDays: 365,
    scope: 'all',
    chaptersPerDay: 3,
    color: 'from-stone-500 to-stone-700',
    badge: '역사순',
  },
];

// ─── 순서별 장 목록 생성 ──────────────────────────────────────────────────────

type ChapterRef = { book: string; chapter: number };

function buildSequence(scope: ReadingPlan['scope']): ChapterRef[] {
  const list: ChapterRef[] = [];
  const books = scope === 'nt'
    ? BOOK_LIST.filter(b => b.testament === 'new')
    : scope === 'ot'
    ? BOOK_LIST.filter(b => b.testament === 'old')
    : scope === 'psalms-proverbs'
    ? BOOK_LIST.filter(b => b.name === '시편' || b.name === '잠언')
    : BOOK_LIST;

  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      list.push({ book: book.name, chapter: ch });
    }
  }
  return list;
}

function buildMcCheyneSequence(): ChapterRef[][] {
  const oldBooks = BOOK_LIST.filter(b => b.testament === 'old');
  const newBooks = BOOK_LIST.filter(b => b.testament === 'new');
  const allOT: ChapterRef[] = [];
  const allNT: ChapterRef[] = [];
  for (const b of oldBooks) for (let ch = 1; ch <= b.chapters; ch++) allOT.push({ book: b.name, chapter: ch });
  for (const b of newBooks) for (let ch = 1; ch <= b.chapters; ch++) allNT.push({ book: b.name, chapter: ch });

  const otHalf = Math.ceil(allOT.length / 2);
  const ntHalf = Math.ceil(allNT.length / 2);
  return [
    allOT.slice(0, otHalf),
    allOT.slice(otHalf),
    allNT.slice(0, ntHalf),
    allNT.slice(ntHalf),
  ];
}

const HISTORY_ORDER: string[] = [
  '창세기','출애굽기','레위기','민수기','신명기','여호수아','사사기','룻기',
  '사무엘상','사무엘하','시편','잠언','욥기','아가','전도서','열왕기상','열왕기하',
  '역대상','역대하','호세아','요엘','아모스','오바댜','요나','미가','나훔',
  '하박국','스바냐','예레미야','예레미야 애가','에스겔','다니엘','에스라','학개',
  '스가랴','느헤미야','에스더','말라기','이사야','마태복음','마가복음','누가복음',
  '요한복음','사도행전','로마서','고린도전서','고린도후서','갈라디아서','에베소서',
  '빌립보서','골로새서','데살로니가전서','데살로니가후서','디모데전서','디모데후서',
  '디도서','빌레몬서','히브리서','야고보서','베드로전서','베드로후서','요한일서',
  '요한이서','요한삼서','유다서','요한계시록',
];

function buildHistorySequence(): ChapterRef[] {
  const list: ChapterRef[] = [];
  for (const bookName of HISTORY_ORDER) {
    const book = BOOK_LIST.find(b => b.name === bookName);
    if (!book) continue;
    for (let ch = 1; ch <= book.chapters; ch++) list.push({ book: bookName, chapter: ch });
  }
  return list;
}

// ─── 오늘 읽을 말씀 계산 ──────────────────────────────────────────────────────

function groupChapters(refs: ChapterRef[]): DailyAssignment[] {
  const groups: Record<string, number[]> = {};
  const order: string[] = [];
  for (const { book, chapter } of refs) {
    if (!groups[book]) { groups[book] = []; order.push(book); }
    groups[book].push(chapter);
  }
  return order.map(book => ({
    book,
    chapters: groups[book],
    label: `${book} ${groups[book][0]}${groups[book].length > 1 ? `–${groups[book][groups[book].length - 1]}` : ''}장`,
  }));
}

export function getTodayReading(planId: PlanId, dayNumber: number): TodayReading {
  const plan = READING_PLANS.find(p => p.id === planId)!;
  const day = Math.max(1, Math.min(dayNumber, plan.durationDays));

  let refs: ChapterRef[] = [];

  if (planId === 'mccheyne') {
    const streams = buildMcCheyneSequence();
    for (const stream of streams) {
      const idx = (day - 1) % stream.length;
      refs.push(stream[idx]);
    }
  } else if (planId === 'history') {
    const seq = buildHistorySequence();
    const chapsPerDay = Math.ceil(seq.length / plan.durationDays);
    const start = (day - 1) * chapsPerDay;
    refs = seq.slice(start, start + chapsPerDay);
  } else {
    const seq = buildSequence(plan.scope);
    const chapsPerDay = Math.ceil(seq.length / plan.durationDays);
    const start = (day - 1) * chapsPerDay;
    refs = seq.slice(start, start + chapsPerDay);
  }

  const assignments = groupChapters(refs);
  const fullLabel = assignments.map(a => a.label).join(', ');

  const verses: BibleVerse[] = [];
  for (const { book, chapter } of refs) {
    if (hasChapterData(book, chapter)) {
      verses.push(...getChapter(book, chapter));
    }
  }

  return { planId, dayNumber: day, assignments, fullLabel, verses };
}

// ─── 진행 상태 localStorage (day-number based) ────────────────────────────────
const LS_PROGRESS_KEY = 'readingProgressV2';

function loadAll(): PlanProgress[] {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(all: PlanProgress[]): void {
  try {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function getPlanProgress(planId: PlanId): PlanProgress | null {
  return loadAll().find(p => p.planId === planId) ?? null;
}

export function startPlan(
  planId: PlanId,
  startDay: number,
  previousDaysStatus: PreviousDaysStatus,
): void {
  const plan = READING_PLANS.find(p => p.id === planId)!;
  const all = loadAll().filter(p => p.planId !== planId);
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // Build completedDays based on previousDaysStatus
  let completedDays: number[] = [];
  if (previousDaysStatus === 'completed' && startDay > 1) {
    completedDays = Array.from({ length: startDay - 1 }, (_, i) => i + 1);
  }

  const entry: PlanProgress = {
    planId,
    planName: plan.name,
    startDay,
    startDate: today,
    previousDaysStatus,
    completedDays,
    currentDay: startDay,
    streakDays: 0,
    createdAt: now,
  };

  all.push(entry);
  saveAll(all);
}

export function markDayCompleteByNumber(planId: PlanId, dayNumber: number): void {
  const all = loadAll();
  const idx = all.findIndex(p => p.planId === planId);
  if (idx < 0) return;
  if (!all[idx].completedDays.includes(dayNumber)) {
    all[idx].completedDays.push(dayNumber);
  }
  // Advance currentDay if marking current day
  if (dayNumber === all[idx].currentDay) {
    const plan = READING_PLANS.find(p => p.id === planId)!;
    if (all[idx].currentDay < plan.durationDays) {
      all[idx].currentDay = all[idx].currentDay + 1;
    }
  }
  all[idx].streakDays = computeStreak(all[idx].completedDays);
  saveAll(all);
}

export function toggleDayComplete(planId: PlanId, dayNumber: number): void {
  const all = loadAll();
  const idx = all.findIndex(p => p.planId === planId);
  if (idx < 0) return;
  const pos = all[idx].completedDays.indexOf(dayNumber);
  if (pos >= 0) {
    all[idx].completedDays.splice(pos, 1);
  } else {
    all[idx].completedDays.push(dayNumber);
  }
  all[idx].streakDays = computeStreak(all[idx].completedDays);
  saveAll(all);
}

function computeStreak(completedDays: number[]): number {
  if (completedDays.length === 0) return 0;
  const sorted = [...completedDays].sort((a, b) => b - a);
  let streak = 0;
  let expected = sorted[0];
  for (const d of sorted) {
    if (d === expected) { streak++; expected--; }
    else break;
  }
  return streak;
}

export function removePlan(planId: PlanId): void {
  saveAll(loadAll().filter(p => p.planId !== planId));
}

export function getActivePlan(): PlanId | null {
  try {
    return (localStorage.getItem('activePlanId') as PlanId) || null;
  } catch { return null; }
}

export function setActivePlan(planId: PlanId | null): void {
  if (planId === null) {
    localStorage.removeItem('activePlanId');
  } else {
    localStorage.setItem('activePlanId', planId);
  }
}

// Legacy helpers kept for compatibility
export function getDayNumber(planId: PlanId): number {
  const p = getPlanProgress(planId);
  return p?.currentDay ?? 1;
}

export function getStreak(planId: PlanId): number {
  const p = getPlanProgress(planId);
  return p?.streakDays ?? 0;
}

// Legacy date-based markDayComplete — kept so old code doesn't break
export function markDayComplete(planId: PlanId, _date: string): void {
  const p = getPlanProgress(planId);
  if (p) markDayCompleteByNumber(planId, p.currentDay);
}

// ─── Multi-plan progress system ───────────────────────────────────────────────

export type ProgressStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type ReadingProgress = {
  id: string;
  planId: PlanId;
  planName: string;
  startDay: number;
  currentDay: number;
  completedDays: number[];
  previousDaysStatus: PreviousDaysStatus;
  streakDays: number;
  startedAt: string;
  lastCompletedAt: string | null;
  isCompleted: boolean;
  status: ProgressStatus;
};

const LS_PROGRESSES_KEY = 'readingProgressesV3';

export function getAllProgresses(): ReadingProgress[] {
  try {
    const raw = localStorage.getItem(LS_PROGRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProgresses(list: ReadingProgress[]): void {
  try { localStorage.setItem(LS_PROGRESSES_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function addProgress(
  planId: PlanId,
  startDay: number,
  previousDaysStatus: PreviousDaysStatus,
): ReadingProgress {
  const plan = READING_PLANS.find(p => p.id === planId)!;
  const now = new Date().toISOString();
  const completedDays = previousDaysStatus === 'completed' && startDay > 1
    ? Array.from({ length: startDay - 1 }, (_, i) => i + 1)
    : [];

  const entry: ReadingProgress = {
    id: `${planId}-${Date.now()}`,
    planId,
    planName: plan.name,
    startDay,
    currentDay: startDay,
    completedDays,
    previousDaysStatus,
    streakDays: 0,
    startedAt: now,
    lastCompletedAt: null,
    isCompleted: false,
    status: 'active',
  };

  const all = getAllProgresses();
  all.push(entry);
  saveProgresses(all);
  return entry;
}

export function getProgressById(id: string): ReadingProgress | null {
  return getAllProgresses().find(p => p.id === id) ?? null;
}

export function getProgressesByPlan(planId: PlanId): ReadingProgress[] {
  return getAllProgresses().filter(p => p.planId === planId);
}

export function getActiveProgressIds(): string[] {
  return getAllProgresses()
    .filter(p => p.status === 'active' || p.status === 'paused')
    .map(p => p.id);
}

export function markProgressDayComplete(id: string, dayNumber: number): void {
  const all = getAllProgresses();
  const idx = all.findIndex(p => p.id === id);
  if (idx < 0) return;
  const entry = all[idx];
  const plan = READING_PLANS.find(p => p.id === entry.planId)!;

  if (!entry.completedDays.includes(dayNumber)) {
    entry.completedDays.push(dayNumber);
  }
  if (dayNumber === entry.currentDay && entry.currentDay < plan.durationDays) {
    entry.currentDay += 1;
  }
  entry.streakDays = calcStreak(entry.completedDays);
  entry.lastCompletedAt = new Date().toISOString();
  entry.isCompleted = entry.completedDays.length >= plan.durationDays;
  if (entry.isCompleted) entry.status = 'completed';
  saveProgresses(all);
}

export function toggleProgressDay(id: string, dayNumber: number): void {
  const all = getAllProgresses();
  const idx = all.findIndex(p => p.id === id);
  if (idx < 0) return;
  const pos = all[idx].completedDays.indexOf(dayNumber);
  if (pos >= 0) {
    all[idx].completedDays.splice(pos, 1);
    all[idx].isCompleted = false;
    if (all[idx].status === 'completed') all[idx].status = 'active';
  } else {
    all[idx].completedDays.push(dayNumber);
  }
  all[idx].streakDays = calcStreak(all[idx].completedDays);
  saveProgresses(all);
}

export function setProgressStatus(id: string, status: ProgressStatus): void {
  const all = getAllProgresses();
  const idx = all.findIndex(p => p.id === id);
  if (idx < 0) return;
  all[idx].status = status;
  saveProgresses(all);
}

export function removeProgressById(id: string): void {
  saveProgresses(getAllProgresses().filter(p => p.id !== id));
}

export function restartProgress(id: string): ReadingProgress {
  const old = getProgressById(id);
  if (!old) throw new Error('Progress not found');
  setProgressStatus(id, 'abandoned');
  return addProgress(old.planId, 1, 'incomplete');
}

export function getProgressPercent(progress: ReadingProgress): number {
  const plan = READING_PLANS.find(p => p.id === progress.planId);
  if (!plan) return 0;
  return Math.round((progress.completedDays.length / plan.durationDays) * 100);
}

function calcStreak(completedDays: number[]): number {
  if (completedDays.length === 0) return 0;
  const sorted = [...completedDays].sort((a, b) => b - a);
  let streak = 0;
  let expected = sorted[0];
  for (const d of sorted) {
    if (d === expected) { streak++; expected--; } else break;
  }
  return streak;
}
