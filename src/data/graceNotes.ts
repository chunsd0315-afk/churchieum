import { applyGraceShareValidation, canPastorViewSharedGraceNote, getCurrentUserFromStorage, splitOrganizationShareIds, composeSharedGroupIds } from '../services/graceNoteShareScope';
import type { AppUser } from '../services/permissions';
import { migrateVisibility, isLegacyPublic, type VisibilityType } from '../types/sharedContent';

const LS_KEY = 'graceNotesV2';
const LS_DEMO_SEEDED = 'graceNotesV2_demo_seeded_v5';
const LS_GRACE_SEED_FORMAT = 'churchieum_grace_seed_version';
const LS_GRACE_SEED_COPY = 'churchieum_grace_seed_copy_version';
const LS_LIKES = 'graceNotes_likes_by_me';
export const DEMO_SEED_VERSION = 'v7';
export const GRACE_SEED_FORMAT_VERSION = '7';
export const GRACE_SEED_COPY_VERSION = '2';
export const GRACE_COMMENT_MAX_LENGTH = 500;

export type GraceNoteType = 'reading' | 'sermon' | 'prayer';

/** 레거시 personal·free → prayer */
export function normalizeGraceNoteType(raw: unknown): GraceNoteType {
  const s = String(raw ?? '').toLowerCase().replace(/[\s-]/g, '_');
  if (s === 'reading' || s === 'bible' || s === 'bible_reading' || s === 'biblereading') {
    return 'reading';
  }
  if (s === 'sermon' || s === 'preaching' || s === 'message') return 'sermon';
  return 'prayer';
}

/** 공통 VisibilityType — 레거시 pastor/group/public 은 normalize 시 변환 */
export type GraceNoteVisibility = VisibilityType;

/** @deprecated 읽기 호환용 */
export type GraceNoteVisibilityLegacy =
  | VisibilityType
  | 'pastor'
  | 'group'
  | 'public';

export type GraceNoteCommentType = 'comment' | 'prayer' | 'amen';

export type GraceNoteComment = {
  id: string;
  authorName: string;
  /** 댓글 작성자 userId — 본인 삭제 판별·표시용 (레거시 없음) */
  authorId?: string;
  /** 스냅샷 직분 (authorId 조회 실패 시) */
  authorPosition?: string;
  /** 퇴사·이동 등 — 현재 사용자 없을 때 표시용 */
  authorSnapshot?: {
    name?: string;
    position?: string;
    organizationPath?: string;
    departmentName?: string;
  };
  content: string;
  type: GraceNoteCommentType;
  createdAt: string;
  updatedAt?: string;
};

/** 공유 당시 교역자 스냅샷 (퇴사·조직 이동 후에도 표시용) */
export type SharedPastorSnapshot = {
  pastorId: string;
  name: string;
  position?: string;
  organizationName?: string;
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
  /** 공유 당시 교역자 이름·직분·조직 스냅샷 */
  sharedPastorSnapshots?: SharedPastorSnapshot[];
  /** 조직/부서 공유 — 전체 선택 (레거시) */
  sharedGroupAll?: boolean;
  /** 조직/부서 공유 — 통합 ID (상위·하위·부서, 레거시 호환) */
  sharedGroupIds?: string[];
  /** 공통 필드 — sharedGroupIds 와 동기화 */
  sharedOrganizationIds?: string[];
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
  /**
   * 댓글 허용 여부.
   * 미설정·레거시(commentsAllowed)는 true.
   * 나만 보기에서는 UI/정책상 false 로 저장·표시.
   */
  allowComments?: boolean;
  createdAt: string;
  updatedAt: string;
  /** seed·demo 식별 — 실제 사용자 기록과 구분 */
  isSeed?: boolean;
  isDemo?: boolean;
  source?: 'seed' | 'user' | 'migrated_prayer';
  /** 기도 메뉴 통합 — 원본 prayer.id */
  migratedFromPrayerId?: string;
};

