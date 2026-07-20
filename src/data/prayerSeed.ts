/**
 * 기도 테스트 Seed 데이터 (300건) — 실제 성도 기록처럼 자연스러운 한국어
 */

import type { Prayer, PrayerAuthorRole } from '../types/prayer';
import { CHURCH_WIDE_SCOPE } from '../types/prayer';
import type { VisibilityType } from '../types/sharedContent';
import {
  isDemoPrayersSeeded,
  markDemoPrayersSeeded,
  replaceAllPrayers,
} from '../services/prayerStorage';
import { prepareDemoSeedAuthors } from './graceNoteSeed';
import { getAllClergy } from '../services/clergyData';
import {
  getDistricts,
  getDepartments,
  getAllZones,
} from '../services/orgData';
import {
  composeSharedGroupIds,
  getEligiblePastorsForUser,
  uniqueIds,
} from '../services/graceNoteShareScope';
import type { AppUser } from '../services/permissions';

const PRAYER_COUNT = 300;

const TITLE_STEMS = [
  '건강을 위해 기도해주세요',
  '가정을 위해 기도합니다',
  '취업을 위해 기도합니다',
  '수술을 앞두고 있습니다',
  '자녀를 위해 기도합니다',
  '감사드립니다',
  '선교를 위해 기도합니다',
  '교회를 위해 기도합니다',
  '시험을 앞두고 있습니다',
  '믿음의 회복을 위해',
  '직장에서의 지혜를 구합니다',
  '부모님 회복을 위해',
  '새로운 시작을 위해',
  '영적 각성을 위해',
  '이웃을 위해 중보합니다',
  '청년부를 위해',
  '목회자를 위해',
  '전도의 열린 문',
  '가정의 화해를 위해',
  '치유의 손길을 구합니다',
  '재정적인 필요',
  '마음의 평안',
  '용서와 화해',
  '선교사를 위해',
  '수험생을 위해',
  '새가족을 위해',
  '봉사자를 위해',
  '예배 회복을 위해',
  '말씀 묵상의 은혜',
  '성령의 충만함',
];

const TITLE_QUALIFIERS = [
  '부탁드립니다',
  '함께해 주세요',
  '기도 부탁',
  '중보 요청',
  '은혜를 구합니다',
  '주님께 맡깁니다',
  '마음을 나눕니다',
  '조용히 기도해 주세요',
  '감사와 함께',
  '간절히 구합니다',
];

const PARAGRAPH_POOL = {
  thanksgiving: [
    '하나님께서 지난 한 주 동안 우리 가정을 지켜 주셨음에 감사드립니다. 작은 일에도 손길이 느껴졌고, 예상치 못한 위로가 찾아왔습니다.',
    '병원 검사 결과가 안정적이었습니다. 완전한 회복은 아직이지만, 두려움 대신 감사가 먼저 일어나게 하신 것에 감사합니다.',
    '오랫동안 기다리던 취업 소식이 있었습니다. 모든 영광을 주님께 돌리며, 받은 은혜를 이웃과 나누고 싶습니다.',
    '교회 예배 가운데 마음이 따뜻해졌습니다. 말씀과 찬양을 통해 다시 일어나게 하신 주님께 감사드립니다.',
    '자녀가 새 학기를 잘 시작했습니다. 스스로 기도하는 모습을 보며 하나님의 인도하심을 체험하고 있습니다.',
  ],
  repentance: [
    '최근 가족에게 상처를 준 말과 행동을 회개합니다. 용서를 구하는 용기를 주시고, 먼저 화해하는 마음을 주세요.',
    '기도 생활이 소홀해졌음을 고백합니다. 바쁘다는 핑계로 말씀을 멀리했는데, 다시 주님 앞으로 돌아가고 싶습니다.',
    '이웃을 시기하고 비교했던 마음을 회개합니다. 각자의 자리에서 충성하며 사랑으로 섬기게 하소서.',
    '예배를 형식적으로 드렸던 것을 회개합니다. 마음을 새롭게 하시고 거룩한 두려움으로 다시 나아가게 해주세요.',
    '말씀대로 살지 못했던 순간들이 많았습니다. 회개하고 성령의 인도하심으로 새 사람 되게 하소서.',
  ],
  intercession: [
    '우리 교구의 어르신들이 건강 가운데 예배에 참석하실 수 있도록 기도합니다. 외로움 가운데 계신 분들도 주님의 위로를 경험하게 하소서.',
    '선교지에서 사역하시는 선교사님과 가족을 위해 중보합니다. 안전과 건강, 그리고 열매 맺는 사역을 위해 기도합니다.',
    '청년부가 말씀과 기도로 다시 일어나게 하소서. 다음 세대가 교회의 미래가 되게 하옵소서.',
    '병원에 계신 성도님들의 빠른 회복을 위해 기도합니다. 의료진에게도 지혜를 주시고, 가족에게는 평안을 허락해 주세요.',
    '직장과 학교에서 복음의 증인 되기를 구합니다. 두려움 없이 사랑으로 말하고 행동할 용기를 주세요.',
  ],
  personal: [
    '요즘 마음이 무겁고 결정을 내려야 할 일이 있습니다. 주님의 뜻이 무엇인지 분별할 지혜를 구합니다.',
    '새로운 환경에 적응하는 중입니다. 낯선 자리에서도 주님과 동행하는 믿음을 잃지 않게 해주세요.',
    '가족 관계가 예민한 시기입니다. 서로의 말에 상처받지 않고, 먼저 사랑으로 다가가게 하소서.',
    '영적으로 지친 것 같습니다. 말씀과 기도로 다시 새 힘을 얻고, 작은 순종부터 시작하고 싶습니다.',
    '앞으로의 진로에 대해 고민하고 있습니다. 하나님께서 예비하신 길을 분별하게 하시고, 두려움 대신 신뢰를 주세요.',
  ],
  answered: [
    '오랫동안 기도하던 제목에 응답해 주셨습니다. 과정이 쉽지는 않았지만, 하나님의 때를 기다리며 배운 것이 많았습니다.',
    '수술이 무사히 끝났고 회복도 잘 되고 있습니다. 함께 기도해 주신 교회 가족들께 감사드리며, 받은 은혜를 간증합니다.',
    '취업이 이루어졌습니다. 모든 것이 우연처럼 보였지만, 기도 가운데 인도하심을 분명히 경험했습니다.',
    '가정의 갈등 가운데서도 화해의 시작이 있었습니다. 아직 남은 자리가 있지만, 주님께서 길을 여시는 것을 믿습니다.',
    '믿음이 흔들릴 때마다 말씀과 기도로 다시 일으켜 주셨습니다. 응답하신 주님께 감사드립니다.',
  ],
};

