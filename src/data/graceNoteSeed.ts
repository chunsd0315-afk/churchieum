/**
 * 은혜기록 데모 데이터 — 통일 형식 (graceTitle · graceContent · isSeed)
 */

import type { GraceNote, GraceNoteComment, GraceNoteVisibility } from './graceNotes';
import {
  GRACE_SEED_FORMAT_VERSION,
  getAllGraceNotes,
  isDemoGraceNotesSeeded,
  markDemoGraceNotesSeeded,
  replaceSeedGraceNotes,
  setGraceSeedFormatVersion,
} from './graceNotes';
import {
  getAllProgresses,
  READING_PLANS,
  type PlanId,
  type ReadingProgress,
} from './readingPlans';
import { getAllClergy, getAllActiveAssignments, positionLabel } from '../services/clergyData';
import { getDistricts, getDepartments, getAllZones, getZonesByDistrictId } from '../services/orgData';
import {
  composeSharedGroupIds,
  getEligiblePastorsForUser,
  uniqueIds,
} from '../services/graceNoteShareScope';
import type { AppUser } from '../services/permissions';
import { getAllSermons } from '../services/sermonStorage';
import { buildGraceCopyForSeedNote } from './graceNoteSeedCopyPools';
import {
  isGraceSeedFormatCurrent,
  migrateDemoGraceRecordsToUnifiedFormat,
  normalizeSeedGraceRecord,
  validateGraceSeedRecords,
} from '../services/graceNoteSeedNormalize';
import { ensureSeedGraceNoteCopyRefreshed } from '../services/graceNoteSeedCopyRefresh';
import { formatOrganizationShareDisplayLabels } from '../services/graceNoteShareScope';
import { readOrgSettings } from '../contexts/OrgSettingsContext';
import { migrateVisibility } from '../types/sharedContent';

const LS_PROGRESS_SEEDED = 'graceNotes_reading_progress_seeded';

/** 본문 300건 + 권한 픽스처 */
const SEED_READING_COUNT = 105;
const SEED_SERMON_COUNT = 120;
const SEED_PERSONAL_COUNT = 75;

type SeedAuthor = {
  id: string;
  name: string;
  role: string;
  gender: '남' | '여';
  districtId: string;
  zoneId: string;
  departmentIds: string[];
};

const MALE_NAMES = [
  '김민수', '박지훈', '오세훈', '유성민', '윤서준', '정서준', '한도윤', '임준서',
  '조현우', '신우진', '배성민', '홍준호', '문태양', '송재현', '강지호',
];
const FEMALE_NAMES = [
  '이은지', '최수연', '정하늘', '김다은', '한지은', '윤서연', '강수아', '오예린',
  '배수빈', '송은혜', '서미라', '장미정', '안소윤', '류채원', '황하은',
];
const ROLES = ['새가족', '성도', '집사', '권사', '안수집사', '청년', '학생'] as const;

const READING_PASSAGES = [
  '창세기 1장', '시편 23편', '시편 91편', '잠언 3장', '이사야 40장',
  '마태복음 5장', '요한복음 3장', '요한복음 15장', '로마서 8장', '빌립보서 4장',
  '히브리서 11장', '야고보서 1장', '에베소서 6장', '출애굽기 14장', '사도행전 2장',
];

const COMMENT_SAMPLES = [
  '은혜로운 나눔 감사합니다.',
  '같은 말씀으로 위로받았습니다.',
  '기도하며 함께하겠습니다.',
  '아멘, 저도 도전받습니다.',
  '공감합니다. 순종으로 나아가길.',
  '가정과 직장을 위해 기도합니다.',
  '봉사하시는 모습에 힘이 됩니다.',
  '성령의 인도하심이 함께하시길.',
];

const APPLICATIONS = [
  '이번 주 하루 10분이라도 조용히 기도하는 시간을 지키겠습니다.',
  '가족에게 먼저 사과하고 따뜻한 말을 전하겠습니다.',
  '직장 동료를 위해 매일 한 사람을 정해 기도하겠습니다.',
  '받은 말씀을 노트에 적어 두고 아침에 다시 읽겠습니다.',
  '봉사 시간을 점검하고 빠지지 않도록 달력에 표시하겠습니다.',
];

