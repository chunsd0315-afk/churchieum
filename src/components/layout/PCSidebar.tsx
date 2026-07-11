import { useState, useRef, useEffect } from 'react';
import { Camera, LogOut } from 'lucide-react';
import type { MenuIconKey } from '../common/design-system';
import { SidebarMenuItem } from '../common/design-system';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileImage, saveProfileImage } from '../../services/profileImage';
import { DS } from '../common/design-system/tokens';

type NavItem<P extends string> = {
  page: P;
  label: string;
  iconKey: MenuIconKey;
};

type Props<P extends string> = {
  currentPage: P;
  onNavigate: (page: P) => void;
  navItems: NavItem<P>[];
  userPosition?: string;
  modeSwitcher?: React.ReactNode;
  footerContent?: React.ReactNode;
};

export default function PCSidebar<P extends string>({
  currentPage,
  onNavigate,
  navItems,
  userPosition,
  modeSwitcher,
  footerContent,
}: Props<P>) {
  const { user, signOut } = useAuth();
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) setProfileImg(getProfileImage(user.id));
  }, [user?.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const url = await saveProfileImage(user.id, file);
      setProfileImg(url);
    } finally {
      setUploading(false);
    }
  };

  const initial = (user?.name || '?')[0];
  const homeActive = currentPage === ('home' as P);

  return (
    <aside
      className="h-full flex flex-col shrink-0 overflow-y-auto scrollbar-hide"
      style={{
        width: DS.layout.sidebarWidth,
        background: DS.colors.bgSidebar,
        borderRight: `1px solid ${DS.colors.borderDefault}`,
        padding: '18px 14px',
      }}
    >
      {/* User profile */}
      <div
        className="mb-4"
        style={{ borderBottom: `1px solid ${DS.colors.borderSubtle}`, paddingBottom: 16 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm relative"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)' }}
            >
              {profileImg
                ? <img src={profileImg} alt="프로필" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-base">{initial}</span>
              }
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            {uploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="font-bold truncate" style={{ fontSize: 14, color: DS.colors.textPrimary }}>
              {user?.name || '사용자'}
            </p>
            <p className="truncate mt-0.5" style={{ fontSize: 12, color: DS.colors.textMuted }}>
              {user?.position || userPosition || '-'}
            </p>
          </div>
        </div>

        {modeSwitcher && <div className="mt-3">{modeSwitcher}</div>}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
        <SidebarMenuItem
          page={'home' as P}
          label="홈"
          iconKey="home"
          isActive={homeActive}
          onNavigate={onNavigate}
        />
        {navItems.map(item => (
          <SidebarMenuItem
            key={item.page}
            page={item.page}
            label={item.label}
            iconKey={item.iconKey}
            isActive={currentPage === item.page}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="mt-4 pt-3 space-y-1"
        style={{ borderTop: `1px solid ${DS.colors.borderSubtle}` }}
      >
        {footerContent}
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 rounded-[14px] text-sm font-semibold transition-colors"
          style={{ height: 44, color: '#DC2626' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
