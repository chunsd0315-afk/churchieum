/**
 * 교회이음 Soft-3D Premium Icons
 * Style: matte plastic / ceramic / soft clay — Apple × Clay × Glass
 * Unified lighting, soft shadow, subtle gloss. Not toy-like, not photoreal.
 */
import { useId, type ComponentType, type ReactNode } from 'react';
import type { MenuIconKey } from '../../../config/menuIconMap';

export type Soft3DIconProps = {
  size?: number;
  className?: string;
  active?: boolean;
};

type IconSvgProps = Soft3DIconProps & { title?: string };

function SoftShell({
  size = 56,
  className = '',
  children,
  title,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <filter id={`${uid}-drop`} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.14" />
        </filter>
      </defs>
      <g filter={`url(#${uid}-drop)`}>{children}</g>
    </svg>
  );
}

/** Shared book body with soft depth */
function BookBody({
  cover,
  side,
  page = '#FFFEF8',
  cross,
}: {
  cover: string;
  side: string;
  page?: string;
  cross?: string;
}) {
  return (
    <>
      <rect x="14" y="12" width="36" height="42" rx="5" fill={cover} />
      <path d="M14 16c0-2.2 1.8-4 4-4h32v4H14z" fill={side} opacity="0.55" />
      <rect x="18" y="16" width="4" height="34" rx="1.5" fill={side} opacity="0.7" />
      <rect x="26" y="18" width="20" height="28" rx="2" fill={page} opacity="0.92" />
      <rect x="28" y="22" width="14" height="2" rx="1" fill={cover} opacity="0.25" />
      <rect x="28" y="28" width="12" height="2" rx="1" fill={cover} opacity="0.18" />
      <rect x="28" y="34" width="10" height="2" rx="1" fill={cover} opacity="0.14" />
      {cross && (
        <g transform="translate(33, 24)">
          <rect x="4" y="0" width="3.5" height="14" rx="1" fill={cross} />
          <rect x="0" y="4" width="11.5" height="3.5" rx="1" fill={cross} />
        </g>
      )}
      <ellipse cx="28" cy="18" rx="10" ry="5" fill="#fff" opacity="0.28" />
    </>
  );
}

export function IconHome({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <path d="M12 30L32 14l20 16v22a4 4 0 01-4 4H16a4 4 0 01-4-4V30z" fill="#FFCD00" />
      <path d="M12 30L32 14l20 16" fill="#FFE566" />
      <rect x="26" y="38" width="12" height="14" rx="2" fill="#1A1A1A" opacity="0.75" />
      <rect x="18" y="34" width="8" height="8" rx="1.5" fill="#FFF7D6" />
      <rect x="38" y="34" width="8" height="8" rx="1.5" fill="#FFF7D6" />
      <ellipse cx="24" cy="22" rx="8" ry="4" fill="#fff" opacity="0.35" />
    </SoftShell>
  );
}

export function IconSermon({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <BookBody cover="#4A8CFF" side="#2F6FE0" cross="#FFCD00" />
    </SoftShell>
  );
}

export function IconGrace({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <BookBody cover="#7B6EF6" side="#5B4FD4" page="#F5F3FF" />
      <path
        d="M32 26c0 0-6 3.5-6 9 0 4.5 6 10 6 10s6-5.5 6-10c0-5.5-6-9-6-9z"
        fill="#FF5DA8"
      />
      <ellipse cx="29" cy="32" rx="2.5" ry="3" fill="#fff" opacity="0.4" />
    </SoftShell>
  );
}

export function IconAnnouncement({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <path
        d="M14 28c0-2 1.5-3.5 3.5-3.5H28l16-8v32l-16-8H17.5C15.5 40.5 14 39 14 37V28z"
        fill="#FFCD00"
      />
      <path d="M28 24.5v19" stroke="#E6B000" strokeWidth="2" opacity="0.5" />
      <circle cx="46" cy="32" r="7" fill="#FFE566" />
      <rect x="12" y="30" width="6" height="12" rx="2" fill="#E6B000" />
      <ellipse cx="24" cy="26" rx="8" ry="4" fill="#fff" opacity="0.35" />
      <path d="M52 22c3 3 4.5 7 4.5 10.5S55 40 52 43" stroke="#FF9D42" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
    </SoftShell>
  );
}

export function IconBulletin({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <rect x="16" y="10" width="32" height="44" rx="5" fill="#22C55E" />
      <rect x="20" y="14" width="24" height="36" rx="3" fill="#F0FDF4" />
      <rect x="24" y="20" width="16" height="3" rx="1.5" fill="#22C55E" opacity="0.55" />
      <rect x="24" y="28" width="14" height="2.5" rx="1.2" fill="#16A34A" opacity="0.35" />
      <rect x="24" y="34" width="12" height="2.5" rx="1.2" fill="#16A34A" opacity="0.28" />
      <rect x="24" y="40" width="10" height="2.5" rx="1.2" fill="#16A34A" opacity="0.22" />
      <ellipse cx="26" cy="16" rx="8" ry="4" fill="#fff" opacity="0.3" />
    </SoftShell>
  );
}

