import type { ReactNode } from 'react';

export type ChurchToolbarProps = {
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
};

export function ChurchToolbar({ left, right, children }: ChurchToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
      {left && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {left}
        </div>
      )}
      {children}
      {right && (
        <div className="flex items-center gap-2 shrink-0">
          {right}
        </div>
      )}
    </div>
  );
}
