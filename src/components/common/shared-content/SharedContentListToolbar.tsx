import { Search, X } from 'lucide-react';
import { DetailSettingsButton } from '../ui/DetailSettingsButton';
import { ViewModeToggle, type ContentViewMode } from '../ui/ViewModeToggle';
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
  /** 카드/목록 보기 — 있으면 상세설정 오른쪽에 표시 */
  viewMode?: ContentViewMode;
  onViewModeChange?: (mode: ContentViewMode) => void;
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
  viewMode,
  onViewModeChange,
}: SharedContentListToolbarProps) {
  const showViewToggle = viewMode != null && onViewModeChange != null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 text-sm bg-white min-h-[48px] focus:border-primary-400 focus:outline-none"
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
        <div className="flex items-center gap-2 shrink-0">
          <DetailSettingsButton
            onClick={onOpenDetailSettings}
            activeCount={activeFilterCount}
            className="flex-1 sm:flex-none"
          />
          {showViewToggle && (
            <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
          )}
        </div>
      </div>

      <SharedContentFilterChips chips={chips} onResetAll={onResetFilters} />
    </div>
  );
}
