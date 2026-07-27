import { Soft3DIcon } from './icons/Soft3DIcons';
import type { MenuIconKey } from '../../config/menuIconMap';
import { getMenuIconLabel } from '../../config/menuIconMap';
import { iconSpec, type IconSizeVariant } from './design-system/tokens';

export type MenuIconProps = {
  iconKey: MenuIconKey;
  variant?: IconSizeVariant;
  size?: number;
  className?: string;
  label?: string;
  /** 사이드바 활성 — Soft-3D 아이콘 강조 */
  active?: boolean;
};

/** 메뉴 아이콘 — Soft-3D Premium SVG (Line icon 미사용) */
export function MenuIcon({
  iconKey,
  variant = 'desktop',
  size,
  className = '',
  label,
  active = false,
}: MenuIconProps) {
  const spec = iconSpec(variant === 'list' ? 'list' : variant);
  const containerPx = size ?? spec.size;
  const altText = label ?? getMenuIconLabel(iconKey);

  return (
    <Soft3DIcon
      iconKey={iconKey}
      size={containerPx}
      className={className}
      active={active}
      title={altText}
    />
  );
}
