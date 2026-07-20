/**
 * 은혜기록·기도 공통 조회 권한 / 공유 대상 헬퍼
 */
import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import {
  type VisibilityType,
  type SharedContentFields,
  type ShareTypeFilter,
  migrateVisibility,
  uniqueIds,
  isLegacyPublic,
  type LegacyVisibilityRaw,
  SHARE_TYPE_FILTER_LABELS,
} from '../types/sharedContent';
import {
  getEligiblePastorsForUser,
  getEligibleGroupsForUser,
  getAllEligibleGroupIds,
  resolveUserOrgMembership,
  getViewerOrganizationScope,
  type EligiblePastor,
  type EligibleGroup,
} from './graceNoteShareScope';
import {
  getAllClergy,
  getAllActiveAssignments,
  getClergyByEmail,
  positionLabel,
  type ClergyMember,
} from './clergyData';
import { getDistricts, getZones, getDepartments, getDistrictNameById, getZoneNameById, getDepartmentNameById } from './orgData';
import { getAssigneesForUser, getAllAssignees } from './orgAssigneeStorage';
import { resolveAssigneeUserIds } from './orgPermissionHelpers';

export type SharedContentLike = {
  authorId?: string;
  userId?: string;
  visibility: LegacyVisibilityRaw | VisibilityType;
  sharedPastorIds?: string[];
  /** 레거시 — 전체 담당 교역자 */
  sharedPastorAll?: boolean;
  sharedOrganizationIds?: string[];
  sharedGroupIds?: string[];
  /** 레거시 전체공개 — 소속과 무관하게 모두에게 공개 */
  sharedGroupAll?: boolean;
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
  /** 기도 레거시 scope */
  organizationScope?: {
    districtIds?: string[];
    groupIds?: string[];
    departmentIds?: string[];
  };
};

export type SharedContentViewerContext = {
  currentUser: AppUser | null;
  /** 관리 조회 모드 — private 포함 여부 (특별 권한) */
  adminAuditMode?: boolean;
  /** private 관리 조회 특별 권한 */
  canAuditPrivate?: boolean;
};

function authorIdsOf(content: SharedContentLike): string[] {
  return uniqueIds([content.authorId, content.userId].filter(Boolean) as string[]);
}

function isAuthor(content: SharedContentLike, user: AppUser): boolean {
  const ids = new Set(authorIdsOf(content));
  if (ids.has(user.id)) return true;
  // demo email local match
  const local = user.email?.split('@')[0]?.toLowerCase();
  if (local && ids.has(`demo-${local}`)) return true;
  return false;
}

/** 통합 조직 ID 목록 (상위·하위·부서 + 레거시 scope) */
export function resolveSharedOrganizationIds(content: SharedContentLike): string[] {
  const fromFields = uniqueIds([
    ...(content.sharedOrganizationIds ?? []),
    ...(content.sharedGroupIds ?? []),
    ...(content.sharedUpperOrganizationIds ?? []),
    ...(content.sharedLowerOrganizationIds ?? []),
    ...(content.sharedDepartmentIds ?? []),
  ]);
  if (fromFields.length > 0) return fromFields;

  const scope = content.organizationScope;
  if (!scope) return [];
  return uniqueIds([
    ...(scope.districtIds ?? []),
    ...(scope.groupIds ?? []),
    ...(scope.departmentIds ?? []),
  ]);
}

export function toSharedContentFields(content: SharedContentLike): SharedContentFields {
  const visibility = migrateVisibility(content.visibility);
  let sharedPastorIds = uniqueIds(content.sharedPastorIds);
  if (content.sharedPastorAll && sharedPastorIds.length === 0) {
    // 전체 선택 레거시 — 조회 시에는 담당 교역자 전원으로 해석하지 않고
    // matchesPastorShare에서 sharedPastorAll로 처리
  }
  return {
    visibility,
    sharedPastorIds,
    sharedOrganizationIds: resolveSharedOrganizationIds(content),
  };
}

