import { Search, X } from 'lucide-react';
import { DetailSettingsButton } from '../ui/DetailSettingsButton';
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
        <DetailSettingsButton
          onClick={onOpenDetailSettings}
          activeCount={activeFilterCount}
        />
      </div>

      <SharedContentFilterChips chips={chips} onResetAll={onResetFilters} />
    </div>
  );
}
