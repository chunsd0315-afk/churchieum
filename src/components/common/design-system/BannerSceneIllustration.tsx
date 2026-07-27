/** SVG 배너 장식 — 십자가 · 구름 · 햇빛 · 나무 (Warm Soft-3D) */
export function BannerSceneIllustration() {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden
    >
      {/* 햇빛 */}
      <circle cx="232" cy="36" r="22" fill="#FFCD00" opacity="0.9" />
      <circle cx="232" cy="36" r="14" fill="#FFE566" />
      <circle cx="226" cy="30" r="5" fill="#fff" opacity="0.45" />

      {/* 구름 */}
      <ellipse cx="60" cy="32" rx="36" ry="14" fill="white" opacity="0.95" />
      <ellipse cx="88" cy="36" rx="24" ry="11" fill="white" opacity="0.85" />
      <ellipse cx="40" cy="38" rx="18" ry="9" fill="white" opacity="0.75" />
      <ellipse cx="170" cy="28" rx="28" ry="11" fill="white" opacity="0.8" />

      {/* 언덕 */}
      <ellipse cx="140" cy="150" rx="120" ry="28" fill="#86EFAC" opacity="0.55" />
      <ellipse cx="80" cy="152" rx="70" ry="22" fill="#4ADE80" opacity="0.35" />

      {/* 나무 왼쪽 */}
      <circle cx="48" cy="108" r="18" fill="#22C55E" filter="url(#bShadow)" />
      <circle cx="62" cy="102" r="13" fill="#4ADE80" />
      <rect x="52" y="112" width="7" height="18" rx="3" fill="#92400E" />

      {/* 중앙 십자가 언덕 */}
      <g filter="url(#bShadow)">
        <ellipse cx="140" cy="128" rx="36" ry="12" fill="#86EFAC" />
        <rect x="134" y="72" width="12" height="52" rx="3" fill="#1E293B" />
        <rect x="116" y="86" width="48" height="11" rx="3" fill="#1E293B" />
        <rect x="136" y="74" width="4" height="10" rx="1" fill="#475569" opacity="0.4" />
      </g>

      {/* 나무 오른쪽 */}
      <circle cx="220" cy="112" r="15" fill="#16A34A" filter="url(#bShadow)" />
      <circle cx="232" cy="108" r="11" fill="#22C55E" />
      <rect x="224" y="114" width="6" height="16" rx="2" fill="#92400E" />

      {/* 작은 꽃/잎 */}
      <circle cx="100" cy="130" r="4" fill="#FF5DA8" opacity="0.7" />
      <circle cx="180" cy="134" r="3.5" fill="#FFCD00" opacity="0.8" />

      <defs>
        <filter id="bShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>
    </svg>
  );
}
