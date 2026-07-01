import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image, Book,
  HeartHandshake, BarChart, BookMarked, User, Church, Users, Building2,
  UserCheck, UserPlus, Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurchOrg } from '../../lib/useChurchOrg';
import type { AdminPage } from './Layout';
import HomeDashboard from '../home/HomeDashboard';
import type { HomeMenuItem } from '../home/HomeDashboard';
import { useHomeDashboardData } from '../home/useHomeDashboardData';

type Props = { onNavigate: (page: AdminPage) => void };

type MenuDef = {
  id: AdminPage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
};

const SHARED_MENUS: MenuDef[] = [
  { id: 'sermons',       label: '설교',     description: '예배 설교 말씀을 다시 보고 묵상하세요',     icon: BookOpen,       bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  { id: 'qt',            label: '은혜기록', description: '말씀과 삶 속에서 받은 은혜를 기록하세요',   icon: BookHeart,      bg: 'bg-primary-50', iconColor: 'text-primary-500' },
  { id: 'announcements', label: '공지사항', description: '교회 소식과 안내를 확인하세요',             icon: Megaphone,      bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  { id: 'bulletins',     label: '주보',     description: '예배 순서와 주간 소식을 확인하세요',        icon: FileText,       bg: 'bg-cyan-50',    iconColor: 'text-cyan-500' },
  { id: 'events',        label: '일정',     description: '교회 예배와 행사 일정을 확인하세요',        icon: Calendar,       bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { id: 'prayers',       label: '기도',     description: '기도제목을 나누고 함께 기도하세요',         icon: Heart,          bg: 'bg-rose-50',    iconColor: 'text-rose-500' },
  { id: 'albums',        label: '앨범',     description: '교회 공동체의 소중한 순간을 나누세요',      icon: Image,          bg: 'bg-pink-50',    iconColor: 'text-pink-500' },
  { id: 'bible',         label: '성경',     description: '하나님의 말씀을 읽고 묵상하세요',           icon: BookMarked,     bg: 'bg-amber-50',   iconColor: 'text-amber-500' },
  { id: 'bible-plans',   label: '성경통독', description: '말씀 통독 계획과 진행률을 확인하세요',      icon: Book,           bg: 'bg-green-50',   iconColor: 'text-green-500' },
  { id: 'sharing',       label: '교회나눔', description: '교회가 함께 나누고 성장합니다',             icon: HeartHandshake, bg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  { id: 'profile',       label: '내정보',   description: '나의 프로필과 소속 정보를 확인하세요',      icon: User,           bg: 'bg-gray-50',    iconColor: 'text-gray-500' },
  { id: 'church-info',   label: '교회정보', description: '우리 교회의 기본 정보를 확인하세요',        icon: Church,         bg: 'bg-teal-50',    iconColor: 'text-teal-500' },
  { id: 'church',        label: '설정',     description: '교회 환경 설정을 관리하세요',               icon: Settings,       bg: 'bg-slate-50',   iconColor: 'text-slate-500' },
];

const ADMIN_ONLY_MENUS: MenuDef[] = [
  { id: 'statistics',  label: '통계/보고서', description: '교회 통계와 보고서를 확인하세요',   icon: BarChart,  bg: 'bg-blue-50',   iconColor: 'text-blue-600' },
  { id: 'org',         label: '조직관리',    description: '교구, 구역, 부서를 관리하세요',     icon: Building2, bg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  { id: 'clergy',      label: '교역자관리',  description: '교역자 정보를 관리하세요',          icon: UserCheck, bg: 'bg-purple-50', iconColor: 'text-purple-500' },
  { id: 'members',     label: '성도관리',    description: '성도 정보를 관리하세요',            icon: Users,     bg: 'bg-sky-50',    iconColor: 'text-sky-500' },
  { id: 'invitations', label: '초대관리',    description: '초대 링크를 생성하고 관리하세요',   icon: UserPlus,  bg: 'bg-lime-50',   iconColor: 'text-lime-600' },
];

export default function AdminHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { churchName, orgLabel } = useChurchOrg(user);
  const { recentNotices, upcomingSchedules, prayerItems } = useHomeDashboardData();

  const isSuperAdmin = user?.role === 'super_admin';
  const mode = isSuperAdmin ? 'admin' : 'pastor';
  const menuDefs = isSuperAdmin ? [...SHARED_MENUS, ...ADMIN_ONLY_MENUS] : SHARED_MENUS;

  const menuItems: HomeMenuItem[] = menuDefs.map(m => ({
    ...m,
    onClick: () => onNavigate(m.id),
  }));

  return (
    <HomeDashboard
      currentUser={user}
      mode={mode}
      menuItems={menuItems}
      recentNotices={recentNotices}
      todaySchedules={upcomingSchedules}
      prayerItems={prayerItems}
      churchName={churchName}
      orgLabel={orgLabel}
      onMenuClick={id => onNavigate(id as AdminPage)}
      onNoticesMore={() => onNavigate('announcements')}
      onSchedulesMore={() => onNavigate('events')}
      onPrayersMore={() => onNavigate('prayers')}
    />
  );
}
