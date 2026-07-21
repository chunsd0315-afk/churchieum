/**
 * Demo data generator — 교회이음 테스트용 데이터 자동 생성
 * localStorage 기반. 실제 서비스처럼 보이도록 구성.
 */

import { saveDistricts, saveZones, saveDepartments } from './orgData';
import type { OrgDistrict, OrgZone, OrgDepartment } from './orgData';

const LS_KEY = 'churchieum_demo_generated_v2';

// ─── Name pools ───────────────────────────────────────────────────────────────
const FAMILY_NAMES = ['김','이','박','최','정','강','조','윤','장','임','오','한','신','서','권','황','안','송','류','홍'];
const GIVEN_M = ['민준','서준','도윤','예준','시우','주원','하준','지호','지훈','준서','준우','현우','도현','건우','우진'];
const GIVEN_F = ['서연','서윤','지우','서현','하은','하린','수아','지아','채원','소윤','지유','나은','다은','예린','수빈'];
const POSITIONS_CLERGY = ['담임목사','부목사','전도사','교육전도사','선교사'];
const POSITIONS_MEMBER = ['장로','권사','안수집사','서리집사','성도','성도','성도','성도','성도','성도'];
const BIBLE_BOOKS = ['창세기','시편','잠언','요한복음','로마서','빌립보서','고린도전서','갈라디아서','에베소서','야고보서'];
const BIBLE_REFS = ['1:1','3:16','23:1','119:105','5:22','4:13','8:28','2:20','6:10','1:5'];
const SERMON_TITLES = ['말씀 위에 세워진 삶','믿음으로 나아가라','하나님의 은혜','새로운 시작','사랑의 실천','감사하는 삶','기도의 능력','성령의 열매','하나님의 계획','믿음의 승리'];
const NOTICE_TITLES = ['주일예배 안내','구역 모임 공지','특별새벽기도회','봉사자 모집','성경공부 안내','교회 행사 안내','헌금 관련 안내','기도 제목','새가족 환영','청년부 수련회'];
const QT_TITLES = ['오늘의 은혜','말씀 묵상','새벽 기도','저녁 기도','주일 묵상','감사 일기','하나님과의 대화','말씀으로 시작하는 하루','은혜로운 하루','말씀이 삶이 되다'];
const ALBUM_NAMES = ['주일예배','수련회 사진','봉사 활동','성탄절 행사','부활절 예배','구역 모임','청년부 행사','찬양 집회','세례 예식','교회 야유회'];
const EVENT_NAMES = ['주일예배','수요예배','금요기도회','청년부 모임','구역 예배','봉사 활동','성경공부','새벽기도회','특별집회','교육 세미나'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function range(n: number) { return Array.from({ length: n }, (_, i) => i); }
function randInt(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }
function pastDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}
function randName(gender: 'male' | 'female') {
  const given = gender === 'male' ? pick(GIVEN_M) : pick(GIVEN_F);
  return pick(FAMILY_NAMES) + given;
}
function randPhone() {
  return `010-${randInt(1000,9999)}-${randInt(1000,9999)}`;
}
function randBirthYear(minAge: number, maxAge: number) {
  const year = new Date().getFullYear() - randInt(minAge, maxAge);
  return `${year}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`;
}

// ─── Types for generated data ─────────────────────────────────────────────────
export type DemoClergy = {
  id: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  districtId?: string;
  districtName?: string;
  zoneId?: string;
  zoneName?: string;
  deptId?: string;
  deptName?: string;
  status: 'active' | 'invited';
  joinDate: string;
  bio?: string;
};

export type DemoMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  birthDate: string;
  position: string;
  districtId: string;
  districtName: string;
  zoneId: string;
  zoneName: string;
  deptId: string;
  deptName: string;
  departmentIds: string[];
  memberStatus: '활동중' | '새가족' | '가입대기' | '장기결석' | '전출';
  joinDate: string;
  lastAttendance?: string;
  lastQt?: string;
  baptismDate?: string;
  address?: string;
};

export type DemoQtEntry = {
  id: string;
  memberId: string;
  memberName: string;
  districtId: string;
  districtName: string;
  zoneId: string;
  zoneName: string;
  deptId: string;
  deptName: string;
  title: string;
  bibleVerse: string;
  content: string;
  date: string;
  visibility: 'private' | 'pastor' | 'public';
};

