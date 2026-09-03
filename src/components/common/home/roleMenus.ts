import type { MenuIconKey } from '../../../config/menuIconMap';
import { HOME_MENU_CATALOG, resolveCatalogItem } from './homeMenuCatalog';
import type { OrgTerminologySettings } from '../../../services/orgTerminology';
import type { HomeMenuItem } from './HomeDashboard';
import {
  getChurchAppSettings,
  TOGGLEABLE_MEMBER_MENU_KEYS,
} from '../../../services/churchAppSettingsStorage';

export type MenuCatalogKey = keyof typeof HOME_MENU_CATALOG;

export type RoleMenuEntry = {
  catalogKey: MenuCatalogKey;
  page: string;
};

const TOGGLEABLE = new Set<string>(TOGGLEABLE_MEMBER_MENU_KEYS);

/** 앱 설정(메뉴 ON/OFF·순서) 반영 — 관리/설정 메뉴는 숨기지 않음 */
export function applyAppMenuPreferences(entries: RoleMenuEntry[]): RoleMenuEntry[] {
  const { menus } = getChurchAppSettings();
  const enabled = new Map(menus.map(m => [m.catalogKey, m.enabled !== false]));
  const order = new Map(menus.map(m => [m.catalogKey, m.sortOrder]));

  const kept = entries.filter(e => {
    if (!TOGGLEABLE.has(e.catalogKey as string)) return true;
    return enabled.get(e.catalogKey as string) !== false;
  });

  return [...kept].sort((a, b) => {
    const ao = order.get(a.catalogKey as string);
    const bo = order.get(b.catalogKey as string);
    if (ao == null && bo == null) return 0;
    if (ao == null) return 1;
    if (bo == null) return -1;
    return ao - bo;
  });
}

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
  settings?: OrgTerminologySettings | null,
): { page: T; label: string; iconKey: MenuIconKey }[] {
  return applyAppMenuPreferences(entries).map(({ catalogKey, page }) => {
    const meta = resolveCatalogItem(catalogKey, settings);
    return { page: page as T, label: meta.label, iconKey: meta.iconKey };
  });
}

export function buildHomeMenuItems(
  entries: RoleMenuEntry[],
  onNavigate: (page: string) => void,
  options?: { onSettings?: () => void; settings?: OrgTerminologySettings | null },
): HomeMenuItem[] {
  const settings = options?.settings;
  return applyAppMenuPreferences(entries).map(({ catalogKey, page }) => {
    const meta = resolveCatalogItem(catalogKey, settings);
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
  settings?: OrgTerminologySettings | null,
): Record<string, string> {
  return Object.fromEntries(
    entries.map(({ catalogKey, page }) => [page, resolveCatalogItem(catalogKey, settings).label]),
  );
}

export function catalogPageDescriptions(
  entries: RoleMenuEntry[],
  settings?: OrgTerminologySettings | null,
): Record<string, string> {
  return Object.fromEntries(
    entries.map(({ catalogKey, page }) => [page, resolveCatalogItem(catalogKey, settings).description]),
  );
}
