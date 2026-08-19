/**
 * 성경 본문 단어 터치 기능 컴포넌트
 *
 * 절 텍스트를 토큰으로 분리하여 렌더링.
 * 원어 데이터가 있는 단어는 클릭 시 팝업 표시.
 * 원어 데이터가 없는 단어는 일반 텍스트로 표시.
 */

import { useCallback, useRef, useState } from 'react';
import { tokenizeVerseText, type VerseToken } from '../../data/bibleLexicon';
import { BibleWordPopup } from './BibleWordPopup';

type Props = {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  className?: string;
};

type ActiveWord = {
  token: VerseToken;
  rect: DOMRect;
};

export function BibleWordText({ bookId, chapter, verse, text, className = '' }: Props) {
  const [active, setActive] = useState<ActiveWord | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const segments = tokenizeVerseText(bookId, chapter, verse, text);

  const handleWordClick = useCallback((token: VerseToken, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setActive(prev => {
      // 같은 단어 다시 클릭 → 닫기
      if (prev?.token.tokenIndex === token.tokenIndex &&
          prev.token.strongNumber === token.strongNumber) {
        return null;
      }
      return { token, rect };
    });
  }, []);

  const handleClose = useCallback(() => setActive(null), []);

  return (
    <span ref={containerRef} className={`relative ${className}`}>
      {segments.map((seg, idx) => {
        if (!seg.token) {
          return <span key={idx}>{seg.text}</span>;
        }

        const isActive = active?.token.tokenIndex === seg.token.tokenIndex &&
                         active.token.strongNumber === seg.token.strongNumber;

        return (
          <span
            key={idx}
            role="button"
            tabIndex={0}
            aria-label={`${seg.text} 원어 보기`}
            onClick={e => {
              e.stopPropagation();
              handleWordClick(seg.token!, e.currentTarget as HTMLElement);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleWordClick(seg.token!, e.currentTarget as HTMLElement);
              }
            }}
            className={`cursor-pointer rounded px-0.5 -mx-0.5 transition-colors duration-150 select-text ${
              isActive
                ? 'bg-[#FFF3B0] text-gray-900'
                : 'hover:bg-amber-50 active:bg-[#FFF3B0]'
            }`}
          >
            {seg.text}
          </span>
        );
      })}

      {active && (
        <BibleWordPopup
          token={active.token}
          anchorRect={active.rect}
          onClose={handleClose}
        />
      )}
    </span>
  );
}
