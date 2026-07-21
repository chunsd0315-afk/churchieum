/**
 * Prayer 접근 흐름 — 은혜기록과 동일한 공통 VisibilityType 사용
 *
 *   Prayer
 *     ↓
 *   visibility (src/types/sharedContent.ts)
 *     · private             → 작성자만 조회
 *     · pastor_share        → 작성자 + 공유 대상 교역자 (sharedPastorIds)
 *     · organization_share  → 작성자 + 공유 대상 조직 (sharedOrganizationIds)
 *     ↓
 *   권한 검사 — resolvePrayerAccess() (canViewSharedContent 기반 + 레거시 배정 fallback)
 *     ↓
 *   화면 표시 — filterPrayersForScreen() / filterSharedContentByTab()
 */
import type { AppUser } from './permissions';
import type { Prayer, PrayerOrganizationScope } from '../types/prayer';
import { migrateVisibility } from '../types/sharedContent';
import { canViewSharedContent, type SharedContentLike } from './sharedContentAccess';
import {
  getClergyByEmail,
  getClergyById,
  getAssignmentsForClergy,
  getAllActiveAssignments,
  type StaffAssignment,
} from './clergyData';
import { getDistrictNameById, getDepartmentNameById, getAllZones } from './orgData';

// ─── Organization scope ───────────────────────────────────────────────────────

function isChurchWide(scope: PrayerOrganizationScope): boolean {
  return (
    scope.districtIds.length === 0 &&
    scope.groupIds.length === 0 &&
    scope.departmentIds.length === 0
  );
}

function matchesDistricts(user: AppUser, ids: string[]): boolean {
  if (user.role === 'pastor') {
    return ids.some(id => user.assignedDistrictIds?.includes(id));
  }
  return ids.includes(user.districtId ?? '');
}

function matchesGroups(user: AppUser, ids: string[]): boolean {
  if (user.role === 'pastor') {
    return ids.some(id => user.assignedZoneIds?.includes(id));
  }
  return ids.includes(user.zoneId ?? '');
}

function matchesDepartments(user: AppUser, ids: string[]): boolean {
  if (user.role === 'pastor') {
    return ids.some(id => user.assignedDepartmentIds?.includes(id));
  }
  return ids.some(id => user.departmentIds?.includes(id));
}

/** 성도 소속이 조직범위와 일치하는지 (중보기도 대상자) */
export function isMemberInOrganizationScope(
  scope: PrayerOrganizationScope,
  user: AppUser,
): boolean {
  if (user.role !== 'member') return false;
  if (isChurchWide(scope)) return true;

  if (scope.districtIds.length > 0 && !scope.districtIds.includes(user.districtId ?? '')) {
    return false;
  }
  if (scope.groupIds.length > 0 && !scope.groupIds.includes(user.zoneId ?? '')) {
    return false;
  }
  if (scope.departmentIds.length > 0) {
    if (!scope.departmentIds.some(id => user.departmentIds?.includes(id))) return false;
  }
  return true;
}

/** 중보기도 대상자 — 조직 범위 내 성도 */
export function isIntercessionTarget(user: AppUser, prayer: Prayer): boolean {
  return isMemberInOrganizationScope(prayer.organizationScope, user);
}

/** 데모·로컬 성도 계정 (알림·대상자 탐색) */
const DEMO_MEMBER_ACCOUNTS: AppUser[] = [
  {
    id: 'demo-member60',
    email: 'member60@demo.com',
    name: '천성대',
    role: 'member',
    position: '장로',
    districtId: 'd1',
    zoneId: 'z3',
    departmentIds: ['dep3', 'dep5'],
  },
];

function loadMemberAccounts(): AppUser[] {
  const byId = new Map<string, AppUser>();
  DEMO_MEMBER_ACCOUNTS.forEach(u => byId.set(u.id, u));
  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (raw) {
      const data = JSON.parse(raw) as {
        members?: Array<{
          id?: string;
          email?: string;
          name?: string;
          districtId?: string;
          zoneId?: string;
          departmentIds?: string[];
        }>;
      };
      data.members?.forEach((m, i) => {
        if (!m.email) return;
        const local = m.email.split('@')[0]?.toLowerCase() ?? `member${i}`;
        const id = m.id ?? `demo-${local}`;
        byId.set(id, {
          id,
          email: m.email,
          name: m.name ?? '성도',
          role: 'member',
          districtId: m.districtId,
          zoneId: m.zoneId,
          departmentIds: m.departmentIds,
        });
      });
    }
  } catch { /* ignore */ }
  return [...byId.values()];
}

/** intercession 알림·열람 대상 성도 user id */
export function getIntercessionTargetReceiverIds(prayer: Prayer): string[] {
  return loadMemberAccounts()
    .filter(u => u.id !== prayer.authorId)
    .filter(u => isIntercessionTarget(u, prayer))
    .map(u => u.id);
}

