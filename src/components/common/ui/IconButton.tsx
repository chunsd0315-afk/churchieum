import React from 'react';

export type IconButtonVariant = 'default' | 'ghost' | 'primary' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
  ghost:   'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
  primary: 'text-primary-500 hover:bg-primary-50 hover:text-primary-600',
  danger:  'text-red-400 hover:bg-red-50 hover:text-red-600',
};

const sizeClasses: Record<IconButtonSize, { btn: string; icon: number }> = {
  sm: { btn: 'w-7 h-7',   icon: 14 },
  md: { btn: 'w-9 h-9',   icon: 18 },
  lg: { btn: 'w-11 h-11', icon: 20 },
};

export function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const { btn } = sizeClasses[size];
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      aria-label={label}
      title={label}
      className={[
        `${btn} inline-flex items-center justify-center rounded-lg`,
        'transition-[background-color,color] duration-[var(--duration-base)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {icon}
    </button>
  );
}
