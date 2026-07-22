/**
 * 은혜와 기도 — 공유받은 기록 작성자 풀 / 안내 문구
 */

import type { GraceNote, GraceNoteType } from '../data/graceNotes';
import type { ShareTypeFilter } from '../types/sharedContent';
import type { AppUser } from './permissions';
import { getPrimaryDemoAccountById } from '../config/demoAccounts';
import { getClergyById } from './clergyData';
import { resolveGraceNoteAuthorDisplay } from './graceNoteAuthorDisplay';
import {
  formatOrgMetaSecondaryLine,
  getUserDepartmentLabelOutsidePath,
  getUserPrimaryOrganizationPath,
} from './userOrganizationPath';
import { getAllOrganizations } from './organizationStorage';
import { matchesShareTypeFilter, matchesOrganizationFilterForRecord } from './sharedContentAccess';
import { buildSharedContentUserTitle, subjectParticle } from './sharedContentShareTypeFilterLabels';
import { matchesSharedPastorFilter, pastorLabel, type EligiblePastor } from './graceShareFilterHelpers';

export type GraceSharedAuthorOption = {
  id: string;
  name: string;
  role: 'member' | 'pastor' | 'admin';
  positionLabel?: string;
  orgLabel?: string;
};

const PASTORAL_ROLES = new Set([
  'pastor', 'admin', 'super_admin',
  '담임목사', '부목사', '목사', '전도사', '교육전도사', '선교사', '간사',
]);

export function isPastoralGraceAuthorRole(role?: string): boolean {
  if (!role) return false;
  if (PASTORAL_ROLES.has(role)) return true;
  return role.includes('목사') || role.includes('전도사');
}

export function classifyGraceNoteAuthorRole(
  note: Pick<GraceNote, 'userId' | 'authorRole'>,
): GraceSharedAuthorOption['role'] {
  if (note.userId) {
    const demo = getPrimaryDemoAccountById(note.userId);
    if (demo) {
      if (demo.role === 'super_admin') return 'admin';
      if (demo.role === 'pastor') return 'pastor';
      return 'member';
    }
    if (getClergyById(note.userId)) return 'pastor';
  }
  if (isPastoralGraceAuthorRole(note.authorRole)) {
    return note.authorRole === 'super_admin' || note.authorRole === 'admin'
      ? 'admin'
      : 'pastor';
  }
  return 'member';
}

function authorOrgLabel(
  userId: string,
  role: GraceSharedAuthorOption['role'],
  relatedOrganizationIds?: string[],
): string {
  const orgs = getAllOrganizations();
  const path = getUserPrimaryOrganizationPath(
    userId,
    orgs,
    undefined,
    relatedOrganizationIds,
  );
  if (role === 'pastor' || role === 'admin') {
    if (path.length > 0) return `${path.join(' > ')} · 담당교역자`;
    return '담당교역자';
  }
  const dept = getUserDepartmentLabelOutsidePath(userId, path, relatedOrganizationIds);
  return formatOrgMetaSecondaryLine({
    pathNames: path,
    departmentLabel: dept,
    dateLabel: '',
  });
}

export type GraceAuthorPoolFilter = {
  typeFilter?: GraceNoteType | '';
  shareType: ShareTypeFilter;
  organizationIds: string[];
  selectedPastorIds: string[];
  showPastorPicker: boolean;
  showOrgTree: boolean;
};

