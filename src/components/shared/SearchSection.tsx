import { Search } from 'lucide-react';

export type FilterItem = { id: string; label: string };

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  filters?: FilterItem[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  className?: string;
};

export default function SearchSection({
  value,
  onChange,
  placeholder = '검색...',
  filters,
  activeFilter,
  onFilterChange,
  className = '',
}: Props) {
  const hasSearch = onChange !== undefined;
  const hasFilters = filters && filters.length > 0;
  if (!hasSearch && !hasFilters) return null;

  return (
    <div className={`${hasSearch && hasFilters ? 'space-y-3' : ''} ${className}`} style={{ marginBottom: '20px' }}>
      {hasSearch && (
        <div className="relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            style={{ left: '16px', width: '18px', height: '18px' }}
          />
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
            style={{ height: '48px', borderRadius: '16px', paddingLeft: '46px', paddingRight: '16px' }}
          />
        </div>
      )}
      {hasFilters && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {filters!.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={`px-3.5 text-sm font-semibold whitespace-nowrap shrink-0 border transition-all ${
                activeFilter === f.id
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
              }`}
              style={{ height: '38px', borderRadius: '999px' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
