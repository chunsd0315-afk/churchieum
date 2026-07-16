import { useEffect, type ReactNode } from 'react';
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
 * 등록/작성/상세 서브페이지 공통 레이아웃
 * - PC: AppLayout main 스크롤 사용 (중첩 overflow / overscroll-contain 없음)
 * - 모바일: fixed Full Screen + 본문 overflow-y-auto (body 잠금은 마운트 시만)
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

  // 모바일 Full Screen만 body 스크롤 잠금 — 닫힐 때 반드시 복구
  useEffect(() => {
    if (isPc) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPc]);

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

  const content = (
    <div
      className="w-full max-w-[900px] mx-auto"
      style={{ padding: `24px 24px ${contentPadBottom}` }}
    >
      {children}
    </div>
  );

  const footerBar = footer ? (
    <div
      className="shrink-0 bg-white border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="w-full max-w-[900px] mx-auto px-4 py-3">
        {footer}
      </div>
    </div>
  ) : null;

  /* PC: 페이지 본문(AppLayout main) 단일 스크롤 — 내부 overflow 금지 */
  if (isPc) {
    return (
      <div
        className="min-h-full"
        style={{ background: '#F8FAFC', margin: '-24px -24px -40px' }}
      >
        <div className="w-full max-w-[900px] mx-auto">
          {header}
          {content}
          {footerBar}
        </div>
      </div>
    );
  }

  /* 모바일: Full Screen — 헤더 고정, 본문만 세로 스크롤 */
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
      <div className="shrink-0">{header}</div>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {content}
      </div>
      {footerBar}
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
