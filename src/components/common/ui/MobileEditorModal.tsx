import type { ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';

export interface MobileEditorModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 작성/등록 화면 공통 셸.
 * - 모바일: 앱 상단바·하단 네비게이션까지 덮는 풀스크린(fixed inset-0, z 300, 흰 배경).
 *   상단에 "< 뒤로  {제목}" 헤더, 본문은 내부에서만 스크롤.
 * - PC: 기존처럼 가운데 정렬된 모달 카드(오버레이 + X 닫기).
 */
export function MobileEditorModal({ title, onClose, children }: MobileEditorModalProps) {
  return (
    <div
      className="fixed inset-0 flex md:items-center md:justify-center md:p-4 md:bg-black/50 md:backdrop-blur-sm"
      style={{ zIndex: 300 }}
    >
      <div className="bg-white flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-3xl md:shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="shrink-0 flex items-center gap-2 px-3 md:px-5 h-14 border-b border-gray-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-[15px] font-semibold text-gray-700 hover:text-gray-900 md:hidden"
          >
            <ChevronLeft className="w-5 h-5" /> 뒤로
          </button>
          <h3 className="flex-1 text-center md:text-left text-[15px] md:text-lg font-bold text-gray-900 truncate">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex p-2 hover:bg-gray-100 rounded-xl"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          {/* 모바일에서 제목 가운데 정렬을 위한 좌우 균형 여백 */}
          <span className="w-14 md:hidden" aria-hidden />
        </div>

        {/* 본문 (내부 스크롤) */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
