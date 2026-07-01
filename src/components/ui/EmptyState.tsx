import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-5">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-gray-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button variant={action.variant ?? 'primary'} size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
