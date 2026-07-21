import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import type { LayoutMenuItem, LayoutUser } from './LayoutTypes';

export type DesktopSidebarProps = {
  user: LayoutUser | null;
  menuItems: LayoutMenuItem[];
  activeMenu: string;
  onMenuClick: (id: string) => void;
};

export function DesktopSidebar({
  user,
  menuItems,
  activeMenu,
  onMenuClick,
}: DesktopSidebarProps) {
  const position = user?.position ?? '';

  return (
    <aside className="w-60 shrink-0 sticky top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* User profile */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <UserProfileAvatar user={user} size={40} />
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate leading-tight">{user?.name ?? '사용자'}</p>
            {position && (
              <p className="text-xs text-gray-400 truncate leading-tight">{position}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 px-3.5 py-3 space-y-0.5">
        {menuItems.map(item => {
          const active = item.id === activeMenu;
          return (
            <button
              key={item.id}
              onClick={() => { item.onClick?.(); onMenuClick(item.id); }}
              className={[
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-150 text-left',
                active
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')}
            >
              <span className={`shrink-0 ${active ? 'text-primary-500' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
