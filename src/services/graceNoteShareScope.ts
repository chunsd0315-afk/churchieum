/**
 * 은혜기록 공유 대상 — 사용자 실제 소속 조직 기준으로 제한
 */

import type { AppUser } from './permissions';
import { getClergyByEmail } from './clergyData';
import {
  getDistricts,
  getDepartments,
  getZones,
  getAllZones,
  getDistrictNameById,
  getZoneNameById,
  getDepartmentNameById,
} from './orgData';
import {
  getAllClergy,
  getAllActiveAssignments,
  positionLabel,
  type ClergyMember,
} from './clergyData';
import type { GraceNoteVisibility } from '../data/graceNotes';
import { readOrgSettings } from '../contexts/OrgSettingsContext';

const PASTORAL_POSITIONS = new Set([
  '담임목사', '부목사', '목사', '전도사', '교육전도사', '선교사', '간사',
]);

export type UserOrgMembership = {
  userId: string;
  districtId?: string;
  zoneId?: string;
  departmentIds: string[];
};

export type EligiblePastor = {
  id: string;
  name: string;
  position: string;
  orgLabels: string[];
};

export type EligibleGroupKind = 'district' | 'zone' | 'department';

export type EligibleGroup = {
  id: string;
  name: string;
  kind: EligibleGroupKind;
  /** 하위조직의 부모 상위조직 ID */
  parentId?: string;
};

export type GraceShareFields = {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
  sharedUpperOrganizationIds: string[];
  sharedLowerOrganizationIds: string[];
  sharedDepartmentIds: string[];
};

export type GraceShareValidationResult =
  | { ok: true; sanitized: GraceShareFields }
  | { ok: false; error: string };

/** 조직 유형 라벨 (조직관리 설정) */
export function getOrganizationLabels() {
  const s = readOrgSettings();
  return {
    upper: s.level1Label || '상위조직',
    lower: s.level2Label || '하위조직',
    department: s.departmentLabel || '부서',
  };
}

export function formatGroupShareOptionLabel(labels = getOrganizationLabels()) {
  return `${labels.upper}/${labels.department} 공유`;
}

export function formatGroupShareOptionDesc(labels = getOrganizationLabels()) {
  return `내가 속한 ${labels.upper}와 ${labels.department}에 공유합니다.`;
}

/** 하위조직 화면 표시용: `상위조직명 > 하위조직명` */
export function formatLowerWithUpperLabel(
  upperOrganizationName: string,
  lowerOrganizationName: string,
): string {
  const upper = upperOrganizationName.trim();
  const lower = lowerOrganizationName.trim();
  if (upper && lower) return `${upper} > ${lower}`;
  return lower || upper;
}

/** 하위조직 ID → `상위 > 하위` 표시 라벨 */
export function getLowerOrganizationDisplayLabel(zoneId: string): string {
  const zone = getAllZones().find(z => z.id === zoneId);
  if (!zone) return zoneId;
  const upperName = getDistrictNameById(zone.district_id);
  const safeUpper = upperName && upperName !== '-' ? upperName : '';
  return formatLowerWithUpperLabel(safeUpper, zone.name);
}

/** 상위/하위/부서 선택 결과를 화면용 라벨 목록으로
 * 하위가 선택된 부모 상위는 단독 라벨로 표시하지 않는다. */
export function formatOrganizationShareDisplayLabels(input: {
  sharedGroupIds?: string[];
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
  /** @deprecated 항상 하위가 있는 부모 상위는 단독 표시하지 않음 */
  hideUpperCoveredByLower?: boolean;
}): string[] {
  const split = splitOrganizationShareIds(input);
  const zones = getAllZones();
  const lowerParentIds = new Set(
    split.lower
      .map(id => zones.find(z => z.id === id)?.district_id)
      .filter(Boolean) as string[],
  );

  const labels: string[] = [];
  for (const id of split.upper) {
    // 하위 선택 시 상위 단독 표시 제거 (화면만, 저장 ID는 유지)
    if (lowerParentIds.has(id)) continue;
    const name = getDistrictNameById(id);
    if (name && name !== '-') labels.push(name);
  }
  for (const id of split.lower) {
    labels.push(getLowerOrganizationDisplayLabel(id));
  }
  for (const id of split.departments) {
    const name = getDepartmentNameById(id);
    if (name && name !== '-') labels.push(name);
  }
  return labels;
}

