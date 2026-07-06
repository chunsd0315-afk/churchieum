import { useAuth } from '../../contexts/AuthContext';
import { canManageSermons, isSuperAdmin } from '../../lib/permissions';
import SermonApp from '../sermon/SermonApp';

export default function SermonManagementPage() {
  const { user } = useAuth();
  return (
    <SermonApp
      canManage={canManageSermons(user)}
      canManageFolders={isSuperAdmin(user)}
    />
  );
}
