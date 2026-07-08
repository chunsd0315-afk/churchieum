import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = {
  title: string;
  onBack: () => void;
  children: ReactNode;
  saveButton?: ReactNode;
};

export default function ContentEditorLayout({ title, onBack, children, saveButton }: Props) {
  const { isDesktop } = useBreakpoint();

  const header = (
    <div
      className="sticky top-0 z-20 bg-white shrink-0"
      style={{ borderBottom: '1px solid #E5E7EB' }}
    >
      <div className="relative max-w-[900px] mx-auto w-full flex items-center justify-between px-4 md:px-6 h-14">
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
    </div>
  );

  if (isDesktop) {
    /* 상위 콘텐츠 웰(PageContentWell)의 padding(24·24·40)을 상쇄해
       에디터가 900px 폭을 온전히 사용하도록 한다(목록 페이지와 동일 정렬). */
    return (
      <div className="flex flex-col h-full" style={{ background: '#F8FAFC', margin: '-24px -24px -40px' }}>
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[900px] mx-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  /* 모바일: 앱 상단바·하단 네비게이션까지 덮는 풀스크린 작성 화면 (좌우 여백만 유지) */
  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ zIndex: 300, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {header}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-[900px] mx-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
