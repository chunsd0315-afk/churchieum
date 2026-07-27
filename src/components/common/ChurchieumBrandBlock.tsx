/**
 * 교회이음 프리미엄 브랜드 영역 (PC · 모바일 공통)
 * 로고 → 교회이음 → 슬로건 3단 구성
 */

import ChurchieumLogo from './ChurchieumLogo';

export const CHURCHIEUM_SLOGAN = '교회를 잇고, 말씀을 잇고, 믿음을 잇다.';

export type ChurchieumBrandBlockProps = {
  /** 로고 마크 크기 (px) */
  logoSize?: number;
  /** 흰 배경·여백 카드 (로그인·로딩 등) */
  withSurface?: boolean;
  /** 등장 애니메이션 */
  animate?: boolean;
  className?: string;
};

export function ChurchieumBrandBlock({
  logoSize = 64,
  withSurface = false,
  animate = true,
  className = '',
}: ChurchieumBrandBlockProps) {
  const titleSize = Math.max(20, Math.round(logoSize * 0.34));
  const sloganSize = Math.max(13, Math.round(logoSize * 0.19));

  const inner = (
    <div
      className={`flex flex-col items-center text-center churchieum-brand-font ${
        animate ? 'churchieum-brand-enter' : ''
      }`}
    >
      <div
        className="churchieum-brand-enter-item"
        style={{ animationDelay: animate ? '0ms' : undefined }}
      >
        <ChurchieumLogo variant="icon" size={logoSize} premium />
      </div>

      <p
        className="churchieum-brand-enter-item m-0"
        style={{
          marginTop: 8,
          fontSize: titleSize,
          fontWeight: 700,
          color: '#1A1A1A',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          animationDelay: animate ? '60ms' : undefined,
        }}
      >
        교회이음
      </p>

      <p
        className="churchieum-brand-enter-item m-0 max-w-[min(100%,20rem)] md:max-w-none px-1 churchieum-brand-slogan"
        style={{
          marginTop: 10,
          fontSize: sloganSize,
          fontWeight: 500,
          color: '#666666',
          lineHeight: 1.55,
          letterSpacing: '-0.01em',
          animationDelay: animate ? '120ms' : undefined,
        }}
      >
        {CHURCHIEUM_SLOGAN}
      </p>
    </div>
  );

  if (withSurface) {
    return (
      <div
        className={`churchieum-brand-surface ${className}`.trim()}
        style={{ padding: '24px 28px' }}
      >
        {inner}
      </div>
    );
  }

  return <div className={className}>{inner}</div>;
}
