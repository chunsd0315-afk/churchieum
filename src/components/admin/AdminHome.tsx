import type { AdminPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import type { HomeMenuItem } from '../common/home/HomeDashboard';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';
import { useHomeLayoutActions } from '../common/home/HomeLayoutContext';

type Props = { onNavigate: (page: AdminPage) => void };

type AdminMenuEntry = {
  catalogKey: keyof typeof HOME_MENU_CATALOG;
  page: AdminPage | 'settings';
};

const ADMIN_HOME_MENUS: AdminMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermons' },
  { catalogKey: 'grace', page: 'qt' },
  { catalogKey: 'announcement', page: 'announcements' },
  { catalogKey: 'bulletin', page: 'bulletins' },
  { catalogKey: 'schedule', page: 'events' },
  { catalogKey: 'prayer', page: 'prayers' },
  { catalogKey: 'album', page: 'albums' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-plans' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
  { catalogKey: 'statistics', page: 'statistics' },
  { catalogKey: 'org', page: 'org' },
  { catalogKey: 'clergy', page: 'clergy' },
  { catalogKey: 'members', page: 'members' },
  { catalogKey: 'invitations', page: 'invitations' },
  { catalogKey: 'settings', page: 'settings' },
];

export default function AdminHome({ onNavigate }: Props) {
  const { openSettings } = useHomeLayoutActions();

  const menuItems: HomeMenuItem[] = ADMIN_HOME_MENUS.map(({ catalogKey, page }) => {
    const meta = HOME_MENU_CATALOG[catalogKey];
    return {
      id: page,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      bg: meta.bg,
      iconColor: meta.iconColor,
      onClick: () => {
        if (page === 'settings') {
          openSettings?.();
          return;
        }
        onNavigate(page);
      },
    };
  });

  return <HomeDashboard menuItems={menuItems} />;
}
