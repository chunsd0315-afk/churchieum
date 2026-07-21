import type { UserRole, AppUser } from '../services/permissions';

/** 교회이음 0.4 — 기본 체험용 계정 (로그인·시드·표시 우선) */
export type DemoAccountKey = 'admin' | 'pastor' | 'member';

export type DemoAccountDefinition = {
  key: DemoAccountKey;
  label: string;
  name: string;
  position: string;
  roleLabel: string;
  email: string;
  password: string;
  role: UserRole;
  toast: string;
  assignedDistrictIds?: string[];
  assignedZoneIds?: string[];
  assignedDepartmentIds?: string[];
  districtId?: string;
  zoneId?: string;
  departmentIds?: string[];
};

/** 항상 이 순서로 노출 — 최고관리자 → 교역자 → 성도 */
export const PRIMARY_DEMO_ACCOUNTS: DemoAccountDefinition[] = [
  {
    key: 'admin',
    label: '👑 최고관리자',
    name: '정재명',
    position: '목사',
    roleLabel: '최고관리자',
    email: 'pastor01@churchieum.com',
    password: 'Church@2026',
    role: 'super_admin',
    toast: '최고관리자 계정이 입력되었습니다.',
    assignedDistrictIds: ['d1'],
    assignedZoneIds: ['z1'],
    assignedDepartmentIds: ['dep1'],
    districtId: 'd1',
    zoneId: 'z1',
    departmentIds: ['dep1'],
  },
  {
    key: 'pastor',
    label: '👨‍💼 교역자',
    name: '이변우',
    position: '목사',
    roleLabel: '교역자',
    email: 'pastor02@churchieum.com',
    password: 'Church@2026',
    role: 'pastor',
    toast: '교역자 계정이 입력되었습니다.',
    assignedDistrictIds: ['d2'],
    assignedZoneIds: ['z3'],
    assignedDepartmentIds: ['dep1'],
    districtId: 'd2',
    zoneId: 'z3',
    departmentIds: ['dep1'],
  },
  {
    key: 'member',
    label: '👤 성도',
    name: '천성대',
    position: '장로',
    roleLabel: '성도',
    email: 'member60@demo.com',
    password: 'Church@2026',
    role: 'member',
    toast: '성도 계정이 입력되었습니다.',
    districtId: 'd1',
    zoneId: 'z1',
    departmentIds: ['dep3', 'dep5'],
  },
];

const byEmail = new Map(
  PRIMARY_DEMO_ACCOUNTS.map(acc => [acc.email.toLowerCase(), acc]),
);

export function getPrimaryDemoAccount(email: string): DemoAccountDefinition | undefined {
  return byEmail.get(email.toLowerCase().trim());
}

export function getDemoAccountMap(): Record<string, DemoAccountDefinition> {
  return Object.fromEntries(
    PRIMARY_DEMO_ACCOUNTS.map(acc => [acc.email.toLowerCase(), acc]),
  );
}

export const DEMO_ACCOUNT_IDS = {
  admin: 'demo-pastor01',
  pastor: 'demo-pastor02',
  member: 'demo-member60',
} as const;

export function isPrimaryDemoEmail(email?: string | null): boolean {
  if (!email) return false;
  return byEmail.has(email.toLowerCase().trim());
}

export function isPrimaryDemoUserId(id?: string | null): id is (typeof DEMO_ACCOUNT_IDS)[DemoAccountKey] {
  if (!id) return false;
  return (Object.values(DEMO_ACCOUNT_IDS) as string[]).includes(id);
}

export function getPrimaryDemoAccountById(id: string): DemoAccountDefinition | undefined {
  const match = (Object.entries(DEMO_ACCOUNT_IDS) as [DemoAccountKey, string][]).find(([, v]) => v === id);
  if (!match) return undefined;
  return PRIMARY_DEMO_ACCOUNTS.find(a => a.key === match[0]);
}

/** 로그인·AuthContext용 AppUser — ID·이름·직분·역할·조직 단일 소스 */
export function buildDemoAppUser(email: string): AppUser | null {
  const acc = getPrimaryDemoAccount(email);
  if (!acc) return null;
  return {
    id: DEMO_ACCOUNT_IDS[acc.key],
    email: acc.email.toLowerCase(),
    name: acc.name,
    role: acc.role,
    position: acc.position,
    assignedDistrictIds: acc.assignedDistrictIds,
    assignedZoneIds: acc.assignedZoneIds,
    assignedDepartmentIds: acc.assignedDepartmentIds,
    districtId: acc.districtId,
    zoneId: acc.zoneId,
    departmentIds: acc.departmentIds,
  };
}

/** 저장된 사용자가 대표 데모 계정이면 canonical 필드로 덮어씀 */
export function normalizePrimaryDemoUser(user: AppUser): AppUser {
  const acc = getPrimaryDemoAccount(user.email) ?? getPrimaryDemoAccountById(user.id);
  if (!acc) return user;
  const canonical = buildDemoAppUser(acc.email);
  if (!canonical) return user;
  return { ...canonical, phone: user.phone ?? canonical.phone };
}

/** authorId → 최신 대표 데모 사용자 이름 (스냅샷보다 우선) */
export function resolvePrimaryDemoDisplayName(userId: string): string | null {
  return getPrimaryDemoAccountById(userId)?.name ?? null;
}
