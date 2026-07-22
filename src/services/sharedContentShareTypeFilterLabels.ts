/**
 * 은혜기록·기도 공통 — 공유받은 기록 상세설정 공유 유형 동적 문구
 * (공유유형 "전체" 없음)
 */

import type { AppUser, UserRole } from './permissions';
import { isSuperAdmin } from './permissions';
import { getClergyByEmail, positionLabel } from './clergyData';
import type { ReceivedShareType, ShareTypeFilter } from '../types/sharedContent';
import { SHARE_TYPE_FILTER_LABELS } from '../types/sharedContent';

export type SharedContentDomain = 'grace' | 'prayer';

export type SharedContentShareTypeFilterOption = {
  id: ReceivedShareType;
  label: string;
  chipLabel: string;
  description: string;
  ariaLabel: string;
  visible?: boolean;
};

export type ReceivedShareOption = SharedContentShareTypeFilterOption & {
  value: ReceivedShareType;
  title: string;
  visible: boolean;
};

const CONTENT_NOUN: Record<SharedContentDomain, string> = {
  grace: '은혜와 기도',
  prayer: '기도',
};

function contentNoun(domain: SharedContentDomain): string {
  const label = CONTENT_NOUN[domain];
  if (typeof label === 'string' && label.trim()) return label.trim();
  return '기록';
}

/** 받침 유무에 따른 이/가 */
export function subjectParticle(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasBatchim = (last - 0xac00) % 28 !== 0;
    return hasBatchim ? '이' : '가';
  }
  return '이';
}

/** 받침 유무에 따른 을/를 */
export function objectParticle(noun: string): string {
  const last = noun.charCodeAt(noun.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasBatchim = (last - 0xac00) % 28 !== 0;
    return hasBatchim ? '을' : '를';
  }
  return '을';
}

/** 이름 + 직분 (직분 중복·빈값 방지) */
export function buildSharedContentUserTitle(user: AppUser): string {
  const name = user.name?.trim() || '사용자';
  const clergy = getClergyByEmail(user.email);
  const fromClergy = clergy ? positionLabel(clergy)?.trim() : '';
  const fromUser = user.position?.trim() || '';
  const position = fromClergy || fromUser;
  if (!position) return name;
  if (name.includes(position)) return name;
  return `${name} ${position}`;
}

export const formatUserNameWithPosition = buildSharedContentUserTitle;

function isPastorRole(user: AppUser): boolean {
  return user.role === 'pastor' && !isSuperAdmin(user);
}

function isMemberRole(user: AppUser): boolean {
  return !isSuperAdmin(user) && user.role !== 'pastor';
}

function resolveRole(user: AppUser | null): UserRole | 'guest' {
  if (!user) return 'guest';
  if (isSuperAdmin(user)) return 'super_admin';
  if (user.role === 'pastor') return 'pastor';
  return 'member';
}

/** 역할별 기본 공유유형 — 전체(all) 없음 */
export function getDefaultReceivedShareType(
  userOrRole: AppUser | UserRole | null | undefined,
): ReceivedShareType {
  const role =
    typeof userOrRole === 'string'
      ? userOrRole
      : userOrRole
        ? resolveRole(userOrRole)
        : 'guest';
  if (role === 'member') return 'organization_share';
  return 'pastor_share';
}

/**
 * 레거시 all 및 잘못된 값 → 역할 기본 공유유형
 */
export function normalizeReceivedShareType(
  value: unknown,
  userOrRole: AppUser | UserRole | null | undefined,
): ReceivedShareType {
  const role =
    typeof userOrRole === 'string'
      ? userOrRole
      : userOrRole
        ? resolveRole(userOrRole)
        : 'guest';
  const fallback = getDefaultReceivedShareType(role);

  if (value === 'organization_share') return 'organization_share';
  if (value === 'pastor_share') {
    return role === 'member' ? 'organization_share' : 'pastor_share';
  }
  // all / undefined / 기타 → 기본값
  return fallback;
}

/** @deprecated use normalizeReceivedShareType */
export function normalizeShareTypeForUser(
  user: AppUser | null,
  shareType: ShareTypeFilter,
): ReceivedShareType {
  return normalizeReceivedShareType(shareType, user);
}

/**
 * 역할별 공유유형 옵션 (전체 제외)
 */
