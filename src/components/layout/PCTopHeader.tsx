import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, LogOut, Camera, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveProfileImage } from '../../services/profileImage';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { useCurrentUserDisplayMeta } from '../../hooks/useCurrentUserDisplayMeta';
import { getPcTopOrganizationPathLabel } from '../../services/currentUserDisplayMeta';
import ChurchieumLogo from '../common/ChurchieumLogo';
import { DS } from '../common/design-system/tokens';

type Props = {
  showSettings?: boolean;
  onSettingsClick?: () => void;
};

export default function PCTopHeader({ showSettings = false, onSettingsClick }: Props) {
  const { user, signOut } = useAuth();
  const meta = useCurrentUserDisplayMeta();
  const pcOrgLabel = getPcTopOrganizationPathLabel(user, meta);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    await saveProfileImage(user.id, file);
    setProfileMenuOpen(false);
  };

  return (
    <header
      className="shrink-0 flex items-center justify-between z-50 sticky top-0"
      style={{
        height: '68px',
        background: DS.colors.bgSurface,
        borderBottom: `1px solid ${DS.colors.borderDefault}`,
        padding: '0 24px',
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
        <ChurchieumLogo variant="horizontal" size={40} premium className="shrink-0" />
        <div className="hidden lg:block w-px h-8 shrink-0" style={{ background: DS.colors.borderDefault }} />
        <div
          className="flex min-w-0 flex-col overflow-hidden flex-1"
          title={pcOrgLabel ? `${meta.churchName} · ${pcOrgLabel}` : meta.churchName}
        >
          <span
            className="font-semibold truncate"
            style={{ fontSize: '15px', color: DS.colors.textPrimary }}
          >
            {meta.churchName}
          </span>
          {pcOrgLabel ? (
            <span
              className="truncate text-xs font-medium"
              style={{ color: DS.colors.textMuted }}
              title={pcOrgLabel}
            >
              {pcOrgLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-4">
        <button
          type="button"
          className="relative p-2.5 rounded-[12px] transition-colors"
          style={{ color: DS.colors.textPrimary }}
          onMouseEnter={e => { e.currentTarget.style.background = DS.colors.bgIvory; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white"
            style={{ background: DS.colors.accentRed }}
          />
        </button>

        {(showSettings || onSettingsClick) && (
          <button
            type="button"
            onClick={onSettingsClick}
            className="p-2.5 rounded-[12px] transition-colors"
            style={{ color: DS.colors.textPrimary }}
            onMouseEnter={e => { e.currentTarget.style.background = DS.colors.bgIvory; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-[14px] transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = DS.colors.bgIvory; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div className="w-8 h-8 rounded-[10px] overflow-hidden shrink-0">
              <UserProfileAvatar
                user={user}
                src={meta.profileImageUrl}
                size={32}
                rounded="2xl"
                alt={`${meta.userDisplayName} 프로필`}
              />
            </div>
            <span
              className="text-sm font-semibold hidden sm:block max-w-[140px] truncate"
              style={{ color: DS.colors.textPrimary }}
              title={meta.userDisplayName}
            >
              {meta.userDisplayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: DS.colors.textMuted }} />
          </button>

          {profileMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[20px] overflow-hidden z-50"
              style={{
                boxShadow: DS.shadow.cardHover,
                border: `1px solid ${DS.colors.borderCard}`,
              }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: `1px solid ${DS.colors.borderSubtle}`, background: DS.colors.bgIvory }}
              >
                <p className="font-bold text-sm truncate" style={{ color: DS.colors.textPrimary }}>
                  {meta.userDisplayName}
                </p>
                {meta.organizationPathLabel ? (
                  <p className="text-xs mt-0.5 truncate" style={{ color: DS.colors.textMuted }} title={meta.organizationPathLabel}>
                    {meta.organizationPathLabel}
                  </p>
                ) : null}
                <p className="text-xs truncate mt-0.5" style={{ color: DS.colors.textMuted }}>{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm transition-colors"
                  style={{ color: DS.colors.textPrimary }}
                >
                  <User className="w-4 h-4" style={{ color: DS.colors.textMuted }} /> 내 정보
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm transition-colors"
                  style={{ color: DS.colors.textPrimary }}
                >
                  <Camera className="w-4 h-4" style={{ color: DS.colors.textMuted }} /> 프로필 사진 변경
                </button>
                <div className="my-1" style={{ borderTop: `1px solid ${DS.colors.borderSubtle}` }} />
                <button
                  type="button"
                  onClick={() => { setProfileMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm text-red-500 hover:bg-red-50 transition-colors"
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
