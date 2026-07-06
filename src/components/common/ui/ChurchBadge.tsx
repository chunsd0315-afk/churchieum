import type { ReactNode } from 'react';

export type ChurchBadgeColor = 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'red';

export type ChurchBadgeProps = {
  children: ReactNode;
  color?: ChurchBadgeColor;
};

const COLOR_STYLES: Record<ChurchBadgeColor, string> = {
  blue:   'bg-blue-50   text-blue-600',
  green:  'bg-emerald-50 text-emerald-700',
  purple: 'bg-violet-50 text-violet-700',
  orange: 'bg-orange-50 text-orange-600',
  gray:   'bg-gray-100  text-gray-600',
  red:    'bg-red-50    text-red-600',
};

export function ChurchBadge({ children, color = 'gray' }: ChurchBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap',
        COLOR_STYLES[color],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
