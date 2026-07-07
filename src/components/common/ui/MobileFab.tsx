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
 * 모바일 전용 플로팅 등록/작성 버튼 (당근마켓 "+ 글쓰기" 스타일).
 * - 화면 오른쪽 하단 고정(fixed), 하단 네비게이션(72px) 위에 배치
 * - 둥근 캡슐형 · 파란 배경 · 흰 글씨 · + 아이콘 · 그림자
 * - PC(≥768px)에서는 숨김 (md:hidden). PC는 페이지 상단 버튼을 그대로 사용.
 * - 표시 여부(권한)는 상위에서 조건부 렌더링으로 제어한다.
 */
export function MobileFab({ label, onClick, icon, className = '' }: MobileFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`md:hidden fixed right-4 flex items-center gap-1.5 h-12 pl-4 pr-5 rounded-full bg-primary-600 text-white font-bold text-[15px] shadow-lg hover:bg-primary-700 active:scale-95 transition-transform ${className}`}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
        zIndex: 250,
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
      }}
    >
      {icon ?? <Plus className="w-5 h-5" />}
      {label}
    </button>
  );
}
