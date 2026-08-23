import { Filter } from 'lucide-react';

export type DetailSettingsButtonProps = {
  onClick: () => void;
  /** 패널 열림 또는 활성 설정이 있을 때 primary 스타일 */
  active?: boolean;
  /** 닫힌 상태에서 배지로 표시할 활성 설정 개수 */
  activeCount?: number;
  className?: string;
  'aria-expanded'?: boolean;
};

/**
 * 은혜와 기도 목록 상세설정 버튼과 동일한 UI.
 * 목록·작성/수정 화면에서 공통 사용.
 */
export function DetailSettingsButton({
  onClick,
  active = false,
  activeCount = 0,
  className = '',
  'aria-expanded': ariaExpanded,
}: DetailSettingsButtonProps) {
  const isHighlighted = active || activeCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="상세설정"
      aria-expanded={ariaExpanded}
      className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold touch-target min-h-[48px] min-w-[88px] transition-colors ${
        isHighlighted
          ? 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
      } ${className}`}
    >
      <Filter className="w-4 h-4" aria-hidden />
      상세설정
      {activeCount > 0 && (
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{activeCount}</span>
      )}
    </button>
  );
}
