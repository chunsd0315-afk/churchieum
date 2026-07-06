import React from 'react';
import { SearchInput } from './SearchInput';

export interface ContentToolbarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  className?: string;
}

export function ContentToolbar({ search, left, right, bottom, className = '' }: ContentToolbarProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {left && <div className="flex items-center gap-2 shrink-0">{left}</div>}

        {search && (
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
            />
          </div>
        )}

        {right && <div className="flex items-center gap-2 shrink-0 ml-auto">{right}</div>}
      </div>

      {bottom && <div>{bottom}</div>}
    </div>
  );
}
