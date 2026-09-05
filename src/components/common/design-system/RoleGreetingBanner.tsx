import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { BannerSceneIllustration } from './BannerSceneIllustration';
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

/**
 * 홈 Hero Card — 오늘의 말씀 (Compact Banner)
 * Ivory gradient + 가죽 성경 SVG · PC ~190px / Mobile ~168px
 */
export function RoleGreetingBanner({ churchName }: Props) {
  const { isMobile } = useBreakpoint();
  const word = TODAY_WORD;
  const bannerH = isMobile ? DS.layout.bannerHeightMobile : DS.layout.bannerHeight;

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        height: bannerH,
        minHeight: bannerH,
        maxHeight: bannerH,
        borderRadius: isMobile ? 22 : DS.radius.banner,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.banner,
        marginBottom: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF4DF 42%, #FFF9F2 100%)',
      }}
    >
      {/* warm sunlight / soft bokeh */}
      <div
        className="absolute -right-10 -top-12 rounded-full pointer-events-none"
        style={{
          width: isMobile ? 140 : 180,
          height: isMobile ? 140 : 180,
          background: 'radial-gradient(circle, rgba(231,180,71,0.26) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute left-4 bottom-0 rounded-full pointer-events-none"
        style={{
          width: isMobile ? 100 : 130,
          height: isMobile ? 80 : 100,
          background: 'radial-gradient(circle, rgba(76,175,112,0.10) 0%, transparent 70%)',
        }}
      />

      <div
        className={`relative z-10 h-full flex ${
          isMobile
            ? 'flex-col justify-center px-4 py-3'
            : 'items-center px-6 py-4 gap-3'
        }`}
      >
        <div className={isMobile ? 'relative z-10 max-w-[78%] pr-1' : 'flex-1 min-w-0 max-w-[56%]'}>
          <span
            className="inline-flex items-center rounded-full font-bold"
            style={{
              padding: isMobile ? '4px 10px' : '5px 12px',
              fontSize: isMobile ? 11 : 12,
              marginBottom: isMobile ? 8 : 10,
              background: DS.colors.gold,
              color: '#3A2418',
              boxShadow: '0 3px 10px rgba(231,180,71,0.3)',
            }}
          >
            오늘의 말씀
          </span>

          <p
            className="whitespace-pre-line"
            style={{
              fontFamily: "var(--font-family-serif), 'Noto Serif KR', Georgia, serif",
              fontSize: isMobile ? 16 : 'clamp(16px, 2vw, 20px)',
              fontWeight: 600,
              color: '#3A2418',
              letterSpacing: '-0.01em',
              lineHeight: 1.35,
              marginBottom: isMobile ? 6 : 8,
            }}
          >
            {`“${word.verse}”`}
          </p>
          <p
            style={{
              fontSize: isMobile ? 11 : 12,
              color: DS.colors.textMuted,
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            {word.ref}
            {churchName ? ` · ${churchName}` : ''}
          </p>
        </div>

        {/* Leather bible — compact */}
        {isMobile ? (
          <div
            className="absolute right-0 bottom-0 pointer-events-none opacity-95"
            style={{ width: 108, height: 82 }}
            aria-hidden
          >
            <BannerSceneIllustration />
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center justify-end shrink-0"
            style={{ width: '38%', height: 140 }}
            aria-hidden
          >
            <BannerSceneIllustration />
          </div>
        )}

        <div
          className={`flex gap-1.5 ${isMobile ? 'mt-2 relative z-10' : 'absolute bottom-3.5 left-6'}`}
          aria-hidden
        >
          <span className="rounded-full" style={{ width: 6, height: 6, background: DS.colors.gold }} />
          <span className="rounded-full" style={{ width: 6, height: 6, background: 'rgba(138,126,117,0.35)' }} />
          <span className="rounded-full" style={{ width: 6, height: 6, background: 'rgba(138,126,117,0.35)' }} />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;
