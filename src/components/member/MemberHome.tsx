import type { Page } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import type { HomeMenuItem } from '../common/home/HomeDashboard';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';

type Props = { onNavigate: (page: Page) => void };

type MemberMenuEntry = {
  catalogKey: keyof typeof HOME_MENU_CATALOG;
  page: Page;
};

const MEMBER_HOME_MENUS: MemberMenuEntry[] = [
  { catalogKey: 'sermon', page: 'sermon' },
  { catalogKey: 'grace', page: 'grace-notes' },
  { catalogKey: 'announcement', page: 'announcement' },
  { catalogKey: 'bulletin', page: 'bulletin' },
  { catalogKey: 'schedule', page: 'schedule' },
  { catalogKey: 'prayer', page: 'prayer' },
  { catalogKey: 'album', page: 'album' },
  { catalogKey: 'bible', page: 'bible' },
  { catalogKey: 'biblePlan', page: 'bible-reading-center' },
  { catalogKey: 'sharing', page: 'sharing' },
  { catalogKey: 'profile', page: 'profile' },
  { catalogKey: 'churchInfo', page: 'church-info' },
];

export default function MemberHome({ onNavigate }: Props) {
  const menuItems: HomeMenuItem[] = MEMBER_HOME_MENUS.map(({ catalogKey, page }) => {
    const meta = HOME_MENU_CATALOG[catalogKey];
    return {
      id: page,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      bg: meta.bg,
      iconColor: meta.iconColor,
      onClick: () => onNavigate(page),
    };
  });

  return <HomeDashboard menuItems={menuItems} />;
}