export type GraceNoteInput = Omit<GraceNote, 'id' | 'createdAt' | 'updatedAt'>;

/** allowComments 안전 해석 — 레거시 commentsAllowed 호환 */
export function resolveAllowComments(
  note: Partial<Pick<GraceNote, 'allowComments'>> & { commentsAllowed?: boolean },
): boolean {
  if (typeof note.allowComments === 'boolean') return note.allowComments;
  if (typeof note.commentsAllowed === 'boolean') return note.commentsAllowed;
  return true;
}

function normalizeNote(n: GraceNote): GraceNote {
  const rawVis = n.visibility as string | undefined;
  const visibility = migrateVisibility(rawVis);
  const type = normalizeGraceNoteType(n.type);
  const split = splitOrganizationShareIds({
    sharedGroupIds: n.sharedGroupIds ?? n.sharedOrganizationIds,
    sharedUpperOrganizationIds: n.sharedUpperOrganizationIds,
    sharedLowerOrganizationIds: n.sharedLowerOrganizationIds,
    sharedDepartmentIds: n.sharedDepartmentIds,
  });
  const composed = composeSharedGroupIds(split.upper, split.lower, split.departments);
  const sharedGroupAll = n.sharedGroupAll || isLegacyPublic(rawVis) || false;
  const legacy = n as GraceNote & { commentsAllowed?: boolean };
  return {
    ...n,
    type,
    visibility,
    sharedPastorIds: Array.isArray(n.sharedPastorIds) ? n.sharedPastorIds : [],
    sharedPastorSnapshots: Array.isArray(n.sharedPastorSnapshots) ? n.sharedPastorSnapshots : [],
    sharedPastorAll: n.sharedPastorAll ?? false,
    sharedGroupAll,
    sharedUpperOrganizationIds: split.upper,
    sharedLowerOrganizationIds: split.lower,
    sharedDepartmentIds: split.departments,
    sharedGroupIds: composed,
    sharedOrganizationIds: composed,
    likeCount: n.likeCount ?? 0,
    amenCount: n.amenCount ?? 0,
    prayCount: n.prayCount ?? 0,
    comments: n.comments ?? [],
    allowComments: resolveAllowComments(legacy),
    isFavorite: n.isFavorite ?? false,
    isSeed: n.isSeed,
    isDemo: n.isDemo,
    source: n.source,
  };
}

function needsGraceTypeMigration(notes: GraceNote[]): boolean {
  return notes.some(n => {
    const raw = String(n.type ?? '').toLowerCase();
    return raw === 'personal' || raw === 'free';
  });
}

