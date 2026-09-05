import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentUserDisplayMeta } from '../../hooks/useCurrentUserDisplayMeta';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import ChurchieumLogo from '../common/ChurchieumLogo';
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
 * 모바일 홈 상단 — 가죽 성경 로고 + 교회명·조직경로 · 알림 · 프로필
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
      <div className="px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <ChurchieumLogo variant="icon" size={36} premium className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p
              className="truncate leading-tight"
              style={{ fontSize: 16, fontWeight: 700, color: DS.colors.leatherDeep }}
              title={meta.churchName}
            >
              {meta.churchName}
            </p>
            {meta.organizationPathLabel ? (
              <p
                className="truncate leading-snug mt-0.5"
                style={{ fontSize: 11, fontWeight: 500, color: DS.colors.textMuted }}
                title={meta.organizationPathLabel}
              >
                {meta.organizationPathLabel}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onNotificationsClick && (
            <button
              type="button"
              onClick={onNotificationsClick}
              className="relative p-2 rounded-[12px] transition-colors touch-target"
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
          )}
          <button
            type="button"
            onClick={onProfileClick}
            className="p-1.5 rounded-full transition-colors"
            aria-label="내 정보"
          >
            <div
              className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2"
              style={{ boxShadow: `0 0 0 2px ${DS.colors.gold}` }}
            >
              <UserProfileAvatar user={user} src={meta.profileImageUrl} size={36} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
