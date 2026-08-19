/**
 * 성경 단어 원어 팝업 컴포넌트
 *
 * 사용 방법:
 *   - 단어를 클릭하면 단어 위치 기준으로 팝업 표시
 *   - 팝업 외부 클릭 / Esc → 닫기
 *   - "자세히 보기" → BibleWordDetailSheet 열기
 */

import { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, Volume2 } from 'lucide-react';
import type { LexiconEntry, VerseToken } from '../../data/bibleLexicon';
import { getLexiconEntry } from '../../data/bibleLexicon';
import { BibleWordDetailSheet } from './BibleWordDetailSheet';

type Props = {
  token: VerseToken;
  anchorRect: DOMRect;
  onClose: () => void;
};

function LanguageBadge({ language }: { language: 'hebrew' | 'greek' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
      language === 'hebrew'
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      {language === 'hebrew' ? '히브리어' : '헬라어'}
    </span>
  );
}

export function BibleWordPopup({ token, anchorRect, onClose }: Props) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, above: false });

  const entry: LexiconEntry | null = getLexiconEntry(token.strongNumber);

  // 팝업 위치 계산
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const POPUP_W = Math.min(320, W - 32);
    const POPUP_H = 220;
    const GAP = 8;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    let left = anchorRect.left;
    let top = anchorRect.bottom + scrollY + GAP;
    let above = false;

    // 오른쪽 경계
    if (left + POPUP_W > W - 16) {
      left = W - POPUP_W - 16;
    }
    if (left < 8) left = 8;

    // 아래 경계 → 위에 표시
    if (anchorRect.bottom + POPUP_H + GAP > H) {
      top = anchorRect.top + scrollY - POPUP_H - GAP;
      above = true;
    }

    setPos({ top, left, above });
  }, [anchorRect]);

  // 외부 클릭·Esc 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [onClose]);

  return (
    <>
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="false"
        aria-label={`${token.koreanText} 원어 정보`}
        style={{ position: 'absolute', top: pos.top, left: pos.left, width: Math.min(320, window.innerWidth - 32), zIndex: 200 }}
        className={`bg-white rounded-[20px] border border-gray-200 shadow-2xl p-4 space-y-3 transition-all ${pos.above ? 'origin-bottom' : 'origin-top'}`}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-900">{token.koreanText}</span>
              {entry && <LanguageBadge language={entry.language} />}
              {entry && (
                <span className="text-[10px] text-gray-400 font-mono">{entry.strongNumber}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 touch-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {entry ? (
          <>
            {/* 원어 */}
            <div className="space-y-1.5">
              <p className="text-2xl font-bold text-gray-900 leading-tight" lang={entry.language === 'greek' ? 'el' : 'he'}>
                {entry.originalText}
              </p>
              <p className="text-[13px] text-gray-500 font-mono">
                {entry.transliteration} · <span className="not-italic text-gray-600">{entry.pronunciation}</span>
              </p>
            </div>

            {/* 한글 뜻 */}
            <div>
              <p className="text-[15px] font-bold text-gray-800 leading-snug">
                {entry.koreanGlosses.join(' · ')}
              </p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                {entry.englishGloss}
              </p>
            </div>

            {/* 간략 정의 */}
            <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2">
              {entry.briefDefinition}
            </p>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              {entry.audioUrl && (
                <button
                  type="button"
                  aria-label="발음 듣기"
                  className="flex items-center gap-1 text-[12px] text-primary-700 font-semibold px-2.5 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 touch-target"
                  onClick={() => {
                    if (entry.audioUrl) {
                      const audio = new Audio(entry.audioUrl);
                      audio.play().catch(() => {});
                    }
                  }}
                >
                  <Volume2 className="w-3.5 h-3.5" /> 발음
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="flex items-center gap-1 text-[13px] text-primary-700 font-bold px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 touch-target ml-auto"
              >
                자세히 보기 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="py-2">
            <p className="text-sm text-gray-500">이 단어의 상세 정보는 준비 중입니다.</p>
            <p className="text-[12px] text-gray-400 mt-1">{token.koreanText} ({token.strongNumber})</p>
          </div>
        )}
      </div>

      {showDetail && entry && (
        <BibleWordDetailSheet
          entry={entry}
          token={token}
          onClose={() => { setShowDetail(false); onClose(); }}
        />
      )}
    </>
  );
}
