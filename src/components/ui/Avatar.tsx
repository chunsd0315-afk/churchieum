import React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; badge: string }> = {
  xs: { container: 'w-6 h-6',   text: 'text-[9px]',  badge: 'w-1.5 h-1.5 -right-px -bottom-px' },
  sm: { container: 'w-8 h-8',   text: 'text-xs',     badge: 'w-2 h-2 -right-px -bottom-px' },
  md: { container: 'w-10 h-10', text: 'text-sm',     badge: 'w-2.5 h-2.5 right-0 bottom-0' },
  lg: { container: 'w-12 h-12', text: 'text-base',   badge: 'w-3 h-3 right-0 bottom-0' },
  xl: { container: 'w-16 h-16', text: 'text-xl',     badge: 'w-3.5 h-3.5 right-0.5 bottom-0.5' },
};

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const bgPalette = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
];

function colorIndex(name?: string): number {
  if (!name) return 0;
  return name.charCodeAt(0) % bgPalette.length;
}

export function Avatar({ src, name, size = 'md', online, className = '' }: AvatarProps) {
  const { container, text, badge } = sizeClasses[size];
  const fallbackColor = bgPalette[colorIndex(name)];

  return (
    <div className={`relative inline-flex shrink-0 ${container} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name ?? '프로필'}
          className={`${container} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${container} rounded-full flex items-center justify-center font-semibold ${fallbackColor} ${text}`}
        >
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute ${badge} rounded-full ring-2 ring-white ${online ? 'bg-green-500' : 'bg-gray-300'}`}
        />
      )}
    </div>
  );
}