export type DemoAnnouncement = {
  id: string;
  title: string;
  content: string;
  category: '일반공지' | '행사안내' | '가정통신문' | '기타';
  scope: 'all' | 'level1' | 'level2' | 'department';
  scopeId?: string;
  scopeName?: string;
  date: string;
  isPinned: boolean;
  isImportant: boolean;
  author: string;
};

export type DemoAlbum = {
  id: string;
  name: string;
  date: string;
  photoCount: number;
  coverUrl: string;
  description: string;
};

export type DemoEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  description: string;
};

export type DemoSermon = {
  id: string;
  title: string;
  preacher: string;
  bibleVerse: string;
  date: string;
  summary: string;
};

export type DemoData = {
  districts: OrgDistrict[];
  zones: OrgZone[];
  departments: OrgDepartment[];
  clergy: DemoClergy[];
  members: DemoMember[];
  qtEntries: DemoQtEntry[];
  announcements: DemoAnnouncement[];
  albums: DemoAlbum[];
  events: DemoEvent[];
  sermons: DemoSermon[];
};

// ─── Generator ────────────────────────────────────────────────────────────────
function generate(): DemoData {
  // Use the same org IDs that orgData.ts defaults use, so all pages stay in sync.
  const districts: OrgDistrict[] = [
    { id: 'd1', name: '1교구', leader_name: '김성기 목사',   description: '서울 북부', is_active: true, sort_order: 1 },
    { id: 'd2', name: '2교구', leader_name: '이준혁 목사',   description: '서울 중부', is_active: true, sort_order: 2 },
    { id: 'd3', name: '3교구', leader_name: '박성실 전도사', description: '서울 남부', is_active: true, sort_order: 3 },
  ];

  const zones: OrgZone[] = [
    { id: 'z1', district_id: 'd1', name: '1구역', leader_name: '홍길동', is_active: true, sort_order: 1 },
    { id: 'z2', district_id: 'd1', name: '2구역', leader_name: '김영희', is_active: true, sort_order: 2 },
    { id: 'z3', district_id: 'd2', name: '3구역', leader_name: '박철수', is_active: true, sort_order: 1 },
    { id: 'z4', district_id: 'd2', name: '4구역', leader_name: '이민정', is_active: true, sort_order: 2 },
    { id: 'z5', district_id: 'd3', name: '5구역', leader_name: '최수빈', is_active: true, sort_order: 1 },
  ];

  const departments: OrgDepartment[] = [
    { id: 'dep1', name: '청년부',   leader_name: '정다은 전도사',    description: '20-30대 청년',   is_active: true, sort_order: 1 },
    { id: 'dep2', name: '주일학교', leader_name: '한기범 교육전도사', description: '유초등부',       is_active: true, sort_order: 2 },
    { id: 'dep3', name: '여성부',   leader_name: '장은희 권사',       description: '여성 성도 모임', is_active: true, sort_order: 3 },
    { id: 'dep4', name: '남성부',   leader_name: '오성민 집사',       description: '남성 성도 모임', is_active: true, sort_order: 4 },
    { id: 'dep5', name: '찬양팀',   leader_name: '송민아 집사',       description: '예배 찬양 인도', is_active: true, sort_order: 5 },
    { id: 'dep6', name: '선교부',   leader_name: '임국진 장로',       description: '국내외 선교',    is_active: true, sort_order: 6 },
  ];

  // Clergy — 20명
  const clergy: DemoClergy[] = range(20).map((_, i) => {
    const gender = i % 3 === 0 ? 'female' : 'male';
    const district = pick(districts);
    const zonesInDistrict = zones.filter(z => z.district_id === district.id);
    const zone = pick(zonesInDistrict);
    const dept = pick(departments);
    const position = i === 0 ? '담임목사' : pick(POSITIONS_CLERGY.slice(1));
    return {
      id: `clergy-${i+1}`,
      name: randName(gender as 'male' | 'female'),
      phone: randPhone(),
      email: `pastor${i+1}@churchieum.com`,
      position,
      districtId: district.id,
      districtName: district.name,
      zoneId: zone.id,
      zoneName: zone.name,
      deptId: dept.id,
      deptName: dept.name,
      status: 'active' as const,
      joinDate: pastDate(randInt(365, 3650)),
    };
  });

  // Members — 100명 (index 59 = member-60 천성대 고정)
  const STATUSES: DemoMember['memberStatus'][] = ['활동중','활동중','활동중','활동중','활동중','활동중','활동중','새가족','가입대기','장기결석'];
  const members: DemoMember[] = range(100).map((_, i) => {
    if (i === 59) {
      return {
        id: 'member-60',
        name: '천성대',
        phone: '010-7056-9354',
        email: 'member60@demo.com',
        gender: 'male',
        birthDate: '1971-10-11',
        position: '장로',
        districtId: 'd1',
        districtName: '1교구',
        zoneId: 'z3',
        zoneName: '3구역',
        deptId: 'dep3',
        deptName: '여성부',
        departmentIds: ['dep3', 'dep5'],
        memberStatus: '활동중',
        joinDate: pastDate(365 * 5),
        lastAttendance: pastDate(0),
        lastQt: pastDate(1),
        baptismDate: '2000-04-16',
        address: '',
      };
    }
    const gender: 'male' | 'female' = i % 2 === 0 ? 'male' : 'female';
    const district = pick(districts);
    const zonesInDistrict = zones.filter(z => z.district_id === district.id);
    const zone = pick(zonesInDistrict);
    const dept = pick(departments);
    const status = pick(STATUSES);
    const daysAgo = randInt(0, 30);
    return {
      id: `member-${i+1}`,
      name: randName(gender),
      phone: randPhone(),
      email: `member${i+1}@demo.com`,
      gender,
      birthDate: randBirthYear(20, 75),
      position: pick(POSITIONS_MEMBER),
      districtId: district.id,
      districtName: district.name,
      zoneId: zone.id,
      zoneName: zone.name,
      deptId: dept.id,
      deptName: dept.name,
      memberStatus: status,
      joinDate: pastDate(randInt(30, 3650)),
      lastAttendance: status !== '전출' ? pastDate(daysAgo) : undefined,
      lastQt: Math.random() > 0.4 ? pastDate(randInt(0, 14)) : undefined,
      departmentIds: Math.random() > 0.3 ? [dept.id, ...(Math.random() > 0.7 ? [pick(departments).id] : [])] : [dept.id],
      baptismDate: Math.random() > 0.4 ? pastDate(randInt(365, 7300)) : undefined,
      address: '',
    };
  });

  // QT entries — 100개
  const qtEntries: DemoQtEntry[] = range(100).map((_, i) => {
    const member = pick(members);
    const bookIdx = randInt(0, BIBLE_BOOKS.length - 1);
    const vis = pick(['private','pastor','pastor','public','public'] as const);
    return {
      id: `qt-${i+1}`,
      memberId: member.id,
      memberName: member.name,
      districtId: member.districtId,
      districtName: member.districtName,
      zoneId: member.zoneId,
      zoneName: member.zoneName,
      deptId: member.deptId,
      deptName: member.deptName,
      title: pick(QT_TITLES),
      bibleVerse: `${BIBLE_BOOKS[bookIdx]} ${BIBLE_REFS[bookIdx % BIBLE_REFS.length]}`,
      content: `오늘 ${BIBLE_BOOKS[bookIdx]}에서 하나님의 말씀을 묵상하며 깊은 은혜를 받았습니다. 말씀이 삶에 어떻게 적용되는지 생각해 보았습니다.`,
      date: pastDate(randInt(0, 90)),
      visibility: vis,
    };
  });

  // Announcements — 100개
  const CATS: DemoAnnouncement['category'][] = ['일반공지','행사안내','가정통신문','기타'];
  const announcements: DemoAnnouncement[] = range(100).map((_, i) => {
    const district = pick(districts);
    const scope = pick(['all','all','all','level1','level2','department'] as const);
    return {
      id: `ann-${i+1}`,
      title: pick(NOTICE_TITLES) + (i > 0 ? ` (${i+1})` : ''),
      content: `교회이음 공지사항입니다. 아래 내용을 확인해 주시기 바랍니다.\n\n자세한 내용은 교역자에게 문의하세요.`,
      category: pick(CATS),
      scope,
      scopeId: scope !== 'all' ? district.id : undefined,
      scopeName: scope !== 'all' ? district.name : undefined,
      date: pastDate(randInt(0, 60)),
      isPinned: i < 2,
      isImportant: i < 5,
      author: pick(clergy.slice(0, 5)).name,
    };
  });

  // Albums — 20개
  const PEXELS_IDS = [1055691,1089885,1616403,1261731,1438761,1619854,2709388,3184291,3184338,3184460,3280908,3747440,3769021,4050289,4148897,4253957,4262852,4348401,4350212,5092589];
  const albums: DemoAlbum[] = range(20).map((_, i) => ({
    id: `album-${i+1}`,
    name: pick(ALBUM_NAMES) + (i > 0 ? ` ${Math.floor(i/2)+1}` : ''),
    date: pastDate(randInt(0, 180)),
    photoCount: randInt(5, 30),
    coverUrl: `https://images.pexels.com/photos/${PEXELS_IDS[i % PEXELS_IDS.length]}/pexels-photo-${PEXELS_IDS[i % PEXELS_IDS.length]}.jpeg?auto=compress&cs=tinysrgb&w=400`,
    description: '교회 공동체 사진 앨범입니다.',
  }));

  // Events — 50개
  const LOCATIONS = ['본당','소예배실','교육관','카페','야외','교회 앞','1층 로비'];
  const events: DemoEvent[] = range(50).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + randInt(-30, 60));
    return {
      id: `event-${i+1}`,
      title: pick(EVENT_NAMES) + (i > 0 ? ` (${i+1})` : ''),
      date: d.toISOString().split('T')[0],
      startTime: `${String(randInt(6, 19)).padStart(2,'0')}:00`,
      endTime: `${String(randInt(20, 22)).padStart(2,'0')}:00`,
      location: pick(LOCATIONS),
      category: pick(['예배','교육','봉사','친교','기타']),
      description: '교회 일정입니다. 많은 참여 바랍니다.',
    };
  });

  // Sermons — 50개
  const sermons: DemoSermon[] = range(50).map((_, i) => {
    const bookIdx = randInt(0, BIBLE_BOOKS.length - 1);
    const preacher = pick(clergy.filter(c => ['담임목사','부목사'].includes(c.position)));
    return {
      id: `sermon-${i+1}`,
      title: pick(SERMON_TITLES) + (i > 0 ? ` ${i+1}` : ''),
      preacher: preacher?.name ?? '담임목사',
      bibleVerse: `${BIBLE_BOOKS[bookIdx]} ${BIBLE_REFS[bookIdx % BIBLE_REFS.length]}`,
      date: pastDate(randInt(0, 365)),
      summary: '오늘의 말씀을 통해 하나님의 은혜와 사랑을 깊이 느낄 수 있는 귀한 시간이었습니다.',
    };
  });

  return { districts, zones, departments, clergy, members, qtEntries, announcements, albums, events, sermons };
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _cache: DemoData | null = null;