const PRAYERS = [
  '주님, 오늘 받은 은혜를 삶으로 이어가게 도와주세요.',
  '하나님, 순종할 용기를 주시고 말씀대로 살아가게 해주세요.',
  '성령님, 제 마음을 만져 주시고 가정과 직장을 지켜 주세요.',
  '예수님, 십자가의 사랑을 잊지 않게 하시고 이웃을 섬기게 해주세요.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomPastDate(seedIndex: number): string {
  const roll = seedIndex % 100;
  let daysAgo: number;
  if (roll < 5) daysAgo = 0;
  else if (roll < 10) daysAgo = 1;
  else if (roll < 25) daysAgo = randInt(2, 6);
  else if (roll < 40) daysAgo = randInt(7, 29);
  else if (roll < 60) daysAgo = randInt(30, 90);
  else if (roll < 80) daysAgo = randInt(91, 180);
  else daysAgo = randInt(181, 365);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(6 + (seedIndex % 16), seedIndex % 60, 0, 0);
  return d.toISOString();
}

function seedHash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeComments(count: number, baseDate: string, names: string[], seed: number): GraceNoteComment[] {
  const result: GraceNoteComment[] = [];
  const base = new Date(baseDate).getTime();
  for (let i = 0; i < count; i++) {
    const typeRoll = (seed + i) % 10;
    const type = typeRoll < 4 ? 'prayer' as const
      : typeRoll < 6 ? 'amen' as const
        : 'comment' as const;
    result.push({
      id: `gnc-seed-${seed}-${i}`,
      authorName: names[(seed + i) % names.length],
      content: type === 'prayer' ? '기도합니다' : type === 'amen' ? '아멘' : pick(COMMENT_SAMPLES),
      type,
      createdAt: new Date(base + (i + 1) * 3600000).toISOString(),
    });
  }
  return result;
}

function buildAuthors(): SeedAuthor[] {
  const districts = getDistricts().filter(d => d.is_active);
  const departments = getDepartments().filter(d => d.is_active);
  const authors: SeedAuthor[] = [];

  const pushAuthor = (name: string, gender: '남' | '여', idx: number) => {
    const district = districts[idx % districts.length] ?? districts[0];
    const zones = getZonesByDistrictId(district.id);
    const zone = zones[idx % Math.max(zones.length, 1)] ?? getAllZones()[0];
    const deptA = departments[idx % departments.length];
    const deptB = departments[(idx + 3) % departments.length];
    const deptIds = uniqueIds([deptA?.id, idx % 2 === 0 ? deptB?.id : undefined].filter(Boolean) as string[]);
    authors.push({
      id: `gn-author-${idx + 1}`,
      name,
      role: ROLES[idx % ROLES.length],
      gender,
      districtId: district.id,
      zoneId: zone?.id ?? '',
      departmentIds: deptIds.length ? deptIds : (departments[0] ? [departments[0].id] : []),
    });
  };

  MALE_NAMES.forEach((n, i) => pushAuthor(n, '남', i));
  FEMALE_NAMES.forEach((n, i) => pushAuthor(n, '여', MALE_NAMES.length + i));

  authors.push({
    id: 'demo-member60',
    name: '천성대',
    role: '장로',
    gender: '남',
    districtId: 'd1',
    zoneId: 'z1',
    departmentIds: ['dep3', 'dep5'],
  });
  authors.push({
    id: 'demo-pastor01',
    name: '정재명',
    role: '목사',
    gender: '남',
    districtId: 'd1',
    zoneId: 'z1',
    departmentIds: ['dep1'],
  });
  authors.push({
    id: 'demo-pastor02',
    name: '이변우',
    role: '목사',
    gender: '남',
    districtId: 'd2',
    zoneId: 'z3',
    departmentIds: ['dep1'],
  });

  return authors;
}

