import React from 'react';
import { Plus } from 'lucide-react';

export type FloatingButtonPosition =
  | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface FloatingButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: FloatingButtonPosition;
  className?: string;
}

const positionClasses: Record<FloatingButtonPosition, string> = {
  'bottom-right':  'bottom-6 right-4 md:right-6',
  'bottom-left':   'bottom-6 left-4 md:left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
};

export function FloatingButton({
  onClick,
  icon = <Plus size={22} />,
  label,
  position = 'bottom-right',
  className = '',
}: FloatingButtonProps) {
  const isExtended = !!label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? '추가'}
      className={[
        'fixed z-toast shadow-overlay text-white bg-primary-500',
        'flex items-center justify-center gap-2',
        'transition-[transform,box-shadow,background-color] duration-[var(--duration-base)]',
        'hover:bg-primary-600 hover:scale-105 active:scale-95',
        isExtended ? 'px-5 h-14 rounded-full text-sm font-semibold' : 'w-14 h-14 rounded-full',
        positionClasses[position],
        className,
      ].join(' ')}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
