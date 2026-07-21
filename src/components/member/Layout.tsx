import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, ChevronLeft, Settings,
  Home, Heart, BookOpen, Megaphone, User,
} from 'lucide-react';
import { getProfileImage, resolveProfileImage } from '../../services/profileImage';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import { getUnreadNotificationCount } from '../../services/prayerNotificationStorage';
import { AppLayout } from '../layout/AppLayout';
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
  | 'prayer'
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
  { page: 'prayer' as const, label: HOME_MENU_CATALOG.prayer.label, icon: Heart },
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
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTick, setNotifTick] = useState(0);
  const { churchName, orgLabel } = useChurchOrg(user);

  const unreadCount = user?.id
    ? getUnreadNotificationCount(user.id)
    : 0;
  void notifTick;

  useEffect(() => {
    if (user?.id) {
      setProfileImg(
        resolveProfileImage({ userId: user.id, role: user.role, src: getProfileImage(user.id) }),
      );
    }
  }, [user?.id, user?.role]);

  const isHome = currentPage === 'home';
  const position = user?.position
    ?? (user?.role === 'super_admin' ? '최고관리자' : user?.role === 'pastor' ? '교역자' : '성도');
  const userPosition = position;
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
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-4 h-14 flex items-center justify-between">
        <button onClick={() => onNavigate('profile')} className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <UserProfileAvatar user={user} src={profileImg} size={40} />
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-gray-900 truncate" style={{ fontSize: '15px' }}>{user?.name || '성도'}</span>
            {position && (
              <>
                <span className="text-gray-300 shrink-0" style={{ fontSize: '13px' }}>·</span>
                <span className="text-gray-500 truncate shrink-0" style={{ fontSize: '13px', fontWeight: 500 }}>{position}</span>
              </>
            )}
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
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
          {(isAdmin || user?.role === 'pastor') && (
            <button
              onClick={isAdmin ? onSwitchMode : () => onNavigate('church-info')}
              className="p-2 hover:bg-gray-100 rounded-[10px] transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
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
      userPosition={userPosition}
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
