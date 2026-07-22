/**
 * @deprecated Prefer sharedContentShareTypeFilterLabels with domain 'grace'
 * 은혜기록 전용 — domain 'grace'를 고정해 호출합니다.
 */

import type { AppUser } from './permissions';
import type { ShareTypeFilter } from '../types/sharedContent';
import {
  buildSharedContentUserTitle,
  getSharedContentShareTypeFilterOptions,
  getSharedContentShareTypeFilterLabel,
  getReceivedShareOptions,
  normalizeShareTypeForUser,
  type SharedContentShareTypeFilterOption,
} from './sharedContentShareTypeFilterLabels';

export {
  buildSharedContentUserTitle,
  getReceivedShareOptions,
  normalizeShareTypeForUser,
};
export type { SharedContentShareTypeFilterOption };

export const buildGraceShareUserTitle = buildSharedContentUserTitle;
export type GraceShareTypeFilterOption = SharedContentShareTypeFilterOption;

export function getGraceShareTypeFilterOptions(
  user: AppUser | null,
  options?: { includePastorShare?: boolean },
): SharedContentShareTypeFilterOption[] {
  return getSharedContentShareTypeFilterOptions(user, 'grace', options);
}

export function getGraceShareTypeFilterLabel(
  user: AppUser | null,
  shareType: ShareTypeFilter,
  variant: 'full' | 'chip' = 'full',
  includePastorShare = true,
): string {
  return getSharedContentShareTypeFilterLabel(
    user,
    'grace',
    shareType,
    variant,
    includePastorShare,
  );
}
