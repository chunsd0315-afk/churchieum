import React from 'react';

export interface ContentContainerProps {
  /** Override max-width. Defaults to design system standard: 900px */
  maxWidth?: string;
  /** Horizontal + vertical padding. Defaults to design system standard: 28px */
  padding?: string | number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Standard page content well.
 * max-width: 900px  |  margin: auto  |  padding: 28px
 * Use this as the outermost wrapper inside every page component.
 */
export function ContentContainer({
  maxWidth = '900px',
  padding = '28px',
  className = '',
  children,
}: ContentContainerProps) {
  const paddingValue = typeof padding === 'number' ? `${padding}px` : padding;
  return (
    <div
      className={`w-full mx-auto ${className}`}
      style={{ maxWidth, padding: paddingValue }}
    >
      {children}
    </div>
  );
}
