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

/** PC 홈 메뉴 카드 — Color Leather 3D · Radius 24 */
export function HomeMenuCard({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className={[
        'group w-full min-w-0 flex flex-col text-left',
        'bg-white',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-[3px]',
        'active:scale-[0.97]',
      ].join(' ')}
      style={{
        height: DS.layout.cardHeightDesktop,
        padding: '20px 18px',
        borderRadius: DS.radius.card,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.card,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = DS.shadow.cardHover;
        e.currentTarget.style.borderColor = DS.colors.gold;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = DS.shadow.card;
        e.currentTarget.style.borderColor = DS.colors.borderCard;
      }}
    >
      <div className="flex items-center justify-center flex-1 min-h-0" style={{ marginBottom: 8 }}>
        <MenuIcon iconKey={item.iconKey} variant="desktop" label={item.label} />
      </div>
      <p
        className="truncate"
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: DS.colors.textPrimary,
          marginBottom: 4,
        }}
      >
        {item.label}
      </p>
      <p
        className="line-clamp-2"
        style={{ fontSize: 12, color: DS.colors.textMuted, lineHeight: 1.5, fontWeight: 400 }}
      >
        {item.description}
      </p>
    </button>
  );
}
