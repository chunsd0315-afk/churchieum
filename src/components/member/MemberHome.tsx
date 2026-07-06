import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image, BookMarked,
  HeartHandshake, User, Target,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import type { Page } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import type { HomeMenuItem } from '../common/home/HomeDashboard';
import { useHomeDashboardData } from '../common/home/useHomeDashboardData';

type Props = { onNavigate: (page: Page) => void };

type MenuDef = {
  id: Page;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
};

const MEMBER_MENUS: MenuDef[] = [
  { id: 'prayer',               label: '기도',     description: '기도제목을 나누고 함께 기도하세요',       icon: Heart,          bg: 'bg-rose-50',    iconColor: 'text-rose-500' },
  { id: 'sermon',               label: '설교',     description: '예배 설교 말씀을 다시 보고 묵상하세요',   icon: BookOpen,       bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  { id: 'grace-notes',          label: '은혜기록', description: '말씀과 삶 속에서 받은 은혜를 기록하세요', icon: BookHeart,      bg: 'bg-primary-50', iconColor: 'text-primary-500' },
  { id: 'bible',                label: '성경',     description: '하나님의 말씀을 읽고 묵상하세요',         icon: BookMarked,     bg: 'bg-amber-50',   iconColor: 'text-amber-500' },
  { id: 'bible-reading-center', label: '통독',     description: '말씀 통독 계획과 진행률을 확인하세요',    icon: Target,         bg: 'bg-green-50',   iconColor: 'text-green-500' },
  { id: 'announcement',         label: '공지',     description: '교회 소식과 안내를 확인하세요',           icon: Megaphone,      bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  { id: 'bulletin',             label: '주보',     description: '예배 순서와 주간 소식을 확인하세요',      icon: FileText,       bg: 'bg-cyan-50',    iconColor: 'text-cyan-500' },
  { id: 'schedule',             label: '일정',     description: '교회 예배와 행사 일정을 확인하세요',      icon: Calendar,       bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { id: 'album',                label: '앨범',     description: '교회 공동체의 소중한 순간을 나누세요',    icon: Image,          bg: 'bg-pink-50',    iconColor: 'text-pink-500' },
  { id: 'sharing',              label: '교제',     description: '성도들과 함께 나누고 교제하세요',         icon: HeartHandshake, bg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  { id: 'profile',              label: '내 정보',  description: '나의 프로필과 소속 정보를 확인하세요',    icon: User,           bg: 'bg-gray-50',    iconColor: 'text-gray-500' },
];

export default function MemberHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { churchName, orgLabel } = useChurchOrg(user);
  const { recentNotices, upcomingSchedules, prayerItems } = useHomeDashboardData();

  const menuItems: HomeMenuItem[] = MEMBER_MENUS.map(m => ({
    ...m,
    onClick: () => onNavigate(m.id),
  }));

  return (
    <HomeDashboard
      currentUser={user}
      mode="member"
      menuItems={menuItems}
      recentNotices={recentNotices}
      todaySchedules={upcomingSchedules}
      prayerItems={prayerItems}
      churchName={churchName}
      orgLabel={orgLabel}
      onMenuClick={id => onNavigate(id as Page)}
      onNoticesMore={() => onNavigate('announcement')}
      onSchedulesMore={() => onNavigate('schedule')}
      onPrayersMore={() => onNavigate('prayer')}
    />
  );
}
