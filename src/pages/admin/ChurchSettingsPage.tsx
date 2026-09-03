import { useMemo, useState } from 'react';
import {
  X,
  ChevronRight,
  Network,
  UserCog,
  Users,
  Link,
  Church,
  ShieldCheck,
  Settings,
  LayoutGrid,
  ToggleLeft,
  Home,
  Bell,
  ChevronDown,
} from 'lucide-react';
import OrganizationManagementPage from './OrganizationManagementPage';
import ClergyManagementPage from './ClergyManagementPage';
import MemberManagementPage from './MemberManagementPage';
import InvitationPage from './InvitationPage';
import ChurchManagementPage from './ChurchManagementPage';
import { SuperAdminManagementPanel } from '../../components/admin/settings/SuperAdminManagementPanel';
import { AppMenuSettingsPanel } from '../../components/admin/settings/AppMenuSettingsPanel';
import { AppFeatureSettingsPanel } from '../../components/admin/settings/AppFeatureSettingsPanel';
import { AppHomeSettingsPanel } from '../../components/admin/settings/AppHomeSettingsPanel';
import { AppNotificationSettingsPanel } from '../../components/admin/settings/AppNotificationSettingsPanel';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { BackButton } from '../../components/common/ui/BackButton';
import type { NavIcon } from '../../types/icons';
import type { AdminPage } from '../../components/admin/Layout';

export type SettingsSubPage =
  | 'superAdmins'
  | 'clergy'
  | 'members'
  | 'invitations'
  | 'church'
  | 'org'
  | 'appMenus'
  | 'appFeatures'
  | 'appHome'
  | 'appNotifications';

type Props = {
  onClose: () => void;
};

type SettingsItem = {
  id: SettingsSubPage;
  icon: NavIcon;
  title: string;
  description: string;
  group: 'members' | 'church' | 'app';
};

const GROUP_LABELS: Record<SettingsItem['group'], string> = {
  members: '구성원 관리',
  church: '교회 관리',
  app: '앱 설정',
};

function useSettingsItems(): SettingsItem[] {
  const { pastorPhrases, terminologyVersion } = useOrgSettings();
  return useMemo(
    () => [
      {
        id: 'superAdmins',
        icon: ShieldCheck,
        title: '최고관리자 관리',
        description: '교회 전체를 관리할 최고관리자를 설정합니다',
        group: 'members',
      },
      {
        id: 'clergy',
        icon: UserCog,
        title: pastorPhrases.management,
        description: `담임목사, 부목사, 전도사 등 ${pastorPhrases.label}를 관리합니다`,
        group: 'members',
      },
      {
        id: 'members',
        icon: Users,
        title: '성도 관리',
        description: '성도 명단 조회, 수정, 조직·직분 배정을 합니다',
        group: 'members',
      },
      {
        id: 'invitations',
        icon: Link,
        title: '초대관리',
        description: pastorPhrases.inviteDescription,
        group: 'members',
      },
      {
        id: 'church',
        icon: Church,
        title: '교회 기본정보 설정',
        description: '교회 이름, 로고, 주소, 표어 등을 수정합니다',
        group: 'church',
      },
      {
        id: 'org',
        icon: Network,
        title: '조직관리',
        description: '교구·구역·부서 등 교회 조직을 관리합니다',
        group: 'church',
      },
      {
        id: 'appMenus',
        icon: LayoutGrid,
        title: '메뉴 관리',
        description: '홈·사이드바에 표시할 메뉴와 순서를 설정합니다',
        group: 'app',
      },
      {
        id: 'appFeatures',
        icon: ToggleLeft,
        title: '기능 설정',
        description: '댓글, 공감, 공유 등 부가기능을 설정합니다',
        group: 'app',
      },
      {
        id: 'appHome',
        icon: Home,
        title: '홈 화면 설정',
        description: '홈에 표시할 요약 영역을 설정합니다',
        group: 'app',
      },
      {
        id: 'appNotifications',
        icon: Bell,
        title: '알림 설정',
        description: '교회 공통 기본 알림 정책을 설정합니다',
        group: 'app',
      },
    ],
    [pastorPhrases, terminologyVersion],
  );
}

