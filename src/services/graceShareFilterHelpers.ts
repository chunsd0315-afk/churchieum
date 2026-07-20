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
  getClergyById,
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
import { uniqueIds, migrateVisibility } from '../types/sharedContent';
import type { SharedContentLike } from './sharedContentAccess';
import { resolveSharedOrganizationIds } from './sharedContentAccess';
import type { GraceNote, SharedPastorSnapshot } from '../data/graceNotes';

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

export type PastorFilterGroup = 'current' | 'historical';

export type AvailablePastorForFilter = AvailablePastor & {
  group: PastorFilterGroup;
  /** 과거 교역자 필터 — "이전 담당 · 퇴사" 등 */
  statusLabel?: string;
  /** 공유 당시 조직 (스냅샷) */
  shareOrganizationName?: string;
};

export type PastorFilterGroups = {
  current: AvailablePastorForFilter[];
  historical: AvailablePastorForFilter[];
};

export type SharedPastorDetailEntry = {
  pastorId: string;
  displayName: string;
  shareOrganizationName?: string;
  currentOrganizationLabel?: string;
  statusBadge?: string;
};

function getCurrentOrgLabelsForClergy(clergyId: string): string[] {
  const labels = new Set<string>();
  for (const a of getAllActiveAssignments()) {
    if (!a.isActive || a.pastorId !== clergyId) continue;
    const label = a.districtName || a.zoneName || a.departmentName;
    if (label) labels.add(label);
  }
  for (const a of getAllAssignees()) {
    if (!a.isActive || a.assigneeType !== 'pastor' || a.userId !== clergyId) continue;
    labels.add(orgDisplayName(a.organizationId));
  }
  return [...labels];
}

function resolveSnapshotFromNotes(
  pastorId: string,
  notes: GraceNote[],
): SharedPastorSnapshot | undefined {
  for (const note of notes) {
    const snap = note.sharedPastorSnapshots?.find(s => s.pastorId === pastorId);
    if (snap) return snap;
  }
  return undefined;
}

function resolveHistoricalStatusLabel(clergy: ClergyMember | null | undefined): string {
  if (!clergy) return '이전 공유 대상';
  if (clergy.status === 'resigned' || clergy.status !== 'active') return '이전 담당 · 퇴사';
  return '이전 담당 · 소속 변경';
}

function buildHistoricalPastorFilterEntry(
  pastorId: string,
  notes: GraceNote[],
): AvailablePastorForFilter {
  const snapshot = resolveSnapshotFromNotes(pastorId, notes);
  const clergy = getClergyById(pastorId);
  const name = snapshot?.name ?? clergy?.name ?? '알 수 없는 교역자';
  const position = snapshot?.position ?? (clergy ? positionLabel(clergy) : undefined);
  const shareOrganizationName = snapshot?.organizationName;
  const currentOrgNames =
    clergy?.status === 'active' ? getCurrentOrgLabelsForClergy(pastorId) : [];

  return {
    id: pastorId,
    name,
    position,
    organizationIds: [],
    organizationNames: currentOrgNames,
    shareOrganizationName,
    group: 'historical',
    statusLabel: resolveHistoricalStatusLabel(clergy),
  };
}

/**
 * 내 기록 · 담당 교역자 공유 필터 — 활성 교역자 + 과거 공유 대상
 */
export function getPastorFilterGroupsForMine(
  user: AppUser | null,
  userPastorShareNotes: GraceNote[],
): PastorFilterGroups {
  const currentBase = getAvailablePastorsForUser(user);
  const currentIds = new Set(currentBase.map(p => p.id));

  const current: AvailablePastorForFilter[] = currentBase.map(p => ({
    ...p,
    group: 'current',
  }));

  const historicalIds = new Set<string>();
  for (const note of userPastorShareNotes) {
    if (migrateVisibility(note.visibility) !== 'pastor_share') continue;
    for (const id of uniqueIds(note.sharedPastorIds)) {
      if (!currentIds.has(id)) historicalIds.add(id);
    }
  }

  const historical = [...historicalIds]
    .map(id => buildHistoricalPastorFilterEntry(id, userPastorShareNotes))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return { current, historical };
}

/** 저장 시 선택 교역자 스냅샷 생성 (기존 스냅샷 유지) */
export function buildSharedPastorSnapshots(
  pastorIds: string[],
  eligiblePastors: EligiblePastor[],
  existingSnapshots: SharedPastorSnapshot[] = [],
): SharedPastorSnapshot[] {
  const ids = uniqueIds(pastorIds);
  const eligibleMap = new Map(eligiblePastors.map(p => [p.id, p]));
  const existingMap = new Map(existingSnapshots.map(s => [s.pastorId, s]));

  return ids.map(id => {
    const prev = existingMap.get(id);
    if (prev) return prev;

    const eligible = eligibleMap.get(id);
    if (eligible) {
      return {
        pastorId: id,
        name: eligible.name,
        position: eligible.position,
        organizationName: eligible.orgLabels?.length
          ? eligible.orgLabels.join(' · ')
          : undefined,
      };
    }

    const clergy = getClergyById(id);
    if (clergy) {
      const orgLabels = getCurrentOrgLabelsForClergy(id);
      return {
        pastorId: id,
        name: clergy.name,
        position: positionLabel(clergy),
        organizationName: orgLabels.length ? orgLabels.join(' · ') : undefined,
      };
    }

    return { pastorId: id, name: '알 수 없는 교역자' };
  });
}

/** 상세 화면 — 공유 교역자별 당시/현재 조직 표시 */
export function getSharedPastorDetailEntries(note: GraceNote): SharedPastorDetailEntry[] {
  if (migrateVisibility(note.visibility) !== 'pastor_share' || note.sharedPastorAll) return [];

  const ids = uniqueIds(note.sharedPastorIds);
  return ids.map(pastorId => {
    const snapshot = note.sharedPastorSnapshots?.find(s => s.pastorId === pastorId);
    const clergy = getClergyById(pastorId);
    const name = snapshot?.name ?? clergy?.name ?? '알 수 없는 교역자';
    const position = snapshot?.position ?? (clergy ? positionLabel(clergy) : '');
    const displayName = `${name}${position ? ` ${position}` : ''}`.trim();
    const shareOrganizationName = snapshot?.organizationName;
    const currentLabels = clergy?.status === 'active' ? getCurrentOrgLabelsForClergy(pastorId) : [];
    const currentOrganizationLabel =
      currentLabels.length > 0 ? currentLabels.join(' · ') : undefined;

    let statusBadge: string | undefined;
    if (!clergy) {
      statusBadge = '이전 공유 대상';
    } else if (clergy.status === 'resigned' || clergy.status !== 'active') {
      statusBadge = '퇴사';
    } else if (
      shareOrganizationName &&
      currentOrganizationLabel &&
      !currentLabels.some(l => shareOrganizationName.includes(l))
    ) {
      statusBadge = '이전 담당';
    }

    return {
      pastorId,
      displayName,
      shareOrganizationName,
      currentOrganizationLabel,
      statusBadge,
    };
  });
}

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
