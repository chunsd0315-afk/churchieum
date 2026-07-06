import type { NavIcon } from '../../../types/icons';
import { HOME_MENU_CATALOG } from './homeMenuCatalog';
import type { HomeMenuItem } from './HomeDashboard';

export type MenuCatalogKey = keyof typeof HOME_MENU_CATALOG;

export type RoleMenuEntry = {
  catalogKey: MenuCatalogKey;
  page: string;
};

/** 관리자 — 홈 카드 · 사이드바 공통 순서 */
export const ADMIN_ROLE_MENUS: RoleMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermons' },
  { catalogKey: 'grace', page: 'qt' },
  { catalogKey: 'announcement', page: 'announcements' },
  { catalogKey: 'bulletin', page: 'bulletins' },
  { catalogKey: 'schedule', page: 'events' },
  { catalogKey: 'prayer', page: 'prayers' },
  { catalogKey: 'album', page: 'albums' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-plans' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
  { catalogKey: 'statistics', page: 'statistics' },
  { catalogKey: 'org', page: 'org' },
  { catalogKey: 'clergy', page: 'clergy' },
  { catalogKey: 'members', page: 'members' },
  { catalogKey: 'invitations', page: 'invitations' },
  { catalogKey: 'settings', page: 'settings' },
];

/** 교역자 — 홈 카드 · 사이드바 공통 순서 */
export const PASTOR_ROLE_MENUS: RoleMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermons' },
  { catalogKey: 'grace', page: 'grace-notes' },
  { catalogKey: 'announcement', page: 'announcements' },
  { catalogKey: 'bulletin', page: 'bulletin' },
  { catalogKey: 'schedule', page: 'events' },
  { catalogKey: 'prayer', page: 'prayers' },
  { catalogKey: 'album', page: 'album' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-reading-center' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
  { catalogKey: 'settings', page: 'settings' },
];

/** 성도 — 홈 카드 · 사이드바 공통 순서 */
export const MEMBER_ROLE_MENUS: RoleMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermon' },
  { catalogKey: 'grace', page: 'grace-notes' },
  { catalogKey: 'announcement', page: 'announcement' },
  { catalogKey: 'bulletin', page: 'bulletin' },
  { catalogKey: 'schedule', page: 'schedule' },
  { catalogKey: 'prayer', page: 'prayer' },
  { catalogKey: 'album', page: 'album' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-reading-center' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
];

export function buildSidebarNavItems<T extends string>(
  entries: RoleMenuEntry[],
): { page: T; label: string; icon: NavIcon }[] {
  return entries.map(({ catalogKey, page }) => {
    const meta = HOME_MENU_CATALOG[catalogKey];
    return { page: page as T, label: meta.label, icon: meta.icon };
  });
}

export function buildHomeMenuItems(
  entries: RoleMenuEntry[],
  onNavigate: (page: string) => void,
  options?: { onSettings?: () => void },
): HomeMenuItem[] {
  return entries.map(({ catalogKey, page }) => {
    const meta = HOME_MENU_CATALOG[catalogKey];
    return {
      id: page,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      bg: meta.bg,
      iconColor: meta.iconColor,
      onClick: () => {
        if (page === 'settings') {
          options?.onSettings?.();
          return;
        }
        onNavigate(page);
      },
    };
  });
}

/** 페이지 헤더 라벨 — 카탈로그 메뉴명과 동일 */
export function catalogPageLabels(
  entries: RoleMenuEntry[],
): Record<string, string> {
  return Object.fromEntries(
    entries.map(({ catalogKey, page }) => [page, HOME_MENU_CATALOG[catalogKey].label]),
  );
}
