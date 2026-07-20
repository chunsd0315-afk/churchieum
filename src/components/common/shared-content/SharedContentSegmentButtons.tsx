export type SharedContentSegmentOption<T extends string> = {
  id: T;
  label: string;
  description?: string;
  ariaLabel?: string;
};

export type SharedContentSegmentButtonsProps<T extends string> = {
  title: string;
  options: readonly SharedContentSegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** stacked on mobile, row on sm+ */
  layout?: 'grid-2' | 'wrap';
  /** primary (blue) vs share-type (green) selected style */
  variant?: 'primary' | 'share';
  className?: string;
};

export function SharedContentSegmentButtons<T extends string>({
  title,
  options,
  value,
  onChange,
  layout = 'grid-2',
  variant = 'primary',
  className = '',
}: SharedContentSegmentButtonsProps<T>) {
  const selectedClass =
    variant === 'share' ? 'bg-emerald-600 text-white' : 'bg-primary-600 text-white';
  const unselectedClass = 'bg-gray-100 text-gray-600 border border-gray-200';

  const containerClass =
    layout === 'grid-2'
      ? 'grid grid-cols-2 sm:flex sm:flex-wrap gap-2'
      : 'flex flex-wrap gap-2';

  return (
    <div className={className}>
      <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>
      <div className={containerClass}>
        {options.map(opt => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id || 'all'}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-label={opt.ariaLabel ?? opt.label}
              aria-pressed={selected}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold touch-target min-h-[44px] text-left leading-snug whitespace-normal ${
                selected ? selectedClass : unselectedClass
              } ${layout === 'wrap' ? 'py-2' : ''}`}
            >
              <span className="block">{opt.label}</span>
              {opt.description && (
                <span
                  className={`block text-[10px] font-normal mt-1 leading-snug ${
                    selected ? 'text-white/85' : 'text-gray-500'
                  }`}
                >
                  {opt.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
