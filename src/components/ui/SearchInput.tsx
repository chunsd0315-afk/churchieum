import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = '검색',
  size = 'md',
  className = '',
  autoFocus,
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  const height = size === 'sm' ? 'h-9' : 'h-11';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={size === 'sm' ? 14 : 16}
        className="absolute left-3 text-gray-400 pointer-events-none shrink-0"
      />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={[
          'w-full pl-9 bg-gray-50 border border-gray-200 rounded-btn text-gray-800',
          'placeholder-gray-400 focus:outline-none focus:bg-white focus:border-transparent',
          'focus:ring-2 focus:ring-primary-400',
          'transition-[background-color,border-color,box-shadow] duration-[var(--duration-base)]',
          height,
          textSize,
          value ? 'pr-9' : 'pr-4',
        ].join(' ')}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); ref.current?.focus(); }}
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors duration-[var(--duration-base)]"
          aria-label="검색어 지우기"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
