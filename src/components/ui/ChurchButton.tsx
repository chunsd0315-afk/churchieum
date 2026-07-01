import type { ReactNode, ButtonHTMLAttributes } from 'react';

export type ChurchButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ChurchButtonSize    = 'sm' | 'md' | 'lg';

export type ChurchButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: ChurchButtonVariant;
  size?: ChurchButtonSize;
  icon?: ReactNode;
};

const VARIANTS: Record<ChurchButtonVariant, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100',
  outline:   'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 active:bg-blue-100',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
};

const SIZES: Record<ChurchButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-12 px-5 text-[15px] gap-2',
  lg: 'h-14 px-6 text-base gap-2',
};

export function ChurchButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...rest
}: ChurchButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center font-bold rounded-[14px] transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
