const LIKES_KEY = 'churchieum_sermon_likes';
const DRAFTS_KEY = 'churchieum_sermon_drafts';

type SermonLike = { sermonId: string; userId: string };

function loadLikes(): SermonLike[] {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    if (raw) return JSON.parse(raw) as SermonLike[];
  } catch { /* ignore */ }
  return [];
}

function saveLikes(list: SermonLike[]) {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function isSermonLiked(sermonId: string, userId: string): boolean {
  return loadLikes().some(l => l.sermonId === sermonId && l.userId === userId);
}

export function toggleSermonLike(sermonId: string, userId: string): boolean {
  const list = loadLikes();
  const exists = list.some(l => l.sermonId === sermonId && l.userId === userId);
  if (exists) {
    saveLikes(list.filter(l => !(l.sermonId === sermonId && l.userId === userId)));
    return false;
  }
  saveLikes([...list, { sermonId, userId }]);
  return true;
}

export function getLikeCountForSermon(sermonId: string): number {
  return loadLikes().filter(l => l.sermonId === sermonId).length;
}

export function deleteLikesForSermon(sermonId: string): void {
  saveLikes(loadLikes().filter(l => l.sermonId !== sermonId));
}

// ── Draft form cache ───────────────────────────────────────────────────────────

export function saveSermonDraft(userId: string, data: unknown): void {
  try {
    const all = loadDrafts();
    all[userId] = { data, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function getSermonDraft(userId: string): { data: unknown; savedAt: string } | null {
  const all = loadDrafts();
  return all[userId] ?? null;
}

export function clearSermonDraft(userId: string): void {
  const all = loadDrafts();
  delete all[userId];
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
}

function loadDrafts(): Record<string, { data: unknown; savedAt: string }> {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, { data: unknown; savedAt: string }>;
  } catch { /* ignore */ }
  return {};
}
