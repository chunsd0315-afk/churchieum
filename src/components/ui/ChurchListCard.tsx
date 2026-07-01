import type { ReactNode } from 'react';

export type ChurchListCardProps = {
  thumbnail?: string;
  badges?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
};

export function ChurchListCard({
  thumbnail,
  badges,
  title,
  description,
  meta,
  actions,
  onClick,
}: ChurchListCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={[
        'w-full flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-[20px]',
        'shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
        'transition-all duration-150 text-left',
        onClick ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="w-24 h-[72px] sm:w-[120px] sm:h-20 rounded-xl object-cover shrink-0"
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {badges && <div className="flex items-center gap-1.5 flex-wrap">{badges}</div>}
        <p className="font-bold text-gray-900 text-sm leading-snug truncate">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
        )}
        {meta && <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">{meta}</div>}
      </div>

      {/* Actions */}
      {actions && (
        <div className="shrink-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </Wrapper>
  );
}
