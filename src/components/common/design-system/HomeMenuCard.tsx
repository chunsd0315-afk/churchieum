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

/** PC 홈 메뉴 카드 — v0.4 블루 통일 + 3D 아이콘 */
export function HomeMenuCard({ item }: Props) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className={[
        'group w-full flex flex-col text-left',
        'rounded-2xl border border-gray-200 bg-white',
        'shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]',
        'active:scale-[0.98]',
      ].join(' ')}
      style={{
        height: DS.layout.cardHeightDesktop,
        padding: '22px 20px',
      }}
    >
      <div className="flex items-center justify-center flex-1 min-h-0" style={{ marginBottom: 10 }}>
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
        style={{ fontSize: 12, color: DS.colors.textMuted, lineHeight: 1.45 }}
      >
        {item.description}
      </p>
    </button>
  );
}
