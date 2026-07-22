/**
 * 은혜기록·기도 공통 — 공유받은 기록 상세설정 공유 유형 동적 문구
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import { getClergyByEmail, positionLabel } from './clergyData';
import type { ShareTypeFilter } from '../types/sharedContent';
import { SHARE_TYPE_FILTER_LABELS } from '../types/sharedContent';

export type SharedContentDomain = 'grace' | 'prayer';

export type SharedContentShareTypeFilterOption = {
  id: ShareTypeFilter;
  label: string;
  chipLabel: string;
  description: string;
  ariaLabel: string;
  visible?: boolean;
};

/** @deprecated alias — getSharedContentShareTypeFilterOptions 와 동일 구조 */
export type ReceivedShareOption = SharedContentShareTypeFilterOption & {
  value: ShareTypeFilter;
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

/**
 * 역할별 공유유형 옵션 (제목·설명·칩·노출)
 * — 고정 이름 문자열 금지, currentUser 이름·직분 반영
 */
export function getSharedContentShareTypeFilterOptions(
  user: AppUser | null,
  domain: SharedContentDomain,
  options?: { includePastorShare?: boolean },
): SharedContentShareTypeFilterOption[] {
  const noun = contentNoun(domain);
  const obj = objectParticle(noun);
  const includePastorShare = options?.includePastorShare ?? true;

  if (!user) {
    return [{
      id: 'all',
      label: '전체',
      chipLabel: '전체',
      description: `공유받은 ${noun}${obj} 모두 봅니다.`,
      ariaLabel: `공유받은 ${noun} 전체 보기`,
      visible: true,
    }];
  }

  if (isSuperAdmin(user)) {
    const opts: SharedContentShareTypeFilterOption[] = [
      {
        id: 'all',
        label: '전체',
        chipLabel: '전체',
        description: `교역자에게 직접 공유되거나 교구·부서에 공유된 ${noun}${obj} 모두 봅니다.`,
        ariaLabel: `공유된 ${noun} 전체 보기`,
        visible: true,
      },
    ];
    if (includePastorShare) {
      opts.push({
        id: 'pastor_share',
        label: '교역자에게 공유한 기록',
        chipLabel: '교역자 직접 공유',
        description: `성도 또는 다른 교역자가 교역자를 선택해 직접 공유한 ${noun}입니다.`,
        ariaLabel: `교역자에게 공유한 ${noun} 보기`,
        visible: true,
      });
    }
    opts.push({
      id: 'organization_share',
      label: '교구·부서에 공유한 기록',
      chipLabel: '교구·부서 공유',
      description: `교회 전체 교구·부서에 공유된 ${noun}입니다.`,
      ariaLabel: `교구·부서에 공유한 ${noun} 보기`,
      visible: true,
    });
    return opts;
  }

  if (isMemberRole(user)) {
    return [
      {
        id: 'all',
        label: '전체',
        chipLabel: '전체',
        description: `내가 속한 교구·부서에 공유된 ${noun}${obj} 모두 봅니다.`,
        ariaLabel: `내 교구·부서에 공유된 ${noun} 전체 보기`,
        visible: true,
      },
      {
        id: 'organization_share',
        label: '내 교구·부서에 공유한 기록',
        chipLabel: '내 교구·부서 공유',
        description: `내가 속한 교구·부서에 공유된 ${noun}입니다.`,
        ariaLabel: `내 교구·부서에 공유한 ${noun} 보기`,
        visible: true,
      },
    ];
  }

  // 교역자
  const userTitle = buildSharedContentUserTitle(user);
  const opts: SharedContentShareTypeFilterOption[] = [
    {
      id: 'all',
      label: '전체',
      chipLabel: '전체',
      description:
        `나에게 직접 공유되거나 내가 속하거나 담당하는 교구·부서에 공유된 ${noun}${obj} 모두 봅니다.`,
      ariaLabel: `${userTitle} 공유받은 ${noun} 전체 보기`,
      visible: true,
    },
  ];

  if (includePastorShare) {
    opts.push({
      id: 'pastor_share',
      label: `${userTitle}에게 공유한 기록`,
      chipLabel: `${userTitle}에게 공유`,
      description:
        `성도 또는 다른 교역자가 ${userTitle}${objectParticle(userTitle)} 선택해 직접 공유한 ${noun}입니다.`,
      ariaLabel: `${userTitle}에게 공유한 ${noun} 보기`,
      visible: true,
    });
  }

  opts.push({
    id: 'organization_share',
    label: `${userTitle} 교구·부서에 공유한 기록`,
    chipLabel: `${userTitle} 교구·부서`,
    description:
      `${userTitle}${subjectParticle(userTitle)} 속하거나 담당하는 교구·부서에 공유된 ${noun}입니다.`,
    ariaLabel: `${userTitle} 교구·부서에 공유한 ${noun} 보기`,
    visible: true,
  });

  return opts;
}

/** 사용자 요청 인터페이스 형태 — UI·문서용 래퍼 */
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
  if (shareType === 'all') return '전체';
  const opt = getSharedContentShareTypeFilterOptions(user, domain, { includePastorShare }).find(
    o => o.id === shareType,
  );
  if (!opt) return SHARE_TYPE_FILTER_LABELS[shareType];
  return variant === 'chip' ? opt.chipLabel : opt.label;
}

/**
 * 역할 변경·로그인 전환 시 공유유형 정규화
 * — 성도에게 pastor_share 가 남아 있으면 all 로 되돌림
 */
export function normalizeShareTypeForUser(
  user: AppUser | null,
  shareType: ShareTypeFilter,
): ShareTypeFilter {
  if (!user) return 'all';
  if (isMemberRole(user) && shareType === 'pastor_share') return 'all';
  const allowed = new Set(
    getSharedContentShareTypeFilterOptions(user, 'grace').map(o => o.id),
  );
  if (!allowed.has(shareType)) return 'all';
  return shareType;
}

/** 활성 상세설정 개수 */
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
  if (state.shareType && state.shareType !== 'all') count += 1;
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
