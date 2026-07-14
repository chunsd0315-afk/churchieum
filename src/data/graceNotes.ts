import { applyGraceShareValidation, canPastorViewSharedGraceNote, getCurrentUserFromStorage, splitOrganizationShareIds, composeSharedGroupIds } from '../services/graceNoteShareScope';
import type { AppUser } from '../services/permissions';

const LS_KEY = 'graceNotesV2';
const LS_DEMO_SEEDED = 'graceNotesV2_demo_seeded_v3';
const LS_LIKES = 'graceNotes_likes_by_me';
const DEMO_SEED_VERSION = 'v3';

export type GraceNoteType = 'reading' | 'sermon' | 'personal';

export type GraceNoteVisibility = 'private' | 'pastor' | 'group' | 'public';

export type GraceNoteCommentType = 'comment' | 'prayer' | 'amen';

export type GraceNoteComment = {
  id: string;
  authorName: string;
  content: string;
  type: GraceNoteCommentType;
  createdAt: string;
};

export type GraceNote = {
  id: string;
  userId?: string;
  authorName?: string;
  authorRole?: string;
  type: GraceNoteType;
  visibility: GraceNoteVisibility;
  /** 담당 교역자 공유 — 전체 선택 */
  sharedPastorAll?: boolean;
  /** 담당 교역자 공유 — 선택 ID (clergy id) */
  sharedPastorIds?: string[];
  /** 조직/부서 공유 — 전체 선택 (레거시) */
  sharedGroupAll?: boolean;
  /** 조직/부서 공유 — 통합 ID (상위·하위·부서, 레거시 호환) */
  sharedGroupIds?: string[];
  /** 조직 공유 — 상위조직 ID */
  sharedUpperOrganizationIds?: string[];
  /** 조직 공유 — 하위조직 ID */
  sharedLowerOrganizationIds?: string[];
  /** 조직 공유 — 부서 ID */
  sharedDepartmentIds?: string[];
  /** 작성자 소속 (시드·권한 판별용) */
  authorDistrictId?: string;
  authorZoneId?: string;
  authorDepartmentIds?: string[];
  // source info
  sourceId?: string;        // progressId (reading) | sermonId (sermon)
  sourceTitle?: string;     // plan name (reading) | sermon title (sermon)
  // reading-specific
  planId?: string;
  planName?: string;
  planColor?: string;
  day?: number;
  // sermon-specific
  sermonTitle?: string;
  sermonPreacher?: string;
  sermonDate?: string;
  worshipType?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  graceTitle?: string;
  isFavorite?: boolean;
  // reading-specific continued
  readDate?: string;
  bibleBook?: string;
  bibleChapter?: number;
  // shared
  bibleReference?: string;
  memorableVerse: string;
  graceContent: string;
  application: string;
  prayer: string;
  likeCount?: number;
  amenCount?: number;
  prayCount?: number;
  comments?: GraceNoteComment[];
  createdAt: string;
  updatedAt: string;
};

export type GraceNoteInput = Omit<GraceNote, 'id' | 'createdAt' | 'updatedAt'>;

function normalizeNote(n: GraceNote): GraceNote {
  const split = splitOrganizationShareIds({
    sharedGroupIds: n.sharedGroupIds,
    sharedUpperOrganizationIds: n.sharedUpperOrganizationIds,
    sharedLowerOrganizationIds: n.sharedLowerOrganizationIds,
    sharedDepartmentIds: n.sharedDepartmentIds,
  });
  return {
    ...n,
    visibility: n.visibility ?? 'private',
    sharedPastorIds: n.sharedPastorIds ?? [],
    sharedPastorAll: n.sharedPastorAll ?? false,
    sharedGroupAll: n.sharedGroupAll ?? false,
    sharedUpperOrganizationIds: split.upper,
    sharedLowerOrganizationIds: split.lower,
    sharedDepartmentIds: split.departments,
    sharedGroupIds: composeSharedGroupIds(split.upper, split.lower, split.departments),
    likeCount: n.likeCount ?? 0,
    amenCount: n.amenCount ?? 0,
    prayCount: n.prayCount ?? 0,
    comments: n.comments ?? [],
    isFavorite: n.isFavorite ?? false,
  };
}

