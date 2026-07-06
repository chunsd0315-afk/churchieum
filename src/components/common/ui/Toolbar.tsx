import React from 'react';

export interface ToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function Toolbar({ left, right, children, className = '', sticky = false }: ToolbarProps) {
  return (
    <div
      className={[
        'flex items-center gap-3',
        sticky ? 'sticky top-0 z-sticky bg-[var(--color-bg-page)] py-3 -mx-0' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {left && <div className="flex items-center gap-2 shrink-0">{left}</div>}
      {children && <div className="flex-1 min-w-0">{children}</div>}
      {right && <div className="flex items-center gap-2 shrink-0 ml-auto">{right}</div>}
    </div>
  );
}
