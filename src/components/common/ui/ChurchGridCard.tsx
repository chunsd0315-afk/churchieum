import type { ReactNode } from 'react';

export type ChurchGridCardProps = {
  image?: string;
  badges?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
};

export function ChurchGridCard({
  image,
  badges,
  title,
  description,
  meta,
  actions,
  onClick,
}: ChurchGridCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={[
        'w-full flex flex-col bg-white border border-gray-200 rounded-[20px] overflow-hidden',
        'shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
        'transition-all duration-150 text-left',
        onClick ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Image */}
      {image && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        {badges && <div className="flex items-center gap-1.5 flex-wrap">{badges}</div>}
        <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
        )}
        {(meta || actions) && (
          <div className="flex items-center justify-between gap-2 mt-auto pt-1">
            {meta && <div className="flex items-center gap-2 text-xs text-gray-400">{meta}</div>}
            {actions && (
              <div className="shrink-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
