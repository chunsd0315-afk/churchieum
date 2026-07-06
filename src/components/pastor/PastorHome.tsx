import {
  Users, Heart, ClipboardList, Megaphone, Calendar, BookOpen, BookHeart, User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import type { PastorPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import type { HomeMenuItem } from '../common/home/HomeDashboard';
import { useHomeDashboardData } from '../common/home/useHomeDashboardData';

type Props = { onNavigate: (page: PastorPage) => void };

type MenuDef = {
  id: PastorPage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
};

const PASTOR_MENUS: MenuDef[] = [
  { id: 'members',       label: '성도',     description: '담당 조직의 성도를 돌보고 섬깁니다',     icon: Users,         bg: 'bg-sky-50',     iconColor: 'text-sky-600' },
  { id: 'prayers',       label: '기도',     description: '기도제목을 확인하고 함께 기도하세요',   icon: Heart,         bg: 'bg-rose-50',    iconColor: 'text-rose-500' },
  { id: 'visits',        label: '심방',     description: '심방과 상담 기록을 관리하세요',         icon: ClipboardList, bg: 'bg-amber-50',   iconColor: 'text-amber-600' },
  { id: 'announcements', label: '공지',     description: '교회 공지를 작성하고 안내하세요',       icon: Megaphone,     bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  { id: 'events',        label: '일정',     description: '예배와 행사 일정을 관리하세요',         icon: Calendar,      bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 'sermons',       label: '설교',     description: '설교를 등록하고 말씀을 나누세요',       icon: BookOpen,      bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  { id: 'grace-notes',   label: '은혜기록', description: '말씀과 삶 속 은혜를 기록하세요',         icon: BookHeart,     bg: 'bg-primary-50', iconColor: 'text-primary-600' },
  { id: 'profile',       label: '내 정보',  description: '나의 프로필과 소속 정보를 확인하세요',  icon: User,          bg: 'bg-gray-50',    iconColor: 'text-gray-600' },
];

export default function PastorHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { churchName, orgLabel } = useChurchOrg(user);
  const { recentNotices, upcomingSchedules, prayerItems } = useHomeDashboardData();

  const menuItems: HomeMenuItem[] = PASTOR_MENUS.map(m => ({
    ...m,
    onClick: () => onNavigate(m.id),
  }));

  return (
    <HomeDashboard
      currentUser={user}
      mode="pastor"
      menuItems={menuItems}
      recentNotices={recentNotices}
      todaySchedules={upcomingSchedules}
      prayerItems={prayerItems}
      churchName={churchName}
      orgLabel={orgLabel}
      onMenuClick={id => onNavigate(id as PastorPage)}
      onNoticesMore={() => onNavigate('announcements')}
      onSchedulesMore={() => onNavigate('events')}
      onPrayersMore={() => onNavigate('prayers')}
    />
  );
}
