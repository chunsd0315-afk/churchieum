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
 * 홈 Hero Card — 오늘의 말씀
 * UI 스크린샷 배경 금지 · Ivory gradient + 가죽 성경 SVG만 사용
 */
export function RoleGreetingBanner({ churchName }: Props) {
  const { isMobile } = useBreakpoint();
  const word = TODAY_WORD;

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        minHeight: isMobile ? 220 : DS.layout.bannerHeight,
        borderRadius: DS.radius.banner,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.banner,
        marginBottom: DS.spacing.sectionGap,
        background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF4DF 42%, #FFF9F2 100%)',
      }}
    >
      {/* warm sunlight / soft bokeh — no photo UI capture */}
      <div
        className="absolute -right-8 -top-10 rounded-full pointer-events-none"
        style={{
          width: 220,
          height: 220,
          background: 'radial-gradient(circle, rgba(231,180,71,0.28) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute left-6 bottom-0 rounded-full pointer-events-none"
        style={{
          width: 160,
          height: 120,
          background: 'radial-gradient(circle, rgba(76,175,112,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute right-16 top-8 rounded-full pointer-events-none"
        style={{
          width: 48,
          height: 48,
          background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
        }}
      />

      <div
        className={`relative z-10 flex ${
          isMobile
            ? 'flex-col min-h-[220px] px-5 pt-5 pb-4'
            : 'items-center min-h-[200px] px-8 py-7 gap-4'
        }`}
      >
        <div className={isMobile ? 'relative z-10 max-w-[88%]' : 'flex-1 min-w-0 max-w-[54%]'}>
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold mb-3"
            style={{
              background: DS.colors.gold,
              color: '#3A2418',
              boxShadow: '0 4px 12px rgba(231,180,71,0.35)',
            }}
          >
            오늘의 말씀
          </span>

          <p
            className="whitespace-pre-line leading-snug mb-3"
            style={{
              fontFamily: "var(--font-family-serif), 'Noto Serif KR', Georgia, serif",
              fontSize: isMobile ? 19 : 'clamp(18px, 2.4vw, 24px)',
              fontWeight: 600,
              color: '#3A2418',
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

        {/* Leather bible illustration — PC right / Mobile bottom-right */}
        {isMobile ? (
          <div
            className="absolute right-1 bottom-1 pointer-events-none opacity-95"
            style={{ width: 132, height: 100 }}
            aria-hidden
          >
            <BannerSceneIllustration />
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center justify-end shrink-0"
            style={{ width: '42%', height: 168 }}
            aria-hidden
          >
            <BannerSceneIllustration />
          </div>
        )}

        {isMobile ? <div className="flex-1 min-h-[72px]" aria-hidden /> : null}

        <div
          className={`flex gap-1.5 ${isMobile ? 'mt-auto relative z-10' : 'absolute bottom-5 left-8'}`}
          aria-hidden
        >
          <span className="rounded-full" style={{ width: 7, height: 7, background: DS.colors.gold }} />
          <span className="rounded-full" style={{ width: 7, height: 7, background: 'rgba(138,126,117,0.35)' }} />
          <span className="rounded-full" style={{ width: 7, height: 7, background: 'rgba(138,126,117,0.35)' }} />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;
