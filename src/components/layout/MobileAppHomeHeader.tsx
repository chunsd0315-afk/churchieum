import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentUserDisplayMeta } from '../../hooks/useCurrentUserDisplayMeta';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { DS } from '../common/design-system/tokens';

type Props = {
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  unreadCount?: number;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  compactBrand?: boolean;
};

/**
 * 모바일 홈 상단 — 프로필(이름·직분) · 교회명·조직경로 · 알림
 */
export function MobileAppHomeHeader({
  onProfileClick,
  onNotificationsClick,
  unreadCount = 0,
}: Props) {
  const { user } = useAuth();
  const meta = useCurrentUserDisplayMeta();

  return (
    <header
      className="sticky top-0 z-sticky"
      style={{
        background: DS.colors.bgPage,
        borderBottom: `1px solid ${DS.colors.borderSubtle}`,
      }}
    >
      <div className="px-3 h-14 flex items-center gap-2 min-w-0">
        {/* Left: profile photo + name/position */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2 min-w-0 shrink max-w-[42%] text-left touch-target"
          aria-label="내 정보"
        >
          <div
            className="w-9 h-9 rounded-full overflow-hidden shrink-0"
            style={{ boxShadow: `0 0 0 2px ${DS.colors.gold}` }}
          >
            <UserProfileAvatar user={user} src={meta.profileImageUrl} size={36} />
          </div>
          <span
            className="truncate leading-tight"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: DS.colors.leatherDeep,
            }}
            title={meta.userDisplayName}
          >
            {meta.userDisplayName}
          </span>
        </button>

        {/* Center: church name + org path */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate leading-tight"
            style={{ fontSize: 14, fontWeight: 700, color: DS.colors.textPrimary }}
            title={meta.churchName}
          >
            {meta.churchName}
          </p>
          {meta.organizationPathLabel ? (
            <p
              className="truncate leading-snug mt-0.5"
              style={{ fontSize: 10, fontWeight: 500, color: DS.colors.textMuted }}
              title={meta.organizationPathLabel}
            >
              {meta.organizationPathLabel}
            </p>
          ) : null}
        </div>

        {/* Right: notifications */}
        {onNotificationsClick ? (
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative p-2 rounded-[12px] transition-colors touch-target shrink-0"
            aria-label="알림"
            style={{ color: DS.colors.textSecondary }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 rounded-full border border-white"
                style={{ background: DS.colors.accentRed }}
              />
            )}
          </button>
        ) : null}
      </div>
    </header>
  );
}
