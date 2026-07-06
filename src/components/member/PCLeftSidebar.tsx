import {
  Home, BookOpen, Book, BookHeart, Heart, Megaphone,
  BookMarked, Calendar, Image, User, Target, Church, HeartHandshake,
} from 'lucide-react';
import type { NavIcon } from '../../types/icons';
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

const NAV_ITEMS: { page: Page; label: string; icon: NavIcon }[] = [
  { page: 'home',                 label: '홈',       icon: Home },
  { page: 'sermon',               label: '설교',     icon: BookOpen },
  { page: 'announcement',         label: '공지사항', icon: Megaphone },
  { page: 'bible',                label: '성경',     icon: Book },
  { page: 'bible-reading-center', label: '성경통독', icon: Target },
  { page: 'grace-notes',          label: '은혜기록', icon: BookHeart },
  { page: 'prayer',               label: '기도',     icon: Heart },
  { page: 'bulletin',             label: '주보',     icon: BookMarked },
  { page: 'schedule',             label: '일정',     icon: Calendar },
  { page: 'album',                label: '앨범',     icon: Image },
  { page: 'sharing',              label: '교회나눔', icon: HeartHandshake },
  { page: 'profile',              label: '내 정보',  icon: User },
  { page: 'church-info',          label: '교회정보', icon: Church },
];

export default function PCLeftSidebar({ currentPage, onNavigate, onSwitchMode, isAdmin }: Props) {
  const { user } = useAuth();

  const userPosition = user?.position
    ?? (user?.role === 'super_admin' ? '최고관리자' : user?.role === 'pastor' ? '교역자' : '성도');

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
