import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { DS } from './tokens';

type Props = {
  userName?: string;
  roleLabel?: string;
  position?: string;
  churchName?: string;
  mode: 'admin' | 'pastor' | 'member';
};

const TODAY_WORD = {
  verse: '너의 말씀은 내 발에 등이요\n내 길에 빛이니이다',
  ref: '시편 119:105',
};

/** 홈 Hero Card — 오늘의 말씀 · Color Leather Bible 시안 이미지 */
export function RoleGreetingBanner({ churchName }: Props) {
  const { isMobile } = useBreakpoint();
  const word = TODAY_WORD;
  const heroSrc = isMobile ? '/brand/hero-mobile.jpg' : '/brand/hero-pc.jpg';

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        minHeight: isMobile ? 280 : DS.layout.bannerHeight,
        borderRadius: DS.radius.banner,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.banner,
        marginBottom: DS.spacing.sectionGap,
        background: DS.colors.bgIvory,
      }}
    >
      <img
        src={heroSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: isMobile ? 'center 35%' : '72% center' }}
      />

      {/* Soft readability veil — ivory warmth, leather bible stays visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isMobile
            ? 'linear-gradient(180deg, rgba(255,249,242,0.88) 0%, rgba(255,249,242,0.42) 38%, rgba(255,249,242,0.05) 68%, transparent 100%)'
            : 'linear-gradient(95deg, rgba(255,249,242,0.94) 0%, rgba(255,249,242,0.72) 34%, rgba(255,249,242,0.18) 58%, transparent 78%)',
        }}
      />

      <div
        className={`relative z-10 flex ${isMobile ? 'flex-col min-h-[280px] px-5 pt-5 pb-4' : 'items-center min-h-[200px] px-8 py-7'}`}
      >
        <div className={isMobile ? 'max-w-[92%]' : 'max-w-[52%]'}>
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold mb-3"
            style={{
              background: DS.colors.primary,
              color: DS.colors.textOnYellow,
              boxShadow: '0 4px 12px rgba(231,180,71,0.35)',
            }}
          >
            오늘의 말씀
          </span>

          <p
            className="whitespace-pre-line leading-snug mb-3"
            style={{
              fontFamily: "var(--font-family-serif), 'Noto Serif KR', Georgia, serif",
              fontSize: isMobile ? 20 : 'clamp(18px, 2.4vw, 24px)',
              fontWeight: 600,
              color: DS.colors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            {`“${word.verse}”`}
          </p>
          <p
            style={{
              fontSize: 13,
              color: DS.colors.textMuted,
              fontWeight: 500,
            }}
          >
            {word.ref}
            {churchName ? ` · ${churchName}` : ''}
          </p>
        </div>

        {/* Mobile: leave lower area for the photo bible */}
        {isMobile ? <div className="flex-1 min-h-[120px]" aria-hidden /> : null}

        {/* Carousel dots (visual only for prototype) */}
        <div
          className={`flex gap-1.5 ${isMobile ? 'mt-auto' : 'absolute bottom-5 left-8'}`}
          aria-hidden
        >
          <span
            className="rounded-full"
            style={{ width: 7, height: 7, background: DS.colors.gold }}
          />
          <span
            className="rounded-full"
            style={{ width: 7, height: 7, background: 'rgba(138,126,117,0.35)' }}
          />
          <span
            className="rounded-full"
            style={{ width: 7, height: 7, background: 'rgba(138,126,117,0.35)' }}
          />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;
