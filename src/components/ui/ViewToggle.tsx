import React from 'react';
import { LayoutList, LayoutGrid, Table2 } from 'lucide-react';

export type ViewMode = 'list' | 'grid' | 'table';

export interface ViewToggleProps {
  modes?: ViewMode[];
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const modeConfig: Record<ViewMode, { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = {
  list:  { icon: LayoutList, label: '리스트 보기' },
  grid:  { icon: LayoutGrid, label: '그리드 보기' },
  table: { icon: Table2,    label: '테이블 보기' },
};

export function ViewToggle({ modes = ['list', 'grid'], value, onChange, className = '' }: ViewToggleProps) {
  if (modes.length < 2) return null;

  return (
    <div className={`flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 ${className}`}>
      {modes.map(mode => {
        const { icon: Icon, label } = modeConfig[mode];
        const isActive = mode === value;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            title={label}
            className={[
              'flex items-center justify-center w-8 h-7 rounded-md',
              'transition-[background-color,color,box-shadow] duration-[var(--duration-base)]',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
