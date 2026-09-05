import type { HomeMenuCardItem } from './HomeMenuCard';
import { MenuIcon } from '../MenuIcon';
import { DS } from './tokens';

type Props = {
  item: HomeMenuCardItem;
};

/** 모바일 홈 메뉴 타일 — Color Leather 3D · 설명 문구 */
export function MobileMenuTile({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className={[
        'group flex flex-col items-center justify-center w-full',
        'bg-white',
        'transition-all duration-200',
        'active:scale-[0.97]',
      ].join(' ')}
      style={{
        minHeight: DS.layout.cardHeightMobile,
        padding: '14px 8px 12px',
        borderRadius: DS.radius.cardMobile,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.card,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: DS.icon.mobile.container,
          height: DS.icon.mobile.container,
          marginBottom: 6,
        }}
      >
        <MenuIcon iconKey={item.iconKey} variant="mobile" label={item.label} />
      </div>
      <p
        className="w-full text-center truncate px-0.5"
        style={{
          fontSize: DS.typography.menuLabel.size,
          fontWeight: DS.typography.menuLabel.weight,
          color: DS.colors.textPrimary,
          lineHeight: 1.3,
        }}
      >
        {item.label}
      </p>
      {item.description ? (
        <p
          className="w-full text-center truncate px-0.5 mt-0.5"
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: DS.colors.textMuted,
            lineHeight: 1.3,
          }}
        >
          {item.description}
        </p>
      ) : null}
    </button>
  );
}
