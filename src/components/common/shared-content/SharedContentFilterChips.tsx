import { X } from 'lucide-react';

export type SharedContentFilterChip = {
  key: string;
  label: string;
  /** 없으면 제거 버튼 숨김 (성도 공유유형 등) */
  onClear?: () => void;
};

export function SharedContentFilterChips({
  chips,
  onResetAll,
  resetLabel = '상세설정 초기화',
}: {
  chips: SharedContentFilterChip[];
  onResetAll?: () => void;
  resetLabel?: string;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 max-w-full px-2.5 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold"
        >
          <span className="truncate">{chip.label}</span>
          {chip.onClear ? (
            <button
              type="button"
              onClick={chip.onClear}
              className="shrink-0 p-0.5 rounded-full hover:bg-primary-100 touch-target"
              aria-label={`${chip.label} 조건 제거`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </span>
      ))}
      {onResetAll ? (
        <button
          type="button"
          onClick={onResetAll}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline touch-target px-1 py-1"
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}