export function getDemoData(): DemoData {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoData;
      // Invalidate cache if it uses the old ID format (dist-1, dept-1, zone-dist-1-1)
      const hasOldIds = parsed.districts?.some(d => d.id.startsWith('dist-'))
        || parsed.departments?.some(d => d.id.startsWith('dept-'))
        || parsed.zones?.some(z => z.id.startsWith('zone-'));
      if (!hasOldIds) {
        _cache = parsed;
        return _cache;
      }
      // Old format — regenerate
      localStorage.removeItem(LS_KEY);
    }
  } catch { /**/ }
  return generateAndSave();
}

export function generateAndSave(): DemoData {
  const data = generate();
  _cache = data;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    // Also seed org data so other pages see it
    saveDistricts(data.districts);
    saveZones(data.zones);
    saveDepartments(data.departments);
  } catch { /**/ }
  return data;
}

export function updateDemoMember(id: string, patch: Partial<DemoMember>): void {
  const data = getDemoData();
  const idx = data.members.findIndex(m => m.id === id);
  if (idx === -1) return;
  data.members[idx] = { ...data.members[idx], ...patch };
  _cache = data;
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /**/ }

  // Sync churchieum_demo_user if the updated member's email matches the logged-in user
  const updated = data.members[idx];
  try {
    const raw = localStorage.getItem('churchieum_demo_user');
    if (raw) {
      const authUser = JSON.parse(raw);
      if (authUser.email && updated.email &&
          authUser.email.toLowerCase() === updated.email.toLowerCase()) {
        const synced = {
          ...authUser,
          name: updated.name ?? authUser.name,
          position: updated.position ?? authUser.position,
          phone: updated.phone ?? authUser.phone,
          districtId: updated.districtId ?? authUser.districtId,
          zoneId: updated.zoneId ?? authUser.zoneId,
          departmentIds: updated.departmentIds ?? authUser.departmentIds,
        };
        localStorage.setItem('churchieum_demo_user', JSON.stringify(synced));
      }
    }
  } catch { /**/ }
}

export function clearDemoData() {
  localStorage.removeItem(LS_KEY);
  _cache = null;
}

export function isDemoDataGenerated(): boolean {
  return !!localStorage.getItem(LS_KEY);
}
