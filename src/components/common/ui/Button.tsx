import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-primary-500 text-[#1A1A1A] shadow-btn-primary hover:bg-primary-600 hover:shadow-btn-primary-hover active:scale-[0.97] disabled:opacity-50',
  secondary: 'bg-white text-[#1A1A1A] border border-[#ECECEC] hover:bg-[#F5F5F5] active:scale-[0.97] disabled:opacity-50',
  outline:   'border border-[#ECECEC] text-[#1A1A1A] hover:bg-primary-50 active:scale-[0.97] disabled:opacity-50',
  ghost:     'text-gray-600 hover:bg-gray-100 active:scale-[0.97] disabled:opacity-50',
  danger:    'bg-error-500 text-white hover:bg-error-600 active:scale-[0.97] disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm gap-1.5',
  md: 'h-12 px-6 text-sm gap-2',
  lg: 'h-12 px-8 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-btn',
        'transition-[background-color,color,box-shadow,transform,border-color,opacity]',
        'duration-[var(--duration-base)] ease-[var(--ease-default)]',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
