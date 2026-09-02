import type { SharingPost } from './sharingStorage';
import { TYPE_LABELS, STATUS_LABELS } from './sharingStorage';

export type SharingDatePreset =
  | 'all'
  | 'today'
  | '7days'
  | '30days'
  | 'this_month'
  | 'custom';

export type SharingSearchFilter = {
  keyword: string;
  region: string;
  category: string;
  status: SharingPost['status'] | '';
  datePreset: SharingDatePreset;
  dateFrom: string;
  dateTo: string;
  churchName: string;
};

export const EMPTY_SHARING_FILTER: SharingSearchFilter = {
  keyword: '',
  region: '',
  category: '',
  status: '',
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
  churchName: '',
};

export const SHARING_REGIONS = [
  '서울',
  '경기',
  '인천',
  '강원',
  '충청',
  '전라',
  '경상',
  '제주',
] as const;

export type SharingTabKey = 'all' | SharingPost['type'] | 'completed';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getSharingPresetDates(
  preset: SharingDatePreset,
): { from: string; to: string } {
  const now = new Date();
  if (preset === 'today') {
    const t = toISODate(now);
    return { from: t, to: t };
  }
  if (preset === '7days') {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === '30days') {
    const from = new Date(now);
    from.setDate(now.getDate() - 29);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISODate(from), to: toISODate(now) };
  }
  return { from: '', to: '' };
}

/** location 문자열에서 광역 지역 추출 */
export function extractRegion(location: string): string {
  const loc = location.trim();
  if (!loc) return '';
  if (loc.startsWith('서울')) return '서울';
  if (loc.startsWith('경기')) return '경기';
  if (loc.startsWith('인천')) return '인천';
  if (loc.startsWith('강원')) return '강원';
  if (/^(충북|충남|충청|대전|세종)/.test(loc)) return '충청';
  if (/^(전북|전남|전라|광주)/.test(loc)) return '전라';
  if (/^(경북|경남|경상|부산|대구|울산)/.test(loc)) return '경상';
  if (loc.startsWith('제주')) return '제주';
  return loc.split(/\s+/)[0] ?? loc;
}

export function formatSharingDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-');
  if (!y || !m || !day) return d;
  return `${y}.${m}.${day}`;
}

export function isSharingFilterActive(f: SharingSearchFilter): boolean {
  return (
    !!f.keyword ||
    !!f.region ||
    !!f.category ||
    !!f.status ||
    !!f.churchName ||
    f.datePreset !== 'all' ||
    !!f.dateFrom ||
    !!f.dateTo
  );
}

export function countSharingDetailFilters(f: SharingSearchFilter): number {
  let n = 0;
  if (f.region) n++;
  if (f.category) n++;
  if (f.status) n++;
  if (f.churchName) n++;
  if (f.datePreset !== 'all' || f.dateFrom || f.dateTo) n++;
  return n;
}

export function sharingMatchesTab(post: SharingPost, tab: SharingTabKey): boolean {
  if (tab === 'completed') return post.status === 'completed';
  if (tab === 'all') return true;
  return post.type === tab;
}

export function sharingMatchesDetailFilter(
  post: SharingPost,
  f: SharingSearchFilter,
): boolean {
  if (f.region && extractRegion(post.location) !== f.region) return false;
  if (f.category && post.category !== f.category) return false;
  if (f.status && post.status !== f.status) return false;
  if (f.churchName && !post.churchName.includes(f.churchName)) return false;

  const { dateFrom, dateTo } = f;
  if (dateFrom || dateTo) {
    const key = post.createdAt.slice(0, 10);
    if (dateFrom && key < dateFrom) return false;
    if (dateTo && key > dateTo) return false;
  }

  if (f.keyword) {
    const q = f.keyword.toLowerCase();
    const hay = [
      post.title,
      post.content,
      post.churchName,
      post.location,
      post.category,
      TYPE_LABELS[post.type],
      STATUS_LABELS[post.status],
      post.writerName,
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function sortSharingPosts(a: SharingPost, b: SharingPost): number {
  if (a.status === 'completed' && b.status !== 'completed') return 1;
  if (a.status !== 'completed' && b.status === 'completed') return -1;
  return b.createdAt.localeCompare(a.createdAt);
}

export const TYPE_COLORS: Record<SharingPost['type'], string> = {
  give: 'bg-orange-100 text-orange-700',
  need: 'bg-blue-100 text-blue-700',
  ministry: 'bg-green-100 text-green-700',
  resource: 'bg-purple-100 text-purple-700',
  event: 'bg-rose-100 text-rose-700',
};

export const TYPE_GRADIENT: Record<SharingPost['type'], string> = {
  give: 'from-orange-400 to-amber-500',
  need: 'from-blue-400 to-blue-600',
  ministry: 'from-green-400 to-emerald-500',
  resource: 'from-purple-400 to-violet-500',
  event: 'from-rose-400 to-pink-500',
};

export const STATUS_COLORS: Record<SharingPost['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  reserved: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-500',
};
