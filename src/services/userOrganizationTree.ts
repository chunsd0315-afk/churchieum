/**
 * 공유 기록 필터용 — 로그인 사용자에게 보이는 조직 트리
 * (전체 교회 트리가 아니라 소속·담당 + 상위 경로만)
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import type { Organization, OrgTreeNode } from '../types/organization';
import {
  getAllOrganizations,
  getAncestorIds,
  getMembershipsForMember,
  getOrganizationById,
} from './organizationStorage';
import { resolveUserOrgMembership } from './graceNoteShareScope';
import { getAssigneesForUser } from './orgAssigneeStorage';
import { resolveAssigneeUserIds } from './orgPermissionHelpers';
import {
  getAllActiveAssignments,
  getClergyByEmail,
} from './clergyData';
import { getDemoData } from './demoData';

/** 표시용 합성 루트 — 필터 트리에서 숨김 */
const HIDDEN_ROOT_IDS = new Set(['org-church-root']);

export type UserOrgTreeScope = 'mine' | 'all';

export type UserOrgTreeMode = 'member' | 'pastor' | 'super_admin';

export type OrgFilterTreeNode = Organization & {
  children: OrgFilterTreeNode[];
  /** 체크 가능 (비활성 경로 노드는 false) */
  selectable: boolean;
  /** 직접 소속/담당 (경로용 상위와 구분) */
  isCore: boolean;
};

function uniqueIds(ids: Iterable<string>): string[] {
  return [...new Set(ids)];
}

function resolveMemberIds(user: AppUser): string[] {
  const ids = new Set<string>([user.id]);
  const demo = getDemoData().members?.find(
    m => m.email?.toLowerCase() === user.email.toLowerCase(),
  );
  if (demo) ids.add(demo.id);
  const clergy = getClergyByEmail(user.email);
  if (clergy) ids.add(clergy.id);
  return [...ids];
}

/**
 * 사용자가 직접 소속·담당하는 조직 ID (형제/타 조직 제외, 상위 경로 미포함)
 */
export function getUserCoreOrganizationIds(user: AppUser | null): string[] {
  if (!user) return [];
  const ids = new Set<string>();

  const membership = resolveUserOrgMembership(user);
  if (membership?.districtId) ids.add(membership.districtId);
  if (membership?.zoneId) ids.add(membership.zoneId);
  for (const id of membership?.departmentIds ?? []) ids.add(id);

  for (const mid of resolveMemberIds(user)) {
    for (const row of getMembershipsForMember(mid)) {
      ids.add(row.organizationId);
    }
  }

  for (const uid of resolveAssigneeUserIds(user)) {
    for (const a of getAssigneesForUser(uid)) {
      if (a.isActive) ids.add(a.organizationId);
    }
  }

  if (user.role === 'pastor' || user.role === 'super_admin') {
    const me = getClergyByEmail(user.email);
    if (me) {
      for (const a of getAllActiveAssignments()) {
        if (a.pastorId !== me.id || !a.isActive) continue;
        if (a.districtId) ids.add(a.districtId);
        if (a.zoneId) ids.add(a.zoneId);
        if (a.departmentId) ids.add(a.departmentId);
      }
    }
    for (const id of user.assignedDistrictIds ?? []) ids.add(id);
    for (const id of user.assignedZoneIds ?? []) ids.add(id);
    for (const id of user.assignedDepartmentIds ?? []) ids.add(id);
  }

  // 존재하지 않는 ID 제외
  const all = new Set(getAllOrganizations().map(o => o.id));
  return uniqueIds([...ids].filter(id => all.has(id) && !HIDDEN_ROOT_IDS.has(id)));
}

/**
 * 트리에 표시할 조직 ID = 코어 + 상위 경로 (형제 조직 미포함)
 */
export function getUserVisibleOrganizationIds(
  user: AppUser | null,
  scope: UserOrgTreeScope = 'mine',
): string[] {
  if (!user) return [];

  if (scope === 'all') {
    return getAllOrganizations()
      .filter(o => o.isActive && !HIDDEN_ROOT_IDS.has(o.id))
      .map(o => o.id);
  }

  const core = getUserCoreOrganizationIds(user);
  const visible = new Set<string>(core);

  for (const id of core) {
    for (const anc of getAncestorIds(id)) {
      if (HIDDEN_ROOT_IDS.has(anc)) continue;
      visible.add(anc);
    }
  }

  return uniqueIds([...visible]);
}

export function getUserVisibleOrganizationIdsForMode(
  user: AppUser | null,
  mode: UserOrgTreeMode,
  scope: UserOrgTreeScope = 'mine',
): string[] {
  if (!user) return [];
  if (mode === 'super_admin' && scope === 'all') {
    return getUserVisibleOrganizationIds(user, 'all');
  }
  // 성도·교역자·관리자(내 조직) — 전체 교회 트리 미노출
  return getUserVisibleOrganizationIds(user, 'mine');
}

/**
 * visibleOrganizationIds만으로 트리 구성 (형제 노드 제외)
 */
