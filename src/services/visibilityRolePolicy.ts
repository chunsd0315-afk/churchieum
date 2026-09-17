/**
 * 공개범위 역할 정책
 *
 * 공개범위 선택지는 사용자 이름이 아니라 role + position + 조직 관계로 결정한다.
 * - 성도: 나만 보기 / 담당 교역자만 / 내 조직과 공유
 * - 교역자: 나만 보기 / 교역자와 공유 / 내 조직과 공유
 * - 최고관리자(담임목사 포함): 나만 보기 / 교역자와 공유 / 교회 조직과 공유 / 전체 공개
 *
 * 최고관리자의 「전체」는 교회이음 서비스 전체가 아니라 현재 로그인한 교회 내부 전체다.
 * 조직·교역자 원본은 모두 현재 교회 저장소(organizationStorage · clergyData)만 사용한다.
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import { isChurchWideSeniorPastor, buildCurrentUserDisplayMeta } from './currentUserDisplayMeta';
import {
  getDistrictDepartmentLabel,
  getPastorLabel,
  withObjectParticle,
  type OrgTerminologySettings,
} from './orgTerminology';
import { getAccessibleOrganizationsForUser } from './userOrganizationTree';
import {
  getChurchWidePastorIds,
  getDirectShareablePastorsForWriter,
} from './directPastorShare';
import {
  uniqueVisibilityIds,
  type ContentVisibilityMode,
  type ContentVisibilityPreset,
  type ContentVisibilityValue,
} from './visibilityNormalize';

/** 공개범위 UI·권한 범위 구분 */
export type VisibilityAudience = 'member' | 'pastor' | 'church_admin';

export type VisibilityOptionDef = {
  mode: ContentVisibilityMode;
  title: string;
  description: string;
};

export type VisibilityPolicy = {
  audience: VisibilityAudience;
  /** 최고관리자이면서 담임목사 — 교회 전체 담당 */
  isChurchWideLeader: boolean;
  churchName: string;
  pastorLabel: string;
  options: VisibilityOptionDef[];
  modes: ContentVisibilityMode[];
  /** 교역자 선택 범위 — church: 교회 전체 교역자 / related: 소속·담당 경로 */
  pastorScope: 'church' | 'related';
  /** 조직 선택 범위 — church: 전체 조직트리 / mine: 소속·담당 조직 */
  organizationScope: 'church' | 'mine';
  /** 전체 공개 표시 문구 — 예: 순복음성북교회 전체 */
  publicScopeLabel: string;
  pastorPickerTitle: string;
  pastorPickerDescription: string;
  organizationPickerTitle: string;
  organizationPickerDescription: string;
};

/**
 * 역할 판정 — 이름이 아니라 role·position 기준.
 * 최고관리자는 교회 전체 관리 권한을 가지므로 담임목사 여부와 무관하게 church_admin 범위를 쓴다.
 */
export function resolveVisibilityAudience(user: AppUser | null | undefined): VisibilityAudience {
  if (!user) return 'member';
  if (isSuperAdmin(user)) return 'church_admin';
  if (user.role === 'pastor') return 'pastor';
  return 'member';
}

export type VisibilityPolicyOptions = {
  /**
   * 교역자와 공유 허용 여부.
   * broadcast(공지·일정·앨범)는 메뉴별 저장 구조가 달라 기본값이 false이며,
   * 교역자 공유를 저장할 수 있는 메뉴에서만 true로 전달한다.
   */
  allowPastorShare?: boolean;
};

function optionOrder(
  audience: VisibilityAudience,
  preset: ContentVisibilityPreset,
  allowPastorShare: boolean,
): ContentVisibilityMode[] {
  if (preset === 'broadcast') {
    const base: ContentVisibilityMode[] = ['public', 'organization_share'];
    return allowPastorShare && audience === 'church_admin'
      ? [...base, 'pastor_share']
      : base;
  }
  const personal: ContentVisibilityMode[] = allowPastorShare
    ? ['private', 'pastor_share', 'organization_share']
    : ['private', 'organization_share'];
  return audience === 'church_admin' ? [...personal, 'public'] : personal;
}