function syncAuthorsToDemoStore(authors: SeedAuthor[]): void {
  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    const data = raw ? JSON.parse(raw) as { members?: Array<Record<string, unknown>> } : { members: [] };
    const members = [...(data.members ?? [])];
    for (const a of authors) {
      const dist = getDistricts().find(d => d.id === a.districtId);
      const zone = getAllZones().find(z => z.id === a.zoneId);
      const existing = members.findIndex(m => m.id === a.id || m.name === a.name);
      const row = {
        id: a.id,
        name: a.name,
        email: a.id === 'demo-member60'
          ? 'member60@demo.com'
          : a.id === 'demo-pastor01'
            ? 'pastor01@churchieum.com'
            : a.id === 'demo-pastor02'
              ? 'pastor02@churchieum.com'
              : `${a.id}@demo.churchieum.com`,
        position: a.role,
        districtId: a.districtId,
        districtName: dist?.name ?? '',
        zoneId: a.zoneId,
        zoneName: zone?.name ?? '',
        departmentIds: a.departmentIds,
        gender: a.gender === '남' ? 'male' : 'female',
        memberStatus: a.role === '새가족' ? '새가족' : '활동중',
      };
      if (existing >= 0) members[existing] = { ...members[existing], ...row };
      else members.push(row);
    }
    localStorage.setItem('churchieum_demo_generated_v2', JSON.stringify({ ...data, members }));
  } catch { /* ignore */ }
}

function authorAsUser(a: SeedAuthor): AppUser {
  const isPastor01 = a.id === 'demo-pastor01';
  const isPastor02 = a.id === 'demo-pastor02';
  return {
    id: a.id,
    email: a.id === 'demo-member60'
      ? 'member60@demo.com'
      : isPastor01
        ? 'pastor01@churchieum.com'
        : isPastor02
          ? 'pastor02@churchieum.com'
          : `${a.id}@demo.churchieum.com`,
    name: a.name,
    role: isPastor01 ? 'super_admin' : isPastor02 ? 'pastor' : 'member',
    districtId: a.districtId,
    zoneId: a.zoneId,
    departmentIds: a.departmentIds,
  };
}

/** 30% private · 35% pastor_share · 35% organization_share */
function pickVisibilityForAuthor(author: SeedAuthor, index: number): {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
  sharedOrganizationIds: string[];
  sharedUpperOrganizationIds: string[];
  sharedLowerOrganizationIds: string[];
  sharedDepartmentIds: string[];
} {
  const eligiblePastors = getEligiblePastorsForUser(authorAsUser(author));
  const empty = {
    sharedPastorAll: false,
    sharedPastorIds: [] as string[],
    sharedGroupAll: false,
    sharedGroupIds: [] as string[],
    sharedOrganizationIds: [] as string[],
    sharedUpperOrganizationIds: [] as string[],
    sharedLowerOrganizationIds: [] as string[],
    sharedDepartmentIds: [] as string[],
  };

  const bucket = index % 100;
  if (bucket < 30) {
    return { visibility: 'private', ...empty };
  }

  if (bucket < 65) {
    if (eligiblePastors.length === 0) {
      return {
        visibility: 'organization_share',
        ...empty,
        sharedGroupAll: true,
        sharedOrganizationIds: author.districtId ? [author.districtId] : [],
        sharedGroupIds: author.districtId ? [author.districtId] : [],
        sharedUpperOrganizationIds: author.districtId ? [author.districtId] : [],
      };
    }
    const preferCl1 = eligiblePastors.find(p => p.id === 'cl1');
    const preferCl2 = eligiblePastors.find(p => p.id === 'cl2');
    const preferred = (index % 2 === 0 ? preferCl1 : preferCl2) ?? eligiblePastors[index % eligiblePastors.length];
    const ids = uniqueIds([
      preferred.id,
      ...(index % 3 === 0 && eligiblePastors[1] ? [eligiblePastors[1].id] : []),
    ]);
    return {
      visibility: 'pastor_share',
      ...empty,
      sharedPastorIds: ids.slice(0, 3),
    };
  }

  const orgMode = index % 3;
  if (orgMode === 0 && author.districtId) {
    const ids = [author.districtId];
    return {
      visibility: 'organization_share',
      ...empty,
      sharedUpperOrganizationIds: ids,
      sharedOrganizationIds: ids,
      sharedGroupIds: composeSharedGroupIds(ids, [], []),
    };
  }
  if (orgMode === 1 && author.zoneId) {
    const upper = author.districtId ? [author.districtId] : [];
    const lower = [author.zoneId];
    const composed = composeSharedGroupIds(upper, lower, []);
    return {
      visibility: 'organization_share',
      ...empty,
      sharedUpperOrganizationIds: upper,
      sharedLowerOrganizationIds: lower,
      sharedOrganizationIds: composed,
      sharedGroupIds: composed,
    };
  }
  if (author.departmentIds.length) {
    const dept = [author.departmentIds[index % author.departmentIds.length]];
    const composed = composeSharedGroupIds([], [], dept);
    return {
      visibility: 'organization_share',
      ...empty,
      sharedDepartmentIds: dept,
      sharedOrganizationIds: composed,
      sharedGroupIds: composed,
    };
  }

  return {
    visibility: 'organization_share',
    ...empty,
    sharedGroupAll: true,
  };
}

