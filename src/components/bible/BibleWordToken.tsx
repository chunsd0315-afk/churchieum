/**
 * 클릭 가능한 성경 본문 단어 토큰
 */

import { useRef } from 'react';
import type { VerseToken } from '../../data/bibleLexicon';

type Props = {
  token: VerseToken;
  text: string;
  selected: boolean;
  onSelect: (token: VerseToken, el: HTMLElement) => void;
};

const TAP_MOVE_THRESHOLD = 10;

export function BibleWordToken({ token, text, selected, onSelect }: Props) {
  const touchRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  return (
    <span
      role="button"
      tabIndex={0}
      data-bible-word-token
      aria-label={`${text} 원어 보기`}
      aria-expanded={selected}
      onTouchStart={e => {
        const t = e.touches[0];
        touchRef.current = { x: t.clientX, y: t.clientY, moved: false };
      }}
      onTouchMove={e => {
        const start = touchRef.current;
        if (!start) return;
        const t = e.touches[0];
        if (
          Math.abs(t.clientX - start.x) > TAP_MOVE_THRESHOLD ||
          Math.abs(t.clientY - start.y) > TAP_MOVE_THRESHOLD
        ) {
          start.moved = true;
        }
      }}
      onClick={e => {
        e.stopPropagation();
        if (touchRef.current?.moved) {
          touchRef.current = null;
          return;
        }
        touchRef.current = null;
        onSelect(token, e.currentTarget as HTMLElement);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelect(token, e.currentTarget as HTMLElement);
        }
      }}
      className={`cursor-pointer rounded-[5px] px-[2px] py-[1px] -mx-[1px] transition-colors duration-150 select-text inline ${
        selected
          ? 'bg-[#FFF1B8] text-[#2A211C]'
          : 'hover:bg-[#FFF6E5] active:bg-[#FFF1B8]'
      }`}
      style={selected ? { background: '#FFF1B8' } : undefined}
    >
      {text}
    </span>
  );
}
