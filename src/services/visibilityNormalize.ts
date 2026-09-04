/**
 * 공개범위 공통 정규화 — 메뉴별 레거시 값을 ContentVisibilityMode로 통일
 * 기존 데이터는 삭제하지 않고 읽기 시점에만 변환
 */

export type ContentVisibilityMode =
  | 'private'
  | 'pastor_share'
  | 'organization_share'
  | 'public';

export type ContentVisibilityValue = {
  visibility: ContentVisibilityMode;
  sharedPastorIds: string[];
  sharedOrganizationIds: string[];
};

export type ContentVisibilityPreset = 'personal' | 'broadcast';

/** personal: 은혜·기도 / broadcast: 공지·앨범·일정 등 */
export const PRESET_OPTIONS: Record<ContentVisibilityPreset, ContentVisibilityMode[]> = {
  personal: ['private', 'pastor_share', 'organization_share'],
  broadcast: ['public', 'organization_share'],
};

export function uniqueVisibilityIds(ids: string[] | undefined | null): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.filter(Boolean))];
}

/**
 * 레거시·메뉴별 공개범위 문자열 → 공통 모드
 * all / public → public
 * private → private
 * pastor* → pastor_share
 * organization* / group / intercession → organization_share
 */
export function normalizeVisibility(
  raw: string | undefined | null,
): ContentVisibilityMode {
  if (!raw) return 'private';
  const v = String(raw).trim().toLowerCase();
  switch (v) {
    case 'public':
    case 'all':
    case '전체':
    case '전체공개':
    case '전체성도':
      return 'public';
    case 'private':
    case '나만보기':
      return 'private';
    case 'pastor':
    case 'pastor_share':
    case 'pastor_shared':
      return 'pastor_share';
    case 'group':
    case 'intercession':
    case 'organization':
    case 'organization_share':
    case 'organizations':
    case 'district':
    case 'zone':
    case 'department':
    case 'level1':
    case 'level2':
      return 'organization_share';
    default:
      return 'private';
  }
}

export function defaultContentVisibilityValue(
  existing?: Partial<ContentVisibilityValue> | null,
  preset: ContentVisibilityPreset = 'personal',
): ContentVisibilityValue {
  const allowed = PRESET_OPTIONS[preset];
  let visibility = existing?.visibility
    ? normalizeVisibility(existing.visibility)
    : (preset === 'broadcast' ? 'public' : 'private');
  if (!allowed.includes(visibility)) {
    visibility = allowed[0];
  }
  if (visibility === 'private' || visibility === 'public') {
    return { visibility, sharedPastorIds: [], sharedOrganizationIds: [] };
  }
  if (visibility === 'pastor_share') {
    return {
      visibility: 'pastor_share',
      sharedPastorIds: uniqueVisibilityIds(existing?.sharedPastorIds),
      sharedOrganizationIds: [],
    };
  }
  return {
    visibility: 'organization_share',
    sharedPastorIds: [],
    sharedOrganizationIds: uniqueVisibilityIds(existing?.sharedOrganizationIds),
  };
}

/** 조직 공유 선택 검증 */
export function validateContentVisibility(
  value: ContentVisibilityValue,
  pastorLabel = '교역자',
): string | null {
  if (value.visibility === 'organization_share' && value.sharedOrganizationIds.length === 0) {
    return '공유할 조직을 하나 이상 선택해 주세요.';
  }
  if (value.visibility === 'pastor_share' && value.sharedPastorIds.length === 0) {
    return `공유할 담당 ${pastorLabel}를 선택해 주세요.`;
  }
  return null;
}

/** Badge·목록용 짧은 라벨 */
export function contentVisibilityBadgeLabel(
  visibility: ContentVisibilityMode | string | undefined | null,
  opts?: {
    organizationNames?: string[];
    pastorCount?: number;
    pastorLabel?: string;
  },
): string {
  const mode = normalizeVisibility(visibility);
  if (mode === 'private') return '나만 보기';
  if (mode === 'public') return '전체 공개';
  if (mode === 'pastor_share') {
    const n = opts?.pastorCount ?? 0;
    const pl = opts?.pastorLabel ?? '교역자';
    if (n <= 0) return `담당 ${pl}만`;
    if (n === 1) return `담당 ${pl} 공유`;
    return `담당 ${pl} ${n}명`;
  }
  const names = opts?.organizationNames?.filter(Boolean) ?? [];
  if (names.length === 0) return '조직 공유';
  if (names.length === 1) return `${names[0]} 공유`;
  return `${names.length}개 조직 공유`;
}