function baseEngagement(visibility: GraceNoteVisibility, createdAt: string, names: string[], seed: number) {
  const open = visibility !== 'private';
  const likeCount = open ? seed % 21 : 0;
  const commentCount = open ? seed % 11 : 0;
  const comments = makeComments(commentCount, createdAt, names, seed);
  return {
    likeCount,
    comments,
    prayCount: comments.filter(c => c.type === 'prayer').length,
    amenCount: comments.filter(c => c.type === 'amen').length,
  };
}

function pickAuthor(authors: SeedAuthor[], index: number): SeedAuthor {
  const demoIds = ['demo-pastor01', 'demo-pastor02', 'demo-member60'];
  if (index % 17 === 0) return authors.find(a => a.id === demoIds[index % 3]) ?? authors[index % authors.length];
  return authors[index % authors.length];
}

function seedMeta(index: number): Pick<GraceNote, 'isSeed' | 'isDemo' | 'source' | 'isFavorite'> {
  return {
    isSeed: true,
    isDemo: true,
    source: 'seed',
    isFavorite: index % 5 === 0,
  };
}

function generateSermonNotes(count: number, authors: SeedAuthor[], names: string[]): GraceNote[] {
  const sermons = getAllSermons();
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pickAuthor(authors, i + 7);
    const id = `gn-demo-s-${i}`;
    const createdAt = randomPastDate(i);
    const share = pickVisibilityForAuthor(author, i);
    const eng = baseEngagement(share.visibility, createdAt, names, i);
    const sermon = sermons[i % Math.max(sermons.length, 1)];
    const copy = buildGraceCopyForSeedNote('sermon', id, seedHash(id));
    const preacher = getAllClergy().find(c => c.id === 'cl1') ?? getAllClergy()[0];
    notes.push(normalizeSeedGraceRecord({
      id,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'sermon',
      ...share,
      graceTitle: copy.graceTitle,
      graceContent: copy.graceContent,
      sourceId: sermon?.id,
      sermonTitle: sermon?.title ?? copy.graceTitle,
      sermonPreacher: preacher ? `${preacher.name} ${positionLabel(preacher)}` : '정재명 목사',
      sermonDate: sermon?.sermonDate ?? createdAt.slice(0, 10),
      bibleReference: sermon?.scripture ?? `${pick(['요한복음', '로마서', '시편'])} ${randInt(1, 12)}:${randInt(1, 28)}`,
      memorableVerse: graceContent.slice(0, 40),
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      ...seedMeta(i),
      createdAt,
      updatedAt: createdAt,
    }, i));
  }
  return notes;
}

