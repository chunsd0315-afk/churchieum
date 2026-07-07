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
  const [overflowing, setOverflowing] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isOverflow = el.scrollWidth > el.clientWidth + 1;
    setOverflowing(isOverflow);
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

  const btnSize = isMobile ? 32 : 36;
  const iconSize = isMobile ? 16 : 18;

  const arrowBtnClass =
    'shrink-0 flex items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-sm ' +
    'text-[#4B5563] hover:text-primary-600 hover:border-primary-200 transition-colors ' +
    'disabled:opacity-40 disabled:pointer-events-none';

  return (
    <div className="flex items-center gap-1.5">
      {/* 좌측 고정 버튼 (스크롤 필요할 때만 영역 확보) */}
      {overflowing && (
        <button
          type="button"
          onClick={() => scrollBy(-SCROLL_STEP)}
          aria-label="이전 폴더"
          disabled={!canLeft}
          className={arrowBtnClass}
          style={{ width: btnSize, height: btnSize }}
        >
          <ChevronLeft size={iconSize} />
        </button>
      )}

      {/* 가운데: 폴더명 가로 스크롤 영역 (버튼 영역과 분리) */}
      <div className="relative flex-1 min-w-0">
        {/* 좌측 페이드 */}
        {canLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10"
            style={{ background: 'linear-gradient(to right, #F8FAFC, rgba(248,250,252,0))' }}
            aria-hidden
          />
        )}

        <div
          ref={scrollRef}
          className="flex items-center gap-2 py-2.5 overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap"
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
                className={`shrink-0 h-9 px-4 rounded-full text-[14px] whitespace-nowrap transition-colors ${
                  active
                    ? 'font-bold bg-primary-500 text-white shadow-sm'
                    : 'font-medium bg-transparent text-[#374151] hover:bg-black/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 우측 페이드 */}
        {canRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10"
            style={{ background: 'linear-gradient(to left, #F8FAFC, rgba(248,250,252,0))' }}
            aria-hidden
          />
        )}
      </div>

      {/* 우측 고정 버튼 */}
      {overflowing && (
        <button
          type="button"
          onClick={() => scrollBy(SCROLL_STEP)}
          aria-label="다음 폴더"
          disabled={!canRight}
          className={arrowBtnClass}
          style={{ width: btnSize, height: btnSize }}
        >
          <ChevronRight size={iconSize} />
        </button>
      )}

      {onManageFolders && (
        <button
          type="button"
          onClick={onManageFolders}
          aria-label="폴더 관리"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-primary-600 hover:bg-black/5 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
