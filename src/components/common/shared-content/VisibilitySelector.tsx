import { Lock, UserRound, Users } from 'lucide-react';
import type { VisibilityType } from '../../../types/sharedContent';
import {
  VISIBILITY_DESCRIPTIONS,
  VISIBILITY_DESCRIPTIONS_PASTOR,
  VISIBILITY_LABELS,
  VISIBILITY_LABELS_PASTOR,
} from '../../../types/sharedContent';

export type VisibilitySelectorProps = {
  value: VisibilityType;
  onChange: (v: VisibilityType) => void;
  /** pastor / admin UI labels */
  variant?: 'member' | 'pastor';
  disabledOptions?: VisibilityType[];
  className?: string;
};

const ICONS = {
  private: Lock,
  pastor_share: UserRound,
  organization_share: Users,
} as const;

const ORDER: VisibilityType[] = ['private', 'pastor_share', 'organization_share'];

export function VisibilitySelector({
  value,
  onChange,
  variant = 'member',
  disabledOptions = [],
  className = '',
}: VisibilitySelectorProps) {
  const labels = variant === 'pastor' ? VISIBILITY_LABELS_PASTOR : VISIBILITY_LABELS;
  const descs = variant === 'pastor' ? VISIBILITY_DESCRIPTIONS_PASTOR : VISIBILITY_DESCRIPTIONS;

  return (
    <div className={`flex flex-col ${className}`} role="radiogroup" aria-label="공개범위">
      {ORDER.map(opt => {
        const Icon = ICONS[opt];
        const disabled = disabledOptions.includes(opt);
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => !disabled && onChange(opt)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-100 last:border-b-0 transition-colors touch-target ${
              selected ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected ? 'border-primary-500' : 'border-gray-300'
              }`}
            >
              {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
            </span>
            <Icon
              className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? 'text-primary-600' : 'text-gray-400'}`}
            />
            <span className="min-w-0">
              <span className={`block text-[15px] font-bold ${selected ? 'text-primary-800' : 'text-gray-900'}`}>
                {labels[opt]}
              </span>
              <span className="block text-[13px] text-gray-500 mt-0.5">{descs[opt]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
