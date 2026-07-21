import type { AppUser } from './permissions';
import type {
  Prayer,
  PrayerAttachment,
  PrayerAuthorRole,
  PrayerOrganizationScope,
} from '../types/prayer';
import { CHURCH_WIDE_SCOPE } from '../types/prayer';
import { migrateVisibility, uniqueIds } from '../types/sharedContent';
import { splitOrganizationShareIds } from './graceNoteShareScope';
import { normalizePrayerAttachment } from './prayerAttachmentHelpers';
import {
  hydratePrayersAttachments,
  migrateInlineAttachmentsFromPrayers,
  replaceAttachmentsForPrayer,
  deleteAttachmentsForPrayer,
} from './prayerAttachmentStorage';
import { deleteCommentsForPrayer } from './prayerCommentStorage';
import { deleteHistoryForPrayer, recordPrayerHistory } from './prayerHistoryStorage';
import { deleteNotificationsForPrayer } from './prayerNotificationStorage';
import { notifyPrayerCreated, notifyPrayerAnswered } from './prayerNotificationHelpers';

export type PrayerActor = { actorId: string; actorName: string };

function actorFromPrayer(prayer: Prayer, actor?: PrayerActor): PrayerActor {
  return actor ?? { actorId: prayer.authorId, actorName: prayer.authorName };
}

function isSharedVisibility(visibility: Prayer['visibility']): boolean {
  const v = migrateVisibility(visibility);
  return v === 'pastor_share' || v === 'organization_share';
}

/**
 * 공개범위별 공유 대상 필드 정규화
 * - pastor_share: sharedPastorIds 유지, sharedOrganizationIds 비움
 * - organization_share: sharedOrganizationIds 필수, organizationScope를 그 값으로 동기화
 * - private: 공유 필드 모두 비움
 */
function syncShareFields(prayer: Prayer): Prayer {
  const visibility = migrateVisibility(prayer.visibility);

  if (visibility === 'organization_share') {
    const sharedOrganizationIds = uniqueIds(prayer.sharedOrganizationIds);
    const split = splitOrganizationShareIds({ sharedGroupIds: sharedOrganizationIds });
    return {
      ...prayer,
      visibility,
      sharedPastorIds: [],
      sharedOrganizationIds,
      organizationScope: {
        districtIds: split.upper,
        groupIds: split.lower,
        departmentIds: split.departments,
      },
    };
  }

  if (visibility === 'pastor_share') {
    return {
      ...prayer,
      visibility,
      sharedPastorIds: uniqueIds(prayer.sharedPastorIds),
      sharedOrganizationIds: [],
    };
  }

  return {
    ...prayer,
    visibility,
    sharedPastorIds: [],
    sharedOrganizationIds: [],
  };
}

const EDIT_HISTORY_KEYS = [
  'title',
  'content',
  'visibility',
  'organizationScope',
  'sharedPastorIds',
  'sharedOrganizationIds',
] as const;

