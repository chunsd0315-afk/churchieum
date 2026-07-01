import type { PrayerAttachment, PrayerAttachmentRecord, Prayer } from '../types/prayer';
import { normalizePrayerAttachment } from './prayerAttachmentHelpers';

/** localStorage 키 — 기도 첨부 파일 (prayerId로 연결) */
export const PRAYER_ATTACHMENTS_STORAGE_KEY = 'churchieum_prayer_attachments';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const SEED: PrayerAttachmentRecord[] = [
  {
    id: 'att-seed-1',
    prayerId: 'pr-6',
    name: '기도카드.jpg',
    type: 'image',
    url: 'https://images.pexels.com/photos/3608268/pexels-photo-3608268.jpeg?auto=compress&cs=tinysrgb&w=400',
    size: 245_760,
    createdAt: daysAgo(4),
  },
];

function attId() {
  return `att-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeRecord(raw: unknown): PrayerAttachmentRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.prayerId !== 'string') return null;
  const base = normalizePrayerAttachment(raw);
  if (!base) return null;
  return { ...base, prayerId: o.prayerId };
}

function load(): PrayerAttachmentRecord[] {
  try {
    const raw = localStorage.getItem(PRAYER_ATTACHMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[];
      return parsed.map(normalizeRecord).filter((a): a is PrayerAttachmentRecord => a !== null);
    }
  } catch { /* ignore */ }
  save(SEED);
  return SEED;
}

function save(list: PrayerAttachmentRecord[]) {
  try {
    localStorage.setItem(PRAYER_ATTACHMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getAllPrayerAttachmentRecords(): PrayerAttachmentRecord[] {
  return load();
}

export function getAttachmentsForPrayer(prayerId: string): PrayerAttachment[] {
  return load()
    .filter(a => a.prayerId === prayerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(({ prayerId: _pid, ...att }) => att);
}

export function getAttachmentCount(prayerId: string): number {
  return load().filter(a => a.prayerId === prayerId).length;
}

export function replaceAttachmentsForPrayer(
  prayerId: string,
  attachments: PrayerAttachment[],
): void {
  const rest = load().filter(a => a.prayerId !== prayerId);
  const records: PrayerAttachmentRecord[] = attachments.map(a => ({
    ...a,
    id: a.id || attId(),
    prayerId,
  }));
  save([...rest, ...records]);
}

export function addPrayerAttachment(
  prayerId: string,
  attachment: Omit<PrayerAttachment, 'id'> & { id?: string },
): PrayerAttachment {
  const record: PrayerAttachmentRecord = {
    id: attachment.id ?? attId(),
    prayerId,
    name: attachment.name,
    type: attachment.type,
    url: attachment.url,
    size: attachment.size,
    createdAt: attachment.createdAt,
  };
  save([...load(), record]);
  const { prayerId: _pid, ...att } = record;
  return att;
}

export function deleteAttachmentsForPrayer(prayerId: string): void {
  save(load().filter(a => a.prayerId !== prayerId));
}

/** 기도 본문에 포함된 인라인 첨부 → 별도 저장소로 이전 */
export function migrateInlineAttachmentsFromPrayers(prayers: Prayer[]): void {
  const existing = load();
  const byPrayer = new Map<string, PrayerAttachmentRecord[]>();
  for (const r of existing) {
    const list = byPrayer.get(r.prayerId) ?? [];
    list.push(r);
    byPrayer.set(r.prayerId, list);
  }

  const toAdd: PrayerAttachmentRecord[] = [];
  for (const p of prayers) {
    if (!p.attachments?.length) continue;
    if (byPrayer.has(p.id) && byPrayer.get(p.id)!.length > 0) continue;
    for (const a of p.attachments) {
      toAdd.push({ ...a, prayerId: p.id });
    }
  }

  if (toAdd.length > 0) {
    save([...existing, ...toAdd]);
  }
}

/** 저장소 첨부를 기도 객체에 합침 */
export function hydratePrayerAttachments(prayer: Prayer): Prayer {
  return {
    ...prayer,
    attachments: getAttachmentsForPrayer(prayer.id),
  };
}

export function hydratePrayersAttachments(prayers: Prayer[]): Prayer[] {
  return prayers.map(hydratePrayerAttachments);
}
