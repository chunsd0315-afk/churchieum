/**
 * 성경 단어 원어 상세 BottomSheet
 *
 * - 모바일: 화면 하단에서 슬라이드 업
 * - PC: 중앙 Dialog
 */

import { useEffect, useRef } from 'react';
import { X, Volume2 } from 'lucide-react';
import type { LexiconEntry, VerseToken } from '../../data/bibleLexicon';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = {
  entry: LexiconEntry;
  token: VerseToken;
  onClose: () => void;
};

function MorphRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-gray-400 w-16 shrink-0">{label}</span>
      <span className="text-[13px] text-gray-800 font-semibold">{value}</span>
    </div>
  );
}

export function BibleWordDetailSheet({ entry, token, onClose }: Props) {
  const { isMobile } = useBreakpoint();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Esc 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 배경 클릭 닫기
  const onBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose();
  };

  const hasMorphology = entry.morphology && Object.values(entry.morphology).some(Boolean);

  const content = (
    <div className="overflow-y-auto" style={{ maxHeight: isMobile ? '75vh' : '80vh' }}>
      {/* 핸들 (모바일) */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-lg font-bold text-gray-900">{token.koreanText}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                entry.language === 'hebrew'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {entry.language === 'hebrew' ? '히브리어' : '헬라어'}
              </span>
              <span className="text-[11px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-full">
                {entry.strongNumber}
              </span>
            </div>
            <p className="text-[12px] text-gray-400">
              {token.bookId} {token.chapter}:{token.verse}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 원어 섹션 */}
        <div className="bg-gray-50 rounded-[18px] p-4 space-y-2.5">
          <p
            className="text-3xl font-bold text-gray-900 leading-tight"
            lang={entry.language === 'greek' ? 'el' : 'he'}
            dir={entry.language === 'hebrew' ? 'rtl' : 'ltr'}
          >
            {entry.originalText}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 font-mono">
              음역: <span className="font-semibold text-gray-800">{entry.transliteration}</span>
            </p>
            <p className="text-sm text-gray-600">
              발음: <span className="font-semibold text-gray-800">{entry.pronunciation}</span>
            </p>
          </div>
          {entry.audioUrl && (
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-primary-700 font-semibold px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 touch-target"
              onClick={() => {
                const audio = new Audio(entry.audioUrl);
                audio.play().catch(() => {});
              }}
            >
              <Volume2 className="w-4 h-4" /> 발음 듣기
            </button>
          )}
        </div>

        {/* 뜻 섹션 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700">한글 뜻</h3>
          <div className="flex flex-wrap gap-2">
            {entry.koreanGlosses.map((g, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-800 text-sm font-semibold border border-primary-100">
                {i + 1}. {g}
              </span>
            ))}
          </div>

          <div className="pt-1">
            <h3 className="text-sm font-bold text-gray-700 mb-1.5">영어</h3>
            <p className="text-sm text-gray-700 italic">{entry.englishGloss}</p>
          </div>
        </div>

        {/* 정의 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-700">원어 의미</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{entry.briefDefinition}</p>
        </div>

        {/* 문맥 해설 */}
        {entry.contextualNote && (
          <div className="rounded-[14px] border border-primary-100 bg-primary-50 p-4 space-y-1">
            <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              {token.bookId} {token.chapter}:{token.verse}에서의 의미
            </h3>
            <p className="text-sm text-primary-900 leading-relaxed">{entry.contextualNote}</p>
          </div>
        )}

        {/* 형태 분석 */}
        {hasMorphology && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">원어 형태 분석</h3>
            <div className="rounded-[14px] border border-gray-200 bg-white divide-y divide-gray-100">
              {[
                { label: '품사', value: entry.morphology?.partOfSpeech },
                { label: '격', value: entry.morphology?.case },
                { label: '수', value: entry.morphology?.number },
                { label: '성', value: entry.morphology?.gender },
                { label: '줄기', value: entry.morphology?.stem },
                { label: '시제', value: entry.morphology?.tense },
                { label: '원형', value: entry.morphology?.lemma },
              ].map(row => row.value ? (
                <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[12px] text-gray-400 w-14 shrink-0">{row.label}</span>
                  <span className="text-[13px] text-gray-900 font-semibold">{row.value}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-end"
        onClick={onBackdropClick}
      >
        <div
          ref={sheetRef}
          className="w-full bg-white rounded-t-[24px] shadow-2xl"
          style={{ maxHeight: '80vh' }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onBackdropClick}
    >
      <div
        ref={sheetRef}
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
      >
        {content}
      </div>
    </div>
  );
}
