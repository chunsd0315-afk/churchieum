import { ChevronLeft } from 'lucide-react';

export type BackButtonProps = {
  onClick: () => void;
  /** 기본: 뒤로 */
  label?: string;
  className?: string;
};

/**
 * 앨범·공지·은혜 등 상세화면과 동일한 뒤로가기 버튼.
 * ContentEditorLayout / MobileFullScreenPage에서 사용.
 */
export function BackButton({ onClick, label = '뒤로', className = '' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2 hover:bg-gray-100 active:bg-gray-200 rounded-[10px] transition-colors text-gray-600 touch-target min-h-[44px] ${className}`}
      aria-label={label}
    >
      <ChevronLeft className="w-5 h-5 shrink-0" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