function viewerOrgIdSet(user: AppUser): Set<string> {
  const scope = getViewerOrganizationScope(user);
  return new Set([...scope.upper, ...scope.lower, ...scope.dept]);
}

function viewerClergyId(user: AppUser): string | undefined {
  return getClergyByEmail(user.email)?.id;
}

function pastorShareMatches(
  content: SharedContentLike,
  user: AppUser,
): boolean {
  const clergyId = viewerClergyId(user);
  if (!clergyId && user.role === 'member') return false;

  const ids = uniqueIds(content.sharedPastorIds);
  if (content.sharedPastorAll) {
    // 레거시: 작성자 소속 담당 교역자 전원 — 현재 사용자가 그 중 하나인지
    // sharedPastorIds가 채워져 있으면 그 목록 사용
    if (ids.length > 0 && clergyId) return ids.includes(clergyId);
    // pastor/super_admin: 본인 clergy id가 배정 그래프에 있으면 허용은 호출측에서
    return Boolean(clergyId);
  }
  if (clergyId && ids.includes(clergyId)) return true;
  // user.id 로도 선택했을 수 있음
  if (ids.includes(user.id)) return true;
  return false;
}

function organizationShareMatches(
  content: SharedContentLike,
  user: AppUser,
): boolean {
  // 레거시 전체공개
  if (isLegacyPublic(content.visibility) || content.sharedGroupAll) {
    return true;
  }

  const sharedOrgs = resolveSharedOrganizationIds(content);
  if (sharedOrgs.length === 0) {
    // 기도 레거시 중보: organizationScope 빈 배열 = 전체 교회
    const scope = content.organizationScope;
    if (
      scope &&
      (scope.districtIds?.length ?? 0) === 0 &&
      (scope.groupIds?.length ?? 0) === 0 &&
      (scope.departmentIds?.length ?? 0) === 0 &&
      migrateVisibility(content.visibility) === 'organization_share'
    ) {
      return user.role === 'member' || user.role === 'pastor' || user.role === 'super_admin';
    }
    return false;
  }

  const mine = viewerOrgIdSet(user);
  return sharedOrgs.some(id => mine.has(id));
}

/**
 * 공통 조회 판정
 * 1. 작성자 → 항상 가능
 * 2. private → 작성자만 (관리 조회+특별권한 예외)
 * 3. pastor_share → sharedPastorIds에 포함
 * 4. organization_share → 소속 조직 교차
 * 5. 최고관리자도 private는 일반 목록에서 불가
 */
export function canViewSharedContent(
  content: SharedContentLike,
  ctx: SharedContentViewerContext,
): boolean {
  const { currentUser, adminAuditMode, canAuditPrivate } = ctx;
  if (!currentUser) return false;

  if (isAuthor(content, currentUser)) return true;

  const visibility = migrateVisibility(content.visibility);

  if (visibility === 'private') {
    if (adminAuditMode && canAuditPrivate && isSuperAdmin(currentUser)) {
      return true;
    }
    return false;
  }

  if (visibility === 'pastor_share') {
    if (isSuperAdmin(currentUser)) return true;
    return pastorShareMatches(content, currentUser);
  }

  if (visibility === 'organization_share') {
    if (isSuperAdmin(currentUser)) return true;
    return organizationShareMatches(content, currentUser);
  }

  return false;
}

export type SharedListTab =
  | 'mine'
  | 'shared'
  | 'pastor_members'
  | 'organization'
  | 'admin_shared'
  | 'admin_audit';

export function getDefaultSharedListTabs(user: AppUser | null): SharedListTab[] {
  if (!user) return ['mine'];
  if (isSuperAdmin(user)) return ['mine', 'admin_shared', 'admin_audit'];
  if (user.role === 'pastor') {
    return ['mine', 'pastor_members', 'organization'];
  }
  return ['mine', 'shared'];
}

export const SHARED_LIST_TAB_LABELS: Record<SharedListTab, string> = {
  mine: '내 기록',
  shared: '공유받은 기록',
  pastor_members: '담당 성도',
  organization: '교구·부서',
  admin_shared: '공유 기록',
  admin_audit: '관리 조회',
};

