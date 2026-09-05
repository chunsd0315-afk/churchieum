type Variant = 'icon' | 'full' | 'horizontal';
type TextColor = 'dark' | 'light';

type Props = {
  size?: number;
  variant?: Variant;
  showText?: boolean;
  showEnglish?: boolean;
  showTagline?: boolean;
  textColor?: TextColor;
  /** 프리미엄 브랜드 마크 (Color Leather Bible) */
  premium?: boolean;
  className?: string;
};

const BRAND_TEXT = '#4A2B1A';
const BRAND_SLOGAN = '#8A7E75';

/** Brown leather bible · gold cross · red bookmark */
export function ChurchieumIconSVG({
  size = 48,
  className = '',
  premium: _premium = false,
}: {
  size?: number;
  className?: string;
  premium?: boolean;
}) {
  void _premium;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="leatherCover" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D8A875" />
          <stop offset="45%" stopColor="#8A542F" />
          <stop offset="100%" stopColor="#4A2B1A" />
        </linearGradient>
        <linearGradient id="leatherGloss" x1="14" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* cover */}
      <rect x="8" y="7" width="30" height="36" rx="5" fill="url(#leatherCover)" />
      {/* stitch */}
      <rect
        x="11"
        y="10"
        width="24"
        height="30"
        rx="3.5"
        fill="none"
        stroke="#FFF5E8"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeDasharray="2 1.8"
      />
      {/* pages edge */}
      <rect x="36" y="10" width="4" height="30" rx="1" fill="#FFF5E8" opacity="0.9" />
      <rect x="36" y="12" width="3" height="2" rx="0.5" fill="#EADFD5" />
      <rect x="36" y="16" width="3" height="2" rx="0.5" fill="#EADFD5" />
      {/* gold cross */}
      <rect x="20.5" y="16" width="3.2" height="14" rx="1" fill="#E7B447" />
      <rect x="16.5" y="20" width="11.2" height="3.2" rx="1" fill="#F5D56A" />
      {/* red bookmark */}
      <path d="M38 14h4v16l-2 3-2-3V14z" fill="#C45A4C" />
      <ellipse cx="18" cy="14" rx="7" ry="4" fill="url(#leatherGloss)" />
    </svg>
  );
}

function IconBox({ size, premium = false }: { size: number; premium?: boolean }) {
  const br = Math.round(size * 0.24);
  const iconSize = Math.round(size * 0.88);

  return (
    <div
      className="churchieum-logo-mark"
      style={{
        width: size,
        height: size,
        borderRadius: br,
        background: premium
          ? 'linear-gradient(145deg, #FFF9F2 0%, #FFF5E8 100%)'
          : 'linear-gradient(135deg, #8A542F 0%, #4A2B1A 100%)',
        border: '1px solid rgba(138, 84, 47, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(80, 50, 30, 0.14)',
        flexShrink: 0,
      }}
    >
      <ChurchieumIconSVG size={iconSize} premium={premium} />
    </div>
  );
}

export default function ChurchieumLogo({
  size = 48,
  variant = 'icon',
  showText = true,
  showEnglish = false,
  showTagline = false,
  textColor = 'dark',
  premium = false,
  className = '',
}: Props) {
  const tc1 = textColor === 'light' ? 'text-white' : '';
  const tc2 = textColor === 'light' ? 'text-white/60' : '';
  const tc3 = textColor === 'light' ? 'text-white/42' : '';

  if (variant === 'icon') {
    return (
      <div className={className}>
        <IconBox size={size} premium />
      </div>
    );
  }

  const titleStyle = {
    fontSize: Math.round(size * (variant === 'full' ? 0.34 : 0.44)),
    fontWeight: 700 as const,
    color: textColor === 'light' ? '#FFFFFF' : BRAND_TEXT,
  };
  const sloganStyle = {
    fontSize: Math.max(13, Math.round(size * 0.19)),
    fontWeight: 500 as const,
    color: textColor === 'light' ? 'rgba(255,255,255,0.7)' : BRAND_SLOGAN,
    marginTop: 10,
  };

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center churchieum-brand-font ${className}`}>
        <IconBox size={size} premium />
        {showText && (
          <div className="text-center" style={{ marginTop: 8 }}>
            <p className={`tracking-tight leading-none ${tc1}`} style={titleStyle}>
              교회이음
            </p>
            {showEnglish && (
              <p
                className={`mt-1 font-semibold tracking-[0.25em] ${tc2}`}
                style={{ fontSize: Math.round(size * 0.19), color: BRAND_SLOGAN }}
              >
                CHURCHIEUM
              </p>
            )}
            {showTagline && (
              <p className={`leading-relaxed churchieum-brand-slogan ${tc3}`} style={sloganStyle}>
                교회를 잇고, 말씀을 잇고, 믿음을 잇다.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const shortSlogan = '말씀으로 이어지는 우리 교회';

  return (
    <div className={`flex items-center gap-3 churchieum-brand-font ${className}`}>
      <IconBox size={size} premium />
      {showText && (
        <div className="min-w-0">
          <p className={`leading-tight ${tc1}`} style={titleStyle}>
            교회이음
          </p>
          {showEnglish && (
            <p
              className={`font-medium tracking-widest mt-0.5 ${tc2}`}
              style={{ fontSize: Math.round(size * 0.21), color: BRAND_SLOGAN }}
            >
              CHURCHIEUM
            </p>
          )}
          {(showTagline || premium) && (
            <p
              className={`churchieum-brand-slogan truncate ${tc3}`}
              style={{
                fontSize: Math.max(11, Math.round(size * 0.28)),
                fontWeight: 500,
                color: textColor === 'light' ? 'rgba(255,255,255,0.7)' : BRAND_SLOGAN,
                marginTop: 2,
                letterSpacing: '-0.01em',
              }}
              title={showTagline ? '교회를 잇고, 말씀을 잇고, 믿음을 잇다.' : shortSlogan}
            >
              {showTagline ? '교회를 잇고, 말씀을 잇고, 믿음을 잇다.' : shortSlogan}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
