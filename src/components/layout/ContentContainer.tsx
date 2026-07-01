import type { ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'full';

const MAX_WIDTH_STYLES: Record<MaxWidth, string> = {
  sm:   'max-w-[640px]',
  md:   'max-w-[900px]',
  lg:   'max-w-[1200px]',
  full: 'max-w-none',
};

export type ContentContainerProps = {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
};

/**
 * Constrains page content width and centers it.
 * Default: 900px. Use maxWidth="full" on home dashboard if needed.
 */
export function ContentContainer({
  children,
  maxWidth = 'md',
  className = '',
}: ContentContainerProps) {
  return (
    <div
      className={[
        'w-full mx-auto',
        MAX_WIDTH_STYLES[maxWidth],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
