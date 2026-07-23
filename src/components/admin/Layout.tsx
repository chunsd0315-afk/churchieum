import { useState } from 'react';
import { ChevronLeft, Settings,
  Home, BookOpen, BookHeart, User,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { MobileAppHomeHeader } from '../layout/MobileAppHomeHeader';
import { MobileSubPageHeader } from '../common/ui/PageLayout';
import ChurchSettingsPage from '../../pages/admin/ChurchSettingsPage';
import { HomeLayoutProvider } from '../common/home/HomeLayoutContext';
import {
  ADMIN_ROLE_MENUS,
  buildSidebarNavItems,
  catalogPageLabels,
} from '../common/home/roleMenus';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';

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

/** 홈 카드와 동일한 사이드바 메뉴 */
const SIDEBAR_NAV_ITEMS = buildSidebarNavItems<AdminNavId>(ADMIN_ROLE_MENUS);

const BOTTOM_NAV_ITEMS = [
  { id: 'home' as const, label: '홈', icon: Home },
  { id: 'sermons' as const, label: HOME_MENU_CATALOG.sermon.label, icon: BookOpen },
  { id: 'qt' as const, label: HOME_MENU_CATALOG.grace.label, icon: BookHeart },
  { id: 'profile' as const, label: HOME_MENU_CATALOG.profile.label, icon: User },
  { id: 'settings' as const, label: HOME_MENU_CATALOG.settings.label, icon: Settings },
];

const PAGE_LABELS: Partial<Record<AdminPage, string>> = {
  home: '홈',
  ...catalogPageLabels(ADMIN_ROLE_MENUS),
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

const PAGE_SUBTITLES: Partial<Record<AdminPage, string>> = {
  home: '교회 메뉴를 선택하세요.',
  ...Object.fromEntries(
    ADMIN_ROLE_MENUS.map(({ catalogKey, page }) => [
      page,
      HOME_MENU_CATALOG[catalogKey].description,
    ]),
  ),
  church: '교회 기본 정보와 인증을 관리합니다.',
  contents: '설교, 공지, 주보 등 콘텐츠를 관리합니다.',
  org: HOME_MENU_CATALOG.org.description,
  clergy: HOME_MENU_CATALOG.clergy.description,
  members: HOME_MENU_CATALOG.members.description,
  invitations: HOME_MENU_CATALOG.invitations.description,
};

export function AdminLayout({ children, currentPage, onNavigate }: Props) {
  const [showSettings, setShowSettings] = useState(false);

  const isHome = currentPage === 'home';
  const pageLabel = PAGE_LABELS[currentPage] ?? '관리';
  const pageSubtitle = PAGE_SUBTITLES[currentPage];

  const handleNavigate = (id: string) => {
    if (id === 'settings') {
      setShowSettings(true);
      return;
    }
    onNavigate(id as AdminPage);
  };

  const mobileHomeHeader = (
    <MobileAppHomeHeader
      onProfileClick={() => onNavigate('profile')}
      showSettings
      onSettingsClick={() => setShowSettings(true)}
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

  return (
    <HomeLayoutProvider openSettings={() => setShowSettings(true)}>
      <AppLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isHomePage={isHome}
        mobileHomeHeader={mobileHomeHeader}
        mobileSubHeader={mobileSubHeader}
        sidebarNavItems={SIDEBAR_NAV_ITEMS.map(i => ({ page: i.page as AdminPage, label: i.label, iconKey: i.iconKey }))}
        showSettingsButton
        onSettingsClick={() => setShowSettings(true)}
        bottomNavItems={BOTTOM_NAV_ITEMS.map(i => ({ id: i.id, label: i.label, icon: i.icon }))}
      >
        {children}
      </AppLayout>

      {showSettings && (
        <ChurchSettingsPage
          onClose={() => { setShowSettings(false); onNavigate('home'); }}
        />
      )}
    </HomeLayoutProvider>
  );
}

// Backward-compat export
export const MENU_ITEMS = SIDEBAR_NAV_ITEMS.map(i => ({ id: i.page, label: i.label, iconKey: i.iconKey }));
