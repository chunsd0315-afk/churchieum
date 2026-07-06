import type { PastorPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import type { HomeMenuItem } from '../common/home/HomeDashboard';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';
import { useHomeLayoutActions } from '../common/home/HomeLayoutContext';

type Props = { onNavigate: (page: PastorPage) => void };

type PastorMenuEntry = {
  catalogKey: keyof typeof HOME_MENU_CATALOG;
  page: PastorPage | 'settings';
};

const PASTOR_HOME_MENUS: PastorMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermons' },
  { catalogKey: 'grace', page: 'grace-notes' },
  { catalogKey: 'announcement', page: 'announcements' },
  { catalogKey: 'bulletin', page: 'bulletin' },
  { catalogKey: 'schedule', page: 'events' },
  { catalogKey: 'prayer', page: 'prayers' },
  { catalogKey: 'album', page: 'album' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-reading-center' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
  { catalogKey: 'settings', page: 'settings' },
];

export default function PastorHome({ onNavigate }: Props) {
  const { openSettings } = useHomeLayoutActions();

  const menuItems: HomeMenuItem[] = PASTOR_HOME_MENUS.map(({ catalogKey, page }) => {
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
