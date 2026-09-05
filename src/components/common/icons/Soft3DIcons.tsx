/**
 * 교회이음 Color Leather Premium 3D Icons
 * Soft leather tile · stitch border · gold highlight · warm depth
 */
import { useId, type ComponentType, type ReactNode } from 'react';
import type { MenuIconKey } from '../../../config/menuIconMap';

export type Soft3DIconProps = {
  size?: number;
  className?: string;
  active?: boolean;
};

type IconSvgProps = Soft3DIconProps & { title?: string };

type LeatherPalette = {
  base: string;
  mid: string;
  dark: string;
  light: string;
};

/** Soft clay leather — bright midtones, never heavy brown wash */
const PALETTE: Record<string, LeatherPalette> = {
  brown: { base: '#A66B3D', mid: '#C48955', dark: '#6B3F22', light: '#E8C49A' },
  coral: { base: '#F08A7C', mid: '#F5A89E', dark: '#D46A5C', light: '#FBD4CE' },
  pink: { base: '#F28AA8', mid: '#F7A8BE', dark: '#D86A88', light: '#FCD4E0' },
  yellow: { base: '#EBC05A', mid: '#F3D078', dark: '#D4A63A', light: '#FFF0B8' },
  green: { base: '#5CBC80', mid: '#7AD098', dark: '#3A9A5E', light: '#C8F0D6' },
  blue: { base: '#6B9AF0', mid: '#8CB0F5', dark: '#4A78D8', light: '#D0E0FC' },
  purple: { base: '#A890E4', mid: '#BFA8EC', dark: '#8870C8', light: '#E6DAF8' },
  teal: { base: '#4CC4B4', mid: '#6ED4C6', dark: '#34A090', light: '#C4F0E8' },
  orange: { base: '#F2B06A', mid: '#F6C488', dark: '#E08848', light: '#FCE0C0' },
  gray: { base: '#A8A098', mid: '#C0B8B0', dark: '#7A726A', light: '#E8E2DC' },
  mix: { base: '#5CBC80', mid: '#6B9AF0', dark: '#3A9A5E', light: '#C8F0D6' },
};

function LeatherShell({
  size = 56,
  className = '',
  children,
  title,
  palette,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
  title?: string;
  palette: LeatherPalette;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`leather-icon-3d select-none pointer-events-none ${className}`}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`${uid}-leather`} x1="12" y1="4" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="48%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.base} />
        </linearGradient>
        <linearGradient id={`${uid}-gloss`} x1="16" y1="8" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${uid}-drop`} x="-35%" y="-25%" width="170%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#8A542F" floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter={`url(#${uid}-drop)`}>
        <rect x="6" y="6" width="52" height="52" rx="15" fill={`url(#${uid}-leather)`} />
        {/* soft stitch */}
        <rect
          x="11"
          y="11"
          width="42"
          height="42"
          rx="12"
          fill="none"
          stroke="#FFF9F2"
          strokeOpacity="0.62"
          strokeWidth="1.35"
          strokeDasharray="2.6 2.4"
        />
        {/* gold edge accent */}
        <rect
          x="7.5"
          y="7.5"
          width="49"
          height="49"
          rx="14"
          fill="none"
          stroke="#E7B447"
          strokeOpacity="0.4"
          strokeWidth="1.1"
        />
        <ellipse cx="24" cy="19" rx="15" ry="9" fill={`url(#${uid}-gloss)`} />
        {children}
      </g>
    </svg>
  );
}

function GoldCross({ x = 28, y = 20, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="3.5" y="0" width="3.5" height="16" rx="1" fill="#E7B447" />
      <rect x="0" y="4" width="10.5" height="3.5" rx="1" fill="#F5D56A" />
    </g>
  );
}

export function IconHome({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.yellow}>
      <path d="M18 34L32 22l14 12v14a3 3 0 01-3 3H21a3 3 0 01-3-3V34z" fill="#FFF9F2" opacity="0.95" />
      <rect x="27" y="38" width="10" height="11" rx="1.5" fill="#8A542F" />
      <rect x="21" y="34" width="6" height="6" rx="1" fill="#E7B447" opacity="0.85" />
      <rect x="37" y="34" width="6" height="6" rx="1" fill="#E7B447" opacity="0.85" />
    </LeatherShell>
  );
}

export function IconSermon({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.brown}>
      <rect x="20" y="16" width="24" height="32" rx="3" fill="#4A2B1A" opacity="0.35" />
      <rect x="22" y="18" width="20" height="28" rx="2.5" fill="#FFF5E8" />
      <GoldCross x="27" y="24" scale={0.9} />
      <path d="M46 22v20" stroke="#C45A4C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 22c3 0 5 2 5 5" stroke="#C45A4C" strokeWidth="2" fill="none" />
    </LeatherShell>
  );
}

