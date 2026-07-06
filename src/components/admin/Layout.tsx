import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, BarChart, Layers,
  UserCog, Network, Home, Bell, ChevronLeft,
  Church, Settings, Link,
} from 'lucide-react';
import { getProfileImage } from '../../services/profileImage';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import { AppLayout } from '../layout/AppLayout';
import ChurchSettingsPage from '../../pages/admin/ChurchSettingsPage';

export type AdminPage =
  | 'home' | 'church' | 'org' | 'districts' | 'zones' | 'departments'
  | 'clergy' | 'members' | 'invitations' | 'contents'
  | 'sermons' | 'qt' | 'announcements' | 'bulletins'
  | 'events' | 'prayers' | 'visits' | 'new-family'
  | 'bible-plans' | 'albums' | 'statistics'
  | 'verification' | 'staff' | 'profile' | 'sharing'
  | 'bible' | 'church-info';

import type { NavIcon } from '../../types/icons';

type AdminNavId = AdminPage | 'settings';

type MenuItem = { id: AdminNavId; label: string; icon: NavIcon };

type Props = {
  children: React.ReactNode;
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onSwitchMode?: () => void;
};

/** Primary sidebar — 2단계 메뉴 (대시보드 → 기능) */
export const MENU_ITEMS: MenuItem[] = [
  { id: 'home',        label: '대시보드', icon: Home },
  { id: 'church',      label: '교회',     icon: Church },
  { id: 'org',         label: '조직',     icon: Network },
  { id: 'clergy',      label: '교역자',   icon: UserCog },
  { id: 'members',     label: '성도',     icon: Users },
  { id: 'invitations', label: '초대',     icon: Link },
  { id: 'contents',    label: '콘텐츠',   icon: Layers },
  { id: 'statistics',  label: '통계',     icon: BarChart },
  { id: 'settings',    label: '설정',     icon: Settings },
];

const BOTTOM_NAV_ITEMS: MenuItem[] = [
  { id: 'home',        label: '홈',     icon: Home },
  { id: 'contents',    label: '콘텐츠', icon: Layers },
  { id: 'members',     label: '성도',   icon: Users },
  { id: 'statistics',  label: '통계',   icon: BarChart },
  { id: 'settings',    label: '설정',   icon: Settings },
];

const PAGE_LABELS: Partial<Record<AdminPage, string>> = {
  home: '대시보드',
  church: '교회',
  org: '조직',
  clergy: '교역자',
  members: '성도',
  invitations: '초대',
  contents: '콘텐츠',
  statistics: '통계',
  sermons: '설교',
  announcements: '공지',
  bulletins: '주보',
  qt: '은혜기록',
  prayers: '기도',
  events: '일정',
  albums: '앨범',
  'bible-plans': '성경통독',
  sharing: '교회나눔',
  bible: '성경',
  profile: '내 정보',
};

const CONTENT_SUB_PAGES: AdminPage[] = [
  'sermons', 'announcements', 'bulletins', 'qt', 'prayers', 'events',
  'albums', 'bible-plans', 'sharing', 'bible',
];

const PAGE_SUBTITLES: Partial<Record<AdminPage, string>> = {
  home: '교회 운영 현황을 한눈에 확인하세요.',
  church: '교회 기본 정보와 인증을 관리합니다.',
  org: '교구, 구역, 부서를 관리합니다.',
  clergy: '교역자 정보와 담당 조직을 관리합니다.',
  members: '성도 정보와 소속을 관리합니다.',
  invitations: '초대 링크를 생성하고 관리합니다.',
  contents: '설교, 공지, 주보 등 콘텐츠를 관리합니다.',
  statistics: '교회 활동과 참여 현황을 확인하세요.',
  sermons: '예배 설교를 등록하고 관리하세요.',
  announcements: '교회 공지를 작성하고 안내하세요.',
  bulletins: '주보를 업로드하고 관리하세요.',
  events: '예배와 행사 일정을 관리하세요.',
  prayers: '기도제목을 확인하고 관리하세요.',
  albums: '교회 앨범을 관리하세요.',
  qt: '성도 은혜 기록을 관리하세요.',
  'bible-plans': '성경 통독 계획을 관리하세요.',
  sharing: '교회 간 나눔을 관리하세요.',
  bible: '성경을 읽고 묵상하세요.',
  profile: '나의 프로필과 소속 정보를 확인하세요.',
};

export function AdminLayout({ children, currentPage, onNavigate }: Props) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const { churchName, orgLabel } = useChurchOrg(user);

  useEffect(() => {
    if (user?.id) setProfileImg(getProfileImage(user.id));
  }, [user?.id]);

  const isHome = currentPage === 'home';
  const initial = (user?.name || '관')[0];
  const position = user?.position
    ?? (user?.role === 'super_admin' ? '최고관리자' : user?.role === 'pastor' ? '교역자' : '관리자');
  const pageLabel = PAGE_LABELS[currentPage] ?? MENU_ITEMS.find(m => m.id === currentPage)?.label ?? '관리';
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
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)' }}>
            {profileImg
              ? <img src={profileImg} alt="프로필" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{initial}</span>
            }
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
          onClick={() => onNavigate(CONTENT_SUB_PAGES.includes(currentPage) ? 'contents' : 'home')}
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
    <>
      <AppLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isHomePage={isHome}
        mobileHomeHeader={mobileHomeHeader}
        mobileSubHeader={mobileSubHeader}
        sidebarNavItems={MENU_ITEMS.map(i => ({ page: i.id as AdminPage, label: i.label, icon: i.icon }))}
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
    </>
  );
}

// Backward-compat export
export const menuItems: MenuItem[] = MENU_ITEMS;
