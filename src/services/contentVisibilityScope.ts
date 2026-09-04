/**
 * broadcast 공개범위 ↔ ContentScope / album·schedule 저장 필드 변환
 */

import type { ContentScope } from './permissions';
import { getOrganizationById } from './organizationStorage';
import { getOrganizationPathLabel } from './userOrganizationTree';
import {
  defaultContentVisibilityValue,
  uniqueVisibilityIds,
  type ContentVisibilityValue,
} from './visibilityNormalize';

function legacyKindToScopeType(
  kind: 'district' | 'zone' | 'department' | null | undefined,
): ContentScope['type'] {
  if (kind === 'zone') return 'zone';
  if (kind === 'department') return 'department';
  return 'district';
}

/** ContentVisibilityValue → ContentScope (첫 조직 기준 + sharedOrganizationIds 별도) */
export function contentVisibilityToContentScope(
  value: ContentVisibilityValue,
): ContentScope & { sharedOrganizationIds?: string[] } {
  if (value.visibility !== 'organization_share') {
    return { type: 'all', name: '전체 공개' };
  }
  const ids = uniqueVisibilityIds(value.sharedOrganizationIds);
  const first = ids[0] ? getOrganizationById(ids[0]) : undefined;
  if (!first) {
    return {
      type: 'district',
      name: '조직 공유',
      sharedOrganizationIds: ids,
    };
  }
  return {
    type: legacyKindToScopeType(first.legacyKind),
    id: first.id,
    name: first.name,
    sharedOrganizationIds: ids,
  };
}

/** 기존 ContentScope / album fields → ContentVisibilityValue */
export function contentScopeToContentVisibility(input: {
  visibility_type?: string | null;
  scope_id?: string | null;
  scope_name?: string | null;
  sharedOrganizationIds?: string[] | null;
  type?: ContentScope['type'];
  id?: string;
  name?: string;
}): ContentVisibilityValue {
  const type = input.visibility_type ?? input.type ?? 'all';
  const shared = uniqueVisibilityIds(input.sharedOrganizationIds);
  if (type === 'all' || !type) {
    return defaultContentVisibilityValue({ visibility: 'public' }, 'broadcast');
  }
  const ids = shared.length > 0
    ? shared
    : uniqueVisibilityIds([input.scope_id ?? input.id ?? '']);
  return defaultContentVisibilityValue(
    {
      visibility: 'organization_share',
      sharedOrganizationIds: ids,
    },
    'broadcast',
  );
}

export function contentVisibilityOrgNames(value: ContentVisibilityValue): string[] {
  if (value.visibility !== 'organization_share') return [];
  return value.sharedOrganizationIds.map(id => {
    const org = getOrganizationById(id);
    return org?.name || getOrganizationPathLabel(id);
  }).filter(Boolean);
}
