import type { AppUser } from './permissions';
import { canManageSermons } from './permissions';
import type { Sermon, SermonVisibility } from '../types/sermon';

export { canManageSermons };

function visibilityAllows(user: AppUser | null, visibility: SermonVisibility): boolean {
  if (!user) return visibility === 'all' || visibility === 'member';
  if (user.role === 'super_admin') return true;
  if (visibility === 'all' || visibility === 'member') return true;
  if (visibility === 'pastor') return user.role === 'pastor';
  if (visibility === 'admin') return user.role === 'super_admin';
  return false;
}

export function canViewSermon(user: AppUser | null, sermon: Sermon): boolean {
  if (sermon.status === 'draft') return canManageSermons(user);
  return visibilityAllows(user, sermon.visibility);
}

export function filterSermonsForUser(sermons: Sermon[], user: AppUser | null): Sermon[] {
  return sermons.filter(s => canViewSermon(user, s));
}

export type SermonListFilters = {
  worshipType?: string;
  preacher?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
};

export function filterSermonList(sermons: Sermon[], filters: SermonListFilters): Sermon[] {
  return sermons.filter(s => {
    if (filters.worshipType && filters.worshipType !== 'all' && s.worshipType !== filters.worshipType) {
      return false;
    }
    if (filters.preacher && filters.preacher !== 'all' && s.preacher !== filters.preacher) return false;
    if (filters.dateFrom && s.sermonDate < filters.dateFrom) return false;
    if (filters.dateTo && s.sermonDate > filters.dateTo) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const hay = [s.title, s.scripture, s.preacher, s.summary, ...s.tags].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** 설교 본문 말씀을 성경 저장함에 메모로 저장 */
export function saveScriptureFromSermon(scripture: string, sermonTitle: string): void {
  if (!scripture.trim()) return;
  try {
    const key = 'savedVerses_v1';
    const raw = localStorage.getItem(key);
    const saved = raw ? JSON.parse(raw) as unknown[] : [];
    const entry = {
      id: `sermon-${Date.now()}`,
      book: '설교본문',
      chapter: 0,
      verse: 0,
      text: scripture,
      memo: `설교: ${sermonTitle}`,
      tags: ['설교'],
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([entry, ...saved]));
  } catch { /* ignore */ }
}

export async function trySyncSermonToSupabase(sermon: Sermon): Promise<void> {
  try {
    const { supabase, supabaseConfigured } = await import('./supabase');
    if (!supabaseConfigured) return;
    await supabase.from('sermons').upsert({
      id: sermon.id,
      title: sermon.title,
      bible_verse: sermon.scripture,
      content: sermon.summary,
      video_url: sermon.videoUrl || null,
      preacher: sermon.preacher,
      sermon_date: sermon.sermonDate,
    });
  } catch { /* demo fallback */ }
}
