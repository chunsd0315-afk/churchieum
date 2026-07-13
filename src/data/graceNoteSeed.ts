/**
 * 은혜기록 데모 데이터 생성 (300건)
 * 목록·검색·필터·공개범위·공유·좋아요·댓글 테스트용
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
import { getAllClergy, positionLabel } from '../services/clergyData';
import { getDistricts, getDepartments } from '../services/orgData';

const LS_PROGRESS_SEEDED = 'graceNotes_reading_progress_seeded';

// ─── Content pools ────────────────────────────────────────────────────────────

const SERMON_TITLES = [
  '십자가의 사랑', '믿음으로 나아가라', '하나님의 은혜', '순종의 복', '감사하는 삶',
  '기도의 능력', '성령의 인도', '말씀 위에 세운 삶', '소망의 확신', '회개와 새 출발',
  '전도의 사명', '교제의 기쁨', '하나님 나라', '평안의 복음', '치유의 은혜',
];

const SERMON_SNIPPETS = [
  '하나님은 오늘도 나를 기다리신다.',
  '믿음은 환경보다 크다.',
  '순종은 작은 것부터 시작된다.',
  '감사는 은혜를 기억하는 것이다.',
  '기도는 믿음의 호흡이다.',
  '말씀은 삶을 변화시키는 힘이 있다.',
  '하나님의 사랑은 조건 없이 주어진다.',
  '십자가는 나의 모든 죄를 덮으셨다.',
  '성령께서 오늘도 인도하심을 믿습니다.',
  '예배 가운데 받은 은혜가 하루를 지탱합니다.',
  '회개는 끝이 아니라 새로운 시작입니다.',
  '전도는 사랑의 자연스러운 흐름입니다.',
  '교제 가운데 하나님의 임재를 느꼈습니다.',
  '소망 없는 삶은 없습니다. 그리스도 안에 있습니다.',
  '평안은 세상이 줄 수 없는 하나님의 선물입니다.',
];

const READING_PLANS_DEMO: { id: PlanId; name: string; pct: number }[] = [
  { id: '1year', name: '1년 성경통독', pct: 52 },
  { id: 'mccheyne', name: '맥체인 성경읽기표', pct: 18 },
  { id: '30day-nt', name: '30일 신약통독', pct: 63 },
];

const BIBLE_PASSAGES = [
  '창세기 1장', '창세기 12장', '출애굽기 14장', '출애굽기 20장',
  '시편 1편', '시편 23편', '시편 91편', '시편 119편',
  '잠언 3장', '잠언 31장', '이사야 40장', '이사야 53장',
  '마태복음 5장', '마태복음 28장', '요한복음 3장', '요한복음 15장',
  '사도행전 2장', '사도행전 9장', '로마서 8장', '에베소서 6장',
  '빌립보서 4장', '히브리서 11장', '야고보서 1장', '요한계시록 21장',
];

const READING_REFLECTIONS = [
  '하나님께서 천지를 창조하셨다. 모든 것이 주님의 손에서 시작됨을 묵상했습니다.',
  '아브라함의 부르심을 통해 나의 삶도 하나님께 맡겨야 함을 깨달았습니다.',
  '홍해를 건넌 이스라일처럼, 하나님께서 길을 여시심을 믿습니다.',
  '시편 기자의 고백처럼, 주님은 나의 목자이심을 다시 확인했습니다.',
  '지혜는 여호와를 경외함에서 시작됨을 기억합니다.',
  '이사야의 위로의 말씀이 마음에 깊이 와닿았습니다.',
  '산상수훈을 통해 천국 시민의 삶을 다시 생각했습니다.',
  '요한복음 3:16의 사랑이 오늘도 나를 감싸고 있습니다.',
  '성령의 임재 가운데 교회가 시작된 그 날을 묵상했습니다.',
  '로마서 8장의 확신이 두려움을 이기게 합니다.',
];

const PERSONAL_TOPICS = [
  '기도 응답', '감사', '교회 봉사', '가정', '직장', '선교', '새벽기도',
  '전도', '회개', '간증', '치유', '교제', '찬양', '말씀', '소망',
];

const PERSONAL_SNIPPETS = [
  '오늘 기도했던 일이 응답되었습니다. 하나님께 감사드립니다.',
  '가족과 함께한 저녁 예배가 큰 은혜가 되었습니다.',
  '직장에서 힘든 하루였지만, 말씀 한 구절이 위로가 되었습니다.',
  '봉사 가운데 섬김의 기쁨을 다시 느꼈습니다.',
  '새벽기도 시간에 마음이 새로워졌습니다.',
  '전도의 기회를 주셔서 감사합니다. 두려움보다 사랑이 컸습니다.',
  '회개의 은혜로 마음이 가벼워졌습니다.',
  '선교사님의 간증을 듣고 나의 사명을 다시 생각했습니다.',
  '교회 친구의 기도가 큰 힘이 되었습니다.',
  '찬양 가운데 하나님의 임재를 경험했습니다.',
];

const SEARCH_KEYWORDS = [
  '사랑', '감사', '믿음', '순종', '기도', '예배', '성령', '십자가', '회개', '은혜',
  '복음', '천국', '소망', '평안', '전도', '선교', '교제', '말씀', '찬양', '치유',
];

const AUTHORS: { name: string; role: string }[] = [
  { name: '김민준', role: '청년' }, { name: '이수연', role: '청년' },
  { name: '박지훈', role: '청년' }, { name: '최예린', role: '청년' },
  { name: '정다은', role: '새가족' }, { name: '한서준', role: '새가족' },
  { name: '강미정', role: '장년' }, { name: '윤성호', role: '장년' },
  { name: '오영희', role: '권사' }, { name: '임장로', role: '장로' },
  { name: '송은혜', role: '여선교' }, { name: '배철수', role: '남선교' },
  { name: '김영수', role: '목사' }, { name: '이성호', role: '목사' },
  { name: '박지은', role: '전도사' }, { name: '최하나', role: '전도사' },
  { name: '노수빈', role: '성도' }, { name: '홍길동', role: '성도' },
  { name: '서미라', role: '중보기도팀' }, { name: '장민호', role: '찬양팀' },
  { name: '유진아', role: '고등부' }, { name: '문태양', role: '중등부' },
  { name: '신가영', role: '직분자' }, { name: '조현우', role: '직분자' },
];

const COMMENT_SAMPLES = [
  '은혜로운 나눔 감사합니다.',
  '함께 묵상하며 힘을 얻었습니다.',
  '말씀이 마음에 와닿네요.',
  '같은 말씀으로 위로받았습니다.',
  '기도하겠습니다.',
  '아멘, 믿음이 자랍니다.',
  '나눔해 주셔서 감사합니다.',
  '주님께 영광 돌립니다.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomPastDate(): string {
  const roll = Math.random();
  let daysAgo: number;
  if (roll < 0.08) daysAgo = 0;
  else if (roll < 0.15) daysAgo = 1;
  else if (roll < 0.35) daysAgo = randInt(2, 6);
  else if (roll < 0.5) daysAgo = randInt(7, 13);
  else if (roll < 0.7) daysAgo = randInt(14, 45);
  else daysAgo = randInt(46, 200);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(6, 22), randInt(0, 59), 0, 0);
  return d.toISOString();
}

function withKeyword(text: string): string {
  if (Math.random() < 0.6) {
    const kw = pick(SEARCH_KEYWORDS);
    return `${text} ${kw}의 은혜를 기억합니다.`;
  }
  return text;
}

function makeComments(count: number, baseDate: string): GraceNoteComment[] {
  const result: GraceNoteComment[] = [];
  const base = new Date(baseDate).getTime();
  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    const type = typeRoll < 0.35 ? 'prayer' as const
      : typeRoll < 0.55 ? 'amen' as const
        : 'comment' as const;
    const author = pick(AUTHORS);
    result.push({
      id: `gnc-seed-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
      authorName: author.name,
      content: type === 'prayer' ? '기도합니다' : type === 'amen' ? '아멘' : pick(COMMENT_SAMPLES),
      type,
      createdAt: new Date(base + (i + 1) * 3600000).toISOString(),
    });
  }
  return result;
}

function pickVisibility(): {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
} {
  const roll = Math.random();
  const clergy = getAllClergy().filter(c => c.status === 'active').slice(0, 8);
  const districts = getDistricts();
  const departments = getDepartments();

  if (roll < 0.40) {
    return { visibility: 'private', sharedPastorAll: false, sharedPastorIds: [], sharedGroupAll: false, sharedGroupIds: [] };
  }
  if (roll < 0.55) {
    const all = Math.random() < 0.3;
    const ids = all ? [] : clergy.sort(() => Math.random() - 0.5).slice(0, randInt(1, 3)).map(c => c.id);
    return { visibility: 'pastor', sharedPastorAll: all, sharedPastorIds: ids, sharedGroupAll: false, sharedGroupIds: [] };
  }
  if (roll < 0.70) {
    const all = Math.random() < 0.25;
    const groupPool = [...districts.map(d => d.id), ...departments.map(d => d.id)];
    const ids = all ? [] : groupPool.sort(() => Math.random() - 0.5).slice(0, randInt(1, 4));
    return { visibility: 'group', sharedPastorAll: false, sharedPastorIds: [], sharedGroupAll: all, sharedGroupIds: ids };
  }
  return { visibility: 'public', sharedPastorAll: false, sharedPastorIds: [], sharedGroupAll: false, sharedGroupIds: [] };
}

// ─── Reading progress seed ────────────────────────────────────────────────────

function ensureDemoReadingProgresses(): void {
  try {
    if (localStorage.getItem(LS_PROGRESS_SEEDED) === '1') return;
    const existing = getAllProgresses().filter(p => p.status === 'active');
    if (existing.length >= 2) {
      localStorage.setItem(LS_PROGRESS_SEEDED, '1');
      return;
    }
  } catch { /* ignore */ }

  const now = new Date().toISOString();
  const progresses: ReadingProgress[] = READING_PLANS_DEMO.map((p, i) => {
    const plan = READING_PLANS.find(r => r.id === p.id)!;
    const currentDay = Math.max(1, Math.round(plan.durationDays * p.pct / 100));
    const completedDays = Array.from({ length: currentDay - 1 }, (_, j) => j + 1);
    return {
      id: `demo-progress-${p.id}`,
      planId: p.id,
      planName: p.name,
      startDay: 1,
      currentDay,
      completedDays,
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

// ─── Note generators ──────────────────────────────────────────────────────────

function generateSermonNotes(count: number, startIdx: number): GraceNote[] {
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(AUTHORS);
    const createdAt = randomPastDate();
    const share = pickVisibility();
    const isPublic = share.visibility !== 'private';
    const commentCount = isPublic ? randInt(0, 5) : 0;
    const comments = makeComments(commentCount, createdAt);
    const prayCount = comments.filter(c => c.type === 'prayer').length;
    const amenCount = comments.filter(c => c.type === 'amen').length;

    notes.push({
      id: `gn-demo-s-${startIdx + i}`,
      authorName: author.name,
      authorRole: author.role,
      type: 'sermon',
      visibility: share.visibility,
      sharedPastorAll: share.sharedPastorAll,
      sharedPastorIds: share.sharedPastorIds,
      sharedGroupAll: share.sharedGroupAll,
      sharedGroupIds: share.sharedGroupIds,
      sermonTitle: pick(SERMON_TITLES),
      sermonPreacher: pick(['김영수 목사', '이성호 목사', '박민수 목사', '정현우 목사']),
      sermonDate: createdAt.slice(0, 10),
      bibleReference: `${pick(['요한복음', '로마서', '시편', '에베소서', '히브리서'])} ${randInt(1, 12)}:${randInt(1, 30)}`,
      memorableVerse: pick(SERMON_SNIPPETS),
      graceContent: withKeyword(`"${pick(SERMON_SNIPPETS)}"`),
      application: '이 말씀을 이번 주 삶에 적용하겠습니다.',
      prayer: '주님, 말씀대로 살아가게 도와주세요.',
      likeCount: isPublic ? randInt(0, 24) : 0,
      prayCount,
      amenCount,
      comments,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return notes;
}

function generateReadingNotes(count: number, startIdx: number): GraceNote[] {
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(AUTHORS);
    const createdAt = randomPastDate();
    const share = pickVisibility();
    const isPublic = share.visibility !== 'private';
    const planDemo = pick(READING_PLANS_DEMO);
    const plan = READING_PLANS.find(p => p.id === planDemo.id)!;
    const passage = pick(BIBLE_PASSAGES);
    const commentCount = isPublic ? randInt(0, 4) : 0;
    const comments = makeComments(commentCount, createdAt);

    notes.push({
      id: `gn-demo-r-${startIdx + i}`,
      authorName: author.name,
      authorRole: author.role,
      type: 'reading',
      visibility: share.visibility,
      sharedPastorAll: share.sharedPastorAll,
      sharedPastorIds: share.sharedPastorIds,
      sharedGroupAll: share.sharedGroupAll,
      sharedGroupIds: share.sharedGroupIds,
      sourceId: `demo-progress-${planDemo.id}`,
      sourceTitle: planDemo.name,
      planId: plan.id,
      planName: plan.name,
      planColor: plan.color,
      day: randInt(1, plan.durationDays),
      bibleReference: passage,
      memorableVerse: `${passage} 말씀`,
      graceContent: withKeyword(pick(READING_REFLECTIONS)),
      application: '오늘 읽은 말씀을 하루 삶에 적용하겠습니다.',
      prayer: '말씀으로 인도해 주소서.',
      likeCount: isPublic ? randInt(0, 18) : 0,
      prayCount: comments.filter(c => c.type === 'prayer').length,
      amenCount: comments.filter(c => c.type === 'amen').length,
      comments,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return notes;
}

function generatePersonalNotes(count: number, startIdx: number): GraceNote[] {
  const notes: GraceNote[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(AUTHORS);
    const createdAt = randomPastDate();
    const share = pickVisibility();
    const isPublic = share.visibility !== 'private';
    const topic = pick(PERSONAL_TOPICS);
    const commentCount = isPublic ? randInt(0, 4) : 0;
    const comments = makeComments(commentCount, createdAt);

    notes.push({
      id: `gn-demo-p-${startIdx + i}`,
      authorName: author.name,
      authorRole: author.role,
      type: 'personal',
      visibility: share.visibility,
      sharedPastorAll: share.sharedPastorAll,
      sharedPastorIds: share.sharedPastorIds,
      sharedGroupAll: share.sharedGroupAll,
      sharedGroupIds: share.sharedGroupIds,
      memorableVerse: '',
      graceContent: withKeyword(`[${topic}] ${pick(PERSONAL_SNIPPETS)}`),
      application: '',
      prayer: '감사와 찬양을 드립니다.',
      likeCount: isPublic ? randInt(0, 15) : 0,
      prayCount: comments.filter(c => c.type === 'prayer').length,
      amenCount: comments.filter(c => c.type === 'amen').length,
      comments,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return notes;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateGraceNoteDemoData(): GraceNote[] {
  const sermon = generateSermonNotes(100, 0);
  const reading = generateReadingNotes(120, 0);
  const personal = generatePersonalNotes(80, 0);
  return [...sermon, ...reading, ...personal].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 데모 데이터가 없으면 300건 + 통독 진행 데이터 생성 */
export function ensureGraceNoteDemoData(): void {
  ensureDemoReadingProgresses();
  if (isDemoGraceNotesSeeded()) return;
  try {
    const raw = localStorage.getItem('graceNotesV2');
    const existingCount = raw ? (JSON.parse(raw) as unknown[]).length : 0;
    if (existingCount >= 20) {
      markDemoGraceNotesSeeded();
      return;
    }
    const notes = generateGraceNoteDemoData();
    replaceAllGraceNotes(notes);
    markDemoGraceNotesSeeded();
  } catch { /* ignore */ }
}

/** 개발/테스트용 — 데모 데이터 강제 재생성 */
export function resetGraceNoteDemoData(): void {
  try {
    localStorage.removeItem('graceNotesV2_demo_seeded');
    localStorage.removeItem(LS_PROGRESS_SEEDED);
  } catch { /* ignore */ }
  ensureGraceNoteDemoData();
}

/** 공유 대상 교역자 이름 라벨 */
export function formatSharedPastorLabel(note: GraceNote): string {
  if (note.visibility !== 'pastor') return '';
  if (note.sharedPastorAll) return '담당 교역자 전체';
  const names = (note.sharedPastorIds ?? [])
    .map(id => getAllClergy().find(c => c.id === id))
    .filter(Boolean)
    .map(c => `${c!.name} ${positionLabel(c!)}`);
  return names.length > 0 ? names.join(', ') : '담당 교역자';
}

/** 공유 대상 교구/부서 라벨 */
export function formatSharedGroupLabel(note: GraceNote): string {
  if (note.visibility !== 'group') return '';
  if (note.sharedGroupAll) return '교구/부서 전체';
  const districts = getDistricts();
  const departments = getDepartments();
  const names = (note.sharedGroupIds ?? []).map(id => {
    const d = districts.find(x => x.id === id);
    if (d) return d.name;
    const dep = departments.find(x => x.id === id);
    return dep?.name;
  }).filter(Boolean) as string[];
  return names.length > 0 ? names.join(', ') : '교구/부서';
}
