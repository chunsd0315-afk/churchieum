import React from 'react';
import type { NavIcon } from '../../types/icons';
import PCTopHeader from './PCTopHeader';
import PCSidebar from './PCSidebar';
import MobileBottomNav, { type BottomNavItem } from './MobileBottomNav';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/* ──────────────────────────────────────────────
   AppLayout — unified structural shell
   Used by AdminLayout and MemberLayout.
   All page-specific logic (menu items, titles,
   page-type routing) stays in each layout file.
   ────────────────────────────────────────────── */

export interface AppLayoutNavItem<P extends string> {
  page: P;
  label: string;
  icon: NavIcon;
  iconColor?: string;
  badge?: number | boolean;
}

export interface AppLayoutConfig<P extends string> {
  /** Current active page id */
  currentPage: P;
  /** Navigate to page */
  onNavigate: (page: P) => void;

  /* ── Mobile header ── */
  /** Whether current page is the "home" page (changes header appearance) */
  isHomePage: boolean;
  mobileHomeHeader: React.ReactNode;
  mobileSubHeader: React.ReactNode;

  /* ── PC sidebar ── */
  sidebarNavItems: AppLayoutNavItem<P>[];
  userPosition?: string;
  sidebarModeSwitcher?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  showSettingsButton?: boolean;
  onSettingsClick?: () => void;

  /* ── PC right panel ── */
  rightPanel?: React.ReactNode;

  /* ── Mobile bottom navigation ── */
  /** Items shown in the mobile bottom nav; usually 4–5 primary pages */
  bottomNavItems?: BottomNavItem[];

  children: React.ReactNode;
}

/* ── Common ContentContainer ──────────────────
   교회이음 통일 디자인 시스템:
   max-width: 900px · width: 100% · margin: 0 auto
   좌우 여백 24px · 상단 24px · 하단 40px
   This is the canonical content well for every page.
   ────────────────────────────────────────────── */
export function PageContentWell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`w-full mx-auto ${className}`}
      style={{ maxWidth: '900px', padding: '24px 24px 40px' }}
    >
      {children}
    </div>
  );
}

/* ── Desktop AppLayout ───────────────────────── */
function DesktopAppLayout<P extends string>({
  currentPage,
  onNavigate,
  sidebarNavItems,
  userPosition,
  sidebarModeSwitcher,
  sidebarFooter,
  showSettingsButton,
  onSettingsClick,
  rightPanel,
  children,
}: AppLayoutConfig<P>) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-bg-page)' }}>
      <PCTopHeader
        showSettings={showSettingsButton}
        onSettingsClick={onSettingsClick}
      />

      <div className="flex flex-1 min-h-0">
        <PCSidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          navItems={sidebarNavItems}
          userPosition={userPosition}
          modeSwitcher={sidebarModeSwitcher}
          footerContent={sidebarFooter}
        />

        <main
          className="flex-1 overflow-y-auto min-w-0"
          style={{ background: 'var(--color-bg-page)' }}
        >
          <PageContentWell>
            {children}
          </PageContentWell>
        </main>

        {rightPanel && (
          <aside
            className="shrink-0 overflow-y-auto scrollbar-hide"
            style={{ width: '280px', background: 'var(--color-bg-page)', borderLeft: '1px solid var(--color-border-default)' }}
          >
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}

/* ── Mobile AppLayout ────────────────────────── */
function MobileAppLayout<P extends string>({
  isHomePage,
  mobileHomeHeader,
  mobileSubHeader,
  bottomNavItems,
  currentPage,
  onNavigate,
  children,
}: AppLayoutConfig<P>) {
  const hasBottomNav = bottomNavItems && bottomNavItems.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-page)' }}>
      {/* Header — switches between home header and sub-page header */}
      {isHomePage ? mobileHomeHeader : mobileSubHeader}

      {/* Page content */}
      <main
        className="flex-1"
        style={{ paddingBottom: hasBottomNav ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : undefined }}
      >
        {isHomePage ? (
          /* Home pages use their own full-bleed layout */
          <div className="px-4 pt-4 pb-5">{children}</div>
        ) : (
          /* Sub-pages: 통일 900px 콘텐츠 웰 (좌우 24 · 상단 24 · 하단 40) */
          <div className="w-full mx-auto" style={{ maxWidth: '900px', padding: '24px 24px 40px' }}>
            {children}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      {hasBottomNav && (
        <MobileBottomNav
          items={bottomNavItems!}
          activeId={currentPage}
          onNavigate={id => onNavigate(id as P)}
        />
      )}
    </div>
  );
}

/* ── AppLayout entry point ───────────────────── */
export function AppLayout<P extends string>(config: AppLayoutConfig<P>) {
  const { isDesktop } = useBreakpoint();
  return isDesktop
    ? <DesktopAppLayout {...config} />
    : <MobileAppLayout  {...config} />;
}
