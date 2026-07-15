import {
  useState, useRef, useEffect, useCallback, useId,
  type ReactNode, type CSSProperties, type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, X } from 'lucide-react';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

export type ChurchDropdownItem = {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
};

/**
 * top — 화면 최상위 (플레이어·공지 등). Portal + z-index 9999
 * belowPlayer — 목록 카드용. Portal이지만 플레이어(z-50)보다 낮은 z-index 20
 */
export type ChurchDropdownLayer = 'top' | 'belowPlayer';

export type ChurchDropdownMenuProps = {
  items: ChurchDropdownItem[];
  trigger?: ReactNode;
  /** 접근성 라벨 */
  ariaLabel?: string;
  /**
   * 레이어 분기
   * - top (기본): 최상위 표시
   * - belowPlayer: 상단 플레이어 아래로 (겹치면 플레이어 뒤에 보임)
   */
  layer?: ChurchDropdownLayer;
  /**
   * Popover가 열린 동안 기준(⋮) 버튼이 표시 영역을 벗어나면 자동 닫기.
   * Bottom Sheet(모바일)에는 적용하지 않음. 기본 true.
   */
  closeWhenAnchorLeavesViewport?: boolean;
};

const MENU_GAP = 8;
const MENU_MIN_WIDTH = 160;
const VIEWPORT_PAD = 8;

/** 플레이어 더보기 · Modal보다 아래, 일반 sticky보다 위 */
const Z_TOP = 9999;
/** 목록 더보기 — sticky 플레이어(50)보다 낮음 */
const Z_BELOW_PLAYER = 20;

/** 동시에 하나의 더보기 메뉴만 열리도록 */
let closeActiveMenu: (() => void) | null = null;

type MenuCoords = {
  top: number;
  left: number;
};

/** overflow 스크롤이 있는 가장 가까운 조상 (없으면 viewport = null) */
function getScrollParent(el: HTMLElement | null): Element | null {
  let node: HTMLElement | null = el?.parentElement ?? null;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflow, overflowY, overflowX } = getComputedStyle(node);
    const oy = overflowY || overflow;
    const ox = overflowX || overflow;
    const scrollY = /(auto|scroll|overlay)/.test(oy) && node.scrollHeight > node.clientHeight + 1;
    const scrollX = /(auto|scroll|overlay)/.test(ox) && node.scrollWidth > node.clientWidth + 1;
    if (scrollY || scrollX) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * 공지·설교 등에서 쓰는 세로 점(⋮) 더보기 메뉴.
 * document.body Portal로 렌더링. layer로 z-index만 분기.
 * 모바일(<768): Bottom Sheet / 태블릿·PC: 버튼 기준 Popover
 */
