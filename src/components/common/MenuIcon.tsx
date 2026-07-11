import { useState } from 'react';
import type { MenuIconKey } from '../../config/menuIconMap';
import { getMenuIconAsset, getMenuLucideIcon } from '../../config/menuIconMap';
import { DS, iconSpec, type IconSizeVariant } from './design-system/tokens';

export type MenuIconProps = {
  iconKey: MenuIconKey;
  variant?: IconSizeVariant;
  size?: number;
  className?: string;
  /** 사이드바 활성 상태 — lucide 색상 반전 */
  active?: boolean;
};

function lucideStrokeSize(variant: IconSizeVariant, containerPx: number): number {
  if (variant === 'sidebar') return Math.min(20, Math.round(containerPx * 0.72));
  if (variant === 'mobile') return Math.min(32, Math.round(containerPx * 0.52));
  return Math.min(36, Math.round(containerPx * 0.48));
}

/** 메뉴 아이콘 — 에셋 있으면 img, 없거나 로드 실패 시 lucide fallback */
export function MenuIcon({
  iconKey,
  variant = 'desktop',
  size,
  className = '',
  active = false,
}: MenuIconProps) {
  const assetUrl = getMenuIconAsset(iconKey);
  const [assetFailed, setAssetFailed] = useState(false);

  const spec = iconSpec(variant);
  const containerPx = size ?? spec.size;
  const showAsset = Boolean(assetUrl) && !assetFailed;

  if (showAsset && assetUrl) {
    return (
      <img
        src={assetUrl}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setAssetFailed(true)}
        className={`object-contain select-none pointer-events-none ${className}`}
        style={{
          width: containerPx,
          height: containerPx,
          filter: active
            ? 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.12))'
            : 'drop-shadow(0 5px 12px rgba(15,23,42,0.14))',
        }}
      />
    );
  }

  const LucideIcon = getMenuLucideIcon(iconKey);
  const strokePx = lucideStrokeSize(variant, containerPx);
  const color = active ? DS.colors.textInverse : '#2563EB';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none pointer-events-none ${className}`}
      style={{ width: containerPx, height: containerPx }}
      aria-hidden
    >
      <LucideIcon
        size={strokePx}
        color={color}
        strokeWidth={2}
        aria-hidden
      />
    </span>
  );
}
