import React from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { Button } from './Button';
import { SearchInput } from './SearchInput';
import { FilterBar } from './FilterBar';
import type { FilterItem } from './FilterBar';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Skeleton, SkeletonListCard } from './Skeleton';
import { ViewToggle } from './ViewToggle';
import type { ViewMode } from './ViewToggle';
import { MobileFab } from './MobileFab';
import {
  PageHeaderTextBlock,
  MobilePageHeaderCenter,
  PAGE_HEADER_SPACING_COMPACT,
  PAGE_HEADER_SPACING_DEFAULT,
} from './PageHeaderTypography';

/* ══════════════════════════════════════════════════════════════════
   PageLayout
   Canonical page structure used by every menu page in 교회이음.

   Structure:
     PageHeader  (title + description | header action)
     ──────────────────────────────────────────────────
     Toolbar     (search + filter | view toggle + toolbar right)
     ──────────────────────────────────────────────────
     Content     (list / grid / table / card / empty)
     ──────────────────────────────────────────────────
     Pagination
   ══════════════════════════════════════════════════════════════════ */

/* ── Types ───────────────────────────────────────────────────────── */

export type { ViewMode };
export type { FilterItem };

export interface PageHeaderConfig {
  title: string;
  description?: string;
  /** Right-side action slot — typically a primary "register" button */
  action?: React.ReactNode;
}