/** 조직범위 일치 여부 (레거시·목회자 배정 판별용) */
export function isInOrganizationScope(scope: PrayerOrganizationScope, user: AppUser): boolean {
  if (isChurchWide(scope)) return true;
  if (user.role === 'super_admin') return true;

  if (scope.districtIds.length > 0 && !matchesDistricts(user, scope.districtIds)) return false;
  if (scope.groupIds.length > 0 && !matchesGroups(user, scope.groupIds)) return false;
  if (scope.departmentIds.length > 0 && !matchesDepartments(user, scope.departmentIds)) return false;
  return true;
}

/** 담당 배정이 기도 조직범위와 겹치는지 */
function assignmentMatchesScope(assignment: StaffAssignment, scope: PrayerOrganizationScope): boolean {
  if (isChurchWide(scope)) return true;

  if (scope.districtIds.length > 0) {
    if (!assignment.districtId || !scope.districtIds.includes(assignment.districtId)) {
      return false;
    }
  }
  if (scope.groupIds.length > 0) {
    if (!assignment.zoneId || !scope.groupIds.includes(assignment.zoneId)) {
      return false;
    }
  }
  if (scope.departmentIds.length > 0) {
    if (!assignment.departmentId || !scope.departmentIds.includes(assignment.departmentId)) {
      return false;
    }
  }
  return true;
}

/** 로그인 사용자가 해당 기도의 담당 교역자인지 */
export function isAssignedClergyForPrayer(user: AppUser, prayer: Prayer): boolean {
  if (user.role !== 'pastor' && user.role !== 'super_admin') return false;

  const clergy = getClergyByEmail(user.email);
  if (!clergy) return false;

  return getAssignmentsForClergy(clergy.id).some(a =>
    assignmentMatchesScope(a, prayer.organizationScope),
  );
}

function clergyEmailToUserId(email: string): string {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  return `demo-${local}`;
}

/** pastor_shared 알림 대상 — 담당 교역자 user id */
export function getAssignedClergyReceiverIds(prayer: Prayer): string[] {
  const seenPastors = new Set<string>();
  const receiverIds = new Set<string>();

  for (const assignment of getAllActiveAssignments()) {
    if (seenPastors.has(assignment.pastorId)) continue;
    if (!assignmentMatchesScope(assignment, prayer.organizationScope)) continue;

    seenPastors.add(assignment.pastorId);
    const clergy = getClergyById(assignment.pastorId);
    if (!clergy?.email) continue;

    const userId = clergyEmailToUserId(clergy.email);
    if (userId !== prayer.authorId) receiverIds.add(userId);
  }
  return [...receiverIds];
}

// ─── Visibility → 권한 검사 ─────────────────────────────────────────────────

export type PrayerAccessDenyReason =
  | 'deleted'
  | 'not_logged_in'
  | 'org_scope'
  | 'author_only'
  | 'assigned_clergy_only'
  | 'intercession_target_only';

export type PrayerAccessResult = {
  canView: boolean;
  canComment: boolean;
  denyReason?: PrayerAccessDenyReason;
};

function toSharedContentLike(prayer: Prayer): SharedContentLike {
  return {
    authorId: prayer.authorId,
    visibility: prayer.visibility,
    sharedPastorIds: prayer.sharedPastorIds,
    sharedOrganizationIds: prayer.sharedOrganizationIds,
    organizationScope: prayer.organizationScope,
  };
}

export type PrayerAccessOptions = {
  /** 관리자 「관리 조회」 탭에서 열람 — 공유 대상 매칭과 무관하게 조회만 허용 */
  auditMode?: boolean;
  /** 관리 조회 화면에서 private까지 열람 가능한 특별 권한 */
  canAuditPrivate?: boolean;
};

/**
 * Prayer + visibility → 권한 검사
 * canViewSharedContent(은혜기록과 공통) 기반 + 레거시 담당배정 fallback
 * (sharedPastorIds가 비어있는 구버전 pastor_share 기도 → 조직범위 배정으로 판정)
 */
