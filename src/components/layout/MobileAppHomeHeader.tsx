import { Bell, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentUserDisplayMeta } from '../../hooks/useCurrentUserDisplayMeta';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import ChurchieumLogo from '../common/ChurchieumLogo';

type Props = {
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  unreadCount?: number;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  /** true면 로고+교회명 중심 (프로필 축소) */
  compactBrand?: boolean;
};

/**
 * 모바일 홈 상단 — 교회명·소속·이름·직분·프로필 (전역 메타)
 */
export function MobileAppHomeHeader({
  onProfileClick,
  onNotificationsClick,
  unreadCount = 0,
  showSettings = false,
  onSettingsClick,
}: Props) {
  const { user } = useAuth();
  const meta = useCurrentUserDisplayMeta();

  return (
    <header className="bg-white sticky top-0 z-sticky" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="px-4 h-14 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <UserProfileAvatar user={user} src={meta.profileImageUrl} size={40} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate" style={{ fontSize: '15px' }}>
              {meta.userDisplayName}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          {onNotificationsClick && (
            <button
              type="button"
              onClick={onNotificationsClick}
              className="relative p-2 hover:bg-gray-100 rounded-[10px] transition-colors"
              aria-label="알림"
            >
              <Bell className="w-5 h-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 bg-red-500 rounded-full border border-white" />
              )}
            </button>
          )}
          {showSettings && onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-100 rounded-[10px] transition-colors"
              aria-label="설정"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 flex items-start gap-2.5 min-w-0">
        <ChurchieumLogo variant="icon" size={28} className="shrink-0 mt-1" />
        <div className="min-w-0 flex-1">
          <p
            className="font-bold leading-tight truncate"
            style={{ fontSize: '22px', color: '#111827' }}
            title={meta.churchName}
          >
            {meta.churchName}
          </p>
          {meta.organizationPathLabel ? (
            <p
              className="leading-snug mt-1 line-clamp-2"
              style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}
              title={meta.organizationPathLabel}
            >
              {meta.organizationPathLabel}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
