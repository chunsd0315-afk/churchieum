import type {
  Sermon,
  SermonAttachment,
  SermonFolder,
  SermonStatus,
  SermonVisibility,
  WorshipType,
} from '../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../types/sermon';

export const SERMONS_STORAGE_KEY = 'churchieum_sermons';
export const FOLDERS_STORAGE_KEY = 'churchieum_sermon_folders';

export type { Sermon, SermonFolder, SermonAttachment, SermonVisibility, WorshipType, SermonStatus };

const DEFAULT_FOLDERS: SermonFolder[] = [
  { id: 'fy2026', name: '2026년', order: 1, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'year', year: 2026 },
  { id: 'fm202606', name: '6월', order: 1, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'month', parentId: 'fy2026', year: 2026, month: 6 },
  { id: 'fm202607', name: '7월', order: 2, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'month', parentId: 'fy2026', year: 2026, month: 7 },
  { id: 'fw-sun-07', name: '주일예배', order: 1, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', parentId: 'fm202607', worshipType: 'sunday' },
  { id: 'fw-wed-07', name: '수요예배', order: 2, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', parentId: 'fm202607', worshipType: 'wednesday' },
  { id: 'fw-fri-07', name: '금요기도회', order: 3, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', parentId: 'fm202607', worshipType: 'friday' },
  { id: 'fw-dawn-07', name: '새벽기도회', order: 4, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', parentId: 'fm202607', worshipType: 'dawn' },
  { id: 'fw-spec-07', name: '특별집회', order: 5, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', parentId: 'fm202607', worshipType: 'special' },
];

function inferWorshipType(folderName: string): WorshipType {
  const n = folderName.toLowerCase();
  if (n.includes('주일') || /^[1-7]부/.test(folderName) || n.includes('주일저녁')) return 'sunday';
  if (n.includes('수요')) return 'wednesday';
  if (n.includes('금요') || n.includes('철야')) return 'friday';
  if (n.includes('새벽')) return 'dawn';
  if (n.includes('특별')) return 'special';
  return 'other';
}

function normalizeFolder(raw: Record<string, unknown>): SermonFolder {
  const type = (raw.type as SermonFolder['type']) ?? 'worship';
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    order: typeof raw.order === 'number' ? raw.order : 0,
    isDefault: Boolean(raw.isDefault),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    type,
    parentId: raw.parentId ? String(raw.parentId) : undefined,
    year: typeof raw.year === 'number' ? raw.year : undefined,
    month: typeof raw.month === 'number' ? raw.month : undefined,
    worshipType: raw.worshipType as WorshipType | undefined,
  };
}

function normalizeAttachment(raw: unknown): SermonAttachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== 'string' || typeof o.url !== 'string') return null;
  return {
    id: typeof o.id === 'string' ? o.id : `sa-${Date.now()}`,
    name: o.name,
    type: (o.type as SermonAttachment['type']) ?? 'document',
    url: o.url,
    size: typeof o.size === 'number' ? o.size : 0,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
  };
}

function normalizeSermon(raw: Record<string, unknown>, folders: SermonFolder[]): Sermon {
  const folderName = String(raw.folderName ?? '');
  const folderId = String(raw.folderId ?? '');
  const folder = folders.find(f => f.id === folderId);
  const worshipType =
    (raw.worshipType as WorshipType) ??
    folder?.worshipType ??
    inferWorshipType(folderName);

  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    scripture: String(raw.scripture ?? ''),
    preacher: String(raw.preacher ?? ''),
    sermonDate: String(raw.sermonDate ?? ''),
    worshipType,
    folderId,
    folderName: folderName || folder?.name || WORSHIP_TYPE_LABELS[worshipType],
    videoUrl: String(raw.videoUrl ?? ''),
    youtubeVideoId: raw.youtubeVideoId ? String(raw.youtubeVideoId) : getYouTubeId(String(raw.videoUrl ?? '')),
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl) : undefined,
    summary: String(raw.summary ?? ''),
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    attachments: Array.isArray(raw.attachments)
      ? raw.attachments.map(normalizeAttachment).filter((a): a is SermonAttachment => a !== null)
      : [],
    visibility: (raw.visibility as SermonVisibility) ?? 'all',
    status: (raw.status as SermonStatus) ?? 'published',
    viewCount: typeof raw.viewCount === 'number' ? raw.viewCount : 0,
    likeCount: typeof raw.likeCount === 'number' ? raw.likeCount : 0,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

const SEED_SERMONS: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: '믿음의 출발', scripture: '히브리서 11:1', preacher: '김성기 목사',
    sermonDate: '2026-06-22', worshipType: 'sunday', folderId: 'fw-sun-07', folderName: '주일예배',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    summary: '믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거임을 묵상합니다.',
    tags: ['믿음', '히브리서'], attachments: [], visibility: 'all', status: 'published',
    viewCount: 128, likeCount: 24,
  },
  {
    title: '예수님은 누구신가', scripture: '요한계시록 1:10-20', preacher: '정재명 목사',
    sermonDate: '2026-06-21', worshipType: 'sunday', folderId: 'fw-sun-07', folderName: '주일예배',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    summary: '요한이 밧모섬에서 본 영광스러운 예수님의 모습을 통해 그분을 다시 발견합니다.',
    tags: ['예수님', '요한계시록'], attachments: [], visibility: 'all', status: 'published',
    viewCount: 95, likeCount: 18,
  },
  {
    title: '하나님의 은혜', scripture: '에베소서 2:8-9', preacher: '김성기 목사',
    sermonDate: '2026-06-18', worshipType: 'wednesday', folderId: 'fw-wed-07', folderName: '수요예배',
    videoUrl: '', youtubeVideoId: null,
    summary: '은혜로 말미암아 믿음으로 구원받았음을 기억하고 감사합니다.',
    tags: ['은혜', '구원'], attachments: [], visibility: 'all', status: 'published',
    viewCount: 67, likeCount: 12,
  },
  {
    title: '영적 전쟁에서 승리하라', scripture: '에베소서 6:10-18', preacher: '김성기 목사',
    sermonDate: '2026-06-15', worshipType: 'friday', folderId: 'fw-fri-07', folderName: '금요기도회',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    summary: '하나님의 전신갑주를 입고 기도로 승리하는 삶을 배웁니다.',
    tags: ['영적전쟁', '기도'], attachments: [], visibility: 'all', status: 'published',
    viewCount: 84, likeCount: 15,
  },
  {
    title: '성령충만의 삶', scripture: '사도행전 2:1-4', preacher: '이준혁 목사',
    sermonDate: '2026-06-11', worshipType: 'dawn', folderId: 'fw-dawn-07', folderName: '새벽기도회',
    videoUrl: '', youtubeVideoId: null,
    summary: '오순절 성령 강림의 은혜를 오늘의 삶에 적용합니다.',
    tags: ['성령', '오순절'], attachments: [], visibility: 'all', status: 'published',
    viewCount: 52, likeCount: 9,
  },
  {
    title: '부활의 능력', scripture: '로마서 8:11', preacher: '김성기 목사',
    sermonDate: '2026-06-08', worshipType: 'sunday', folderId: 'fw-sun-07', folderName: '주일예배',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    summary: '예수님의 부활 능력이 우리 안에 역사하심을 믿습니다.',
    tags: ['부활', '로마서'], attachments: [], visibility: 'all', status: 'published',
    viewCount: 143, likeCount: 31,
  },
];

