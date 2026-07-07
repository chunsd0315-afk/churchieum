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
const SEED_VERSION_KEY = 'churchieum_sermon_seed_version';
/** 시드 데이터 버전 — 값 변경 시 기본 폴더 + 데모 설교가 재생성됩니다. */
const SEED_VERSION = 'flat-200-v1';

export type { Sermon, SermonFolder, SermonAttachment, SermonVisibility, WorshipType, SermonStatus };

/** 예배 폴더 — 평면(단일 계층) 구조 */
const DEFAULT_FOLDERS: SermonFolder[] = [
  { id: 'f-sun1', name: '주일1부', order: 1, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'sunday' },
  { id: 'f-sun2', name: '주일2부', order: 2, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'sunday' },
  { id: 'f-sun3', name: '주일3부', order: 3, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'sunday' },
  { id: 'f-sun4', name: '주일4부', order: 4, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'sunday' },
  { id: 'f-sun5', name: '주일5부', order: 5, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'sunday' },
  { id: 'f-youth', name: '청년부', order: 6, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'sunday' },
  { id: 'f-friday', name: '금요철야', order: 7, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'friday' },
  { id: 'f-wed', name: '수요예배', order: 8, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'wednesday' },
  { id: 'f-dawn', name: '특별새벽예배', order: 9, isDefault: true, createdAt: '2026-01-01T00:00:00Z', type: 'worship', worshipType: 'dawn' },
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

// ── 데모 설교 200개 생성기 ─────────────────────────────────────────────────────

const SEED_TITLES = [
  '믿음의 출발', '은혜의 강가에서', '십자가의 사랑', '부활의 능력', '성령 충만한 삶',
  '광야를 지나며', '기도의 능력', '말씀 위에 세운 집', '다시 일어서는 믿음', '하나님의 시간표',
  '흔들리지 않는 소망', '섬김의 기쁨', '빛으로 오신 주', '용서의 은혜', '감사의 제사',
  '순종의 축복', '두려움을 넘어서', '주님과 동행하는 길', '회복하시는 하나님', '새 마음 새 영',
  '겨자씨 한 알의 믿음', '잃은 양을 찾으시는 주', '거룩한 부르심', '영원한 반석', '사랑으로 하나 되어',
  '고난 중의 찬양', '약속의 땅을 향하여', '겸손의 자리', '깨어 기도하라', '생명의 떡',
  '주 안에서 강건하라', '참 자유를 주시는 분', '작은 자를 통해', '끝까지 견디는 믿음', '은혜 위에 은혜',
  '아버지의 마음', '성전을 사모하는 마음', '다시 오실 주님', '오늘 내게 주신 사명', '평강의 왕',
];

const SEED_PREACHERS = ['김성기 목사', '정재명 목사', '이준혁 목사', '박성훈 목사', '최은혜 전도사', '한상우 목사'];

const SEED_SCRIPTURES = [
  '창세기 1:1', '출애굽기 14:14', '여호수아 1:9', '시편 23:1', '시편 46:10',
  '잠언 3:5-6', '이사야 40:31', '예레미야 29:11', '마태복음 6:33', '마태복음 11:28',
  '마가복음 10:45', '누가복음 15:20', '요한복음 3:16', '요한복음 14:6', '사도행전 2:1-4',
  '로마서 8:28', '로마서 12:1-2', '고린도전서 13:4-7', '고린도후서 5:17', '갈라디아서 2:20',
  '에베소서 2:8-9', '빌립보서 4:13', '골로새서 3:23', '히브리서 11:1', '야고보서 1:2-4',
  '베드로전서 5:7', '요한일서 4:19', '요한계시록 21:4',
];

const SEED_YOUTUBE_IDS = [
  'dQw4w9WgXcQ', 'ScMzIvxBSi4', 'kXYiU_JCYtU', '9bZkp7q19f0', 'e-ORhEE9VVg',
  'fJ9rUzIMcZQ', 'L_jWHffIx5E', 'ktvTqknDobU',
];

const SEED_SUMMARIES = [
  '오늘 본문을 통해 삶의 우선순위를 다시 점검하고, 하나님을 첫자리에 모시는 결단을 나눕니다.',
  '어려운 상황 속에서도 흔들리지 않는 믿음의 뿌리가 무엇인지 함께 묵상합니다.',
  '하나님의 은혜가 우리 일상에 어떻게 나타나는지 구체적인 삶의 이야기로 풀어냅니다.',
  '말씀을 듣는 데서 그치지 않고 순종으로 나아갈 때 임하는 축복을 살펴봅니다.',
  '기도의 자리를 회복할 때 경험하는 하나님의 능력과 평강을 나눕니다.',
  '공동체 안에서 서로 사랑하고 섬기는 것이 왜 복음의 핵심인지 되새깁니다.',
  '고난의 시간을 지나는 성도에게 주시는 위로와 소망의 메시지입니다.',
  '십자가의 사랑을 깊이 묵상하며 우리의 삶으로 응답하기를 결단합니다.',
  '성령의 인도하심을 따라 살아가는 성도의 참된 자유를 이야기합니다.',
  '다시 오실 주님을 기다리며 오늘을 깨어 살아가는 지혜를 나눕니다.',
];

const SEED_TAGS = [
  ['믿음', '순종'], ['은혜', '감사'], ['기도', '능력'], ['사랑', '섬김'], ['소망', '위로'],
  ['말씀', '묵상'], ['십자가', '구원'], ['성령', '충만'], ['회복', '치유'], ['소명', '헌신'],
];

/** 폴더별 설교 개수 분배 (총 200개) */
const SEED_DISTRIBUTION: { folderId: string; count: number }[] = [
  { folderId: 'f-sun1', count: 24 },
  { folderId: 'f-sun2', count: 24 },
  { folderId: 'f-sun3', count: 24 },
  { folderId: 'f-sun4', count: 24 },
  { folderId: 'f-sun5', count: 24 },
  { folderId: 'f-youth', count: 20 },
  { folderId: 'f-friday', count: 20 },
  { folderId: 'f-wed', count: 20 },
  { folderId: 'f-dawn', count: 20 },
];

function seedDate(offsetDays: number): string {
  const base = new Date('2026-07-05T00:00:00Z');
  base.setUTCDate(base.getUTCDate() - offsetDays);
  return base.toISOString().split('T')[0];
}

function generateSeedSermons(folders: SermonFolder[]): Sermon[] {
  const now = new Date().toISOString();
  const out: Sermon[] = [];
  let n = 0;
  let dayOffset = 0;

  for (const { folderId, count } of SEED_DISTRIBUTION) {
    const folder = folders.find(f => f.id === folderId);
    const worshipType = folder?.worshipType ?? 'sunday';
    const folderName = folder?.name ?? '';

    for (let i = 0; i < count; i++) {
      n += 1;
      const hasVideo = n % 5 !== 0; // 약 80%는 유튜브 영상 포함
      const ytId = SEED_YOUTUBE_IDS[n % SEED_YOUTUBE_IDS.length];
      const title = SEED_TITLES[n % SEED_TITLES.length];
      const preacher = SEED_PREACHERS[(n * 3) % SEED_PREACHERS.length];
      const scripture = SEED_SCRIPTURES[(n * 7) % SEED_SCRIPTURES.length];
      const summary = SEED_SUMMARIES[n % SEED_SUMMARIES.length];
      const tags = SEED_TAGS[n % SEED_TAGS.length];

      out.push({
        id: `seed_${n}`,
        title,
        scripture,
        preacher,
        sermonDate: seedDate(dayOffset),
        worshipType,
        folderId,
        folderName,
        videoUrl: hasVideo ? `https://www.youtube.com/watch?v=${ytId}` : '',
        youtubeVideoId: hasVideo ? ytId : null,
        thumbnailUrl: hasVideo ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined,
        summary,
        tags,
        attachments: [],
        visibility: 'all',
        status: 'published',
        viewCount: 25 + (n * 37) % 950,
        likeCount: 3 + (n * 13) % 240,
        createdAt: now,
        updatedAt: now,
      });
      dayOffset += 3;
    }
  }
  return out;
}

// ── Seed gate ──────────────────────────────────────────────────────────────

/** 시드 버전이 다르면 기본 폴더 + 데모 설교 200개를 재생성한다. */
function ensureSeeded(): void {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === SEED_VERSION) return;
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(DEFAULT_FOLDERS));
    localStorage.setItem(SERMONS_STORAGE_KEY, JSON.stringify(generateSeedSermons(DEFAULT_FOLDERS)));
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  } catch { /* ignore */ }
}

// ── Folders ──────────────────────────────────────────────────────────────────

function loadFoldersRaw(): SermonFolder[] {
  ensureSeeded();
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      const normalized = parsed.map(normalizeFolder);
      if (normalized.length > 0) return normalized;
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
  saveFolders(list.filter(f => f.id !== id));
  // 삭제된 폴더의 설교는 지우지 않고 "전체"에만 남도록 폴더 연결만 해제한다.
  const sermons = loadSermonsRaw().map(s =>
    s.folderId === id ? { ...s, folderId: '', folderName: '' } : s,
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
  const seeded = generateSeedSermons(folders);
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
