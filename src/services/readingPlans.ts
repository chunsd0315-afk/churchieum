/**
 * Reading plan definitions and daily schedule calculator.
 * Plans are structured to be easily replaceable with Supabase bible_plan_schedules data.
 */

import { BOOK_LIST } from './bibleVersesKR';

export type ReadingPlan = {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  plan_type: '전체' | '신약' | '구약' | '시편잠언' | '역사순';
  daily_chapters: number;
  color: string;
};

export type DailyReading = {
  day: number;
  readings: { book: string; chapters: number[] }[];
  label: string;
};

export const READING_PLANS: ReadingPlan[] = [
  { id: 'p1', name: '1년 성경통독',    description: '365일 동안 전체 성경을 완독합니다',       duration_days: 365, plan_type: '전체',   daily_chapters: 3,  color: 'from-primary-500 to-primary-700' },
  { id: 'p2', name: '6개월 성경읽기',  description: '180일 균형 있는 통독 프로그램',          duration_days: 180, plan_type: '전체',   daily_chapters: 6,  color: 'from-emerald-500 to-teal-600' },
  { id: 'p3', name: '4개월 집중통독',  description: '120일 만에 성경 전체를 읽습니다',        duration_days: 120, plan_type: '전체',   daily_chapters: 9,  color: 'from-amber-500 to-orange-600' },
  { id: 'p4', name: '90일 성경통독',   description: '집중 통독 프로그램으로 90일 완독',        duration_days: 90,  plan_type: '전체',   daily_chapters: 13, color: 'from-red-500 to-rose-600' },
  { id: 'p5', name: '30일 신약통독',   description: '신약성경만 30일 만에 완독합니다',         duration_days: 30,  plan_type: '신약',   daily_chapters: 9,  color: 'from-blue-500 to-indigo-600' },
  { id: 'p6', name: '맥체인 성경읽기', description: '전통적인 맥체인 읽기표 – 하루 4구데',     duration_days: 365, plan_type: '전체',   daily_chapters: 4,  color: 'from-violet-500 to-purple-600' },
  { id: 'p7', name: '시편·잠언 통독',  description: '시편과 잠언을 31일 동안 읽습니다',        duration_days: 31,  plan_type: '시편잠언', daily_chapters: 6, color: 'from-pink-500 to-rose-600' },
];

/* Build sequential chapter list for a given testament scope */
function buildChapterSequence(scope: ReadingPlan['plan_type']): { book: string; chapter: number }[] {
  const list: { book: string; chapter: number }[] = [];
  const books = scope === '신약'
    ? BOOK_LIST.filter(b => b.testament === 'new')
    : scope === '구약'
    ? BOOK_LIST.filter(b => b.testament === 'old')
    : scope === '시편잠언'
    ? BOOK_LIST.filter(b => b.name === '시편' || b.name === '잠언')
    : BOOK_LIST;

  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      list.push({ book: book.name, chapter: ch });
    }
  }
  return list;
}

export function getDailyReading(plan: ReadingPlan, dayNumber: number): DailyReading {
  const sequence = buildChapterSequence(plan.plan_type);
  const totalChapters = sequence.length;
  const chapsPerDay = Math.ceil(totalChapters / plan.duration_days);
  const start = (dayNumber - 1) * chapsPerDay;
  const slice = sequence.slice(start, start + chapsPerDay);

  // Group consecutive chapters by book
  const groups: Record<string, number[]> = {};
  for (const { book, chapter } of slice) {
    if (!groups[book]) groups[book] = [];
    groups[book].push(chapter);
  }

  const readings = Object.entries(groups).map(([book, chapters]) => ({ book, chapters }));
  const label = readings
    .map(r => `${r.book} ${r.chapters[0]}${r.chapters.length > 1 ? `–${r.chapters[r.chapters.length - 1]}` : ''}장`)
    .join(', ');

  return { day: dayNumber, readings, label };
}
