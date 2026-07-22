import type { PeriodFilter, PeriodPreset } from '../../../services/periodFilter';
import {
  PERIOD_PRESET_OPTIONS,
  periodPresetWithClearedDates,
} from '../../../services/periodFilter';

type Props = {
  value: PeriodFilter;
  onChange: (next: PeriodFilter) => void;
  /** 적용 시도 시 검증 오류 (부모에서 전달) */
  error?: string | null;
};

/**
 * 상세설정 — 작성일 기준 기간 설정
 * (빠른 선택 + 직접 날짜)
 */
export function PeriodFilterSection({ value, onChange, error }: Props) {
  const selectPreset = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      onChange({
        preset: 'custom',
        startDate: value.preset === 'custom' ? value.startDate : null,
        endDate: value.preset === 'custom' ? value.endDate : null,
      });
      return;
    }
    onChange(periodPresetWithClearedDates(preset));
  };

  return (
    <div>
      <p className="text-sm font-bold text-gray-800 mb-1">기간 설정</p>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        작성일을 기준으로 기록을 찾아봅니다.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
        {PERIOD_PRESET_OPTIONS.map(opt => {
          const selected = value.preset === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectPreset(opt.id)}
              aria-pressed={selected}
              className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold touch-target transition-colors ${
                selected
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {value.preset === 'custom' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-gray-500 mb-1.5 block">시작일</span>
            <input
              type="date"
              value={value.startDate ?? ''}
              onChange={e =>
                onChange({
                  ...value,
                  preset: 'custom',
                  startDate: e.target.value || null,
                })
              }
              className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:border-primary-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-gray-500 mb-1.5 block">종료일</span>
            <input
              type="date"
              value={value.endDate ?? ''}
              onChange={e =>
                onChange({
                  ...value,
                  preset: 'custom',
                  endDate: e.target.value || null,
                })
              }
              className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:border-primary-500 focus:outline-none"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
