import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { EditorPageHeader, MobileEditorPageHeader, MobileSubPageHeader } from '../common/ui/PageLayout';

export type ContentEditorLayoutProps = {
  title: string;
  description?: string;
  onBack: () => void;
  children: ReactNode;
  saveButton?: ReactNode;
  /**
   * 모바일 헤더 스타일
   * - editor: 2단 헤더 (기본, 등록/작성 공통)
   * - subpage: 메뉴 페이지와 동일 — 뒤로 + 화면 중앙 제목/설명
   */
  mobileHeaderVariant?: 'editor' | 'subpage';
};

const FORM_CARD_CLASS = 'bg-white rounded-[20px] p-5 md:p-6';
const FORM_CARD_STYLE = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };

/** 등록/작성 폼 공통 카드 */
export function ContentFormCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${FORM_CARD_CLASS} ${className}`} style={FORM_CARD_STYLE}>
      {children}
    </div>
  );
}

/**
 * 등록/작성 화면 공통 레이아웃
 * - PC: EditorPageHeader (뒤로 + 제목/설명 Flex) + 900px 폼
 * - 모바일: mobileHeaderVariant에 따라 2단(editor) 또는 메뉴형(subpage) 헤더
 */
export default function ContentEditorLayout({
  title,
  description,
  onBack,
  children,
  saveButton,
  mobileHeaderVariant = 'editor',
}: ContentEditorLayoutProps) {
  const { isPc } = useBreakpoint();

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600 touch-target"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-medium">뒤로</span>
    </button>
  );

  const headerProps = {
    title,
    description,
    leading: backButton,
    trailing: saveButton,
  };

  const header = isPc
    ? <EditorPageHeader {...headerProps} />
    : mobileHeaderVariant === 'subpage'
      ? <MobileSubPageHeader {...headerProps} />
      : <MobileEditorPageHeader {...headerProps} />;

  const body = (
    <>
      {header}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        <div
          className="w-full max-w-[900px] mx-auto"
          style={{ padding: '24px 24px 40px' }}
        >
          {children}
        </div>
      </div>
    </>
  );

  if (isPc) {
    return (
      <div
        className="flex flex-col h-full min-h-0"
        style={{ background: '#F8FAFC', margin: '-24px -24px -40px' }}
      >
        <div className="w-full max-w-[900px] mx-auto flex-1 flex flex-col min-h-0">
          {body}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#F8FAFC]"
      style={{ zIndex: 300, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {body}
    </div>
  );
}
