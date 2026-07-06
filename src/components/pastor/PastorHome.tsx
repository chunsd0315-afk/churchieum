import type { PastorPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import { PASTOR_ROLE_MENUS, buildHomeMenuItems } from '../common/home/roleMenus';
import { useHomeLayoutActions } from '../common/home/HomeLayoutContext';

type Props = { onNavigate: (page: PastorPage) => void };

export default function PastorHome({ onNavigate }: Props) {
  const { openSettings } = useHomeLayoutActions();

  const menuItems = buildHomeMenuItems(
    PASTOR_ROLE_MENUS,
    page => onNavigate(page as PastorPage),
    { onSettings: openSettings },
  );

  return <HomeDashboard menuItems={menuItems} />;
}
