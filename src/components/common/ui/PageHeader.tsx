import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, onBack, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800
                     transition-[background-color,color] duration-[var(--duration-base)] shrink-0"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