// ── Folders ──────────────────────────────────────────────────────────────────

function loadFoldersRaw(): SermonFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      const normalized = parsed.map(normalizeFolder);
      if (normalized.some(f => f.type === 'year')) return normalized;
    }
  } catch { /* ignore */ }
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(DEFAULT_FOLDERS));
  } catch { /* ignore */ }
  return DEFAULT_FOLDERS;
}

function saveFolders(list: SermonFolder[]) {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(list));
}

export function getAllFolders(): SermonFolder[] {
  return loadFoldersRaw().slice().sort((a, b) => a.order - b.order);
}

export function getYearFolders(): SermonFolder[] {
  return getAllFolders().filter(f => f.type === 'year');
}

export function getMonthFolders(yearId: string): SermonFolder[] {
  return getAllFolders().filter(f => f.type === 'month' && f.parentId === yearId);
}

export function getWorshipFolders(monthId: string): SermonFolder[] {
  return getAllFolders().filter(f => f.type === 'worship' && f.parentId === monthId);
}

export function getSelectableFolders(): SermonFolder[] {
  return getAllFolders().filter(f => f.type === 'worship');
}

export function addFolder(
  data: Omit<SermonFolder, 'id' | 'createdAt' | 'order' | 'isDefault'> & { order?: number },
): SermonFolder {
  const list = loadFoldersRaw();
  const siblings = list.filter(f => f.parentId === data.parentId && f.type === data.type);
  const maxOrder = siblings.reduce((m, f) => Math.max(m, f.order), 0);
  const folder: SermonFolder = {
    ...data,
    id: `f_${Date.now()}`,
    order: data.order ?? maxOrder + 1,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };
  saveFolders([...list, folder]);
  return folder;
}

