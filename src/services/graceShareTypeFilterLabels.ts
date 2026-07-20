/**
 * 은혜기록 · 공유받은 기록 상세설정 — 공유 유형 버튼/칩 동적 문구
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import { getClergyByEmail, positionLabel } from './clergyData';
import type { ShareTypeFilter } from '../types/sharedContent';
import { SHARE_TYPE_FILTER_LABELS } from '../types/sharedContent';

export type GraceShareTypeFilterOption = {
  id: ShareTypeFilter;
  label: string;
  chipLabel: string;
  description: string;
  ariaLabel: string;
};

/** 이름 + 직분 (직분 중복·빈값 방지) */
export function buildGraceShareUserTitle(user: AppUser): string {
  const name = user.name?.trim() || '사용자';
  const clergy = getClergyByEmail(user.email);
  const position = (clergy ? positionLabel(clergy) : user.position?.trim()) || '';
  if (!position) return name;
  if (name.includes(position)) return name;
  return `${name} ${position}`;
}

export function getGraceShareTypeFilterOptions(
  user: AppUser | null,
  options?: { includePastorShare?: boolean },
): GraceShareTypeFilterOption[] {
  const includePastorShare = options?.includePastorShare ?? true;

  const allOption: GraceShareTypeFilterOption = {
    id: 'all',
    label: '전체',
    chipLabel: '전체',
    description: '공유받은 은혜기록을 모두 봅니다.',
    ariaLabel: '공유받은 은혜기록 전체 보기',
  };

  if (!user) return [allOption];

  if (isSuperAdmin(user)) {
    const opts: GraceShareTypeFilterOption[] = [allOption];
    if (includePastorShare) {
      opts.push({
        id: 'pastor_share',
        label: '교역자에게 공유한 전체 기록',
        chipLabel: '교역자 공유 전체',
        description: '교회 내 담당 교역자와 공유된 모든 기록입니다.',
        ariaLabel: '교역자에게 공유한 전체 은혜기록 보기',
      });
    }
    opts.push({
      id: 'organization_share',
      label: '교구·부서에 공유한 전체 기록',
      chipLabel: '교구·부서 공유 전체',
      description: '교회 내 교구·부서에 공유된 모든 기록입니다.',
      ariaLabel: '교구·부서에 공유한 전체 은혜기록 보기',
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
        description: '내가 속한 교구·부서에 공유된 기록입니다.',
        ariaLabel: '내 교구·부서에 공유한 은혜기록 보기',
      },
    ];
  }

  const userTitle = buildGraceShareUserTitle(user);
  const opts: GraceShareTypeFilterOption[] = [allOption];

  if (includePastorShare) {
    opts.push({
      id: 'pastor_share',
      label: `${userTitle}에게 공유한 기록`,
      chipLabel: '나에게 공유',
      description: '성도 또는 다른 교역자가 나를 선택해 공유한 기록입니다.',
      ariaLabel: `${userTitle}에게 공유한 은혜기록 보기`,
    });
  }

  opts.push({
    id: 'organization_share',
    label: `${userTitle} 교구·부서에 공유한 기록`,
    chipLabel: '내 교구·부서 공유',
    description: '내가 속하거나 담당하는 교구·부서에 공유된 기록입니다.',
    ariaLabel: `${userTitle} 교구·부서에 공유한 은혜기록 보기`,
  });

  return opts;
}

export function getGraceShareTypeFilterLabel(
  user: AppUser | null,
  shareType: ShareTypeFilter,
  variant: 'full' | 'chip' = 'full',
  includePastorShare = true,
): string {
  if (shareType === 'all') return '전체';
  const opt = getGraceShareTypeFilterOptions(user, { includePastorShare }).find(o => o.id === shareType);
  if (!opt) return SHARE_TYPE_FILTER_LABELS[shareType];
  return variant === 'chip' ? opt.chipLabel : opt.label;
}
