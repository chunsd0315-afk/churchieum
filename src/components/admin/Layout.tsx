import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Settings,
  Home, BookOpen, BookHeart, User,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { MobileAppHomeHeader } from '../layout/MobileAppHomeHeader';
import { MobileSubPageHeader } from '../common/ui/PageLayout';
import { useSettingsWorkspace } from './settings/useSettingsWorkspace';
import { HomeLayoutProvider } from '../common/home/HomeLayoutContext';
import {
  ADMIN_ROLE_MENUS,
  buildSidebarNavItems,
  catalogPageLabels,
  catalogPageDescriptions,
} from '../common/home/roleMenus';
import { HOME_MENU_CATALOG, resolveCatalogItem } from '../common/home/homeMenuCatalog';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { OrgSettings } from '../../contexts/OrgSettingsContext';
import { CHURCH_APP_SETTINGS_EVENT } from '../../services/churchAppSettingsStorage';

export type AdminPage =
  | 'home' | 'church' | 'org' | 'districts' | 'zones' | 'departments'
  | 'clergy' | 'members' | 'invitations' | 'contents'
  | 'sermons' | 'qt' | 'announcements' | 'bulletins'
  | 'events' | 'visits' | 'new-family'
  | 'bible-plans' | 'albums' | 'statistics'
  | 'verification' | 'staff' | 'profile' | 'sharing'
  | 'bible' | 'church-info';

type AdminNavId = AdminPage | 'settings';

type Props = {
  children: React.ReactNode;
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onSwitchMode?: () => void;
};

const BOTTOM_NAV_ITEMS = [
  { id: 'home' as const, label: '홈', icon: Home },
  { id: 'sermons' as const, label: HOME_MENU_CATALOG.sermon.label, icon: BookOpen },
  { id: 'qt' as const, label: HOME_MENU_CATALOG.grace.label, icon: BookHeart },
  { id: 'profile' as const, label: HOME_MENU_CATALOG.profile.label, icon: User },
  { id: 'settings' as const, label: HOME_MENU_CATALOG.settings.label, icon: Settings },
];

function useAdminPageCopy(settings: OrgSettings) {
  return useMemo(() => {
    const pageLabels: Partial<Record<AdminPage, string>> = {
      home: '홈',
      ...catalogPageLabels(ADMIN_ROLE_MENUS, settings),
      church: '교회',
      contents: '콘텐츠',
      districts: '교구',
      zones: '구역',
      departments: '부서',
      visits: '심방',
      'new-family': '새가족',
      verification: '교회인증',
      staff: '관리자',
    };
    const pageSubtitles: Partial<Record<AdminPage, string>> = {
      home: '교회 메뉴를 선택하세요.',
      ...catalogPageDescriptions(ADMIN_ROLE_MENUS, settings),
      church: '교회 기본 정보와 인증을 관리합니다.',
      contents: '설교, 공지, 주보 등 콘텐츠를 관리합니다.',
      org: resolveCatalogItem('org', settings).description,
      clergy: resolveCatalogItem('clergy', settings).description,
      members: resolveCatalogItem('members', settings).description,
      invitations: resolveCatalogItem('invitations', settings).description,
    };
    return { pageLabels, pageSubtitles };
  }, [settings]);
}

export function AdminLayout({ children, currentPage, onNavigate }: Props) {
  const [menuTick, setMenuTick] = useState(0);
  const { settings } = useOrgSettings();
  const { pageLabels, pageSubtitles } = useAdminPageCopy(settings);
  const workspaceSettings = useSettingsWorkspace({
    enabled: true,
    onExit: () => onNavigate('home'),
  });

  useEffect(() => {
    const sync = () => setMenuTick(t => t + 1);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  const sidebarNavItems = useMemo(
    () => buildSidebarNavItems<AdminNavId>(ADMIN_ROLE_MENUS, settings),
    [settings, menuTick],
  );

  const isHome = currentPage === 'home';
  const pageLabel = pageLabels[currentPage] ?? '관리';
  const pageSubtitle = pageSubtitles[currentPage];

  const handleNavigate = (id: string) => {
    if (id === 'settings') {
      workspaceSettings.openSettings();
      return;
    }
    if (workspaceSettings.active) workspaceSettings.dismissSettings();
    onNavigate(id as AdminPage);
  };

  const mobileHomeHeader = (
    <MobileAppHomeHeader
      onProfileClick={() => onNavigate('profile')}
      showSettings
      onSettingsClick={workspaceSettings.openSettings}
    />
  );

  const mobileSubHeader = (
    <MobileSubPageHeader
      title={pageLabel}
      description={pageSubtitle}
      leading={(
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">뒤로</span>
        </button>
      )}
    />
  );

  const settingsActive = workspaceSettings.active;
  const bottomNavItems = BOTTOM_NAV_ITEMS.map(i => ({ id: i.id, label: i.label, icon: i.icon }));

  return (
    <HomeLayoutProvider openSettings={workspaceSettings.openSettings}>
      <AppLayout
        currentPage={settingsActive ? ('settings' as AdminPage) : currentPage}
        onNavigate={handleNavigate}
        isHomePage={settingsActive ? false : isHome}
        mobileHomeHeader={mobileHomeHeader}
        mobileSubHeader={settingsActive ? workspaceSettings.mobileHeader : mobileSubHeader}
        sidebarNavItems={sidebarNavItems.map(i => ({ page: i.page as AdminPage, label: i.label, iconKey: i.iconKey }))}
        sidebarOverride={workspaceSettings.sidebar}
        contentVariant={settingsActive ? 'full' : 'well'}
        showSettingsButton
        onSettingsClick={workspaceSettings.openSettings}
        bottomNavItems={settingsActive && !workspaceSettings.showBottomNav ? undefined : bottomNavItems}
      >
        {settingsActive ? workspaceSettings.content : children}
      </AppLayout>
    </HomeLayoutProvider>
  );
}

// Backward-compat export (기본 용어)
export const MENU_ITEMS = buildSidebarNavItems<AdminNavId>(ADMIN_ROLE_MENUS).map(i => ({
  id: i.page,
  label: i.label,
  iconKey: i.iconKey,
}));
