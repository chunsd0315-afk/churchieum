import type { PrayerComment } from '../types/prayer';

/** localStorage 키 — 기도 댓글 (prayerId로 연결) */
export const PRAYER_COMMENTS_STORAGE_KEY = 'churchieum_prayer_comments';
const LEGACY_COMMENT_KEYS = ['churchieum_prayer_comments_v1'];

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const SEED: PrayerComment[] = [
  {
    id: 'pc-1',
    prayerId: 'pr-2',
    authorId: 'demo-pastor02',
    authorName: '이변우',
    content: '함께 기도하겠습니다. 지혜와 평안이 있으시길 바랍니다.',
    createdAt: daysAgo(4),
  },
  {
    id: 'pc-2',
    prayerId: 'pr-5',
    authorId: 'demo-pastor01',
    authorName: '정재명',
    content: '교회 전체가 함께 기도하겠습니다.',
    createdAt: daysAgo(1),
  },
  {
    id: 'pc-3',
    prayerId: 'pr-6',
    authorId: 'demo-pastor02',
    authorName: '이변우',
    content: '청년부가 함께 중보기도하겠습니다.',
    createdAt: daysAgo(3),
  },
  {
    id: 'pc-4',
    prayerId: 'pr-6',
    authorId: 'demo-member60',
    authorName: '천성대',
    content: '감사합니다. 조카를 위해 계속 기도해 주세요.',
    createdAt: daysAgo(2),
  },
];

function commentId() {
  return `pc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function readCommentsRaw(): string | null {
  const current = localStorage.getItem(PRAYER_COMMENTS_STORAGE_KEY);
  if (current) return current;
  for (const legacy of LEGACY_COMMENT_KEYS) {
    const old = localStorage.getItem(legacy);
    if (old) {
      try {
        localStorage.setItem(PRAYER_COMMENTS_STORAGE_KEY, old);
      } catch { /* ignore */ }
      return old;
    }
  }
  return null;
}

function load(): PrayerComment[] {
  try {
    const raw = readCommentsRaw();
    if (raw) return JSON.parse(raw) as PrayerComment[];
  } catch { /* ignore */ }
  try {
    localStorage.setItem(PRAYER_COMMENTS_STORAGE_KEY, JSON.stringify(SEED));
  } catch { /* ignore */ }
  return SEED;
}

function save(list: PrayerComment[]) {
  try {
    localStorage.setItem(PRAYER_COMMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getAllPrayerComments(): PrayerComment[] {
  return load();
}

export function getCommentsForPrayer(prayerId: string): PrayerComment[] {
  return load()
    .filter(c => c.prayerId === prayerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getCommentCount(prayerId: string): number {
  return load().filter(c => c.prayerId === prayerId).length;
}

export function addPrayerComment(
  data: Omit<PrayerComment, 'id' | 'createdAt'>,
): PrayerComment {
  const list = load();
  const comment: PrayerComment = {
    ...data,
    id: commentId(),
    createdAt: new Date().toISOString(),
  };
  save([...list, comment]);
  return comment;
}

export function deleteCommentsForPrayer(prayerId: string): void {
  save(load().filter(c => c.prayerId !== prayerId));
}

export function deletePrayerComment(id: string): void {
  save(load().filter(c => c.id !== id));
}
