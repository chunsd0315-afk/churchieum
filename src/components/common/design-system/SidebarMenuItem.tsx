import type { MenuIconKey } from '../../../config/menuIconMap';
import { MenuIcon } from '../MenuIcon';
import { DS } from './tokens';

type Props<P extends string> = {
  page: P;
  label: string;
  iconKey: MenuIconKey;
  isActive: boolean;
  onNavigate: (page: P) => void;
};

/** PC 사이드바 — Soft-3D 아이콘 + 연노랑 활성 */
export function SidebarMenuItem<P extends string>({
  page,
  label,
  iconKey,
  isActive,
  onNavigate,
}: Props<P>) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(page)}
      className="w-full flex items-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
      style={{
        height: 48,
        borderRadius: DS.radius.capsule,
        padding: '0 12px',
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        background: isActive ? DS.colors.activeBg : 'transparent',
        boxShadow: isActive ? `inset 0 0 0 1px ${DS.colors.activeAccent}55` : 'none',
        color: isActive ? DS.colors.activeText : DS.colors.textPrimary,
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = DS.colors.bgGray;
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <MenuIcon iconKey={iconKey} variant="sidebar" active={isActive} />
      <span className="flex-1 text-left truncate">{label}</span>
      {isActive && (
        <span
          className="shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: DS.colors.gold }}
          aria-hidden
        />
      )}
    </button>
  );
}
