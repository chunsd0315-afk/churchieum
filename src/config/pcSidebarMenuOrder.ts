/**
 * PC 사이드바 기본 메뉴 순서 (단일 소스)
 * - 홈은 PCSidebar에서 항상 최상단 고정
 * - 역할에 없는 메뉴는 각 RoleMenus에서 제외(권한 숨김)
 * - 최고관리자 전용 메뉴는 ADMIN_EXTRA 아래에 배치
 */

export const PC_SIDEBAR_BASE_ORDER = [
  'sharing',
  'sermon',
  'grace',
  'announcement',
  'bulletin',
  'schedule',
  'album',
  'bible',
  'biblePlan',
  'profile',
  'churchInfo',
  'settings',
] as const;

/** 최고관리자 전용 — 기본 메뉴 아래 */
export const PC_SIDEBAR_ADMIN_EXTRA_ORDER = [
  'statistics',
  'org',
  'clergy',
  'members',
  'invitations',
] as const;

export type PcSidebarCatalogKey =
  | (typeof PC_SIDEBAR_BASE_ORDER)[number]
  | (typeof PC_SIDEBAR_ADMIN_EXTRA_ORDER)[number];

/** 앱 설정에서 토글·순서 변경 가능한 멤버 메뉴 (설정·관리 제외) */
export const PC_SIDEBAR_TOGGLEABLE_ORDER = PC_SIDEBAR_BASE_ORDER.filter(
  key => key !== 'settings',
);