export function IconSchedule({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <rect x="12" y="16" width="40" height="36" rx="6" fill="#4A8CFF" />
      <rect x="12" y="16" width="40" height="12" rx="6" fill="#00BFA6" />
      <rect x="12" y="24" width="40" height="4" fill="#00BFA6" />
      <rect x="16" y="32" width="8" height="7" rx="1.5" fill="#E0F2FE" />
      <rect x="28" y="32" width="8" height="7" rx="1.5" fill="#FFCD00" />
      <rect x="40" y="32" width="8" height="7" rx="1.5" fill="#E0F2FE" />
      <rect x="16" y="42" width="8" height="7" rx="1.5" fill="#E0F2FE" />
      <rect x="28" y="42" width="8" height="7" rx="1.5" fill="#E0F2FE" />
      <rect x="20" y="12" width="5" height="10" rx="2.5" fill="#1E293B" opacity="0.7" />
      <rect x="39" y="12" width="5" height="10" rx="2.5" fill="#1E293B" opacity="0.7" />
      <ellipse cx="24" cy="20" rx="8" ry="3" fill="#fff" opacity="0.3" />
    </SoftShell>
  );
}

export function IconPrayer({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      {/* praying hands — soft clay */}
      <ellipse cx="24" cy="34" rx="10" ry="16" fill="#F5BE8A" transform="rotate(-12 24 34)" />
      <ellipse cx="40" cy="34" rx="10" ry="16" fill="#E8A870" transform="rotate(12 40 34)" />
      <ellipse cx="32" cy="28" rx="7" ry="10" fill="#F8D4A8" />
      <path d="M28 18c0-4 2-8 4-10 2 2 4 6 4 10" stroke="#FFCD00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="10" r="3" fill="#FFCD00" />
      <ellipse cx="26" cy="26" rx="4" ry="3" fill="#fff" opacity="0.35" />
    </SoftShell>
  );
}

export function IconAlbum({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <rect x="10" y="18" width="44" height="32" rx="7" fill="#FF5DA8" />
      <rect x="10" y="18" width="44" height="10" rx="7" fill="#FF7DB8" />
      <rect x="10" y="24" width="44" height="4" fill="#FF7DB8" />
      <circle cx="32" cy="36" r="10" fill="#1E293B" opacity="0.85" />
      <circle cx="32" cy="36" r="6.5" fill="#7DD3FC" />
      <circle cx="32" cy="36" r="3" fill="#1E293B" opacity="0.5" />
      <circle cx="46" cy="24" r="3" fill="#FFCD00" />
      <ellipse cx="22" cy="24" rx="7" ry="3" fill="#fff" opacity="0.35" />
    </SoftShell>
  );
}

export function IconBible({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <BookBody cover="#1E293B" side="#0F172A" page="#FFFBEA" cross="#FFCD00" />
    </SoftShell>
  );
}

export function IconBiblePlan({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      {/* open bible */}
      <path d="M10 18c8-4 14-2 22 2v32c-8-4-14-6-22-2V18z" fill="#22C55E" />
      <path d="M54 18c-8-4-14-2-22 2v32c8-4 14-6 22-2V18z" fill="#16A34A" />
      <path d="M32 20v32" stroke="#14532D" strokeWidth="2" opacity="0.4" />
      <rect x="14" y="26" width="12" height="2" rx="1" fill="#fff" opacity="0.45" />
      <rect x="14" y="32" width="10" height="2" rx="1" fill="#fff" opacity="0.3" />
      <rect x="38" y="26" width="12" height="2" rx="1" fill="#fff" opacity="0.35" />
      <rect x="38" y="32" width="10" height="2" rx="1" fill="#fff" opacity="0.25" />
      <g transform="translate(28, 28)">
        <rect x="3" y="0" width="2.5" height="10" rx="1" fill="#FFCD00" />
        <rect x="0" y="3" width="8.5" height="2.5" rx="1" fill="#FFCD00" />
      </g>
      <ellipse cx="20" cy="22" rx="6" ry="3" fill="#fff" opacity="0.25" />
    </SoftShell>
  );
}

export function IconSharing({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <ellipse cx="22" cy="40" rx="12" ry="8" fill="#F5BE8A" />
      <ellipse cx="42" cy="40" rx="12" ry="8" fill="#E8A870" />
      <path
        d="M32 18c0 0-8 4-8 12 0 6 8 14 8 14s8-8 8-14c0-8-8-12-8-12z"
        fill="#FF5DA8"
      />
      <ellipse cx="28" cy="26" rx="3" ry="4" fill="#fff" opacity="0.4" />
    </SoftShell>
  );
}

