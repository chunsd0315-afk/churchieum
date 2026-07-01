import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, ChevronLeft, Settings,
  Home, BookOpen, BookHeart, Heart, Megaphone,
  Book, BookMarked, Calendar, Image, User, Target,
  HeartHandshake, Church,
} from 'lucide-react';
import { getProfileImage } from '../../lib/profileImage';
import { useChurchOrg } from '../../lib/useChurchOrg';
import { getUnreadNotificationCount } from '../../lib/prayerNotificationStorage';
import { AppLayout } from '../shared/AppLayout';
import PrayerNotificationSheet from '../shared/PrayerNotificationSheet';

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

type NavMenuItem = { page: Page; label: string; icon: React.ComponentType<{ size?: number; className?: string }> };

const NAV_ITEMS: NavMenuItem[] = [
  { page: 'home',                  label: '홈',       icon: Home },
  { page: 'sermon',                label: '설교',     icon: BookOpen },
  { page: 'announcement',          label: '공지사항', icon: Megaphone },
  { page: 'bible',                 label: '성경',     icon: Book },
  { page: 'bible-reading-center',  label: '성경통독', icon: Target },
  { page: 'grace-notes',           label: '은혜기록', icon: BookHeart },
  { page: 'prayer',                label: '기도',     icon: Heart },
  { page: 'bulletin',              label: '주보',     icon: BookMarked },
  { page: 'schedule',              label: '일정',     icon: Calendar },
  { page: 'album',                 label: '앨범',     icon: Image },
  { page: 'sharing',               label: '교회나눔', icon: HeartHandshake },
  { page: 'profile',               label: '내 정보',  icon: User },
  { page: 'church-info',           label: '교회정보', icon: Church },
];

// Bottom nav: 5 most-used pages
const BOTTOM_NAV_ITEMS: NavMenuItem[] = [
  { page: 'home',         label: '홈',     icon: Home },
  { page: 'sermon',       label: '설교',   icon: BookOpen },
  { page: 'announcement', label: '공지',   icon: Megaphone },
  { page: 'prayer',       label: '기도',   icon: Heart },
  { page: 'profile',      label: '내 정보', icon: User },
];

const PAGE_LABELS: Partial<Record<Page, string>> = {
  sermon:                 '설교',
  'grace-notes':          '은혜기록',
  prayer:                 '기도',
  announcement:           '공지사항',
  album:                  '앨범',
  profile:                '내 정보',
  departments:            '부서',
  bible:                  '성경',
  'bible-reading-center': '성경통독',
  bulletin:               '주보',
  schedule:               '일정',
  'church-info':          '교회정보',
  sharing:                '교회나눔',
};

const PAGE_SUBTITLES: Partial<Record<Page, string>> = {
  sermon:                 '예배 설교 말씀을 다시 보고 묵상하세요.',
  'grace-notes':          '말씀과 삶 속에서 받은 은혜를 기록하고 나누세요.',
  prayer:                 '기도제목을 나누고 함께 기도하세요.',
  announcement:           '교회 소식과 안내를 확인하세요.',
  album:                  '교회 공동체의 소중한 순간을 함께 나누세요.',
  profile:                '나의 프로필과 소속 정보를 확인하세요.',
  departments:            '부서 정보를 확인하세요.',
  bible:                  '하나님의 말씀을 읽고 묵상하세요.',
  'bible-reading-center': '말씀 통독 계획과 진행률을 확인하세요.',
  bulletin:               '예배 순서와 주간 소식을 확인하세요.',
  schedule:               '교회 예배와 행사 일정을 확인하세요.',
  'church-info':          '우리 교회의 기본 정보를 확인하세요.',
  sharing:                '교회와 교회가 필요한 것을 나누고 함께 성장합니다.',
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
    if (user?.id) setProfileImg(getProfileImage(user.id));
  }, [user?.id]);

  const isHome = currentPage === 'home';
  const initial = (user?.name || '?')[0];
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
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)' }}>
            {profileImg
              ? <img src={profileImg} alt="프로필" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{initial}</span>
            }
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
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-2 flex items-center" style={{ minHeight: '56px' }}>
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600 shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">뒤로</span>
        </button>
        <div className="flex-1 flex flex-col items-center pr-16">
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
            {pageLabel}
          </span>
          {pageSubtitle && (
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#6B7280', marginTop: '2px', lineHeight: 1.3, textAlign: 'center' }}>
              {pageSubtitle}
            </span>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      isHomePage={isHome}
      mobileHomeHeader={mobileHomeHeader}
      mobileSubHeader={mobileSubHeader}
      sidebarNavItems={NAV_ITEMS}
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