function generateReadingNotes(count: number, authors: SeedAuthor[], names: string[]): GraceNote[] {
  const plans = READING_PLANS.filter(p => ['1year', 'mccheyne', '30day-nt'].includes(p.id));
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pickAuthor(authors, i + 3);
    const id = `gn-demo-r-${i}`;
    const createdAt = randomPastDate(i + 50);
    const share = pickVisibilityForAuthor(author, i + 100);
    const eng = baseEngagement(share.visibility, createdAt, names, i + 50);
    const plan = plans[i % Math.max(plans.length, 1)] ?? READING_PLANS[0];
    const passage = READING_PASSAGES[i % READING_PASSAGES.length];
    const copy = buildGraceCopyForSeedNote('reading', id, seedHash(id));
    notes.push(normalizeSeedGraceRecord({
      id,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'reading',
      ...share,
      graceTitle: copy.graceTitle,
      graceContent: copy.graceContent,
      sourceId: `demo-progress-${plan.id}`,
      sourceTitle: plan.name,
      planId: plan.id as PlanId,
      planName: plan.name,
      planColor: plan.color,
      day: (i % Math.min(plan.durationDays, 120)) + 1,
      bibleReference: passage,
      memorableVerse: `${passage}에서 마음에 남은 구절`,
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      ...seedMeta(i + 20),
      createdAt,
      updatedAt: createdAt,
    }, i + 100));
  }
  return notes;
}

function generatePersonalNotes(count: number, authors: SeedAuthor[], names: string[]): GraceNote[] {
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pickAuthor(authors, i + 11);
    const id = `gn-demo-p-${i}`;
    const createdAt = randomPastDate(i + 120);
    const share = pickVisibilityForAuthor(author, i + 220);
    const eng = baseEngagement(share.visibility, createdAt, names, i + 120);
    const copy = buildGraceCopyForSeedNote('personal', id, seedHash(id));
    notes.push(normalizeSeedGraceRecord({
      id,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'personal',
      ...share,
      graceTitle: copy.graceTitle,
      graceContent: copy.graceContent,
      memorableVerse: '',
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      ...seedMeta(i + 40),
      createdAt,
      updatedAt: createdAt,
    }, i + 220));
  }
  return notes;
}

function ensureDemoReadingProgresses(): void {
  try {
    if (localStorage.getItem(LS_PROGRESS_SEEDED) === '1') return;
  } catch { /* ignore */ }

  const now = new Date().toISOString();
  const demoPlans: { id: PlanId; pct: number }[] = [
    { id: '1year', pct: 52 },
    { id: 'mccheyne', pct: 18 },
    { id: '30day-nt', pct: 63 },
  ];
  const progresses: ReadingProgress[] = demoPlans.map((p, idx) => {
    const plan = READING_PLANS.find(r => r.id === p.id)!;
    const currentDay = Math.max(1, Math.round(plan.durationDays * p.pct / 100));
    return {
      id: `demo-progress-${p.id}`,
      planId: p.id,
      planName: plan.name,
      startDay: 1,
      currentDay,
      completedDays: Array.from({ length: currentDay - 1 }, (_, j) => j + 1),
      previousDaysStatus: 'incomplete' as const,
      streakDays: 3 + (idx % 18),
      startedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      lastCompletedAt: now,
      isCompleted: false,
      status: 'active' as const,
    };
  });

  try {
    const all = getAllProgresses().filter(p => !p.id.startsWith('demo-progress-'));
    localStorage.setItem('readingProgressesV3', JSON.stringify([...all, ...progresses]));
    localStorage.setItem(LS_PROGRESS_SEEDED, '1');
  } catch { /* ignore */ }
}

/** 은혜기록·기도 시드 공통 — 등록된 성도·교역자·관리자 작성자 목록 */
export function prepareDemoSeedAuthors(): SeedAuthor[] {
  void getAllActiveAssignments();
  const authors = buildAuthors();
  syncAuthorsToDemoStore(authors);
  return authors;
}

