import type { ReactNode } from 'react';

/** Role-based app mode */
export type AppMode = 'admin' | 'pastor' | 'member';

/** A navigation menu item for the sidebar / bottom nav */
export type LayoutMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;
  onClick?: () => void;
  roles?: AppMode[];
};

/** User info passed into layout components */
export type LayoutUser = {
  name: string;
  position?: string;
  email?: string;
};
