import { useAuth } from '../../contexts/AuthContext';
import { canManageSermons, canManageSermonFolders } from '../../services/permissions';
import SermonApp from '../../components/common/sermon/SermonApp';

export default function SermonManagementPage() {
  const { user } = useAuth();
  return (
    <SermonApp
      canManage={canManageSermons(user)}
      canManageFolders={canManageSermonFolders(user)}
    />
  );
}
