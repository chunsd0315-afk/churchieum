import type { GraceNote, GraceNoteType, GraceNoteVisibility } from '../data/graceNotes';
import {
  getAllGraceNotes,
  partitionGraceNotes,
  replaceSeedGraceNotes,
  setGraceSeedFormatVersion,
  GRACE_SEED_FORMAT_VERSION,
  getGraceSeedFormatVersion,
  markDemoGraceNotesSeeded,
  normalizeGraceNoteType,
} from '../data/graceNotes';
import { migrateVisibility } from '../types/sharedContent';
import {
  composeSharedGroupIds,
  uniqueIds,
} from './graceNoteShareScope';
import {
  buildGraceContent,
  DEFAULT_TITLE_BY_TYPE,
  titleFromContent,
  titlesForType,
} from '../data/graceNoteSeedTemplates';
import { EMPTY_GRACE_LEGACY_FIELDS } from './graceNoteRelatedDisplay';

export type GraceSeedValidationReport = {
  total: number;
  seedCount: number;
  userCount: number;
  missingTitle: number;
  missingContent: number;
  missingAuthorId: number;
  invalidType: number;
  invalidVisibility: number;
  invalidSharedPastorIds: number;
  invalidSharedOrganizationIds: number;
  invalidIsFavorite: number;
  duplicateIds: number;
  byType: Record<string, number>;
  byVisibility: Record<string, number>;
  byAuthor: Record<string, number>;
  favoriteCount: number;
  passed: boolean;
};

const VALID_TYPES = new Set<GraceNoteType>(['reading', 'sermon', 'prayer']);
const VALID_VISIBILITY = new Set<GraceNoteVisibility>([
  'private',
  'pastor_share',
  'organization_share',
]);

function normalizeRecordType(raw: unknown): GraceNoteType {
  return normalizeGraceNoteType(raw);
}

function normalizeVisibility(raw: unknown): GraceNoteVisibility {
  const s = String(raw ?? '').toLowerCase();
  if (
    s === 'private'
    || s === 'only_me'
    || s === 'myself'
    || s.includes('나만')
  ) return 'private';
  if (
    s === 'pastor_share'
    || s === 'pastor'
    || s === 'clergy_share'
    || s.includes('교역자')
  ) return 'pastor_share';
  if (
    s === 'organization_share'
    || s === 'organization'
    || s === 'group_share'
    || s === 'group'
    || s === 'public'
    || s.includes('교구')
    || s.includes('부서')
  ) return 'organization_share';
  return 'private';
}

function pickTitle(note: Partial<GraceNote>, type: GraceNoteType, index: number): string {
  const candidates = [
    note.graceTitle,
    (note as { title?: string }).title,
    (note as { subject?: string }).subject,
    (note as { recordTitle?: string }).recordTitle,
    note.sermonTitle,
    note.bibleReference,
    note.memorableVerse,
  ];
  for (const c of candidates) {
    const t = c?.trim();
    if (t && t.length > 0 && !/^제목\s*없음/i.test(t) && !/^테스트\s*\d/i.test(t)) {
      return t.length > 40 ? t.slice(0, 38) + '…' : t;
    }
  }
  const content = note.graceContent?.trim()
    ?? (note as { content?: string }).content?.trim()
    ?? (note as { body?: string }).body?.trim();
  if (content) return titleFromContent(content, type);
  const pool = titlesForType(type);
  return pool[index % pool.length] ?? DEFAULT_TITLE_BY_TYPE[type];
}

function pickContent(note: Partial<GraceNote>, type: GraceNoteType, index: number): string {
  const candidates = [
    note.graceContent,
    (note as { content?: string }).content,
    (note as { body?: string }).body,
    (note as { note?: string }).note,
    (note as { memo?: string }).memo,
    (note as { reflection?: string }).reflection,
  ];
  for (const c of candidates) {
    const t = c?.trim();
    if (t && t.length >= 10) return t;
  }
  return buildGraceContent(index, index + 7);
}

function normalizeShareArrays(
  note: Partial<GraceNote>,
  visibility: GraceNoteVisibility,
): Pick<
  GraceNote,
  | 'sharedPastorIds'
  | 'sharedOrganizationIds'
  | 'sharedGroupIds'
  | 'sharedUpperOrganizationIds'
  | 'sharedLowerOrganizationIds'
  | 'sharedDepartmentIds'
  | 'sharedPastorAll'
  | 'sharedGroupAll'
