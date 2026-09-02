/**
 * 교회나눔 상세설정 — 검색어 + 지역 + 카테고리 + 상태 + 기간
 */

import { Calendar, Globe, Search, Tag } from 'lucide-react';
import {
  SHARING_REGIONS,
  getSharingPresetDates,
  type SharingDatePreset,
  type SharingSearchFilter,
} from '../../services/sharingHelpers';
import { STATUS_LABELS, TYPE_LABELS, type SharingPost } from '../../services/sharingStorage';

const DATE_PRESETS: { id: SharingDatePreset; label: string }[] = [
  { id: 'all', label: '전체 기간' },
  { id: 'today', label: '오늘' },
  { id: '7days', label: '최근 7일' },
  { id: '30days', label: '최근 30일' },
  { id: 'this_month', label: '이번 달' },
  { id: 'custom', label: '직접 설정' },
];

type Props = {
  value: SharingSearchFilter;
  onChange: (f: SharingSearchFilter) => void;
  onApply: () => void;
  onReset: () => void;
  categories: string[];
  asSheet?: boolean;
};

export function SharingSearchPanel({
  value,
  onChange,
  onApply,
  onReset,
  categories,
  asSheet = false,
}: Props) {
  const handlePreset = (preset: SharingDatePreset) => {
    if (preset === 'custom') {
      onChange({ ...value, datePreset: 'custom' });
      return;
    }
    const { from, to } = getSharingPresetDates(preset);
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
          placeholder="제목, 내용, 교회명, 지역 검색"
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">지역</span>
        </div>
        <select
          value={value.region}
          onChange={e => onChange({ ...value, region: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
        >
          <option value="">전체 지역</option>
          {SHARING_REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">카테고리</span>
        </div>
        <select
          value={value.category}
          onChange={e => onChange({ ...value, category: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
        >
          <option value="">전체</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-bold text-gray-700">상태</span>
        <div className="flex flex-wrap gap-2">
          {(['', 'active', 'reserved', 'completed'] as const).map(s => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => onChange({ ...value, status: s })}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all min-h-[44px] touch-target ${
                value.status === s
                  ? 'bg-primary-50 border-primary-300 text-primary-800'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === '' ? '전체' : STATUS_LABELS[s as SharingPost['status']]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-bold text-gray-700">교회명</span>
        <input
          value={value.churchName}
          onChange={e => onChange({ ...value, churchName: e.target.value })}
          placeholder="교회명으로 검색"
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
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
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all touch-target ${
                value.datePreset === p.id
                  ? 'bg-primary-50 border-primary-300 text-primary-800'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {value.datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <input
              type="date"
              value={value.dateFrom}
              onChange={e => onChange({ ...value, dateFrom: e.target.value })}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            />
            <input
              type="date"
              value={value.dateTo}
              onChange={e => onChange({ ...value, dateTo: e.target.value })}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400"
            />
          </div>
        )}
        {dateError && <p className="text-xs text-red-500">{dateError}</p>}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-[18px] text-sm hover:bg-gray-50 min-h-[48px] touch-target"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 py-3 bg-primary-500 text-[#1A1A1A] font-bold rounded-[18px] text-sm hover:bg-primary-600 min-h-[48px] touch-target"
        >
          적용
        </button>
      </div>
    </div>
  );
}

export function SharingFilterChips({
  filter,
  onChange,
}: {
  filter: SharingSearchFilter;
  onChange: (f: SharingSearchFilter) => void;
}) {
  const chips: { label: string; clear: () => void }[] = [];
  if (filter.region) chips.push({ label: filter.region, clear: () => onChange({ ...filter, region: '' }) });
  if (filter.category) chips.push({ label: filter.category, clear: () => onChange({ ...filter, category: '' }) });
  if (filter.status) chips.push({ label: STATUS_LABELS[filter.status], clear: () => onChange({ ...filter, status: '' }) });
  if (filter.churchName) chips.push({ label: filter.churchName, clear: () => onChange({ ...filter, churchName: '' }) });
  if (filter.datePreset !== 'all' || filter.dateFrom || filter.dateTo) {
    chips.push({
      label: filter.datePreset === 'custom' ? '기간 직접설정' : DATE_PRESETS.find(p => p.id === filter.datePreset)?.label ?? '기간',
      clear: () => onChange({ ...filter, datePreset: 'all', dateFrom: '', dateTo: '' }),
    });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(c => (
        <button
          key={c.label}
          type="button"
          onClick={c.clear}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 text-primary-800 text-xs font-semibold border border-primary-100 touch-target"
        >
          {c.label} ×
        </button>
      ))}
    </div>
  );
}
