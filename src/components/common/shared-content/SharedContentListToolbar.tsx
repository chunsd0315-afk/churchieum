import { ContentListToolbar } from '../ui/ContentListToolbar';
import { SharedContentFilterChips, type SharedContentFilterChip } from './SharedContentFilterChips';
import type { ContentViewMode } from '../ui/ViewModeToggle';

export type SharedContentListToolbarProps = {
  search: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  onOpenDetailSettings: () => void;
  detailSettingsActive?: boolean;
  activeFilterCount: number;
  chips?: SharedContentFilterChip[];
  onResetFilters?: () => void;
  className?: string;
  viewMode?: ContentViewMode;
  onViewModeChange?: (mode: ContentViewMode) => void;
};

export function SharedContentListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = '제목, 내용, 작성자 검색',
  onOpenDetailSettings,
  detailSettingsActive = false,
  activeFilterCount,
  chips = [],
  onResetFilters,
  className = '',
  viewMode,
  onViewModeChange,
}: SharedContentListToolbarProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <ContentListToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        onOpenDetailSettings={onOpenDetailSettings}
        detailSettingsActive={detailSettingsActive}
        activeFilterCount={activeFilterCount}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
      <SharedContentFilterChips chips={chips} onResetAll={onResetFilters} />
    </div>
  );
}
