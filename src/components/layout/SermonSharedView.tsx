import React from 'react';
import type { Sermon } from '../../types/sermon';
import SermonApp from '../common/sermon/SermonApp';

export type SermonSharedViewProps = {
  isAdmin: boolean;
  canManageFolders?: boolean;
  renderActions?: (sermon: Sermon) => React.ReactNode;
};

/** @deprecated Use SermonApp directly — kept for existing imports */
export default function SermonSharedView({
  isAdmin,
  canManageFolders = isAdmin,
  renderActions,
}: SermonSharedViewProps) {
  return (
    <SermonApp
      canManage={isAdmin}
      canManageFolders={canManageFolders}
      renderExtraActions={renderActions}
    />
  );
}
