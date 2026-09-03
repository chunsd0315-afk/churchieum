import { LayoutGrid, List } from 'lucide-react';

export type ContentViewMode = 'card' | 'list';

export type ViewModeToggleProps = {
  value: ContentViewMode;
  onChange: (mode: ContentViewMode) => void;
  className?: string;
};

/**
 * 카드보기 / 목록보기 전환 — 공지사항·은혜와 기도 공통
 */
export function ViewModeToggle({ value, onChange, className = '' }: ViewModeToggleProps) {
  return (
    <div
      className={`shrink-0 flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px] touch-target min-h-[48px] ${className}`}
      role="group"
      aria-label="보기 방식"
    >
      <button
        type="button"
        onClick={() => onChange('card')}
        title="카드 보기"
        aria-label="카드 보기"
        aria-pressed={value === 'card'}
        className={`flex items-center justify-center rounded-xl transition-all min-w-[44px] min-h-[44px] ${
          value === 'card'
            ? 'bg-primary-500 shadow-sm text-[#1A1A1A]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <LayoutGrid className="w-[18px] h-[18px]" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        title="목록 보기"
        aria-label="목록 보기"
        aria-pressed={value === 'list'}
        className={`flex items-center justify-center rounded-xl transition-all min-w-[44px] min-h-[44px] ${
          value === 'list'
            ? 'bg-primary-500 shadow-sm text-[#1A1A1A]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <List className="w-[18px] h-[18px]" aria-hidden />
      </button>
    </div>
  );
}

const VIEW_MODE_KEYS = {
  announcement: 'churchieum_announcement_view_mode',
  grace: 'churchieum_grace_view_mode',
  bulletin: 'churchieum_bulletin_view_mode',
  album: 'churchieum_album_view_mode',
  sharing: 'churchieum_share_view_mode',
} as const;

export type ViewModeStorageKey = keyof typeof VIEW_MODE_KEYS;

export function readStoredViewMode(key: ViewModeStorageKey, fallback: ContentViewMode = 'list'): ContentViewMode {
  try {
    const raw = localStorage.getItem(VIEW_MODE_KEYS[key]);
    if (raw === 'card' || raw === 'list') return raw;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeStoredViewMode(key: ViewModeStorageKey, mode: ContentViewMode): void {
  try {
    localStorage.setItem(VIEW_MODE_KEYS[key], mode);
  } catch {
    /* ignore */
  }
}
