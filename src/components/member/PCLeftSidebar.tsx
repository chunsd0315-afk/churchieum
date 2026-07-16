import type { MenuIconKey } from '../common/design-system';
import type { Page } from './Layout';
import PCSidebar from '../layout/PCSidebar';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSwitchMode: () => void;
  isAdmin: boolean;
  userName: string;
  userEmail: string;
};

const NAV_ITEMS: { page: Page; label: string; iconKey: MenuIconKey }[] = [
  { page: 'home', label: '홈', iconKey: 'home' },
  { page: 'sermon', label: '설교', iconKey: 'sermon' },
  { page: 'announcement', label: '공지사항', iconKey: 'announcement' },
  { page: 'bible', label: '성경', iconKey: 'bible' },
  { page: 'bible-reading-center', label: '성경통독', iconKey: 'biblePlan' },
  { page: 'grace-notes', label: '은혜기록', iconKey: 'grace' },
  { page: 'prayer', label: '기도', iconKey: 'prayer' },
  { page: 'bulletin', label: '주보', iconKey: 'bulletin' },
  { page: 'schedule', label: '일정', iconKey: 'schedule' },
  { page: 'album', label: '앨범', iconKey: 'album' },
  { page: 'sharing', label: '교회나눔', iconKey: 'sharing' },
  { page: 'profile', label: '내 정보', iconKey: 'profile' },
  { page: 'church-info', label: '교회정보', iconKey: 'churchInfo' },
];

export default function PCLeftSidebar({ currentPage, onNavigate, onSwitchMode, isAdmin }: Props) {
  const { user } = useAuth();

  const userPosition = user?.position
    ?? (user?.role === 'super_admin' ? '최고관리자' : user?.role === 'pastor' ? '교역자' : '성도');

  const modeSwitcher = isAdmin ? (
    <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: '#F1F5F9' }}>
      <button type="button" className="flex-1 py-1.5 bg-white rounded-[8px] text-[11px] font-bold shadow-sm" style={{ color: '#2563EB' }}>
        성도모드
      </button>
      <button
        type="button"
        onClick={onSwitchMode}
        className="flex-1 py-1.5 text-[11px] font-medium text-gray-500 rounded-[8px] hover:bg-white/70 transition-colors"
      >
        관리자
      </button>
    </div>
  ) : undefined;

  return (
    <PCSidebar
      currentPage={currentPage}
      onNavigate={onNavigate}
      navItems={NAV_ITEMS}
      userPosition={userPosition}
      modeSwitcher={modeSwitcher}
    />
  );
}
