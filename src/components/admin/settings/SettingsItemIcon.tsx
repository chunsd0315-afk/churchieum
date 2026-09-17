/** 설정 메뉴 아이콘 — Soft-3D 아이콘이 있으면 그대로, 없으면 골드 칩 안에 심볼 */
import { MenuIcon } from '../../common/MenuIcon';
import { DS } from '../../common/design-system/tokens';
import type { SettingsItem } from './settingsMenu';

type Props = {
  item: SettingsItem;
  active?: boolean;
  /** sidebar: PC 설정 메뉴 · list: 모바일 설정 홈 */
  variant?: 'sidebar' | 'list';
};

export function SettingsItemIcon({ item, active = false, variant = 'sidebar' }: Props) {
  if (item.iconKey) {
    return <MenuIcon iconKey={item.iconKey} variant={variant} active={active} label={item.title} />;
  }

  const Icon = item.icon;
  const box = variant === 'sidebar' ? DS.icon.sidebar.container : DS.icon.list.container;
  const glyph = variant === 'sidebar' ? 16 : 22;

  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: box,
        height: box,
        borderRadius: variant === 'sidebar' ? 10 : 14,
        background: active ? DS.colors.primaryLight : DS.colors.bgIvory,
        boxShadow: DS.shadow.iconDropSoft,
      }}
      aria-hidden
    >
      {Icon ? <Icon style={{ width: glyph, height: glyph, color: DS.colors.leather }} /> : null}
    </span>
  );
}