/** ID 배열 중복 제거 */
export function uniqueIds(ids: string[] | undefined | null): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.filter(Boolean))];
}

export function composeSharedGroupIds(
  upper: string[] | undefined,
  lower: string[] | undefined,
  departments: string[] | undefined,
): string[] {
  return uniqueIds([...(upper ?? []), ...(lower ?? []), ...(departments ?? [])]);
}

/** 통합/분리 저장값을 상위·하위·부서로 분류 */
export function splitOrganizationShareIds(input: {
  sharedGroupIds?: string[];
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
}): { upper: string[]; lower: string[]; departments: string[] } {
  const hasSplit =
    (input.sharedUpperOrganizationIds?.length ?? 0) > 0 ||
    (input.sharedLowerOrganizationIds?.length ?? 0) > 0 ||
    (input.sharedDepartmentIds?.length ?? 0) > 0;

  if (hasSplit) {
    return {
      upper: uniqueIds(input.sharedUpperOrganizationIds),
      lower: uniqueIds(input.sharedLowerOrganizationIds),
      departments: uniqueIds(input.sharedDepartmentIds),
    };
  }

  const districtIds = new Set(getDistricts().map(d => d.id));
  const zoneById = new Map(getAllZones().map(z => [z.id, z]));
  const deptIds = new Set(getDepartments().map(d => d.id));
  const upper: string[] = [];
  const lower: string[] = [];
  const departments: string[] = [];

  for (const id of uniqueIds(input.sharedGroupIds)) {
    if (districtIds.has(id)) upper.push(id);
    else if (zoneById.has(id)) lower.push(id);
    else if (deptIds.has(id)) departments.push(id);
  }

  return {
    upper: uniqueIds(upper),
    lower: uniqueIds(lower),
    departments: uniqueIds(departments),
  };
}

/** 하위조직의 부모 상위조직 ID를 보완 */
export function ensureParentUpperIds(lowerIds: string[], upperIds: string[]): string[] {
  const next = new Set(uniqueIds(upperIds));
  const zones = getAllZones();
  for (const lid of uniqueIds(lowerIds)) {
    const zone = zones.find(z => z.id === lid);
    if (zone?.district_id) next.add(zone.district_id);
  }
  return [...next];
}

function emptyShareFields(visibility: GraceNoteVisibility = 'private'): GraceShareFields {
  return {
    visibility,
    sharedPastorAll: false,
    sharedPastorIds: [],
    sharedGroupAll: false,
    sharedGroupIds: [],
    sharedUpperOrganizationIds: [],
    sharedLowerOrganizationIds: [],
    sharedDepartmentIds: [],
  };
}

function readDemoMemberByEmail(email: string): {
  districtId?: string;
  zoneId?: string;
  departmentIds?: string[];
} | null {
  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      members?: Array<{
        email?: string;
        districtId?: string;
        zoneId?: string;
        departmentIds?: string[];
      }>;
    };
    const match = data.members?.find(
      m => m.email?.toLowerCase() === email.toLowerCase(),
    );
    return match ?? null;
  } catch {
    return null;
  }
}

/** 로그인 사용자 + 구성원 관계 데이터로 소속 조직 계산 */
export function resolveUserOrgMembership(user: AppUser | null): UserOrgMembership | null {
  if (!user) return null;

  let districtId = user.districtId;
  let zoneId = user.zoneId;
  let departmentIds = [...(user.departmentIds ?? [])];

  const member = user.email ? readDemoMemberByEmail(user.email) : null;
  if (member) {
    districtId = member.districtId ?? districtId;
    zoneId = member.zoneId ?? zoneId;
    departmentIds = member.departmentIds ?? departmentIds;
  }

  const activeDistrictIds = new Set(getDistricts().map(d => d.id));
  const activeZoneIds = new Set(getZones().map(z => z.id));
  const activeDeptIds = new Set(getDepartments().map(d => d.id));

  if (districtId && !activeDistrictIds.has(districtId)) districtId = undefined;
  if (zoneId && !activeZoneIds.has(zoneId)) zoneId = undefined;
  departmentIds = uniqueIds(departmentIds.filter(id => activeDeptIds.has(id)));

  return { userId: user.id, districtId, zoneId, departmentIds };
}

