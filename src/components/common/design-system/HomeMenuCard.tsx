import type { MenuIconKey } from '../../../config/menuIconMap';
import { MenuIcon } from '../MenuIcon';
import { DS } from './tokens';

export type HomeMenuCardItem = {
  id: string;
  label: string;
  description: string;
  iconKey: MenuIconKey;
  onClick: () => void;
};

type Props = {
  item: HomeMenuCardItem;
};

/** PC 홈 메뉴 카드 */
export function HomeMenuCard({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className="group w-full flex flex-col text-left transition-all duration-200 ease-out hover:-translate-y-1 active:scale-[0.98]"
      style={{
        height: DS.layout.cardHeightDesktop,
        background: DS.colors.bgSurface,
        border: `1px solid ${DS.colors.borderCard}`,
        borderRadius: DS.radius.card,
        padding: '22px 24px',
        boxShadow: DS.shadow.card,
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = DS.shadow.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = DS.shadow.card; }}
    >
      <div className="flex items-center justify-center flex-1 min-h-0" style={{ marginBottom: 10 }}>
        <MenuIcon iconKey={item.iconKey} variant="desktop" />
      </div>
      <p className="truncate" style={{ fontSize: 15, fontWeight: 800, color: DS.colors.textPrimary, marginBottom: 4 }}>
        {item.label}
      </p>
      <p className="line-clamp-2" style={{ fontSize: 12, color: DS.colors.textMuted, lineHeight: 1.45 }}>
        {item.description}
      </p>
    </button>
  );
}
