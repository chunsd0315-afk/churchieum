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

/** PC 사이드바 — 3D 아이콘 축소판 + 파란 캡슐 활성 */
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
      className="w-full flex items-center gap-2.5 transition-all duration-200"
      style={{
        height: 44,
        borderRadius: DS.radius.capsule,
        padding: '0 12px',
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? DS.colors.textInverse : DS.colors.textPrimary,
        background: isActive ? DS.colors.activeCapsule : 'transparent',
        boxShadow: isActive ? DS.colors.activeCapsuleShadow : 'none',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = '#F1F5F9';
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <MenuIcon iconKey={iconKey} variant="sidebar" active={isActive} />
      <span className="flex-1 text-left truncate">{label}</span>
    </button>
  );
}
