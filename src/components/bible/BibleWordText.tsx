/**
 * 성경 본문 단어 터치 기능
 * - 원어 매핑이 있는 단어만 클릭 가능
 * - 팝업은 단어 바로 위에 표시 (BibleWordPopup)
 */

import { useCallback, useState } from 'react';
import { tokenizeVerseText, type VerseToken } from '../../data/bibleLexicon';
import { BibleWordPopup } from './BibleWordPopup';
import { BibleWordToken } from './BibleWordToken';

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

  const segments = tokenizeVerseText(bookId, chapter, verse, text);

  const handleWordSelect = useCallback((token: VerseToken, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setActive(prev => {
      if (
        prev?.token.tokenIndex === token.tokenIndex &&
        prev.token.strongNumber === token.strongNumber &&
        prev.token.bookId === token.bookId &&
        prev.token.chapter === token.chapter &&
        prev.token.verse === token.verse
      ) {
        return null;
      }
      return { token, rect };
    });
  }, []);

  const handleClose = useCallback(() => setActive(null), []);

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (!seg.token) {
          return <span key={idx}>{seg.text}</span>;
        }

        const isActive =
          active?.token.tokenIndex === seg.token.tokenIndex &&
          active.token.strongNumber === seg.token.strongNumber &&
          active.token.verse === seg.token.verse &&
          active.token.chapter === seg.token.chapter;

        return (
          <BibleWordToken
            key={idx}
            token={seg.token}
            text={seg.text}
            selected={Boolean(isActive)}
            onSelect={handleWordSelect}
          />
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
