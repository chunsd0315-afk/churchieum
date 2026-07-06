import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell, ChevronLeft,
  Home, Users, Heart, ClipboardList, Megaphone,
  Calendar, BookOpen, BookHeart, User,
} from 'lucide-react';
import { getProfileImage } from '../../services/profileImage';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import { getUnreadNotificationCount } from '../../services/prayerNotificationStorage';
import { AppLayout } from '../layout/AppLayout';
import PrayerNotificationSheet from '../layout/PrayerNotificationSheet';

export type PastorPage =
  | 'home'
  | 'members'
  | 'prayers'
  | 'visits'
  | 'announcements'
  | 'events'
  | 'sermons'
  | 'grace-notes'
  | 'profile';

type NavMenuItem = {
  page: PastorPage;
  label: string;
  icon: import('../../types/icons').NavIcon;
};

const NAV_ITEMS: NavMenuItem[] = [
  { page: 'home',          label: '대시보드', icon: Home },
  { page: 'members',       label: '성도',     icon: Users },
  { page: 'prayers',       label: '기도',     icon: Heart },
  { page: 'visits',        label: '심방',     icon: ClipboardList },
  { page: 'announcements', label: '공지',     icon: Megaphone },
  { page: 'events',        label: '일정',     icon: Calendar },
  { page: 'sermons',       label: '설교',     icon: BookOpen },
  { page: 'grace-notes',   label: '은혜기록', icon: BookHeart },
  { page: 'profile',       label: '내 정보',  icon: User },
];

const BOTTOM_NAV_ITEMS: NavMenuItem[] = [
  { page: 'home',    label: '홈',     icon: Home },
  { page: 'members', label: '성도',   icon: Users },
  { page: 'prayers', label: '기도',   icon: Heart },
  { page: 'sermons', label: '설교',   icon: BookOpen },
  { page: 'profile', label: '내 정보', icon: User },
];

const PAGE_LABELS: Record<PastorPage, string> = {
  home: '대시보드',
  members: '성도',
  prayers: '기도',
  visits: '심방',
  announcements: '공지',
  events: '일정',
  sermons: '설교',
  'grace-notes': '은혜기록',
  profile: '내 정보',
};

const PAGE_SUBTITLES: Partial<Record<PastorPage, string>> = {
  members: '담당 조직의 성도를 돌보고 섬깁니다.',
  prayers: '기도제목을 확인하고 함께 기도하세요.',
  visits: '심방과 상담 기록을 관리하세요.',
  announcements: '교회 공지를 작성하고 안내하세요.',
  events: '예배와 행사 일정을 관리하세요.',
  sermons: '설교를 등록하고 말씀을 나누세요.',
  'grace-notes': '말씀과 삶 속 은혜를 기록하세요.',
  profile: '나의 프로필과 소속 정보를 확인하세요.',
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
  const [notifTick, setNotifTick] = useState(0);
  const { churchName, orgLabel } = useChurchOrg(user);

  const unreadCount = user?.id ? getUnreadNotificationCount(user.id) : 0;
  void notifTick;

  useEffect(() => {
    if (user?.id) setProfileImg(getProfileImage(user.id));
  }, [user?.id]);

  const isHome = currentPage === 'home';
  const initial = (user?.name || '목')[0];
  const position = user?.position ?? '교역자';
  const pageLabel = PAGE_LABELS[currentPage];
  const pageSubtitle = PAGE_SUBTITLES[currentPage];

  const mobileHomeHeader = (
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-4 h-14 flex items-center justify-between">
        <button type="button" onClick={() => onNavigate('profile')} className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}>
            {profileImg
              ? <img src={profileImg} alt="프로필" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{initial}</span>}
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
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{pageLabel}</span>
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
  );
}
