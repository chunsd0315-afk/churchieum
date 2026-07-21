/**
 * 은혜기록 데모 데이터 (300건) — 실제 성도 기록처럼 자연스러운 한국어
 */

import type { GraceNote, GraceNoteComment, GraceNoteVisibility } from './graceNotes';
import {
  isDemoGraceNotesSeeded,
  markDemoGraceNotesSeeded,
  replaceAllGraceNotes,
} from './graceNotes';
import {
  getAllProgresses,
  READING_PLANS,
  type PlanId,
  type ReadingProgress,
} from './readingPlans';
import { getAllClergy, getAllActiveAssignments, positionLabel } from '../services/clergyData';
import { getDistricts, getDepartments, getAllZones, getZonesByDistrictId } from '../services/orgData';
import { readOrgSettings } from '../contexts/OrgSettingsContext';
import {
  formatOrganizationShareDisplayLabels,
  getEligiblePastorsForUser,
  composeSharedGroupIds,
  uniqueIds,
} from '../services/graceNoteShareScope';
import type { AppUser } from '../services/permissions';
import { migrateVisibility } from '../types/sharedContent';

const LS_PROGRESS_SEEDED = 'graceNotes_reading_progress_seeded';

type SeedAuthor = {
  id: string;
  name: string;
  role: string;
  gender: '남' | '여';
  districtId: string;
  zoneId: string;
  departmentIds: string[];
};

const SEARCH_KEYWORDS = [
  '감사', '믿음', '순종', '기도', '사랑', '복음', '십자가', '회개', '소망', '성령',
  '치유', '전도', '예배', '찬양', '가정', '직장', '봉사',
];

const MALE_NAMES = [
  '김민수', '박지훈', '오세훈', '유성민', '윤서준', '정서준', '한도윤', '임준서',
  '조현우', '신우진', '배성민', '홍준호', '문태양', '송재현', '강지호',
];
const FEMALE_NAMES = [
  '이은지', '최수연', '정하늘', '김다은', '한지은', '윤서연', '강수아', '오예린',
  '배수빈', '송은혜', '서미라', '장미정', '안소윤', '류채원', '황하은',
];
const ROLES = ['새가족', '성도', '집사', '권사', '안수집사', '청년', '학생'] as const;

const SERMON_TITLES = [
  '십자가의 사랑', '믿음으로 나아가라', '순종의 복', '감사하는 삶', '기도의 능력',
  '성령의 인도', '말씀 위에 세운 삶', '소망의 확신', '회개와 새 출발', '전도의 사명',
  '가정의 회복', '직장에서의 증인', '봉사의 기쁨', '예배의 본질', '찬양으로 드리는 영광',
];