export interface ToolbarConfig {
  /** Search input config */
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  /** Filter pills config */
  filters?: FilterItem[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  /** Which view modes to show in the toggle; omit or pass single item to hide */
  viewModes?: ViewMode[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  /** Extra content for the left side of the toolbar row */
  left?: React.ReactNode;
  /** Extra content for the right side of the toolbar row */
  right?: React.ReactNode;
}

export interface PageLayoutProps {
  header: PageHeaderConfig;
  toolbar?: ToolbarConfig;
  /** Pass an 'add' button config to auto-render a small + button in the toolbar right */
  addButton?: {
    label?: string;
    onClick: () => void;
  };
  /** Loading state: replaces content with skeletons */
  loading?: boolean;
  /** Number of skeleton items to show while loading */
  skeletonCount?: number;
  /** Empty state config — shown when children is empty/falsy and !loading */
  empty?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
  /** Controls layout of the content area */
  viewMode?: ViewMode;
  /** Pagination config */
  pagination?: {
    page: number;
    total: number;
    pageSize?: number;
    onChange: (page: number) => void;
  };
  /** Set to true to hide the wrapper div around children (e.g. Table view) */
  rawContent?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/* ── Content grid/list wrappers ──────────────────────────────────── */

const contentWrappers: Record<ViewMode, string> = {
  list:  'bg-white border border-gray-200 overflow-hidden rounded-card divide-y divide-gray-100',
  grid:  'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4',
  table: '',  // Table component handles its own container
};

/* ── Divider ─────────────────────────────────────────────────────── */
function Divider() {
  return <div className="h-px bg-gray-100" />;
}

/* ── PageLayout ──────────────────────────────────────────────────── */
export function PageLayout({
  header,
  toolbar,
  addButton,
  loading = false,
  skeletonCount = 5,
  empty,
  viewMode = 'list',
  pagination,
  rawContent = false,
  className = '',
  children,
}: PageLayoutProps) {
  const hasChildren = React.Children.count(children) > 0;
  const showEmpty = !loading && !hasChildren && !!empty;
  const showContent = !loading && hasChildren;
  const hasFilters = toolbar?.filters && toolbar.filters.length > 0;
  const hasToolbarRow = toolbar?.search || toolbar?.left || toolbar?.right ||
    (toolbar?.viewModes && toolbar.viewModes.length > 1);

  return (
    <div className={`flex flex-col gap-0 ${className}`}>

      {/* ── PageHeader (PC 전용: 메뉴명 + 설명 + 액션 — 모바일은 고정 App Header 사용) ── */}
      <div className={`hidden md:flex items-start justify-between gap-4 ${PAGE_HEADER_SPACING_DEFAULT}`}>
        <div className="min-w-0 flex-1">
          <PageHeaderTextBlock title={header.title} description={header.description} />
        </div>
        {header.action ? (
          <div className="shrink-0">{header.action}</div>
        ) : addButton ? (
          <div className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={addButton.onClick}
            >
              {addButton.label ?? '등록'}
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── 모바일 전용: 플로팅 등록 버튼 ───────────────────────── */}
      {addButton && (
        <MobileFab label={addButton.label ?? '등록'} onClick={addButton.onClick} />
      )}

      {/* ── Toolbar row: search / filter / view toggle ───────────── */}
      {hasToolbarRow && (
        <>
          <div className="flex items-center gap-2 pb-3">
            {/* Left slot */}
            {toolbar?.left && (
              <div className="flex items-center gap-2 shrink-0">{toolbar.left}</div>
            )}

            {/* Search */}
            {toolbar?.search && (
              <div className="flex-1 min-w-0">
                <SearchInput
                  value={toolbar.search.value}
                  onChange={toolbar.search.onChange}
                  placeholder={toolbar.search.placeholder ?? `${header.title} 검색`}
                />
              </div>
            )}

            {/* Right: view toggle + right slot + add button */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {toolbar?.viewModes && toolbar.viewModes.length > 1 && toolbar.viewMode !== undefined && toolbar.onViewModeChange && (
                <ViewToggle
                  modes={toolbar.viewModes}
                  value={toolbar.viewMode}
                  onChange={toolbar.onViewModeChange}
                />
              )}
              {toolbar?.right}
            </div>
          </div>
        </>
      )}

      {/* ── Filter bar ───────────────────────────────────────────── */}
      {hasFilters && (
        <div className="pb-3">
          <FilterBar
            filters={toolbar!.filters!}
            activeFilter={toolbar!.activeFilter ?? toolbar!.filters![0]?.id ?? ''}
            onChange={toolbar!.onFilterChange ?? (() => {})}
          />
        </div>
      )}

      {/* ── Divider before content ───────────────────────────────── */}
      {(hasToolbarRow || hasFilters) && <Divider />}

      {/* ── Content area ─────────────────────────────────────────── */}
      <div className="pt-4">
        {/* Loading skeleton */}
        {loading && viewMode !== 'table' && (
          <div className={contentWrappers[viewMode]}>
            {Array.from({ length: skeletonCount }).map((_, i) =>
              viewMode === 'grid'
                ? <Skeleton key={i} variant="card" />
                : <SkeletonListCard key={i} />
            )}
          </div>
        )}

        {/* Loading skeleton for table */}
        {loading && viewMode === 'table' && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Skeleton key={i} variant="rectangle" height={48} className="rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <EmptyState
            icon={empty!.icon}
            title={empty!.title}
            description={empty!.description}
            action={empty!.action}
          />
        )}

        {/* Content */}
        {showContent && (
          rawContent || viewMode === 'table'
            ? children
            : <div className={contentWrappers[viewMode]}>{children}</div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────── */}
      {pagination && pagination.total > 0 && (
        <div className="pt-6 pb-2">
          <Pagination
            page={pagination.page}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={pagination.onChange}
          />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PageHeaderBar
   Standalone header bar for pages that manage their own toolbar.
   (Useful when a page has complex custom toolbar logic.)
   ══════════════════════════════════════════════════════════════════ */

export interface PageHeaderBarProps {
  title: string;
  description?: string;
  /** PC(데스크톱) 전용 우측 액션 — 모바일에서는 숨겨진다. (align=center일 때는 FormPageHeader 툴바 사용) */
  action?: React.ReactNode;
  /** 모바일 전용 본문 상단 인라인 콘텐츠 (예: 보기 전환 토글). */
  mobileAction?: React.ReactNode;
  /** 모바일 전용 플로팅 등록/작성 버튼 (오른쪽 하단 고정). */
  mobileFab?: { label: string; onClick: () => void };
  /** 제목·설명 정렬 (기본: 왼쪽) */
  align?: 'left' | 'center';
  /** desktop: PC만 표시(기본). all: PC·모바일 모두 표시 */
  visibility?: 'desktop' | 'all';
  /** 작성 화면 등 여백 축소 */
  compact?: boolean;
  className?: string;
}

/**
 * 메뉴 페이지 상단 헤더.
 * - PC: 메뉴명 + 설명 + 우측 액션 표시.
 * - 모바일: 기본적으로 고정 상단바와 중복되므로 숨김 (visibility=all이면 표시).
 */
export function PageHeaderBar({
  title,
  description,
  action,
  mobileAction,
  mobileFab,
  align = 'left',
  visibility = 'desktop',
  compact = false,
  className = '',
}: PageHeaderBarProps) {
  const mb = compact ? PAGE_HEADER_SPACING_COMPACT : PAGE_HEADER_SPACING_DEFAULT;
  const showHeader = visibility === 'all' ? 'flex' : 'hidden md:flex';

  return (
    <div className={className}>
      {align === 'center' ? (
        <div className={`${showHeader} flex-col items-center text-center w-full ${mb}`}>
          <PageHeaderTextBlock title={title} description={description} center />
        </div>
      ) : (
        <div className={`hidden md:flex items-start justify-between gap-4 ${mb}`}>
          <div className="min-w-0 flex-1">
            <PageHeaderTextBlock title={title} description={description} />
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {mobileAction && <div className="md:hidden flex justify-end pb-3">{mobileAction}</div>}
      {mobileFab && <MobileFab label={mobileFab.label} onClick={mobileFab.onClick} />}
    </div>
  );
}

export interface MobileSubPageHeaderProps {
  title: string;
  description?: string;
  /** 좌측 영역 (뒤로가기 등) */
  leading?: React.ReactNode;
  /** 우측 영역 (저장 등) */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * 모바일 서브 페이지 고정 헤더 — 설교·은혜기록 등 메뉴 페이지와 동일한 구조.
 * 뒤로가기(좌) + 화면 중앙 제목/설명 + (선택) 우측 액션 — 한 줄 배치.
 */
export function MobileSubPageHeader({
  title,
  description,
  leading,
  trailing,
  className = '',
}: MobileSubPageHeaderProps) {
  return (
    <header
      className={`bg-white sticky top-0 z-sticky shrink-0 ${className}`}
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <div className="relative px-2 flex items-center justify-between" style={{ minHeight: '56px' }}>
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none px-20"
        >
          <MobilePageHeaderCenter title={title} description={description} />
        </div>
        <div className="relative z-10 shrink-0 flex items-center">{leading}</div>
        <div className="relative z-10 shrink-0 flex items-center justify-end min-w-[48px]">
          {trailing ?? null}
        </div>
      </div>
    </header>
  );
}

export interface EditorPageHeaderProps {
  title: string;
  description?: string;
  /** 좌측 — 뒤로가기 버튼 */
  leading?: React.ReactNode;
  /** 우측 — 저장·닫기 등 */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * 등록/작성/수정 화면 PC 전용 헤더.
 * ← 뒤로 | 메뉴명 + 메뉴설명(왼쪽 정렬) | 우측 액션
 */
export function EditorPageHeader({
  title,
  description,
  leading,
  trailing,
  className = '',
}: EditorPageHeaderProps) {
  return (
    <header
      className={`bg-white shrink-0 ${className}`}
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <div
        className={`flex items-center gap-6 px-6 pt-4 ${PAGE_HEADER_SPACING_COMPACT}`}
      >
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="flex-1 min-w-0">
          <PageHeaderTextBlock title={title} description={description} />
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </header>
  );
}

/**
 * 등록/작성/수정 화면 모바일 전용 헤더.
 * 1행: 뒤로 + 저장 | 2행: 가운데 정렬 제목·설명
 */
export function MobileEditorPageHeader({
  title,
  description,
  leading,
  trailing,
  className = '',
}: EditorPageHeaderProps) {
  return (
    <header
      className={`bg-white shrink-0 ${className}`}
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 min-h-[52px]">
        {leading ?? <div className="w-10" />}
        {trailing ?? <div className="w-10" />}
      </div>
      <PageHeaderBar
        title={title}
        description={description}
        align="center"
        visibility="all"
        compact
        className="px-4"
      />
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FormPageHeader
   작성/등록 화면용 — 뒤로가기·저장 툴바 + 가운데 정렬 제목·설명
   ══════════════════════════════════════════════════════════════════ */

export interface FormPageHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function FormPageHeader({ title, description, onBack, action, className = '' }: FormPageHeaderProps) {
  const { isPc } = useBreakpoint();
  const leading = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600 touch-target"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-medium">뒤로</span>
    </button>
  ) : undefined;

  const headerProps = {
    title,
    description,
    leading,
    trailing: action,
    className: `sticky top-0 z-10 ${className}`,
  };

  if (isPc) {
    return <EditorPageHeader {...headerProps} />;
  }
  return <MobileEditorPageHeader {...headerProps} />;
}

/* ══════════════════════════════════════════════════════════════════
   PageToolbar
   Standalone toolbar row: Search + Filter + ViewToggle + Actions.
   Use this when you need more control than PageLayout provides.
   ══════════════════════════════════════════════════════════════════ */

export interface PageToolbarProps {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: FilterItem[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  viewModes?: ViewMode[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  addButton?: { label?: string; onClick: () => void };
  className?: string;
}

export function PageToolbar({
  search,
  filters,
  activeFilter,
  onFilterChange,
  viewModes,
  viewMode,
  onViewModeChange,
  left,
  right,
  addButton,
  className = '',
}: PageToolbarProps) {
  const hasFilters = filters && filters.length > 0;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Top row */}
      <div className="flex items-center gap-2">
        {left && <div className="flex items-center gap-2 shrink-0">{left}</div>}
        {search && (
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
            />
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {viewModes && viewModes.length > 1 && viewMode !== undefined && onViewModeChange && (
            <ViewToggle modes={viewModes} value={viewMode} onChange={onViewModeChange} />
          )}
          {right}
          {addButton && (
            <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={addButton.onClick}>
              {addButton.label ?? '등록'}
            </Button>
          )}
        </div>
      </div>

      {/* Filter row */}
      {hasFilters && (
        <FilterBar
          filters={filters!}
          activeFilter={activeFilter ?? filters![0]?.id ?? ''}
          onChange={onFilterChange ?? (() => {})}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ContentGrid / ContentList
   Thin wrappers that enforce the correct gap + responsive layout
   for a given view mode, without the full PageLayout overhead.
   ══════════════════════════════════════════════════════════════════ */

export interface ContentGridProps {
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const gapClasses = { sm: 'gap-3', md: 'gap-4', lg: 'gap-5' } as const;
const colClasses: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function ContentGrid({ columns = 3, gap = 'md', className = '', children }: ContentGridProps) {
  return (
    <div className={`grid ${colClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

export interface ContentListProps {
  /** @deprecated Continuous lists no longer use vertical gaps; prop kept for API compatibility */
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function ContentList({ className = '', children }: ContentListProps) {
  return (
    <div className={`bg-white border border-gray-200 overflow-hidden rounded-card divide-y divide-gray-100 ${className}`}>
      {children}
    </div>
  );
}
