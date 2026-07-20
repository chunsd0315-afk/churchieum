/**
 * 은혜기록 공유 대상 — 사용자 실제 소속 조직 기준으로 제한
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
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
import { migrateVisibility, isLegacyPublic } from '../types/sharedContent';
import { getAllOrganizations } from './organizationStorage';
import {
  flattenOrgFilterTree,
  getUserOrganizationTree,
  resolveOrgTreeMode,
} from './userOrganizationTree';

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

/** 조직 트리 다중 선택 → 상위·하위·부서 ID 분류 */
export function organizationIdsToShareSplit(selectedIds: string[]): {
  upper: string[];
  lower: string[];
  departments: string[];
} {
  const orgById = new Map(getAllOrganizations().map(o => [o.id, o]));
  const upper: string[] = [];
  const lower: string[] = [];
  const departments: string[] = [];
  const unknown: string[] = [];

  for (const id of uniqueIds(selectedIds)) {
    const o = orgById.get(id);
    if (o?.legacyKind === 'district') upper.push(id);
    else if (o?.legacyKind === 'zone') lower.push(id);
    else if (o?.legacyKind === 'department') departments.push(id);
    else unknown.push(id);
  }

  if (unknown.length > 0) {
    const leg = splitOrganizationShareIds({ sharedGroupIds: unknown });
    upper.push(...leg.upper);
    lower.push(...leg.lower);
    departments.push(...leg.departments);
  }

  const l = uniqueIds(lower);
  const u = ensureParentUpperIds(l, uniqueIds(upper));
  return { upper: u, lower: l, departments: uniqueIds(departments) };
}