> {
  const pastorIds = Array.isArray(note.sharedPastorIds)
    ? uniqueIds(note.sharedPastorIds.map(String))
    : [];
  const orgIds = Array.isArray(note.sharedOrganizationIds)
    ? uniqueIds(note.sharedOrganizationIds.map(String))
    : Array.isArray(note.sharedGroupIds)
      ? uniqueIds(note.sharedGroupIds.map(String))
      : uniqueIds([
        ...(note.sharedUpperOrganizationIds ?? []),
        ...(note.sharedLowerOrganizationIds ?? []),
        ...(note.sharedDepartmentIds ?? []),
      ]);

  if (visibility === 'private') {
    return {
      sharedPastorIds: [],
      sharedOrganizationIds: [],
      sharedGroupIds: [],
      sharedUpperOrganizationIds: [],
      sharedLowerOrganizationIds: [],
      sharedDepartmentIds: [],
      sharedPastorAll: false,
      sharedGroupAll: false,
    };
  }

  if (visibility === 'pastor_share') {
    return {
      sharedPastorIds: pastorIds,
      sharedOrganizationIds: [],
      sharedGroupIds: [],
      sharedUpperOrganizationIds: [],
      sharedLowerOrganizationIds: [],
      sharedDepartmentIds: [],
      sharedPastorAll: note.sharedPastorAll ?? false,
      sharedGroupAll: false,
    };
  }

  const upper = note.sharedUpperOrganizationIds ?? orgIds.filter(id => id.startsWith('d'));
  const lower = note.sharedLowerOrganizationIds ?? orgIds.filter(id => id.startsWith('z'));
  const departments = note.sharedDepartmentIds ?? orgIds.filter(id => id.startsWith('dep'));
  const composed = composeSharedGroupIds(upper, lower, departments);

  return {
    sharedPastorIds: [],
    sharedOrganizationIds: composed,
    sharedGroupIds: composed,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedPastorAll: false,
    sharedGroupAll: note.sharedGroupAll ?? false,
  };
}

function normalizeFavorite(note: Partial<GraceNote>, _index: number): boolean {
  if (typeof note.isFavorite === 'boolean') return note.isFavorite;
  const legacy = (note as { favorite?: boolean }).favorite
    ?? (note as { bookmarked?: boolean }).bookmarked
    ?? (note as { isBookmarked?: boolean }).isBookmarked;
  if (typeof legacy === 'boolean') return legacy;
  return false;
}

/** 단일 seed 기록을 통일 형식으로 정규화 */
export function normalizeSeedGraceRecord(note: GraceNote, index = 0): GraceNote {
  const type = normalizeRecordType(note.type ?? (note as { recordType?: string }).recordType);
  const visibility = normalizeVisibility(note.visibility);
  const graceContent = pickContent(note, type, index);
  const graceTitle = pickTitle({ ...note, graceContent }, type, index);
  const userId =
    note.userId
    ?? (note as { authorId?: string }).authorId
    ?? (note as { memberId?: string }).memberId
    ?? (note as { writerId?: string }).writerId;

  const createdAt = note.createdAt && !Number.isNaN(Date.parse(note.createdAt))
    ? note.createdAt
    : new Date().toISOString();
  let updatedAt = note.updatedAt && !Number.isNaN(Date.parse(note.updatedAt))
    ? note.updatedAt
    : createdAt;
  if (updatedAt < createdAt) updatedAt = createdAt;

  const share = normalizeShareArrays(note, visibility);
  const isFavorite = normalizeFavorite(note, index);

  const relatedReading =
    (note as { relatedBibleReadingId?: string | null }).relatedBibleReadingId
    ?? (type === 'reading' ? note.sourceId : null);
  const relatedSermon =
    (note as { relatedSermonId?: string | null }).relatedSermonId
    ?? (type === 'sermon' ? note.sourceId : null);

  return {
    ...note,
    id: String(note.id),
    userId,
    authorName: note.authorName,
    authorRole: note.authorRole,
    type,
    visibility: migrateVisibility(visibility),
    graceTitle,
    graceContent,
    ...EMPTY_GRACE_LEGACY_FIELDS,
    isFavorite,
    ...share,
    sourceId: type === 'reading'
      ? (relatedReading ?? note.sourceId)
      : type === 'sermon'
        ? (relatedSermon ?? note.sourceId)
        : undefined,
    createdAt,
    updatedAt,
    isSeed: true,
    isDemo: true,
    source: 'seed',
  };
}