export function generateGraceNoteDemoData(): GraceNote[] {
  const authors = prepareDemoSeedAuthors();
  const names = authors.map(a => a.name);
  const sermon = generateSermonNotes(SEED_SERMON_COUNT, authors, names);
  const reading = generateReadingNotes(SEED_READING_COUNT, authors, names);
  const personal = generatePersonalNotes(SEED_PERSONAL_COUNT, authors, names);
  const all = [...sermon, ...reading, ...personal];

  const pushFixture = (
    id: string,
    author: SeedAuthor,
    type: GraceNote['type'],
    visibility: GraceNoteVisibility,
    shareExtra: Partial<GraceNote> = {},
    index: number,
  ) => {
    const createdAt = randomPastDate(index + 400);
    const copy = buildGraceCopyForSeedNote(type, id, seedHash(id));
    const share = pickVisibilityForAuthor(author, index);
    const finalVis = visibility;
    const shareOverride = {
      visibility: finalVis,
      sharedPastorIds: shareExtra.sharedPastorIds ?? (finalVis === 'pastor_share' ? share.sharedPastorIds : []),
      sharedOrganizationIds: shareExtra.sharedOrganizationIds ?? share.sharedOrganizationIds,
      sharedGroupIds: shareExtra.sharedGroupIds ?? share.sharedGroupIds,
      sharedUpperOrganizationIds: shareExtra.sharedUpperOrganizationIds ?? share.sharedUpperOrganizationIds,
      sharedLowerOrganizationIds: shareExtra.sharedLowerOrganizationIds ?? share.sharedLowerOrganizationIds,
      sharedDepartmentIds: shareExtra.sharedDepartmentIds ?? share.sharedDepartmentIds,
      sharedPastorAll: shareExtra.sharedPastorAll ?? false,
      sharedGroupAll: shareExtra.sharedGroupAll ?? false,
    };
    const eng = baseEngagement(finalVis, createdAt, names, index);
    all.push(normalizeSeedGraceRecord({
      id,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type,
      graceTitle: copy.graceTitle,
      graceContent: copy.graceContent,
      memorableVerse: copy.graceContent.slice(0, 40),
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...shareOverride,
      ...eng,
      ...seedMeta(index),
      createdAt,
      updatedAt: createdAt,
      ...shareExtra,
    }, index));
  };

  const demoAuthor = authors.find(a => a.id === 'demo-member60');
  if (demoAuthor) {
    for (let i = 0; i < 12; i++) {
      const type: GraceNote['type'] = i % 3 === 0 ? 'sermon' : i % 3 === 1 ? 'reading' : 'personal';
      pushFixture(
        `gn-demo-me-${i}`,
        demoAuthor,
        type,
        pickVisibilityForAuthor(demoAuthor, i).visibility,
        type === 'reading'
          ? { sourceId: 'demo-progress-1year', planId: '1year', planName: '1년 성경통독', bibleReference: READING_PASSAGES[i % READING_PASSAGES.length] }
          : type === 'sermon'
            ? { sourceId: getAllSermons()[0]?.id, sermonTitle: '순종으로 시작하는 믿음', sermonPreacher: '정재명 목사' }
            : {},
        i + 500,
      );
    }
  }

  const pastor01 = authors.find(a => a.id === 'demo-pastor01');
  const pastor02 = authors.find(a => a.id === 'demo-pastor02');
  if (pastor01) {
    pushFixture('gn-fix-p01-private', pastor01, 'personal', 'private', {}, 600);
    pushFixture('gn-fix-p01-pastor-to-cl2', pastor01, 'personal', 'pastor_share', { sharedPastorIds: ['cl2'] }, 601);
    pushFixture('gn-fix-p01-group-d1', pastor01, 'reading', 'organization_share', {
      sharedUpperOrganizationIds: ['d1'],
      sharedOrganizationIds: ['d1'],
      sharedGroupIds: ['d1'],
      sourceId: 'demo-progress-1year',
      bibleReference: '시편 23편',
    }, 602);
  }
  if (pastor02) {
    pushFixture('gn-fix-p02-private', pastor02, 'personal', 'private', {}, 603);
    pushFixture('gn-fix-p02-pastor-to-cl1', pastor02, 'sermon', 'pastor_share', {
      sharedPastorIds: ['cl1'],
      sourceId: getAllSermons()[1]?.id,
      sermonTitle: '순종으로 시작하는 믿음',
    }, 604);
    pushFixture('gn-fix-p02-group-d2', pastor02, 'personal', 'organization_share', {
      sharedUpperOrganizationIds: ['d2'],
      sharedOrganizationIds: ['d2'],
      sharedGroupIds: ['d2'],
    }, 605);
  }
  if (demoAuthor) {
    pushFixture('gn-fix-m60-private', demoAuthor, 'personal', 'private', {}, 606);
    pushFixture('gn-fix-m60-pastor-cl1', demoAuthor, 'reading', 'pastor_share', {
      sharedPastorIds: ['cl1'],
      sourceId: 'demo-progress-mccheyne',
      bibleReference: '로마서 8장',
    }, 607);
  }

  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type GenerateGraceRecordSeedsOptions = {
  count?: number;
  replaceExistingSeed?: boolean;
};

/** seed 데이터만 교체 — 사용자 작성 기록은 유지 */
export function generateGraceRecordSeeds(
  options: GenerateGraceRecordSeedsOptions = {},
): GraceNote[] {
  const replace = options.replaceExistingSeed !== false;
  const notes = generateGraceNoteDemoData();

  if (replace) {
    replaceSeedGraceNotes(notes);
    markDemoGraceNotesSeeded();
    setGraceSeedFormatVersion(GRACE_SEED_FORMAT_VERSION);
  }

  return notes;
}

export function ensureGraceNoteDemoData(): void {
  ensureDemoReadingProgresses();
  if (isDemoGraceNotesSeeded() && isGraceSeedFormatCurrent()) {
    ensureSeedGraceNoteCopyRefreshed();
    return;
  }

  if (isDemoGraceNotesSeeded() && !isGraceSeedFormatCurrent()) {
    migrateDemoGraceRecordsToUnifiedFormat(() => generateGraceNoteDemoData());
    ensureSeedGraceNoteCopyRefreshed();
    return;
  }

  generateGraceRecordSeeds({ count: 300, replaceExistingSeed: true });
  ensureSeedGraceNoteCopyRefreshed();
}

export function resetGraceNoteDemoData(): void {
  try {
    localStorage.removeItem('graceNotesV2_demo_seeded_v5');
    localStorage.removeItem('graceNotesV2_demo_seeded_v4');
    localStorage.removeItem('graceNotesV2_demo_seeded_v3');
    localStorage.removeItem('graceNotesV2_demo_seeded');
    localStorage.removeItem('churchieum_grace_seed_version');
    localStorage.removeItem('churchieum_grace_seed_copy_version');
    localStorage.removeItem(LS_PROGRESS_SEEDED);
  } catch { /* ignore */ }
  generateGraceRecordSeeds({ count: 300, replaceExistingSeed: true });
}

export function validateCurrentGraceSeedData() {
  return validateGraceSeedRecords(getAllGraceNotes());
}

export function formatSharedPastorLabel(note: GraceNote): string {
  if (migrateVisibility(note.visibility) !== 'pastor_share') return '';
  if (note.sharedPastorAll) return '담당 교역자 전체';
  const ids = Array.isArray(note.sharedPastorIds) ? note.sharedPastorIds : [];
  const names = ids.map(id => {
    const snap = note.sharedPastorSnapshots?.find(s => s.pastorId === id);
    if (snap) {
      return `${snap.name}${snap.position ? ` ${snap.position}` : ''}`.trim();
    }
    const c = getAllClergy().find(cl => cl.id === id);
    if (c) return `${c.name} ${positionLabel(c)}`.trim();
    return '알 수 없는 교역자';
  });
  return names.length > 0 ? names.join(', ') : '담당 교역자';
}

export function formatSharedGroupLabel(note: GraceNote): string {
  if (migrateVisibility(note.visibility) !== 'organization_share') return '';
  const labels = readOrgSettings();
  if (note.sharedGroupAll) return `${labels.level1Label}/${labels.departmentLabel} 전체`;

  const display = formatOrganizationShareDisplayLabels({
    sharedGroupIds: note.sharedGroupIds,
    sharedUpperOrganizationIds: note.sharedUpperOrganizationIds,
    sharedLowerOrganizationIds: note.sharedLowerOrganizationIds,
    sharedDepartmentIds: note.sharedDepartmentIds,
  });
  return display.length > 0
    ? display.join(', ')
    : `${labels.level1Label}/${labels.departmentLabel}`;
}
