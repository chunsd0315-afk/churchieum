import React from 'react';

export interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Section({ title, subtitle, action, padding = false, className = '', children }: SectionProps) {
  return (
    <section className={`${padding ? 'px-4' : ''} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && (
              <h2 className="text-base font-bold text-gray-900 leading-snug">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
