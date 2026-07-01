import React from 'react';

export type BadgeVariant =
  | 'blue' | 'green' | 'orange' | 'purple' | 'red'
  | 'yellow' | 'gray' | 'teal' | 'primary';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-700',
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-green-100 text-green-700',
  orange:  'bg-orange-100 text-orange-700',
  purple:  'bg-purple-100 text-purple-700',
  red:     'bg-red-100 text-red-600',
  yellow:  'bg-yellow-100 text-yellow-700',
  gray:    'bg-gray-100 text-gray-600',
  teal:    'bg-teal-100 text-teal-700',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  blue:    'bg-blue-500',
  green:   'bg-green-500',
  orange:  'bg-orange-500',
  purple:  'bg-purple-500',
  red:     'bg-red-500',
  yellow:  'bg-yellow-500',
  gray:    'bg-gray-400',
  teal:    'bg-teal-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-[11px]',
};

export function Badge({ variant = 'gray', size = 'md', dot = false, className = '', children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-semibold rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
