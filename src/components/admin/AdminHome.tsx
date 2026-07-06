import {
  Church, Network, UserCog, Users, Link, Layers, BarChart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import type { AdminPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import type { HomeMenuItem } from '../common/home/HomeDashboard';
import { useHomeDashboardData } from '../common/home/useHomeDashboardData';

type Props = { onNavigate: (page: AdminPage) => void };

type MenuDef = {
  id: AdminPage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
};

const ADMIN_MENUS: MenuDef[] = [
  { id: 'church',      label: '교회',     description: '교회 기본 정보와 인증을 관리합니다',   icon: Church,   bg: 'bg-teal-50',    iconColor: 'text-teal-600' },
  { id: 'org',         label: '조직',     description: '교구, 구역, 부서를 관리합니다',       icon: Network,  bg: 'bg-indigo-50',  iconColor: 'text-indigo-500' },
  { id: 'clergy',      label: '교역자',   description: '교역자 정보와 담당을 관리합니다',     icon: UserCog,  bg: 'bg-purple-50',  iconColor: 'text-purple-500' },
  { id: 'members',     label: '성도',     description: '성도 정보와 소속을 관리합니다',       icon: Users,    bg: 'bg-sky-50',     iconColor: 'text-sky-600' },
  { id: 'invitations', label: '초대',     description: '초대 링크를 생성하고 관리합니다',     icon: Link,     bg: 'bg-lime-50',    iconColor: 'text-lime-600' },
  { id: 'contents',    label: '콘텐츠',   description: '설교, 공지, 주보 등을 관리합니다',    icon: Layers,   bg: 'bg-blue-50',    iconColor: 'text-blue-600' },
  { id: 'statistics',  label: '통계',     description: '교회 활동과 참여 현황을 확인합니다',  icon: BarChart, bg: 'bg-violet-50',  iconColor: 'text-violet-600' },
];

export default function AdminHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const { churchName, orgLabel } = useChurchOrg(user);
  const { recentNotices, upcomingSchedules, prayerItems } = useHomeDashboardData();

  const menuItems: HomeMenuItem[] = ADMIN_MENUS.map(m => ({
    ...m,
    onClick: () => onNavigate(m.id),
  }));

  return (
    <HomeDashboard
      currentUser={user}
      mode="admin"
      menuItems={menuItems}
      recentNotices={recentNotices}
      todaySchedules={upcomingSchedules}
      prayerItems={prayerItems}
      churchName={churchName}
      orgLabel={orgLabel}
      onMenuClick={id => onNavigate(id as AdminPage)}
      onNoticesMore={() => onNavigate('contents')}
      onSchedulesMore={() => onNavigate('events')}
      onPrayersMore={() => onNavigate('prayers')}
    />
  );
}
