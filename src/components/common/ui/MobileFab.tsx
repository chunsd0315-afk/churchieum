import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

export interface MobileFabProps {
  label: string;
  onClick: () => void;
  /** Optional custom icon (defaults to Plus) */
  icon?: ReactNode;
  className?: string;
}

/**
 * 모바일 전용 플로팅 등록/작성 버튼 (KB Pay · 카카오페이 스타일).
 * - 화면 오른쪽 하단 고정, 하단 네비게이션 위
 * - 노란 Primary · 검정 글씨 · Soft shadow
 * - PC(≥768px)에서는 숨김
 */
export function MobileFab({ label, onClick, icon, className = '' }: MobileFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`md:hidden fixed right-4 flex items-center gap-1.5 h-12 pl-4 pr-5 rounded-full bg-primary-500 text-[#1A1A1A] font-bold text-[15px] hover:bg-primary-600 active:scale-95 transition-transform ${className}`}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
        zIndex: 250,
        boxShadow: '0 8px 24px rgba(255, 205, 0, 0.40)',
      }}
    >
      {icon ?? <Plus className="w-5 h-5" />}
      {label}
    </button>
  );
}
