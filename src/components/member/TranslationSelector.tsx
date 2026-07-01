/**
 * TranslationSelector — compact pill-style translation mode selector
 */
import { Globe, BookOpen } from 'lucide-react';
import type { TranslationMode } from '../../lib/bibleTranslation';

type Props = {
  mode: TranslationMode;
  onChange: (mode: TranslationMode) => void;
  compact?: boolean;
};

const OPTIONS: { id: TranslationMode; label: string; short: string }[] = [
  { id: 'korean',   label: '개역한글', short: 'KRV' },
  { id: 'web',      label: 'WEB',      short: 'WEB' },
  { id: 'parallel', label: '함께보기', short: '병렬' },
];

export default function TranslationSelector({ mode, onChange, compact = false }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {!compact && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mr-1">
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">번역</span>
        </div>
      )}
      <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === opt.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {compact ? opt.short : opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TranslationBadge({ mode }: { mode: TranslationMode }) {
  const opt = OPTIONS.find(o => o.id === mode);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-semibold">
      <BookOpen className="w-3 h-3" />
      {opt?.label ?? mode}
    </span>
  );
}