export function IconGrace({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.coral}>
      {/* praying hands — soft clay */}
      <ellipse cx="24" cy="36" rx="8" ry="12" fill="#FFF9F2" transform="rotate(-10 24 36)" />
      <ellipse cx="40" cy="36" rx="8" ry="12" fill="#FFEDE8" transform="rotate(10 40 36)" />
      <path d="M28 20c0-3 2-6 4-8 2 2 4 5 4 8" stroke="#E7B447" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="14" r="2.5" fill="#E7B447" />
    </LeatherShell>
  );
}

export function IconAnnouncement({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.yellow}>
      <path
        d="M16 30c0-2 1.4-3.2 3.2-3.2H28l14-7v24l-14-7H19.2C17.4 36.8 16 35.6 16 33.6V30z"
        fill="#FFF9F2"
      />
      <circle cx="46" cy="32" r="6" fill="#8A542F" opacity="0.85" />
      <path d="M52 24c2.5 2.5 4 6 4 8.5S54.5 37 52 39.5" stroke="#FFF9F2" strokeWidth="2" strokeLinecap="round" fill="none" />
    </LeatherShell>
  );
}

export function IconBulletin({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.green}>
      <rect x="20" y="14" width="24" height="36" rx="3" fill="#FFF9F2" />
      <rect x="24" y="20" width="16" height="2.5" rx="1" fill="#2E8A4F" opacity="0.7" />
      <rect x="24" y="27" width="14" height="2" rx="1" fill="#2E8A4F" opacity="0.45" />
      <rect x="24" y="33" width="12" height="2" rx="1" fill="#2E8A4F" opacity="0.35" />
      <rect x="24" y="39" width="10" height="2" rx="1" fill="#2E8A4F" opacity="0.28" />
    </LeatherShell>
  );
}

export function IconSchedule({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.blue}>
      <rect x="16" y="18" width="32" height="30" rx="5" fill="#FFF9F2" />
      <rect x="16" y="18" width="32" height="10" rx="5" fill="#3D6FD4" />
      <rect x="16" y="24" width="32" height="4" fill="#3D6FD4" />
      <text x="32" y="42" textAnchor="middle" fill="#3D6FD4" fontSize="14" fontWeight="700" fontFamily="Pretendard, sans-serif">
        31
      </text>
      <rect x="22" y="14" width="4" height="8" rx="2" fill="#FFF9F2" />
      <rect x="38" y="14" width="4" height="8" rx="2" fill="#FFF9F2" />
    </LeatherShell>
  );
}

export function IconPrayer({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.pink}>
      <ellipse cx="24" cy="36" rx="8" ry="12" fill="#FFF5E8" transform="rotate(-10 24 36)" />
      <ellipse cx="40" cy="36" rx="8" ry="12" fill="#FFE9D6" transform="rotate(10 40 36)" />
      <path d="M28 20c0-3 2-6 4-8 2 2 4 5 4 8" stroke="#E7B447" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="14" r="2.5" fill="#E7B447" />
    </LeatherShell>
  );
}

export function IconAlbum({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.purple}>
      <rect x="16" y="20" width="32" height="24" rx="4" fill="#FFF9F2" />
      <circle cx="32" cy="32" r="7" fill="#7A5CC4" opacity="0.85" />
      <circle cx="32" cy="32" r="4" fill="#DED0F5" />
      <circle cx="42" cy="26" r="2.5" fill="#E7B447" />
    </LeatherShell>
  );
}

export function IconBible({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.brown}>
      <rect x="18" y="14" width="28" height="36" rx="3" fill="#4A2B1A" opacity="0.45" />
      <rect x="20" y="16" width="24" height="32" rx="2.5" fill="#6B3F22" />
      <rect x="24" y="20" width="16" height="22" rx="1.5" fill="#FFF5E8" opacity="0.92" />
      <GoldCross x="27" y="26" />
      <path d="M44 18v28" stroke="#C45A4C" strokeWidth="2.2" strokeLinecap="round" />
    </LeatherShell>
  );
}

export function IconBiblePlan({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.teal}>
      <path d="M14 20c6-3 11-2 18 1v28c-7-3-12-4-18-1V20z" fill="#FFF9F2" opacity="0.95" />
      <path d="M50 20c-6-3-11-2-18 1v28c7-3 12-4 18-1V20z" fill="#E8FFF9" opacity="0.95" />
      <path d="M32 21v28" stroke="#2A9488" strokeWidth="1.5" opacity="0.5" />
      <GoldCross x="27.5" y="28" scale={0.85} />
    </LeatherShell>
  );
}

export function IconSharing({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.pink}>
      <path
        d="M32 42c0 0-9-6.5-9-14 0-4.5 3.5-7.5 7.5-7.5 2 0 3.7 1.1 4.5 2.8.8-1.7 2.5-2.8 4.5-2.8 4 0 7.5 3 7.5 7.5 0 7.5-9 14-9 14z"
        fill="#FFF9F2"
      />
      <circle cx="24" cy="44" r="5" fill="#FFF5E8" opacity="0.8" />
      <circle cx="40" cy="44" r="5" fill="#FFE9D6" opacity="0.8" />
    </LeatherShell>
  );
}

