import React from 'react';

export type SkeletonVariant = 'text' | 'avatar' | 'card' | 'rectangle' | 'circle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

const pulse = 'animate-pulse bg-gray-200 rounded';

function SkeletonBase({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`${pulse} ${className}`} style={style} />;
}

export function Skeleton({ variant = 'rectangle', width, height, lines = 3, className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width)  style.width  = typeof width  === 'number' ? `${width}px`  : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBase
            key={i}
            style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%', height: '14px' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    const sz = height ?? width ?? 40;
    return <SkeletonBase className={`rounded-full ${className}`} style={{ width: sz, height: sz }} />;
  }

  if (variant === 'circle') {
    return <SkeletonBase className={`rounded-full ${className}`} style={style} />;
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white border border-gray-200 rounded-card p-5 flex flex-col gap-3 ${className}`}>
        <SkeletonBase style={{ height: '160px', borderRadius: '12px' }} />
        <SkeletonBase style={{ height: '16px', width: '80%' }} />
        <SkeletonBase style={{ height: '13px', width: '60%' }} />
        <SkeletonBase style={{ height: '13px', width: '40%' }} />
      </div>
    );
  }

  return <SkeletonBase className={className} style={style} />;
}

export function SkeletonListCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-card p-4 flex items-start gap-3 ${className}`}>
      <SkeletonBase style={{ width: 96, height: 64, borderRadius: 12, flexShrink: 0 }} />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonBase style={{ height: 13, width: '50%' }} />
        <SkeletonBase style={{ height: 15, width: '90%' }} />
        <SkeletonBase style={{ height: 13, width: '35%' }} />
      </div>
    </div>
  );
}

/* ── Page-level skeletons ─────────────────────────────────────── */

/** Full page skeleton: header + toolbar + list items */
export function PageSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="pb-5 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <SkeletonBase style={{ height: 24, width: 140 }} />
          <SkeletonBase style={{ height: 14, width: 240 }} />
        </div>
        <SkeletonBase style={{ height: 36, width: 80, borderRadius: 14 }} />
      </div>
      {/* Toolbar */}
      <div className="pb-3 flex items-center gap-2">
        <SkeletonBase style={{ height: 44, flex: 1, borderRadius: 14 }} />
        <SkeletonBase style={{ height: 36, width: 80, borderRadius: 8 }} />
      </div>
      {/* Filter */}
      <div className="pb-3 flex gap-2">
        {[80, 70, 90, 65].map((w, i) => (
          <SkeletonBase key={i} style={{ height: 36, width: w, borderRadius: 999 }} />
        ))}
      </div>
      {/* Divider */}
      <div className="h-px bg-gray-100 mb-4" />
      {/* List items */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonListCard key={i} />
        ))}
      </div>
    </div>
  );
}

/** Full page skeleton with grid layout */
export function PageGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 }) {
  const gridClass = columns === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
  return (
    <div className="flex flex-col gap-0">
      <div className="pb-5 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <SkeletonBase style={{ height: 24, width: 140 }} />
          <SkeletonBase style={{ height: 14, width: 240 }} />
        </div>
        <SkeletonBase style={{ height: 36, width: 80, borderRadius: 14 }} />
      </div>
      <div className="pb-3 flex items-center gap-2">
        <SkeletonBase style={{ height: 44, flex: 1, borderRadius: 14 }} />
        <SkeletonBase style={{ height: 32, width: 72, borderRadius: 8 }} />
      </div>
      <div className="h-px bg-gray-100 mb-4" />
      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}
