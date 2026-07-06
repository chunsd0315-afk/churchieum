import type { Page } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import { MEMBER_ROLE_MENUS, buildHomeMenuItems } from '../common/home/roleMenus';

type Props = { onNavigate: (page: Page) => void };

export default function MemberHome({ onNavigate }: Props) {
  const menuItems = buildHomeMenuItems(
    MEMBER_ROLE_MENUS,
    page => onNavigate(page as Page),
  );

  return <HomeDashboard menuItems={menuItems} />;
}
