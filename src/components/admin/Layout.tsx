import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Bell, ChevronLeft, Settings,
  BookOpen, Heart, User,
} from 'lucide-react';
import { getProfileImage, resolveProfileImage } from '../../services/profileImage';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import { AppLayout } from '../layout/AppLayout';
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
  | 'events' | 'prayers' | 'visits' | 'new-family'
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
  { id: 'prayers' as const, label: HOME_MENU_CATALOG.prayer.label, icon: Heart },
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
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const { churchName, orgLabel } = useChurchOrg(user);

  useEffect(() => {
    if (user?.id) {
      setProfileImg(
        resolveProfileImage({ userId: user.id, role: user.role, src: getProfileImage(user.id) }),
      );
    }
  }, [user?.id, user?.role]);

  const isHome = currentPage === 'home';
  const position = user?.position
    ?? (user?.role === 'super_admin' ? '최고관리자' : user?.role === 'pastor' ? '교역자' : '관리자');
  const pageLabel = PAGE_LABELS[currentPage] ?? '관리';
  const pageSubtitle = PAGE_SUBTITLES[currentPage];

  const handleNavigate = (id: string) => {
    if (id === 'settings') {
      setShowSettings(true);
      return;
    }
    onNavigate(id as AdminPage);
  };

  const userPosition = user?.position
    ?? (user?.role === 'super_admin' ? '최고관리자' : user?.role === 'pastor' ? '교역자' : '관리자');

  const mobileHomeHeader = (
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-4 h-14 flex items-center justify-between">
        <button onClick={() => onNavigate('profile')} className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <UserProfileAvatar user={user} src={profileImg} size={40} />
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-gray-900 truncate" style={{ fontSize: '15px' }}>{user?.name || '관리자'}</span>
            {position && (
              <>
                <span className="text-gray-300 shrink-0" style={{ fontSize: '13px' }}>·</span>
                <span className="text-gray-500 truncate shrink-0" style={{ fontSize: '13px', fontWeight: 500 }}>{position}</span>
              </>
            )}
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button className="relative p-2 hover:bg-gray-100 rounded-[10px] transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-[10px] transition-colors">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="font-bold leading-tight" style={{ fontSize: '28px', color: '#111827' }}>{churchName}</p>
        {orgLabel && (
          <p className="leading-tight mt-1" style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>{orgLabel}</p>
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
    <HomeLayoutProvider openSettings={() => setShowSettings(true)}>
      <AppLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isHomePage={isHome}
        mobileHomeHeader={mobileHomeHeader}
        mobileSubHeader={mobileSubHeader}
        sidebarNavItems={SIDEBAR_NAV_ITEMS.map(i => ({ page: i.page as AdminPage, label: i.label, iconKey: i.iconKey }))}
        userPosition={userPosition}
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