function isPastoralClergy(c: ClergyMember): boolean {
  return c.status === 'active' && PASTORAL_POSITIONS.has(c.position);
}

function assignmentMatchesMembership(
  assignment: {
    districtId?: string;
    zoneId?: string;
    departmentId?: string;
    isActive: boolean;
  },
  membership: UserOrgMembership,
): { matches: boolean; label: string } {
  if (!assignment.isActive) return { matches: false, label: '' };

  if (assignment.zoneId && membership.zoneId && assignment.zoneId === membership.zoneId) {
    return { matches: true, label: getZoneNameById(assignment.zoneId) };
  }
  if (assignment.districtId && membership.districtId && assignment.districtId === membership.districtId) {
    return { matches: true, label: getDistrictNameById(assignment.districtId) };
  }
  if (
    assignment.departmentId &&
    membership.departmentIds.includes(assignment.departmentId)
  ) {
    return { matches: true, label: getDepartmentNameById(assignment.departmentId) };
  }
  return { matches: false, label: '' };
}

/** 내 소속 조직을 담당하는 교역자 (중복 제거) */
export function getEligiblePastorsForUser(user: AppUser | null): EligiblePastor[] {
  const membership = resolveUserOrgMembership(user);
  if (!membership) return [];

  const clergyMap = new Map(
    getAllClergy().filter(isPastoralClergy).map(c => [c.id, c]),
  );
  const byPastor = new Map<string, Set<string>>();

  for (const assignment of getAllActiveAssignments()) {
    const { matches, label } = assignmentMatchesMembership(assignment, membership);
    if (!matches || !clergyMap.has(assignment.pastorId)) continue;
    if (!byPastor.has(assignment.pastorId)) byPastor.set(assignment.pastorId, new Set());
    if (label && label !== '-') byPastor.get(assignment.pastorId)!.add(label);
  }

  return [...byPastor.entries()]
    .map(([id, labels]) => {
      const c = clergyMap.get(id)!;
      return {
        id,
        name: c.name,
        position: positionLabel(c),
        orgLabels: [...labels].sort((a, b) => a.localeCompare(b, 'ko')),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

/** 내가 속한 상위·하위 조직 및 부서 */
export function getEligibleGroupsForUser(user: AppUser | null): {
  districts: EligibleGroup[];
  zones: EligibleGroup[];
  departments: EligibleGroup[];
} {
  const membership = resolveUserOrgMembership(user);
  const empty = { districts: [], zones: [], departments: [] };
  if (!membership) return empty;

  const districts: EligibleGroup[] = [];
  const zones: EligibleGroup[] = [];
  const departments: EligibleGroup[] = [];
  const districtIds = new Set<string>();

  if (membership.districtId) {
    const d = getDistricts().find(x => x.id === membership.districtId);
    if (d) {
      districts.push({ id: d.id, name: d.name, kind: 'district' });
      districtIds.add(d.id);
    }
  }

  if (membership.zoneId) {
    const z = getAllZones().find(x => x.id === membership.zoneId && x.is_active);
    if (z) {
      zones.push({ id: z.id, name: z.name, kind: 'zone', parentId: z.district_id });
      // 하위조직에 속하면 부모 상위조직도 선택 가능 범위에 포함
      if (z.district_id && !districtIds.has(z.district_id)) {
        const parent = getDistricts().find(x => x.id === z.district_id);
        if (parent) {
          districts.push({ id: parent.id, name: parent.name, kind: 'district' });
          districtIds.add(parent.id);
        }
      }
    }
  }

  for (const depId of membership.departmentIds) {
    const d = getDepartments().find(x => x.id === depId);
    if (d) departments.push({ id: d.id, name: d.name, kind: 'department' });
  }

  return { districts, zones, departments };
}

export function getAllEligibleGroupIds(user: AppUser | null): Set<string> {
  const g = getEligibleGroupsForUser(user);
  return new Set([
    ...g.districts.map(x => x.id),
    ...g.zones.map(x => x.id),
    ...g.departments.map(x => x.id),
  ]);
}

export function getCurrentUserFromStorage(): AppUser | null {
  try {
    const raw = localStorage.getItem('churchieum_demo_user');
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

/** 저장 전 공유 대상 검증 및 정규화 */
export function validateGraceNoteShare(
  state: Partial<GraceShareFields>,
  user: AppUser | null,
): GraceShareValidationResult {
  const membership = resolveUserOrgMembership(user);
  if (!membership) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }

  const labels = getOrganizationLabels();
  const visibility = state.visibility ?? 'private';

  if (visibility === 'private' || visibility === 'public') {
    return {
      ok: true,
      sanitized: emptyShareFields(visibility),
    };
  }

  const eligiblePastors = getEligiblePastorsForUser(user);
  const eligiblePastorIds = new Set(eligiblePastors.map(p => p.id));
  const eligible = getEligibleGroupsForUser(user);
  const eligibleUpperIds = new Set(eligible.districts.map(d => d.id));
  const eligibleLowerIds = new Set(eligible.zones.map(z => z.id));
  const eligibleDeptIds = new Set(eligible.departments.map(d => d.id));
  const eligibleGroupIds = getAllEligibleGroupIds(user);

  if (visibility === 'pastor') {
    if (eligiblePastors.length === 0) {
      return { ok: false, error: '현재 연결된 담당 교역자가 없습니다.' };
    }

    const sharedPastorAll = !!state.sharedPastorAll;
    let sharedPastorIds = uniqueIds(state.sharedPastorIds);

    if (sharedPastorAll) {
      sharedPastorIds = [];
    } else {
      const invalid = sharedPastorIds.filter(id => !eligiblePastorIds.has(id));
      if (invalid.length > 0) {
        return { ok: false, error: '선택할 수 없는 교역자가 포함되어 있습니다.' };
      }
      if (sharedPastorIds.length === 0) {
        return { ok: false, error: '공유할 교역자를 선택해주세요.' };
      }
    }

    return {
      ok: true,
      sanitized: {
        ...emptyShareFields('pastor'),
        sharedPastorAll,
        sharedPastorIds,
      },
    };
  }

  if (visibility === 'group') {
    if (eligibleGroupIds.size === 0) {
      return {
        ok: false,
        error: `현재 소속된 ${labels.upper} 또는 ${labels.department}가 없습니다.`,
      };
    }

    const sharedGroupAll = !!state.sharedGroupAll;
    let split = splitOrganizationShareIds(state);
    let upper = split.upper;
    let lower = split.lower;
    let departments = split.departments;

    if (sharedGroupAll) {
      upper = eligible.districts.map(d => d.id);
      lower = eligible.zones.map(z => z.id);
      departments = eligible.departments.map(d => d.id);
    }

    // 하위조직이 있으면 부모 상위조직 자동 보완
    upper = ensureParentUpperIds(lower, upper);

    const invalidUpper = upper.filter(id => !eligibleUpperIds.has(id));
    const invalidLower = lower.filter(id => !eligibleLowerIds.has(id));
    const invalidDept = departments.filter(id => !eligibleDeptIds.has(id));
    if (invalidUpper.length || invalidLower.length || invalidDept.length) {
      return { ok: false, error: `선택할 수 없는 ${labels.upper}·${labels.lower}·${labels.department}가 포함되어 있습니다.` };
    }

    // 부모에 속하지 않는 하위조직 거부 (자동 보완 후에도 소속 밖이면 실패)
    for (const lid of lower) {
      const zone = eligible.zones.find(z => z.id === lid);
      const parentId = zone?.parentId;
      if (parentId && !upper.includes(parentId)) {
        return { ok: false, error: `${labels.lower} 선택 시 부모 ${labels.upper}이(가) 필요합니다.` };
      }
    }

    const sharedGroupIds = composeSharedGroupIds(upper, lower, departments);
    if (sharedGroupIds.length === 0) {
      return {
        ok: false,
        error: `공유할 ${labels.upper} 또는 ${labels.department}를 선택해주세요.`,
      };
    }

    return {
      ok: true,
      sanitized: {
        ...emptyShareFields('group'),
        sharedGroupAll: false,
        sharedGroupIds,
        sharedUpperOrganizationIds: uniqueIds(upper),
        sharedLowerOrganizationIds: uniqueIds(lower),
        sharedDepartmentIds: uniqueIds(departments),
      },
    };
  }

  return { ok: false, error: '잘못된 공개 범위입니다.' };
}

function sanitizeShareOnRead(
  note: Partial<GraceShareFields>,
  user: AppUser | null,
): GraceShareFields {
  const result = validateGraceNoteShare(note, user);
  if (result.ok) return result.sanitized;
  return {
    ...emptyShareFields(note.visibility ?? 'private'),
  };
}

/** create/update 시 데이터 계층 검증 */
export function applyGraceShareValidation<T extends Partial<GraceShareFields>>(
  input: T,
  user?: AppUser | null,
): T & GraceShareFields {
  const u = user ?? getCurrentUserFromStorage();
  const result = validateGraceNoteShare(input, u);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return { ...input, ...result.sanitized };
}

/** 기존 저장값을 현재 소속 기준으로 정리 (허용되지 않은 ID 제거) */
export function filterShareStateToMembership(
  state: GraceShareFields,
  user: AppUser | null,
): GraceShareFields {
  const eligiblePastorIds = new Set(getEligiblePastorsForUser(user).map(p => p.id));
  const eligible = getEligibleGroupsForUser(user);
  const eligibleUpperIds = new Set(eligible.districts.map(d => d.id));
  const eligibleLowerIds = new Set(eligible.zones.map(z => z.id));
  const eligibleDeptIds = new Set(eligible.departments.map(d => d.id));
  const eligibleGroupIds = getAllEligibleGroupIds(user);

  if (state.visibility === 'pastor') {
    if (eligiblePastorIds.size === 0) {
      return emptyShareFields('private');
    }
    if (state.sharedPastorAll) {
      return { ...emptyShareFields('pastor'), sharedPastorAll: true };
    }
    return {
      ...emptyShareFields('pastor'),
      sharedPastorIds: uniqueIds(state.sharedPastorIds).filter(id => eligiblePastorIds.has(id)),
    };
  }

  if (state.visibility === 'group') {
    if (eligibleGroupIds.size === 0) {
      return emptyShareFields('private');
    }
    if (state.sharedGroupAll) {
      return { ...emptyShareFields('group'), sharedGroupAll: true };
    }
    let upper = uniqueIds(state.sharedUpperOrganizationIds).filter(id => eligibleUpperIds.has(id));
    let lower = uniqueIds(state.sharedLowerOrganizationIds).filter(id => eligibleLowerIds.has(id));
    let departments = uniqueIds(state.sharedDepartmentIds).filter(id => eligibleDeptIds.has(id));

    if (!upper.length && !lower.length && !departments.length) {
      const split = splitOrganizationShareIds(state);
      upper = split.upper.filter(id => eligibleUpperIds.has(id));
      lower = split.lower.filter(id => eligibleLowerIds.has(id));
      departments = split.departments.filter(id => eligibleDeptIds.has(id));
    }

    upper = ensureParentUpperIds(lower, upper).filter(id => eligibleUpperIds.has(id));
    const sharedGroupIds = composeSharedGroupIds(upper, lower, departments);

    return {
      ...emptyShareFields('group'),
      sharedUpperOrganizationIds: upper,
      sharedLowerOrganizationIds: lower,
      sharedDepartmentIds: departments,
      sharedGroupIds,
    };
  }

  return sanitizeShareOnRead(state, user);
}

function resolveMembershipForAuthor(note: {
  userId?: string;
  authorName?: string;
  authorDistrictId?: string;
  authorZoneId?: string;
  authorDepartmentIds?: string[];
}): UserOrgMembership | null {
  if (note.authorDistrictId || note.authorZoneId || (note.authorDepartmentIds?.length ?? 0) > 0) {
    return {
      userId: note.userId ?? `author-${note.authorName ?? 'unknown'}`,
      districtId: note.authorDistrictId,
      zoneId: note.authorZoneId,
      departmentIds: uniqueIds(note.authorDepartmentIds),
    };
  }

  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      members?: Array<{
        id: string;
        name: string;
        email?: string;
        districtId?: string;
        zoneId?: string;
        departmentIds?: string[];
      }>;
    };
    let member = note.userId
      ? data.members?.find(m => m.id === note.userId)
      : undefined;
    if (!member && note.authorName) {
      member = data.members?.find(m => m.name === note.authorName);
    }
    if (!member) return null;
    return resolveUserOrgMembership({
      id: member.id,
      email: member.email ?? '',
      name: member.name,
      role: 'member',
      districtId: member.districtId,
      zoneId: member.zoneId,
      departmentIds: member.departmentIds,
    });
  } catch {
    return null;
  }
}

/** 교역자가 해당 성도 소속을 담당하는지 */
export function pastorShepherdsMembership(
  pastorId: string,
  membership: UserOrgMembership | null,
): boolean {
  if (!membership) return false;
  return getAllActiveAssignments().some(a => {
    if (a.pastorId !== pastorId || !a.isActive) return false;
    if (a.zoneId && membership.zoneId && a.zoneId === membership.zoneId) return true;
    if (a.districtId && membership.districtId && a.districtId === membership.districtId) return true;
    if (a.departmentId && membership.departmentIds.includes(a.departmentId)) return true;
    return false;
  });
}

export type GraceNoteViewKind =
  | 'own'
  | 'pastor_author'
  | 'group_upper'
  | 'group_lower'
  | 'group_department'
  | 'public';

export type GraceNoteViewInfo = {
  kind: GraceNoteViewKind;
  badgeLabel: string;
};

function viewerMembershipIds(membership: UserOrgMembership | null): {
  upper: Set<string>;
  lower: Set<string>;
  dept: Set<string>;
  all: Set<string>;
} {
  const upper = new Set<string>();
  const lower = new Set<string>();
  const dept = new Set<string>();
  if (membership?.districtId) upper.add(membership.districtId);
  if (membership?.zoneId) lower.add(membership.zoneId);
  for (const id of membership?.departmentIds ?? []) dept.add(id);
  return { upper, lower, dept, all: new Set([...upper, ...lower, ...dept]) };
}

function noteSharedGroupParts(note: {
  sharedGroupAll?: boolean;
  sharedGroupIds?: string[];
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
}): { upper: string[]; lower: string[]; departments: string[] } {
  if (note.sharedGroupAll) {
    return { upper: [], lower: [], departments: [] };
  }
  return splitOrganizationShareIds(note);
}

/** 성도 모아보기 — 열람 가능 여부 */
export function canMemberViewGraceNote(
  note: {
    visibility?: string;
    userId?: string;
    authorName?: string;
    authorDistrictId?: string;
    authorZoneId?: string;
    authorDepartmentIds?: string[];
    sharedGroupAll?: boolean;
    sharedGroupIds?: string[];
    sharedUpperOrganizationIds?: string[];
    sharedLowerOrganizationIds?: string[];
    sharedDepartmentIds?: string[];
    sharedPastorAll?: boolean;
    sharedPastorIds?: string[];
  },
  viewer: AppUser | null,
): boolean {
  return getGraceNoteViewInfo(note, viewer) !== null;
}

/** 성도 모아보기 — 관계 배지/분류 (열람 불가 시 null) */
export function getGraceNoteViewInfo(
  note: {
    visibility?: string;
    userId?: string;
    authorName?: string;
    authorDistrictId?: string;
    authorZoneId?: string;
    authorDepartmentIds?: string[];
    sharedGroupAll?: boolean;
    sharedGroupIds?: string[];
    sharedUpperOrganizationIds?: string[];
    sharedLowerOrganizationIds?: string[];
    sharedDepartmentIds?: string[];
  },
  viewer: AppUser | null,
): GraceNoteViewInfo | null {
  if (!viewer) return null;

  const isOwn = Boolean(viewer.id && note.userId === viewer.id);

  if (isOwn) {
    return { kind: 'own', badgeLabel: '내 기록' };
  }

  const visibility = note.visibility ?? 'private';
  if (visibility === 'private') return null;

  const myMembership = resolveUserOrgMembership(viewer);
  const myIds = viewerMembershipIds(myMembership);
  const authorMembership = resolveMembershipForAuthor(note);

  // 담당 교역자가 작성한 공개·조직공유 기록
  const myPastors = getEligiblePastorsForUser(viewer);
  const authorIsMyPastor = myPastors.some(p => {
    const clergy = getAllClergy().find(c => c.id === p.id);
    return clergy && (clergy.name === note.authorName || note.userId === `clergy-${p.id}`);
  });

  if (visibility === 'public') {
    if (authorIsMyPastor) {
      return { kind: 'pastor_author', badgeLabel: '담당 교역자' };
    }
    return { kind: 'public', badgeLabel: '전체 공개' };
  }

  if (visibility === 'group') {
    const parts = noteSharedGroupParts(note);
    const authorEligible = authorMembership
      ? getAllEligibleGroupIds({
          id: authorMembership.userId,
          email: '',
          name: note.authorName ?? '',
          role: 'member',
          districtId: authorMembership.districtId,
          zoneId: authorMembership.zoneId,
          departmentIds: authorMembership.departmentIds,
        } as AppUser)
      : new Set<string>();

    const sharedUpper = note.sharedGroupAll
      ? [...(authorMembership?.districtId ? [authorMembership.districtId] : [])]
      : parts.upper.filter(id => authorEligible.size === 0 || authorEligible.has(id));
    const sharedLower = note.sharedGroupAll
      ? [...(authorMembership?.zoneId ? [authorMembership.zoneId] : [])]
      : parts.lower.filter(id => authorEligible.size === 0 || authorEligible.has(id));
    const sharedDept = note.sharedGroupAll
      ? [...(authorMembership?.departmentIds ?? [])]
      : parts.departments.filter(id => authorEligible.size === 0 || authorEligible.has(id));

    const hitDept = sharedDept.find(id => myIds.dept.has(id));
    if (hitDept) {
      return {
        kind: 'group_department',
        badgeLabel: `${getDepartmentNameById(hitDept)} 공유`,
      };
    }
    const hitLower = sharedLower.find(id => myIds.lower.has(id));
    if (hitLower) {
      return {
        kind: 'group_lower',
        badgeLabel: `${getZoneNameById(hitLower)} 공유`,
      };
    }
    const hitUpper = sharedUpper.find(id => myIds.upper.has(id));
    if (hitUpper) {
      return {
        kind: 'group_upper',
        badgeLabel: `${getDistrictNameById(hitUpper)} 공유`,
      };
    }

    // 전체 선택으로 작성자 소속 전부 공유
    if (note.sharedGroupAll && authorMembership) {
      if (authorMembership.districtId && myIds.upper.has(authorMembership.districtId)) {
        return {
          kind: 'group_upper',
          badgeLabel: `${getDistrictNameById(authorMembership.districtId)} 공유`,
        };
      }
      if (authorMembership.zoneId && myIds.lower.has(authorMembership.zoneId)) {
        return {
          kind: 'group_lower',
          badgeLabel: `${getZoneNameById(authorMembership.zoneId)} 공유`,
        };
      }
      const deptHit = authorMembership.departmentIds.find(id => myIds.dept.has(id));
      if (deptHit) {
        return {
          kind: 'group_department',
          badgeLabel: `${getDepartmentNameById(deptHit)} 공유`,
        };
      }
    }
    return null;
  }

  // 다른 성도의 교역자 공유는 성도 모아보기에서 비공개
  if (visibility === 'pastor') {
    if (authorIsMyPastor) {
      return { kind: 'pastor_author', badgeLabel: '담당 교역자' };
    }
    return null;
  }

  return null;
}

export function getVisibleGraceNotesForMember<T extends {
  visibility?: string;
  userId?: string;
  authorName?: string;
  authorDistrictId?: string;
  authorZoneId?: string;
  authorDepartmentIds?: string[];
  sharedGroupAll?: boolean;
  sharedGroupIds?: string[];
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
  createdAt: string;
}>(notes: T[], viewer: AppUser | null): T[] {
  return notes.filter(n => canMemberViewGraceNote(n, viewer));
}

const VIEW_KIND_PRIORITY: Record<GraceNoteViewKind, number> = {
  own: 0,
  pastor_author: 1,
  group_upper: 2,
  group_lower: 2,
  group_department: 2,
  public: 3,
};

export function sortGraceNotesForMemberView<T extends {
  visibility?: string;
  userId?: string;
  authorName?: string;
  authorDistrictId?: string;
  authorZoneId?: string;
  authorDepartmentIds?: string[];
  sharedGroupAll?: boolean;
  sharedGroupIds?: string[];
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
  createdAt: string;
}>(notes: T[], viewer: AppUser | null, sortOrder: 'newest' | 'oldest' = 'newest'): T[] {
  return [...notes].sort((a, b) => {
    const ia = getGraceNoteViewInfo(a, viewer);
    const ib = getGraceNoteViewInfo(b, viewer);
    const pa = ia ? VIEW_KIND_PRIORITY[ia.kind] : 99;
    const pb = ib ? VIEW_KIND_PRIORITY[ib.kind] : 99;
    if (pa !== pb) return pa - pb;
    return sortOrder === 'newest'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt);
  });
}

/** 목회자가 공유받은 은혜기록인지 (나만 보기 제외, 담당 성도만) */
export function canPastorViewSharedGraceNote(
  note: {
    visibility?: string;
    sharedPastorAll?: boolean;
    sharedPastorIds?: string[];
    sharedGroupAll?: boolean;
    sharedGroupIds?: string[];
    sharedUpperOrganizationIds?: string[];
    sharedLowerOrganizationIds?: string[];
    sharedDepartmentIds?: string[];
    userId?: string;
    authorName?: string;
    authorDistrictId?: string;
    authorZoneId?: string;
    authorDepartmentIds?: string[];
  },
  viewer: AppUser | null,
): boolean {
  if (!viewer || viewer.role === 'member') return false;
  if (note.visibility === 'private' || !note.visibility) return false;

  const authorMembership = resolveMembershipForAuthor(note);
  const authorAsUser = authorMembership
    ? ({
        id: authorMembership.userId,
        email: '',
        name: note.authorName ?? '',
        role: 'member' as const,
        districtId: authorMembership.districtId,
        zoneId: authorMembership.zoneId,
        departmentIds: authorMembership.departmentIds,
      })
    : null;

  if (viewer.role === 'super_admin') {
    // 최고관리자도 담당 범위 밖 private는 이미 제외. 공개·공유만.
    return true;
  }

  const clergy = viewer.email ? getClergyByEmail(viewer.email) : null;
  const pastorId = clergy?.id;
  if (!pastorId) return false;

  // 담당 성도 소속이어야 함
  if (!pastorShepherdsMembership(pastorId, authorMembership)) return false;

  if (note.visibility === 'public') return true;

  if (note.visibility === 'pastor') {
    if (note.sharedPastorIds?.includes(pastorId)) return true;
    if (note.sharedPastorAll && authorAsUser) {
      return getEligiblePastorsForUser(authorAsUser).some(p => p.id === pastorId);
    }
    return false;
  }

  if (note.visibility === 'group' && authorAsUser) {
    const authorGroupIds = getAllEligibleGroupIds(authorAsUser);
    const split = splitOrganizationShareIds(note);
    const listed = composeSharedGroupIds(split.upper, split.lower, split.departments);
    const sharedIds = note.sharedGroupAll
      ? [...authorGroupIds]
      : uniqueIds(listed.length ? listed : note.sharedGroupIds).filter(id => authorGroupIds.has(id));
    if (sharedIds.length === 0) return false;

    const assignments = getAllActiveAssignments().filter(
      a => a.pastorId === pastorId && a.isActive,
    );
    return assignments.some(a =>
      (a.districtId && sharedIds.includes(a.districtId)) ||
      (a.zoneId && sharedIds.includes(a.zoneId)) ||
      (a.departmentId && sharedIds.includes(a.departmentId)),
    );
  }

  return false;
}
