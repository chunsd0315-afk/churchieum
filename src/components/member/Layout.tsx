import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronLeft,
  Home, BookHeart, BookOpen, Megaphone, User,
} from 'lucide-react';
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
  | 'sharing';

const SIDEBAR_NAV_ITEMS = buildSidebarNavItems<Page>(MEMBER_ROLE_MENUS);

const BOTTOM_NAV_ITEMS = [
  { page: 'home' as const, label: '홈', icon: Home },
  { page: 'grace-notes' as const, label: HOME_MENU_CATALOG.grace.label, icon: BookHeart },
  { page: 'sermon' as const, label: HOME_MENU_CATALOG.sermon.label, icon: BookOpen },
  { page: 'announcement' as const, label: HOME_MENU_CATALOG.announcement.label, icon: Megaphone },
  { page: 'profile' as const, label: HOME_MENU_CATALOG.profile.label, icon: User },
];

const PAGE_LABELS: Partial<Record<Page, string>> = {
  home: '홈',
  ...catalogPageLabels(MEMBER_ROLE_MENUS),
  departments: '부서',
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

  const unreadCount = user?.id
    ? getUnreadNotificationCount(user.id)
    : 0;
  void notifTick;

  const isHome = currentPage === 'home';
  const pageLabel   = PAGE_LABELS[currentPage] ?? '메뉴';
  const pageSubtitle = PAGE_SUBTITLES[currentPage];

  // Mode switcher for sidebar (admin users)
  const modeSwitcher = isAdmin ? (
    <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: '#F1F5F9' }}>
      <button className="flex-1 py-1.5 bg-white rounded-[8px] text-[11px] font-bold shadow-sm" style={{ color: '#2563EB' }}>
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

  const mobileHomeHeader = (
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
      sidebarNavItems={SIDEBAR_NAV_ITEMS}
      sidebarModeSwitcher={modeSwitcher}
      showSettingsButton={false}
      bottomNavItems={BOTTOM_NAV_ITEMS.map(i => ({ id: i.page, label: i.label, icon: i.icon }))}
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
