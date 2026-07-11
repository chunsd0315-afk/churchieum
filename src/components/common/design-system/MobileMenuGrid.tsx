import type { HomeMenuCardItem } from './HomeMenuCard';
import { HomeMenuCard } from './HomeMenuCard';
import { MobileMenuTile } from './MobileMenuTile';
import { DS } from './tokens';

/** 모바일 홈 3열 그리드 */
export function MobileMenuGrid({ items }: { items: HomeMenuCardItem[] }) {
  return (
    <div
      className="church-stagger w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: DS.spacing.gridGapMobile,
      }}
    >
      {items.map(item => (
        <MobileMenuTile key={item.id} item={item} />
      ))}
    </div>
  );
}

/** PC 홈 메뉴 그리드 — 5열 (900px 기준) */
export function DesktopMenuGrid({ items }: { items: HomeMenuCardItem[] }) {
  return (
    <div
      className="church-stagger w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: DS.spacing.gridGapDesktop,
      }}
    >
      {items.map(item => (
        <HomeMenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
