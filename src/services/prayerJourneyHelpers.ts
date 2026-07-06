import type { PrayerHistory, PrayerHistoryAction, PrayerVisibility } from '../types/prayer';

/** 여정 타임라인에 표시할 단계 */
export const JOURNEY_ACTIONS: PrayerHistoryAction[] = [
  'created',
  'shared',
  'answered',
  'gratitude_testimony',
];

export function formatJourneyDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10).replace(/-/g, '.');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function getJourneyStepLabel(
  action: PrayerHistoryAction,
  visibility?: PrayerVisibility,
): string {
  switch (action) {
    case 'created':
      return '기도 등록';
    case 'shared':
      if (visibility === 'pastor_shared') return '교역자 공유';
      if (visibility === 'intercession') return '중보기도 나눔';
      return '나눔';
    case 'answered':
      return '응답됨';
    case 'gratitude_testimony':
      return '감사 간증 작성';
    case 'edited':
      return '내용 수정';
    default:
      return action;
  }
}

export function getPrayerJourneySteps(history: PrayerHistory[]): PrayerHistory[] {
  return history
    .filter(h => JOURNEY_ACTIONS.includes(h.action))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
