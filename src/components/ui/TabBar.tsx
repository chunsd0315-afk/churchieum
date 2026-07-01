import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  /** Pass a Lucide/ComponentType — rendered as <Icon className="w-4 h-4" /> */
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

export type TabBarVariant = 'pill' | 'underline' | 'segment';

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: TabBarVariant;
  className?: string;
}

export function TabBar({ tabs, activeTab, onChange, variant = 'pill', className = '' }: TabBarProps) {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-gray-200 ${className}`}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px',
                'transition-[color,border-color] duration-[var(--duration-base)]',
                isActive
                  ? 'text-primary-600 border-primary-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'segment') {
    return (
      <div className={`flex bg-gray-100 rounded-xl p-1 gap-1 ${className}`}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg',
                'text-sm font-semibold transition-[background-color,color,box-shadow]',
                'duration-[var(--duration-base)] ease-[var(--ease-default)]',
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pill
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              'flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap shrink-0',
              'transition-[background-color,color] duration-[var(--duration-base)]',
              isActive
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800',
            ].join(' ')}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
