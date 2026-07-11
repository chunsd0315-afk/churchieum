/** SVG 배너 장식 — 교회·나무·하트·비둘기·구름 (3D 클레이 스타일) */
export function BannerSceneIllustration() {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden
    >
      {/* 구름 */}
      <ellipse cx="220" cy="28" rx="38" ry="16" fill="white" opacity="0.85" />
      <ellipse cx="248" cy="32" rx="28" ry="12" fill="white" opacity="0.7" />
      <ellipse cx="196" cy="34" rx="22" ry="10" fill="white" opacity="0.6" />

      {/* 나무 */}
      <circle cx="52" cy="118" r="18" fill="#22C55E" filter="url(#bShadow)" />
      <circle cx="68" cy="112" r="14" fill="#4ADE80" />
      <rect x="58" y="118" width="8" height="16" rx="3" fill="#92400E" />

      {/* 교회 건물 */}
      <g filter="url(#bShadow)">
        <path d="M118 52L158 72V130H98V72L118 52Z" fill="#3B82F6" />
        <path d="M108 72H168V130H108V72Z" fill="#F8FAFC" />
        <rect x="124" y="98" width="28" height="32" rx="3" fill="#1D4ED8" />
        <rect x="114" y="82" width="14" height="14" rx="2" fill="#DBEAFE" />
        <rect x="148" y="82" width="14" height="14" rx="2" fill="#DBEAFE" />
        <rect x="126" y="58" width="12" height="18" rx="2" fill="#FBBF24" />
        <circle cx="132" cy="54" r="4" fill="#FDE68A" />
      </g>

      {/* 비둘기 */}
      <g transform="translate(178, 38)">
        <ellipse cx="16" cy="20" rx="14" ry="10" fill="white" filter="url(#bShadow)" />
        <circle cx="22" cy="14" r="7" fill="white" />
        <path d="M8 18C4 14 2 8 6 6C10 4 14 8 16 12" fill="#E2E8F0" />
        <circle cx="24" cy="13" r="1.5" fill="#374151" />
        <path d="M26 15L30 14" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* 하트 */}
      <g transform="translate(210, 100)" filter="url(#bShadow)">
        <path
          d="M16 8C16 8 8 12 8 20C8 26 16 34 16 34C16 34 24 26 24 20C24 12 16 8 16 8Z"
          fill="#EF4444"
        />
        <ellipse cx="12" cy="16" rx="4" ry="5" fill="#FCA5A5" opacity="0.5" />
      </g>

      {/* 작은 나무 */}
      <circle cx="238" cy="120" r="12" fill="#16A34A" filter="url(#bShadow)" />
      <rect x="234" y="120" width="6" height="12" rx="2" fill="#78350F" />

      <defs>
        <filter id="bShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>
    </svg>
  );
}
