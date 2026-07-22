import type { MenuIconKey } from '../../../config/menuIconMap';
import { HOME_MENU_CATALOG } from './homeMenuCatalog';
import type { HomeMenuItem } from './HomeDashboard';

export type MenuCatalogKey = keyof typeof HOME_MENU_CATALOG;

export type RoleMenuEntry = {
  catalogKey: MenuCatalogKey;
  page: string;
};

/** 역할별 메뉴 구성 — 권한 정책 유지 */
export const ADMIN_ROLE_MENUS: RoleMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermons' },
  { catalogKey: 'grace', page: 'qt' },
  { catalogKey: 'announcement', page: 'announcements' },
  { catalogKey: 'bulletin', page: 'bulletins' },
  { catalogKey: 'schedule', page: 'events' },
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

export const PASTOR_ROLE_MENUS: RoleMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermons' },
  { catalogKey: 'grace', page: 'grace-notes' },
  { catalogKey: 'announcement', page: 'announcements' },
  { catalogKey: 'bulletin', page: 'bulletin' },
  { catalogKey: 'schedule', page: 'events' },
  { catalogKey: 'album', page: 'album' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-reading-center' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
  { catalogKey: 'settings', page: 'settings' },
];

export const MEMBER_ROLE_MENUS: RoleMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermon' },
  { catalogKey: 'grace', page: 'grace-notes' },
  { catalogKey: 'announcement', page: 'announcement' },
  { catalogKey: 'bulletin', page: 'bulletin' },
  { catalogKey: 'schedule', page: 'schedule' },
  { catalogKey: 'album', page: 'album' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-reading-center' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
];

export function buildSidebarNavItems<T extends string>(
  entries: RoleMenuEntry[],
): { page: T; label: string; iconKey: MenuIconKey }[] {
  return entries.map(({ catalogKey, page }) => {
    const meta = HOME_MENU_CATALOG[catalogKey];
    return { page: page as T, label: meta.label, iconKey: meta.iconKey };
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
      iconKey: meta.iconKey,
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

export function catalogPageLabels(
  entries: RoleMenuEntry[],
): Record<string, string> {
  return Object.fromEntries(
    entries.map(({ catalogKey, page }) => [page, HOME_MENU_CATALOG[catalogKey].label]),
  );
}
