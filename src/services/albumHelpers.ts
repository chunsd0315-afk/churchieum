import type { AppUser } from './permissions';
import { canViewContent } from './permissions';
import { getOrganizationPathLabel } from './userOrganizationTree';
import { getDistrictNameById, getDepartmentNameById, getZoneNameById } from './orgData';

export type AlbumSearchFilter = {
  scopeMode: 'all' | 'my_org';
  selectedOrgIds: string[];
  dateFrom: string;
  dateTo: string;
  keyword: string;
};

export type AlbumItem = {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  cover_image?: string;
  category?: string;
  visibility?: string;
  created_at: string;
  author_name?: string;
  author_position?: string;
  photo_count?: number;
  video_count?: number;
  visibility_type?: 'all' | 'district' | 'zone' | 'department';
  scope_id?: string;
  scope_name?: string;
  /** 공통 공개범위 — 내 조직과 공유 */
  sharedOrganizationIds?: string[];
};

export type AlbumPhoto = {
  id: string;
  album_id: string;
  url: string;
  caption?: string;
  sort_order?: number;
  created_at?: string;
};

const SCOPE_KEY = 'churchieum_album_scope_v1';

type StoredScope = {
  visibility_type: AlbumItem['visibility_type'];
  scope_id?: string;
  scope_name?: string;
  sharedOrganizationIds?: string[];
};

export const DEMO_ALBUMS: AlbumItem[] = [
  {
    id: 'd1',
    title: '2026년 여름 수련회',
    event_date: '2026-07-15',
    category: '행사',
    description: '전교인 2박 3일 여름 수련회',
    cover_image: 'https://images.pexels.com/photos/6457547/pexels-photo-6457547.jpeg?auto=compress&cs=tinysrgb&w=600',
    created_at: '2026-07-17',
    author_name: '정재명',
    author_position: '목사',
    photo_count: 20,
    visibility: '전체성도',
    visibility_type: 'all',
  },
  {
    id: 'd2',
    title: '어린이날 행사',
    event_date: '2026-05-05',
    category: '교회학교',
    description: '주일학교 어린이날 감사예배 및 행사',
    cover_image: 'https://images.pexels.com/photos/1001850/pexels-photo-1001850.jpeg?auto=compress&cs=tinysrgb&w=600',
    created_at: '2026-05-06',
    author_name: '김은혜',
    author_position: '권사',
    photo_count: 19,
    visibility: '전체성도',
    visibility_type: 'all',
  },
  {
    id: 'd3',
    title: '4월 부활절 예배',
    event_date: '2026-04-20',
    category: '행사',
    description: '부활절 특별예배 및 축하 행사',
    cover_image: 'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=600',
    created_at: '2026-04-21',
    author_name: '정재명',
    author_position: '목사',
    photo_count: 26,
    visibility: '전체성도',
    visibility_type: 'all',
  },
  {
    id: 'd4',
    title: '1교구 야외 모임',
    event_date: '2026-04-12',
    category: '교구',
    description: '1교구 전체 야외 친교 모임',
    cover_image: 'https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=600',
    created_at: '2026-04-13',
    author_name: '이성훈',
    author_position: '집사',
    photo_count: 21,
    visibility: '교구별',
    visibility_type: 'district',
    scope_name: '1교구',
  },
  {
    id: 'd5',
    title: '전교인 신년 예배',
    event_date: '2026-01-04',
    category: '행사',
    description: '2026년 새해 첫 주일예배',
    cover_image: 'https://images.pexels.com/photos/8815866/pexels-photo-8815866.jpeg?auto=compress&cs=tinysrgb&w=600',
    created_at: '2026-01-05',
    author_name: '정재명',
    author_position: '목사',
    photo_count: 15,
    visibility: '전체성도',
    visibility_type: 'all',
  },
  {
    id: 'd6',
    title: '성탄절 칸타타',
    event_date: '2025-12-24',
    category: '행사',
    description: '성탄절 전야 특별 칸타타',
    cover_image: 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=600',
    created_at: '2025-12-25',
    author_name: '박지영',
    author_position: '전도사',
    photo_count: 18,
    visibility: '전체성도',
    visibility_type: 'all',
  },
];

