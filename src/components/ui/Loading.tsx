import React from 'react';
import { Loader2 } from 'lucide-react';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingProps {
  size?: LoadingSize;
  color?: 'primary' | 'white' | 'gray';
  fullPage?: boolean;
  label?: string;
  className?: string;
}

const sizeMap: Record<LoadingSize, number> = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 };

const colorClasses: Record<NonNullable<LoadingProps['color']>, string> = {
  primary: 'text-primary-500',
  white:   'text-white',
  gray:    'text-gray-400',
};

export function Loading({ size = 'md', color = 'primary', fullPage = false, label, className = '' }: LoadingProps) {
  const iconSize = sizeMap[size];

  const inner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 size={iconSize} className={`animate-spin ${colorClasses[color]}`} />
      {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-overlay flex items-center justify-center bg-white/70 backdrop-blur-sm">
        {inner}
      </div>
    );
  }

  return inner;
}

export function LoadingOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-raised flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-inherit">
      <Loading size="md" label={label} />
    </div>
  );
}
