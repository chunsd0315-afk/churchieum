/**
 * 은혜기록·기도 공통 공개범위 (0.4)
 * VisibilityType 하나로 통일 — 기능별 별도 공개범위 로직 금지
 */

export type VisibilityType = 'private' | 'pastor_share' | 'organization_share';

/** 공유받은 기록 필터 — 공유유형 (전체 없음) */
export type ReceivedShareType = 'pastor_share' | 'organization_share';

/**
 * 공유 유형 필터
 * - pastor_share / organization_share: 활성 값
 * - all: 레거시 저장값 — 읽기 시 normalizeReceivedShareType 으로 변환
 */
export type ShareTypeFilter = ReceivedShareType | 'all';

export type VisibilityFilter = VisibilityType | 'all';

/** 정적 기본값 — 동적 표시는 getShareTypeFilterLabels() (orgTerminology) */
export const SHARE_TYPE_FILTER_LABELS: Record<ReceivedShareType, string> = {
  pastor_share: '교역자에게 공유한 기록',
  organization_share: '교구·부서에 공유한 기록',
};

/** 레거시 저장값 포함 — 읽기 호환용 */
export type LegacyVisibilityRaw =
  | VisibilityType
  | 'pastor'
  | 'pastor_shared'
  | 'group'
  | 'intercession'
  | 'public'
  | string;

export interface SharedContentFields {
  visibility: VisibilityType;
  sharedPastorIds: string[];
  sharedOrganizationIds: string[];
}

/** 정적 기본값 — 동적 표시는 getVisibilityLabels() (orgTerminology) */
export const VISIBILITY_LABELS: Record<VisibilityType, string> = {
  private: '나만 보기',
  pastor_share: '담당 교역자와 공유',
  organization_share: '교구·부서와 공유',
};

/** 교역자/관리자 화면용 라벨 */
export const VISIBILITY_LABELS_PASTOR: Record<VisibilityType, string> = {
  private: '나만 보기',
  pastor_share: '교역자와 공유',
  organization_share: '교구·부서와 공유',
};

export const VISIBILITY_DESCRIPTIONS: Record<VisibilityType, string> = {
  private: '나만 볼 수 있어요.',
  pastor_share: '내 소속 조직의 담당 교역자를 선택해 공유합니다.',
  organization_share: '선택한 공동체와 함께 나눠요.',
};

export const VISIBILITY_DESCRIPTIONS_PASTOR: Record<VisibilityType, string> = {
  private: '나만 볼 수 있어요.',
  pastor_share: '내 소속·담당 조직의 상위 담당 교역자를 선택해 공유합니다.',
  organization_share: '선택한 공동체와 함께 나눠요.',
};

/** 마이그레이션 버전 키 — 중복 마이그레이션 방지 */
export const SHARED_CONTENT_MIGRATION_KEY = 'churchieum_shared_content_vis_v1';

/**
 * 기존 공개범위 → 공통 VisibilityType
 * 삭제하지 않고 읽기 시점에 변환 (idempotent)
 */
export function migrateVisibility(raw: LegacyVisibilityRaw | undefined | null): VisibilityType {
  if (!raw) return 'private';
  switch (raw) {
    case 'private':
      return 'private';
    case 'pastor':
    case 'pastor_shared':
    case 'pastor_share':
      return 'pastor_share';
    case 'group':
    case 'intercession':
    case 'organization_share':
    case 'public':
      return 'organization_share';
    default:
      return 'private';
  }
}

export function isLegacyPublic(raw: LegacyVisibilityRaw | undefined | null): boolean {
  return raw === 'public';
}

export function uniqueIds(ids: string[] | undefined | null): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.filter(Boolean))];
}