export function getSharedContentShareTypeFilterOptions(
  user: AppUser | null,
  domain: SharedContentDomain,
  options?: { includePastorShare?: boolean },
): SharedContentShareTypeFilterOption[] {
  const noun = contentNoun(domain);
  const includePastorShare = options?.includePastorShare ?? true;

  if (!user) {
    return [{
      id: 'organization_share',
      label: '내 교구·부서에 공유한 기록',
      chipLabel: '내 교구·부서 공유',
      description: `교구·부서에 공유한 ${noun}입니다.`,
      ariaLabel: `내 교구·부서에 공유한 ${noun} 보기`,
      visible: true,
    }];
  }

  if (isSuperAdmin(user)) {
    const opts: SharedContentShareTypeFilterOption[] = [];
    if (includePastorShare) {
      opts.push({
        id: 'pastor_share',
        label: '교역자에게 공유한 기록',
        chipLabel: '교역자 직접 공유',
        description: `교역자를 선택해 공유한 ${noun}입니다.`,
        ariaLabel: `교역자에게 공유한 ${noun} 보기`,
        visible: true,
      });
    }
    opts.push({
      id: 'organization_share',
      label: '교구·부서에 공유한 기록',
      chipLabel: '교구·부서 공유',
      description: `교구·부서에 공유한 ${noun}입니다.`,
      ariaLabel: `교구·부서에 공유한 ${noun} 보기`,
      visible: true,
    });
    return opts;
  }

  if (isMemberRole(user)) {
    return [{
      id: 'organization_share',
      label: '내 교구·부서에 공유한 기록',
      chipLabel: '내 교구·부서 공유',
      description: `교구·부서에 공유한 ${noun}입니다.`,
      ariaLabel: `내 교구·부서에 공유한 ${noun} 보기`,
      visible: true,
    }];
  }

  // 교역자
  const userTitle = buildSharedContentUserTitle(user);
  const opts: SharedContentShareTypeFilterOption[] = [];

  if (includePastorShare) {
    opts.push({
      id: 'pastor_share',
      label: `${userTitle}에게 공유한 기록`,
      chipLabel: `${userTitle}에게 공유`,
      description: `교역자를 선택해 공유한 ${noun}입니다.`,
      ariaLabel: `${userTitle}에게 공유한 ${noun} 보기`,
      visible: true,
    });
  }

  opts.push({
    id: 'organization_share',
    label: `${userTitle} 교구·부서에 공유한 기록`,
    chipLabel: `${userTitle} 교구·부서`,
    description: `교구·부서에 공유한 ${noun}입니다.`,
    ariaLabel: `${userTitle} 교구·부서에 공유한 ${noun} 보기`,
    visible: true,
  });

  return opts;
}

export function getReceivedShareOptions(
  currentUser: AppUser | null,
  domain: SharedContentDomain = 'grace',
): ReceivedShareOption[] {
  return getSharedContentShareTypeFilterOptions(currentUser, domain)
    .filter(o => o.visible !== false)
    .map(o => ({
      ...o,
      value: o.id,
      title: o.label,
      visible: true,
    }));
}

export function getSharedContentShareTypeFilterLabel(
  user: AppUser | null,
  domain: SharedContentDomain,
  shareType: ShareTypeFilter,
  variant: 'full' | 'chip' = 'full',
  includePastorShare = true,
): string {
  const normalized = normalizeReceivedShareType(shareType, user);
  const opt = getSharedContentShareTypeFilterOptions(user, domain, { includePastorShare }).find(
    o => o.id === normalized,
  );
  if (!opt) return SHARE_TYPE_FILTER_LABELS[normalized];
  return variant === 'chip' ? opt.chipLabel : opt.label;
}

/** 활성 상세설정 개수 — shareType 은 항상 선택되어 있으므로 칩·카운트에서 별도 취급 */
export function countSharedContentDetailFilters(state: {
  contentType?: string;
  shareType?: string;
  organizationIds?: string[];
  selectedPastorIds?: string[];
  selectedAuthorIds?: string[];
  authorRole?: string;
  authorQuery?: string;
  visibility?: string;
  prayerStatus?: string;
}): number {
  let count = 0;
  if (state.contentType) count += 1;
  if (state.shareType === 'pastor_share' || state.shareType === 'organization_share') count += 1;
  if (state.visibility && state.visibility !== 'all') count += 1;
  if (state.prayerStatus && state.prayerStatus !== 'all') count += 1;
  if (state.organizationIds && state.organizationIds.length > 0) count += state.organizationIds.length;
  if (state.selectedPastorIds && state.selectedPastorIds.length > 0) {
    count += state.selectedPastorIds.length;
  }
  if (state.selectedAuthorIds && state.selectedAuthorIds.length > 0) {
    count += state.selectedAuthorIds.length;
  }
  if (state.authorRole && state.authorRole !== 'all') count += 1;
  if (state.authorQuery?.trim()) count += 1;
  return count;
}

export { isPastorRole, isMemberRole };
