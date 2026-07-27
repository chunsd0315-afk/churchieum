import type { NavIcon } from '../../types/icons';

/** Mobile bottom navigation — warm yellow active accent */

export interface BottomNavItem {
  id: string;
  label: string;
  icon: NavIcon;
  badge?: number | boolean;
}

export interface MobileBottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

export default function MobileBottomNav({ items, activeId, onNavigate }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-sticky bg-white"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid var(--color-border-default)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex">
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center justify-center pt-3 pb-2.5 min-w-0 relative active:scale-[0.97] transition-transform"
              style={{
                minHeight: 'var(--layout-nav-h)',
                transition: 'color var(--duration-moderate) var(--ease-out)',
                color: isActive ? '#B45309' : 'var(--color-text-tertiary)',
              }}
            >
              <div className="relative">
                <item.icon
                  size={24}
                  className="shrink-0"
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                    {typeof item.badge === 'number' && item.badge > 0 ? (item.badge > 99 ? '99+' : item.badge) : ''}
                  </span>
                )}
              </div>
              <span
                className="mt-1 leading-none"
                style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500 }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: 'var(--color-primary-500)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
