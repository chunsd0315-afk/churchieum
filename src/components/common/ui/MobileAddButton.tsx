import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

export interface MobileAddButtonProps {
  label: string;
  onClick: () => void;
  /** Optional custom icon (defaults to Plus) */
  icon?: ReactNode;
  className?: string;
}

/**
 * 모바일 본문 상단 등록/작성 버튼.
 * 설교 페이지의 "+ 설교 등록" 버튼과 동일한 스타일(파란 배경 · 흰 글씨 · + 아이콘 ·
 * 둥근 모서리 · 가로 폭 넓게 · 동일한 높이/여백/폰트)을 모든 메뉴에서 통일해 사용한다.
 *
 * 표시 여부(모바일 전용)는 상위 컨테이너에서 제어한다.
 */
export function MobileAddButton({ label, onClick, icon, className = '' }: MobileAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 h-12 bg-primary-600 text-white rounded-[14px] font-bold text-[15px] hover:bg-primary-700 transition-colors ${className}`}
    >
      {icon ?? <Plus className="w-5 h-5" />}
      {label}
    </button>
  );
}
