import type { MenuIconKey } from '../../config/menuIconMap';
import type { NavIcon } from '../../types/icons';
import { Soft3DIcon } from '../common/icons/Soft3DIcons';
import { DS } from '../common/design-system/tokens';

/** Mobile bottom navigation — Gold / Brown accent · Color Leather icons */

export interface BottomNavItem {
  id: string;
  label: string;
  icon?: NavIcon;
  iconKey?: MenuIconKey;
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
      className="fixed bottom-0 left-0 right-0 z-sticky"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: `1px solid ${DS.colors.borderDefault}`,
        boxShadow: '0 -6px 24px rgba(80,50,30,0.06)',
        background: DS.colors.bgSurface,
      }}
    >
      <div className="flex">
        {items.map(item => {
          const isActive = item.id === activeId;
          const LucideIcon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-2 min-w-0 relative active:scale-[0.97] transition-transform"
              style={{
                minHeight: 'var(--layout-nav-h)',
                color: isActive ? DS.colors.leather : DS.colors.navInactive,
              }}
            >
              <div className="relative">
                {item.iconKey ? (
                  <Soft3DIcon iconKey={item.iconKey} size={28} active={isActive} />
                ) : LucideIcon ? (
                  <LucideIcon
                    size={24}
                    className="shrink-0"
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                ) : null}
                {item.badge ? (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white"
                    style={{ background: DS.colors.accentRed }}
                  >
                    {typeof item.badge === 'number' && item.badge > 0
                      ? item.badge > 99
                        ? '99+'
                        : item.badge
                      : ''}
                  </span>
                ) : null}
              </div>
              <span
                className="mt-1 leading-none"
                style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500 }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: DS.colors.gold }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