function SubPageContent({
  subPage,
  onSubNavigate,
}: {
  subPage: SettingsSubPage;
  onSubNavigate: (p: SettingsSubPage) => void;
}) {
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
        <div className="p-3 md:p-4">
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

function SettingsNavButton({
  item,
  active,
  onClick,
}: {
  item: SettingsItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] mb-0.5 text-left transition-colors min-h-[44px] touch-target ${
        active
          ? 'bg-[#FFF7D6] text-[#1A1A1A] border border-primary-200'
          : 'text-gray-600 hover:bg-gray-50 border border-transparent'
      }`}
    >
      <item.icon
        className={`w-4 h-4 shrink-0 ${active ? 'text-primary-700' : 'text-gray-400'}`}
      />
      <span className={`text-[13px] truncate ${active ? 'font-bold' : 'font-medium'}`}>
        {item.title}
      </span>
    </button>
  );
}

function DesktopSidebar({
  items,
  subPage,
  setSubPage,
}: {
  items: SettingsItem[];
  subPage: SettingsSubPage;
  setSubPage: (p: SettingsSubPage) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<SettingsItem['group'], boolean>>({
    members: true,
    church: true,
    app: true,
  });

  const groups: SettingsItem['group'][] = ['members', 'church', 'app'];

  return (
    <aside className="w-[260px] bg-white border-r border-[#ECECEC] flex flex-col shrink-0 overflow-y-auto">
      <div className="px-4 pt-5 pb-3 flex items-center gap-2 border-b border-[#ECECEC]">
        <div className="w-8 h-8 rounded-xl bg-[#FFF7D6] flex items-center justify-center">
          <Settings className="w-4 h-4 text-primary-700" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-[#1A1A1A]">교회이음 설정</p>
          <p className="text-[11px] text-gray-400">통합 관리센터</p>
        </div>
      </div>
      <div className="p-3 flex-1">
        {groups.map(group => {
          const groupItems = items.filter(i => i.group === group);
          const open = openGroups[group];
          return (
            <div key={group} className="mb-3">
              <button
                type="button"
                onClick={() => setOpenGroups(g => ({ ...g, [group]: !g[group] }))}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide"
              >
                <span>{GROUP_LABELS[group]}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`}
                />
              </button>
              {open &&
                groupItems.map(item => (
                  <SettingsNavButton
                    key={item.id}
                    item={item}
                    active={subPage === item.id}
                    onClick={() => setSubPage(item.id)}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function MobileChurchSettings({ onClose }: Props) {
  const [subPage, setSubPage] = useState<SettingsSubPage | null>(null);
  const items = useSettingsItems();
  const subTitle = items.find(s => s.id === subPage)?.title ?? '';
  const groups: SettingsItem['group'][] = ['members', 'church', 'app'];

  if (subPage !== null) {
    return (
      <div className="fixed inset-0 z-[300] bg-[#FFFDF7] flex flex-col">
        <header className="sticky top-0 bg-white z-10 flex items-center gap-2 px-3 py-2 border-b border-[#ECECEC] shadow-sm min-h-[56px]">
          <BackButton onClick={() => setSubPage(null)} />
          <h2 className="text-base font-bold text-[#1A1A1A] truncate flex-1">{subTitle}</h2>
        </header>
        <div className="flex-1 overflow-y-auto">
          <SubPageContent subPage={subPage} onSubNavigate={setSubPage} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-[#FFFDF7] flex flex-col">
      <header className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b border-[#ECECEC] shadow-sm min-h-[56px]">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 touch-target"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-[#1A1A1A]">교회이음 설정</h2>
        <div className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-10">
        {groups.map(group => (
          <div key={group} className="mb-6">
            <p className="text-xs font-bold text-gray-400 mb-2 px-1">{GROUP_LABELS[group]}</p>
            <div className="bg-white border border-[#ECECEC] rounded-[20px] overflow-hidden divide-y divide-[#ECECEC]">
              {items
                .filter(i => i.group === group)
                .map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubPage(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FFF7D6]/60 min-h-[56px] touch-target"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF7D6] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1A1A1A]">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopChurchSettings({ onClose }: Props) {
  const [subPage, setSubPage] = useState<SettingsSubPage>('superAdmins');
  const items = useSettingsItems();
  const current = items.find(s => s.id === subPage)!;
  const groupLabel = GROUP_LABELS[current.group];

  return (
    <div className="fixed inset-0 z-[300] bg-[#F5F5F5] flex flex-col">
      <header className="h-14 bg-white border-b border-[#ECECEC] flex items-center px-5 gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 touch-target"
          aria-label="설정 닫기"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Settings className="w-4 h-4 text-primary-600 shrink-0" />
          <h1 className="text-[15px] font-bold text-[#1A1A1A] truncate">교회이음 설정</h1>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <DesktopSidebar items={items} subPage={subPage} setSubPage={setSubPage} />
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#FFFDF7]">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#ECECEC] px-6 h-11 flex items-center gap-2">
            <span className="text-xs text-gray-400">교회이음 설정</span>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-xs text-gray-400">{groupLabel}</span>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-xs font-bold text-[#1A1A1A]">{current.title}</span>
          </div>
          <div className="mx-auto w-full max-w-[1360px]">
            <SubPageContent subPage={subPage} onSubNavigate={setSubPage} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ChurchSettingsPage({ onClose }: Props) {
  const { isMobile } = useBreakpoint();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] p-6 max-w-sm w-full text-center shadow-xl">
          <p className="font-bold text-[#1A1A1A] mb-2">최고관리자 전용</p>
          <p className="text-sm text-gray-500 mb-5">
            교회이음 통합 설정은 최고관리자만 이용할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-[18px] bg-primary-500 text-[#1A1A1A] font-bold"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return isMobile
    ? <MobileChurchSettings onClose={onClose} />
    : <DesktopChurchSettings onClose={onClose} />;
}
