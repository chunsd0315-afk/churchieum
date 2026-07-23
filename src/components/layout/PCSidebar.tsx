import { useState, useRef } from 'react';
import { Camera, LogOut } from 'lucide-react';
import type { MenuIconKey } from '../common/design-system';
import { SidebarMenuItem } from '../common/design-system';
import { useAuth } from '../../contexts/AuthContext';
import { saveProfileImage } from '../../services/profileImage';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { useCurrentUserDisplayMeta } from '../../hooks/useCurrentUserDisplayMeta';
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
  /** @deprecated 표시는 useCurrentUserDisplayMeta 사용 */
  userPosition?: string;
  modeSwitcher?: React.ReactNode;
  footerContent?: React.ReactNode;
};

export default function PCSidebar<P extends string>({
  currentPage,
  onNavigate,
  navItems,
  userPosition: _userPosition,
  modeSwitcher,
  footerContent,
}: Props<P>) {
  void _userPosition;
  const { user, signOut } = useAuth();
  const meta = useCurrentUserDisplayMeta();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      await saveProfileImage(user.id, file);
    } finally {
      setUploading(false);
    }
  };

  const homeActive = currentPage === ('home' as P);
  const tooltip = [meta.userDisplayName, meta.organizationPathLabel].filter(Boolean).join('\n');

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
      {/* User profile — 이름·직분 + 대표 조직 */}
      <div
        className="mb-4"
        style={{ borderBottom: `1px solid ${DS.colors.borderSubtle}`, paddingBottom: 16 }}
      >
        <div className="flex items-center gap-3" title={tooltip}>
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm relative"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)' }}
              aria-label="프로필 사진 변경"
            >
              <UserProfileAvatar user={user} src={meta.profileImageUrl} size={44} rounded="2xl" />
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

          <div className="min-w-0 flex-1">
            <p
              className="font-bold truncate"
              style={{ fontSize: 14, color: DS.colors.textPrimary }}
            >
              {meta.userDisplayName}
            </p>
            {meta.organizationPathLabel ? (
              <p
                className="truncate mt-0.5 leading-snug"
                style={{ fontSize: 12, color: DS.colors.textMuted }}
                title={meta.organizationPathLabel}
              >
                {meta.organizationPathLabel}
              </p>
            ) : (
              <p className="truncate mt-0.5" style={{ fontSize: 12, color: DS.colors.textMuted }}>
                소속 조직 없음
              </p>
            )}
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
