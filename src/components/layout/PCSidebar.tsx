import { useState, useRef, useEffect } from 'react';
import { Camera, LogOut, Home } from 'lucide-react';
import type { NavIcon } from '../../types/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileImage, saveProfileImage } from '../../services/profileImage';

type NavItem<P extends string> = {
  page: P;
  label: string;
  icon: NavIcon;
  iconColor?: string;
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

  return (
    <aside
      className="h-full flex flex-col shrink-0 overflow-y-auto scrollbar-hide"
      style={{
        width: '240px',
        background: '#111827',
        borderRight: '1px solid #1F2937',
        padding: '18px 14px',
      }}
    >
      {/* User profile */}
      <div className="mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <button
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
            <p className="font-bold text-white truncate" style={{ fontSize: '14px' }}>
              {user?.name || '사용자'}
            </p>
            <p className="truncate mt-0.5" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
              {user?.position || userPosition || '-'}
            </p>
          </div>
        </div>

        {modeSwitcher && <div className="mt-3">{modeSwitcher}</div>}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
        {[{ page: 'home' as P, label: '홈', icon: Home, iconColor: 'text-blue-500' }, ...navItems].map(item => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="w-full flex items-center gap-[10px] group"
              style={{
                height: '44px',
                borderRadius: '14px',
                padding: '0 14px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.82)',
                background: isActive ? '#2563EB' : 'transparent',
                boxShadow: isActive ? '0 6px 16px rgba(37,99,235,0.45)' : 'none',
                transition: 'background-color 200ms ease, color 200ms ease, box-shadow 200ms ease',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon
                className={`w-5 h-5 shrink-0 transition-[filter] duration-150 ${
                  isActive
                    ? 'text-white'
                    : `${item.iconColor ?? 'text-blue-500'} brightness-110 group-hover:brightness-150`
                }`}
              />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-4 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {footerContent}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 rounded-[14px] text-sm font-semibold transition-colors"
          style={{ height: '44px', color: '#F87171' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
