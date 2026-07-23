import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronLeft, Home, BookOpen, BookHeart, User,
} from 'lucide-react';
import { getUnreadNotificationCount } from '../../services/prayerNotificationStorage';
import { AppLayout } from '../layout/AppLayout';
import { MobileAppHomeHeader } from '../layout/MobileAppHomeHeader';
import { MobilePageHeaderCenter } from '../common/ui/PageHeaderTypography';
import PrayerNotificationSheet from '../layout/PrayerNotificationSheet';
import ChurchSettingsPage from '../../pages/admin/ChurchSettingsPage';
import { HomeLayoutProvider } from '../common/home/HomeLayoutContext';
import {
  PASTOR_ROLE_MENUS,
  buildSidebarNavItems,
  catalogPageLabels,
} from '../common/home/roleMenus';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';

export type PastorPage =
  | 'home'
  | 'members'
  | 'visits'
  | 'announcements'
  | 'events'
  | 'sermons'
  | 'grace-notes'
  | 'profile'
  | 'bulletin'
  | 'album'
  | 'bible'
  | 'bible-reading-center'
  | 'sharing'
  | 'church-info';

type PastorNavId = PastorPage | 'settings';

const SIDEBAR_NAV_ITEMS = buildSidebarNavItems<PastorNavId>(PASTOR_ROLE_MENUS);

const BOTTOM_NAV_ITEMS = [
  { page: 'home' as const, label: '홈', icon: Home },
  { page: 'sermons' as const, label: HOME_MENU_CATALOG.sermon.label, icon: BookOpen },
  { page: 'grace-notes' as const, label: HOME_MENU_CATALOG.grace.label, icon: BookHeart },
  { page: 'profile' as const, label: HOME_MENU_CATALOG.profile.label, icon: User },
];

const PAGE_LABELS: Partial<Record<PastorPage, string>> = {
  home: '홈',
  members: '성도관리',
  visits: '심방',
  ...catalogPageLabels(PASTOR_ROLE_MENUS),
};

const PAGE_SUBTITLES: Partial<Record<PastorPage, string>> = {
  home: '교회 메뉴를 선택하세요.',
  members: '담당 조직의 성도를 돌보고 섬깁니다.',
  visits: '심방과 상담 기록을 관리하세요.',
  ...Object.fromEntries(
    PASTOR_ROLE_MENUS.map(({ catalogKey, page }) => [
      page,
      HOME_MENU_CATALOG[catalogKey].description,
    ]),
  ),
};

type Props = {
  children: React.ReactNode;
  currentPage: PastorPage;
  onNavigate: (page: PastorPage) => void;
};

export function PastorLayout({ children, currentPage, onNavigate }: Props) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifTick, setNotifTick] = useState(0);

  const unreadCount = user?.id ? getUnreadNotificationCount(user.id) : 0;
  void notifTick;

  const isHome = currentPage === 'home';
  const pageLabel = PAGE_LABELS[currentPage] ?? '메뉴';
  const pageSubtitle = PAGE_SUBTITLES[currentPage];

  const handleNavigate = (id: string) => {
    if (id === 'settings') {
      setShowSettings(true);
      return;
    }
    onNavigate(id as PastorPage);
  };

  const mobileHomeHeader = (
    <MobileAppHomeHeader
      onProfileClick={() => onNavigate('profile')}
      onNotificationsClick={() => setShowNotifications(true)}
      unreadCount={unreadCount}
    />
  );

  const mobileSubHeader = (
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-2 flex items-center" style={{ minHeight: '56px' }}>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600 shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">뒤로</span>
        </button>
        <div className="flex-1 flex flex-col items-center pr-16">
          <MobilePageHeaderCenter title={pageLabel} description={pageSubtitle} />
        </div>
      </div>
    </header>
  );

  return (
    <HomeLayoutProvider openSettings={() => setShowSettings(true)}>
      <AppLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isHomePage={isHome}
        mobileHomeHeader={mobileHomeHeader}
        mobileSubHeader={mobileSubHeader}
        sidebarNavItems={SIDEBAR_NAV_ITEMS.map(i => ({ page: i.page as PastorPage, label: i.label, iconKey: i.iconKey }))}
        bottomNavItems={BOTTOM_NAV_ITEMS.map(i => ({ id: i.page, label: i.label, icon: i.icon }))}
      >
        {children}
        {showNotifications && user?.id && (
          <PrayerNotificationSheet
            userId={user.id}
            onClose={() => setShowNotifications(false)}
            onNavigate={() => onNavigate('grace-notes')}
            onChanged={() => setNotifTick(t => t + 1)}
          />
        )}
      </AppLayout>
      {showSettings && (
        <ChurchSettingsPage onClose={() => { setShowSettings(false); onNavigate('home'); }} />
      )}
    </HomeLayoutProvider>
  );
}
