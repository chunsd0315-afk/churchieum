import type { NavIcon } from '../../types/icons';

export type TabItem = {
  id: string;
  label: string;
  icon?: NavIcon;
  badge?: number;
};

type Props = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
};

export default function TabSection({ tabs, activeTab, onTabChange, className = '' }: Props) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`} style={{ marginBottom: '20px' }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 whitespace-nowrap shrink-0 rounded-full border text-sm font-semibold ${
              isActive
                ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
            style={{ height: '40px', transition: 'background-color 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease' }}
          >
            {Icon && (
              <Icon className={`shrink-0 w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
