import React from 'react';

export interface GridCardProps {
  image?: string | null;
  imageAlt?: string;
  imageHeight?: number;
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function GridCard({
  image,
  imageAlt,
  imageHeight = 160,
  title,
  subtitle,
  meta,
  badges,
  footer,
  actions,
  onClick,
  className = '',
}: GridCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick ? { type: 'button' as const, onClick } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        'w-full bg-white border border-gray-200 rounded-card overflow-hidden shadow-card-md text-left',
        onClick
          ? 'cursor-pointer transition-[transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99]'
          : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {image ? (
        <div
          className="w-full bg-gray-100 overflow-hidden"
          style={{ height: imageHeight }}
        >
          <img src={image} alt={imageAlt ?? title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="w-full bg-gradient-to-br from-primary-100 to-secondary-100"
          style={{ height: imageHeight }}
        />
      )}

      <div className="p-4 flex flex-col gap-1.5">
        {badges && <div className="flex flex-wrap gap-1">{badges}</div>}
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 leading-normal line-clamp-2">{subtitle}</p>
        )}
        {meta && <p className="text-xs text-gray-400">{meta}</p>}
        {(footer || actions) && (
          <div
            className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            {footer && <div className="flex-1 min-w-0">{footer}</div>}
            {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
