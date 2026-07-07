import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { SearchInput } from './SearchInput';
import { FilterBar } from './FilterBar';
import type { FilterItem } from './FilterBar';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Skeleton, SkeletonListCard } from './Skeleton';
import { ViewToggle } from './ViewToggle';
import type { ViewMode } from './ViewToggle';
import { MobileAddButton } from './MobileAddButton';

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
  list:  'flex flex-col gap-3',
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

      {/* ── PageHeader (PC 전용: 메뉴명 + 설명 + 액션) ────────────── */}
      <div className="hidden md:flex items-start justify-between gap-4 pb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{header.title}</h1>
          {header.description && (
            <p className="mt-1 text-sm text-gray-500 leading-snug">{header.description}</p>
          )}
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

      {/* ── 모바일 전용: 전체 폭 등록 버튼 ───────────────────────── */}
      {addButton && (
        <div className="md:hidden pb-4">
          <MobileAddButton label={addButton.label ?? '등록'} onClick={addButton.onClick} />
        </div>
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
  /** PC(데스크톱) 전용 우측 액션 — 모바일에서는 숨겨진다. */
  action?: React.ReactNode;
  /** 모바일 전용 본문 상단 액션 — 보통 전체 폭 등록 버튼(MobileAddButton). */
  mobileAction?: React.ReactNode;
  className?: string;
}

/**
 * 메뉴 페이지 상단 헤더.
 * - PC: 메뉴명 + 설명 + 우측 액션 표시.
 * - 모바일: 고정 상단바에 메뉴명/설명이 이미 있으므로 본문 상단 메뉴명/설명은 숨김.
 *   등록/작성 버튼은 mobileAction(전체 폭)으로만 노출한다.
 */
export function PageHeaderBar({ title, description, action, mobileAction, className = '' }: PageHeaderBarProps) {
  return (
    <div className={className}>
      {/* PC 전용: 메뉴명 + 설명 + 액션 */}
      <div className="hidden md:flex items-start justify-between gap-4 pb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 leading-snug">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* 모바일 전용: 전체 폭 등록/작성 버튼 */}
      {mobileAction && <div className="md:hidden pb-4">{mobileAction}</div>}
    </div>
  );
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
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function ContentList({ gap = 'md', className = '', children }: ContentListProps) {
  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
