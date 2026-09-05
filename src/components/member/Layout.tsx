import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft } from 'lucide-react';
import { getUnreadNotificationCount } from '../../services/prayerNotificationStorage';
import { AppLayout } from '../layout/AppLayout';
import { MobileAppHomeHeader } from '../layout/MobileAppHomeHeader';
import { MobileSubPageHeader } from '../common/ui/PageLayout';
import PrayerNotificationSheet from '../layout/PrayerNotificationSheet';
import {
  MEMBER_ROLE_MENUS,
  buildSidebarNavItems,
  catalogPageLabels,
} from '../common/home/roleMenus';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';
import { CHURCH_APP_SETTINGS_EVENT } from '../../services/churchAppSettingsStorage';

export type Page =
  | 'home'
  | 'sermon'
  | 'grace-notes'
  | 'announcement'
  | 'album'
  | 'profile'
  | 'departments'
  | 'bible'
  | 'bible-reading-center'
  | 'bulletin'
  | 'schedule'
  | 'church-info'
  | 'sharing'
  | 'all-menus';

const BOTTOM_NAV_ITEMS: Array<{ page: Page; label: string; iconKey: import('../../config/menuIconMap').MenuIconKey }> = [
  { page: 'home', label: '홈', iconKey: 'home' },
  { page: 'sermon', label: HOME_MENU_CATALOG.sermon.label, iconKey: 'sermon' },
  { page: 'grace-notes', label: HOME_MENU_CATALOG.grace.label, iconKey: 'grace' },
  { page: 'profile', label: HOME_MENU_CATALOG.profile.label, iconKey: 'profile' },
  { page: 'all-menus', label: '더보기', iconKey: 'settings' },
];

const PAGE_LABELS: Partial<Record<Page, string>> = {
  home: '홈',
  ...catalogPageLabels(MEMBER_ROLE_MENUS),
  departments: '부서',
  'all-menus': '전체 메뉴',
};

const PAGE_SUBTITLES: Partial<Record<Page, string>> = {
  ...Object.fromEntries(
    MEMBER_ROLE_MENUS.map(({ catalogKey, page }) => [
      page,
      HOME_MENU_CATALOG[catalogKey].description,
    ]),
  ),
  departments: '부서 정보를 확인하세요.',
};

type Props = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSwitchMode: () => void;
  isAdmin: boolean;
};

export function MemberLayout({ children, currentPage, onNavigate, onSwitchMode, isAdmin }: Props) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTick, setNotifTick] = useState(0);
  const [menuTick, setMenuTick] = useState(0);

  useEffect(() => {
    const sync = () => setMenuTick(t => t + 1);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  const sidebarNavItems = useMemo(
    () => buildSidebarNavItems<Page>(MEMBER_ROLE_MENUS),
    [menuTick],
  );

  const unreadCount = user?.id
    ? getUnreadNotificationCount(user.id)
    : 0;
  void notifTick;

  const isHome = currentPage === 'home' || currentPage === 'all-menus';
  const pageLabel   = PAGE_LABELS[currentPage] ?? '메뉴';
  const pageSubtitle = PAGE_SUBTITLES[currentPage];

  // Mode switcher for sidebar (admin users)
  const modeSwitcher = isAdmin ? (
    <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: '#FFF5E8' }}>
      <button className="flex-1 py-1.5 bg-white rounded-[8px] text-[11px] font-bold shadow-sm" style={{ color: '#8A542F' }}>
        성도모드
      </button>
      <button
        onClick={onSwitchMode}
        className="flex-1 py-1.5 text-[11px] font-medium text-gray-500 rounded-[8px] hover:bg-white/70 transition-colors"
      >
        관리자
      </button>
    </div>
  ) : undefined;

  const mobileHomeHeader = currentPage === 'all-menus' ? (
    <MobileSubPageHeader
      title="전체 메뉴"
      description="필요한 메뉴를 찾아보세요."
      leading={(
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 px-3 py-2 rounded-[10px] transition-colors"
          style={{ color: '#5C524A' }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">뒤로</span>
        </button>
      )}
    />
  ) : (
    <MobileAppHomeHeader
      onProfileClick={() => onNavigate('profile')}
      onNotificationsClick={() => setShowNotifications(true)}
      unreadCount={unreadCount}
      showSettings={isAdmin || user?.role === 'pastor'}
      onSettingsClick={isAdmin ? onSwitchMode : () => onNavigate('church-info')}
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
    <AppLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      isHomePage={isHome}
      mobileHomeHeader={mobileHomeHeader}
      mobileSubHeader={mobileSubHeader}
      sidebarNavItems={sidebarNavItems}
      sidebarModeSwitcher={modeSwitcher}
      showSettingsButton={false}
      bottomNavItems={BOTTOM_NAV_ITEMS.map(i => ({ id: i.page, label: i.label, iconKey: i.iconKey }))}
    >
      {children}
      {showNotifications && user?.id && (
        <PrayerNotificationSheet
          userId={user.id}
          onClose={() => setShowNotifications(false)}
          onNavigate={onNavigate}
          onChanged={() => setNotifTick(t => t + 1)}
        />
      )}
    </AppLayout>
  );
}