export const PRAYER_LIST_TAB_LABELS: Record<SharedListTab, string> = {
  mine: '내 기도',
  shared: '공동체 기도',
  pastor_members: '담당 성도',
  organization: '교구·부서',
  admin_shared: '공유 기도',
  admin_audit: '관리 조회',
};

/** 탭별 목록 필터 (작성자 본인 / 공유받은 / 담당 / 조직 / 관리) */
export function filterSharedContentByTab<T extends SharedContentLike & { id?: string }>(
  items: T[],
  user: AppUser | null,
  tab: SharedListTab,
  options?: { canAuditPrivate?: boolean },
): T[] {
  if (!user) return [];

  return items.filter(item => {
    const own = isAuthor(item, user);
    const visibility = migrateVisibility(item.visibility);

    if (tab === 'mine') return own;

    if (tab === 'shared') {
      if (own) return false;
      if (visibility === 'private') return false;
      // 성도: organization_share만
      if (user.role === 'member' && !isSuperAdmin(user)) {
        if (visibility !== 'organization_share') return false;
        return canViewSharedContent(item, { currentUser: user });
      }
      return canViewSharedContent(item, { currentUser: user });
    }

    if (tab === 'pastor_members') {
      if (own) return false;
      if (visibility !== 'pastor_share') return false;
      return canViewSharedContent(item, { currentUser: user });
    }

    if (tab === 'organization') {
      if (own) return false;
      if (visibility !== 'organization_share') return false;
      return canViewSharedContent(item, { currentUser: user });
    }

    if (tab === 'admin_shared') {
      if (own) return false;
      if (visibility === 'private') return false;
      return canViewSharedContent(item, { currentUser: user });
    }

    if (tab === 'admin_audit') {
      if (visibility === 'private' && !options?.canAuditPrivate) return false;
      if (visibility === 'private') {
        return canViewSharedContent(item, {
          currentUser: user,
          adminAuditMode: true,
          canAuditPrivate: options?.canAuditPrivate,
        });
      }
      return true;
    }

    return false;
  });
}

/**
 * 공유 유형 필터 (전체 / 교역자 공유 / 교구·부서 공유)
 * private는 옵션에 없음 — all 이어도 private는 호출 전 탭 필터에서 제외되어야 함
 */
export function matchesShareTypeFilter(
  record: SharedContentLike,
  shareTypeFilter: ShareTypeFilter | undefined | null,
): boolean {
  if (!shareTypeFilter || shareTypeFilter === 'all') return true;
  return migrateVisibility(record.visibility) === shareTypeFilter;
}

export function filterByShareType<T extends SharedContentLike>(
  records: T[],
  shareTypeFilter: ShareTypeFilter | undefined | null,
): T[] {
  if (!shareTypeFilter || shareTypeFilter === 'all') return records;
  return records.filter(r => matchesShareTypeFilter(r, shareTypeFilter));
}

/**
 * 교구·부서 세부 필터 — selectedOrganizationIds 비어 있으면 전체,
 * 값이 있으면 OR(하나라도 일치)
 */
export function matchesOrganizationFilter(
  recordOrganizationIds: string[] | undefined | null,
  selectedOrganizationIds: string[] | undefined | null,
): boolean {
  const selected = selectedOrganizationIds ?? [];
  if (selected.length === 0) return true;
  const recordIds = recordOrganizationIds ?? [];
  if (recordIds.length === 0) return false;
  return recordIds.some(id => selected.includes(id));
}

export function matchesOrganizationFilterForRecord(
  record: SharedContentLike,
  selectedOrganizationIds: string[] | undefined | null,
): boolean {
  return matchesOrganizationFilter(
    resolveSharedOrganizationIds(record),
    selectedOrganizationIds,
  );
}

export { SHARE_TYPE_FILTER_LABELS };
export type { ShareTypeFilter };

// ─── 작성 시 선택 가능 대상 ───────────────────────────────────────────────

