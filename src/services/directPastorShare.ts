/**
 * 은혜와 기도 — 「담당 교역자와 공유」직계 조직 담당 교역자
 * 전체 교회 교역자 목록 대신 소속·담당 조직 + 상위 경로만 사용
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import type { Organization, OrganizationAssignee } from '../types/organization';
import { assigneeRoleLabel } from '../types/organization';
import {
  getAllOrganizations,
  getAncestorIds,
  getOrganizationById,
} from './organizationStorage';
import {
  getUserCoreOrganizationIds,
  buildOrganizationTree,
  type OrgFilterTreeNode,
} from './userOrganizationTree';
import { getAssigneesForOrg } from './orgAssigneeStorage';
import {
  getAllActiveAssignments,
  getAllClergy,
  getClergyByEmail,
  getClergyById,
  positionLabel,
  type ClergyMember,
} from './clergyData';

/** graceNoteShareScope.EligiblePastor 와 동일 형태 (순환 import 방지) */
export type EligiblePastorRef = {
  id: string;
  name: string;
  position: string;
  orgLabels: string[];
};

const HIDDEN_ROOT_IDS = new Set(['org-church-root']);

const PASTORAL_POSITIONS = new Set([
  '담임목사', '부목사', '목사', '전도사', '교육전도사', '선교사', '간사',
]);

export type DirectPastorOption = {
  pastorId: string;
  name: string;
  position: string;
  organizationRole: string;
  organizationId: string;
  organizationName: string;
  organizationPath: string[];
  /** 0 = 직접 소속, 1+ = 상위 단계 */
  distance: number;
};

export type DirectPastorOnOrg = {
  pastorId: string;
  name: string;
  position: string;
  organizationRole: string;
  isPrimary: boolean;
};

export type DirectPastorOrgNode = {
  organizationId: string;
  organizationName: string;
  depth: number;
  distance: number;
  pastors: DirectPastorOnOrg[];
  children: DirectPastorOrgNode[];
};

export type DirectPastorShareModel = {
  /** 선택 가능한 교역자 (본인 제외, 중복 제거) */
  pastors: EligiblePastorRef[];
  /** 조직별 상세 옵션 */
  options: DirectPastorOption[];
  /** UI 트리 */
  tree: DirectPastorOrgNode[];
  /** 허용 pastorId */
  allowedPastorIds: Set<string>;
  /** 가장 가까운 담당 교역자 (참고용, 자동 선택은 하지 않음) */
  nearestPastorId: string | null;
  /** 최고관리자 — flat 전체 목록 UI */
  isAdminFullList: boolean;
};

function uniqueIds(ids: Iterable<string>): string[] {
  return [...new Set([...ids].filter(Boolean))];
}

function isPastoralClergy(c: ClergyMember): boolean {
  return c.status === 'active' && PASTORAL_POSITIONS.has(c.position);
}

function resolveClergy(userId: string): ClergyMember | undefined {
  return (
    getClergyById(userId)
    ?? getAllClergy().find(c => c.id === userId || c.email === userId)
  );
}

function isPastoralAssignee(a: OrganizationAssignee): boolean {
  if (!a.isActive || a.assigneeType !== 'pastor') return false;
  const clergy = resolveClergy(a.userId);
  if (clergy) return isPastoralClergy(clergy);
  // clergy 레코드 없으면 담당자 타입·직분명으로 판별
  const role = `${a.roleLabel || ''} ${a.titleLabel || ''}`;
  if (/장로|권사|집사|성도|교사|리더/.test(role) && !/목사|전도|교역|간사/.test(role)) {
    return false;
  }
  return true;
}

/** 사용자 직접 소속·담당 조직 ID */
export function getUserDirectOrganizationIds(user: AppUser | null): string[] {
  if (!user) return [];
  return getUserCoreOrganizationIds(user).filter(id => {
    const o = getOrganizationById(id);
    return Boolean(o?.isActive) && !HIDDEN_ROOT_IDS.has(id);
  });
}