export function getVisibilityPolicy(
  user: AppUser | null | undefined,
  preset: ContentVisibilityPreset = 'personal',
  settings?: OrgTerminologySettings | null,
  opts?: VisibilityPolicyOptions,
): VisibilityPolicy {
  const audience = resolveVisibilityAudience(user);
  const churchName = buildCurrentUserDisplayMeta(user ?? null).churchName;
  const pastorLabel = getPastorLabel(settings);
  const orgGroupLabel = getDistrictDepartmentLabel(settings);
  const particle = withObjectParticle(pastorLabel);
  const churchAdmin = audience === 'church_admin';
  const publicScopeLabel = `${churchName} 전체`;

  const titles: Record<ContentVisibilityMode, string> = {
    private: '나만 보기',
    pastor_share: churchAdmin || audience === 'pastor'
      ? `${pastorLabel}와 공유`
      : `담당 ${pastorLabel}만`,
    organization_share: churchAdmin ? '교회 조직과 공유' : '내 조직과 공유',
    public: '전체 공개',
  };

  const descriptions: Record<ContentVisibilityMode, string> = {
    private: '나만 볼 수 있어요.',
    pastor_share: churchAdmin
      ? `공유할 ${pastorLabel}${particle} 선택합니다.`
      : audience === 'pastor'
        ? `내 소속·담당 조직의 ${pastorLabel}${particle} 선택해 공유합니다.`
        : `내 소속 조직의 담당 ${pastorLabel}${particle} 선택해 공유합니다.`,
    organization_share: churchAdmin
      ? `${churchName}의 공유할 조직을 선택합니다.`
      : `내가 속한 ${orgGroupLabel}와 공유합니다.`,
    public: `${publicScopeLabel}에 공개합니다.`,
  };

  const allowPastorShare = opts?.allowPastorShare ?? preset === 'personal';
  const modes = optionOrder(audience, preset, allowPastorShare);

  return {
    audience,
    isChurchWideLeader: isChurchWideSeniorPastor(user ?? null),
    churchName,
    pastorLabel,
    modes,
    options: modes.map(mode => ({
      mode,
      title: titles[mode],
      description: descriptions[mode],
    })),
    pastorScope: churchAdmin ? 'church' : 'related',
    organizationScope: churchAdmin ? 'church' : 'mine',
    publicScopeLabel,
    pastorPickerTitle: `${pastorLabel} 선택`,
    pastorPickerDescription: churchAdmin
      ? `${churchName} 조직트리에서 ${pastorLabel}${particle} 선택합니다.`
      : audience === 'pastor'
        ? `내 소속·담당 조직의 ${pastorLabel}${particle} 선택합니다.`
        : `내 소속 조직의 담당 ${pastorLabel}${particle} 선택합니다.`,
    organizationPickerTitle: '조직 선택',
    organizationPickerDescription: churchAdmin
      ? '설정 > 조직관리의 조직트리에서 선택합니다.'
      : '내가 속하거나 담당하는 조직에서 선택합니다.',
  };
}

/** 사용자가 선택할 수 있는 조직 ID (null = 제한 없음은 사용하지 않음) */
export function getSelectableOrganizationIdsForVisibility(
  user: AppUser | null | undefined,
): Set<string> {
  const audience = resolveVisibilityAudience(user);
  return new Set(
    getAccessibleOrganizationsForUser(user ?? null, {
      fullTree: audience === 'church_admin',
    }),
  );
}

/** 사용자가 선택할 수 있는 교역자 ID */
export function getSelectablePastorIdsForVisibility(
  user: AppUser | null | undefined,
): Set<string> {
  const audience = resolveVisibilityAudience(user);
  if (audience === 'church_admin') return getChurchWidePastorIds();
  return new Set(getDirectShareablePastorsForWriter(user ?? null).map(p => p.id));
}

/**
 * 저장·조회 직전 권한 검사.
 * 선택 범위를 벗어난 조직·교역자 ID는 제거하고, 허용되지 않는 공개범위는 기본값으로 낮춘다.
 */
export function filterVisibilityValueByPermission(
  user: AppUser | null | undefined,
  value: ContentVisibilityValue,
  preset: ContentVisibilityPreset = 'personal',
  opts?: VisibilityPolicyOptions,
): ContentVisibilityValue {
  const policy = getVisibilityPolicy(user, preset, null, opts);
  const mode = policy.modes.includes(value.visibility)
    ? value.visibility
    : policy.modes[0];

  if (mode === 'private' || mode === 'public') {
    return { visibility: mode, sharedPastorIds: [], sharedOrganizationIds: [] };
  }

  if (mode === 'pastor_share') {
    const allowed = getSelectablePastorIdsForVisibility(user);
    return {
      visibility: 'pastor_share',
      sharedPastorIds: uniqueVisibilityIds(value.sharedPastorIds).filter(id => allowed.has(id)),
      sharedOrganizationIds: [],
    };
  }

  const allowedOrgs = getSelectableOrganizationIdsForVisibility(user);
  return {
    visibility: 'organization_share',
    sharedPastorIds: [],
    sharedOrganizationIds: uniqueVisibilityIds(value.sharedOrganizationIds).filter(id =>
      allowedOrgs.has(id),
    ),
  };
}

/** 목록 상세설정 필터에서 쓸 공개범위 옵션 */
export function getVisibilityFilterOptions(
  user: AppUser | null | undefined,
  settings?: OrgTerminologySettings | null,
): { id: ContentVisibilityMode | 'all'; label: string }[] {
  const policy = getVisibilityPolicy(user, 'personal', settings);
  const options: { id: ContentVisibilityMode | 'all'; label: string }[] = [
    { id: 'all', label: '전체' },
  ];
  for (const option of policy.options) {
    options.push({ id: option.mode, label: option.title });
  }
  return options;
}