export function buildOrganizationTree(params: {
  organizations?: Organization[];
  visibleOrganizationIds: Iterable<string>;
  coreOrganizationIds?: Iterable<string>;
}): OrgFilterTreeNode[] {
  const all = params.organizations ?? getAllOrganizations();
  const visible = new Set(
    [...params.visibleOrganizationIds].filter(id => !HIDDEN_ROOT_IDS.has(id)),
  );
  const core = new Set(params.coreOrganizationIds ?? []);

  const nodes = all.filter(o => visible.has(o.id));
  const map = new Map<string, OrgFilterTreeNode>();

  for (const o of nodes) {
    map.set(o.id, {
      ...o,
      children: [],
      selectable: o.isActive,
      isCore: core.has(o.id),
    });
  }

  const roots: OrgFilterTreeNode[] = [];
  map.forEach(node => {
    const parentId = node.parentId && !HIDDEN_ROOT_IDS.has(node.parentId) ? node.parentId : null;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (list: OrgFilterTreeNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ko'));
    list.forEach(n => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function getUserOrganizationTree(params: {
  user: AppUser | null;
  mode?: UserOrgTreeMode;
  scope?: UserOrgTreeScope;
  /** 교역자 전체 조직 조회 권한(확장용) — true면 scope=all 허용 */
  allowFullOrgTree?: boolean;
}): OrgFilterTreeNode[] {
  const { user, mode, scope = 'mine', allowFullOrgTree = false } = params;
  if (!user) return [];

  const resolvedMode: UserOrgTreeMode =
    mode ??
    (isSuperAdmin(user) ? 'super_admin' : user.role === 'pastor' ? 'pastor' : 'member');

  let effectiveScope: UserOrgTreeScope = 'mine';
  if (resolvedMode === 'super_admin' && scope === 'all') {
    effectiveScope = 'all';
  } else if (resolvedMode === 'pastor' && allowFullOrgTree && scope === 'all') {
    effectiveScope = 'all';
  }

  const visibleIds = getUserVisibleOrganizationIdsForMode(user, resolvedMode, effectiveScope);
  const coreIds =
    effectiveScope === 'all' ? visibleIds : getUserCoreOrganizationIds(user);

  return buildOrganizationTree({
    visibleOrganizationIds: visibleIds,
    coreOrganizationIds: coreIds,
  });
}

/** 트리 내 노드 + 하위 selectable id */
export function collectTreeNodeIds(node: OrgFilterTreeNode, onlySelectable = true): string[] {
  const ids: string[] = [];
  const walk = (n: OrgFilterTreeNode) => {
    if (!onlySelectable || n.selectable) ids.push(n.id);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
}

export function flattenOrgFilterTree(nodes: OrgFilterTreeNode[]): OrgFilterTreeNode[] {
  const out: OrgFilterTreeNode[] = [];
  const walk = (list: OrgFilterTreeNode[]) => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** 칩·검색용 경로 라벨 (예: 1교구 > 1구역) */
export function getOrganizationPathLabel(
  orgId: string,
  organizations?: Organization[],
): string {
  const all = organizations ?? getAllOrganizations();
  const byId = new Map(all.map(o => [o.id, o]));
  const names: string[] = [];
  let cur = byId.get(orgId);
  const guard = new Set<string>();

  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    if (!HIDDEN_ROOT_IDS.has(cur.id)) names.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }

  return names.join(' > ') || orgId;
}

export function findOrgFilterNode(
  tree: OrgFilterTreeNode[],
  id: string,
): OrgFilterTreeNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    const found = findOrgFilterNode(n.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * 상위 체크/해제 시 트리에 표시된 하위까지 함께 반영
 */
export function toggleOrganizationTreeSelection(
  tree: OrgFilterTreeNode[],
  nodeId: string,
  selectedIds: string[],
): string[] {
  const node = findOrgFilterNode(tree, nodeId);
  if (!node) return selectedIds;

  const related = collectTreeNodeIds(node, true);
  const selected = new Set(selectedIds);
  const allSelected = related.every(id => selected.has(id));

  if (allSelected) {
    related.forEach(id => selected.delete(id));
  } else {
    related.forEach(id => selected.add(id));
  }

  return [...selected];
}

export function getTreeNodeCheckState(
  node: OrgFilterTreeNode,
  selectedIds: string[],
): 'checked' | 'unchecked' | 'indeterminate' {
  const related = collectTreeNodeIds(node, true);
  if (related.length === 0) {
    return selectedIds.includes(node.id) ? 'checked' : 'unchecked';
  }
  const count = related.filter(id => selectedIds.includes(id)).length;
  if (count === 0) return 'unchecked';
  if (count === related.length) return 'checked';
  return 'indeterminate';
}

/** 검색어로 트리 필터 — 매칭 노드 + 조상 유지 */
export function filterOrgTreeByQuery(
  tree: OrgFilterTreeNode[],
  query: string,
): OrgFilterTreeNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tree;

  const matchNode = (n: OrgFilterTreeNode): OrgFilterTreeNode | null => {
    const selfHit =
      n.name.toLowerCase().includes(needle) ||
      n.type.toLowerCase().includes(needle) ||
      getOrganizationPathLabel(n.id).toLowerCase().includes(needle);
    const children = n.children
      .map(matchNode)
      .filter((c): c is OrgFilterTreeNode => c !== null);
    if (selfHit || children.length > 0) {
      return {
        ...n,
        children: children.length > 0 ? children : selfHit ? n.children : [],
      };
    }
    return null;
  };

  return tree.map(matchNode).filter((n): n is OrgFilterTreeNode => n !== null);
}

export function countOrgFilterNodes(tree: OrgFilterTreeNode[]): number {
  return flattenOrgFilterTree(tree).length;
}

export function resolveOrgTreeMode(user: AppUser | null): UserOrgTreeMode {
  if (!user) return 'member';
  if (isSuperAdmin(user)) return 'super_admin';
  if (user.role === 'pastor') return 'pastor';
  return 'member';
}

export function getOrganizationByIdSafe(id: string): Organization | undefined {
  return getOrganizationById(id);
}
