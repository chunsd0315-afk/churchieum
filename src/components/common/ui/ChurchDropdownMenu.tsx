import { useState, useRef, useEffect, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export type ChurchDropdownItem = {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
};

export type ChurchDropdownMenuProps = {
  items: ChurchDropdownItem[];
  trigger?: ReactNode;
};

export function ChurchDropdownMenu({ items, trigger }: ChurchDropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        aria-label="메뉴 열기"
      >
        {trigger ?? <MoreVertical className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-[16px] shadow-xl min-w-[160px] overflow-hidden py-1.5">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
              className={[
                'w-full h-[42px] px-4 flex items-center gap-2.5 text-sm font-medium transition-colors',
                item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              {item.icon && <span className="shrink-0 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
