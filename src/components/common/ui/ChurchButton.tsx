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
  primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-btn-primary',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100',
  outline:   'bg-transparent text-primary-600 border border-primary-500 hover:bg-primary-50 active:bg-primary-100',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  danger:    'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-sm',
};

const SIZES: Record<ChurchButtonSize, string> = {
  sm: 'min-h-[48px] h-12 px-4 text-sm gap-1.5',
  md: 'min-h-[56px] h-14 px-6 text-base gap-2',
  lg: 'min-h-[56px] h-14 px-6 text-md gap-2.5',
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
        'inline-flex items-center justify-center font-bold rounded-btn transition-all select-none',
        'active:scale-[0.98] duration-moderate ease-out',
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
