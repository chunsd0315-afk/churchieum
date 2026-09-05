import type { HomeMenuCardItem } from './HomeMenuCard';
import { HomeMenuCard } from './HomeMenuCard';
import { MobileMenuTile } from './MobileMenuTile';
import { DS } from './tokens';

/** 모바일 홈 3열 그리드 — minmax(0,1fr)로 overflow/잘림 방지 */
export function MobileMenuGrid({ items }: { items: HomeMenuCardItem[] }) {
  return (
    <div
      className="church-stagger w-full min-w-0"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: DS.spacing.gridGapMobile,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
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
      className="church-stagger w-full min-w-0"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: DS.spacing.gridGapDesktop,
      }}
    >
      {items.map(item => (
        <HomeMenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
