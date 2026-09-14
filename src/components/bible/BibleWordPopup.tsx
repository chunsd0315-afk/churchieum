/**
 * 성경 단어 원어 팝업
 * - 클릭한 단어 바로 위(공간 부족 시 아래)에 fixed + portal로 표시
 * - 가로 중앙 정렬 + 화면 경계 보정
 * - 화살표가 단어를 가리킴
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import type { LexiconEntry, VerseToken } from '../../data/bibleLexicon';
import { getLexiconEntry } from '../../data/bibleLexicon';
import { BibleWordDetailSheet } from './BibleWordDetailSheet';

type Props = {
  token: VerseToken;
  /** Viewport coordinates from getBoundingClientRect() */
  anchorRect: DOMRect;
  onClose: () => void;
};

type Placement = 'above' | 'below';

type PopupPos = {
  top: number;
  left: number;
  width: number;
  placement: Placement;
  arrowOffset: number;
};

const MARGIN = 16;
const GAP = 8;
const ARROW = 8;
const MIN_W = 200;
const MAX_W = 280;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computePos(anchor: DOMRect, popupW: number, popupH: number): PopupPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = clamp(popupW, MIN_W, Math.min(MAX_W, vw - MARGIN * 2));

  const wordCenterX = anchor.left + anchor.width / 2;
  let left = wordCenterX - width / 2;
  left = clamp(left, MARGIN, vw - width - MARGIN);

  const need = popupH + GAP + ARROW;
  const spaceAbove = anchor.top - MARGIN;
  const spaceBelow = vh - anchor.bottom - MARGIN;

  let placement: Placement = 'above';
  if (spaceAbove < need && spaceBelow > spaceAbove) {
    placement = 'below';
  }

  let top: number;
  if (placement === 'above') {
    top = anchor.top - GAP - ARROW - popupH;
    if (top < MARGIN) top = MARGIN;
  } else {
    top = anchor.bottom + GAP + ARROW;
    if (top + popupH > vh - MARGIN) {
      top = Math.max(MARGIN, vh - MARGIN - popupH);
    }
  }

  const arrowOffset = clamp(wordCenterX - left, 16, width - 16);

  return { top, left, width, placement, arrowOffset };
}

export function BibleWordPopup({ token, anchorRect, onClose }: Props) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [pos, setPos] = useState<PopupPos>(() =>
    computePos(anchorRect, Math.min(MAX_W, window.innerWidth - MARGIN * 2), 180),
  );

  const entry: LexiconEntry | null = getLexiconEntry(token.strongNumber);

  useLayoutEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(computePos(anchorRect, rect.width || MAX_W, rect.height || 180));
  }, [anchorRect, token.strongNumber, token.tokenIndex]);

  // 외부 클릭 · Esc · 스크롤 시 닫기
  useEffect(() => {
    if (showDetail) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popupRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[data-bible-word-token]')) return;
      onClose();
    };

    const onScroll = () => onClose();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [onClose, showDetail]);

  const popup = !showDetail ? (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-label={`${token.koreanText} 원어 정보`}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 250,
        background: '#FFFDF8',
        border: '1px solid #EADFD5',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(70,45,25,0.15)',
        padding: '12px 14px',
      }}
      className="select-none"
    >
      {/* Caret pointing at the word */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: pos.arrowOffset,
          ...(pos.placement === 'above'
            ? { bottom: -6, transform: 'translateX(-50%) rotate(45deg)' }
            : { top: -6, transform: 'translateX(-50%) rotate(45deg)' }),
          width: 12,
          height: 12,
          background: '#FFFDF8',
          borderRight: '1px solid #EADFD5',
          borderBottom: '1px solid #EADFD5',
          ...(pos.placement === 'below'
            ? { borderRight: 'none', borderBottom: 'none', borderLeft: '1px solid #EADFD5', borderTop: '1px solid #EADFD5' }
            : {}),
        }}
      />

      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] font-semibold text-[#8A7E75] truncate">{token.koreanText}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="shrink-0 p-1 rounded-lg text-[#8A7E75] hover:bg-[#F2E8DC] touch-target"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {entry ? (
        <div className="space-y-2">
          <p
            className="text-[20px] font-bold leading-tight text-[#2A211C]"
            lang={entry.language === 'greek' ? 'el' : 'he'}
            dir={entry.language === 'hebrew' ? 'rtl' : 'ltr'}
          >
            {entry.originalText}
          </p>
          <p className="text-[13px] text-[#6E4429] font-medium">
            {entry.pronunciation || entry.transliteration}
          </p>
          <p className="text-[14px] font-semibold text-[#2A211C] leading-snug">
            {entry.koreanGlosses.filter(Boolean).join(' · ') || '뜻 정보 준비 중'}
          </p>
          <p className="text-[13px] text-[#8A7E75] leading-snug">
            {entry.englishGloss || ''}
          </p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#FFF6E5', color: '#6E4429', border: '1px solid #EADFD5' }}
            >
              Strong&apos;s {entry.strongNumber}
            </span>
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#6E4429] hover:text-[#2A211C] touch-target min-h-[40px]"
            >
              자세히 보기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="py-1">
          <p className="text-sm text-[#8A7E75]">이 단어의 상세 정보는 준비 중입니다.</p>
          {token.strongNumber ? (
            <p className="text-[12px] text-[#8A7E75] mt-1 opacity-70">{token.koreanText}</p>
          ) : null}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {typeof document !== 'undefined' ? createPortal(popup, document.body) : null}
      {showDetail && entry && (
        <BibleWordDetailSheet
          entry={entry}
          token={token}
          onClose={() => {
            setShowDetail(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
