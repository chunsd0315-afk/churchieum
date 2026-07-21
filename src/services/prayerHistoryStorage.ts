import type { PrayerHistory, PrayerHistoryAction, PrayerVisibility } from '../types/prayer';

/** localStorage 키 — 기도 이력 (prayerId로 연결) */
export const PRAYER_HISTORY_STORAGE_KEY = 'churchieum_prayer_history';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const SEED: PrayerHistory[] = [
  {
    id: 'ph-1',
    prayerId: 'pr-2',
    action: 'created',
    actorId: 'demo-member60',
    actorName: '천성대',
    createdAt: daysAgo(5),
  },
  {
    id: 'ph-2',
    prayerId: 'pr-2',
    action: 'shared',
    actorId: 'demo-member60',
    actorName: '천성대',
    visibility: 'organization_share',
    createdAt: daysAgo(5),
  },
  {
    id: 'ph-3a',
    prayerId: 'pr-3',
    action: 'created',
    actorId: 'demo-member60',
    actorName: '천성대',
    createdAt: daysAgo(11),
  },
  {
    id: 'ph-3b',
    prayerId: 'pr-3',
    action: 'shared',
    actorId: 'demo-member60',
    actorName: '천성대',
    visibility: 'pastor_share',
    createdAt: daysAgo(9),
  },
  {
    id: 'ph-3c',
    prayerId: 'pr-3',
    action: 'answered',
    actorId: 'demo-member60',
    actorName: '천성대',
    createdAt: daysAgo(2),
  },
  {
    id: 'ph-3d',
    prayerId: 'pr-3',
    action: 'gratitude_testimony',
    actorId: 'demo-member60',
    actorName: '천성대',
    testimonyContent: 'QT 모임을 통해 말씀이 더 깊어지고 있습니다. 주님께 감사드립니다.',
    createdAt: daysAgo(0),
  },
  {
    id: 'ph-4',
    prayerId: 'pr-5',
    action: 'created',
    actorId: 'demo-pastor01',
    actorName: '정재명',
    createdAt: daysAgo(1),
  },
  {
    id: 'ph-5',
    prayerId: 'pr-5',
    action: 'shared',
    actorId: 'demo-pastor01',
    actorName: '정재명',
    visibility: 'organization_share',
    createdAt: daysAgo(1),
  },
];

function historyId() {
  return `ph-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function load(): PrayerHistory[] {
  try {
    const raw = localStorage.getItem(PRAYER_HISTORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrayerHistory[];
  } catch { /* ignore */ }
  try {
    localStorage.setItem(PRAYER_HISTORY_STORAGE_KEY, JSON.stringify(SEED));
  } catch { /* ignore */ }
  return SEED;
}

function save(list: PrayerHistory[]) {
  try {
    localStorage.setItem(PRAYER_HISTORY_STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getAllPrayerHistory(): PrayerHistory[] {
  return load();
}

export function getHistoryForPrayer(prayerId: string): PrayerHistory[] {
  return load()
    .filter(h => h.prayerId === prayerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addPrayerHistory(
  data: Omit<PrayerHistory, 'id' | 'createdAt'>,
): PrayerHistory {
  const entry: PrayerHistory = {
    ...data,
    id: historyId(),
    createdAt: new Date().toISOString(),
  };
  save([...load(), entry]);
  return entry;
}

export function recordPrayerHistory(
  prayerId: string,
  action: PrayerHistoryAction,
  actor: { actorId: string; actorName: string },
  extra?: { visibility?: PrayerVisibility; testimonyContent?: string },
): PrayerHistory {
  return addPrayerHistory({
    prayerId,
    action,
    actorId: actor.actorId,
    actorName: actor.actorName,
    visibility: extra?.visibility,
    testimonyContent: extra?.testimonyContent,
  });
}

export function deleteHistoryForPrayer(prayerId: string): void {
  save(load().filter(h => h.prayerId !== prayerId));
}
