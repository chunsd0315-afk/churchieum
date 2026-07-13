/**
 * 은혜기록 배지 시스템
 */

import { getAllGraceNotes, analyzeGraceNotes } from './graceNotes';
import { getAllSermons } from '../services/sermonStorage';

export type GraceBadge = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  earned: boolean;
};

export function getGraceBadges(): GraceBadge[] {
  const notes = getAllGraceNotes();
  const analytics = analyzeGraceNotes(notes);
  const sermonNotes = notes.filter(n => n.type === 'sermon').length;
  const readingNotes = notes.filter(n => n.type === 'reading').length;
  const sermons = getAllSermons();

  return [
    { id: 'first', label: '첫 은혜기록', emoji: '🌱', description: '첫 은혜기록을 남겼습니다', earned: notes.length >= 1 },
    { id: 'ten', label: '은혜 10개', emoji: '📝', description: '은혜기록 10개 달성', earned: notes.length >= 10 },
    { id: 'hundred', label: '은혜 100개', emoji: '📚', description: '은혜기록 100개 달성', earned: notes.length >= 100 },
    { id: 'first-sermon', label: '첫 설교 은혜', emoji: '🎤', description: '첫 설교 은혜기록', earned: sermonNotes >= 1 },
    { id: 'first-reading', label: '첫 통독 은혜', emoji: '📖', description: '첫 성경통독 은혜기록', earned: readingNotes >= 1 },
    { id: 'streak-7', label: '7일 연속', emoji: '🔥', description: '7일 연속 기록', earned: analytics.streak >= 7 },
    { id: 'streak-30', label: '30일 연속', emoji: '🔥', description: '30일 연속 기록', earned: analytics.streak >= 30 },
    { id: 'streak-100', label: '100일 연속', emoji: '💎', description: '100일 연속 기록', earned: analytics.streak >= 100 },
    { id: 'year-100', label: '올해 100개', emoji: '🏆', description: '올해 은혜기록 100개', earned: analytics.thisYear >= 100 },
    { id: 'sermon-50', label: '설교 50편', emoji: '▶️', description: '설교 50편 시청 (데모)', earned: sermons.length >= 50 },
  ];
}

export function getEarnedBadgeCount(): number {
  return getGraceBadges().filter(b => b.earned).length;
}
