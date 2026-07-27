type Variant = 'icon' | 'full' | 'horizontal';
type TextColor = 'dark' | 'light';

type Props = {
  size?: number;
  variant?: Variant;
  showText?: boolean;
  showEnglish?: boolean;
  showTagline?: boolean;
  textColor?: TextColor;
  /** 프리미엄 브랜드 마크 (Premium Yellow 포인트) */
  premium?: boolean;
  className?: string;
};

const PREMIUM_YELLOW = '#FFCD00';
const PREMIUM_TEXT = '#1A1A1A';
const PREMIUM_SLOGAN = '#666666';

// ─── SVG mark ───────────────────────────────────────────────────────────────

export function ChurchieumIconSVG({
  size = 48,
  className = '',
  premium = false,
}: {
  size?: number;
  className?: string;
  premium?: boolean;
}) {
  const stroke = premium ? PREMIUM_TEXT : 'white';
  const crossBar = premium ? PREMIUM_YELLOW : 'white';
  const fill = premium ? PREMIUM_TEXT : 'white';

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
      <line x1="24" y1="2" x2="24" y2="12.5" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="18.5" y1="7" x2="29.5" y2="7" stroke={crossBar} strokeWidth="2.8" strokeLinecap="round" />

      <path
        d="M8 44 L8 26 Q8 12.5 24 12.5 Q40 12.5 40 26 L40 44"
        stroke={stroke}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15.5 24.5 Q24 17 32.5 24.5"
        stroke={premium ? PREMIUM_YELLOW : stroke}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity={premium ? 1 : 0.82}
      />

      <circle cx="15.5" cy="29" r="3.6" fill={fill} opacity={premium ? 1 : 0.92} />
      <path
        d="M11.8 44 L11.8 35 Q11.8 32.7 15.5 32.7 Q19.2 32.7 19.2 35 L19.2 44"
        fill={fill}
        opacity={premium ? 0.88 : 0.8}
      />

      <circle cx="32.5" cy="29" r="3.6" fill={fill} opacity={premium ? 1 : 0.92} />
      <path
        d="M28.8 44 L28.8 35 Q28.8 32.7 32.5 32.7 Q36.2 32.7 36.2 35 L36.2 44"
        fill={fill}
        opacity={premium ? 0.88 : 0.8}
      />
    </svg>
  );
}

function IconBox({ size, premium = false }: { size: number; premium?: boolean }) {
  const br = Math.round(size * 0.22);
  const iconSize = Math.round(size * 0.63);

  if (premium) {
    return (
      <div
        className="churchieum-logo-mark"
        style={{
          width: size,
          height: size,
          borderRadius: br,
          background: '#FFFFFF',
          border: '1px solid rgba(26, 26, 26, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 28px rgba(0, 0, 0, 0.06)',
          flexShrink: 0,
        }}
      >
        <ChurchieumIconSVG size={iconSize} premium />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: br,
        background: 'linear-gradient(135deg, #4CAF50 0%, #1E88E5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(30,136,229,0.32)',
        flexShrink: 0,
      }}
    >
      <ChurchieumIconSVG size={iconSize} />
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
  const tc1 = textColor === 'light' ? 'text-white' : 'text-gray-900';
  const tc2 = textColor === 'light' ? 'text-white/60' : 'text-gray-500';
  const tc3 = textColor === 'light' ? 'text-white/42' : 'text-gray-400';

  if (variant === 'icon') {
    return (
      <div className={className}>
        <IconBox size={size} premium={premium} />
      </div>
    );
  }

  const titleStyle = premium
    ? { fontSize: Math.round(size * 0.34), fontWeight: 700 as const, color: PREMIUM_TEXT }
    : { fontSize: Math.round(size * 0.55) };
  const sloganStyle = premium
    ? {
        fontSize: Math.max(13, Math.round(size * 0.19)),
        fontWeight: 500 as const,
        color: PREMIUM_SLOGAN,
        marginTop: 10,
      }
    : { fontSize: Math.round(size * 0.17), marginTop: 8 };

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center churchieum-brand-font ${className}`}>
        <IconBox size={size} premium={premium} />
        {showText && (
          <div className="text-center" style={{ marginTop: premium ? 8 : 16 }}>
            <p
              className={`tracking-tight leading-none ${premium ? '' : `font-extrabold ${tc1}`}`}
              style={premium ? titleStyle : titleStyle}
            >
              교회이음
            </p>
            {showEnglish && (
              <p
                className={`mt-1 font-semibold tracking-[0.25em] ${tc2}`}
                style={{ fontSize: Math.round(size * 0.19) }}
              >
                CHURCHIEUM
              </p>
            )}
            {showTagline && (
              <p
                className={`leading-relaxed churchieum-brand-slogan ${premium ? '' : tc3}`}
                style={sloganStyle}
              >
                교회를 잇고, 말씀을 잇고, 믿음을 잇다.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 churchieum-brand-font ${className}`}>
      <IconBox size={size} premium={premium} />
      {showText && (
        <div>
          <p
            className={`leading-tight ${premium ? '' : `font-bold ${tc1}`}`}
            style={
              premium
                ? { fontSize: Math.round(size * 0.44), fontWeight: 700, color: PREMIUM_TEXT }
                : { fontSize: Math.round(size * 0.44) }
            }
          >
            교회이음
          </p>
          {showEnglish && (
            <p
              className={`font-medium tracking-widest mt-0.5 ${tc2}`}
              style={{ fontSize: Math.round(size * 0.21) }}
            >
              CHURCHIEUM
            </p>
          )}
          {showTagline && (
            <p
              className={`churchieum-brand-slogan ${premium ? '' : tc3}`}
              style={
                premium
                  ? { ...sloganStyle, marginTop: 8 }
                  : { fontSize: Math.round(size * 0.17), marginTop: 4 }
              }
            >
              교회를 잇고, 말씀을 잇고, 믿음을 잇다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
