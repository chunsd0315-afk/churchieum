/**
 * 주보 상세설정 — 검색어 + 기간 (공지사항과 동일 버튼/레이아웃 톤)
 */

import { Search, Calendar } from 'lucide-react';

export type BulletinDatePreset =
  | 'all'
  | 'this_month'
  | '3months'
  | '6months'
  | 'this_year'
  | 'custom';

export type BulletinSearchFilter = {
  keyword: string;
  datePreset: BulletinDatePreset;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_BULLETIN_FILTER: BulletinSearchFilter = {
  keyword: '',
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
};

export function isBulletinFilterActive(f: BulletinSearchFilter): boolean {
  return (
    !!f.keyword ||
    f.datePreset !== 'all' ||
    !!f.dateFrom ||
    !!f.dateTo
  );
}

export function countBulletinDetailFilters(f: BulletinSearchFilter): number {
  let n = 0;
  if (f.datePreset !== 'all' || f.dateFrom || f.dateTo) n++;
  return n;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getBulletinPresetDates(
  preset: BulletinDatePreset,
): { from: string; to: string } {
  const now = new Date();
  if (preset === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === '3months') {
    const from = new Date(now);
    from.setMonth(now.getMonth() - 3);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === '6months') {
    const from = new Date(now);
    from.setMonth(now.getMonth() - 6);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === 'this_year') {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from: toISODate(from), to: toISODate(now) };
  }
  return { from: '', to: '' };
}

export function bulletinMatchesFilter(
  item: { title?: string; description?: string; bulletin_date?: string },
  f: BulletinSearchFilter,
): boolean {
  if (f.dateFrom || f.dateTo) {
    const key = (item.bulletin_date || '').slice(0, 10);
    if (f.dateFrom && key && key < f.dateFrom) return false;
    if (f.dateTo && key && key > f.dateTo) return false;
    if (!key && (f.dateFrom || f.dateTo)) return false;
  }

  if (f.keyword) {
    const q = f.keyword.toLowerCase();
    const hay = [
      item.title || '',
      item.description || '',
      item.bulletin_date || '',
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

const DATE_PRESETS: { id: BulletinDatePreset; label: string }[] = [
  { id: 'all', label: '전체 기간' },
  { id: 'this_month', label: '이번 달' },
  { id: '3months', label: '최근 3개월' },
  { id: '6months', label: '최근 6개월' },
  { id: 'this_year', label: '올해' },
  { id: 'custom', label: '직접 설정' },
];

type Props = {
  value: BulletinSearchFilter;
  onChange: (f: BulletinSearchFilter) => void;
  onApply: () => void;
  onReset: () => void;
  asSheet?: boolean;
};

export function BulletinSearchPanel({
  value,
  onChange,
  onApply,
  onReset,
  asSheet = false,
}: Props) {
  const handlePreset = (preset: BulletinDatePreset) => {
    if (preset === 'custom') {
      onChange({ ...value, datePreset: 'custom' });
      return;
    }
    const { from, to } = getBulletinPresetDates(preset);
    onChange({ ...value, datePreset: preset, dateFrom: from, dateTo: to });
  };

  const dateError =
    value.datePreset === 'custom' &&
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
          placeholder="제목 또는 내용 검색"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm bg-white min-h-[48px] focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">기간</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-[14px] text-sm font-semibold border transition-colors touch-target ${
                value.datePreset === p.id
                  ? 'bg-primary-50 border-primary-300 text-primary-800'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {value.datePreset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
            {dateError && (
              <p className="sm:col-span-2 text-sm text-red-500">{dateError}</p>
            )}
          </div>
        )}
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

export function BulletinFilterChips({
  filter,
  onChange,
}: {
  filter: BulletinSearchFilter;
  onChange: (f: BulletinSearchFilter) => void;
}) {
  const chips: { label: string; remove: () => void }[] = [];

  const presetLabel = DATE_PRESETS.find(p => p.id === filter.datePreset)?.label;
  if (filter.datePreset === 'custom' && (filter.dateFrom || filter.dateTo)) {
    chips.push({
      label: [filter.dateFrom, filter.dateTo].filter(Boolean).join(' ~ '),
      remove: () => onChange({ ...filter, datePreset: 'all', dateFrom: '', dateTo: '' }),
    });
  } else if (filter.datePreset !== 'all' && presetLabel) {
    chips.push({
      label: presetLabel,
      remove: () => onChange({ ...filter, datePreset: 'all', dateFrom: '', dateTo: '' }),
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
            aria-label={`${c.label} 필터 제거`}
            className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(EMPTY_BULLETIN_FILTER)}
        className="text-[11px] text-gray-400 hover:text-gray-600 underline px-1"
      >
        상세설정 초기화
      </button>
    </div>
  );
}
