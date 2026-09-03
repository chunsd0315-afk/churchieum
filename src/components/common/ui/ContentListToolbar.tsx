import { Search, X } from 'lucide-react';
import { DetailSettingsButton } from './DetailSettingsButton';
import { ViewModeToggle, type ContentViewMode } from './ViewModeToggle';

export type ContentListToolbarProps = {
  search: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder: string;
  onOpenDetailSettings: () => void;
  /** 상세설정 패널 열림 */
  detailSettingsActive?: boolean;
  activeFilterCount?: number;
  viewMode?: ContentViewMode;
  onViewModeChange?: (mode: ContentViewMode) => void;
  className?: string;
};

/**
 * 앨범 기준 — 검색 + 상세설정 + 카드/목록 보기 공통 툴바
 * 은혜와 기도 · 공지사항 · 주보 · 앨범에서 동일하게 사용
 */
export function ContentListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  onOpenDetailSettings,
  detailSettingsActive = false,
  activeFilterCount = 0,
  viewMode,
  onViewModeChange,
  className = '',
}: ContentListToolbarProps) {
  const showViewToggle = viewMode != null && onViewModeChange != null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-12 min-h-[48px] pl-12 pr-12 rounded-[18px] border border-[#ECECEC] text-sm bg-white focus:border-primary-400 focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 touch-target"
              aria-label="검색어 지우기"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DetailSettingsButton
            onClick={onOpenDetailSettings}
            active={detailSettingsActive}
            activeCount={activeFilterCount}
            aria-expanded={detailSettingsActive}
            className="flex-1 sm:flex-none"
          />
          {showViewToggle ? (
            <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Soft-3D 콘텐츠 카드 — 앨범·주보·공지·은혜·나눔 공통 */
export const CONTENT_CARD_CLASS =
  'group bg-white rounded-[20px] border border-[#ECECEC] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out';

/**
 * PC 기본 4열 카드 그리드 (앨범 기준)
 * 모바일 1 · 태블릿 2 · ~lg 3 · xl+ 4
 */
export const CONTENT_CARD_GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

/** 앨범 모바일 2열 허용 */
export const CONTENT_CARD_GRID_ALBUM_CLASS =
  'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

/** 목록 컨테이너 — divide-y 연속 리스트 */
export const CONTENT_LIST_SHELL_CLASS =
  'divide-y divide-gray-100 bg-white rounded-[24px] border border-[#ECECEC] overflow-hidden';
