import { Search, Calendar, Tag } from 'lucide-react';
import { EVENT_TYPE_OPTIONS } from '../../services/eventHelpers';

export type ScheduleSearchFilter = {
  keyword: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_SCHEDULE_FILTER: ScheduleSearchFilter = {
  keyword: '',
  eventType: '',
  dateFrom: '',
  dateTo: '',
};

export function isScheduleFilterActive(f: ScheduleSearchFilter): boolean {
  return !!(f.keyword || f.eventType || f.dateFrom || f.dateTo);
}

export function countScheduleDetailFilters(f: ScheduleSearchFilter): number {
  let n = 0;
  if (f.eventType) n++;
  if (f.dateFrom || f.dateTo) n++;
  return n;
}

export function scheduleMatchesFilter(
  e: { title?: string; description?: string; location?: string; event_type?: string; event_date?: string },
  f: ScheduleSearchFilter,
): boolean {
  if (f.eventType && e.event_type !== f.eventType) return false;

  if (f.dateFrom || f.dateTo) {
    const key = (e.event_date ?? '').slice(0, 10);
    if (f.dateFrom && key && key < f.dateFrom) return false;
    if (f.dateTo && key && key > f.dateTo) return false;
  }

  if (f.keyword) {
    const q = f.keyword.toLowerCase();
    const hay = [
      e.title ?? '',
      e.description ?? '',
      e.location ?? '',
      e.event_type ?? '',
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

type Props = {
  value: ScheduleSearchFilter;
  onChange: (f: ScheduleSearchFilter) => void;
  onApply: () => void;
  onReset: () => void;
  asSheet?: boolean;
};

export function ScheduleSearchPanel({
  value,
  onChange,
  onApply,
  onReset,
  asSheet = false,
}: Props) {
  const dateError =
    value.dateFrom &&
    value.dateTo &&
    value.dateFrom > value.dateTo
      ? '종료일은 시작일 이후로 설정해 주세요.'
      : '';

  const wrapCls = asSheet ? '' : 'bg-white border border-gray-200 rounded-[24px] shadow-lg';

  return (
    <div className={`${wrapCls} p-5 space-y-5`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">검색어</span>
        </div>
        <input
          type="search"
          value={value.keyword}
          onChange={e => onChange({ ...value, keyword: e.target.value })}
          placeholder="제목, 장소, 내용 검색"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm bg-white min-h-[48px] focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">일정 종류</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, eventType: '' })}
            className={`px-3.5 py-2 min-h-[44px] rounded-[14px] text-sm font-semibold border transition-colors touch-target ${
              !value.eventType
                ? 'bg-primary-50 border-primary-300 text-primary-800'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            전체
          </button>
          {EVENT_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, eventType: opt.value })}
              className={`px-3.5 py-2 min-h-[44px] rounded-[14px] text-sm font-semibold border transition-colors touch-target ${
                value.eventType === opt.value
                  ? 'bg-primary-50 border-primary-300 text-primary-800'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">기간</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">시작일</label>
            <input
              type="date"
              value={value.dateFrom}
              onChange={e => onChange({ ...value, dateFrom: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[48px] focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">종료일</label>
            <input
              type="date"
              value={value.dateTo}
              onChange={e => onChange({ ...value, dateTo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[48px] focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>
        {dateError && <p className="text-sm text-red-500">{dateError}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 min-h-[48px] border border-gray-200 rounded-[14px] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors touch-target"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!!dateError}
          className="px-5 py-2.5 min-h-[48px] bg-primary-500 text-[#1A1A1A] rounded-[14px] text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 touch-target"
        >
          상세설정 적용
        </button>
      </div>
    </div>
  );
}

export function ScheduleFilterChips({
  filter,
  onChange,
}: {
  filter: ScheduleSearchFilter;
  onChange: (f: ScheduleSearchFilter) => void;
}) {
  const chips: { label: string; remove: () => void }[] = [];

  if (filter.eventType) {
    const label = EVENT_TYPE_OPTIONS.find(o => o.value === filter.eventType)?.label ?? filter.eventType;
    chips.push({
      label,
      remove: () => onChange({ ...filter, eventType: '' }),
    });
  }

  if (filter.dateFrom || filter.dateTo) {
    chips.push({
      label: [filter.dateFrom, filter.dateTo].filter(Boolean).join(' ~ '),
      remove: () => onChange({ ...filter, dateFrom: '', dateTo: '' }),
    });
  }

  if (filter.keyword) {
    chips.push({
      label: `"${filter.keyword}"`,
      remove: () => onChange({ ...filter, keyword: '' }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700"
        >
          {c.label}
          <button
            type="button"
            onClick={c.remove}
            className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200"
            aria-label={`${c.label} 필터 제거`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(EMPTY_SCHEDULE_FILTER)}
        className="text-[11px] text-gray-400 hover:text-gray-600 underline px-1"
      >
        상세설정 초기화
      </button>
    </div>
  );
}
