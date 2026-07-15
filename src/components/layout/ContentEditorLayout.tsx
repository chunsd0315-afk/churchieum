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
  /** 하단 고정 액션 바 (공감·기도 등). 모바일 safe-area 반영 */
  footer?: ReactNode;
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
 * 등록/작성/목록 화면 공통 레이아웃
 * - PC: EditorPageHeader (뒤로 + 제목/설명 Flex) + 900px 폼
 * - 모바일: 고정 상단/하단 네비까지 덮는 Full Screen (z-300)
 */
export default function ContentEditorLayout({
  title,
  description,
  onBack,
  children,
  saveButton,
  mobileHeaderVariant = 'editor',
  footer,
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

  const contentPadBottom = footer
    ? '24px'
    : 'calc(24px + env(safe-area-inset-bottom, 0px))';

  const body = (
    <>
      {header}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        <div
          className="w-full max-w-[900px] mx-auto"
          style={{ padding: `24px 24px ${contentPadBottom}` }}
        >
          {children}
        </div>
      </div>
      {footer && (
        <div
          className="shrink-0 bg-white border-t border-gray-100"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="w-full max-w-[900px] mx-auto px-4 py-3">
            {footer}
          </div>
        </div>
      )}
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
      className="fixed inset-0 flex flex-col bg-white overflow-hidden"
      style={{
        zIndex: 300,
        width: '100%',
        height: '100dvh',
        paddingBottom: footer ? undefined : 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {body}
    </div>
  );
}

/**
 * 은혜기록 모아보기·담당 성도 등 — 모바일 메뉴형 헤더 + Full Screen
 * (ContentEditorLayout mobileHeaderVariant="subpage" 별칭)
 */
export function MobileFullScreenPage(props: Omit<ContentEditorLayoutProps, 'mobileHeaderVariant'>) {
  return <ContentEditorLayout {...props} mobileHeaderVariant="subpage" />;
}