function hasMeaningfulEdit(before: Prayer, after: Prayer, updates: Partial<Prayer>): boolean {
  return EDIT_HISTORY_KEYS.some(
    key => key in updates && JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
}

/** localStorage 키 — 기도제목 목록 */
export const PRAYERS_STORAGE_KEY = 'churchieum_prayers';
const LS_DEMO_SEEDED = 'churchieum_prayers_demo_seeded_v1';
const DEMO_SEED_VERSION = 'v1';
const LEGACY_PRAYER_KEYS = ['churchieum_prayers_v1'];

// ─── Seed ─────────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const SEED: Prayer[] = [
  {
    id: 'pr-1',
    churchId: 'demo',
    authorId: 'demo-member60',
    authorName: '천성대',
    authorRole: 'member',
    title: '가족의 건강',
    content: '어머니의 무릎 수술이 잘 회복되도록 기도합니다. 빠른 회복과 일상 복귀를 위해 기도드립니다.',
    visibility: 'private',
    status: 'praying',
    organizationScope: CHURCH_WIDE_SCOPE,
    sharedPastorIds: [],
    sharedOrganizationIds: [],
    attachments: [],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'pr-2',
    churchId: 'demo',
    authorId: 'demo-member60',
    authorName: '천성대',
    authorRole: 'member',
    title: '직장에서의 지혜',
    content: '새 프로젝트를 진행하는 데 있어 하나님의 지혜를 구합니다. 팀원들과의 협력이 잘 이루어지게 해주세요.',
    visibility: 'organization_share',
    status: 'praying',
    organizationScope: { districtIds: ['d1'], groupIds: [], departmentIds: [] },
    sharedPastorIds: [],
    sharedOrganizationIds: ['d1'],
    attachments: [],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'pr-3',
    churchId: 'demo',
    authorId: 'demo-member60',
    authorName: '천성대',
    authorRole: 'member',
    title: '믿음 성장',
    content: '말씀 묵상과 기도 생활이 더욱 깊어지도록 기도합니다. 주님과의 친밀함이 날마다 더해지게 하소서.',
    visibility: 'pastor_share',
    status: 'answered',
    organizationScope: CHURCH_WIDE_SCOPE,
    sharedPastorIds: ['cl1'],
    sharedOrganizationIds: [],
    attachments: [],
    answeredAt: daysAgo(2),
    answerContent: '말씀과 기도 가운데 믿음이 자라고 있습니다.',
    gratitudeTestimony: 'QT 모임을 통해 말씀이 더 깊어지고 있습니다. 주님께 감사드립니다.',
    gratitudeTestimonyAt: daysAgo(0),
    createdAt: daysAgo(11),
    updatedAt: daysAgo(0),
  },
  {
    id: 'pr-4',
    churchId: 'demo',
    authorId: 'demo-pastor02',
    authorName: '이변우',
    authorRole: 'pastor',
    title: '청년부 영적 각성',
    content: '청년부가 말씀과 기도로 다시 일어나게 하소서. 다음 세대가 교회의 미래가 되게 하옵소서.',
    visibility: 'pastor_share',
    status: 'praying',
    organizationScope: { districtIds: ['d2'], groupIds: [], departmentIds: [] },
    // 담당 교역자 미지정 — 조직범위(배정) 기반 레거시 조회 fallback 예시
    sharedPastorIds: [],
    sharedOrganizationIds: [],
    attachments: [],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'pr-5',
    churchId: 'demo',
    authorId: 'demo-pastor01',
    authorName: '정재명',
    authorRole: 'admin',
    title: '교회 부흥',
    content: '올해 교회가 말씀과 기도로 부흥하게 하소서. 잃어버린 영혼들이 돌아오게 하시고, 성도들이 믿음 안에서 성장하게 하소서.',
    visibility: 'organization_share',
    status: 'praying',
    organizationScope: CHURCH_WIDE_SCOPE,
    sharedPastorIds: [],
    sharedOrganizationIds: [],
    attachments: [],
    starred: true,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'pr-6',
    churchId: 'demo',
    authorId: 'demo-member60',
    authorName: '천성대',
    authorRole: 'member',
    title: '수능을 앞둔 조카',
    content: '조카가 수능을 앞두고 있습니다. 지혜와 평안을 주시고, 하나님의 인도하심 가운데 좋은 결과가 있게 해주세요.',
    visibility: 'organization_share',
    status: 'praying',
    organizationScope: {
      districtIds: ['d-youth'],
      groupIds: ['z-y1'],
      departmentIds: ['dep-y-nf', 'dep-y-ws'],
    },
    sharedPastorIds: [],
    sharedOrganizationIds: ['d-youth', 'z-y1', 'dep-y-nf', 'dep-y-ws'],
    attachments: [],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function uid() {
  return `pr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeOrganizationScope(raw: unknown): PrayerOrganizationScope {
  if (!raw || typeof raw !== 'object') return CHURCH_WIDE_SCOPE;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.districtIds)) {
    return {
      districtIds: o.districtIds as string[],
      groupIds: Array.isArray(o.groupIds) ? (o.groupIds as string[]) : [],
      departmentIds: Array.isArray(o.departmentIds) ? (o.departmentIds as string[]) : [],
    };
  }
  // legacy { type, id }
  const type = o.type as string | undefined;
  const id = o.id as string | undefined;
  if (type === 'level1' && id) return { districtIds: [id], groupIds: [], departmentIds: [] };
  if (type === 'level2' && id) return { districtIds: [], groupIds: [id], departmentIds: [] };
  if (type === 'department' && id) return { districtIds: [], groupIds: [], departmentIds: [id] };
  return CHURCH_WIDE_SCOPE;
}

function normalizeAttachments(raw: unknown): PrayerAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePrayerAttachment).filter((a): a is PrayerAttachment => a !== null);
}

/**
 * 저장값 정규화 — migrateVisibility로 레거시 값 변환 + 공유 대상 필드 채움
 * sharedOrganizationIds가 없으면(구버전 데이터) organizationScope에서 파생
 */
function normalizePrayerRecord(p: Prayer): Prayer {
  const organizationScope = normalizeOrganizationScope(p.organizationScope);
  const visibility = migrateVisibility(p.visibility);
  const sharedPastorIds = uniqueIds(p.sharedPastorIds);
  let sharedOrganizationIds = uniqueIds(p.sharedOrganizationIds);
  if (sharedOrganizationIds.length === 0 && visibility === 'organization_share') {
    sharedOrganizationIds = uniqueIds([
      ...organizationScope.districtIds,
      ...organizationScope.groupIds,
      ...organizationScope.departmentIds,
    ]);
  }
  return {
    ...p,
    visibility,
    organizationScope,
    sharedPastorIds,
    sharedOrganizationIds,
    attachments: normalizeAttachments(p.attachments),
  };
}

function readPrayersRaw(): string | null {
  const current = localStorage.getItem(PRAYERS_STORAGE_KEY);
  if (current) return current;
  for (const legacy of LEGACY_PRAYER_KEYS) {
    const old = localStorage.getItem(legacy);
    if (old) {
      try {
        localStorage.setItem(PRAYERS_STORAGE_KEY, old);
      } catch { /* ignore */ }
      return old;
    }
  }
  return null;
}

function load(): Prayer[] {
  try {
    const raw = readPrayersRaw();
    if (raw) {
      const parsed = JSON.parse(raw) as Prayer[];
      const normalized = parsed.map(normalizePrayerRecord);
      migrateInlineAttachmentsFromPrayers(normalized);
      return hydratePrayersAttachments(
        normalized.map(p => ({ ...p, attachments: [] })),
      );
    }
  } catch { /* ignore */ }
  if (isDemoPrayersSeeded()) {
    return [];
  }
  try {
    localStorage.setItem(
      PRAYERS_STORAGE_KEY,
      JSON.stringify(SEED.map(p => ({ ...p, attachments: [] }))),
    );
  } catch { /* ignore */ }
  return hydratePrayersAttachments(SEED);
}

function save(list: Prayer[]) {
  try {
    for (const p of list) {
      replaceAttachmentsForPrayer(p.id, p.attachments ?? []);
    }
    const slim = list.map(p => ({ ...p, attachments: [] }));
    localStorage.setItem(PRAYERS_STORAGE_KEY, JSON.stringify(slim));
  } catch {
    const slim = list.map(p => ({ ...p, attachments: [] }));
    localStorage.setItem(PRAYERS_STORAGE_KEY, JSON.stringify(slim));
  }
}

export function getAllPrayers(): Prayer[] {
  return load()
    .filter(p => !p.deleted)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPrayerById(id: string): Prayer | undefined {
  return load().find(p => p.id === id && !p.deleted);
}

export function addPrayer(
  data: Omit<Prayer, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>,
): Prayer {
  const list = load();
  const ts = new Date().toISOString();
  const prayer: Prayer = syncShareFields({
    ...data,
    id: uid(),
    deleted: false,
    createdAt: ts,
    updatedAt: ts,
  });
  save([prayer, ...list]);
  notifyPrayerCreated(prayer);
  const actor = actorFromPrayer(prayer);
  recordPrayerHistory(prayer.id, 'created', actor);
  if (isSharedVisibility(prayer.visibility)) {
    recordPrayerHistory(prayer.id, 'shared', actor, { visibility: prayer.visibility });
  }
  return prayer;
}

export function updatePrayer(
  id: string,
  updates: Partial<Prayer>,
  actor?: PrayerActor,
): Prayer | null {
  const list = load();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return null;
  const before = list[idx];
  const hasShareUpdate =
    'visibility' in updates ||
    'sharedPastorIds' in updates ||
    'sharedOrganizationIds' in updates ||
    'organizationScope' in updates;
  const merged: Prayer = {
    ...before,
    ...updates,
    id: before.id,
    updatedAt: new Date().toISOString(),
  };
  const updated: Prayer = hasShareUpdate ? syncShareFields(merged) : merged;
  list[idx] = updated;
  save(list);

  if (!updates.deleted) {
    const who = actorFromPrayer(updated, actor);
    if (hasMeaningfulEdit(before, updated, updates)) {
      recordPrayerHistory(id, 'edited', who);
    }
    if (
      before.visibility === 'private' &&
      isSharedVisibility(updated.visibility) &&
      before.visibility !== updated.visibility
    ) {
      recordPrayerHistory(id, 'shared', who, { visibility: updated.visibility });
    }
  }

  return updated;
}

export function markPrayerAnswered(
  id: string,
  answerContent?: string,
  actor?: PrayerActor,
): Prayer | null {
  const ts = new Date().toISOString();
  const before = getPrayerById(id);
  const updated = updatePrayer(id, {
    status: 'answered',
    answeredAt: ts,
    answerContent,
  });
  if (updated) {
    notifyPrayerAnswered(updated);
    if (before?.status !== 'answered') {
      recordPrayerHistory(id, 'answered', actorFromPrayer(updated, actor));
    }
  }
  return updated;
}

export function submitGratitudeTestimony(
  id: string,
  content: string,
  actor?: PrayerActor,
): Prayer | null {
  const prayer = getPrayerById(id);
  if (!prayer || prayer.status !== 'answered') return null;
  const text = content.trim();
  if (!text) return null;

  const isFirst = !prayer.gratitudeTestimony;
  const ts = new Date().toISOString();
  const updated = updatePrayer(
    id,
    { gratitudeTestimony: text, gratitudeTestimonyAt: ts },
    actor,
  );
  if (updated && isFirst) {
    recordPrayerHistory(id, 'gratitude_testimony', actorFromPrayer(updated, actor), {
      testimonyContent: text,
    });
  }
  return updated;
}

export function togglePrayerStar(id: string): Prayer | null {
  const prayer = getPrayerById(id);
  if (!prayer) return null;
  return updatePrayer(id, { starred: !prayer.starred });
}

export function softDeletePrayer(id: string): void {
  updatePrayer(id, { deleted: true });
  deleteAttachmentsForPrayer(id);
  deleteCommentsForPrayer(id);
  deleteHistoryForPrayer(id);
  deleteNotificationsForPrayer(id);
}

/** Map AppUser.role → PrayerAuthorRole */
export function toAuthorRole(role: AppUser['role']): PrayerAuthorRole {
  if (role === 'super_admin') return 'admin';
  if (role === 'pastor') return 'pastor';
  return 'member';
}

/** Default org scope from logged-in user */
export function defaultOrganizationScope(user: AppUser): PrayerOrganizationScope {
  return {
    districtIds: user.districtId ? [user.districtId] : [],
    groupIds: user.zoneId ? [user.zoneId] : [],
    departmentIds: user.departmentIds ? [...user.departmentIds] : [],
  };
}

export function isDemoPrayersSeeded(): boolean {
  try { return localStorage.getItem(LS_DEMO_SEEDED) === DEMO_SEED_VERSION; } catch { return false; }
}

export function markDemoPrayersSeeded(): void {
  try { localStorage.setItem(LS_DEMO_SEEDED, DEMO_SEED_VERSION); } catch { /* ignore */ }
}

export function replaceAllPrayers(prayers: Prayer[]): void {
  save(prayers.map(p => syncShareFields(normalizePrayerRecord({ ...p, attachments: [] }))));
}
