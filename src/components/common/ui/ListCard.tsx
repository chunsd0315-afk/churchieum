import React from 'react';
import { Pin } from 'lucide-react';
import { CHURCH_LIST_ROW_CLASS } from './ChurchList';

export interface ListCardProps {
  thumbnail?: string | null;
  thumbnailAlt?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  pinned?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListCard({
  thumbnail,
  thumbnailAlt,
  title,
  subtitle,
  meta,
  badges,
  actions,
  pinned,
  onClick,
  className = '',
}: ListCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { type: 'button' as const, onClick }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        CHURCH_LIST_ROW_CLASS,
        'flex items-start gap-3 rounded-none shadow-none border-0',
        onClick ? 'cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {thumbnail && (
        <div className="shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-xl overflow-hidden bg-gray-100">
          <img src={thumbnail} alt={thumbnailAlt ?? title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {badges && <div className="flex flex-wrap gap-1">{badges}</div>}
        <div className="flex items-start gap-1">
          {pinned && <Pin size={12} className="text-primary-500 shrink-0 mt-1" />}
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</p>
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 leading-normal line-clamp-2">{subtitle}</p>
        )}
        {meta && <p className="text-xs text-gray-400 mt-0.5">{meta}</p>}
      </div>

      {actions && (
        <div
          className="shrink-0 flex items-center"
          onClick={e => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </Wrapper>
  );
}
