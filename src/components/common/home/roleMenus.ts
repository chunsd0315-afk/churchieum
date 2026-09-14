import type { MenuIconKey } from '../../../config/menuIconMap';
import {
  PC_SIDEBAR_ADMIN_EXTRA_ORDER,
  PC_SIDEBAR_BASE_ORDER,
  type PcSidebarCatalogKey,
} from '../../../config/pcSidebarMenuOrder';
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

const PC_SIDEBAR_ORDER_INDEX = new Map<string, number>(
  [...PC_SIDEBAR_BASE_ORDER, ...PC_SIDEBAR_ADMIN_EXTRA_ORDER].map((key, i) => [key, i]),
);

/** 앱 설정(메뉴 ON/OFF·순서) 반영 — 홈/모바일 메뉴용 */
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

/** PC 사이드바 전용: 공통 기본 순서 + 권한(enabled)만 반영 */
function applyPcSidebarOrder(entries: RoleMenuEntry[]): RoleMenuEntry[] {
  const { menus } = getChurchAppSettings();
  const enabled = new Map(menus.map(m => [m.catalogKey, m.enabled !== false]));

  const kept = entries.filter(e => {
    if (!TOGGLEABLE.has(e.catalogKey as string)) return true;
    return enabled.get(e.catalogKey as string) !== false;
  });

  return [...kept].sort((a, b) => {
    const ai = PC_SIDEBAR_ORDER_INDEX.get(a.catalogKey as string) ?? 999;
    const bi = PC_SIDEBAR_ORDER_INDEX.get(b.catalogKey as string) ?? 999;
    return ai - bi;
  });
}

type RolePageMap = Partial<Record<PcSidebarCatalogKey, string>>;

function buildRoleMenus(pageMap: RolePageMap, withAdminExtra: boolean): RoleMenuEntry[] {
  const base = PC_SIDEBAR_BASE_ORDER
    .filter((key): key is (typeof PC_SIDEBAR_BASE_ORDER)[number] => pageMap[key] != null)
    .map(catalogKey => ({
      catalogKey: catalogKey as MenuCatalogKey,
      page: pageMap[catalogKey] as string,
    }));

  if (!withAdminExtra) return base;

  const extras = PC_SIDEBAR_ADMIN_EXTRA_ORDER
    .filter((key): key is (typeof PC_SIDEBAR_ADMIN_EXTRA_ORDER)[number] => pageMap[key] != null)
    .map(catalogKey => ({
      catalogKey: catalogKey as MenuCatalogKey,
      page: pageMap[catalogKey] as string,
    }));

  return [...base, ...extras];
}

/** 역할별 메뉴 구성 — 권한 정책 유지, 순서는 pcSidebarMenuOrder */
export const ADMIN_ROLE_MENUS: RoleMenuEntry[] = buildRoleMenus(
  {
    sharing: 'sharing',
    sermon: 'sermons',
    grace: 'qt',
    announcement: 'announcements',
    bulletin: 'bulletins',
    schedule: 'events',
    album: 'albums',
    bible: 'bible',
    biblePlan: 'bible-plans',
    profile: 'profile',
    churchInfo: 'church-info',
    settings: 'settings',
    statistics: 'statistics',
    org: 'org',
    clergy: 'clergy',
    members: 'members',
    invitations: 'invitations',
  },
  true,
);

export const PASTOR_ROLE_MENUS: RoleMenuEntry[] = buildRoleMenus(
  {
    sharing: 'sharing',
    sermon: 'sermons',
    grace: 'grace-notes',
    announcement: 'announcements',
    bulletin: 'bulletin',
    schedule: 'events',
    album: 'album',
    bible: 'bible',
    biblePlan: 'bible-reading-center',
    profile: 'profile',
    churchInfo: 'church-info',
    settings: 'settings',
  },
  false,
);

export const MEMBER_ROLE_MENUS: RoleMenuEntry[] = buildRoleMenus(
  {
    sharing: 'sharing',
    sermon: 'sermon',
    grace: 'grace-notes',
    announcement: 'announcement',
    bulletin: 'bulletin',
    schedule: 'schedule',
    album: 'album',
    bible: 'bible',
    biblePlan: 'bible-reading-center',
    profile: 'profile',
    churchInfo: 'church-info',
  },
  false,
);

export function buildSidebarNavItems<T extends string>(
  entries: RoleMenuEntry[],
  settings?: OrgTerminologySettings | null,
): { page: T; label: string; iconKey: MenuIconKey }[] {
  return applyPcSidebarOrder(entries).map(({ catalogKey, page }) => {
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
