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

/** 홈 Hero Card — 오늘의 말씀 · Color Leather Bible */
export function RoleGreetingBanner({
  churchName,
}: Props) {
  const word = TODAY_WORD;

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        minHeight: DS.layout.bannerHeight,
        background: DS.colors.bannerGradient,
        borderRadius: DS.radius.banner,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.banner,
        marginBottom: DS.spacing.sectionGap,
      }}
    >
      {/* warm light orbs */}
      <div
        className="absolute -right-10 -top-10 rounded-full pointer-events-none"
        style={{
          width: 220,
          height: 220,
          background: 'radial-gradient(circle, rgba(231,180,71,0.28) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute left-8 bottom-0 rounded-full pointer-events-none"
        style={{
          width: 160,
          height: 120,
          background: 'radial-gradient(circle, rgba(76,175,112,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex items-center min-h-[200px] px-5 py-6 sm:px-8 gap-4">
        <div className="flex-1 min-w-0 sm:max-w-[58%]">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold mb-4"
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
              fontSize: 'clamp(18px, 2.4vw, 24px)',
              fontWeight: 600,
              color: DS.colors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            {word.verse}
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

        <div
          className="hidden sm:flex items-center justify-end shrink-0"
          style={{ width: '42%', height: 160 }}
        >
          <BannerSceneIllustration />
        </div>

        <div
          className="sm:hidden absolute right-1 bottom-1 pointer-events-none opacity-95"
          style={{ width: 140, height: 110 }}
        >
          <BannerSceneIllustration />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;
