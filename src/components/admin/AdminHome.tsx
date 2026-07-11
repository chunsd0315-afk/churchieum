import type { AdminPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import { ADMIN_ROLE_MENUS, buildHomeMenuItems } from '../common/home/roleMenus';
import { useHomeLayoutActions } from '../common/home/HomeLayoutContext';

type Props = { onNavigate: (page: AdminPage) => void };

export default function AdminHome({ onNavigate }: Props) {
  const { openSettings } = useHomeLayoutActions();

  const menuItems = buildHomeMenuItems(
    ADMIN_ROLE_MENUS,
    page => onNavigate(page as AdminPage),
    { onSettings: openSettings },
  );

  return (
    <HomeDashboard
      menuItems={menuItems}
      mode="admin"
      onSchedulesMore={() => onNavigate('events')}
      onNoticesMore={() => onNavigate('announcements')}
    />
  );
}
