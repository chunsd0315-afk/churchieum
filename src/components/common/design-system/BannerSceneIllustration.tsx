/** Hero 장식 — 가죽 성경책 · 금십자가 · 따뜻한 빛 · 나뭇잎 */
export function BannerSceneIllustration() {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="heroLeather" x1="120" y1="40" x2="220" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D8A875" />
          <stop offset="50%" stopColor="#8A542F" />
          <stop offset="100%" stopColor="#4A2B1A" />
        </linearGradient>
        <linearGradient id="heroSun" x1="220" y1="20" x2="250" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="100%" stopColor="#E7B447" />
        </linearGradient>
        <filter id="heroShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#4A2B1A" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* soft bokeh */}
      <circle cx="48" cy="40" r="28" fill="#E7B447" opacity="0.12" />
      <circle cx="240" cy="120" r="36" fill="#4CAF70" opacity="0.10" />

      {/* warm sun */}
      <circle cx="236" cy="36" r="22" fill="url(#heroSun)" opacity="0.95" />
      <circle cx="230" cy="30" r="6" fill="#fff" opacity="0.4" />

      {/* leaves */}
      <ellipse cx="52" cy="118" rx="22" ry="10" fill="#4CAF70" opacity="0.55" transform="rotate(-18 52 118)" />
      <ellipse cx="78" cy="128" rx="16" ry="7" fill="#66C085" opacity="0.5" transform="rotate(12 78 128)" />
      <ellipse cx="220" cy="130" rx="18" ry="8" fill="#4CAF70" opacity="0.45" transform="rotate(-8 220 130)" />

      {/* leather bible */}
      <g filter="url(#heroShadow)">
        <rect x="108" y="42" width="88" height="96" rx="10" fill="url(#heroLeather)" />
        <rect
          x="116"
          y="50"
          width="72"
          height="80"
          rx="7"
          fill="none"
          stroke="#FFF5E8"
          strokeOpacity="0.4"
          strokeWidth="1.4"
          strokeDasharray="3 2.4"
        />
        <rect x="190" y="52" width="10" height="76" rx="2" fill="#FFF5E8" opacity="0.88" />
        {/* gold cross */}
        <rect x="144" y="68" width="8" height="36" rx="2" fill="#E7B447" />
        <rect x="132" y="80" width="32" height="8" rx="2" fill="#F5D56A" />
        {/* red bookmark */}
        <path d="M196 56h10v36l-5 6-5-6V56z" fill="#C45A4C" />
        <ellipse cx="130" cy="58" rx="22" ry="12" fill="#fff" opacity="0.22" />
      </g>
    </svg>
  );
}
