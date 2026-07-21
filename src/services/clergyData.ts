/**
 * clergyData — localStorage-backed clergy + staff assignment store
 */

import {
  getDistrictNameById,
  getZoneNameById,
  getDepartmentNameById,
} from './orgData';

const LS_CLERGY      = 'clergy_v1';
const LS_ASSIGNMENTS = 'staff_assignments_v1';

export type ClergyStatus = 'active' | 'invited' | 'pending' | 'resigned';

export type ClergyMember = {
  id: string;
  name: string;
  position: string;          // 담임목사 | 목사 | 전도사 | 교육전도사 | 간사 | 직원 | 기타
  customPosition?: string;   // when position === '기타'
  gender?: '남' | '여';
  phone?: string;
  email?: string;
  address?: string;
  profileImage?: string;
  bio?: string;
  status: ClergyStatus;
  isChief: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentType = 'district' | 'zone' | 'department' | 'mixed';

export type StaffAssignment = {
  id: string;
  pastorId: string;
  districtId?: string;
  districtName?: string;
  zoneId?: string;
  zoneName?: string;
  departmentId?: string;
  departmentName?: string;
  assignmentType: AssignmentType;
  createdAt: string;
  isActive: boolean;
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEFAULT_CLERGY: ClergyMember[] = [
  { id: 'cl1',  name: '정재명', position: '목사',       gender: '남', phone: '010-1000-0001', email: 'pastor01@churchieum.com', address: '서울시 강남구 테헤란로 101',   status: 'active', isChief: true,  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cl2',  name: '이변우', position: '목사',       gender: '남', phone: '010-1000-0002', email: 'pastor02@churchieum.com', address: '서울시 서초구 반포대로 202',   status: 'active', isChief: false, createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { id: 'cl3',  name: '박민수', position: '목사',       gender: '남', phone: '010-1000-0003', email: 'pastor03@churchieum.com', address: '서울시 송파구 올림픽로 303',   status: 'active', isChief: false, createdAt: '2024-02-15T00:00:00Z', updatedAt: '2024-02-15T00:00:00Z' },
  { id: 'cl4',  name: '정현우', position: '목사',       gender: '남', phone: '010-1000-0004', email: 'pastor04@churchieum.com', address: '서울시 마포구 월드컵로 404',   status: 'active', isChief: false, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  { id: 'cl5',  name: '최준호', position: '목사',       gender: '남', phone: '010-1000-0005', email: 'pastor05@churchieum.com', address: '서울시 영등포구 여의대로 505', status: 'active', isChief: false, createdAt: '2024-03-15T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z' },
  { id: 'cl6',  name: '김은혜', position: '전도사',     gender: '여', phone: '010-1000-0006', email: 'pastor06@churchieum.com', address: '서울시 용산구 이태원로 606',   status: 'active', isChief: false, createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-01T00:00:00Z' },
  { id: 'cl7',  name: '박지은', position: '전도사',     gender: '여', phone: '010-1000-0007', email: 'pastor07@churchieum.com', address: '서울시 동작구 상도로 707',     status: 'active', isChief: false, createdAt: '2024-04-15T00:00:00Z', updatedAt: '2024-04-15T00:00:00Z' },
  { id: 'cl8',  name: '이수진', position: '전도사',     gender: '여', phone: '010-1000-0008', email: 'pastor08@churchieum.com', address: '서울시 관악구 남부순환로 808', status: 'active', isChief: false, createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
  { id: 'cl9',  name: '최하나', position: '전도사',     gender: '여', phone: '010-1000-0009', email: 'pastor09@churchieum.com', address: '서울시 강서구 공항대로 909',   status: 'active', isChief: false, createdAt: '2024-05-15T00:00:00Z', updatedAt: '2024-05-15T00:00:00Z' },
  { id: 'cl10', name: '강다은', position: '전도사',     gender: '여', phone: '010-1000-0010', email: 'pastor10@churchieum.com', address: '서울시 노원구 동일로 1010',    status: 'active', isChief: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
  { id: 'cl11', name: '오예린', position: '전도사',     gender: '여', phone: '010-1000-0011', email: 'pastor11@churchieum.com', address: '서울시 성북구 정릉로 1111',    status: 'active', isChief: false, createdAt: '2024-06-15T00:00:00Z', updatedAt: '2024-06-15T00:00:00Z' },
  { id: 'cl12', name: '김도현', position: '교육전도사', gender: '남', phone: '010-1000-0012', email: 'pastor12@churchieum.com', address: '서울시 은평구 통일로 1212',    status: 'active', isChief: false, createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z' },
  { id: 'cl13', name: '이준혁', position: '교육전도사', gender: '남', phone: '010-1000-0013', email: 'pastor13@churchieum.com', address: '서울시 도봉구 도봉로 1313',    status: 'active', isChief: false, createdAt: '2024-07-15T00:00:00Z', updatedAt: '2024-07-15T00:00:00Z' },
  { id: 'cl14', name: '박예린', position: '교육전도사', gender: '여', phone: '010-1000-0014', email: 'pastor14@churchieum.com', address: '서울시 중랑구 겸재로 1414',    status: 'active', isChief: false, createdAt: '2024-08-01T00:00:00Z', updatedAt: '2024-08-01T00:00:00Z' },
  { id: 'cl15', name: '한지은', position: '교육전도사', gender: '여', phone: '010-1000-0015', email: 'pastor15@churchieum.com', address: '서울시 광진구 자양로 1515',    status: 'active', isChief: false, createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'cl16', name: '장미정', position: '간사',       gender: '여', phone: '010-1000-0016', email: 'pastor16@churchieum.com', address: '서울시 강동구 천호대로 1616',  status: 'active', isChief: false, createdAt: '2024-09-01T00:00:00Z', updatedAt: '2024-09-01T00:00:00Z' },
  { id: 'cl17', name: '윤서영', position: '간사',       gender: '여', phone: '010-1000-0017', email: 'pastor17@churchieum.com', address: '서울시 성동구 왕십리로 1717',  status: 'active', isChief: false, createdAt: '2024-09-15T00:00:00Z', updatedAt: '2024-09-15T00:00:00Z' },
  { id: 'cl18', name: '김태현', position: '간사',       gender: '남', phone: '010-1000-0018', email: 'pastor18@churchieum.com', address: '서울시 종로구 율곡로 1818',    status: 'active', isChief: false, createdAt: '2024-10-01T00:00:00Z', updatedAt: '2024-10-01T00:00:00Z' },
  { id: 'cl19', name: '박성민', position: '직원',       gender: '남', phone: '010-1000-0019', email: 'pastor19@churchieum.com', address: '서울시 중구 을지로 1919',      status: 'active', isChief: false, createdAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'cl20', name: '이가영', position: '직원',       gender: '여', phone: '010-1000-0020', email: 'pastor20@churchieum.com', address: '서울시 금천구 시흥대로 2020',  status: 'active', isChief: false, createdAt: '2024-11-01T00:00:00Z', updatedAt: '2024-11-01T00:00:00Z' },
];

const DEFAULT_ASSIGNMENTS: StaffAssignment[] = [
  // cl1 정재명: 1교구, 장년부
  { id: 'sa1',  pastorId: 'cl1',  districtId: 'd1',   districtName: '1교구',    assignmentType: 'district',   createdAt: '2024-01-01T00:00:00Z', isActive: true },
  { id: 'sa2',  pastorId: 'cl1',  departmentId: 'dep2', departmentName: '장년부', assignmentType: 'department', createdAt: '2024-01-01T00:00:00Z', isActive: true },
  // cl2 이변우: 2교구, 청년부
  { id: 'sa3',  pastorId: 'cl2',  districtId: 'd2',   districtName: '2교구',    assignmentType: 'district',   createdAt: '2024-02-01T00:00:00Z', isActive: true },
  { id: 'sa4',  pastorId: 'cl2',  departmentId: 'dep1', departmentName: '청년부', assignmentType: 'department', createdAt: '2024-02-01T00:00:00Z', isActive: true },
  // cl3 박민수: 3교구, 찬양대
  { id: 'sa5',  pastorId: 'cl3',  districtId: 'd3',   districtName: '3교구',    assignmentType: 'district',   createdAt: '2024-02-15T00:00:00Z', isActive: true },
  { id: 'sa6',  pastorId: 'cl3',  departmentId: 'dep3', departmentName: '찬양대', assignmentType: 'department', createdAt: '2024-02-15T00:00:00Z', isActive: true },
  // cl4 정현우: 4교구, 남선교회
  { id: 'sa7',  pastorId: 'cl4',  districtId: 'd4',   districtName: '4교구',    assignmentType: 'district',   createdAt: '2024-03-01T00:00:00Z', isActive: true },
  { id: 'sa8',  pastorId: 'cl4',  departmentId: 'dep4', departmentName: '남선교회', assignmentType: 'department', createdAt: '2024-03-01T00:00:00Z', isActive: true },
  // cl5 최준호: 1교구, 여선교회
  { id: 'sa9',  pastorId: 'cl5',  districtId: 'd1',   districtName: '1교구',    assignmentType: 'district',   createdAt: '2024-03-15T00:00:00Z', isActive: true },
  { id: 'sa10', pastorId: 'cl5',  departmentId: 'dep5', departmentName: '여선교회', assignmentType: 'department', createdAt: '2024-03-15T00:00:00Z', isActive: true },
  // cl6 김은혜: 유아부, 유치부
  { id: 'sa11', pastorId: 'cl6',  departmentId: 'dep6',  departmentName: '유아부', assignmentType: 'department', createdAt: '2024-04-01T00:00:00Z', isActive: true },
  { id: 'sa12', pastorId: 'cl6',  departmentId: 'dep7',  departmentName: '유치부', assignmentType: 'department', createdAt: '2024-04-01T00:00:00Z', isActive: true },
  // cl7 박지은: 유초등부
  { id: 'sa13', pastorId: 'cl7',  departmentId: 'dep8',  departmentName: '유초등부', assignmentType: 'department', createdAt: '2024-04-15T00:00:00Z', isActive: true },
  // cl8 이수진: 중등부
  { id: 'sa14', pastorId: 'cl8',  departmentId: 'dep9',  departmentName: '중등부', assignmentType: 'department', createdAt: '2024-05-01T00:00:00Z', isActive: true },
  // cl9 최하나: 고등부
  { id: 'sa15', pastorId: 'cl9',  departmentId: 'dep10', departmentName: '고등부', assignmentType: 'department', createdAt: '2024-05-15T00:00:00Z', isActive: true },
  // cl10 강다은: 청년부
  { id: 'sa16', pastorId: 'cl10', departmentId: 'dep1',  departmentName: '청년부', assignmentType: 'department', createdAt: '2024-06-01T00:00:00Z', isActive: true },
  // cl11 오예린: 브릿지선교회
  { id: 'sa17', pastorId: 'cl11', departmentId: 'dep11', departmentName: '브릿지선교회', assignmentType: 'department', createdAt: '2024-06-15T00:00:00Z', isActive: true },
  // cl12 김도현: 주일학교, 2교구
  { id: 'sa18', pastorId: 'cl12', departmentId: 'dep12', departmentName: '주일학교', assignmentType: 'department', createdAt: '2024-07-01T00:00:00Z', isActive: true },
  { id: 'sa19', pastorId: 'cl12', districtId: 'd2',    districtName: '2교구',    assignmentType: 'district',   createdAt: '2024-07-01T00:00:00Z', isActive: true },
  // cl13 이준혁: 유초등부, 3교구
  { id: 'sa20', pastorId: 'cl13', departmentId: 'dep8',  departmentName: '유초등부', assignmentType: 'department', createdAt: '2024-07-15T00:00:00Z', isActive: true },
  { id: 'sa21', pastorId: 'cl13', districtId: 'd3',    districtName: '3교구',    assignmentType: 'district',   createdAt: '2024-07-15T00:00:00Z', isActive: true },
  // cl14 박예린: 유아부
  { id: 'sa22', pastorId: 'cl14', departmentId: 'dep6',  departmentName: '유아부', assignmentType: 'department', createdAt: '2024-08-01T00:00:00Z', isActive: true },
  // cl15 한지은: 유치부
  { id: 'sa23', pastorId: 'cl15', departmentId: 'dep7',  departmentName: '유치부', assignmentType: 'department', createdAt: '2024-08-15T00:00:00Z', isActive: true },
  // cl16 장미정: 여선교회, 4교구
  { id: 'sa24', pastorId: 'cl16', departmentId: 'dep5',  departmentName: '여선교회', assignmentType: 'department', createdAt: '2024-09-01T00:00:00Z', isActive: true },
  { id: 'sa25', pastorId: 'cl16', districtId: 'd4',    districtName: '4교구',    assignmentType: 'district',   createdAt: '2024-09-01T00:00:00Z', isActive: true },
  // cl17 윤서영: 선교부
  { id: 'sa26', pastorId: 'cl17', departmentId: 'dep13', departmentName: '선교부', assignmentType: 'department', createdAt: '2024-09-15T00:00:00Z', isActive: true },
  // cl18 김태현: 찬양대
  { id: 'sa27', pastorId: 'cl18', departmentId: 'dep3',  departmentName: '찬양대', assignmentType: 'department', createdAt: '2024-10-01T00:00:00Z', isActive: true },
  // cl19 박성민: 남선교회
  { id: 'sa28', pastorId: 'cl19', departmentId: 'dep4',  departmentName: '남선교회', assignmentType: 'department', createdAt: '2024-10-15T00:00:00Z', isActive: true },
  // cl20 이가영: 장년부
  { id: 'sa29', pastorId: 'cl20', departmentId: 'dep2',  departmentName: '장년부', assignmentType: 'department', createdAt: '2024-11-01T00:00:00Z', isActive: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadClergy(): ClergyMember[] {
  try {
    const raw = localStorage.getItem(LS_CLERGY);
    if (raw) {
      const parsed = JSON.parse(raw) as ClergyMember[];
      if (parsed.length >= 20) return parsed;
    }
  } catch { /**/ }
  saveClergy(DEFAULT_CLERGY);
  return DEFAULT_CLERGY;
}
function saveClergy(list: ClergyMember[]): void {
  try { localStorage.setItem(LS_CLERGY, JSON.stringify(list)); } catch { /**/ }
}

function loadAssignments(): StaffAssignment[] {
  try {
    const raw = localStorage.getItem(LS_ASSIGNMENTS);
    if (raw) {
      const parsed = JSON.parse(raw) as StaffAssignment[];
      if (parsed.length > 0) return parsed;
    }
  } catch { /**/ }
  saveAssignments(DEFAULT_ASSIGNMENTS);
  return DEFAULT_ASSIGNMENTS;
}
function saveAssignments(list: StaffAssignment[]): void {
  try { localStorage.setItem(LS_ASSIGNMENTS, JSON.stringify(list)); } catch { /**/ }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Clergy CRUD ──────────────────────────────────────────────────────────────

export function getAllClergy(): ClergyMember[] {
  return loadClergy().sort((a, b) => {
    if (a.isChief !== b.isChief) return a.isChief ? -1 : 1;
    return a.name.localeCompare(b.name, 'ko');
  });
}

export function getClergyById(id: string): ClergyMember | null {
  return loadClergy().find(c => c.id === id) ?? null;
}

export function getClergyByEmail(email: string): ClergyMember | null {
  const normalized = email.toLowerCase().trim();
  return loadClergy().find(
    c => c.status === 'active' && c.email?.toLowerCase() === normalized,
  ) ?? null;
}

export function getAllActiveAssignments(): StaffAssignment[] {
  return loadAssignments().filter(a => a.isActive);
}

export function createClergy(input: Omit<ClergyMember, 'id' | 'createdAt' | 'updatedAt'>): ClergyMember {
  const now = new Date().toISOString();
  const member: ClergyMember = { ...input, id: `cl-${uid()}`, createdAt: now, updatedAt: now };
  const list = loadClergy();
  list.push(member);
  saveClergy(list);
  return member;
}

export function updateClergy(id: string, updates: Partial<Omit<ClergyMember, 'id' | 'createdAt'>>): void {
  const list = loadClergy();
  const idx = list.findIndex(c => c.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  saveClergy(list);

  // Sync churchieum_demo_user if the updated clergy's email matches the logged-in user
  const updated = list[idx];
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
        };
        localStorage.setItem('churchieum_demo_user', JSON.stringify(synced));
      }
    }
  } catch { /**/ }
}

export function deleteClergy(id: string): void {
  saveClergy(loadClergy().filter(c => c.id !== id));
  saveAssignments(loadAssignments().filter(a => a.pastorId !== id));
}

// ─── Staff Assignments ────────────────────────────────────────────────────────

export function getAssignmentsForClergy(pastorId: string): StaffAssignment[] {
  return loadAssignments()
    .filter(a => a.pastorId === pastorId && a.isActive)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addAssignment(input: Omit<StaffAssignment, 'id' | 'createdAt' | 'isActive'>): { success: boolean; duplicate: boolean } {
  const list = loadAssignments();
  const isDuplicate = list.some(a =>
    a.isActive &&
    a.pastorId === input.pastorId &&
    (a.districtId ?? '') === (input.districtId ?? '') &&
    (a.zoneId ?? '') === (input.zoneId ?? '') &&
    (a.departmentId ?? '') === (input.departmentId ?? '')
  );
  if (isDuplicate) return { success: false, duplicate: true };

  const assignment: StaffAssignment = {
    ...input,
    id: `sa-${uid()}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  list.push(assignment);
  saveAssignments(list);
  return { success: true, duplicate: false };
}

export function removeAssignment(id: string): void {
  const list = loadAssignments();
  const idx = list.findIndex(a => a.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], isActive: false };
  saveAssignments(list);
}

export function getAssignmentSummary(assignment: StaffAssignment): string {
  const parts: string[] = [];

  if (assignment.districtId) {
    const live = getDistrictNameById(assignment.districtId);
    parts.push(live !== '-' ? live : (assignment.districtName ?? ''));
  }
  if (assignment.zoneId) {
    const live = getZoneNameById(assignment.zoneId);
    parts.push(live !== '-' ? live : (assignment.zoneName ?? ''));
  }
  if (assignment.departmentId) {
    const live = getDepartmentNameById(assignment.departmentId);
    parts.push(live !== '-' ? live : (assignment.departmentName ?? ''));
  }

  return parts.filter(Boolean).join(' / ') || '기타';
}

export function deriveAssignmentType(a: Pick<StaffAssignment, 'districtId' | 'zoneId' | 'departmentId'>): AssignmentType {
  if (a.districtId && a.zoneId && a.departmentId) return 'mixed';
  if (a.districtId && a.zoneId) return 'zone';
  if (a.districtId && !a.zoneId && !a.departmentId) return 'district';
  return 'department';
}

export const POSITION_OPTIONS = ['담임목사', '목사', '전도사', '교육전도사', '간사', '직원', '기타'] as const;

export const POSITION_COLORS: Record<string, string> = {
  '담임목사':   'bg-amber-100 text-amber-700',
  '목사':       'bg-orange-100 text-orange-700',
  '전도사':     'bg-violet-100 text-violet-700',
  '교육전도사': 'bg-purple-100 text-purple-700',
  '간사':       'bg-teal-100 text-teal-700',
  '직원':       'bg-gray-100 text-gray-600',
  '기타':       'bg-blue-100 text-blue-700',
};

export const STATUS_LABELS: Record<ClergyStatus, string> = {
  active:   '재직',
  invited:  '초대중',
  pending:  '승인대기',
  resigned: '사임/퇴임',
};

export const STATUS_COLORS: Record<ClergyStatus, string> = {
  active:   'bg-green-100 text-green-700',
  invited:  'bg-blue-100 text-blue-700',
  pending:  'bg-amber-100 text-amber-700',
  resigned: 'bg-gray-100 text-gray-500',
};

export function positionLabel(c: Pick<ClergyMember, 'position' | 'customPosition'>): string {
  return c.position === '기타' && c.customPosition ? c.customPosition : c.position;
}
