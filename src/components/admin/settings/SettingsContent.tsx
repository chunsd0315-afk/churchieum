/** 설정 중앙 콘텐츠 — 사이드바·상단 헤더는 그대로 두고 이 영역만 바뀐다 */
import { ChevronRight } from 'lucide-react';
import OrganizationManagementPage from '../../../pages/admin/OrganizationManagementPage';
import ClergyManagementPage from '../../../pages/admin/ClergyManagementPage';
import MemberManagementPage from '../../../pages/admin/MemberManagementPage';
import InvitationPage from '../../../pages/admin/InvitationPage';
import ChurchManagementPage from '../../../pages/admin/ChurchManagementPage';
import { SuperAdminManagementPanel } from './SuperAdminManagementPanel';
import { AppMenuSettingsPanel } from './AppMenuSettingsPanel';
import { AppFeatureSettingsPanel } from './AppFeatureSettingsPanel';
import { AppHomeSettingsPanel } from './AppHomeSettingsPanel';
import { AppNotificationSettingsPanel } from './AppNotificationSettingsPanel';
import { DS } from '../../common/design-system/tokens';
import {
  SETTINGS_GROUP_LABELS,
  type SettingsItem,
  type SettingsSubPage,
} from './settingsMenu';
import type { AdminPage } from '../Layout';

type Props = {
  subPage: SettingsSubPage;
  items: SettingsItem[];
  onSubNavigate: (page: SettingsSubPage) => void;
  /** PC에서 현재 위치를 알려주는 경로 표시 */
  showBreadcrumb?: boolean;
};

function SubPageBody({
  subPage,
  onSubNavigate,
}: {
  subPage: SettingsSubPage;
  onSubNavigate: (page: SettingsSubPage) => void;
}) {
  /** 관리 페이지끼리 서로 이동 (예: 조직관리 → 성도관리) */
  const bridgeNavigate = (page: string) => {
    if (page === 'members' || page === 'clergy' || page === 'org' || page === 'invitations') {
      onSubNavigate(page as SettingsSubPage);
    }
  };

  switch (subPage) {
    case 'superAdmins':
      return <SuperAdminManagementPanel />;
    case 'org':
      return (
        <div className="p-3 md:p-4 min-w-0 overflow-x-hidden">
          <OrganizationManagementPage onNavigate={bridgeNavigate as (p: AdminPage) => void} />
        </div>
      );
    case 'clergy':
      return (
        <div className="p-3 md:p-4">
          <ClergyManagementPage onNavigate={bridgeNavigate} />
        </div>
      );
    case 'members':
      return (
        <div className="p-3 md:p-4">
          <MemberManagementPage onNavigate={bridgeNavigate} />
        </div>
      );
    case 'invitations':
      return (
        <div className="p-3 md:p-4">
          <InvitationPage onNavigate={bridgeNavigate} />
        </div>
      );
    case 'church':
      return (
        <div className="p-3 md:p-4">
          <ChurchManagementPage />
        </div>
      );
    case 'appMenus':
      return <AppMenuSettingsPanel />;
    case 'appFeatures':
      return <AppFeatureSettingsPanel />;
    case 'appHome':
      return <AppHomeSettingsPanel />;
    case 'appNotifications':
      return <AppNotificationSettingsPanel />;
  }
}

export function SettingsContent({ subPage, items, onSubNavigate, showBreadcrumb = false }: Props) {
  const current = items.find(i => i.id === subPage);
  /** 조직관리는 트리+상세를 나란히 두므로 남은 폭을 모두 사용한다 */
  const fullWidth = subPage === 'org';

  return (
    <div className="min-w-0 w-full">
      {showBreadcrumb && current && (
        <div
          className="sticky top-0 z-10 flex items-center gap-1.5 px-4 md:px-6"
          style={{
            height: 44,
            background: DS.colors.bgSurface,
            borderBottom: `1px solid ${DS.colors.borderSubtle}`,
          }}
        >
          <span className="text-xs" style={{ color: DS.colors.textMuted }}>교회이음 설정</span>
          <ChevronRight className="w-3 h-3" style={{ color: DS.colors.textMuted }} />
          <span className="text-xs" style={{ color: DS.colors.textMuted }}>
            {SETTINGS_GROUP_LABELS[current.group]}
          </span>
          <ChevronRight className="w-3 h-3" style={{ color: DS.colors.textMuted }} />
          <span className="text-xs font-bold truncate" style={{ color: DS.colors.textPrimary }}>
            {current.title}
          </span>
        </div>
      )}

      <div className={`mx-auto w-full min-w-0 ${fullWidth ? 'max-w-none' : 'max-w-[1360px]'}`}>
        <SubPageBody subPage={subPage} onSubNavigate={onSubNavigate} />
      </div>
    </div>
  );
}