const PASTORAL_POSITIONS = new Set([
  '담임목사', '부목사', '목사', '전도사', '교육전도사', '선교사', '간사',
]);

function isPastoralClergy(c: ClergyMember): boolean {
  return c.status === 'active' && PASTORAL_POSITIONS.has(c.position);
}

/** org_assignees 기반 담당 교역자 보강 */
function pastorsFromOrgAssignees(orgIds: string[]): EligiblePastor[] {
  const assignees = getAllAssignees().filter(
    a => a.isActive && a.assigneeType === 'pastor' && orgIds.includes(a.organizationId),
  );
  const clergyMap = new Map(getAllClergy().filter(isPastoralClergy).map(c => [c.id, c]));
  const byId = new Map<string, EligiblePastor>();

  for (const a of assignees) {
    const clergy =
      clergyMap.get(a.userId) ??
      getAllClergy().find(c => c.id === a.userId || c.email === a.userId);
    if (!clergy || !isPastoralClergy(clergy)) continue;
    const orgLabel =
      getDistrictNameById(a.organizationId) !== '-'
        ? getDistrictNameById(a.organizationId)
        : getZoneNameById(a.organizationId) !== '-'
          ? getZoneNameById(a.organizationId)
          : getDepartmentNameById(a.organizationId);
    const prev = byId.get(clergy.id);
    const labels = new Set(prev?.orgLabels ?? []);
    if (orgLabel && orgLabel !== '-') labels.add(orgLabel);
    byId.set(clergy.id, {
      id: clergy.id,
      name: clergy.name,
      position: positionLabel(clergy),
      orgLabels: [...labels],
    });
  }
  return [...byId.values()];
}

/**
 * 역할별 공유 가능 교역자
 * - 성도: 소속 조직 담당 교역자만
 * - 교역자: 함께 담당 / 상급 / 연결 교역자
 * - 최고관리자: 전체 검색 가능 (전체 목록 반환, UI에서 검색)
 */
