import { Bell, Settings } from 'lucide-react';
import ChurchieumLogo from '../common/ChurchieumLogo';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import type { AppMode, LayoutUser } from './LayoutTypes';

export type DesktopHeaderProps = {
  user: LayoutUser | null;
  mode: AppMode;
  churchName?: string;
  orgLabel?: string;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
};

export function DesktopHeader({
  user,
  mode,
  churchName,
  orgLabel,
  onSettingsClick,
  onNotificationClick,
  onProfileClick,
}: DesktopHeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-b border-gray-200 flex items-center px-5 gap-4 shrink-0">
      {/* Logo mark only — no "교회이음" text */}
      <div className="shrink-0">
        <ChurchieumLogo size={32} variant="icon" />
      </div>

      {/* Church name + org */}
      <div className="flex-1 min-w-0">
        {churchName && (
          <p className="font-bold text-gray-900 text-sm truncate leading-tight">{churchName}</p>
        )}
        {orgLabel && (
          <p className="text-xs text-gray-400 truncate leading-tight">{orgLabel}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Notification */}
        <button
          onClick={onNotificationClick}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          aria-label="알림"
        >
          <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </button>

        {/* Settings — admin / pastor only */}
        {mode !== 'member' && (
          <button
            onClick={onSettingsClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="설정"
          >
            <Settings className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        )}

        <button
          onClick={onProfileClick}
          className="ml-1 shrink-0 hover:opacity-90 transition-opacity"
          aria-label="프로필"
        >
          <UserProfileAvatar
            user={user ? { id: user.id, name: user.name, role: user.role } : null}
            size={36}
          />
        </button>
      </div>
    </header>
  );
}
