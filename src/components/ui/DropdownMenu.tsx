import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  separator?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, onSelect, align = 'right', className = '' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen(v => !v)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={[
            'absolute top-full mt-1 z-dropdown',
            'bg-white border border-gray-200 rounded-xl shadow-overlay',
            'min-w-[160px] py-1 overflow-hidden',
            'animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
          role="menu"
        >
          {items.map((item, idx) => {
            if (item.separator) {
              return <div key={`sep-${idx}`} className="h-px bg-gray-100 my-1" />;
            }
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { setOpen(false); onSelect(item.id); }}
                className={[
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm',
                  'transition-colors duration-[var(--duration-fast)]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
