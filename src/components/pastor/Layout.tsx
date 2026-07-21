import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, ChevronLeft, Home, BookOpen, Heart, User,
} from 'lucide-react';
import { getProfileImage, resolveProfileImage } from '../../services/profileImage';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import { getUnreadNotificationCount } from '../../services/prayerNotificationStorage';
import { AppLayout } from '../layout/AppLayout';
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
  | 'prayers'
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
  { page: 'prayers' as const, label: HOME_MENU_CATALOG.prayer.label, icon: Heart },
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
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifTick, setNotifTick] = useState(0);
  const { churchName, orgLabel } = useChurchOrg(user);

  const unreadCount = user?.id ? getUnreadNotificationCount(user.id) : 0;
  void notifTick;

  useEffect(() => {
    if (user?.id) {
      setProfileImg(
        resolveProfileImage({ userId: user.id, role: user.role, src: getProfileImage(user.id) }),
      );
    }
  }, [user?.id, user?.role]);

  const isHome = currentPage === 'home';
  const position = user?.position ?? '교역자';
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
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-4 h-14 flex items-center justify-between">
        <button type="button" onClick={() => onNavigate('profile')} className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <UserProfileAvatar user={user} src={profileImg} size={40} />
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-gray-900 truncate" style={{ fontSize: '15px' }}>{user?.name || '교역자'}</span>
            <span className="text-gray-300 shrink-0" style={{ fontSize: '13px' }}>·</span>
            <span className="text-emerald-600 truncate shrink-0" style={{ fontSize: '13px', fontWeight: 600 }}>{position}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setShowNotifications(true)}
          className="relative p-2 hover:bg-gray-100 rounded-[10px] transition-colors"
          aria-label="기도 알림"
        >
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 bg-red-500 rounded-full border border-white" />
          )}
        </button>
      </div>
      <div className="px-4 pb-3">
        <p className="font-bold leading-tight" style={{ fontSize: '18px', color: '#111827' }}>{churchName}</p>
        {orgLabel && (
          <p className="leading-tight mt-0.5" style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>{orgLabel}</p>
        )}
      </div>
    </header>
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
        userPosition={position}
        bottomNavItems={BOTTOM_NAV_ITEMS.map(i => ({ id: i.page, label: i.label, icon: i.icon }))}
      >
        {children}
        {showNotifications && user?.id && (
          <PrayerNotificationSheet
            userId={user.id}
            onClose={() => setShowNotifications(false)}
            onNavigate={p => onNavigate(p === 'prayer' ? 'prayers' : 'home')}
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
