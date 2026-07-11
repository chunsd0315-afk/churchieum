import type { HomeMenuCardItem } from './HomeMenuCard';
import { MenuIcon } from '../MenuIcon';
import { DS } from './tokens';

type Props = {
  item: HomeMenuCardItem;
};

/** 모바일 홈 메뉴 타일 */
export function MobileMenuTile({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className="flex flex-col items-center justify-center w-full transition-all duration-150 active:scale-[0.96]"
      style={{
        minHeight: DS.layout.cardHeightMobile,
        background: DS.colors.bgSurface,
        border: `1px solid ${DS.colors.borderCard}`,
        borderRadius: DS.radius.cardMobile,
        padding: '14px 8px 12px',
        boxShadow: DS.shadow.card,
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center justify-center" style={{ marginBottom: 8, flex: '1 1 auto' }}>
        <MenuIcon iconKey={item.iconKey} variant="mobile" />
      </div>
      <p className="w-full text-center truncate" style={{ fontSize: 12, fontWeight: 700, color: DS.colors.textPrimary }}>
        {item.label}
      </p>
    </button>
  );
}
