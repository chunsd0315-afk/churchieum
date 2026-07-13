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
};

export type GraceShareFields = {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
};

export type GraceShareValidationResult =
  | { ok: true; sanitized: GraceShareFields }
  | { ok: false; error: string };

/** ID 배열 중복 제거 */
export function uniqueIds(ids: string[] | undefined | null): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.filter(Boolean))];
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

  if (membership.districtId) {
    const d = getDistricts().find(x => x.id === membership.districtId);
    if (d) districts.push({ id: d.id, name: d.name, kind: 'district' });
  }
  if (membership.zoneId) {
    const z = getAllZones().find(x => x.id === membership.zoneId && x.is_active);
    if (z) zones.push({ id: z.id, name: z.name, kind: 'zone' });
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

  const visibility = state.visibility ?? 'private';

  if (visibility === 'private' || visibility === 'public') {
    return {
      ok: true,
      sanitized: {
        visibility,
        sharedPastorAll: false,
        sharedPastorIds: [],
        sharedGroupAll: false,
        sharedGroupIds: [],
      },
    };
  }

  const eligiblePastors = getEligiblePastorsForUser(user);
  const eligiblePastorIds = new Set(eligiblePastors.map(p => p.id));
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
        visibility: 'pastor',
        sharedPastorAll,
        sharedPastorIds,
        sharedGroupAll: false,
        sharedGroupIds: [],
      },
    };
  }

  if (visibility === 'group') {
    if (eligibleGroupIds.size === 0) {
      return { ok: false, error: '현재 소속된 교구 또는 부서가 없습니다.' };
    }

    const sharedGroupAll = !!state.sharedGroupAll;
    let sharedGroupIds = uniqueIds(state.sharedGroupIds);

    if (sharedGroupAll) {
      sharedGroupIds = [];
    } else {
      const invalid = sharedGroupIds.filter(id => !eligibleGroupIds.has(id));
      if (invalid.length > 0) {
        return { ok: false, error: '선택할 수 없는 조직 또는 부서가 포함되어 있습니다.' };
      }
      if (sharedGroupIds.length === 0) {
        return { ok: false, error: '공유할 교구 또는 부서를 선택해주세요.' };
      }
    }

    return {
      ok: true,
      sanitized: {
        visibility: 'group',
        sharedPastorAll: false,
        sharedPastorIds: [],
        sharedGroupAll,
        sharedGroupIds,
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
    visibility: note.visibility ?? 'private',
    sharedPastorAll: false,
    sharedPastorIds: [],
    sharedGroupAll: false,
    sharedGroupIds: [],
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
  const eligibleGroupIds = getAllEligibleGroupIds(user);

  if (state.visibility === 'pastor') {
    if (eligiblePastorIds.size === 0) {
      return { visibility: 'private', sharedPastorAll: false, sharedPastorIds: [], sharedGroupAll: false, sharedGroupIds: [] };
    }
    if (state.sharedPastorAll) {
      return { ...state, sharedPastorIds: [], sharedGroupAll: false, sharedGroupIds: [] };
    }
    return {
      ...state,
      sharedPastorIds: uniqueIds(state.sharedPastorIds).filter(id => eligiblePastorIds.has(id)),
      sharedGroupAll: false,
      sharedGroupIds: [],
    };
  }

  if (state.visibility === 'group') {
    if (eligibleGroupIds.size === 0) {
      return { visibility: 'private', sharedPastorAll: false, sharedPastorIds: [], sharedGroupAll: false, sharedGroupIds: [] };
    }
    if (state.sharedGroupAll) {
      return { ...state, sharedPastorIds: [], sharedGroupAll: true, sharedGroupIds: [] };
    }
    return {
      ...state,
      sharedPastorIds: [],
      sharedGroupIds: uniqueIds(state.sharedGroupIds).filter(id => eligibleGroupIds.has(id)),
    };
  }

  return sanitizeShareOnRead(state, user);
}

function resolveMembershipForAuthor(note: {
  userId?: string;
  authorName?: string;
}): UserOrgMembership | null {
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

/** 목회자가 공유받은 은혜기록인지 (나만 보기 제외) */
export function canPastorViewSharedGraceNote(
  note: {
    visibility?: string;
    sharedPastorAll?: boolean;
    sharedPastorIds?: string[];
    sharedGroupAll?: boolean;
    sharedGroupIds?: string[];
    userId?: string;
    authorName?: string;
  },
  viewer: AppUser | null,
): boolean {
  if (!viewer || viewer.role === 'member') return false;
  if (note.visibility === 'private' || !note.visibility) return false;
  if (note.visibility === 'public') return true;
  if (viewer.role === 'super_admin') return true;

  const clergy = viewer.email ? getClergyByEmail(viewer.email) : null;
  const pastorId = clergy?.id;
  if (!pastorId) return false;

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

  if (note.visibility === 'pastor') {
    if (note.sharedPastorIds?.includes(pastorId)) return true;
    if (note.sharedPastorAll && authorAsUser) {
      return getEligiblePastorsForUser(authorAsUser).some(p => p.id === pastorId);
    }
    return false;
  }

  if (note.visibility === 'group' && authorAsUser) {
    const authorGroupIds = getAllEligibleGroupIds(authorAsUser);
    const sharedIds = note.sharedGroupAll
      ? [...authorGroupIds]
      : uniqueIds(note.sharedGroupIds).filter(id => authorGroupIds.has(id));
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
