import { Calendar, List } from 'lucide-react';

export type ScheduleViewMode = 'calendar' | 'list';

const STORAGE_KEY = 'churchieum_schedule_view_mode';

export function readScheduleViewMode(fallback: ScheduleViewMode = 'calendar'): ScheduleViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'calendar' || raw === 'list') return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeScheduleViewMode(mode: ScheduleViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

type Props = {
  value: ScheduleViewMode;
  onChange: (mode: ScheduleViewMode) => void;
  className?: string;
};

/** 달력보기 / 목록보기 — 일정 메뉴 전용 */
export function ScheduleViewToggle({ value, onChange, className = '' }: Props) {
  return (
    <div
      className={`shrink-0 flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px] touch-target min-h-[48px] ${className}`}
      role="group"
      aria-label="일정 보기 방식"
    >
      <button
        type="button"
        onClick={() => onChange('calendar')}
        title="달력 보기"
        aria-label="달력 보기"
        aria-pressed={value === 'calendar'}
        className={`flex items-center justify-center rounded-xl transition-all min-w-[44px] min-h-[44px] ${
          value === 'calendar'
            ? 'bg-white shadow-sm text-primary-600'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Calendar className="w-[18px] h-[18px]" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        title="목록 보기"
        aria-label="목록 보기"
        aria-pressed={value === 'list'}
        className={`flex items-center justify-center rounded-xl transition-all min-w-[44px] min-h-[44px] ${
          value === 'list'
            ? 'bg-white shadow-sm text-primary-600'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <List className="w-[18px] h-[18px]" aria-hidden />
      </button>
    </div>
  );
}
