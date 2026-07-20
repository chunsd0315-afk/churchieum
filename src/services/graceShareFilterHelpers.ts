/**
 * 은혜기록 모아보기 — 교역자/조직 공유 필터 헬퍼
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import type { EligiblePastor } from './graceNoteShareScope';
import {
  getAllActiveAssignments,
  getAllClergy,
  getClergyByEmail,
  positionLabel,
  type ClergyMember,
} from './clergyData';
import { getAllAssignees } from './orgAssigneeStorage';
import {
  getDepartmentNameById,
  getDistrictNameById,
  getZoneNameById,
} from './orgData';
import { getOrganizationById } from './organizationStorage';
import {
  getUserVisibleOrganizationIds,
  resolveOrgTreeMode,
} from './userOrganizationTree';
import { uniqueIds } from '../types/sharedContent';
import type { SharedContentLike } from './sharedContentAccess';
import { resolveSharedOrganizationIds } from './sharedContentAccess';

const PASTORAL_POSITIONS = new Set([
  '담임목사', '부목사', '목사', '전도사', '교육전도사', '선교사', '간사',
]);

function isPastoralClergy(c: ClergyMember): boolean {
  return c.status === 'active' && PASTORAL_POSITIONS.has(c.position);
}

function orgDisplayName(orgId: string): string {
  const node = getOrganizationById(orgId);
  if (node?.name) return node.name;
  const d = getDistrictNameById(orgId);
  if (d && d !== '-') return d;
  const z = getZoneNameById(orgId);
  if (z && z !== '-') return z;
  const dep = getDepartmentNameById(orgId);
  if (dep && dep !== '-') return dep;
  return orgId;
}

function mergePastor(
  map: Map<string, EligiblePastor>,
  clergy: ClergyMember,
  orgLabel?: string,
) {
  if (!isPastoralClergy(clergy)) return;
  const prev = map.get(clergy.id);
  const labels = new Set(prev?.orgLabels ?? []);
  if (orgLabel && orgLabel !== '-') labels.add(orgLabel);
  map.set(clergy.id, {
    id: clergy.id,
    name: clergy.name,
    position: positionLabel(clergy),
    orgLabels: [...labels],
  });
}

/** 조직 ID들에 담당/배정된 교역자 (중복 제거) */
export function getPastorsByOrganizationIds(organizationIds: string[]): EligiblePastor[] {
  const orgSet = new Set(organizationIds.filter(Boolean));
  if (orgSet.size === 0) return [];

  const clergyMap = new Map(getAllClergy().filter(isPastoralClergy).map(c => [c.id, c]));
  const byId = new Map<string, EligiblePastor>();

  for (const a of getAllActiveAssignments()) {
    if (!a.isActive) continue;
    const hit =
      (a.districtId && orgSet.has(a.districtId)) ||
      (a.zoneId && orgSet.has(a.zoneId)) ||
      (a.departmentId && orgSet.has(a.departmentId));
    if (!hit) continue;
    const clergy = clergyMap.get(a.pastorId);
    if (!clergy) continue;
    const label =
      (a.districtId && orgSet.has(a.districtId) && a.districtName) ||
      (a.zoneId && orgSet.has(a.zoneId) && a.zoneName) ||
      (a.departmentId && orgSet.has(a.departmentId) && a.departmentName) ||
      orgDisplayName(a.districtId || a.zoneId || a.departmentId || '');
    mergePastor(byId, clergy, label || undefined);
  }

  for (const a of getAllAssignees()) {
    if (!a.isActive || a.assigneeType !== 'pastor' || !orgSet.has(a.organizationId)) continue;
    const clergy =
      clergyMap.get(a.userId) ??
      getAllClergy().find(c => c.id === a.userId || c.email === a.userId);
    if (!clergy) continue;
    mergePastor(byId, clergy, orgDisplayName(a.organizationId));
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export type PastorOrgGroup = {
  organizationId: string;
  organizationName: string;
  pastors: EligiblePastor[];
};

/**
 * 조직별 교역자 그룹.
 * 동일 교역자는 첫 번째 조직에만 표시 (중복 방지).
 */
export function getPastorsGroupedByOrganizationIds(
  organizationIds: string[],
): PastorOrgGroup[] {
  const ordered = uniqueIds(organizationIds);
  const seenPastor = new Set<string>();
  const groups: PastorOrgGroup[] = [];

  for (const orgId of ordered) {
    const pastors = getPastorsByOrganizationIds([orgId]).filter(p => {
      if (seenPastor.has(p.id)) return false;
      seenPastor.add(p.id);
      return true;
    });
    if (pastors.length === 0) continue;
    groups.push({
      organizationId: orgId,
      organizationName: orgDisplayName(orgId),
      pastors,
    });
  }

  return groups;
}

export type AvailablePastor = {
  id: string;
  name: string;
  position?: string;
  organizationIds: string[];
  organizationNames: string[];
};

/** 내 기록 · 담당 교역자 공유 필터 — 사용자 소속 조직 기준 교역자 (조직 UI 없음) */
export function getAvailablePastorsForUser(user: AppUser | null): AvailablePastor[] {
  if (!user) return [];

  if (isSuperAdmin(user)) {
    return getAllClergy()
      .filter(isPastoralClergy)
      .map(c => ({
        id: c.id,
        name: c.name,
        position: positionLabel(c),
        organizationIds: [],
        organizationNames: [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  const orgIds = getUserVisibleOrganizationIds(user, 'mine');
  return getPastorsByOrganizationIds(orgIds).map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    organizationIds: [],
    organizationNames: p.orgLabels ?? [],
  }));
}

/** 필터용 — 사용자 조회 가능 조직 기준으로 교역자 목록 */
export function getFilterPastorsForUser(
  user: AppUser | null,
  selectedOrganizationIds: string[] = [],
): { flat: EligiblePastor[]; groups: PastorOrgGroup[] } {
  if (!user) return { flat: [], groups: [] };

  const scope =
    selectedOrganizationIds.length > 0
      ? selectedOrganizationIds
      : getUserVisibleOrganizationIds(
          user,
          isSuperAdmin(user) ? 'all' : 'mine',
        );

  const groups = getPastorsGroupedByOrganizationIds(scope);
  const flatMap = new Map<string, EligiblePastor>();
  for (const g of groups) {
    for (const p of g.pastors) flatMap.set(p.id, p);
  }

  // 최고관리자 + 조직 미선택: 전체 교역자 (조직 그룹 없을 때 대비)
  if (isSuperAdmin(user) && selectedOrganizationIds.length === 0 && flatMap.size === 0) {
    const all = getAllClergy()
      .filter(isPastoralClergy)
      .map(c => ({
        id: c.id,
        name: c.name,
        position: positionLabel(c),
        orgLabels: [] as string[],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return {
      flat: all,
      groups: all.length
        ? [{ organizationId: '_all', organizationName: '전체 교역자', pastors: all }]
        : [],
    };
  }

  return {
    flat: [...flatMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    groups,
  };
}

/**
 * sharedPastorIds OR 필터 ([] = 전체)
 * sharedPastorAll 인 기록은 선택 교역자가 있을 때도 포함 (전체 담당 공유)
 */
export function matchesSharedPastorFilter(
  record: SharedContentLike & { sharedPastorAll?: boolean },
  selectedPastorIds: string[] | undefined | null,
): boolean {
  const selected = selectedPastorIds ?? [];
  if (selected.length === 0) return true;
  if (record.sharedPastorAll) return true;
  const ids = uniqueIds(record.sharedPastorIds);
  return ids.some(id => selected.includes(id));
}

export function matchesSharedOrganizationFilter(
  record: SharedContentLike,
  selectedOrganizationIds: string[] | undefined | null,
): boolean {
  const selected = selectedOrganizationIds ?? [];
  if (selected.length === 0) return true;
  return resolveSharedOrganizationIds(record).some(id => selected.includes(id));
}

export function pastorLabel(p: EligiblePastor): string {
  return `${p.name} ${p.position}`.trim();
}

export function resolveViewerClergyId(user: AppUser | null): string | undefined {
  if (!user) return undefined;
  return getClergyByEmail(user.email)?.id;
}

export { resolveOrgTreeMode };