export const DEMO_PHOTOS: AlbumPhoto[] = [
  { id: 'p1', album_id: 'd1', url: 'https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '예배 후 단체 사진' },
  { id: 'p2', album_id: 'd1', url: 'https://images.pexels.com/photos/6457547/pexels-photo-6457547.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '청년부 모임' },
  { id: 'p3', album_id: 'd1', url: 'https://images.pexels.com/photos/1001850/pexels-photo-1001850.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'p4', album_id: 'd1', url: 'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '교회 전경' },
  { id: 'p5', album_id: 'd1', url: 'https://images.pexels.com/photos/8815866/pexels-photo-8815866.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'p6', album_id: 'd1', url: 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '특별 예배' },
  { id: 'p7', album_id: 'd1', url: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'p8', album_id: 'd1', url: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800', caption: '소그룹 모임' },
  { id: 'p9', album_id: 'd1', url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

function readScopeMap(): Record<string, StoredScope> {
  try {
    const raw = localStorage.getItem(SCOPE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredScope>) : {};
  } catch {
    return {};
  }
}

function visibilityFromLegacy(visibility?: string, category?: string): StoredScope {
  if (!visibility || visibility === '전체성도') return { visibility_type: 'all' };
  if (visibility === '관리자만') return { visibility_type: 'all' };
  if (visibility === '교구별') return { visibility_type: 'district', scope_name: category ?? '교구' };
  if (visibility === '부서별' || visibility === '교회학교') {
    return { visibility_type: 'department', scope_name: category ?? '부서' };
  }
  return { visibility_type: 'all' };
}

export function mergeAlbumScope(album: AlbumItem): AlbumItem {
  const stored = readScopeMap()[album.id];
  const legacy = visibilityFromLegacy(album.visibility, album.category);
  const vis = stored ?? legacy;
  return {
    ...album,
    visibility_type: vis.visibility_type ?? 'all',
    scope_id: vis.scope_id ?? album.scope_id,
    scope_name: vis.scope_name ?? album.scope_name,
    sharedOrganizationIds:
      vis.sharedOrganizationIds
      ?? album.sharedOrganizationIds
      ?? (vis.scope_id || album.scope_id
        ? [vis.scope_id ?? album.scope_id!]
        : []),
  };
}

export function mergeAlbumList(albums: AlbumItem[]): AlbumItem[] {
  return albums.map(mergeAlbumScope);
}

export function saveAlbumScope(
  albumId: string,
  scope: {
    visibility_type: AlbumItem['visibility_type'];
    scope_id?: string;
    scope_name?: string;
    sharedOrganizationIds?: string[];
  },
): void {
  try {
    const map = readScopeMap();
    map[albumId] = scope;
    localStorage.setItem(SCOPE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function albumOrgIds(album: AlbumItem): string[] {
  const merged = mergeAlbumScope(album);
  if (merged.sharedOrganizationIds?.length) return merged.sharedOrganizationIds;
  if (merged.scope_id) return [merged.scope_id];
  return [];
}

export function isAlbumVisible(user: AppUser | null, album: AlbumItem): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (album.visibility === '관리자만') {
    return user.role === 'pastor' || user.role === 'super_admin';
  }

  const merged = mergeAlbumScope(album);
  const type = merged.visibility_type ?? 'all';
  if (type === 'all') return true;

  return canViewContent(user, {
    createdBy: '',
    visibilityType: type,
    districtIds: type === 'district' && merged.scope_id ? [merged.scope_id] : undefined,
    zoneIds: type === 'zone' && merged.scope_id ? [merged.scope_id] : undefined,
    departmentIds: type === 'department' && merged.scope_id ? [merged.scope_id] : undefined,
  });
}

export function albumDateKey(album: AlbumItem): string {
  return (album.event_date || album.created_at || '').slice(0, 10);
}

export function formatAlbumDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-');
  if (!y || !m || !day) return d;
  return `${y}.${m}.${day}`;
}

export function formatAuthorLine(album: AlbumItem): string {
  const name = album.author_name?.trim();
  const pos = album.author_position?.trim();
  if (name && pos) return `${name} ${pos}`;
  return name || pos || '교회이음';
}

export function getAlbumScopeBadge(album: AlbumItem): string {
  const merged = mergeAlbumScope(album);
  if (merged.visibility_type === 'all' || !merged.visibility_type) return '전체 공개';
  const orgIds = albumOrgIds(merged);
  if (orgIds.length > 0) {
    const names = orgIds
      .map(id => {
        const live = getOrganizationPathLabel(id);
        if (live && live !== '조직 정보 없음') {
          const short = live.includes(' > ') ? live.split(' > ').pop()! : live;
          return short;
        }
        const d = getDistrictNameById(id);
        if (d !== '-') return d;
        const z = getZoneNameById(id);
        if (z !== '-') return z;
        const dep = getDepartmentNameById(id);
        if (dep !== '-') return dep;
        return '';
      })
      .filter(Boolean);
    if (names.length === 1) return `${names[0]} 공유`;
    if (names.length > 1) return `${names.length}개 조직 공유`;
  }
  if (merged.scope_id) {
    const live = getOrganizationPathLabel(merged.scope_id);
    if (live && live !== '조직 정보 없음') return live;
    const d = getDistrictNameById(merged.scope_id);
    if (d !== '-') return d;
    const z = getZoneNameById(merged.scope_id);
    if (z !== '-') return z;
    const dep = getDepartmentNameById(merged.scope_id);
    if (dep !== '-') return dep;
  }
  if (merged.scope_name) return merged.scope_name;
  if (merged.category) return merged.category;
  if (merged.visibility === '교구별') return '교구';
  if (merged.visibility === '부서별') return '부서';
  return '내 조직';
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export function countMediaFromPhotos(photos: { url: string }[]): { photo_count: number; video_count: number } {
  let photo_count = 0;
  let video_count = 0;
  for (const p of photos) {
    if (isVideoUrl(p.url)) video_count += 1;
    else photo_count += 1;
  }
  return { photo_count, video_count };
}

export function albumMatchesDetailFilter(
  album: AlbumItem,
  f: AlbumSearchFilter,
  myOrgFallbackIds: string[],
  orgNameById: Map<string, string>,
): boolean {
  if (f.scopeMode === 'my_org') {
    const target = f.selectedOrgIds.length > 0 ? f.selectedOrgIds : myOrgFallbackIds;
    if (target.length === 0) return false;
    const merged = mergeAlbumScope(album);
    if (merged.visibility_type === 'all') return true;
    const ids = albumOrgIds(merged);
    if (ids.length === 0 && merged.scope_name) {
      const hay = [...orgNameById.entries()]
        .filter(([, name]) => name.includes(merged.scope_name ?? ''))
        .map(([id]) => id);
      if (!hay.some(id => target.includes(id))) return false;
    } else if (!ids.some(id => target.includes(id))) {
      return false;
    }
  }

  const { dateFrom, dateTo } = f;
  if (dateFrom || dateTo) {
    const key = albumDateKey(album);
    if (dateFrom && key && key < dateFrom) return false;
    if (dateTo && key && key > dateTo) return false;
    if (!key && (dateFrom || dateTo)) return false;
  }

  if (f.keyword) {
    const q = f.keyword.toLowerCase();
    const orgNames = albumOrgIds(album)
      .map(id => orgNameById.get(id) ?? '')
      .join(' ');
    const hay = [
      album.title || '',
      album.description || '',
      album.author_name || '',
      album.author_position || '',
      album.category || '',
      getAlbumScopeBadge(album),
      orgNames,
      albumDateKey(album),
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}
