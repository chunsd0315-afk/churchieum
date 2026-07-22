/**
 * 댓글·작성자 메타용 — 사용자 대표 조직 경로 / 부서 라벨
 */

import type { Organization } from '../types/organization';
import { getPrimaryDemoAccountById } from '../config/demoAccounts';
import {
  getAllOrganizations,
  getAncestorIds,
  getMembershipsForMember,
  getOrganizationById,
} from './organizationStorage';
import { getAllActiveAssignments, getClergyById } from './clergyData';
import { getDemoData } from './demoData';

const HIDDEN_ROOT_IDS = new Set(['org-church-root']);

function uniqueIds(ids: Iterable<string>): string[] {
  return [...new Set([...ids].filter(Boolean))];
}

function isDepartmentOrg(org: Organization | undefined): boolean {
  if (!org) return false;
  if (org.legacyKind === 'department') return true;
  return /부서|성가|찬양|기관|사역|위원회|TF|소모임|셀/.test(org.type);
}

/** 조직 ID → 상위→하위 이름 배열 (최상위 교회 루트 제외) */
export function getOrganizationPathNames(
  orgId: string,
  organizations?: Organization[],
): string[] {
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

  return names;
}

type OrgBuckets = {
  belonging: string[];
  assigned: string[];
  all: string[];
};

function resolveOrgBucketsForUserId(userId: string): OrgBuckets {
  const allOrgs = new Set(getAllOrganizations().map(o => o.id));
  const belonging = new Set<string>();
  const assigned = new Set<string>();

  const addBelonging = (id?: string) => {
    if (id && allOrgs.has(id) && !HIDDEN_ROOT_IDS.has(id)) belonging.add(id);
  };
  const addAssigned = (id?: string) => {
    if (id && allOrgs.has(id) && !HIDDEN_ROOT_IDS.has(id)) assigned.add(id);
  };

  for (const row of getMembershipsForMember(userId)) {
    addBelonging(row.organizationId);
  }

  const demo = getPrimaryDemoAccountById(userId);
  if (demo) {
    addBelonging(demo.zoneId);
    addBelonging(demo.districtId);
    for (const id of demo.departmentIds ?? []) addBelonging(id);
    for (const id of demo.assignedZoneIds ?? []) addAssigned(id);
    for (const id of demo.assignedDistrictIds ?? []) addAssigned(id);
    for (const id of demo.assignedDepartmentIds ?? []) addAssigned(id);
  }

  try {
    const members = getDemoData().members ?? [];
    const member = members.find(
      m =>
        m.id === userId
        || (userId === 'demo-member60'
          && (m.id === 'member-60' || m.email?.toLowerCase() === 'member60@demo.com')),
    );
    if (member) {
      addBelonging(member.zoneId);
      addBelonging(member.districtId);
      for (const id of member.departmentIds ?? []) addBelonging(id);
      for (const row of getMembershipsForMember(member.id)) {
        addBelonging(row.organizationId);
      }
    }
  } catch {
    /* ignore */
  }

  const clergy = getClergyById(userId);
  if (clergy) {
    for (const a of getAllActiveAssignments()) {
      if (a.pastorId !== clergy.id || !a.isActive) continue;
      addAssigned(a.zoneId);
      addAssigned(a.districtId);
      addAssigned(a.departmentId);
    }
  }

  const belongingList = uniqueIds(belonging);
  const assignedList = uniqueIds([...assigned].filter(id => !belonging.has(id)));
  return {
    belonging: belongingList,
    assigned: assignedList,
    all: uniqueIds([...belongingList, ...assignedList]),
  };
}

function orgMatchesRelated(
  orgId: string,
  related: Set<string>,
): boolean {
  if (related.size === 0) return false;
  if (related.has(orgId)) return true;
  const ancestors = getAncestorIds(orgId);
  if (ancestors.some(a => related.has(a))) return true;
  for (const rid of related) {
    if (getAncestorIds(rid).includes(orgId)) return true;
  }
  return false;
}

