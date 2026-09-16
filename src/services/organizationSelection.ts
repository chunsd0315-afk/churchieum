/**
 * 조직 선택 공통 헬퍼 — 초대관리·등록·공개범위 등에서 재사용
 *
 * 원본은 항상 설정 > 조직관리 조직트리(organizationStorage)이며
 * 저장은 조직명 문자열이 아니라 organizationId 기준으로 한다.
 */

import type { Organization } from '../types/organization';
import {
  getAllOrganizations,
  getAncestorIds,
  getDescendantIds,
} from './organizationStorage';
import {
  getOrganizationIdsForUserId,
  getOrganizationPathNames,
} from './userOrganizationPath';
import { isSuperAdmin, type AppUser } from './permissions';

export const MISSING_ORGANIZATION_LABEL = '현재 사용할 수 없는 조직입니다.';

export type OrganizationChip = {
  organizationId: string;
  /** "대교구 > 1교구 > 1구역" — 조직명 변경 시 자동 최신화 */
  pathLabel: string;
  /** 마지막 조직명 */
  name: string;
  /** 조직관리에서 삭제된 경우 true */
  missing: boolean;
};

export { getOrganizationPathNames };

/** "대교구 > 1교구 > 1구역" — 삭제된 조직이면 안내 문구 */
export function getOrganizationPathLabel(
  organizationId: string,
  organizations: Organization[] = getAllOrganizations(),
): string {
  const names = getOrganizationPathNames(organizationId, organizations);
  return names.length > 0 ? names.join(' > ') : MISSING_ORGANIZATION_LABEL;
}

/** 저장된 organizationIds → 화면 표시용 칩 (삭제 조직도 오류 없이 표시) */
export function resolveOrganizationChips(
  organizationIds: string[] | undefined | null,
  organizations: Organization[] = getAllOrganizations(),
): OrganizationChip[] {
  const ids = (organizationIds ?? []).filter(Boolean);
  if (ids.length === 0) return [];

  const byId = new Map(organizations.map(o => [o.id, o]));
  const seen = new Set<string>();

  return ids.reduce<OrganizationChip[]>((acc, organizationId) => {
    if (seen.has(organizationId)) return acc;
    seen.add(organizationId);

    const org = byId.get(organizationId);
    if (!org) {
      acc.push({
        organizationId,
        pathLabel: MISSING_ORGANIZATION_LABEL,
        name: MISSING_ORGANIZATION_LABEL,
        missing: true,
      });
      return acc;
    }

    const names = getOrganizationPathNames(organizationId, organizations);
    acc.push({
      organizationId,
      pathLabel: names.join(' > ') || org.name,
      name: org.name,
      missing: false,
    });
    return acc;
  }, []);
}

/** 여러 조직을 한 줄로 요약 — 목록/표에서 사용 */
export function formatOrganizationSummary(
  organizationIds: string[] | undefined | null,
  organizations: Organization[] = getAllOrganizations(),
): string {
  const chips = resolveOrganizationChips(organizationIds, organizations);
  if (chips.length === 0) return '';
  return chips.map(c => c.pathLabel).join(', ');
}

/**
 * 선택 가능한 조직 범위
 * - 최고관리자: 전체 조직
 * - 그 외: 담당·소속 조직과 그 하위 조직
 * null 이면 제한 없음(전체)
 */
export function getSelectableOrganizationIds(
  user: AppUser | null | undefined,
): Set<string> | null {
  if (!user) return new Set();
  if (isSuperAdmin(user)) return null;

  const base = getOrganizationIdsForUserId(user.id);
  if (base.length === 0) return new Set();

  const allowed = new Set<string>();
  for (const id of base) {
    allowed.add(id);
    for (const childId of getDescendantIds(id)) allowed.add(childId);
  }
  return allowed;
}

/** 저장 시 권한 재확인 — UI 우회 저장을 막는다 */
export function filterOrganizationIdsByPermission(
  user: AppUser | null | undefined,
  organizationIds: string[],
): string[] {
  const allowed = getSelectableOrganizationIds(user);
  if (allowed === null) return organizationIds;
  return organizationIds.filter(id => allowed.has(id));
}

/** 조직과 그 상위 경로가 선택 범위에 포함되는지 (트리 표시용) */
export function isOrganizationVisibleInScope(
  organizationId: string,
  allowed: Set<string> | null,
): boolean {
  if (allowed === null) return true;
  if (allowed.has(organizationId)) return true;
  // 허용 조직의 상위 경로는 트리 구조 표시를 위해 보이되 선택은 막는다
  return getDescendantIds(organizationId).some(id => allowed.has(id));
}

/** 검색어에 맞는 조직 ID와 펼쳐야 할 상위 조직 ID */
export function computeOrganizationSearch(
  query: string,
  organizations: Organization[] = getAllOrganizations(),
): { matched: Set<string>; expand: Set<string> } {
  const q = query.trim().toLowerCase();
  const matched = new Set<string>();
  const expand = new Set<string>();
  if (!q) return { matched, expand };

  for (const org of organizations) {
    const hit =
      org.name.toLowerCase().includes(q)
      || org.type.toLowerCase().includes(q);
    if (!hit) continue;
    matched.add(org.id);
    for (const ancestorId of getAncestorIds(org.id)) expand.add(ancestorId);
  }

  return { matched, expand };
}
