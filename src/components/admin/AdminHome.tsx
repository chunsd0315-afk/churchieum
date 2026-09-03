import type { AdminPage } from './Layout';
import HomeDashboard from '../common/home/HomeDashboard';
import { ADMIN_ROLE_MENUS, buildHomeMenuItems } from '../common/home/roleMenus';
import { useHomeLayoutActions } from '../common/home/HomeLayoutContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { useEffect, useMemo, useState } from 'react';
import { CHURCH_APP_SETTINGS_EVENT } from '../../services/churchAppSettingsStorage';

type Props = { onNavigate: (page: AdminPage) => void };

export default function AdminHome({ onNavigate }: Props) {
  const { openSettings } = useHomeLayoutActions();
  const { settings } = useOrgSettings();
  const [menuTick, setMenuTick] = useState(0);

  useEffect(() => {
    const sync = () => setMenuTick(t => t + 1);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  const menuItems = useMemo(
    () => buildHomeMenuItems(
      ADMIN_ROLE_MENUS,
      page => onNavigate(page as AdminPage),
      { onSettings: openSettings, settings },
    ),
    [onNavigate, openSettings, settings, menuTick],
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