/** 직접 조직 + 상위(조상) 조직 ID */
export function getDirectLineOrganizationIds(user: AppUser | null): string[] {
  const direct = getUserDirectOrganizationIds(user);
  const all = new Set<string>(direct);
  for (const id of direct) {
    for (const anc of getAncestorIds(id)) {
      if (HIDDEN_ROOT_IDS.has(anc)) continue;
      const o = getOrganizationById(anc);
      if (o?.isActive) all.add(anc);
    }
  }
  return uniqueIds([...all]);
}

function distanceFromDirect(orgId: string, directIds: string[]): number {
  if (directIds.includes(orgId)) return 0;
  let min = Number.POSITIVE_INFINITY;
  for (const d of directIds) {
    const ancs = getAncestorIds(d);
    const idx = ancs.indexOf(orgId);
    if (idx >= 0) min = Math.min(min, idx + 1);
  }
  return Number.isFinite(min) ? min : 99;
}

function pathNamesForOrg(orgId: string, organizations: Organization[]): string[] {
  const byId = new Map(organizations.map(o => [o.id, o]));
  const names: string[] = [];
  let cur = byId.get(orgId);
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    if (!HIDDEN_ROOT_IDS.has(cur.id)) names.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return names;
}

/** 한 조직의 활성 담당 교역자 (org_assignees + staff_assignments) */
export function getPastoralAssigneesForOrganization(orgId: string): DirectPastorOnOrg[] {
  const byId = new Map<string, DirectPastorOnOrg>();

  for (const a of getAssigneesForOrg(orgId)) {
    if (!isPastoralAssignee(a)) continue;
    const clergy = resolveClergy(a.userId);
    const name = clergy?.name || a.userName;
    const position = clergy ? positionLabel(clergy) : (a.titleLabel || a.roleLabel || '교역자');
    const organizationRole =
      a.roleLabel?.trim()
      || assigneeRoleLabel(a.role, a.roleLabel)
      || '담당교역자';
    const prev = byId.get(a.userId);
    if (!prev || a.isPrimary) {
      byId.set(clergy?.id ?? a.userId, {
        pastorId: clergy?.id ?? a.userId,
        name,
        position,
        organizationRole,
        isPrimary: a.isPrimary,
      });
    }
  }

  for (const assignment of getAllActiveAssignments()) {
    if (!assignment.isActive) continue;
    const match =
      assignment.districtId === orgId
      || assignment.zoneId === orgId
      || assignment.departmentId === orgId;
    if (!match) continue;
    const clergy = getClergyById(assignment.pastorId);
    if (!clergy || !isPastoralClergy(clergy)) continue;
    if (byId.has(clergy.id)) continue;
    byId.set(clergy.id, {
      pastorId: clergy.id,
      name: clergy.name,
      position: positionLabel(clergy),
      organizationRole: '담당교역자',
      isPrimary: false,
    });
  }

  return [...byId.values()].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.name.localeCompare(b.name, 'ko');
  });
}

function toEligiblePastor(p: DirectPastorOnOrg, orgName: string): EligiblePastorRef {
  return {
    id: p.pastorId,
    name: p.name,
    position: p.position,
    orgLabels: orgName ? [orgName] : [],
  };
}

function buildTreeNodes(
  nodes: OrgFilterTreeNode[],
  directIds: string[],
  depth: number,
  excludePastorId: string | null,
): DirectPastorOrgNode[] {
  const out: DirectPastorOrgNode[] = [];
  for (const n of nodes) {
    const pastors = getPastoralAssigneesForOrganization(n.id)
      .filter(p => !excludePastorId || p.pastorId !== excludePastorId);
    const children = buildTreeNodes(n.children, directIds, depth + 1, excludePastorId);
    // 담당자도 없고 하위에 표시할 것도 없으면 숨김
    if (pastors.length === 0 && children.length === 0) continue;
    out.push({
      organizationId: n.id,
      organizationName: n.name,
      depth,
      distance: distanceFromDirect(n.id, directIds),
      pastors,
      children,
    });
  }
  return out;
}

/**
 * 직계 조직 담당 교역자 모델
 * - 성도/교역자: 소속·담당 + 상위만
 * - 최고관리자: 전체 활성 교역자 (트리는 빈 배열 — UI에서 flat 사용)
 */
