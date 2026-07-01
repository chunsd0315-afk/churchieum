const SERMONS_KEY = 'churchieum_sermons';
const FOLDERS_KEY = 'churchieum_sermon_folders';

export type SermonVisibility = 'all' | 'admin' | 'pastor' | 'member';

export type Sermon = {
  id: string;
  title: string;
  scripture: string;
  preacher: string;
  sermonDate: string;
  folderId: string;
  folderName: string;
  videoUrl: string;
  youtubeVideoId: string | null;
  visibility: SermonVisibility;
  createdAt: string;
  updatedAt: string;
};

export type SermonFolder = {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
  createdAt: string;
};

const DEFAULT_FOLDERS: SermonFolder[] = [
  { id: 'f1',  name: '1부',          order: 1,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f2',  name: '2부',          order: 2,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f3',  name: '3부',          order: 3,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f4',  name: '4부',          order: 4,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f5',  name: '5부',          order: 5,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f6',  name: '주일저녁',     order: 6,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f7',  name: '7부',          order: 7,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f8',  name: '주일예배',     order: 8,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f9',  name: '수요예배',     order: 9,  isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f10', name: '금요철야예배', order: 10, isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f11', name: '새벽예배',     order: 11, isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f12', name: '특별집회',     order: 12, isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'f13', name: '기타',         order: 13, isDefault: true, createdAt: '2026-01-01T00:00:00Z' },
];

const SEED_SERMONS: Sermon[] = [
  {
    id: 's1', title: '믿음의 출발', scripture: '히브리서 11:1', preacher: '김성기 목사',
    sermonDate: '2026-06-22', folderId: 'f2', folderName: '2부',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    visibility: 'all', createdAt: '2026-06-22T00:00:00Z', updatedAt: '2026-06-22T00:00:00Z',
  },
  {
    id: 's2', title: '예수님은 누구신가', scripture: '요한계시록 1:10-20', preacher: '정재명 목사',
    sermonDate: '2026-06-21', folderId: 'f3', folderName: '3부',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    visibility: 'all', createdAt: '2026-06-21T00:00:00Z', updatedAt: '2026-06-21T00:00:00Z',
  },
  {
    id: 's3', title: '하나님의 은혜', scripture: '에베소서 2:8-9', preacher: '김성기 목사',
    sermonDate: '2026-06-18', folderId: 'f9', folderName: '수요예배',
    videoUrl: '', youtubeVideoId: null,
    visibility: 'all', createdAt: '2026-06-18T00:00:00Z', updatedAt: '2026-06-18T00:00:00Z',
  },
  {
    id: 's4', title: '영적 전쟁에서 승리하라', scripture: '에베소서 6:10-18', preacher: '김성기 목사',
    sermonDate: '2026-06-15', folderId: 'f10', folderName: '금요철야예배',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    visibility: 'all', createdAt: '2026-06-15T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 's5', title: '성령충만의 삶', scripture: '사도행전 2:1-4', preacher: '이준혁 목사',
    sermonDate: '2026-06-11', folderId: 'f11', folderName: '새벽예배',
    videoUrl: '', youtubeVideoId: null,
    visibility: 'all', createdAt: '2026-06-11T00:00:00Z', updatedAt: '2026-06-11T00:00:00Z',
  },
  {
    id: 's6', title: '부활의 능력', scripture: '로마서 8:11', preacher: '김성기 목사',
    sermonDate: '2026-06-08', folderId: 'f8', folderName: '주일예배',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtubeVideoId: 'dQw4w9WgXcQ',
    visibility: 'all', createdAt: '2026-06-08T00:00:00Z', updatedAt: '2026-06-08T00:00:00Z',
  },
];

// ── Folders ──────────────────────────────────────────────────────────────────

function loadFolders(): SermonFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (raw) return JSON.parse(raw) as SermonFolder[];
  } catch {}
  saveFolders(DEFAULT_FOLDERS);
  return DEFAULT_FOLDERS;
}

function saveFolders(list: SermonFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(list));
}

export function getAllFolders(): SermonFolder[] {
  return loadFolders().slice().sort((a, b) => a.order - b.order);
}

export function addFolder(name: string): SermonFolder {
  const list = loadFolders();
  const maxOrder = list.reduce((m, f) => Math.max(m, f.order), 0);
  const folder: SermonFolder = {
    id: `f_${Date.now()}`, name, order: maxOrder + 1,
    isDefault: false, createdAt: new Date().toISOString(),
  };
  saveFolders([...list, folder]);
  return folder;
}

export function updateFolder(id: string, name: string): void {
  const list = loadFolders().map(f => f.id === id ? { ...f, name } : f);
  saveFolders(list);
  // Update folderName on matching sermons
  const sermons = loadSermons().map(s => s.folderId === id ? { ...s, folderName: name } : s);
  saveSermons(sermons);
}

export function deleteFolder(id: string): void {
  saveFolders(loadFolders().filter(f => f.id !== id));
  // Move sermons in this folder to '기타'
  const fallback = loadFolders().find(f => f.name === '기타');
  const sermons = loadSermons().map(s =>
    s.folderId === id
      ? { ...s, folderId: fallback?.id ?? '', folderName: fallback?.name ?? '기타' }
      : s
  );
  saveSermons(sermons);
}

// ── Sermons ───────────────────────────────────────────────────────────────────

function loadSermons(): Sermon[] {
  try {
    const raw = localStorage.getItem(SERMONS_KEY);
    if (raw) return JSON.parse(raw) as Sermon[];
  } catch {}
  saveSermons(SEED_SERMONS);
  return SEED_SERMONS;
}

function saveSermons(list: Sermon[]) {
  localStorage.setItem(SERMONS_KEY, JSON.stringify(list));
}

export function getAllSermons(): Sermon[] {
  return loadSermons().sort((a, b) => b.sermonDate.localeCompare(a.sermonDate));
}

export function addSermon(data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>): Sermon {
  const now = new Date().toISOString();
  const sermon: Sermon = { ...data, id: `s_${Date.now()}`, createdAt: now, updatedAt: now };
  saveSermons([sermon, ...loadSermons()]);
  return sermon;
}

export function updateSermon(id: string, data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt'>): void {
  saveSermons(
    loadSermons().map(s =>
      s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
    )
  );
}

export function deleteSermon(id: string): void {
  saveSermons(loadSermons().filter(s => s.id !== id));
}

// ── Utilities ──────────────────────────────────────────────────────────────────

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