function preferDeepestOrg(
  candidates: string[],
  organizations: Organization[],
): string | null {
  if (candidates.length === 0) return null;
  const byId = new Map(organizations.map(o => [o.id, o]));

  const scored = candidates.map(id => {
    const depth = getOrganizationPathNames(id, organizations).length;
    const kind = byId.get(id)?.legacyKind;
    const kindScore = kind === 'zone' ? 3 : kind === 'district' ? 2 : isDepartmentOrg(byId.get(id)) ? 0 : 1;
    return { id, score: depth * 10 + kindScore };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

/**
 * 대표 조직 경로 (상위 → 하위).
 * relatedOrganizationIds 가 있으면 기록 공유 조직과 맞는 소속을 우선한다.
 */
export function getUserPrimaryOrganizationPath(
  userId: string,
  organizations: Organization[] = getAllOrganizations(),
  _memberships?: unknown,
  relatedOrganizationIds?: string[],
): string[] {
  void _memberships;
  if (!userId.trim()) return [];

  const orgs = organizations.length > 0 ? organizations : getAllOrganizations();
  const buckets = resolveOrgBucketsForUserId(userId);
  if (buckets.all.length === 0) return [];

  const related = new Set((relatedOrganizationIds ?? []).filter(Boolean));
  const byId = new Map(orgs.map(o => [o.id, o]));

  const pickFrom = (ids: string[]): string | null => {
    if (ids.length === 0) return null;
    if (related.size > 0) {
      const matched = ids.filter(id => orgMatchesRelated(id, related));
      if (matched.length > 0) {
        // 부서가 아닌 조직 경로를 우선 (부서는 별도 라벨)
        const nonDept = matched.filter(id => !isDepartmentOrg(byId.get(id)));
        return preferDeepestOrg(nonDept.length > 0 ? nonDept : matched, orgs);
      }
    }
    const nonDept = ids.filter(id => !isDepartmentOrg(byId.get(id)));
    const zone = nonDept.find(id => byId.get(id)?.legacyKind === 'zone');
    if (zone) return zone;
    const district = nonDept.find(id => byId.get(id)?.legacyKind === 'district');
    if (district) return district;
    return preferDeepestOrg(nonDept.length > 0 ? nonDept : ids, orgs);
  };

  const primaryId =
    pickFrom(buckets.belonging)
    ?? pickFrom(buckets.assigned)
    ?? buckets.all[0]
    ?? null;

  if (!primaryId) return [];
  return getOrganizationPathNames(primaryId, orgs);
}

/** 대표 조직 경로에 없는 부서 이름 (중복 시 null) */
export function getUserDepartmentLabelOutsidePath(
  userId: string,
  pathNames: string[],
  relatedOrganizationIds?: string[],
): string | null {
  if (!userId.trim()) return null;

  const orgs = getAllOrganizations();
  const byId = new Map(orgs.map(o => [o.id, o]));
  const buckets = resolveOrgBucketsForUserId(userId);
  const related = new Set((relatedOrganizationIds ?? []).filter(Boolean));

  const deptIds = buckets.all.filter(id => isDepartmentOrg(byId.get(id)));
  if (deptIds.length === 0) return null;

  const matched = deptIds.filter(id => related.has(id));
  const pickId = matched[0] ?? deptIds[0];
  const name = getOrganizationById(pickId)?.name?.trim();
  if (!name) return null;

  const pathJoined = pathNames.join(' > ');
  if (pathNames.includes(name) || pathJoined.includes(name)) return null;
  return name;
}

export function formatOrgMetaSecondaryLine(parts: {
  pathNames: string[];
  departmentLabel: string | null;
  dateLabel: string;
}): string {
  const chunks: string[] = [];
  if (parts.pathNames.length > 0) chunks.push(parts.pathNames.join(' > '));
  if (parts.departmentLabel) chunks.push(parts.departmentLabel);
  if (parts.dateLabel) chunks.push(parts.dateLabel);
  return chunks.join(' · ');
}
