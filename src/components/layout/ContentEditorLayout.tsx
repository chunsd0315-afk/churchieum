import { ChevronLeft } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  saveButton?: React.ReactNode;
};

export default function ContentEditorLayout({ title, onBack, children, saveButton }: Props) {
  const { isDesktop } = useBreakpoint();

  const header = (
    <div
      className="sticky top-0 z-20 bg-white flex items-center justify-between px-4 md:px-5 h-14 shrink-0"
      style={{ borderBottom: '1px solid #E5E7EB' }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[15px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" /> 뒤로
      </button>
      <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-gray-900 truncate max-w-[200px]">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {saveButton}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#F8FAFC' }}>
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  /* 모바일: 앱 상단바·하단 네비게이션까지 덮는 풀스크린 작성 화면 */
  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ zIndex: 300, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {header}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