export function IconProfile({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <circle cx="32" cy="32" r="22" fill="#4A8CFF" />
      <circle cx="32" cy="26" r="9" fill="#DBEAFE" />
      <ellipse cx="32" cy="46" rx="14" ry="10" fill="#DBEAFE" />
      <ellipse cx="26" cy="20" rx="6" ry="3" fill="#fff" opacity="0.35" />
    </SoftShell>
  );
}

export function IconChurchInfo({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <path d="M18 28L32 14l14 14v24H18V28z" fill="#7B6EF6" />
      <rect x="22" y="30" width="20" height="22" fill="#EDE9FE" />
      <rect x="28" y="40" width="8" height="12" rx="1.5" fill="#5B4FD4" />
      <rect x="24" y="34" width="6" height="6" rx="1" fill="#C4B5FD" />
      <rect x="34" y="34" width="6" height="6" rx="1" fill="#C4B5FD" />
      <rect x="30" y="10" width="4" height="10" rx="1" fill="#FFCD00" />
      <circle cx="32" cy="9" r="3" fill="#FFE566" />
      <ellipse cx="26" cy="22" rx="6" ry="3" fill="#fff" opacity="0.3" />
    </SoftShell>
  );
}

export function IconStatistics({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <rect x="12" y="14" width="40" height="38" rx="6" fill="#F5F5F5" />
      <rect x="18" y="36" width="8" height="12" rx="2" fill="#4A8CFF" />
      <rect x="28" y="26" width="8" height="22" rx="2" fill="#22C55E" />
      <rect x="38" y="20" width="8" height="28" rx="2" fill="#FFCD00" />
      <ellipse cx="22" cy="20" rx="6" ry="3" fill="#fff" opacity="0.5" />
    </SoftShell>
  );
}

export function IconOrg({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <circle cx="32" cy="18" r="8" fill="#4A8CFF" />
      <circle cx="16" cy="42" r="8" fill="#7B6EF6" />
      <circle cx="48" cy="42" r="8" fill="#00BFA6" />
      <path d="M32 26v6M32 32L18 36M32 32l14 4" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="16" r="3" fill="#fff" opacity="0.35" />
    </SoftShell>
  );
}

export function IconClergy({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      {/* name badge */}
      <rect x="10" y="18" width="44" height="30" rx="6" fill="#1E293B" />
      <rect x="14" y="22" width="36" height="22" rx="4" fill="#FFFBEA" />
      <circle cx="24" cy="33" r="6" fill="#4A8CFF" />
      <rect x="33" y="28" width="14" height="3" rx="1.5" fill="#1E293B" opacity="0.5" />
      <rect x="33" y="34" width="10" height="2.5" rx="1.2" fill="#9CA3AF" opacity="0.6" />
      <rect x="26" y="12" width="12" height="8" rx="2" fill="#FFCD00" />
      <ellipse cx="20" cy="24" rx="6" ry="3" fill="#fff" opacity="0.2" />
    </SoftShell>
  );
}

export function IconMembers({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <circle cx="24" cy="24" r="9" fill="#4A8CFF" />
      <ellipse cx="24" cy="44" rx="12" ry="9" fill="#4A8CFF" />
      <circle cx="42" cy="26" r="8" fill="#7B6EF6" />
      <ellipse cx="42" cy="44" rx="11" ry="8" fill="#7B6EF6" />
      <ellipse cx="20" cy="20" rx="4" ry="2.5" fill="#fff" opacity="0.35" />
    </SoftShell>
  );
}

export function IconInvitations({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <rect x="10" y="20" width="44" height="28" rx="5" fill="#FF9D42" />
      <path d="M10 24l22 14 22-14" fill="#FFB36B" />
      <path d="M10 24l22 14 22-14" stroke="#E07A20" strokeWidth="1.5" fill="none" opacity="0.4" />
      <ellipse cx="22" cy="26" rx="8" ry="3" fill="#fff" opacity="0.3" />
    </SoftShell>
  );
}

export function IconSettings({ size, className, title }: IconSvgProps) {
  return (
    <SoftShell size={size} className={className} title={title}>
      <circle cx="32" cy="32" r="12" fill="#9CA3AF" />
      <circle cx="32" cy="32" r="6" fill="#F5F5F5" />
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <rect
          key={deg}
          x="29"
          y="8"
          width="6"
          height="12"
          rx="2"
          fill="#9CA3AF"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      <ellipse cx="28" cy="26" rx="4" ry="2.5" fill="#fff" opacity="0.35" />
    </SoftShell>
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
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 ${
        active ? 'scale-105' : ''
      } ${className}`}
      style={{
        filter: active ? 'drop-shadow(0 0 6px rgba(255,205,0,0.45))' : undefined,
      }}
    >
      <Comp size={size} title={title} />
    </span>
  );
}

export function hasSoft3DIcon(key: MenuIconKey): boolean {
  return key in ICON_MAP;
}
