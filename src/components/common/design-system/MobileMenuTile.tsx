import type { HomeMenuCardItem } from './HomeMenuCard';
import { MenuIcon } from '../MenuIcon';
import { DS } from './tokens';

type Props = {
  item: HomeMenuCardItem;
};

/** 모바일 홈 3열 메뉴 카드 — v0.4 블루 통일 */
export function MobileMenuTile({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className={[
        'group flex flex-col items-center justify-center w-full',
        'rounded-2xl border border-gray-200 bg-white',
        'shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]',
        'active:scale-[0.98]',
      ].join(' ')}
      style={{
        minHeight: DS.layout.cardHeightMobile,
        padding: '14px 8px 12px',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: DS.icon.mobile.container,
          height: DS.icon.mobile.container,
          marginBottom: 8,
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
          lineHeight: 1.25,
        }}
      >
        {item.label}
      </p>
    </button>
  );
}
