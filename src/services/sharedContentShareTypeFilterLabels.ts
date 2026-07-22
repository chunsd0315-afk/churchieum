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

/** 받침 유무에 따른 을/를 */
function objectParticle(noun: string): string {
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

export function getSharedContentShareTypeFilterOptions(
  user: AppUser | null,
  domain: SharedContentDomain,
  options?: { includePastorShare?: boolean },
): SharedContentShareTypeFilterOption[] {
  const noun = contentNoun(domain);
  const obj = objectParticle(noun);
  const includePastorShare = options?.includePastorShare ?? true;

  const allOption: SharedContentShareTypeFilterOption = {
    id: 'all',
    label: '전체',
    chipLabel: '전체',
    description: `공유받은 ${noun}${obj} 모두 봅니다.`,
    ariaLabel: `공유받은 ${noun} 전체 보기`,
  };

  if (!user) return [allOption];

  if (isSuperAdmin(user)) {
    const opts: SharedContentShareTypeFilterOption[] = [allOption];
    if (includePastorShare) {
      opts.push({
        id: 'pastor_share',
        label: '교역자에게 공유한 전체 기록',
        chipLabel: '교역자 공유 전체',
        description: `교회 내 담당 교역자와 공유된 모든 ${noun}입니다.`,
        ariaLabel: `교역자에게 공유한 전체 ${noun} 보기`,
      });
    }
    opts.push({
      id: 'organization_share',
      label: '교구·부서에 공유한 전체 기록',
      chipLabel: '교구·부서 공유 전체',
      description: `교회 내 교구·부서에 공유된 모든 ${noun}입니다.`,
      ariaLabel: `교구·부서에 공유한 전체 ${noun} 보기`,
    });
    return opts;
  }

  if (user.role === 'member') {
    return [
      allOption,
      {
        id: 'organization_share',
        label: '내 교구·부서에 공유한 기록',
        chipLabel: '내 교구·부서 공유',
        description: `내가 속한 교구·부서에 공유된 ${noun}입니다.`,
        ariaLabel: `내 교구·부서에 공유한 ${noun} 보기`,
      },
    ];
  }

  const userTitle = buildSharedContentUserTitle(user);
  const opts: SharedContentShareTypeFilterOption[] = [allOption];

  if (includePastorShare) {
    opts.push({
      id: 'pastor_share',
      label: `${userTitle}에게 공유한 기록`,
      chipLabel: '나에게 공유',
      description: `성도 또는 다른 교역자가 나를 선택해 공유한 ${noun}입니다.`,
      ariaLabel: `${userTitle}에게 공유한 ${noun} 보기`,
    });
  }

  opts.push({
    id: 'organization_share',
    label: `${userTitle} 교구·부서에 공유한 기록`,
    chipLabel: '내 교구·부서 공유',
    description: `내가 속하거나 담당하는 교구·부서에 공유된 ${noun}입니다.`,
    ariaLabel: `${userTitle} 교구·부서에 공유한 ${noun} 보기`,
  });

  return opts;
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

/** 활성 상세설정 개수 — recordType/contentType, shareType, org, pastor, authorRole, authorQuery */
export function countSharedContentDetailFilters(state: {
  contentType?: string;
  shareType?: string;
  organizationIds?: string[];
  selectedPastorIds?: string[];
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
  if (state.authorRole && state.authorRole !== 'all') count += 1;
  if (state.authorQuery?.trim()) count += 1;
  return count;
}