const ANSWER_SAMPLES = [
  '하나님께서 때를 맞추어 길을 열어 주셨습니다. 감사합니다.',
  '기도 가운데 마음의 평안을 주셨고, 상황도 점차 나아지고 있습니다.',
  '완벽하진 않지만 분명히 인도하심을 경험했습니다. 주님께 영광 돌립니다.',
  '함께 기도해 주신 덕분에 힘이 되었습니다. 응답하신 하나님께 감사드립니다.',
];

const PRAYER_KINDS = ['thanksgiving', 'repentance', 'intercession', 'personal', 'answered'] as const;
type PrayerKind = (typeof PRAYER_KINDS)[number];

function pick<T>(arr: readonly T[]): T {
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
  else if (roll < 0.35) daysAgo = randInt(2, 6);
  else if (roll < 0.5) daysAgo = randInt(7, 13);
  else if (roll < 0.7) daysAgo = randInt(14, 45);
  else if (roll < 0.85) daysAgo = randInt(46, 180);
  else daysAgo = randInt(181, 365);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(6, 22), randInt(0, 59), 0, 0);
  return d.toISOString();
}

function authorAsUser(author: {
  id: string;
  name: string;
  districtId: string;
  zoneId: string;
  departmentIds: string[];
}): AppUser {
  const isPastor01 = author.id === 'demo-pastor01';
  const isPastor02 = author.id === 'demo-pastor02';
  return {
    id: author.id,
    email: author.id === 'demo-member60'
      ? 'member60@demo.com'
      : isPastor01
        ? 'pastor01@churchieum.com'
        : isPastor02
          ? 'pastor02@churchieum.com'
          : `${author.id}@demo.churchieum.com`,
    name: author.name,
    role: isPastor01 ? 'super_admin' : isPastor02 ? 'pastor' : 'member',
    districtId: author.districtId,
    zoneId: author.zoneId,
    departmentIds: author.departmentIds,
  };
}

function authorRole(author: { id: string }): PrayerAuthorRole {
  if (author.id === 'demo-pastor01') return 'admin';
  if (author.id === 'demo-pastor02') return 'pastor';
  return 'member';
}

/** 30% private · 35% pastor_share · 35% organization_share */
function pickVisibilityByRatio(index: number): VisibilityType {
  const bucket = index % 100;
  if (bucket < 30) return 'private';
  if (bucket < 65) return 'pastor_share';
  return 'organization_share';
}