function load(): GraceNote[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GraceNote[];
      const notes = parsed.map(normalizeNote);
      if (needsGraceTypeMigration(parsed)) save(notes);
      return notes;
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

/** @deprecated 은혜와 기도 UI에서 즐겨찾기 제거 — 데이터 호환용으로만 유지 */
export function getFavoriteGraceNotes(): GraceNote[] {
  return load().filter(n => n.isFavorite).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 현재 사용자가 직접 작성한 최근 은혜기록
 * (공유받은 기록·타인 기록 제외 — 메인 "최근 은혜기록"용)
 * @param currentUserId GraceNote.userId (작성자 ID)
 */
export function getMyRecentGraceNotes(
  currentUserId: string | undefined | null,
  notes?: GraceNote[],
  limit = 5,
): GraceNote[] {
  if (!currentUserId) return [];
  const source = notes ?? load();
  return source
    .filter(n => n.userId === currentUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, limit));
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
    updates.sharedPastorSnapshots !== undefined ||
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

/** @deprecated UI에서 제거됨 — 기존 데이터 호환용으로만 유지. 신규 반응은 toggleGraceNoteLike 사용 */
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

/** @deprecated UI에서 제거됨 — 기존 데이터 호환용으로만 유지. 신규 반응은 toggleGraceNoteLike 사용 */
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

/** 댓글 허용 여부 — 레거시(필드 없음)는 허용 */
export function isGraceNoteCommentsAllowed(
  note: Partial<Pick<GraceNote, 'allowComments'>> & { commentsAllowed?: boolean },
): boolean {
  return resolveAllowComments(note);
}

export type AddGraceNoteCommentOptions = {
  authorId?: string;
  /** 조회 가능 여부 — false 이면 저장하지 않음 */
  canView?: boolean;
};

export function addGraceNoteComment(
  noteId: string,
  authorName: string,
  content: string,
  options?: AddGraceNoteCommentOptions,
): GraceNoteComment | null {
  const notes = load();
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx < 0) return null;
  if (options?.canView === false) return null;

  const note = notes[idx];
  if (migrateVisibility(note.visibility) === 'private') return null;
  if (!resolveAllowComments(note)) return null;

  const trimmed = content.trim().slice(0, GRACE_COMMENT_MAX_LENGTH);
  if (!trimmed) return null;

  const now = new Date().toISOString();
  const comment: GraceNoteComment = {
    id: `gnc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    authorName,
    authorId: options?.authorId,
    content: trimmed,
    type: 'comment',
    createdAt: now,
    updatedAt: now,
  };
  notes[idx].comments = [...(notes[idx].comments ?? []), comment];
  save(notes);
  return comment;
}

export function deleteGraceNoteComment(
  noteId: string,
  commentId: string,
  actor: { userId?: string; isAdmin?: boolean },
): boolean {
  const notes = load();
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx < 0) return false;
  const list = notes[idx].comments ?? [];
  const target = list.find(c => c.id === commentId);
  if (!target) return false;
  const resolvedAuthorId = target.authorId;
  const isOwner = Boolean(actor.userId && resolvedAuthorId && resolvedAuthorId === actor.userId);
  if (!isOwner && !actor.isAdmin) return false;
  notes[idx].comments = list.filter(c => c.id !== commentId);
  save(notes);
  return true;
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

/** seed·demo 은혜기록 여부 (실제 사용자 작성 기록은 제외) */
export function isSeedGraceNote(
  note: Pick<GraceNote, 'id' | 'isSeed' | 'isDemo' | 'source'>,
): boolean {
  if (note.isSeed === true || note.isDemo === true || note.source === 'seed') return true;
  const id = String(note.id ?? '');
  return (
    id.startsWith('gn-demo-')
    || id.startsWith('gn-fix-')
    || id.startsWith('gn-seed-')
  );
}

export function partitionGraceNotes(notes: GraceNote[]): {
  seed: GraceNote[];
  user: GraceNote[];
} {
  const seed: GraceNote[] = [];
  const user: GraceNote[] = [];
  for (const n of notes) {
    if (isSeedGraceNote(n)) seed.push(n);
    else user.push(n);
  }
  return { seed, user };
}

/** seed 기록만 교체하고 사용자 작성 기록은 유지 */
export function replaceSeedGraceNotes(seedNotes: GraceNote[]): void {
  const { user } = partitionGraceNotes(load());
  const marked = seedNotes.map(n => normalizeNote({
    ...n,
    isSeed: true,
    isDemo: true,
    source: 'seed',
  }));
  save([...user, ...marked]);
}

export function getGraceSeedFormatVersion(): string | null {
  try { return localStorage.getItem(LS_GRACE_SEED_FORMAT); } catch { return null; }
}

export function setGraceSeedFormatVersion(version: string): void {
  try { localStorage.setItem(LS_GRACE_SEED_FORMAT, version); } catch { /* ignore */ }
}

export function getGraceSeedCopyVersion(): string | null {
  try { return localStorage.getItem(LS_GRACE_SEED_COPY); } catch { return null; }
}

export function setGraceSeedCopyVersion(version: string): void {
  try { localStorage.setItem(LS_GRACE_SEED_COPY, version); } catch { /* ignore */ }
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
    prayerCount: notes.filter(n => n.type === 'prayer').length,
  };
}
