import { useState, useEffect, Component, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { OrgSettingsProvider } from '../contexts/OrgSettingsContext';
import { ToastProvider } from '../components/common/ui';
import LoginPage from './LoginPage';
import ModeSelectPage from './ModeSelectPage';
import { MemberLayout, type Page } from '../components/member/Layout';
import MemberHome from '../components/member/MemberHome';
import SermonPage from '../pages/member/SermonPage';
import GraceNotesPage from '../pages/member/GraceNotesPage';
import AnnouncementPage from '../pages/member/AnnouncementPage';
import AlbumPage from '../pages/member/AlbumPage';
import ProfilePage from '../pages/member/ProfilePage';
import DepartmentsPage from '../pages/member/DepartmentsPage';
import BiblePage from '../pages/member/BiblePage';
import BulletinPage from '../pages/member/BulletinPage';
import SchedulePage from '../pages/member/SchedulePage';
import ChurchInfoPage from '../pages/member/ChurchInfoPage';
import BibleReadingCenterPage from '../pages/member/BibleReadingCenterPage';
import { PastorLayout, type PastorPage } from '../components/pastor/Layout';
import PastorHome from '../components/pastor/PastorHome';
import { AdminLayout, type AdminPage } from '../components/admin/Layout';
import AdminHome from '../components/admin/AdminHome';
import AdminContentsPage from '../pages/admin/AdminContentsPage';
import MemberManagementPage from '../pages/admin/MemberManagementPage';
import DepartmentManagementPage from '../pages/admin/DepartmentManagementPage';
import SermonManagementPage from '../pages/admin/SermonManagementPage';
import AnnouncementManagementPage from '../pages/admin/AnnouncementManagementPage';
import VisitManagementPage from '../pages/admin/VisitManagementPage';
import StatisticsPage from '../pages/admin/StatisticsPage';
import ChurchVerificationPage from '../pages/admin/ChurchVerificationPage';
import BulletinManagementPage from '../pages/admin/BulletinManagementPage';
import EventManagementPage from '../pages/admin/EventManagementPage';
import BiblePlanManagementPage from '../pages/admin/BiblePlanManagementPage';
import ChurchManagementPage from '../pages/admin/ChurchManagementPage';
import InvitationPage from '../pages/admin/InvitationPage';
import AlbumManagementPage from '../pages/admin/AlbumManagementPage';
import DistrictManagementPage from '../pages/admin/DistrictManagementPage';
import ZoneManagementPage from '../pages/admin/ZoneManagementPage';
import ClergyManagementPage from '../pages/admin/ClergyManagementPage';
import OrganizationManagementPage from '../pages/admin/OrganizationManagementPage';
import InviteSignupPage from '../pages/member/InviteSignupPage';
import ChurchSharingPage from '../pages/shared/ChurchSharingPage';
import type { BibleRef } from '../utils/bibleParser';
import { runTestDataSeed, formatTestDataSeedReport } from '../services/testDataSeed';

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="font-semibold text-gray-800">페이지를 불러오지 못했습니다</p>
          <p className="text-sm text-gray-500">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-1 px-5 py-2 bg-primary-500 text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SafePage({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [mode, setMode] = useState<'select' | 'member' | 'pastor' | 'admin'>('select');
  const [memberPage, setMemberPage] = useState<Page>('home');
  const [pastorPage, setPastorPage] = useState<PastorPage>('home');
  const [adminPage, setAdminPage] = useState<AdminPage>('home');
  const [bibleInitialRef, setBibleInitialRef] = useState<BibleRef | null>(null);

  // Check for invite link in URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code') || urlParams.get('invite') ||
    (window.location.pathname.startsWith('/invite/') ? window.location.pathname.split('/invite/')[1] : null);

  // Auto-seed test data (?autoSeed=1 or npm run seed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoSeed') !== '1') return;
    if (!import.meta.env.DEV) return;
    try {
      const report = runTestDataSeed();
      console.info('[Churchieum seed]\n' + formatTestDataSeedReport(report));
      params.delete('autoSeed');
      const qs = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    } catch (err) {
      console.error('[Churchieum seed] failed', err);
    }
  }, []);

  // Reset mode when user logs out
  useEffect(() => {
    if (!user) {
      setMode('select');
      setMemberPage('home');
      setPastorPage('home');
      setAdminPage('home');
    }
  }, [user]);

  // Auto-select mode based on role after login
  useEffect(() => {
    if (user && mode === 'select') {
      if (user.role === 'super_admin') {
        setMode('admin');
      } else if (user.role === 'pastor') {
        setMode('pastor');
      } else {
        setMode('member');
      }
    }
  }, [user, mode]);

  // Show invite signup page if invite code present and not logged in
  if (!loading && !user && inviteCode) {
    return (
      <InviteSignupPage
        inviteCode={inviteCode}
        onComplete={() => { window.history.replaceState({}, '', '/'); window.location.reload(); }}
        onBack={() => window.history.replaceState({}, '', '/')}
      />
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage onSuccess={() => {}} />;
  }

  if (mode === 'select') {
    return <ModeSelectPage onSelectMode={setMode} userRole={user.role} />;
  }

  if (mode === 'member') {
    return (
      <MemberLayout
        currentPage={memberPage}
        onNavigate={setMemberPage}
        onSwitchMode={() => setMode(isAdmin ? 'admin' : 'select')}
        isAdmin={isAdmin}
      >
        {memberPage === 'home' && <SafePage><MemberHome onNavigate={setMemberPage} /></SafePage>}
        {memberPage === 'sermon' && <SafePage><SermonPage /></SafePage>}
        {memberPage === 'grace-notes' && <SafePage><GraceNotesPage /></SafePage>}
        {memberPage === 'announcement' && <SafePage><AnnouncementPage /></SafePage>}
        {memberPage === 'album' && <SafePage><AlbumPage /></SafePage>}
        {memberPage === 'departments' && <SafePage><DepartmentsPage /></SafePage>}
        {memberPage === 'profile' && <SafePage><ProfilePage /></SafePage>}
        {memberPage === 'bible' && (
          <SafePage>
            <BiblePage
              onNavigate={(p) => { setBibleInitialRef(null); setMemberPage(p); }}
              initialRef={bibleInitialRef}
            />
          </SafePage>
        )}
        {memberPage === 'bible-reading-center' && (
          <SafePage>
            <BibleReadingCenterPage
              onNavigate={setMemberPage}
              onGoToBible={(book, chapter) => { setBibleInitialRef({ book, chapter }); setMemberPage('bible'); }}
            />
          </SafePage>
        )}
        {memberPage === 'bulletin' && <SafePage><BulletinPage /></SafePage>}
        {memberPage === 'schedule' && <SafePage><SchedulePage /></SafePage>}
        {memberPage === 'church-info' && <SafePage><ChurchInfoPage /></SafePage>}
        {memberPage === 'sharing' && <SafePage><ChurchSharingPage /></SafePage>}
      </MemberLayout>
    );
  }

  if (mode === 'pastor') {
    return (
      <PastorLayout
        currentPage={pastorPage}
        onNavigate={setPastorPage}
      >
        {pastorPage === 'home' && <SafePage><PastorHome onNavigate={setPastorPage} /></SafePage>}
        {pastorPage === 'members' && (
          <SafePage>
            <MemberManagementPage
              initialFilter={(() => {
                const f = sessionStorage.getItem('org_filter');
                sessionStorage.removeItem('org_filter');
                return f ?? undefined;
              })()}
            />
          </SafePage>
        )}
        {pastorPage === 'visits' && <SafePage><VisitManagementPage /></SafePage>}
        {pastorPage === 'announcements' && <SafePage><AnnouncementManagementPage /></SafePage>}
        {pastorPage === 'events' && <SafePage><EventManagementPage /></SafePage>}
        {pastorPage === 'sermons' && <SafePage><SermonPage /></SafePage>}
        {pastorPage === 'grace-notes' && <SafePage><GraceNotesPage /></SafePage>}
        {pastorPage === 'profile' && <SafePage><ProfilePage /></SafePage>}
        {pastorPage === 'bulletin' && <SafePage><BulletinPage /></SafePage>}
        {pastorPage === 'album' && <SafePage><AlbumPage /></SafePage>}
        {pastorPage === 'bible' && (
          <SafePage>
            <BiblePage
              onNavigate={(p) => { setBibleInitialRef(null); setPastorPage(p as PastorPage); }}
              initialRef={bibleInitialRef}
            />
          </SafePage>
        )}
        {pastorPage === 'bible-reading-center' && (
          <SafePage>
            <BibleReadingCenterPage
              onNavigate={(p) => setPastorPage(p as PastorPage)}
              onGoToBible={(book, chapter) => { setBibleInitialRef({ book, chapter }); setPastorPage('bible'); }}
            />
          </SafePage>
        )}
        {pastorPage === 'sharing' && <SafePage><ChurchSharingPage /></SafePage>}
        {pastorPage === 'church-info' && <SafePage><ChurchInfoPage /></SafePage>}
      </PastorLayout>
    );
  }

  if (mode === 'admin') {
    return (
      <AdminLayout
        currentPage={adminPage}
        onNavigate={setAdminPage}
      >
        {adminPage === 'home' && <SafePage><AdminHome onNavigate={setAdminPage} /></SafePage>}
        {adminPage === 'church' && <SafePage><ChurchManagementPage /></SafePage>}
        {adminPage === 'org' && <SafePage><OrganizationManagementPage /></SafePage>}
        {adminPage === 'districts' && <SafePage><DistrictManagementPage /></SafePage>}
        {adminPage === 'zones' && <SafePage><ZoneManagementPage /></SafePage>}
        {adminPage === 'departments' && <SafePage><DepartmentManagementPage /></SafePage>}
        {adminPage === 'clergy' && <SafePage><ClergyManagementPage onNavigate={(p) => setAdminPage(p as AdminPage)} initialFilter={(() => { const f = sessionStorage.getItem('org_filter_clergy'); sessionStorage.removeItem('org_filter_clergy'); return f ?? undefined; })()} /></SafePage>}
        {adminPage === 'members' && <SafePage><MemberManagementPage onNavigate={(p) => setAdminPage(p as AdminPage)} initialFilter={(() => { const f = sessionStorage.getItem('org_filter'); sessionStorage.removeItem('org_filter'); return f ?? undefined; })()} /></SafePage>}
        {adminPage === 'invitations' && <SafePage><InvitationPage onNavigate={(p) => setAdminPage(p as AdminPage)} /></SafePage>}
        {adminPage === 'contents' && <SafePage><AdminContentsPage onNavigate={setAdminPage} /></SafePage>}
        {adminPage === 'sermons' && <SafePage><SermonManagementPage /></SafePage>}
        {adminPage === 'qt' && <SafePage><GraceNotesPage /></SafePage>}
        {adminPage === 'announcements' && <SafePage><AnnouncementManagementPage /></SafePage>}
        {adminPage === 'bulletins' && <SafePage><BulletinManagementPage /></SafePage>}
        {adminPage === 'events' && <SafePage><EventManagementPage /></SafePage>}
        {adminPage === 'visits' && <SafePage><VisitManagementPage /></SafePage>}
        {adminPage === 'bible-plans' && <SafePage><BiblePlanManagementPage /></SafePage>}
        {adminPage === 'albums' && <SafePage><AlbumManagementPage /></SafePage>}
        {adminPage === 'statistics' && <SafePage><StatisticsPage /></SafePage>}
        {adminPage === 'verification' && <SafePage><ChurchVerificationPage /></SafePage>}
        {adminPage === 'staff' && <></>}
        {adminPage === 'profile' && <SafePage><ProfilePage /></SafePage>}
        {adminPage === 'bible' && (
          <SafePage>
            <BiblePage
              onNavigate={(p) => { setBibleInitialRef(null); setAdminPage(p as AdminPage); }}
              initialRef={bibleInitialRef}
            />
          </SafePage>
        )}
        {adminPage === 'church-info' && <SafePage><ChurchInfoPage /></SafePage>}
        {adminPage === 'sharing' && <SafePage><ChurchSharingPage /></SafePage>}
      </AdminLayout>
    );
  }

  return null;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
          <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <ChurchIcon className="w-12 h-12 text-primary-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">교회이음</h1>
        <p className="text-white/80 text-sm">교회를 잇고, 말씀을 잇고, 믿음을 잇다.</p>
        <div className="mt-6 flex justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

function ChurchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 7c0-5.5-6-7-6-7s-6 1.5-6 7c0 1.5 1 3 3 4.5V21h6v-9.5c2-1.5 3-3 3-4.5z" />
      <path d="M12 3v4" />
      <path d="M9 21h6" />
      <path d="M10 14h4" />
    </svg>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrgSettingsProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </OrgSettingsProvider>
    </AuthProvider>
  );
}

export default App;
