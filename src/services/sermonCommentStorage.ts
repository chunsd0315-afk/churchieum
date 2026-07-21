import type { SermonComment } from '../types/sermon';

export const SERMON_COMMENTS_STORAGE_KEY = 'churchieum_sermon_comments';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const SEED: SermonComment[] = [
  {
    id: 'sc-1',
    sermonId: 's1',
    authorId: 'demo-member60',
    authorName: '천성대',
    content: '은혜로운 말씀 감사합니다. 이번 주도 믿음으로 살겠습니다.',
    createdAt: daysAgo(2),
  },
  {
    id: 'sc-2',
    sermonId: 's6',
    authorId: 'demo-pastor02',
    authorName: '이변우',
    content: '부활의 능력이 우리 교회에도 임하시길 기도합니다.',
    createdAt: daysAgo(1),
  },
];

function commentId() {
  return `sc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function load(): SermonComment[] {
  try {
    const raw = localStorage.getItem(SERMON_COMMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SermonComment[];
  } catch { /* ignore */ }
  try {
    localStorage.setItem(SERMON_COMMENTS_STORAGE_KEY, JSON.stringify(SEED));
  } catch { /* ignore */ }
  return SEED;
}

function save(list: SermonComment[]) {
  try {
    localStorage.setItem(SERMON_COMMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getCommentsForSermon(sermonId: string): SermonComment[] {
  return load()
    .filter(c => c.sermonId === sermonId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getCommentCount(sermonId: string): number {
  return load().filter(c => c.sermonId === sermonId).length;
}

export function addSermonComment(
  data: Omit<SermonComment, 'id' | 'createdAt'>,
): SermonComment {
  const comment: SermonComment = {
    ...data,
    id: commentId(),
    createdAt: new Date().toISOString(),
  };
  save([...load(), comment]);
  return comment;
}

export function deleteCommentsForSermon(sermonId: string): void {
  save(load().filter(c => c.sermonId !== sermonId));
}