function buildShareFields(
  author: ReturnType<typeof prepareDemoSeedAuthors>[number],
  visibility: VisibilityType,
): Pick<Prayer, 'visibility' | 'sharedPastorIds' | 'sharedOrganizationIds' | 'organizationScope'> {
  if (visibility === 'private') {
    return {
      visibility,
      sharedPastorIds: [],
      sharedOrganizationIds: [],
      organizationScope: CHURCH_WIDE_SCOPE,
    };
  }

  if (visibility === 'pastor_share') {
    const eligible = getEligiblePastorsForUser(authorAsUser(author));
    const activeClergy = getAllClergy().filter(c => c.status === 'active');
    const pool = eligible.length > 0 ? eligible : activeClergy.slice(0, 4);
    if (pool.length === 0) {
      return {
        visibility: 'organization_share',
        sharedPastorIds: [],
        sharedOrganizationIds: author.districtId ? [author.districtId] : [],
        organizationScope: {
          districtIds: author.districtId ? [author.districtId] : [],
          groupIds: [],
          departmentIds: [],
        },
      };
    }
    const count = randInt(1, Math.min(3, pool.length));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const ids = uniqueIds(shuffled.slice(0, count).map(p => p.id));
    return {
      visibility,
      sharedPastorIds: ids,
      sharedOrganizationIds: [],
      organizationScope: CHURCH_WIDE_SCOPE,
    };
  }

  const districts = getDistricts().filter(d => d.is_active);
  const zones = getAllZones().filter(z => z.is_active);
  const departments = getDepartments().filter(d => d.is_active);
  const orgPool = uniqueIds([
    ...districts.map(d => d.id),
    ...zones.map(z => z.id),
    ...departments.map(d => d.id),
  ]);
  const pickCount = randInt(1, Math.min(5, orgPool.length));
  const shuffled = [...orgPool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, pickCount);
  const split = {
    upper: selected.filter(id => districts.some(d => d.id === id)),
    lower: selected.filter(id => zones.some(z => z.id === id)),
    departments: selected.filter(id => departments.some(d => d.id === id)),
  };
  const sharedOrganizationIds = composeSharedGroupIds(split.upper, split.lower, split.departments);
  if (sharedOrganizationIds.length === 0 && author.districtId) {
    sharedOrganizationIds.push(author.districtId);
    split.upper = [author.districtId];
  }

  return {
    visibility: 'organization_share',
    sharedPastorIds: [],
    sharedOrganizationIds,
    organizationScope: {
      districtIds: split.upper,
      groupIds: split.lower,
      departmentIds: split.departments,
    },
  };
}

function uniqueTitle(index: number): string {
  const stem = TITLE_STEMS[index % TITLE_STEMS.length];
  const qualifier = TITLE_QUALIFIERS[(index * 7) % TITLE_QUALIFIERS.length];
  const variant = Math.floor(index / TITLE_STEMS.length);
  if (variant === 0) return stem;
  if (variant === 1) return `${stem} — ${qualifier}`;
  return `${stem} (${variant})`;
}

function buildContent(kind: PrayerKind, index: number): string {
  const pool = PARAGRAPH_POOL[kind];
  const paraCount = randInt(2, 8);
  const paragraphs: string[] = [];
  for (let p = 0; p < paraCount; p++) {
    const base = pool[(index + p * 3) % pool.length];
    if (p === 0) {
      paragraphs.push(base);
    } else if (Math.random() < 0.4) {
      paragraphs.push(`${base} 특히 이번 주는 마음을 더욱 낮추고 기도하려 합니다.`);
    } else {
      paragraphs.push(pick(pool));
    }
  }
  return paragraphs.join('\n\n');
}

function pickKind(index: number): PrayerKind {
  return PRAYER_KINDS[index % PRAYER_KINDS.length];
}

export function generatePrayerDemoData(): Prayer[] {
  const authors = prepareDemoSeedAuthors();
  const prayers: Prayer[] = [];

  for (let i = 0; i < PRAYER_COUNT; i++) {
    const author = authors[i % authors.length];
    const kind = pickKind(i);
    const visibility = pickVisibilityByRatio(i);
    const share = buildShareFields(author, visibility);
    const createdAt = randomPastDate();
    const isAnswered = kind === 'answered' || (kind !== 'repentance' && i % 17 === 0);
    const status = isAnswered ? 'answered' as const : 'praying' as const;
    const answeredAt = isAnswered
      ? new Date(new Date(createdAt).getTime() + randInt(3, 45) * 86400000).toISOString()
      : undefined;

    prayers.push({
      id: `pr-demo-${i}`,
      churchId: 'demo',
      authorId: author.id,
      authorName: author.name,
      authorRole: authorRole(author),
      title: uniqueTitle(i),
      content: buildContent(kind, i),
      ...share,
      status,
      attachments: [],
      answeredAt,
      answerContent: isAnswered ? pick(ANSWER_SAMPLES) : undefined,
      gratitudeTestimony: isAnswered && Math.random() < 0.35
        ? '기도해 주신 모든 분께 감사드립니다. 주님께서 응답해 주셨습니다.'
        : undefined,
      gratitudeTestimonyAt: isAnswered && Math.random() < 0.35 ? answeredAt : undefined,
      starred: Math.random() < 0.08,
      createdAt,
      updatedAt: answeredAt ?? createdAt,
    });
  }

  return prayers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ensurePrayerDemoData(): void {
  if (isDemoPrayersSeeded()) return;
  try {
    const prayers = generatePrayerDemoData();
    replaceAllPrayers(prayers);
    markDemoPrayersSeeded();
  } catch { /* ignore */ }
}

export function resetPrayerDemoData(): void {
  try {
    localStorage.removeItem('churchieum_prayers_demo_seeded_v1');
  } catch { /* ignore */ }
  ensurePrayerDemoData();
}