export function validateGraceSeedRecords(notes: GraceNote[]): GraceSeedValidationReport {
  const { seed, user } = partitionGraceNotes(notes);
  const ids = new Set<string>();
  let duplicateIds = 0;
  let missingTitle = 0;
  let missingContent = 0;
  let missingAuthorId = 0;
  let invalidType = 0;
  let invalidVisibility = 0;
  let invalidSharedPastorIds = 0;
  let invalidSharedOrganizationIds = 0;
  let invalidIsFavorite = 0;
  let favoriteCount = 0;
  const byType: Record<string, number> = {};
  const byVisibility: Record<string, number> = {};
  const byAuthor: Record<string, number> = {};

  for (const n of seed) {
    if (ids.has(n.id)) duplicateIds += 1;
    ids.add(n.id);

    const title = n.graceTitle?.trim();
    if (!title) missingTitle += 1;

    const content = n.graceContent?.trim();
    if (!content || content.length < 10) missingContent += 1;

    if (!n.userId?.trim()) missingAuthorId += 1;

    if (!VALID_TYPES.has(n.type)) invalidType += 1;
    else byType[n.type] = (byType[n.type] ?? 0) + 1;

    const vis = migrateVisibility(n.visibility);
    if (!VALID_VISIBILITY.has(vis)) invalidVisibility += 1;
    else byVisibility[vis] = (byVisibility[vis] ?? 0) + 1;

    if (!Array.isArray(n.sharedPastorIds)) invalidSharedPastorIds += 1;
    if (!Array.isArray(n.sharedOrganizationIds) && !Array.isArray(n.sharedGroupIds)) {
      invalidSharedOrganizationIds += 1;
    }

    if (typeof n.isFavorite !== 'boolean') invalidIsFavorite += 1;
    else if (n.isFavorite) favoriteCount += 1;

    const authorKey = n.userId ?? 'unknown';
    byAuthor[authorKey] = (byAuthor[authorKey] ?? 0) + 1;
  }

  const passed =
    missingTitle === 0
    && missingContent === 0
    && missingAuthorId === 0
    && invalidType === 0
    && invalidVisibility === 0
    && invalidSharedPastorIds === 0
    && invalidSharedOrganizationIds === 0
    && invalidIsFavorite === 0
    && duplicateIds === 0;

  return {
    total: notes.length,
    seedCount: seed.length,
    userCount: user.length,
    missingTitle,
    missingContent,
    missingAuthorId,
    invalidType,
    invalidVisibility,
    invalidSharedPastorIds,
    invalidSharedOrganizationIds,
    invalidIsFavorite,
    duplicateIds,
    byType,
    byVisibility,
    byAuthor,
    favoriteCount,
    passed,
  };
}

/** localStorage seed 기록만 통일 형식으로 마이그레이션 */
export function migrateDemoGraceRecordsToUnifiedFormat(
  regenerate?: () => GraceNote[],
): GraceSeedValidationReport {
  const all = getAllGraceNotes();
  const { user } = partitionGraceNotes(all);

  const normalized = regenerate
    ? regenerate()
    : partitionGraceNotes(all).seed.map((n, i) => normalizeSeedGraceRecord(n, i));

  replaceSeedGraceNotes(normalized);
  markDemoGraceNotesSeeded();
  setGraceSeedFormatVersion(GRACE_SEED_FORMAT_VERSION);

  return validateGraceSeedRecords([...user, ...normalized]);
}

export function isGraceSeedFormatCurrent(): boolean {
  return getGraceSeedFormatVersion() === GRACE_SEED_FORMAT_VERSION;
}

export function formatGraceSeedValidationReport(r: GraceSeedValidationReport): string {
  const types = Object.entries(r.byType).map(([k, v]) => `${k}: ${v}`).join(', ');
  const vis = Object.entries(r.byVisibility).map(([k, v]) => `${k}: ${v}`).join(', ');
  return [
    `전체 ${r.total}건 (seed ${r.seedCount} / 사용자 ${r.userCount})`,
    `유형 — ${types || '없음'}`,
    `공개범위 — ${vis || '없음'}`,
    `즐겨찾기 ${r.favoriteCount}건`,
    `검증 — ${r.passed ? '통과' : '실패'}`,
  ].join('\n');
}
