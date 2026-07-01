import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarToolbarProps {
  date: Date;
  view?: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  onViewChange?: (view: CalendarView) => void;
  title?: string;
  className?: string;
}

function formatTitle(date: Date, view: CalendarView): string {
  const year  = date.getFullYear();
  const month = date.getMonth() + 1;
  if (view === 'month') return `${year}년 ${month}월`;
  const day   = date.getDate();
  if (view === 'week') {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const endMonth = end.getMonth() + 1;
    const endDay   = end.getDate();
    if (end.getMonth() === date.getMonth()) return `${year}년 ${month}월 ${day}–${endDay}일`;
    return `${year}년 ${month}.${day} – ${endMonth}.${endDay}`;
  }
  return `${year}년 ${month}월 ${day}일`;
}

const views: { id: CalendarView; label: string }[] = [
  { id: 'month', label: '월' },
  { id: 'week',  label: '주' },
  { id: 'day',   label: '일' },
];

export function CalendarToolbar({
  date,
  view = 'month',
  onPrev,
  onNext,
  onToday,
  onViewChange,
  title,
  className = '',
}: CalendarToolbarProps) {
  const displayTitle = title ?? formatTitle(date, view);
  const btnBase = 'flex items-center justify-center rounded-lg transition-[background-color,color] duration-[var(--duration-base)]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Today */}
      {onToday && (
        <button
          type="button"
          onClick={onToday}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-[var(--duration-base)]"
        >
          <CalendarDays size={14} />
          오늘
        </button>
      )}

      {/* Prev / Title / Next */}
      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrev} aria-label="이전" className={`${btnBase} w-8 h-8 text-gray-500 hover:bg-gray-100`}>
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[120px] text-center text-sm font-bold text-gray-900 px-2">
          {displayTitle}
        </span>
        <button type="button" onClick={onNext} aria-label="다음" className={`${btnBase} w-8 h-8 text-gray-500 hover:bg-gray-100`}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* View switcher */}
      {onViewChange && (
        <div className="ml-auto flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {views.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={[
                'px-3 h-7 rounded-md text-xs font-semibold',
                'transition-[background-color,color,box-shadow] duration-[var(--duration-base)]',
                view === v.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
