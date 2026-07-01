import type { ReactNode } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { AppMode, LayoutMenuItem, LayoutUser } from './LayoutTypes';
import { DesktopHeader } from './DesktopHeader';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileHeader } from './MobileHeader';

export type AppShellProps = {
  currentUser: LayoutUser | null;
  mode: AppMode;
  menuItems: LayoutMenuItem[];
  activeMenu: string;
  onMenuClick: (id: string) => void;
  children: ReactNode;
  churchName?: string;
  orgLabel?: string;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
};

/**
 * AppShell — top-level layout frame for all three modes.
 *
 * ≥768px  (PC)   : DesktopHeader (sticky) + DesktopSidebar (left) + content (right)
 * <768px  (Mobile): MobileHeader (sticky) + scrollable content
 *
 * Does NOT include bottom nav or page-level padding — wrap children with
 * PageContainer / ContentContainer as needed.
 */
export function AppShell({
  currentUser,
  mode,
  menuItems,
  activeMenu,
  onMenuClick,
  children,
  churchName,
  orgLabel,
  onSettingsClick,
  onNotificationClick,
  onProfileClick,
}: AppShellProps) {
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Fixed top header */}
        <DesktopHeader
          user={currentUser}
          mode={mode}
          churchName={churchName}
          orgLabel={orgLabel}
          onSettingsClick={onSettingsClick}
          onNotificationClick={onNotificationClick}
          onProfileClick={onProfileClick}
        />

        {/* Sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          <DesktopSidebar
            user={currentUser}
            menuItems={menuItems}
            activeMenu={activeMenu}
            onMenuClick={onMenuClick}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader
        user={currentUser}
        mode={mode}
        onSettingsClick={onSettingsClick}
        onNotificationClick={onNotificationClick}
        onProfileClick={onProfileClick}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