export function updateFolder(id: string, updates: Partial<Pick<SermonFolder, 'name' | 'order'>>): void {
  const list = loadFoldersRaw();
  const next = list.map(f => (f.id === id ? { ...f, ...updates } : f));
  saveFolders(next);
  if (updates.name) {
    const sermons = loadSermonsRaw().map(s =>
      s.folderId === id ? { ...s, folderName: updates.name! } : s,
    );
    saveSermons(sermons);
  }
}

export function deleteFolder(id: string): void {
  const list = loadFoldersRaw();
  const toDelete = new Set<string>([id]);
  const findChildren = (pid: string) => {
    list.filter(f => f.parentId === pid).forEach(c => {
      toDelete.add(c.id);
      findChildren(c.id);
    });
  };
  findChildren(id);
  saveFolders(list.filter(f => !toDelete.has(f.id)));
  const fallback = list.find(f => f.worshipType === 'other') ?? list.find(f => f.type === 'worship');
  const sermons = loadSermonsRaw().map(s =>
    toDelete.has(s.folderId)
      ? {
          ...s,
          folderId: fallback?.id ?? '',
          folderName: fallback?.name ?? '기타',
          worshipType: fallback?.worshipType ?? 'other',
        }
      : s,
  );
  saveSermons(sermons);
}

export function reorderFolders(ids: string[]): void {
  const list = loadFoldersRaw();
  const orderMap = new Map(ids.map((id, i) => [id, i + 1]));
  saveFolders(
    list.map(f => (orderMap.has(f.id) ? { ...f, order: orderMap.get(f.id)! } : f)),
  );
}

// ── Sermons ───────────────────────────────────────────────────────────────────

function loadSermonsRaw(): Sermon[] {
  const folders = loadFoldersRaw();
  try {
    const raw = localStorage.getItem(SERMONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      return parsed.map(s => normalizeSermon(s, folders));
    }
  } catch { /* ignore */ }
  const now = new Date().toISOString();
  const seeded = SEED_SERMONS.map((s, i) => ({
    ...s,
    id: `s${i + 1}`,
    createdAt: now,
    updatedAt: now,
  }));
  saveSermons(seeded);
  return seeded;
}

function saveSermons(list: Sermon[]) {
  localStorage.setItem(SERMONS_STORAGE_KEY, JSON.stringify(list));
}

export function getAllSermons(): Sermon[] {
  return loadSermonsRaw().sort((a, b) => b.sermonDate.localeCompare(a.sermonDate));
}

export function getSermonById(id: string): Sermon | undefined {
  return loadSermonsRaw().find(s => s.id === id);
}

export function addSermon(data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount'>): Sermon {
  const now = new Date().toISOString();
  const ytId = data.youtubeVideoId ?? getYouTubeId(data.videoUrl);
  const sermon: Sermon = {
    ...data,
    youtubeVideoId: ytId,
    viewCount: 0,
    likeCount: 0,
    id: `s_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  saveSermons([sermon, ...loadSermonsRaw()]);
  return sermon;
}

export function updateSermon(
  id: string,
  data: Partial<Omit<Sermon, 'id' | 'createdAt'>>,
): Sermon | null {
  const list = loadSermonsRaw();
  const idx = list.findIndex(s => s.id === id);
  if (idx < 0) return null;
  const merged = {
    ...list[idx],
    ...data,
    youtubeVideoId: data.videoUrl !== undefined
      ? getYouTubeId(data.videoUrl) ?? data.youtubeVideoId ?? null
      : list[idx].youtubeVideoId,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = merged;
  saveSermons(list);
  return merged;
}

export function deleteSermon(id: string): void {
  saveSermons(loadSermonsRaw().filter(s => s.id !== id));
}

export function incrementSermonView(id: string): void {
  const list = loadSermonsRaw();
  const idx = list.findIndex(s => s.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], viewCount: list[idx].viewCount + 1 };
  saveSermons(list);
}

export function setSermonLikeCount(id: string, count: number): void {
  updateSermon(id, { likeCount: Math.max(0, count) });
}

// ── Utilities ────────────────────────────────────────────────────────────────

export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/[?&]v=([^&#]+)/) ||
    url.match(/youtu\.be\/([^?&#]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&#]+)/);
  return m ? m[1] : null;
}

export function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export function getUniquePreachers(sermons: Sermon[]): string[] {
  return [...new Set(sermons.map(s => s.preacher).filter(Boolean))].sort();
}