/** 공유 조건(유형·교역자·조직·기록유형)에 맞는 기록에서 작성자 추출 */
export function buildGraceSharedAuthorPool(
  sharedNotes: GraceNote[],
  filter: GraceAuthorPoolFilter,
): GraceSharedAuthorOption[] {
  const map = new Map<string, GraceSharedAuthorOption>();

  for (const n of sharedNotes) {
    if (filter.typeFilter && n.type !== filter.typeFilter) continue;
    if (!matchesShareTypeFilter(n, filter.shareType)) continue;
    if (
      filter.showPastorPicker
      && filter.selectedPastorIds.length > 0
      && !matchesSharedPastorFilter(n, filter.selectedPastorIds)
    ) {
      continue;
    }
    if (
      filter.showOrgTree
      && filter.shareType === 'organization_share'
      && filter.organizationIds.length > 0
      && !matchesOrganizationFilterForRecord(n, filter.organizationIds)
    ) {
      continue;
    }

    const authorId = n.userId?.trim();
    if (!authorId || map.has(authorId)) continue;

    const role = classifyGraceNoteAuthorRole(n);
    const display = resolveGraceNoteAuthorDisplay(n);
    const related = [
      ...(n.sharedOrganizationIds ?? n.sharedGroupIds ?? []),
      ...(n.sharedUpperOrganizationIds ?? []),
      ...(n.sharedLowerOrganizationIds ?? []),
      ...(n.sharedDepartmentIds ?? []),
    ];

    map.set(authorId, {
      id: authorId,
      name: display.label,
      role,
      orgLabel: authorOrgLabel(authorId, role, related) || undefined,
    });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function getGraceAuthorRoleHint(params: {
  authorRole: 'all' | 'member' | 'pastor';
  shareType: ShareTypeFilter;
  isAdmin: boolean;
  isPastor: boolean;
  userTitle?: string;
}): string {
  const { authorRole, shareType, isAdmin, isPastor, userTitle } = params;
  if (!(isAdmin || isPastor)) return '';

  if (shareType === 'organization_share') {
    if (authorRole === 'member') return '성도가 작성한 공유 기록만 봅니다.';
    if (authorRole === 'pastor') return '교역자가 작성한 공유 기록만 봅니다.';
    return '성도와 교역자가 작성한 공유 기록을 모두 봅니다.';
  }

  if (shareType !== 'pastor_share') {
    if (authorRole === 'member') return '성도가 작성한 공유 기록만 봅니다.';
    if (authorRole === 'pastor') return '교역자가 작성한 공유 기록만 봅니다.';
    return '성도와 교역자가 작성한 공유 기록을 모두 봅니다.';
  }

  if (isAdmin) {
    if (authorRole === 'member') {
      return '성도가 선택한 교역자에게 직접 공유한 은혜와 기도입니다.';
    }
    if (authorRole === 'pastor') {
      return '다른 교역자가 선택한 교역자에게 직접 공유한 은혜와 기도입니다.';
    }
    return '선택한 교역자에게 직접 공유한 성도와 교역자의 은혜와 기도를 모두 봅니다.';
  }

  const title = userTitle?.trim() || '나';
  if (authorRole === 'member') {
    return `성도가 ${title}에게 직접 공유한 은혜와 기도입니다.`;
  }
  if (authorRole === 'pastor') {
    return `다른 교역자가 ${title}에게 직접 공유한 은혜와 기도입니다.`;
  }
  return `${title}에게 직접 공유한 성도와 교역자의 은혜와 기도를 모두 봅니다.`;
}

export function buildGraceSharedListDescription(params: {
  user: AppUser | null;
  applied: {
    shareType: ShareTypeFilter;
    selectedPastorIds: string[];
    authorRole: 'all' | 'member' | 'pastor';
    organizationIds: string[];
  };
  isAdmin: boolean;
  isPastor: boolean;
  isMember: boolean;
  pastorLookup: Map<string, EligiblePastor | { id: string; name: string; position: string }>;
}): string {
  const { user, applied, isAdmin, isPastor, isMember, pastorLookup } = params;
  const userTitle = user ? buildSharedContentUserTitle(user) : '';
  const shareType = applied.shareType === 'all'
    ? (isMember ? 'organization_share' : 'pastor_share')
    : applied.shareType;

  if (shareType === 'pastor_share') {
    if (isAdmin) {
      const ids = applied.selectedPastorIds;
      if (ids.length === 0) {
        return '교역자에게 직접 공유된 은혜와 기도를 봅니다.';
      }
      if (ids.length === 1) {
        const p = pastorLookup.get(ids[0]);
        const name = p ? pastorLabel(p as EligiblePastor) : '선택한 교역자';
        if (applied.authorRole === 'member') {
          return `성도가 ${name}에게 직접 공유한 은혜와 기도를 봅니다.`;
        }
        if (applied.authorRole === 'pastor') {
          return `다른 교역자가 ${name}에게 직접 공유한 은혜와 기도를 봅니다.`;
        }
        return `${name}에게 직접 공유된 은혜와 기도를 봅니다.`;
      }
      return `선택한 ${ids.length}명의 교역자에게 직접 공유된 은혜와 기도를 봅니다.`;
    }

    if (isPastor && userTitle) {
      if (applied.authorRole === 'member') {
        return `성도가 ${userTitle}에게 직접 공유한 기록을 봅니다.`;
      }
      if (applied.authorRole === 'pastor') {
        return `다른 교역자가 ${userTitle}에게 직접 공유한 기록을 봅니다.`;
      }
      return `${userTitle}에게 직접 공유된 은혜와 기도를 봅니다.`;
    }
  }

  // organization_share
  if (isMember) {
    return applied.organizationIds.length > 0
      ? '선택한 내 교구·부서에 공유된 은혜와 기도를 봅니다.'
      : '내가 속한 교구·부서에 공유된 은혜와 기도를 봅니다.';
  }
  if (isAdmin) {
    return applied.organizationIds.length > 0
      ? '선택한 교구·부서에 공유된 은혜와 기도를 봅니다.'
      : '교구·부서에 공유된 은혜와 기도를 봅니다.';
  }
  if (isPastor && userTitle) {
    return applied.organizationIds.length > 0
      ? `${userTitle}${subjectParticle(userTitle)} 속하거나 담당하는 교구·부서 중 선택한 조직의 기록을 봅니다.`
      : `${userTitle}${subjectParticle(userTitle)} 속하거나 담당하는 교구·부서에 공유된 기록을 봅니다.`;
  }
  return '내 교구·부서에 공유된 은혜와 기도를 봅니다.';
}