export function ChurchDropdownMenu({
  items,
  trigger,
  ariaLabel = '메뉴 열기',
  layer = 'top',
  closeWhenAnchorLeavesViewport = true,
}: ChurchDropdownMenuProps) {
  const { isMobile } = useBreakpoint();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wasMobileRef = useRef(isMobile);
  const menuId = useId();
  const closeRef = useRef<() => void>(() => undefined);

  const menuZ = layer === 'belowPlayer' ? Z_BELOW_PLAYER : Z_TOP;
  /** 모바일 Bottom Sheet는 항상 최상위에서 조작 가능하게 */
  const sheetZ = Z_TOP;

  const close = useCallback(() => {
    setOpen(false);
    setCoords(null);
    if (closeActiveMenu === closeRef.current) closeActiveMenu = null;
  }, []);

  closeRef.current = close;

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current;
    const panel = menuRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const panelH = panel?.offsetHeight ?? items.length * 42 + 16;
    const panelW = Math.max(panel?.offsetWidth ?? MENU_MIN_WIDTH, MENU_MIN_WIDTH);
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + MENU_GAP;
    let left = rect.right - panelW;

    // 아래 공간 부족 → 위쪽으로
    if (top + panelH > vh - VIEWPORT_PAD && rect.top - MENU_GAP - panelH >= VIEWPORT_PAD) {
      top = rect.top - MENU_GAP - panelH;
    }

    left = Math.min(left, vw - panelW - VIEWPORT_PAD);
    left = Math.max(VIEWPORT_PAD, left);
    top = Math.min(Math.max(VIEWPORT_PAD, top), Math.max(VIEWPORT_PAD, vh - panelH - VIEWPORT_PAD));

    setCoords({ top, left });
  }, [items.length]);

  const openMenu = useCallback(() => {
    if (closeActiveMenu && closeActiveMenu !== closeRef.current) closeActiveMenu();
    closeActiveMenu = closeRef.current;

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: rect.bottom + MENU_GAP,
        left: Math.max(VIEWPORT_PAD, rect.right - MENU_MIN_WIDTH),
      });
    }
    setOpen(true);
  }, []);

  const toggle = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) close();
    else openMenu();
  }, [open, close, openMenu]);

  useEffect(() => {
    if (!open || isMobile) return;

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, isMobile, updatePosition]);

  /**
   * Popover만: 기준 버튼이 스크롤 영역/뷰포트에서 완전히 벗어나면 자동 닫기.
   * Bottom Sheet는 사용자가 닫을 때까지 유지.
   */
  useEffect(() => {
    if (!open || isMobile || !closeWhenAnchorLeavesViewport) return;
    const anchor = triggerRef.current;
    if (!anchor || typeof IntersectionObserver === 'undefined') return;

    const scrollRoot = getScrollParent(anchor);
    const observers: IntersectionObserver[] = [];

    const onLeave: IntersectionObserverCallback = ([entry]) => {
      if (entry && !entry.isIntersecting) close();
    };

    // 실제 스크롤 컨테이너 기준
    const rootObserver = new IntersectionObserver(onLeave, {
      root: scrollRoot,
      threshold: 0,
    });
    rootObserver.observe(anchor);
    observers.push(rootObserver);

    // 스크롤 컨테이너 ≠ viewport 인 경우, viewport도 함께 감시
    if (scrollRoot) {
      const viewportObserver = new IntersectionObserver(onLeave, {
        root: null,
        threshold: 0,
      });
      viewportObserver.observe(anchor);
      observers.push(viewportObserver);
    }

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, [open, isMobile, closeWhenAnchorLeavesViewport, close]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: globalThis.MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useEffect(() => () => {
    if (closeActiveMenu === closeRef.current) closeActiveMenu = null;
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open, isMobile]);

  useEffect(() => {
    if (wasMobileRef.current === isMobile) return;
    wasMobileRef.current = isMobile;
    setOpen(false);
    setCoords(null);
    if (closeActiveMenu === closeRef.current) closeActiveMenu = null;
  }, [isMobile]);

  const handleItemClick = (item: ChurchDropdownItem) => (e: MouseEvent) => {
    e.stopPropagation();
    item.onClick();
    close();
  };

  const itemButtons = items.map((item, i) => (
    <button
      key={i}
      type="button"
      role="menuitem"
      onClick={handleItemClick(item)}
      className={[
        'w-full flex items-center gap-2.5 px-3 text-sm font-semibold transition-colors',
        item.danger
          ? 'text-red-500 hover:bg-red-50 active:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-50',
      ].join(' ')}
      style={{ height: isMobile ? '52px' : '42px', borderRadius: isMobile ? '12px' : '10px' }}
    >
      {item.icon && <span className="shrink-0 flex items-center">{item.icon}</span>}
      {item.label}
    </button>
  ));

  const panelStyle: CSSProperties = {
    top: coords?.top ?? 0,
    left: coords?.left ?? 0,
    minWidth: MENU_MIN_WIDTH,
    zIndex: menuZ,
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(15,23,42,.12)',
    padding: '8px',
    visibility: coords ? 'visible' : 'hidden',
  };

  const portal =
    open && typeof document !== 'undefined'
      ? createPortal(
          isMobile ? (
            <div
              className="fixed inset-0 flex flex-col justify-end"
              style={{ zIndex: sheetZ }}
              role="presentation"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                aria-label="메뉴 닫기"
                onClick={close}
              />
              <div
                ref={menuRef}
                id={menuId}
                role="menu"
                aria-label={ariaLabel}
                className="relative z-[1] w-full bg-white rounded-t-[20px] shadow-overlay animate-slide-up"
                style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
              >
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <span className="text-[15px] font-bold text-gray-900">메뉴</span>
                  <button
                    type="button"
                    onClick={close}
                    className="flex items-center justify-center w-10 h-10 rounded-[12px] text-gray-500 hover:bg-gray-100"
                    aria-label="닫기"
                  >
                    <X style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
                <div className="px-3 pb-2 space-y-0.5">
                  {itemButtons}
                  <button
                    type="button"
                    onClick={close}
                    className="w-full flex items-center justify-center px-3 text-[15px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors mt-1 border-t border-gray-100"
                    style={{ height: '52px', borderRadius: '12px' }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              className="fixed bg-white border border-gray-200"
              style={panelStyle}
              data-menu-layer={layer}
            >
              {itemButtons}
            </div>
          ),
          document.body,
        )
      : null;

  return (
    <div className="relative inline-block shrink-0" onClick={e => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        style={{ width: '36px', height: '36px', borderRadius: '12px' }}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        {trigger ?? <MoreVertical style={{ width: '16px', height: '16px' }} />}
      </button>
      {portal}
    </div>
  );
}
