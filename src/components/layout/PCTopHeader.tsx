import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, LogOut, Camera, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileImage, saveProfileImage } from '../../services/profileImage';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import ChurchieumLogo from '../common/ChurchieumLogo';

type Props = {
  showSettings?: boolean;
  onSettingsClick?: () => void;
};

export default function PCTopHeader({ showSettings = false, onSettingsClick }: Props) {
  const { user, signOut } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { churchName, orgLabel } = useChurchOrg(user);

  useEffect(() => {
    if (user?.id) setProfileImg(getProfileImage(user.id));
  }, [user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const url = await saveProfileImage(user.id, file);
    setProfileImg(url);
    setProfileMenuOpen(false);
  };

  const initial = (user?.name || '?')[0];

  return (
    <header
      className="shrink-0 flex items-center justify-between z-50 sticky top-0"
      style={{
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px',
      }}
    >
      {/* Left: logo + church name + org info */}
      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
        <ChurchieumLogo variant="icon" size={36} />
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-bold shrink-0" style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            {churchName}
          </span>
          {orgLabel && (
            <span className="shrink min-w-0 truncate" style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              {orgLabel}
            </span>
          )}
        </div>
      </div>

      {/* Right: bell + settings + profile */}
      <div className="flex items-center gap-1 shrink-0">
        <button className="relative p-2.5 hover:bg-gray-100 rounded-[10px] transition-colors">
          <Bell className="w-5 h-5 text-primary-500" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {(showSettings || onSettingsClick) && (
          <button
            onClick={onSettingsClick}
            className="p-2.5 hover:bg-gray-100 rounded-[10px] transition-colors"
          >
            <Settings className="w-5 h-5 text-primary-500" />
          </button>
        )}

        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-[12px] hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-[8px] overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)' }}
            >
              {profileImg
                ? <img src={profileImg} alt="프로필" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-xs">{initial}</span>
              }
            </div>
            <span className="text-sm font-semibold text-gray-700 hidden sm:block max-w-[90px] truncate">
              {user?.name || '사용자'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {profileMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-[20px] overflow-hidden z-50"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB' }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <p className="font-bold text-sm text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" /> 내 정보
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-400" /> 프로필 사진 변경
                </button>
                <div className="my-1" style={{ borderTop: '1px solid #F1F5F9' }} />
                <button
                  onClick={() => { setProfileMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </header>
  );
}
