import { useState, useEffect, Component, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrgSettingsProvider } from './contexts/OrgSettingsContext';
import LoginPage from './components/LoginPage';
import ModeSelectPage from './components/ModeSelectPage';
import { MemberLayout, type Page } from './components/member/Layout';
import MemberHome from './components/member/MemberHome';
import SermonPage from './components/member/SermonPage';
import GraceNotesPage from './components/member/GraceNotesPage';
import PrayerPage from './components/member/PrayerPage';
import AnnouncementPage from './components/member/AnnouncementPage';
import AlbumPage from './components/member/AlbumPage';
import ProfilePage from './components/member/ProfilePage';
import DepartmentsPage from './components/member/DepartmentsPage';
import BiblePage from './components/member/BiblePage';
import BulletinPage from './components/member/BulletinPage';
import SchedulePage from './components/member/SchedulePage';
import ChurchInfoPage from './components/member/ChurchInfoPage';
import BibleReadingCenterPage from './components/member/BibleReadingCenterPage';
import { AdminLayout, type AdminPage } from './components/admin/Layout';
import AdminHome from './components/admin/AdminHome';
import MemberManagementPage from './components/admin/MemberManagementPage';
import DepartmentManagementPage from './components/admin/DepartmentManagementPage';
import SermonManagementPage from './components/admin/SermonManagementPage';
import QtManagementPage from './components/admin/QtManagementPage';
import AnnouncementManagementPage from './components/admin/AnnouncementManagementPage';
import PrayerManagementPage from './components/admin/PrayerManagementPage';
import VisitManagementPage from './components/admin/VisitManagementPage';
import StatisticsPage from './components/admin/StatisticsPage';
import ChurchVerificationPage from './components/admin/ChurchVerificationPage';
import BulletinManagementPage from './components/admin/BulletinManagementPage';
import EventManagementPage from './components/admin/EventManagementPage';
import BiblePlanManagementPage from './components/admin/BiblePlanManagementPage';
import ChurchManagementPage from './components/admin/ChurchManagementPage';
import InvitationPage from './components/admin/InvitationPage';
import AlbumManagementPage from './components/admin/AlbumManagementPage';
import DistrictManagementPage from './components/admin/DistrictManagementPage';
import ZoneManagementPage from './components/admin/ZoneManagementPage';
import ClergyManagementPage from './components/admin/ClergyManagementPage';
import OrganizationManagementPage from './components/admin/OrganizationManagementPage';
import InviteSignupPage from './components/member/InviteSignupPage';
import ChurchSharingPage from './components/sharing/ChurchSharingPage';
import type { BibleRef } from './utils/bibleParser';

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
  const [mode, setMode] = useState<'select' | 'member' | 'admin'>('select');
  const [memberPage, setMemberPage] = useState<Page>('home');
  const [adminPage, setAdminPage] = useState<AdminPage>('home');
  const [bibleInitialRef, setBibleInitialRef] = useState<BibleRef | null>(null);

  // Check for invite link in URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code') || urlParams.get('invite') ||
    (window.location.pathname.startsWith('/invite/') ? window.location.pathname.split('/invite/')[1] : null);

  // Reset mode when user logs out
  useEffect(() => {
    if (!user) {
      setMode('select');
      setMemberPage('home');
      setAdminPage('home');
    }
  }, [user]);

  // Auto-select mode based on role after login
  useEffect(() => {
    if (user && mode === 'select') {
      if (isAdmin) {
        setMode('admin');
      } else {
        setMode('member');
      }
    }
  }, [user, isAdmin, mode]);

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
    return <ModeSelectPage onSelectMode={setMode} isAdmin={isAdmin} />;
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
        {memberPage === 'sermon' && <SafePage><SermonPage onNavigate={setMemberPage} /></SafePage>}
        {memberPage === 'grace-notes' && <SafePage><GraceNotesPage /></SafePage>}
        {memberPage === 'prayer' && <SafePage><PrayerPage /></SafePage>}
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
              onGoToBible={(ref) => { setBibleInitialRef(ref); setMemberPage('bible'); }}
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
        {adminPage === 'clergy' && <SafePage><ClergyManagementPage onNavigate={setAdminPage} initialFilter={(() => { const f = sessionStorage.getItem('org_filter_clergy'); sessionStorage.removeItem('org_filter_clergy'); return f ?? undefined; })()} /></SafePage>}
        {adminPage === 'members' && <SafePage><MemberManagementPage onNavigate={setAdminPage} initialFilter={(() => { const f = sessionStorage.getItem('org_filter'); sessionStorage.removeItem('org_filter'); return f ?? undefined; })()} /></SafePage>}
        {adminPage === 'invitations' && <SafePage><InvitationPage onNavigate={(p) => setAdminPage(p as AdminPage)} /></SafePage>}
        {adminPage === 'sermons' && <SafePage><SermonManagementPage /></SafePage>}
        {adminPage === 'qt' && <SafePage><QtManagementPage /></SafePage>}
        {adminPage === 'announcements' && <SafePage><AnnouncementManagementPage /></SafePage>}
        {adminPage === 'bulletins' && <SafePage><BulletinManagementPage /></SafePage>}
        {adminPage === 'events' && <SafePage><EventManagementPage /></SafePage>}
        {adminPage === 'prayers' && <SafePage><PrayerManagementPage /></SafePage>}
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
        <AppContent />
      </OrgSettingsProvider>
    </AuthProvider>
  );
}

export default App;