export function resolvePrayerAccess(
  prayer: Prayer,
  user: AppUser | null,
  opts?: PrayerAccessOptions,
): PrayerAccessResult {
  if (prayer.deleted) {
    return { canView: false, canComment: false, denyReason: 'deleted' };
  }
  if (!user) {
    return { canView: false, canComment: false, denyReason: 'not_logged_in' };
  }

  if (prayer.authorId === user.id) {
    return { canView: true, canComment: true };
  }

  const visibility = migrateVisibility(prayer.visibility);
  const isAuditingAdmin = Boolean(opts?.auditMode) && user.role === 'super_admin';

  if (visibility === 'private') {
    if (isAuditingAdmin && opts?.canAuditPrivate) {
      return { canView: true, canComment: false };
    }
    return { canView: false, canComment: false, denyReason: 'author_only' };
  }

  if (isAuditingAdmin) {
    return { canView: true, canComment: true };
  }

  if (canViewSharedContent(toSharedContentLike(prayer), { currentUser: user })) {
    return { canView: true, canComment: true };
  }

  if (visibility === 'pastor_share') {
    const legacyFallback =
      (prayer.sharedPastorIds?.length ?? 0) === 0 && isAssignedClergyForPrayer(user, prayer);
    if (legacyFallback) {
      return { canView: true, canComment: true };
    }
    return { canView: false, canComment: false, denyReason: 'assigned_clergy_only' };
  }

  if (visibility === 'organization_share') {
    return { canView: false, canComment: false, denyReason: 'intercession_target_only' };
  }

  return { canView: false, canComment: false, denyReason: 'author_only' };
}

export function canViewPrayer(prayer: Prayer, user: AppUser | null): boolean {
  return resolvePrayerAccess(prayer, user).canView;
}

export function canCommentOnPrayer(prayer: Prayer, user: AppUser | null): boolean {
  return resolvePrayerAccess(prayer, user).canComment;
}

// ─── 화면 표시 ───────────────────────────────────────────────────────────────

export type PrayerScreenContext = 'my' | 'organization_share' | 'all';

export function filterPrayersForScreen(
  prayers: Prayer[],
  user: AppUser | null,
  screen: PrayerScreenContext,
): Prayer[] {
  const visible = prayers.filter(p => resolvePrayerAccess(p, user).canView);

  switch (screen) {
    case 'my':
      return visible.filter(p => p.authorId === user?.id);
    case 'organization_share':
      return visible.filter(
        p => migrateVisibility(p.visibility) === 'organization_share' && p.status === 'praying',
      );
    case 'all':
    default:
      return visible;
  }
}

export function getMyActivePrayers(prayers: Prayer[], user: AppUser | null): Prayer[] {
  return filterPrayersForScreen(prayers, user, 'my').filter(p => p.status === 'praying');
}

export function getMyAnsweredPrayers(prayers: Prayer[], user: AppUser | null): Prayer[] {
  return filterPrayersForScreen(prayers, user, 'my').filter(p => p.status === 'answered');
}

/** 함께 기도(organization_share) 목록 — 홈 대시보드 미리보기 등에서 사용 */
export function getIntercessionPrayers(prayers: Prayer[], user: AppUser | null): Prayer[] {
  return filterPrayersForScreen(prayers, user, 'organization_share');
}

/** 담당 교역자가 볼 수 있는 pastor_share 기도 (타인 작성) */
export function getPastorSharedInbox(prayers: Prayer[], user: AppUser | null): Prayer[] {
  if (!user) return [];
  return prayers.filter(
    p =>
      migrateVisibility(p.visibility) === 'pastor_share' &&
      p.status === 'praying' &&
      p.authorId !== user.id &&
      resolvePrayerAccess(p, user).canView,
  );
}

// ─── 표시 라벨 ───────────────────────────────────────────────────────────────

export function formatOrganizationScope(scope: PrayerOrganizationScope): string {
  return formatOrganizationScopeLines(scope).join(' · ') || '전체 교회';
}

export function formatOrganizationScopeLines(scope: PrayerOrganizationScope): string[] {
  if (isChurchWide(scope)) return ['전체 교회'];

  const lines: string[] = [];
  scope.districtIds.forEach(id => {
    const name = getDistrictNameById(id);
    if (name !== '-') lines.push(`상위조직 ${name}`);
  });
  scope.groupIds.forEach(id => {
    const zone = getAllZones().find(z => z.id === id);
    if (zone) lines.push(`하위조직 ${zone.name}`);
  });
  if (scope.departmentIds.length > 0) {
    const names = scope.departmentIds
      .map(id => getDepartmentNameById(id))
      .filter(n => n !== '-');
    if (names.length > 0) lines.push(`부서 ${names.join(', ')}`);
  }
  return lines;
}

export const ACCESS_DENY_MESSAGES: Record<PrayerAccessDenyReason, string> = {
  deleted: '삭제된 기도제목입니다.',
  not_logged_in: '로그인이 필요합니다.',
  org_scope: '조직 범위 밖의 기도제목입니다.',
  author_only: '작성자만 조회할 수 있습니다.',
  assigned_clergy_only: '작성자와 담당 교역자만 조회할 수 있습니다.',
  intercession_target_only: '작성자와 중보기도 대상자만 조회할 수 있습니다.',
};
