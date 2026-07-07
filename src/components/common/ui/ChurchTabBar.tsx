import type { ReactNode } from 'react';

// ─── ChurchTabBar ─────────────────────────────────────────────────────────────

export type ChurchTab = {
  id: string;
  label: string;
  count?: number;
};

export type ChurchTabBarProps = {
  tabs: ChurchTab[];
  activeTab: string;
  onChange: (id: string) => void;
};

export function ChurchTabBar({ tabs, activeTab, onChange }: ChurchTabBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tabs.map(tab => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'h-10 px-4 rounded-full text-sm font-semibold transition-all duration-150 flex items-center gap-1.5',
              active
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={[
                  'text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
                ].join(' ')}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── ChurchFilterChip ─────────────────────────────────────────────────────────

export type ChurchFilterChipProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export function ChurchFilterChip({ children, active = false, onClick }: ChurchFilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'h-[38px] px-3.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap',
        active
          ? 'bg-primary-500 text-white shadow-sm'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
