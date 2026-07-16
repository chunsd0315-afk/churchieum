/**
 * 신앙 성장 타임라인 — 여러 활동을 시간순으로 통합
 */

import { getAllGraceNotes, analyzeGraceNotes } from './graceNotes';
import { getAllPrayers } from '../services/prayerStorage';

export type FaithTimelineEvent = {
  id: string;
  type: 'sermon_grace' | 'reading_grace' | 'personal_grace' | 'prayer' | 'prayer_answered' | 'bible_saved' | 'sharing';
  title: string;
  subtitle?: string;
  date: string;
  emoji: string;
};

const TYPE_META: Record<FaithTimelineEvent['type'], { emoji: string }> = {
  sermon_grace: { emoji: '🎤' },
  reading_grace: { emoji: '📖' },
  personal_grace: { emoji: '✍️' },
  prayer: { emoji: '🙏' },
  prayer_answered: { emoji: '✅' },
  bible_saved: { emoji: '🔖' },
  sharing: { emoji: '🤝' },
};

function loadSavedVerses(): { reference: string; savedAt: string }[] {
  try {
    const raw = localStorage.getItem('savedVerses_v1');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadSharingCount(): FaithTimelineEvent[] {
  try {
    const raw = localStorage.getItem('churchieum_sharing_posts');
    if (!raw) return [];
    const posts = JSON.parse(raw) as { id: string; title: string; createdAt?: string }[];
    return posts.slice(0, 20).map(p => ({
      id: `share-${p.id}`,
      type: 'sharing' as const,
      title: p.title,
      subtitle: '교회나눔 참여',
      date: p.createdAt ?? new Date().toISOString(),
      emoji: TYPE_META.sharing.emoji,
    }));
  } catch { return []; }
}

export function getFaithTimeline(limit = 50): FaithTimelineEvent[] {
  const events: FaithTimelineEvent[] = [];

  for (const n of getAllGraceNotes()) {
    const type = n.type === 'sermon' ? 'sermon_grace' as const
      : n.type === 'reading' ? 'reading_grace' as const
        : 'personal_grace' as const;
    events.push({
      id: n.id,
      type,
      title: n.graceTitle ?? n.graceContent.slice(0, 40),
      subtitle: n.type === 'sermon' ? n.sermonTitle
        : n.type === 'reading' ? `${n.planName ?? ''} ${n.bibleReference ?? ''}`.trim()
          : '자유 은혜기록',
      date: n.createdAt,
      emoji: TYPE_META[type].emoji,
    });
  }

  try {
    for (const p of getAllPrayers()) {
      events.push({
        id: `prayer-${p.id}`,
        type: 'prayer',
        title: p.title,
        subtitle: '기도 작성',
        date: p.createdAt,
        emoji: TYPE_META.prayer.emoji,
      });
      if (p.status === 'answered') {
        events.push({
          id: `prayer-ans-${p.id}`,
          type: 'prayer_answered',
          title: p.title,
          subtitle: '기도 응답',
          date: p.answeredAt ?? p.updatedAt,
          emoji: TYPE_META.prayer_answered.emoji,
        });
      }
    }
  } catch { /* ignore */ }

  for (const v of loadSavedVerses()) {
    events.push({
      id: `verse-${v.reference}-${v.savedAt}`,
      type: 'bible_saved',
      title: v.reference,
      subtitle: '말씀 저장',
      date: v.savedAt,
      emoji: TYPE_META.bible_saved.emoji,
    });
  }

  events.push(...loadSharingCount());

  return events
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** 신앙 리포트용 월별 집계 */
export function getFaithReportByMonth(year: number) {
  const notes = getAllGraceNotes().filter(n => n.createdAt.startsWith(String(year)));
  const byMonth: Record<string, {
    total: number; sermon: number; reading: number; personal: number;
  }> = {};

  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const monthNotes = notes.filter(n => n.createdAt.slice(0, 7) === key);
    byMonth[key] = {
      total: monthNotes.length,
      sermon: monthNotes.filter(n => n.type === 'sermon').length,
      reading: monthNotes.filter(n => n.type === 'reading').length,
      personal: monthNotes.filter(n => n.type === 'personal').length,
    };
  }
  return byMonth;
}

export function getFaithReportSummary(year: number) {
  const notes = getAllGraceNotes().filter(n => n.createdAt.startsWith(String(year)));

  const bookCount: Record<string, number> = {};
  const kwCount: Record<string, number> = {};
  const KEYWORDS = ['사랑', '감사', '믿음', '순종', '기도', '은혜', '소망', '평안'];

  for (const n of notes) {
    const ref = n.bibleReference ?? '';
    const match = ref.match(/[가-힣]{2,}/);
    if (match) bookCount[match[0]] = (bookCount[match[0]] ?? 0) + 1;
    for (const kw of KEYWORDS) {
      if (n.graceContent.includes(kw)) kwCount[kw] = (kwCount[kw] ?? 0) + 1;
    }
  }

  const topBooks = Object.entries(bookCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const topKeywords = Object.entries(kwCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  const streak = analyzeGraceNotes(notes).streak;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = notes.filter(n => n.createdAt.slice(0, 7) === thisMonth).length;

  return {
    yearTotal: notes.length,
    sermonTotal: notes.filter(n => n.type === 'sermon').length,
    readingTotal: notes.filter(n => n.type === 'reading').length,
    personalTotal: notes.filter(n => n.type === 'personal').length,
    topBooks,
    topKeywords,
    streak,
    thisMonthCount,
    monthGrowth: thisMonthCount > 0
      ? `이번 달 ${thisMonthCount}개의 은혜를 기록하며 믿음의 발자취를 남기고 있습니다.`
      : '이번 달 첫 은혜기록을 남겨보세요.',
  };
}
