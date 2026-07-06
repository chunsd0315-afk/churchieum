import { useAuth } from '../../contexts/AuthContext';
import { canManageSermons, isSuperAdmin } from '../../services/permissions';
import SermonApp from '../../components/common/sermon/SermonApp';

export default function SermonManagementPage() {
  const { user } = useAuth();
  return (
    <SermonApp
      canManage={canManageSermons(user)}
      canManageFolders={isSuperAdmin(user)}
    />
  );
}