export function IconProfile({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.blue}>
      <circle cx="32" cy="26" r="8" fill="#FFF9F2" />
      <ellipse cx="32" cy="44" rx="12" ry="8" fill="#FFF9F2" />
    </LeatherShell>
  );
}

export function IconChurchInfo({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.purple}>
      <path d="M20 34L32 20l12 14v16H20V34z" fill="#FFF9F2" />
      <rect x="28" y="40" width="8" height="10" rx="1" fill="#7A5CC4" />
      <rect x="30" y="14" width="4" height="10" rx="1" fill="#E7B447" />
    </LeatherShell>
  );
}

export function IconStatistics({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.yellow}>
      <rect x="18" y="38" width="8" height="12" rx="2" fill="#FFF9F2" />
      <rect x="28" y="28" width="8" height="22" rx="2" fill="#FFF9F2" />
      <rect x="38" y="20" width="8" height="30" rx="2" fill="#FFF9F2" />
    </LeatherShell>
  );
}

export function IconOrg({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.mix}>
      <circle cx="32" cy="20" r="6" fill="#FFF9F2" />
      <circle cx="18" cy="42" r="6" fill="#5B8DEF" opacity="0.9" />
      <circle cx="46" cy="42" r="6" fill="#FFF9F2" />
      <path d="M32 26v6M32 32L20 38M32 32l12 6" stroke="#FFF9F2" strokeWidth="2.5" strokeLinecap="round" />
    </LeatherShell>
  );
}

export function IconClergy({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.blue}>
      <rect x="16" y="22" width="32" height="22" rx="4" fill="#FFF9F2" />
      <circle cx="26" cy="33" r="5" fill="#3D6FD4" />
      <rect x="34" y="29" width="10" height="2.5" rx="1" fill="#3D6FD4" opacity="0.7" />
      <rect x="34" y="35" width="8" height="2" rx="1" fill="#3D6FD4" opacity="0.4" />
      <rect x="26" y="16" width="12" height="8" rx="2" fill="#E7B447" />
    </LeatherShell>
  );
}

export function IconMembers({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.orange}>
      <circle cx="24" cy="26" r="7" fill="#FFF9F2" />
      <ellipse cx="24" cy="42" rx="10" ry="7" fill="#FFF9F2" />
      <circle cx="42" cy="28" r="6" fill="#FFE9D6" />
      <ellipse cx="42" cy="42" rx="9" ry="6" fill="#FFE9D6" />
    </LeatherShell>
  );
}

export function IconInvitations({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.orange}>
      <rect x="14" y="22" width="36" height="22" rx="4" fill="#FFF9F2" />
      <path d="M14 26l18 12 18-12" fill="#F5B478" />
      <path d="M14 26l18 12 18-12" stroke="#D4803A" strokeWidth="1.2" fill="none" opacity="0.5" />
    </LeatherShell>
  );
}

export function IconSettings({ size, className, title }: IconSvgProps) {
  return (
    <LeatherShell size={size} className={className} title={title} palette={PALETTE.gray}>
      <circle cx="32" cy="32" r="8" fill="#FFF9F2" />
      <circle cx="32" cy="32" r="3.5" fill="#6E665E" />
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <rect
          key={deg}
          x="29.5"
          y="14"
          width="5"
          height="9"
          rx="1.5"
          fill="#FFF9F2"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
    </LeatherShell>
  );
}

const ICON_MAP: Record<MenuIconKey, ComponentType<IconSvgProps>> = {
  home: IconHome,
  sermon: IconSermon,
  grace: IconGrace,
  announcement: IconAnnouncement,
  bulletin: IconBulletin,
  schedule: IconSchedule,
  prayer: IconPrayer,
  album: IconAlbum,
  bible: IconBible,
  biblePlan: IconBiblePlan,
  sharing: IconSharing,
  profile: IconProfile,
  churchInfo: IconChurchInfo,
  statistics: IconStatistics,
  org: IconOrg,
  clergy: IconClergy,
  members: IconMembers,
  invitations: IconInvitations,
  settings: IconSettings,
};

export function Soft3DIcon({
  iconKey,
  size = 56,
  className = '',
  active = false,
  title,
}: Soft3DIconProps & { iconKey: MenuIconKey; title?: string }) {
  const Comp = ICON_MAP[iconKey] ?? IconHome;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${active ? 'scale-105' : ''} ${className}`}
      style={{
        filter: active ? 'drop-shadow(0 0 8px rgba(231,180,71,0.45))' : undefined,
      }}
    >
      <Comp size={size} title={title} />
    </span>
  );
}

export function hasSoft3DIcon(key: MenuIconKey): boolean {
  return key in ICON_MAP;
}
