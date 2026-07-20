import { X } from 'lucide-react';

export type SharedContentFilterChip = {
  key: string;
  label: string;
  onClear: () => void;
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
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map(chip => (
        <button
          key={chip.key + chip.label}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 touch-target"
        >
          {chip.label}
          <X className="w-3 h-3" aria-hidden />
        </button>
      ))}
      {onResetAll && (
        <button
          type="button"
          onClick={onResetAll}
          className="text-[11px] text-gray-500 font-medium px-2 py-1.5 touch-target"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
