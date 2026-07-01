import type { ReactNode } from 'react';
import { LayoutGrid } from 'lucide-react';

export type ChurchEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function ChurchEmptyState({
  icon,
  title,
  description,
  action,
}: ChurchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 bg-white border border-dashed border-gray-200 rounded-[20px]">
      <div className="mb-4 text-gray-300">
        {icon ?? <LayoutGrid className="w-10 h-10" />}
      </div>
      <p className="text-base font-bold text-gray-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 leading-relaxed mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
