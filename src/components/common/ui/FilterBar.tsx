export interface FilterItem {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  filters: FilterItem[];
  activeFilter: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FilterBar({ filters, activeFilter, onChange, className = '' }: FilterBarProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 ${className}`}>
      {filters.map(filter => {
        const isActive = filter.id === activeFilter;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={[
              'flex items-center gap-1 px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap shrink-0',
              'transition-[background-color,color] duration-[var(--duration-base)]',
              isActive
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800',
            ].join(' ')}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className={`text-[10px] px-1 rounded font-bold ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