const GRACE_BODIES = [
  '오늘 말씀을 들으며 제 마음속 걱정이 조금 내려앉았습니다. 하나님께서 이미 길을 예비하셨다는 확신이 생겼습니다.',
  '순종은 거창한 결정이 아니라 오늘의 작은 선택임을 깨달았습니다. 먼저 가족에게 온유하게 말하기로 결심했습니다.',
  '기도 제목을 내려놓고 나니 마음에 평안이 찾아왔습니다. 결과가 아니라 하나님과의 관계가 중요하다는 걸 다시 배웠습니다.',
  '십자가를 바라보니 제가 붙잡고 있던 자존심이 보였습니다. 회개하고 용서를 구하는 용기를 구합니다.',
  '성령께서 마음을 만져 주시는 것 같았습니다. 지쳐 있던 예배가 다시 기쁨이 되었습니다.',
  '직장에서 힘든 일이 있었지만, 복음의 소망이 하루를 버티게 했습니다. 동료에게도 따뜻하게 대하겠습니다.',
  '가정에서 싸운 후 말씀이 마음에 꽂혔습니다. 먼저 화해하고 사랑을 실천하겠습니다.',
  '전도의 기회가 생겼을 때 망설였던 제가 부끄러웠습니다. 다음엔 용기 내어 예수님을 전하고 싶습니다.',
  '봉사하며 섬김의 기쁨을 다시 느꼈습니다. 작은 일이라도 정성껏 하겠습니다.',
  '찬양 중에 눈물이 났습니다. 오랜만에 하나님을 향한 갈망이 살아났습니다.',
  '치유의 말씀을 듣고 몸이 아니라 마음이 먼저 회복되는 걸 느꼈습니다. 감사합니다.',
  '믿음은 느낌보다 약속에 서는 것임을 배웠습니다. 흔들려도 말씀으로 돌아가겠습니다.',
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

const READING_PASSAGES = [
  '창세기 1장', '시편 23편', '시편 91편', '잠언 3장', '이사야 40장',
  '마태복음 5장', '요한복음 3장', '요한복음 15장', '로마서 8장', '빌립보서 4장',
  '히브리서 11장', '야고보서 1장', '에베소서 6장', '출애굽기 14장', '사도행전 2장',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomPastDate(): string {
  const roll = Math.random();
  let daysAgo: number;
  if (roll < 0.1) daysAgo = 0;
  else if (roll < 0.2) daysAgo = 1;
  else if (roll < 0.4) daysAgo = randInt(2, 6);
  else if (roll < 0.55) daysAgo = randInt(7, 13);
  else if (roll < 0.75) daysAgo = randInt(14, 45);
  else daysAgo = randInt(46, 280);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(6, 22), randInt(0, 59), 0, 0);
  return d.toISOString();
}

function withKeyword(text: string): string {
  const kw = pick(SEARCH_KEYWORDS);
  if (Math.random() < 0.75) {
    return `${text} 특히 '${kw}'이라는 단어가 마음에 남았습니다.`;
  }
  return text;
}

function makeComments(count: number, baseDate: string, names: string[]): GraceNoteComment[] {
  const result: GraceNoteComment[] = [];
  const base = new Date(baseDate).getTime();
  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    const type = typeRoll < 0.35 ? 'prayer' as const
      : typeRoll < 0.55 ? 'amen' as const
        : 'comment' as const;
    result.push({
      id: `gnc-seed-${base}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      authorName: pick(names),
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
    const deptIds = uniqueIds([deptA?.id, Math.random() < 0.45 ? deptB?.id : undefined].filter(Boolean) as string[]);
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

  // 데모 로그인 성도 (천성대) — 모아보기 테스트용
  authors.push({
    id: 'demo-member60',
    name: '천성대',
    role: '장로',
    gender: '남',
    districtId: 'd1',
    zoneId: 'z1',
    departmentIds: ['dep3', 'dep5'],
  });

  // 데모 교역자·최고관리자 (Auth 계정 ID와 동일)
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

function pickVisibilityForAuthor(author: SeedAuthor, index: number): {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
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
    sharedUpperOrganizationIds: [] as string[],
    sharedLowerOrganizationIds: [] as string[],
    sharedDepartmentIds: [] as string[],
  };

  // 전체공개(레거시) 대신 organization_share + sharedGroupAll(모두에게 공개)로 배분
  const asFullOrgShare = () => ({
    visibility: 'organization_share' as const,
    ...empty,
    sharedGroupAll: true,
  });

  // 6가지 공개범위를 고르게 배분
  const mode = index % 6;

  if (mode === 0) {
    return { visibility: 'private', ...empty };
  }

  if (mode === 1) {
    if (eligiblePastors.length === 0) return asFullOrgShare();
    const preferCl1 = eligiblePastors.find(p => p.id === 'cl1');
    const preferCl2 = eligiblePastors.find(p => p.id === 'cl2');
    const preferred = (index % 2 === 0 ? preferCl1 : preferCl2) ?? eligiblePastors[0];
    const ids = uniqueIds([
      preferred.id,
      ...(Math.random() < 0.35
        ? eligiblePastors.slice(0, 2).map(p => p.id)
        : []),
    ]);
    return {
      visibility: 'pastor_share',
      ...empty,
      sharedPastorAll: false,
      sharedPastorIds: ids,
    };
  }

  if (mode === 2) {
    // 상위조직 공유
    const upper = author.districtId ? [author.districtId] : [];
    if (upper.length === 0) return asFullOrgShare();
    return {
      visibility: 'organization_share',
      ...empty,
      sharedUpperOrganizationIds: upper,
      sharedGroupIds: composeSharedGroupIds(upper, [], []),
    };
  }

  if (mode === 3) {
    // 하위조직 공유 (+ 상위 자동 포함)
    const lower = author.zoneId ? [author.zoneId] : [];
    const upper = author.districtId ? [author.districtId] : [];
    if (lower.length === 0 && upper.length === 0) return asFullOrgShare();
    return {
      visibility: 'organization_share',
      ...empty,
      sharedUpperOrganizationIds: upper,
      sharedLowerOrganizationIds: lower,
      sharedGroupIds: composeSharedGroupIds(upper, lower, []),
    };
  }

  if (mode === 4) {
    // 부서 공유
    const departments = author.departmentIds.length
      ? [author.departmentIds[index % author.departmentIds.length]]
      : [];
    if (departments.length === 0) return asFullOrgShare();
    return {
      visibility: 'organization_share',
      ...empty,
      sharedDepartmentIds: departments,
      sharedGroupIds: composeSharedGroupIds([], [], departments),
    };
  }

  return asFullOrgShare();
}

function baseEngagement(visibility: GraceNoteVisibility, createdAt: string, names: string[]) {
  const open = visibility !== 'private';
  const likeCount = open ? randInt(0, 20) : 0;
  const commentCount = open ? randInt(0, 10) : 0;
  const comments = makeComments(commentCount, createdAt, names);
  return {
    likeCount,
    comments,
    prayCount: comments.filter(c => c.type === 'prayer').length,
    amenCount: comments.filter(c => c.type === 'amen').length,
  };
}

function generateSermonNotes(count: number, authors: SeedAuthor[], names: string[]): GraceNote[] {
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(authors);
    const createdAt = randomPastDate();
    const share = pickVisibilityForAuthor(author, i);
    const eng = baseEngagement(share.visibility, createdAt, names);
    const preacher = pick(getAllClergy().filter(c => c.status === 'active').slice(0, 8));
    notes.push({
      id: `gn-demo-s-${i}`,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'sermon',
      ...share,
      sermonTitle: pick(SERMON_TITLES),
      sermonPreacher: preacher ? `${preacher.name} ${positionLabel(preacher)}` : '김영수 목사',
      sermonDate: createdAt.slice(0, 10),
      bibleReference: `${pick(['요한복음', '로마서', '시편', '에베소서', '마태복음'])} ${randInt(1, 12)}:${randInt(1, 28)}`,
      memorableVerse: pick(GRACE_BODIES).slice(0, 40),
      graceContent: withKeyword(pick(GRACE_BODIES)),
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return notes;
}

function generateReadingNotes(count: number, authors: SeedAuthor[], names: string[]): GraceNote[] {
  const plans = READING_PLANS.filter(p => ['1year', 'mccheyne', '30day-nt'].includes(p.id));
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(authors);
    const createdAt = randomPastDate();
    const share = pickVisibilityForAuthor(author, i + 100);
    const eng = baseEngagement(share.visibility, createdAt, names);
    const plan = pick(plans.length ? plans : READING_PLANS);
    const passage = pick(READING_PASSAGES);
    notes.push({
      id: `gn-demo-r-${i}`,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'reading',
      ...share,
      sourceId: `demo-progress-${plan.id}`,
      sourceTitle: plan.name,
      planId: plan.id as PlanId,
      planName: plan.name,
      planColor: plan.color,
      day: randInt(1, Math.min(plan.durationDays, 120)),
      bibleReference: passage,
      memorableVerse: `${passage}에서 마음에 남은 구절`,
      graceContent: withKeyword(`${passage}을 읽으며 ${pick(GRACE_BODIES)}`),
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return notes;
}

function generatePersonalNotes(count: number, authors: SeedAuthor[], names: string[]): GraceNote[] {
  const notes: GraceNote[] = [];
  const topics = ['가정', '직장', '봉사', '예배', '찬양', '전도', '치유', '기도 응답', '감사'];
  for (let i = 0; i < count; i++) {
    const author = pick(authors);
    const createdAt = randomPastDate();
    const share = pickVisibilityForAuthor(author, i + 220);
    const eng = baseEngagement(share.visibility, createdAt, names);
    const topic = pick(topics);
    notes.push({
      id: `gn-demo-p-${i}`,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'personal',
      ...share,
      memorableVerse: '',
      graceContent: withKeyword(`[${topic}] ${pick(GRACE_BODIES)}`),
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      createdAt,
      updatedAt: createdAt,
    });
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
  const progresses: ReadingProgress[] = demoPlans.map(p => {
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
      streakDays: randInt(3, 21),
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
  const sermon = generateSermonNotes(100, authors, names);
  const reading = generateReadingNotes(120, authors, names);
  const personal = generatePersonalNotes(80, authors, names);
  const all = [...sermon, ...reading, ...personal];

  const emptyShare = {
    sharedPastorAll: false,
    sharedPastorIds: [] as string[],
    sharedGroupAll: false,
    sharedGroupIds: [] as string[],
    sharedUpperOrganizationIds: [] as string[],
    sharedLowerOrganizationIds: [] as string[],
    sharedDepartmentIds: [] as string[],
  };

  const pushFixture = (
    id: string,
    author: SeedAuthor,
    visibility: GraceNoteVisibility,
    graceContent: string,
    shareExtra: Partial<typeof emptyShare> = {},
  ) => {
    const createdAt = randomPastDate();
    const share = { visibility, ...emptyShare, ...shareExtra };
    const eng = baseEngagement(visibility, createdAt, names);
    all.push({
      id,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorDistrictId: author.districtId,
      authorZoneId: author.zoneId,
      authorDepartmentIds: author.departmentIds,
      type: 'personal',
      ...share,
      memorableVerse: '',
      graceContent,
      application: pick(APPLICATIONS),
      prayer: pick(PRAYERS),
      ...eng,
      createdAt,
      updatedAt: createdAt,
    });
  };

  // 데모 성도(강수아) 본인 기록 — 공개범위 골고루
  const demoAuthor = authors.find(a => a.id === 'demo-member60');
  if (demoAuthor) {
    for (let i = 0; i < 12; i++) {
      const createdAt = randomPastDate();
      const share = pickVisibilityForAuthor(demoAuthor, i);
      const eng = baseEngagement(share.visibility, createdAt, names);
      all.push({
        id: `gn-demo-me-${i}`,
        userId: demoAuthor.id,
        authorName: demoAuthor.name,
        authorRole: demoAuthor.role,
        authorDistrictId: demoAuthor.districtId,
        authorZoneId: demoAuthor.zoneId,
        authorDepartmentIds: demoAuthor.departmentIds,
        type: i % 3 === 0 ? 'sermon' : i % 3 === 1 ? 'reading' : 'personal',
        ...share,
        sermonTitle: i % 3 === 0 ? pick(SERMON_TITLES) : undefined,
        sermonPreacher: i % 3 === 0 ? '김영수 목사' : undefined,
        sermonDate: i % 3 === 0 ? createdAt.slice(0, 10) : undefined,
        planId: i % 3 === 1 ? '1year' : undefined,
        planName: i % 3 === 1 ? '1년 성경통독' : undefined,
        bibleReference: i % 3 === 1 ? pick(READING_PASSAGES) : undefined,
        memorableVerse: '',
        graceContent: withKeyword(`[강수아] ${pick(GRACE_BODIES)}`),
        application: pick(APPLICATIONS),
        prayer: pick(PRAYERS),
        ...eng,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // 역할별 목록이 달라지도록 고정 픽스처
  const pastor01 = authors.find(a => a.id === 'demo-pastor01');
  const pastor02 = authors.find(a => a.id === 'demo-pastor02');
  if (pastor01) {
    pushFixture('gn-fix-p01-private', pastor01, 'private', '[픽스처] 김영수 나만 보기 — 다른 역할은 조회 불가');
    pushFixture('gn-fix-p01-pastor-to-cl2', pastor01, 'pastor_share', '[픽스처] 김영수 → 이성호 교역자 공유', {
      sharedPastorIds: ['cl2'],
    });
    pushFixture('gn-fix-p01-group-d1', pastor01, 'organization_share', '[픽스처] 김영수 1교구 조직 공유 (강수아·김영수 조회)', {
      sharedUpperOrganizationIds: ['d1'],
      sharedGroupIds: ['d1'],
    });
  }
  if (pastor02) {
    pushFixture('gn-fix-p02-private', pastor02, 'private', '[픽스처] 이성호 나만 보기 — 다른 역할은 조회 불가');
    pushFixture('gn-fix-p02-pastor-to-cl1', pastor02, 'pastor_share', '[픽스처] 이성호 → 김영수 교역자 공유', {
      sharedPastorIds: ['cl1'],
    });
    pushFixture('gn-fix-p02-group-d2', pastor02, 'organization_share', '[픽스처] 이성호 2교구 조직 공유 (이성호만 소속으로 조회)', {
      sharedUpperOrganizationIds: ['d2'],
      sharedGroupIds: ['d2'],
    });
  }
  if (demoAuthor) {
    pushFixture('gn-fix-m60-private', demoAuthor, 'private', '[픽스처] 강수아 나만 보기 — 본인만 조회');
    pushFixture('gn-fix-m60-pastor-cl1', demoAuthor, 'pastor_share', '[픽스처] 강수아 → 김영수 담당 교역자 공유', {
      sharedPastorIds: ['cl1'],
    });
  }

  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ensureGraceNoteDemoData(): void {
  ensureDemoReadingProgresses();
  if (isDemoGraceNotesSeeded()) return;
  try {
    const notes = generateGraceNoteDemoData();
    replaceAllGraceNotes(notes);
    markDemoGraceNotesSeeded();
  } catch { /* ignore */ }
}

export function resetGraceNoteDemoData(): void {
  try {
    localStorage.removeItem('graceNotesV2_demo_seeded_v4');
    localStorage.removeItem('graceNotesV2_demo_seeded_v3');
    localStorage.removeItem('graceNotesV2_demo_seeded');
    localStorage.removeItem(LS_PROGRESS_SEEDED);
  } catch { /* ignore */ }
  ensureGraceNoteDemoData();
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