export function buildDirectPastorShareModel(user: AppUser | null): DirectPastorShareModel {
  const empty: DirectPastorShareModel = {
    pastors: [],
    options: [],
    tree: [],
    allowedPastorIds: new Set(),
    nearestPastorId: null,
    isAdminFullList: false,
  };
  if (!user) return empty;

  if (isSuperAdmin(user)) {
    const pastors = getAllClergy()
      .filter(isPastoralClergy)
      .map(c => ({
        id: c.id,
        name: c.name,
        position: positionLabel(c),
        orgLabels: [] as string[],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return {
      pastors,
      options: pastors.map(p => ({
        pastorId: p.id,
        name: p.name,
        position: p.position,
        organizationRole: '',
        organizationId: '',
        organizationName: '',
        organizationPath: [],
        distance: 0,
      })),
      tree: [],
      allowedPastorIds: new Set(pastors.map(p => p.id)),
      nearestPastorId: pastors[0]?.id ?? null,
      isAdminFullList: true,
    };
  }

  const organizations = getAllOrganizations().filter(o => o.isActive);
  const directIds = getUserDirectOrganizationIds(user);
  const lineIds = getDirectLineOrganizationIds(user);
  if (lineIds.length === 0) return empty;

  const meClergyId = getClergyByEmail(user.email)?.id ?? null;
  const excludeSelf = user.role === 'pastor' ? meClergyId : null;

  const visibleTree = buildOrganizationTree({
    organizations,
    visibleOrganizationIds: lineIds,
    coreOrganizationIds: directIds,
  });

  const tree = buildTreeNodes(visibleTree, directIds, 0, excludeSelf);

  const options: DirectPastorOption[] = [];
  const pastorMap = new Map<string, EligiblePastorRef>();

  const walk = (nodes: DirectPastorOrgNode[]) => {
    for (const node of nodes) {
      for (const p of node.pastors) {
        options.push({
          pastorId: p.pastorId,
          name: p.name,
          position: p.position,
          organizationRole: p.organizationRole,
          organizationId: node.organizationId,
          organizationName: node.organizationName,
          organizationPath: pathNamesForOrg(node.organizationId, organizations),
          distance: node.distance,
        });
        const prev = pastorMap.get(p.pastorId);
        if (!prev) {
          pastorMap.set(p.pastorId, toEligiblePastor(p, node.organizationName));
        } else if (node.organizationName && !prev.orgLabels.includes(node.organizationName)) {
          prev.orgLabels = [...prev.orgLabels, node.organizationName];
        }
      }
      walk(node.children);
    }
  };
  walk(tree);

  const pastors = [...pastorMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  // 가장 가까운 조직의 주 담당(또는 첫 담당)
  let nearestPastorId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const opt of options) {
    if (opt.distance < bestDistance) {
      bestDistance = opt.distance;
      nearestPastorId = opt.pastorId;
    }
  }

  return {
    pastors,
    options,
    tree,
    allowedPastorIds: new Set(pastors.map(p => p.id)),
    nearestPastorId,
    isAdminFullList: false,
  };
}

/** 작성·검증용 flat 목록 (관리자 전체 / 그 외 직계) */
export function getDirectShareablePastorsForWriter(user: AppUser | null): EligiblePastorRef[] {
  return buildDirectPastorShareModel(user).pastors;
}

/** 스냅샷·이전 공유 대상 표시용 */
export function resolvePastorDisplay(
  pastorId: string,
  snapshots?: { pastorId: string; name: string; position?: string }[],
): { name: string; position: string; inactive: boolean } {
  const snap = snapshots?.find(s => s.pastorId === pastorId);
  const clergy = getClergyById(pastorId) ?? getAllClergy().find(c => c.id === pastorId);
  if (clergy) {
    return {
      name: clergy.name,
      position: positionLabel(clergy),
      inactive: clergy.status !== 'active',
    };
  }
  if (snap) {
    return {
      name: snap.name,
      position: snap.position || '교역자',
      inactive: true,
    };
  }
  return { name: '알 수 없는 교역자', position: '', inactive: true };
}
