import { Filter, Search, X } from 'lucide-react';
import { SharedContentFilterChips, type SharedContentFilterChip } from './SharedContentFilterChips';

export type SharedContentListToolbarProps = {
  search: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  onOpenDetailSettings: () => void;
  activeFilterCount: number;
  chips?: SharedContentFilterChip[];
  onResetFilters?: () => void;
  className?: string;
};

export function SharedContentListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = '제목, 내용, 작성자 검색',
  onOpenDetailSettings,
  activeFilterCount,
  chips = [],
  onResetFilters,
  className = '',
}: SharedContentListToolbarProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 text-sm bg-white focus:border-primary-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 touch-target"
              aria-label="검색어 지우기"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenDetailSettings}
          aria-label="상세설정"
          className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold touch-target min-h-[48px] min-w-[88px] ${
            activeFilterCount > 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Filter className="w-4 h-4" aria-hidden />
          상세설정
          {activeFilterCount > 0 && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <SharedContentFilterChips chips={chips} onResetAll={onResetFilters} />
    </div>
  );
}
