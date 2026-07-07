import { Bell, Settings } from 'lucide-react';
import type { AppMode, LayoutUser } from './LayoutTypes';

export type MobileHeaderProps = {
  user: LayoutUser | null;
  mode: AppMode;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
};

export function MobileHeader({
  user,
  mode,
  onSettingsClick,
  onNotificationClick,
  onProfileClick,
}: MobileHeaderProps) {
  const initial = user?.name?.charAt(0) ?? '?';
  const position = user?.position ?? (mode === 'admin' ? '최고관리자' : mode === 'pastor' ? '교역자' : '성도');

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
      {/* Profile — left side */}
      <button
        onClick={onProfileClick}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate leading-tight">{user?.name ?? '성도'}</p>
          <p className="text-[11px] text-gray-400 truncate leading-tight">{position}</p>
        </div>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Notification */}
        <button
          onClick={onNotificationClick}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-primary-500"
          aria-label="알림"
        >
          <Bell style={{ width: 18, height: 18 }} />
        </button>

        {/* Settings — admin / pastor only */}
        {mode !== 'member' && (
          <button
            onClick={onSettingsClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-primary-500"
            aria-label="설정"
          >
            <Settings style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>
    </header>
  );
}
