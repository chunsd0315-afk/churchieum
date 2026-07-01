import type { ReactNode } from 'react';

export type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Outer page wrapper — sets background and responsive padding.
 * PC:     padding 28px, min-height calc(100vh - 64px)
 * Mobile: padding 16px, min-height calc(100vh - 64px)
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={[
        'bg-[#F8FAFC] min-h-[calc(100vh-64px)]',
        'px-4 py-4 sm:px-7 sm:py-7',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