function load(): GraceNote[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GraceNote[];
      return parsed.map(normalizeNote);
    }

    // Migrate from v1
    const oldRaw = localStorage.getItem('graceNotesV1');
    if (oldRaw) {
      type OldNote = {
        id: string; progressId: string; planId: string; planName: string;
        planColor: string; day: number; readingReferences: string;
        graceContent: string; memorableVerse: string; application: string;
        prayer: string; createdAt: string; updatedAt: string;
      };
      const migrated: GraceNote[] = (JSON.parse(oldRaw) as OldNote[]).map(n => ({
        id: n.id,
        type: 'reading' as GraceNoteType,
        visibility: 'private' as GraceNoteVisibility,
        sharedPastorIds: [],
        sharedGroupIds: [],
        sourceId: n.progressId,
        sourceTitle: n.planName,
        planId: n.planId,
        planName: n.planName,
        planColor: n.planColor,
        day: n.day,
        bibleReference: n.readingReferences,
        memorableVerse: n.memorableVerse,
        graceContent: n.graceContent,
        application: n.application,
        prayer: n.prayer,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
      save(migrated);
      return migrated;
    }
    return [];
  } catch { return []; }
}

function save(notes: GraceNote[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notes)); } catch { /* ignore */ }
}

export function getAllGraceNotes(): GraceNote[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNote(id: string): GraceNote | null {
  return load().find(n => n.id === id) ?? null;
}

export function getGraceNotesByType(type: GraceNoteType): GraceNote[] {
  return load()
    .filter(n => n.type === type)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNotesByProgress(progressId: string): GraceNote[] {
  return load()
    .filter(n => n.sourceId === progressId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNotesByPlan(planId: string): GraceNote[] {
  return load()
    .filter(n => n.planId === planId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNotesBySource(sourceId: string): GraceNote[] {
  return load()
    .filter(n => n.sourceId === sourceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 설교별 은혜기록 개수 */
export function countGraceNotesBySermon(sermonId: string): number {
  return load().filter(n => n.type === 'sermon' && n.sourceId === sermonId).length;
}

/** 목회자가 볼 수 있는 공유 은혜기록 (나만 보기 제외, 담당 성도 범위) */
export function getSharedGraceNotesForPastor(viewer?: AppUser | null): GraceNote[] {
  const user = viewer ?? getCurrentUserFromStorage();
  return load()
    .filter(n => canPastorViewSharedGraceNote(n, user))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 즐겨찾기 은혜기록 */
export function getFavoriteGraceNotes(): GraceNote[] {
  return load().filter(n => n.isFavorite).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createGraceNote(input: GraceNoteInput, userId?: string): GraceNote {
  const now = new Date().toISOString();
  const share = applyGraceShareValidation({
    visibility: input.visibility,
    sharedPastorAll: input.sharedPastorAll,
    sharedPastorIds: input.sharedPastorIds,
    sharedGroupAll: input.sharedGroupAll,
    sharedGroupIds: input.sharedGroupIds,
    sharedUpperOrganizationIds: input.sharedUpperOrganizationIds,
    sharedLowerOrganizationIds: input.sharedLowerOrganizationIds,
    sharedDepartmentIds: input.sharedDepartmentIds,
  });
  const note: GraceNote = normalizeNote({
    ...input,
    ...share,
    userId: input.userId ?? userId,
    visibility: share.visibility ?? 'private',
    id: `gn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  });
  const notes = load();
  notes.push(note);
  save(notes);
  return note;
}

export function updateGraceNote(id: string, updates: Partial<Omit<GraceNote, 'id' | 'createdAt'>>): void {
  const notes = load();
  const idx = notes.findIndex(n => n.id === id);
  if (idx < 0) return;

  const merged = { ...notes[idx], ...updates };
  const hasShareUpdate =
    updates.visibility !== undefined ||
    updates.sharedPastorAll !== undefined ||
    updates.sharedPastorIds !== undefined ||
    updates.sharedGroupAll !== undefined ||
    updates.sharedGroupIds !== undefined ||
    updates.sharedUpperOrganizationIds !== undefined ||
    updates.sharedLowerOrganizationIds !== undefined ||
    updates.sharedDepartmentIds !== undefined;

  let finalUpdates = updates;
  if (hasShareUpdate) {
    const share = applyGraceShareValidation({
      visibility: merged.visibility,
      sharedPastorAll: merged.sharedPastorAll,
      sharedPastorIds: merged.sharedPastorIds,
      sharedGroupAll: merged.sharedGroupAll,
      sharedGroupIds: merged.sharedGroupIds,
      sharedUpperOrganizationIds: merged.sharedUpperOrganizationIds,
      sharedLowerOrganizationIds: merged.sharedLowerOrganizationIds,
      sharedDepartmentIds: merged.sharedDepartmentIds,
    });
    finalUpdates = { ...updates, ...share };
  }

  notes[idx] = { ...notes[idx], ...finalUpdates, updatedAt: new Date().toISOString() };
  save(notes);
}

export function deleteGraceNote(id: string): void {
  save(load().filter(n => n.id !== id));
}

/** 은혜기록 표시용 — 통독명 + 본문 */
export function formatReadingLabel(note: Pick<GraceNote, 'planName' | 'bibleReference' | 'day'>): string {
  const plan = note.planName?.trim();
  const ref = note.bibleReference?.trim();
  if (plan && ref) return `${plan}\n${ref}`;
  if (ref) return ref;
  if (plan && note.day) return `${plan} ${note.day}일차`;
  return plan ?? '성경통독 은혜기록';
}

// ─── 좋아요 · 댓글 · 기도 · 아멘 ─────────────────────────────────────────────

function loadMyLikes(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_LIKES);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveMyLikes(ids: Set<string>): void {
  try { localStorage.setItem(LS_LIKES, JSON.stringify([...ids])); } catch { /* ignore */ }
}

export function isGraceNoteLikedByMe(noteId: string): boolean {
  return loadMyLikes().has(noteId);
}

export function toggleGraceNoteLike(noteId: string): { liked: boolean; likeCount: number } {
  const notes = load();
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx < 0) return { liked: false, likeCount: 0 };
  const likes = loadMyLikes();
  const wasLiked = likes.has(noteId);
  if (wasLiked) {
    likes.delete(noteId);
    notes[idx].likeCount = Math.max(0, (notes[idx].likeCount ?? 0) - 1);
  } else {
    likes.add(noteId);
    notes[idx].likeCount = (notes[idx].likeCount ?? 0) + 1;
  }
  saveMyLikes(likes);
  save(notes);
  return { liked: !wasLiked, likeCount: notes[idx].likeCount ?? 0 };
}

export function addGraceNotePrayer(noteId: string, authorName: string): number {
  const notes = load();
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx < 0) return 0;
  const comment: GraceNoteComment = {
    id: `gnc-${Date.now()}`,
    authorName,
    content: '기도합니다',
    type: 'prayer',
    createdAt: new Date().toISOString(),
  };
  notes[idx].comments = [...(notes[idx].comments ?? []), comment];
  notes[idx].prayCount = (notes[idx].prayCount ?? 0) + 1;
  save(notes);
  return notes[idx].prayCount ?? 0;
}

export function addGraceNoteAmen(noteId: string, authorName: string): number {
  const notes = load();
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx < 0) return 0;
  const comment: GraceNoteComment = {
    id: `gnc-${Date.now()}`,
    authorName,
    content: '아멘',
    type: 'amen',
    createdAt: new Date().toISOString(),
  };
  notes[idx].comments = [...(notes[idx].comments ?? []), comment];
  notes[idx].amenCount = (notes[idx].amenCount ?? 0) + 1;
  save(notes);
  return notes[idx].amenCount ?? 0;
}

export function addGraceNoteComment(noteId: string, authorName: string, content: string): GraceNoteComment | null {
  const notes = load();
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx < 0 || !content.trim()) return null;
  const comment: GraceNoteComment = {
    id: `gnc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    authorName,
    content: content.trim(),
    type: 'comment',
    createdAt: new Date().toISOString(),
  };
  notes[idx].comments = [...(notes[idx].comments ?? []), comment];
  save(notes);
  return comment;
}

export function isDemoGraceNotesSeeded(): boolean {
  try { return localStorage.getItem(LS_DEMO_SEEDED) === DEMO_SEED_VERSION; } catch { return false; }
}

export function markDemoGraceNotesSeeded(): void {
  try { localStorage.setItem(LS_DEMO_SEEDED, DEMO_SEED_VERSION); } catch { /* ignore */ }
}

export function replaceAllGraceNotes(notes: GraceNote[]): void {
  save(notes.map(normalizeNote));
}

/** 성경 본문에서 책 이름 추출 (예: "창세기 1장" → "창세기") */
function extractBookNames(ref: string): string[] {
  const known = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야',
    '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야', '예레미야애가',
    '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국',
    '스바냐', '학개', '스가랴', '말라기', '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
    '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서',
    '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서',
    '히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서',
    '유다서', '요한계시록',
  ];
  const found: string[] = [];
  for (const book of known) {
    if (ref.includes(book)) found.push(book);
  }
  if (found.length === 0) {
    const generic = ref.match(/[가-힣]{2,}/g) ?? [];
    for (const g of generic) {
      if (!g.endsWith('장') && !g.endsWith('절') && g.length <= 6) found.push(g);
    }
  }
  return found;
}

/** 연속 기록 일수 (가장 최근 기록일부터 역순으로 계산) */
function calculateStreak(notes: GraceNote[]): number {
  if (notes.length === 0) return 0;
  const dates = [...new Set(notes.map(n => n.createdAt.slice(0, 10)))].sort((a, b) => b.localeCompare(a));
  let streak = 1;
  let current = new Date(dates[0] + 'T12:00:00');
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i] + 'T12:00:00');
    const diffDays = Math.round((current.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      streak++;
      current = prev;
    } else {
      break;
    }
  }
  return streak;
}

export function analyzeGraceNotes(notes: GraceNote[]) {
  const byPlan: Record<string, number> = {};
  const byBook: Record<string, number> = {};
  const last7 = notes.filter(n => (Date.now() - new Date(n.createdAt).getTime()) < 7 * 86_400_000);
  const byMonth: Record<string, number> = {};
  const now = new Date();
  const thisMonthKey = now.toISOString().slice(0, 7);
  const thisYearKey = now.getFullYear().toString();

  for (const n of notes) {
    const label = n.planName ?? n.sermonTitle ?? n.sourceTitle ?? '기타';
    byPlan[label] = (byPlan[label] ?? 0) + 1;
    const month = n.createdAt.slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
    const books = extractBookNames(n.bibleReference ?? n.memorableVerse ?? '');
    for (const b of books) byBook[b] = (byBook[b] ?? 0) + 1;
  }

  const topPlan = Object.entries(byPlan).sort((a, b) => b[1] - a[1])[0];
  const topBook = Object.entries(byBook).sort((a, b) => b[1] - a[1])[0];
  const topBooks = Object.entries(byBook)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    total: notes.length,
    last7Days: last7.length,
    thisMonth: notes.filter(n => n.createdAt.slice(0, 7) === thisMonthKey).length,
    thisYear: notes.filter(n => n.createdAt.slice(0, 4) === thisYearKey).length,
    streak: calculateStreak(notes),
    topPlan: topPlan ? topPlan[0] : null,
    topBook: topBook ? topBook[0] : null,
    topBooks,
    byMonth,
    readingCount: notes.filter(n => n.type === 'reading').length,
    sermonCount: notes.filter(n => n.type === 'sermon').length,
    personalCount: notes.filter(n => n.type === 'personal').length,
  };
}
