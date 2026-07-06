import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

export type SermonFolderTab = {
  id: string;
  label: string;
};

type Props = {
  tabs: SermonFolderTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onManageFolders?: () => void;
};

const SCROLL_STEP = 250;

export default function SermonFolderTabs({
  tabs,
  activeId,
  onSelect,
  onManageFolders,
}: Props) {
  const { isMobile } = useBreakpoint();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, tabs]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.querySelector(`[data-tab-id="${activeId}"]`) as HTMLElement | null;
    if (!btn) return;
    const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
    const target = Math.max(0, btnCenter - el.clientWidth / 2);
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [activeId, tabs]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const btnSize = isMobile ? 30 : 36;
  const iconSize = isMobile ? 16 : 18;

  const arrowBtnStyle: React.CSSProperties = {
    width: btnSize,
    height: btnSize,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
  };

  return (
    <div className="flex items-stretch border-b border-[#E5E7EB] bg-white">
      <div className="relative flex-1 min-w-0 overflow-hidden">
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-SCROLL_STEP)}
            aria-label="이전 폴더"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            style={arrowBtnStyle}
          >
            <ChevronLeft size={iconSize} className="text-[#4B5563]" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex items-end overflow-x-auto scrollbar-hide flex-nowrap"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tabs.map(tab => {
            const active = activeId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-tab-id={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`shrink-0 px-4 py-3 text-[14px] whitespace-nowrap transition-colors border-b-2 ${
                  active
                    ? 'font-bold text-primary-600 border-primary-600'
                    : 'font-medium text-[#6B7280] border-transparent hover:text-[#374151] hover:border-[#D1D5DB]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <div className="shrink-0 w-8" aria-hidden />
        </div>

        {canRight && (
          <button
            type="button"
            onClick={() => scrollBy(SCROLL_STEP)}
            aria-label="다음 폴더"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            style={arrowBtnStyle}
          >
            <ChevronRight size={iconSize} className="text-[#4B5563]" />
          </button>
        )}
      </div>

      {onManageFolders && (
        <button
          type="button"
          onClick={onManageFolders}
          aria-label="폴더 관리"
          className="shrink-0 px-3 self-center text-[#9CA3AF] hover:text-primary-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
