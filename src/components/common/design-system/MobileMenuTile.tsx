import type { HomeMenuCardItem } from './HomeMenuCard';
import { MenuIcon } from '../MenuIcon';
import { DS } from './tokens';

type Props = {
  item: HomeMenuCardItem;
};

/** 모바일 홈 메뉴 타일 — 3열 반응형 · Color Leather 3D */
export function MobileMenuTile({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className={[
        'group flex flex-col items-center justify-start',
        'bg-white min-w-0 w-full max-w-full',
        'transition-transform duration-200 ease-out',
        'active:scale-[0.97]',
      ].join(' ')}
      style={{
        minHeight: DS.layout.cardHeightMobile,
        padding: '10px 4px 8px',
        borderRadius: DS.radius.cardMobile,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.card,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: DS.icon.mobile.container,
          height: DS.icon.mobile.container,
          maxWidth: '100%',
          marginBottom: 6,
        }}
      >
        <MenuIcon iconKey={item.iconKey} variant="mobile" label={item.label} />
      </div>
      <p
        className="w-full text-center px-0.5"
        style={{
          fontSize: DS.typography.menuLabel.size,
          fontWeight: DS.typography.menuLabel.weight,
          color: DS.colors.textPrimary,
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'keep-all',
        }}
      >
        {item.label}
      </p>
      {item.description ? (
        <p
          className="w-full text-center px-0.5 mt-0.5"
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: DS.colors.textMuted,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'keep-all',
          }}
        >
          {item.description}
        </p>
      ) : null}
    </button>
  );
}
