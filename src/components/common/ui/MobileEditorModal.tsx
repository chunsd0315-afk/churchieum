import { useEffect, type ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { EditorPageHeader, MobileEditorPageHeader } from './PageLayout';

export interface MobileEditorModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** PC 모달 우측 액션 (기본: 닫기 버튼) */
  trailing?: ReactNode;
}

/**
 * 작성/등록 화면 공통 셸.
 * - PC: EditorPageHeader + 가운데 정렬 모달 카드
 * - 모바일: MobileEditorPageHeader + 풀스크린 오버레이
 */
export function MobileEditorModal({ title, description, onClose, children, trailing }: MobileEditorModalProps) {
  const { isPc } = useBreakpoint();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const backButton = (
    <button
      type="button"
      onClick={onClose}
      className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600 touch-target"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-medium">뒤로</span>
    </button>
  );

  const closeButton = trailing ?? (
    <button
      type="button"
      onClick={onClose}
      className="p-2 hover:bg-gray-100 rounded-xl touch-target"
      aria-label="닫기"
    >
      <X className="w-5 h-5 text-gray-500" />
    </button>
  );

  const header = isPc ? (
    <EditorPageHeader
      title={title}
      description={description}
      trailing={closeButton}
      className="rounded-t-3xl"
    />
  ) : (
    <MobileEditorPageHeader
      title={title}
      description={description}
      leading={backButton}
    />
  );

  return (
    <div
      className="fixed inset-0 flex md:items-center md:justify-center md:p-4 md:bg-black/50 md:backdrop-blur-sm"
      style={{ zIndex: 300 }}
    >
      <div className="bg-[#F8FAFC] flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-[900px] md:rounded-3xl md:shadow-2xl overflow-hidden min-h-0">
        <div className="shrink-0">{header}</div>
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="w-full max-w-[900px] mx-auto" style={{ padding: '24px 24px 40px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