/** 작성·공유 — 사용자가 선택 가능한 조직 ID (트리 기준) */
export function getShareSelectableOrgClassification(user: AppUser | null): {
  upper: Set<string>;
  lower: Set<string>;
  departments: Set<string>;
  all: Set<string>;
} {
  const upper = new Set<string>();
  const lower = new Set<string>();
  const departments = new Set<string>();
  const all = new Set<string>();

  if (!user) return { upper, lower, departments, all };

  const mode = resolveOrgTreeMode(user);
  const scopes = isSuperAdmin(user) ? (['mine', 'all'] as const) : (['mine'] as const);

  for (const scope of scopes) {
    const tree = getUserOrganizationTree({ user, mode, scope });
    for (const node of flattenOrgFilterTree(tree)) {
      if (!node.selectable) continue;
      all.add(node.id);
      if (node.legacyKind === 'district') upper.add(node.id);
      else if (node.legacyKind === 'zone') lower.add(node.id);
      else if (node.legacyKind === 'department') departments.add(node.id);
    }
  }

  return { upper, lower, departments, all };
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
  const visibility = migrateVisibility(state.visibility);

  if (visibility === 'private') {
    return {
      ok: true,
      sanitized: emptyShareFields('private'),
    };
  }

  const eligiblePastors = getEligiblePastorsForUser(user);
  const eligiblePastorIds = new Set(eligiblePastors.map(p => p.id));
  const eligible = getEligibleGroupsForUser(user);
  const eligibleUpperIds = new Set(eligible.districts.map(d => d.id));
  const eligibleLowerIds = new Set(eligible.zones.map(z => z.id));
  const eligibleDeptIds = new Set(eligible.departments.map(d => d.id));
  const eligibleGroupIds = getAllEligibleGroupIds(user);

  if (visibility === 'pastor_share') {
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
        ...emptyShareFields('pastor_share'),
        sharedPastorAll,
        sharedPastorIds,
      },
    };
  }

  if (visibility === 'organization_share') {
    const selectable = getShareSelectableOrgClassification(user);
    if (selectable.all.size === 0) {
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
      upper = [...selectable.upper];
      lower = [...selectable.lower];
      departments = [...selectable.departments];
    }

    upper = ensureParentUpperIds(lower, upper);

    const sharedGroupIds = composeSharedGroupIds(upper, lower, departments);
    const invalid = sharedGroupIds.filter(id => !selectable.all.has(id));
    if (invalid.length > 0) {
      return {
        ok: false,
        error: `선택할 수 없는 ${labels.upper}·${labels.lower}·${labels.department}가 포함되어 있습니다.`,
      };
    }

    for (const lid of lower) {
      const zone = getAllZones().find(z => z.id === lid);
      const parentId = zone?.district_id;
      if (parentId && !upper.includes(parentId)) {
        return { ok: false, error: `${labels.lower} 선택 시 부모 ${labels.upper}이(가) 필요합니다.` };
      }
    }

    if (sharedGroupIds.length === 0) {
      return {
        ok: false,
        error: '공유할 교구·부서를 선택해 주세요.',
      };
    }

    return {
      ok: true,
      sanitized: {
        ...emptyShareFields('organization_share'),
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
  const visibility = migrateVisibility(state.visibility);

  if (visibility === 'pastor_share') {
    if (eligiblePastorIds.size === 0) {
      return emptyShareFields('private');
    }
    if (state.sharedPastorAll) {
      return { ...emptyShareFields('pastor_share'), sharedPastorAll: true };
    }
    return {
      ...emptyShareFields('pastor_share'),
      sharedPastorIds: uniqueIds(state.sharedPastorIds).filter(id => eligiblePastorIds.has(id)),
    };
  }

  if (visibility === 'organization_share') {
    const selectable = getShareSelectableOrgClassification(user);
    if (selectable.all.size === 0) {
      return emptyShareFields('private');
    }
    if (state.sharedGroupAll || isLegacyPublic(state.visibility)) {
      return {
        ...emptyShareFields('organization_share'),
        sharedGroupAll: true,
        sharedUpperOrganizationIds: [...selectable.upper],
        sharedLowerOrganizationIds: [...selectable.lower],
        sharedDepartmentIds: [...selectable.departments],
        sharedGroupIds: composeSharedGroupIds(
          [...selectable.upper],
          [...selectable.lower],
          [...selectable.departments],
        ),
      };
    }
    let upper = uniqueIds(state.sharedUpperOrganizationIds).filter(id => selectable.all.has(id));
    let lower = uniqueIds(state.sharedLowerOrganizationIds).filter(id => selectable.all.has(id));
    let departments = uniqueIds(state.sharedDepartmentIds).filter(id => selectable.all.has(id));

    if (!upper.length && !lower.length && !departments.length) {
      const split = splitOrganizationShareIds(state);
      upper = split.upper.filter(id => selectable.all.has(id));
      lower = split.lower.filter(id => selectable.all.has(id));
      departments = split.departments.filter(id => selectable.all.has(id));
    }

    upper = ensureParentUpperIds(lower, upper).filter(id => selectable.all.has(id));
    const sharedGroupIds = composeSharedGroupIds(upper, lower, departments);

    return {
      ...emptyShareFields('organization_share'),
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
  | 'pastor_share'
  | 'group_upper'
  | 'group_lower'
  | 'group_department'
  | 'public';

export type GraceNoteFilterBucket =
  | 'own'
  | 'pastor_share'
  | 'group_org'
  | 'group_dept'
  | 'public';

export type GraceNoteViewInfo = {
  kind: GraceNoteViewKind;
  badgeLabel: string;
  badges: string[];
  buckets: GraceNoteFilterBucket[];
};

export type GraceNoteVisibilityInput = {
  id?: string;
  visibility?: string;
  userId?: string;
  authorName?: string;
  authorDistrictId?: string;
  authorZoneId?: string;
  authorDepartmentIds?: string[];
  sharedPastorAll?: boolean;
  sharedPastorIds?: string[];
  sharedGroupAll?: boolean;
  sharedGroupIds?: string[];
  sharedUpperOrganizationIds?: string[];
  sharedLowerOrganizationIds?: string[];
  sharedDepartmentIds?: string[];
  createdAt?: string;
  isFavorite?: boolean;
};

function getViewerClergyId(viewer: AppUser): string | null {
  return viewer.email ? (getClergyByEmail(viewer.email)?.id ?? null) : null;
}

/** 작성자가 교역자(clergy)인 경우 clergy id */
function resolveAuthorClergyId(note: GraceNoteVisibilityInput): string | null {
  if (!note.userId && !note.authorName) return null;
  const clergy = getAllClergy();
  if (note.userId?.startsWith('demo-')) {
    const local = note.userId.slice('demo-'.length);
    const byEmail = clergy.find(c =>
      (c.email ?? '').toLowerCase().startsWith(`${local.toLowerCase()}@`),
    );
    if (byEmail) return byEmail.id;
  }
  if (note.userId) {
    const byId = clergy.find(c => c.id === note.userId);
    if (byId) return byId.id;
  }
  if (note.authorName) {
    const byName = clergy.find(c => c.name === note.authorName && c.status === 'active');
    if (byName) return byName.id;
  }
  return null;
}

/** 성도 — 내 담당 교역자가 작성한 기록인지 */
function isAuthoredByMyShepherdPastor(
  note: GraceNoteVisibilityInput,
  viewer: AppUser,
): boolean {
  const membership = resolveUserOrgMembership(viewer);
  if (!membership) return false;
  const authorClergyId = resolveAuthorClergyId(note);
  if (!authorClergyId) return false;
  return pastorShepherdsMembership(authorClergyId, membership);
}

/** 소속 + (교역자/관리자) 담당 조직 범위 */
export function getViewerOrganizationScope(viewer: AppUser): {
  upper: Set<string>;
  lower: Set<string>;
  dept: Set<string>;
} {
  const membership = resolveUserOrgMembership(viewer);
  const upper = new Set<string>();
  const lower = new Set<string>();
  const dept = new Set<string>();

  if (membership?.districtId) upper.add(membership.districtId);
  if (membership?.zoneId) lower.add(membership.zoneId);
  for (const id of membership?.departmentIds ?? []) dept.add(id);

  for (const id of viewer.assignedDistrictIds ?? []) upper.add(id);
  for (const id of viewer.assignedZoneIds ?? []) lower.add(id);
  for (const id of viewer.assignedDepartmentIds ?? []) dept.add(id);

  if (viewer.role === 'pastor' || viewer.role === 'super_admin') {
    const clergyId = getViewerClergyId(viewer);
    if (clergyId) {
      for (const a of getAllActiveAssignments()) {
        if (a.pastorId !== clergyId || !a.isActive) continue;
        if (a.districtId) upper.add(a.districtId);
        if (a.zoneId) lower.add(a.zoneId);
        if (a.departmentId) dept.add(a.departmentId);
      }
    }
  }

  return { upper, lower, dept };
}

function isOwnNote(note: GraceNoteVisibilityInput, viewer: AppUser): boolean {
  return Boolean(viewer.id && note.userId && note.userId === viewer.id);
}

function matchesPastorShareToViewer(
  note: GraceNoteVisibilityInput,
  viewer: AppUser,
): boolean {
  const clergyId = getViewerClergyId(viewer);
  if (!clergyId) return false;

  if (note.sharedPastorIds?.includes(clergyId)) return true;

  if (note.sharedPastorAll) {
    const authorMembership = resolveMembershipForAuthor(note);
    if (!authorMembership) return false;
    if (pastorShepherdsMembership(clergyId, authorMembership)) return true;
    const authorAsUser: AppUser = {
      id: authorMembership.userId,
      email: '',
      name: note.authorName ?? '',
      role: 'member',
      districtId: authorMembership.districtId,
      zoneId: authorMembership.zoneId,
      departmentIds: authorMembership.departmentIds,
    };
    return getEligiblePastorsForUser(authorAsUser).some(p => p.id === clergyId);
  }
  return false;
}

function matchGroupShare(
  note: GraceNoteVisibilityInput,
  scope: { upper: Set<string>; lower: Set<string>; dept: Set<string> },
): { kind: GraceNoteViewKind; badgeLabel: string; bucket: GraceNoteFilterBucket } | null {
  // 레거시 전체공개 (isLegacyPublic) 또는 전체선택(sharedGroupAll) — 소속과 무관하게 전체 공개로 취급
  if (note.sharedGroupAll || isLegacyPublic(note.visibility)) {
    return { kind: 'public', badgeLabel: '전체 공개', bucket: 'public' };
  }

  const parts = splitOrganizationShareIds(note);

  const hitLower = parts.lower.find(id => scope.lower.has(id));
  if (hitLower) {
    const zone = getAllZones().find(z => z.id === hitLower);
    const upperName = zone ? getDistrictNameById(zone.district_id) : '';
    const lowerName = getZoneNameById(hitLower);
    const label =
      upperName && upperName !== '-'
        ? `${upperName} > ${lowerName} 공유`
        : `${lowerName} 공유`;
    return { kind: 'group_lower', badgeLabel: label, bucket: 'group_org' };
  }

  const hitUpper = parts.upper.find(id => scope.upper.has(id));
  if (hitUpper) {
    return {
      kind: 'group_upper',
      badgeLabel: `${getDistrictNameById(hitUpper)} 공유`,
      bucket: 'group_org',
    };
  }

  const hitDept = parts.departments.find(id => scope.dept.has(id));
  if (hitDept) {
    return {
      kind: 'group_department',
      badgeLabel: `${getDepartmentNameById(hitDept)} 공유`,
      bucket: 'group_dept',
    };
  }

  return null;
}

/**
 * 모아보기 — 현재 사용자가 이 기록을 볼 수 있는지 + 배지/필터 근거
 * (성도·교역자·최고관리자 공통. 남의 나만 보기는 절대 불가)
 */
export function getGraceNoteViewInfo(
  note: GraceNoteVisibilityInput,
  viewer: AppUser | null,
): GraceNoteViewInfo | null {
  if (!viewer) return null;

  const visibility = migrateVisibility(note.visibility);
  const own = isOwnNote(note, viewer);

  if (own) {
    const badges = ['내 기록'];
    const buckets: GraceNoteFilterBucket[] = ['own'];
    if (visibility === 'pastor_share') {
      buckets.push('pastor_share');
      badges.push('담당 교역자 공유');
    }
    if (visibility === 'organization_share') {
      const scope = getViewerOrganizationScope(viewer);
      const g = matchGroupShare(note, scope);
      if (g) {
        buckets.push(g.bucket);
        badges.push(g.badgeLabel);
      } else {
        buckets.push('group_org');
      }
    }
    return { kind: 'own', badgeLabel: '내 기록', badges, buckets };
  }

  // 다른 사람 나만 보기 — 역할과 무관하게 불가 (최고관리자 포함)
  if (visibility === 'private') return null;

  const scope = getViewerOrganizationScope(viewer);

  if (visibility === 'pastor_share') {
    // 최고관리자: 모든 pastor_share 조회 (일반 모아보기 공유받은 기록)
    if (isSuperAdmin(viewer)) {
      return {
        kind: 'pastor_share',
        badgeLabel: '담당 교역자 공유',
        badges: ['담당 교역자 공유'],
        buckets: ['pastor_share'],
      };
    }
    // 교역자: 본인에게 직접 공유된 기록만 (성도는 pastor_share 조회 불가)
    if (matchesPastorShareToViewer(note, viewer)) {
      return {
        kind: 'pastor_share',
        badgeLabel: '담당 교역자 공유',
        badges: ['담당 교역자 공유'],
        buckets: ['pastor_share'],
      };
    }
    return null;
  }

  if (visibility === 'organization_share') {
    if (isSuperAdmin(viewer)) {
      const labels = formatOrganizationShareDisplayLabels({
        sharedGroupIds: note.sharedGroupIds,
        sharedUpperOrganizationIds: note.sharedUpperOrganizationIds,
        sharedLowerOrganizationIds: note.sharedLowerOrganizationIds,
        sharedDepartmentIds: note.sharedDepartmentIds,
      });
      const badge = labels[0] ? (labels[0].endsWith('공유') ? labels[0] : `${labels[0]} 공유`) : '교구·부서 공유';
      return {
        kind: 'group_department',
        badgeLabel: badge,
        badges: [badge],
        buckets: ['group_org'],
      };
    }
    const g = matchGroupShare(note, scope);
    if (!g) return null;
    return {
      kind: g.kind,
      badgeLabel: g.badgeLabel,
      badges: [g.badgeLabel],
      buckets: [g.bucket],
    };
  }

  return null;
}

/** @deprecated use getGraceNoteViewInfo / getVisibleGraceNotesForUser */
export function canMemberViewGraceNote(
  note: GraceNoteVisibilityInput,
  viewer: AppUser | null,
): boolean {
  return getGraceNoteViewInfo(note, viewer) !== null;
}

/** 데이터 계층 — 현재 사용자가 볼 수 있는 은혜기록만 반환 (중복 없음) */
export function getVisibleGraceNotesForUser<T extends GraceNoteVisibilityInput & { id?: string }>(
  notes: T[],
  viewer: AppUser | null,
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const n of notes) {
    if (!getGraceNoteViewInfo(n, viewer)) continue;
    const key = n.id ?? `${n.userId}-${n.createdAt}-${n.authorName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(n);
  }
  return result;
}

/**
 * 모아보기 탭
 * UI는 mine / shared 만 사용.
 * pastor_members·organization·admin_* 는 레거시·관리 확장용으로 유지.
 */
export type GraceCollectTab =
  | 'mine'
  | 'shared'
  | 'pastor_members'
  | 'organization'
  | 'admin_shared'
  | 'admin_audit';

/** 공통 UI 탭 (모든 모드) */
export const GRACE_COLLECTION_UI_TABS: { id: GraceCollectTab; label: string }[] = [
  { id: 'mine', label: '내 기록' },
  { id: 'shared', label: '공유받은 기록' },
];

/** 공유받은 기록 상세 구분 */
export type GraceSharedShareKind = 'pastor' | 'upper' | 'lower' | 'department';

/**
 * 공유받은 기록(shared) = 타인의 organization_share만 포함.
 * 타인의 pastor_share는 성도 모아보기에는 노출하지 않는다.
 */
export function getGraceCollectTab(
  note: GraceNoteVisibilityInput,
  viewer: AppUser | null,
): GraceCollectTab | null {
  if (!viewer) return null;
  if (isOwnNote(note, viewer)) return 'mine';
  const info = getGraceNoteViewInfo(note, viewer);
  if (!info) return null;
  const visibility = migrateVisibility(note.visibility);
  if (visibility === 'pastor_share') return 'pastor_members';
  if (visibility === 'organization_share') return 'shared';
  return null;
}

/** 공유받은 기록의 공유 구분 (필터용) */
export function getGraceSharedShareKind(
  note: GraceNoteVisibilityInput,
  viewer: AppUser | null,
): GraceSharedShareKind | null {
  if (!viewer || isOwnNote(note, viewer)) return null;
  const visibility = migrateVisibility(note.visibility);
  if (visibility === 'private') return null;

  if (visibility === 'pastor_share') {
    if (matchesPastorShareToViewer(note, viewer)) return 'pastor';
    return null;
  }

  if (visibility === 'organization_share') {
    if (note.sharedGroupAll || isLegacyPublic(note.visibility)) return null;
    const scope = getViewerOrganizationScope(viewer);
    const parts = splitOrganizationShareIds(note);
    if (parts.lower.some(id => scope.lower.has(id))) return 'lower';
    if (parts.upper.some(id => scope.upper.has(id))) return 'upper';
    if (parts.departments.some(id => scope.dept.has(id))) return 'department';
  }
  return null;
}

/**
 * 목록 카드용 대표 배지 하나
 * - 내 기록: 내가 설정한 공개범위
 * - 공유받은 기록: 공유 근거 (우선순위: 교역자 > 하위 > 상위 > 부서)
 * - 전체 공개: 전체 공개
 */
export function getGraceListBadge(
  note: GraceNoteVisibilityInput,
  viewer: AppUser | null,
  tab: GraceCollectTab,
): string {
  if (!viewer) return '';

  if (tab === 'mine' || isOwnNote(note, viewer)) {
    const visibility = migrateVisibility(note.visibility);
    if (visibility === 'private') return '나만 보기';
    if (visibility === 'pastor_share') return '담당 교역자와 공유';
    if (visibility === 'organization_share') {
      if (note.sharedGroupAll || isLegacyPublic(note.visibility)) return '전체 공개';
      const labels = formatOrganizationShareDisplayLabels({
        sharedGroupIds: note.sharedGroupIds,
        sharedUpperOrganizationIds: note.sharedUpperOrganizationIds,
        sharedLowerOrganizationIds: note.sharedLowerOrganizationIds,
        sharedDepartmentIds: note.sharedDepartmentIds,
      });
      if (labels.length === 0) {
        const org = getOrganizationLabels();
        return `${org.upper}/${org.department} 공유`;
      }
      const lowerLike = labels.find(l => l.includes(' > '));
      const base = lowerLike ?? labels[0];
      return base.endsWith('공유') ? base : `${base} 공유`;
    }
    return '내 기록';
  }

  const info = getGraceNoteViewInfo(note, viewer);
  if (!info) return '공유받음';
  if (info.kind === 'pastor_share') return '담당 교역자 공유';
  return info.badgeLabel || '공유받음';
}

export function getGraceNotesForCollectTab<T extends GraceNoteVisibilityInput & { id?: string; createdAt: string }>(
  notes: T[],
  viewer: AppUser | null,
  tab: GraceCollectTab,
): T[] {
  if (!viewer) return [];

  if (tab === 'mine') {
    return notes.filter(n => isOwnNote(n, viewer));
  }

  if (tab === 'shared') {
    return notes.filter(n => {
      if (isOwnNote(n, viewer)) return false;
      const visibility = migrateVisibility(n.visibility);
      if (visibility === 'private') return false;

      // 성도: 소속 조직 organization_share 만 (타인의 pastor_share 절대 불가)
      if (viewer.role === 'member' && !isSuperAdmin(viewer)) {
        if (visibility !== 'organization_share') return false;
        return getGraceNoteViewInfo(n, viewer) !== null;
      }

      // 교역자: 본인 pastor_share + 조회 가능 organization_share
      if (viewer.role === 'pastor' && !isSuperAdmin(viewer)) {
        if (visibility === 'pastor_share') return matchesPastorShareToViewer(n, viewer);
        if (visibility === 'organization_share') return getGraceNoteViewInfo(n, viewer) !== null;
        return false;
      }

      // 최고관리자: 모든 pastor_share + organization_share (private 제외)
      if (isSuperAdmin(viewer)) {
        if (visibility !== 'pastor_share' && visibility !== 'organization_share') return false;
        return getGraceNoteViewInfo(n, viewer) !== null;
      }

      return false;
    });
  }

  if (tab === 'pastor_members') {
    return notes.filter(n => {
      if (isOwnNote(n, viewer)) return false;
      if (migrateVisibility(n.visibility) !== 'pastor_share') return false;
      if (isSuperAdmin(viewer)) return true;
      return matchesPastorShareToViewer(n, viewer);
    });
  }

  if (tab === 'organization') {
    return notes.filter(n => {
      if (isOwnNote(n, viewer)) return false;
      if (migrateVisibility(n.visibility) !== 'organization_share') return false;
      return getGraceNoteViewInfo(n, viewer) !== null;
    });
  }

  if (tab === 'admin_shared') {
    // 레거시 → shared 와 동일 (관리자)
    return getGraceNotesForCollectTab(notes, viewer, 'shared');
  }

  if (tab === 'admin_audit') {
    // 관리 조회 확장용 — UI에서는 비노출, private 제외
    return notes.filter(n => migrateVisibility(n.visibility) !== 'private');
  }

  return [];
}

/** 작성자 소속 조직 ID (pastor_share 세부 필터용) */
export function getAuthorOrganizationIds(note: {
  userId?: string;
  authorName?: string;
  authorDistrictId?: string;
  authorZoneId?: string;
  authorDepartmentIds?: string[];
}): string[] {
  const m = resolveMembershipForAuthor(note);
  if (!m) return [];
  const ids: string[] = [];
  if (m.districtId) ids.push(m.districtId);
  if (m.zoneId) ids.push(m.zoneId);
  for (const id of m.departmentIds) ids.push(id);
  return uniqueIds(ids);
}

/** 작성자 소속 조직 OR 필터 ([] = 전체) */
export function matchesAuthorOrganizationFilter(
  note: {
    userId?: string;
    authorName?: string;
    authorDistrictId?: string;
    authorZoneId?: string;
    authorDepartmentIds?: string[];
  },
  selectedOrganizationIds: string[] | undefined | null,
): boolean {
  const selected = selectedOrganizationIds ?? [];
  if (selected.length === 0) return true;
  const authorOrgs = getAuthorOrganizationIds(note);
  if (authorOrgs.length === 0) return false;
  return authorOrgs.some(id => selected.includes(id));
}

/** @deprecated alias */
export function getVisibleGraceNotesForMember<T extends GraceNoteVisibilityInput & { id?: string; createdAt: string }>(
  notes: T[],
  viewer: AppUser | null,
): T[] {
  return getVisibleGraceNotesForUser(notes, viewer);
}

const VIEW_KIND_PRIORITY: Record<GraceNoteViewKind, number> = {
  own: 0,
  pastor_share: 1,
  group_upper: 2,
  group_lower: 2,
  group_department: 2,
  public: 3,
};

export type GraceNoteListSort =
  | 'newest'
  | 'oldest'
  | 'favorites'
  | 'own_first'
  | 'received_first';

export function sortGraceNotesForMemberView<T extends GraceNoteVisibilityInput & { createdAt: string }>(
  notes: T[],
  viewer: AppUser | null,
  sortOrder: GraceNoteListSort = 'newest',
): T[] {
  return [...notes].sort((a, b) => {
    if (sortOrder === 'favorites') {
      const fa = a.isFavorite ? 0 : 1;
      const fb = b.isFavorite ? 0 : 1;
      if (fa !== fb) return fa - fb;
    }
    if (sortOrder === 'own_first' || sortOrder === 'received_first') {
      const ia = getGraceNoteViewInfo(a, viewer);
      const ib = getGraceNoteViewInfo(b, viewer);
      const aOwn = ia?.kind === 'own' ? 0 : 1;
      const bOwn = ib?.kind === 'own' ? 0 : 1;
      if (sortOrder === 'own_first' && aOwn !== bOwn) return aOwn - bOwn;
      if (sortOrder === 'received_first' && aOwn !== bOwn) return bOwn - aOwn;
      // 보조: 조회 근거 우선순위
      const pa = ia ? VIEW_KIND_PRIORITY[ia.kind] : 99;
      const pb = ib ? VIEW_KIND_PRIORITY[ib.kind] : 99;
      if (pa !== pb) return pa - pb;
    }
    const byDate = b.createdAt.localeCompare(a.createdAt);
    return sortOrder === 'oldest' ? -byDate : byDate;
  });
}

/** 목회자 「담당 성도 은혜기록」 — 담당 범위 + 공유/공개만 (남의 private 제외) */
export function canPastorViewSharedGraceNote(
  note: GraceNoteVisibilityInput,
  viewer: AppUser | null,
): boolean {
  if (!viewer || viewer.role === 'member') return false;
  if (isOwnNote(note, viewer)) return false; // 담당 성도 함은 타 성도용
  const visibility = migrateVisibility(note.visibility);
  if (visibility === 'private') return false;

  const authorMembership = resolveMembershipForAuthor(note);
  const clergyId = getViewerClergyId(viewer);

  // 최고관리자도 담당/소속 범위만 (전체 private 열람 금지)
  if (viewer.role === 'super_admin') {
    const scope = getViewerOrganizationScope(viewer);
    if (visibility === 'pastor_share') {
      return matchesPastorShareToViewer(note, viewer);
    }
    if (visibility === 'organization_share') {
      // 전체 공개(sharedGroupAll/레거시 public 포함)는 matchGroupShare 내부에서 허용
      return matchGroupShare(note, scope) !== null;
    }
    return false;
  }

  if (!clergyId) return false;
  if (!pastorShepherdsMembership(clergyId, authorMembership)) return false;

  if (visibility === 'pastor_share') {
    return matchesPastorShareToViewer(note, viewer);
  }

  if (visibility === 'organization_share') {
    const scope = getViewerOrganizationScope(viewer);
    return matchGroupShare(note, scope) !== null;
  }

  return false;
}

