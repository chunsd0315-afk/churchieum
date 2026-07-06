import type { PrayerNotification } from '../types/prayer';

/** localStorage 키 — 기도 알림 (prayerId · receiverId로 연결) */
export const PRAYER_NOTIFICATIONS_STORAGE_KEY = 'churchieum_prayer_notifications';
const LEGACY_NOTIFICATION_KEYS = ['churchieum_prayer_notifications_v1'];

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const SEED: PrayerNotification[] = [
  {
    id: 'pn-1',
    prayerId: 'pr-2',
    receiverId: 'demo-pastor02',
    type: 'intercession',
    read: false,
    createdAt: daysAgo(5),
  },
  {
    id: 'pn-2',
    prayerId: 'pr-5',
    receiverId: 'demo-member60',
    type: 'intercession',
    read: false,
    createdAt: daysAgo(1),
  },
  {
    id: 'pn-3',
    prayerId: 'pr-4',
    receiverId: 'demo-pastor01',
    type: 'pastor_shared',
    read: true,
    createdAt: daysAgo(2),
  },
  {
    id: 'pn-4',
    prayerId: 'pr-3',
    receiverId: 'demo-member60',
    type: 'answered',
    read: false,
    createdAt: daysAgo(1),
  },
];

function notifId() {
  return `pn-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function readNotificationsRaw(): string | null {
  const current = localStorage.getItem(PRAYER_NOTIFICATIONS_STORAGE_KEY);
  if (current) return current;
  for (const legacy of LEGACY_NOTIFICATION_KEYS) {
    const old = localStorage.getItem(legacy);
    if (old) {
      try {
        localStorage.setItem(PRAYER_NOTIFICATIONS_STORAGE_KEY, old);
      } catch { /* ignore */ }
      return old;
    }
  }
  return null;
}

function load(): PrayerNotification[] {
  try {
    const raw = readNotificationsRaw();
    if (raw) return JSON.parse(raw) as PrayerNotification[];
  } catch { /* ignore */ }
  try {
    localStorage.setItem(PRAYER_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(SEED));
  } catch { /* ignore */ }
  return SEED;
}

function save(list: PrayerNotification[]) {
  try {
    localStorage.setItem(PRAYER_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getAllPrayerNotifications(): PrayerNotification[] {
  return load();
}

export function getNotificationsForUser(receiverId: string): PrayerNotification[] {
  return load()
    .filter(n => n.receiverId === receiverId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(receiverId: string): number {
  return load().filter(n => n.receiverId === receiverId && !n.read).length;
}

export function addPrayerNotification(
  data: Omit<PrayerNotification, 'id' | 'createdAt' | 'read'> & { read?: boolean },
): PrayerNotification {
  const list = load();
  const notification: PrayerNotification = {
    ...data,
    id: notifId(),
    read: data.read ?? false,
    createdAt: new Date().toISOString(),
  };
  save([notification, ...list]);
  return notification;
}

export function markNotificationRead(id: string): void {
  const list = load();
  const idx = list.findIndex(n => n.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], read: true };
  save(list);
}

export function markAllNotificationsRead(receiverId: string): void {
  save(load().map(n => (n.receiverId === receiverId ? { ...n, read: true } : n)));
}

export function deleteNotificationsForPrayer(prayerId: string): void {
  save(load().filter(n => n.prayerId !== prayerId));
}

export function deletePrayerNotification(id: string): void {
  save(load().filter(n => n.id !== id));
}
