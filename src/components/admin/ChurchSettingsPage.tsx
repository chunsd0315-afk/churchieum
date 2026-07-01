import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Network, UserCog, Users, Link, Church, ShieldCheck, Settings } from 'lucide-react';
import OrganizationManagementPage from './OrganizationManagementPage';
import ClergyManagementPage from './ClergyManagementPage';
import MemberManagementPage from './MemberManagementPage';
import InvitationPage from './InvitationPage';
import ChurchManagementPage from './ChurchManagementPage';
import StaffManagementPage from './StaffManagementPage';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { AdminPage } from './Layout';

type SubPage = 'staff' | 'org' | 'clergy' | 'members' | 'invitations' | 'church';

type Props = {
  onClose: () => void;
};

const SETTINGS_ITEMS: {
  id: SubPage;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  group: 'main' | 'info';
}[] = [
  {
    id: 'staff',
    icon: ShieldCheck,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    title: '관리자 관리',
    description: '관리자 권한 및 직원을 설정합니다',
    group: 'main',
  },
  {
    id: 'org',
    icon: Network,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    title: '조직 관리',
    description: '구역, 지역, 부서 등 교회 조직을 설정합니다',
    group: 'main',
  },
  {
    id: 'clergy',
    icon: UserCog,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-500',
    title: '교역자 관리',
    description: '담임목사, 부목사, 전도사 등 교역자를 관리합니다',
    group: 'main',
  },
  {
    id: 'members',
    icon: Users,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
    title: '성도 관리',
    description: '성도 명단 조회, 수정, 구역 배정을 합니다',
    group: 'main',
  },
  {
    id: 'invitations',
    icon: Link,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500',
    title: '초대 관리',
    description: '성도 및 교역자 초대 링크를 발송하고 관리합니다',
    group: 'main',
  },
  {
    id: 'church',
    icon: Church,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    title: '교회 기본정보 설정',
    description: '교회 이름, 주소, 예배 시간 등을 수정합니다',
    group: 'info',
  },
];

function SubPageContent({ subPage, onSubNavigate }: { subPage: SubPage; onSubNavigate: (p: SubPage) => void }) {
  const handleOrgNavigate = (page: AdminPage) => {
    if (page === 'clergy') { onSubNavigate('clergy'); return; }
    if (page === 'members') { onSubNavigate('members'); return; }
  };

  switch (subPage) {
    case 'staff':       return <StaffManagementPage onNavigate={() => {}} />;
    case 'org':         return <OrganizationManagementPage onNavigate={handleOrgNavigate} />;
    case 'clergy':      return <ClergyManagementPage onNavigate={() => {}} />;
    case 'members':     return <MemberManagementPage onNavigate={() => {}} />;
    case 'invitations': return <InvitationPage onNavigate={() => {}} />;
    case 'church':      return <ChurchManagementPage />;
  }
}

/* ─────────────────────────────────────────────
   MOBILE: 전체 화면 — 기존 동작 유지
───────────────────────────────────────────── */
function MobileChurchSettings({ onClose }: Props) {
  const [subPage, setSubPage] = useState<SubPage | null>(null);
  const subTitle = SETTINGS_ITEMS.find(s => s.id === subPage)?.title ?? '';

  if (subPage !== null) {
    return (
      <div className="fixed inset-0 z-[300] bg-gray-50 flex flex-col">
        <header className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-4 border-b border-gray-100 shadow-sm">
          <button
            onClick={() => setSubPage(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-gray-900">{subTitle}</h2>
          <div className="w-9" />
        </header>
        <div className="flex-1 overflow-y-auto">
          <SubPageContent subPage={subPage} onSubNavigate={setSubPage} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-gray-50 flex flex-col">
      <header className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-4 border-b border-gray-100 shadow-sm">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-gray-900">교회설정</h2>
        <div className="w-9" />
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-8">
          {SETTINGS_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setSubPage(item.id)}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.97] transition-all text-left"
            >
              <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PC: 좌측 메뉴 + 우측 상세 화면
───────────────────────────────────────────── */
function DesktopChurchSettings({ onClose }: Props) {
  const [subPage, setSubPage] = useState<SubPage>('staff');

  const mainItems = SETTINGS_ITEMS.filter(s => s.group === 'main');
  const infoItems = SETTINGS_ITEMS.filter(s => s.group === 'info');
  const current = SETTINGS_ITEMS.find(s => s.id === subPage)!;

  return (
    <div className="fixed inset-0 z-[300] bg-gray-100 flex flex-col">
      {/* Top header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h1 className="text-[15px] font-bold text-gray-800">교회 설정</h1>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar menu */}
        <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 pt-4">
            {/* Main group */}
            <div className="mb-1">
              {mainItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSubPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all duration-100 ${
                    subPage === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    subPage === item.id ? item.iconBg : 'bg-gray-100'
                  }`}>
                    <item.icon className={`w-3.5 h-3.5 ${subPage === item.id ? item.iconColor : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[13px] font-medium ${subPage === item.id ? 'font-semibold' : ''}`}>
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-gray-100" />

            {/* Info group */}
            <div>
              {infoItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSubPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all duration-100 ${
                    subPage === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    subPage === item.id ? item.iconBg : 'bg-gray-100'
                  }`}>
                    <item.icon className={`w-3.5 h-3.5 ${subPage === item.id ? item.iconColor : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[13px] font-medium ${subPage === item.id ? 'font-semibold' : ''}`}>
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right content area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-gray-50">
          {/* Content header breadcrumb */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 h-12 flex items-center gap-2">
            <span className="text-xs text-gray-400">교회 설정</span>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-xs font-semibold text-gray-700">{current.title}</span>
          </div>
          <SubPageContent subPage={subPage} onSubNavigate={setSubPage} />
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Export — 반응형 분기
───────────────────────────────────────────── */
export default function ChurchSettingsPage({ onClose }: Props) {
  const { isMobile } = useBreakpoint();
  return isMobile
    ? <MobileChurchSettings onClose={onClose} />
    : <DesktopChurchSettings onClose={onClose} />;
}
