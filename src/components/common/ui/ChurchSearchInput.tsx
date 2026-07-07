import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

export type ChurchSearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ChurchSearchInput({
  value,
  onChange,
  placeholder = '검색어를 입력하세요',
  className = '',
  ...rest
}: ChurchSearchInputProps) {
  return (
    <div className={`relative flex-1 min-w-0 ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        {...rest}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-[14px]',
          'text-sm text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
          'transition-colors duration-150',
        ].join(' ')}
      />
    </div>
  );
}
