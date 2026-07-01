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
      className="sticky top-0 z-20 bg-white flex items-center justify-between px-5 h-14 shrink-0"
      style={{ borderBottom: '1px solid #E5E7EB' }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> 뒤로가기
      </button>
      <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-gray-900 truncate max-w-[180px]">
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {header}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