export function getShareablePastorsForWriter(user: AppUser | null): EligiblePastor[] {
  if (!user) return [];

  if (isSuperAdmin(user)) {
    return getAllClergy()
      .filter(isPastoralClergy)
      .map(c => ({
        id: c.id,
        name: c.name,
        position: positionLabel(c),
        orgLabels: [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  // 성도·교역자 공통: 소속/담당 기반
  const fromStaff = getEligiblePastorsForUser(user);
  const membership = resolveUserOrgMembership(user);
  const orgIds = membership
    ? uniqueIds([
        membership.districtId,
        membership.zoneId,
        ...membership.departmentIds,
      ].filter(Boolean) as string[])
    : [];

  // 교역자: 본인이 담당하는 조직의 동료 담당자
  if (user.role === 'pastor') {
    const myAssigneeOrgs = resolveAssigneeUserIds(user).flatMap(uid =>
      getAssigneesForUser(uid).map(a => a.organizationId),
    );
    const assignedViaStaff = getAllActiveAssignments()
      .filter(a => {
        const me = getClergyByEmail(user.email);
        return me && a.pastorId === me.id && a.isActive;
      })
      .flatMap(a => [a.districtId, a.zoneId, a.departmentId].filter(Boolean) as string[]);

    const allOrgIds = uniqueIds([...orgIds, ...myAssigneeOrgs, ...assignedViaStaff]);
    const fromAssignees = pastorsFromOrgAssignees(allOrgIds);
    const me = getClergyByEmail(user.email)?.id;
    const merged = new Map<string, EligiblePastor>();
    for (const p of [...fromStaff, ...fromAssignees]) {
      if (me && p.id === me) continue;
      merged.set(p.id, p);
    }
    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  // 성도
  const fromAssignees = pastorsFromOrgAssignees(orgIds);
  const merged = new Map<string, EligiblePastor>();
  for (const p of [...fromStaff, ...fromAssignees]) merged.set(p.id, p);
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export type ShareableOrganizations = {
  districts: EligibleGroup[];
  zones: EligibleGroup[];
  departments: EligibleGroup[];
  /** 검색용 flat */
  all: EligibleGroup[];
};

/**
 * 역할별 공유 가능 조직
 * - 성도: 소속만
 * - 교역자: 담당 + 소속
 * - 최고관리자: 전체 활성 조직
 */
export function getShareableOrganizationsForWriter(user: AppUser | null): ShareableOrganizations {
  const empty: ShareableOrganizations = { districts: [], zones: [], departments: [], all: [] };
  if (!user) return empty;

  if (isSuperAdmin(user)) {
    const districts = getDistricts().map(d => ({
      id: d.id,
      name: d.name,
      kind: 'district' as const,
    }));
    const zones = getZones().map(z => ({
      id: z.id,
      name: z.name,
      kind: 'zone' as const,
      parentId: z.district_id,
    }));
    const departments = getDepartments().map(d => ({
      id: d.id,
      name: d.name,
      kind: 'department' as const,
    }));
    return {
      districts,
      zones,
      departments,
      all: [...districts, ...zones, ...departments],
    };
  }

  const base = getEligibleGroupsForUser(user);

  if (user.role === 'pastor') {
    const myOrgs = new Set(
      resolveAssigneeUserIds(user).flatMap(uid =>
        getAssigneesForUser(uid).map(a => a.organizationId),
      ),
    );
    const me = getClergyByEmail(user.email);
    if (me) {
      for (const a of getAllActiveAssignments()) {
        if (a.pastorId !== me.id || !a.isActive) continue;
        if (a.districtId) myOrgs.add(a.districtId);
        if (a.zoneId) myOrgs.add(a.zoneId);
        if (a.departmentId) myOrgs.add(a.departmentId);
      }
    }

    const addDistrict = (id: string) => {
      if (base.districts.some(d => d.id === id)) return;
      const d = getDistricts().find(x => x.id === id);
      if (d) base.districts.push({ id: d.id, name: d.name, kind: 'district' });
    };
    const addZone = (id: string) => {
      if (base.zones.some(z => z.id === id)) return;
      const z = getZones().find(x => x.id === id);
      if (z) base.zones.push({ id: z.id, name: z.name, kind: 'zone', parentId: z.district_id });
    };
    const addDept = (id: string) => {
      if (base.departments.some(d => d.id === id)) return;
      const d = getDepartments().find(x => x.id === id);
      if (d) base.departments.push({ id: d.id, name: d.name, kind: 'department' });
    };

    for (const id of myOrgs) {
      if (getDistricts().some(d => d.id === id)) addDistrict(id);
      else if (getZones().some(z => z.id === id)) addZone(id);
      else if (getDepartments().some(d => d.id === id)) addDept(id);
    }
  }

  return {
    ...base,
    all: [...base.districts, ...base.zones, ...base.departments],
  };
}

export function getShareableOrganizationIdSet(user: AppUser | null): Set<string> {
  const g = getShareableOrganizationsForWriter(user);
  return new Set(g.all.map(x => x.id));
}

/** 검색 통합 */
export function matchesSharedContentSearch(
  item: {
    title?: string;
    content?: string;
    graceContent?: string;
    memorableVerse?: string;
    bibleReference?: string;
    authorName?: string;
    sharedOrganizationIds?: string[];
    sharedGroupIds?: string[];
    sharedUpperOrganizationIds?: string[];
    sharedLowerOrganizationIds?: string[];
    sharedDepartmentIds?: string[];
  },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const orgIds = resolveSharedOrganizationIds(item as SharedContentLike);
  const orgNames = orgIds
    .map(id => {
      const d = getDistrictNameById(id);
      if (d && d !== '-') return d;
      const z = getZoneNameById(id);
      if (z && z !== '-') return z;
      return getDepartmentNameById(id);
    })
    .join(' ')
    .toLowerCase();

  const hay = [
    item.title,
    item.content,
    item.graceContent,
    item.memorableVerse,
    item.bibleReference,
    item.authorName,
    orgNames,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return hay.includes(q);
}

export { getEligiblePastorsForUser, getEligibleGroupsForUser, getAllEligibleGroupIds };
