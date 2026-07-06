import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  padding?: CardPadding;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({
  padding = 'md',
  hover = false,
  onClick,
  className = '',
  children,
}: CardProps) {
  const base = [
    'bg-white border border-gray-200 rounded-card',
    'shadow-card-md',
    paddingClasses[padding],
    hover || onClick
      ? 'cursor-pointer transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-card-hover'
      : '',
    className,
  ].filter(Boolean).join(' ');

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} w-full text-left`}>
        {children}
      </button>
    );
  }

  return <div className={base}>{children}</div>;
}
