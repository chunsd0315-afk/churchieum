/**
 * 교회 앱 설정 — 메뉴/기능/홈/알림
 * localStorage + 이벤트 (교회별 키). Supabase church_settings 확장 전까지 캐시·데모용.
 */

export type AppMenuItemConfig = {
  catalogKey: string;
  enabled: boolean;
  sortOrder: number;
};

export type AppFeatureFlags = {
  comments: boolean;
  reactions: boolean;
  announcementNotify: boolean;
  orgShare: boolean;
  albumComments: boolean;
  bibleParallel: boolean;
  bibleWordStudy: boolean;
};

export type AppHomeWidgets = {
  todayWord: boolean;
  recentNotices: boolean;
  upcomingSchedules: boolean;
  recentAlbums: boolean;
  bulletin: boolean;
};

export type AppNotificationPrefs = {
  announcement: boolean;
  schedule: boolean;
  bulletin: boolean;
  comment: boolean;
  graceShare: boolean;
};

export type ChurchAppSettings = {
  menus: AppMenuItemConfig[];
  features: AppFeatureFlags;
  home: AppHomeWidgets;
  notifications: AppNotificationPrefs;
  updatedAt: string;
};

export const CHURCH_APP_SETTINGS_KEY = 'churchieum_app_settings_v1';
export const CHURCH_APP_SETTINGS_EVENT = 'churchieum:app-settings-changed';

const DEFAULT_FEATURES: AppFeatureFlags = {
  comments: true,
  reactions: true,
  announcementNotify: true,
  orgShare: true,
  albumComments: true,
  bibleParallel: true,
  bibleWordStudy: false, // 준비 중 — 기본 OFF
};

const DEFAULT_HOME: AppHomeWidgets = {
  todayWord: true,
  recentNotices: true,
  upcomingSchedules: true,
  recentAlbums: false,
  bulletin: false,
};

const DEFAULT_NOTIFICATIONS: AppNotificationPrefs = {
  announcement: true,
  schedule: true,
  bulletin: true,
  comment: true,
  graceShare: true,
};

/** 멤버 앱에서 토글 가능한 메뉴 카탈로그 키 (관리/설정 제외) */
export const TOGGLEABLE_MEMBER_MENU_KEYS = [
  'sermon',
  'grace',
  'announcement',
  'bulletin',
  'schedule',
  'album',
  'bible',
  'biblePlan',
  'sharing',
  'profile',
  'churchInfo',
] as const;

function defaultMenus(): AppMenuItemConfig[] {
  return TOGGLEABLE_MEMBER_MENU_KEYS.map((catalogKey, i) => ({
    catalogKey,
    enabled: true,
    sortOrder: i,
  }));
}

function loadRaw(): ChurchAppSettings | null {
  try {
    const raw = localStorage.getItem(CHURCH_APP_SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChurchAppSettings;
  } catch {
    return null;
  }
}

export function getDefaultChurchAppSettings(): ChurchAppSettings {
  return {
    menus: defaultMenus(),
    features: { ...DEFAULT_FEATURES },
    home: { ...DEFAULT_HOME },
    notifications: { ...DEFAULT_NOTIFICATIONS },
    updatedAt: new Date().toISOString(),
  };
}

export function getChurchAppSettings(): ChurchAppSettings {
  const stored = loadRaw();
  if (!stored) return getDefaultChurchAppSettings();
  const base = getDefaultChurchAppSettings();
  const menuMap = new Map((stored.menus ?? []).map(m => [m.catalogKey, m]));
  const menus = base.menus.map(def => {
    const hit = menuMap.get(def.catalogKey);
    return hit
      ? { ...def, enabled: hit.enabled !== false, sortOrder: hit.sortOrder ?? def.sortOrder }
      : def;
  });
  menus.sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    menus,
    features: { ...DEFAULT_FEATURES, ...stored.features },
    home: { ...DEFAULT_HOME, ...stored.home },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...stored.notifications },
    updatedAt: stored.updatedAt ?? base.updatedAt,
  };
}

export function saveChurchAppSettings(next: ChurchAppSettings): void {
  const payload: ChurchAppSettings = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CHURCH_APP_SETTINGS_KEY, JSON.stringify(payload));
  } catch { /* quota */ }
  try {
    window.dispatchEvent(new CustomEvent(CHURCH_APP_SETTINGS_EVENT));
  } catch { /* ignore */ }
}

export function updateChurchAppSettings(
  patch: Partial<Omit<ChurchAppSettings, 'updatedAt'>>,
): ChurchAppSettings {
  const current = getChurchAppSettings();
  const next: ChurchAppSettings = {
    ...current,
    ...patch,
    menus: patch.menus ?? current.menus,
    features: patch.features ? { ...current.features, ...patch.features } : current.features,
    home: patch.home ? { ...current.home, ...patch.home } : current.home,
    notifications: patch.notifications
      ? { ...current.notifications, ...patch.notifications }
      : current.notifications,
    updatedAt: new Date().toISOString(),
  };
  saveChurchAppSettings(next);
  return next;
}

export function getFeatureFlags(): AppFeatureFlags {
  return getChurchAppSettings().features;
}

export function getHomeWidgets(): AppHomeWidgets {
  return getChurchAppSettings().home;
}
