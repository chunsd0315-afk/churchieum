type Variant  = 'icon' | 'full' | 'horizontal';
type TextColor = 'dark' | 'light';

type Props = {
  size?:        number;
  variant?:     Variant;
  showText?:    boolean;
  showEnglish?: boolean;
  showTagline?: boolean;
  textColor?:   TextColor;
  className?:   string;
};

// ─── Pure SVG mark (white elements, transparent bg) ──────────────────────────

export function ChurchieumIconSVG({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cross */}
      <line x1="24" y1="2"   x2="24" y2="12.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="18.5" y1="7" x2="29.5" y2="7"  stroke="white" strokeWidth="2.8" strokeLinecap="round" />

      {/* Church arch — curved roof, straight walls */}
      <path
        d="M8 44 L8 26 Q8 12.5 24 12.5 Q40 12.5 40 26 L40 44"
        stroke="white" strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Connection arc between two people */}
      <path
        d="M15.5 24.5 Q24 17 32.5 24.5"
        stroke="white" strokeWidth="2.2" fill="none"
        strokeLinecap="round" opacity="0.82"
      />

      {/* Left person — head */}
      <circle cx="15.5" cy="29" r="3.6" fill="white" opacity="0.92" />
      {/* Left person — body */}
      <path
        d="M11.8 44 L11.8 35 Q11.8 32.7 15.5 32.7 Q19.2 32.7 19.2 35 L19.2 44"
        fill="white" opacity="0.80"
      />

      {/* Right person — head */}
      <circle cx="32.5" cy="29" r="3.6" fill="white" opacity="0.92" />
      {/* Right person — body */}
      <path
        d="M28.8 44 L28.8 35 Q28.8 32.7 32.5 32.7 Q36.2 32.7 36.2 35 L36.2 44"
        fill="white" opacity="0.80"
      />
    </svg>
  );
}

// ─── Icon wrapped in rounded-square gradient background ───────────────────────

function IconBox({ size }: { size: number }) {
  const br = Math.round(size * 0.22);
  return (
    <div
      style={{
        width:         size,
        height:        size,
        borderRadius:  br,
        background:    'linear-gradient(135deg, #4CAF50 0%, #1E88E5 100%)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        boxShadow:     '0 6px 20px rgba(30,136,229,0.32)',
        flexShrink:    0,
      }}
    >
      <ChurchieumIconSVG size={Math.round(size * 0.63)} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChurchieumLogo({
  size        = 48,
  variant     = 'icon',
  showText    = true,
  showEnglish = true,
  showTagline = false,
  textColor   = 'dark',
  className   = '',
}: Props) {
  const tc1 = textColor === 'light' ? 'text-white'      : 'text-gray-900';
  const tc2 = textColor === 'light' ? 'text-white/60'   : 'text-gray-500';
  const tc3 = textColor === 'light' ? 'text-white/42'   : 'text-gray-400';

  if (variant === 'icon') {
    return (
      <div className={className}>
        <IconBox size={size} />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <IconBox size={size} />
        {showText && (
          <div className="mt-4 text-center">
            <p
              className={`font-extrabold tracking-tight leading-none ${tc1}`}
              style={{ fontSize: Math.round(size * 0.55) }}
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
                className={`mt-2 leading-relaxed ${tc3}`}
                style={{ fontSize: Math.round(size * 0.17) }}
              >
                교회를 잇고, 말씀을 잇고, 믿음을 잇다.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // horizontal
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <IconBox size={size} />
      {showText && (
        <div>
          <p
            className={`font-bold leading-tight ${tc1}`}
            style={{ fontSize: Math.round(size * 0.44) }}
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
              className={`mt-1 leading-relaxed ${tc3}`}
              style={{ fontSize: Math.round(size * 0.17) }}
            >
              교회를 잇고, 말씀을 잇고, 믿음을 잇다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
