import type { ReactNode } from 'react';

/** Churchieum 공통 페이지 헤더 타이포그래피 */

/** PC 22px · 모바일 19px */
export const PAGE_HEADER_TITLE_CLASS =
  'text-[19px] md:text-[22px] font-bold text-[#111827] leading-[1.2]';

/** PC 13px · 모바일 12px — 제목과 4px 간격 */
export const PAGE_HEADER_DESCRIPTION_CLASS =
  'mt-1 text-[12px] md:text-[13px] font-normal text-[#6B7280] leading-[1.4]';

/** 설명 → 본문 간격 (작성 화면) */
export const PAGE_HEADER_SPACING_COMPACT = 'mb-4';
/** 설명 → 본문 간격 (일반 메뉴) */
export const PAGE_HEADER_SPACING_DEFAULT = 'mb-5';

export const MOBILE_PAGE_HEADER_TITLE_CLASS =
  'text-[19px] font-bold text-[#111827] leading-[1.2] text-center';

export const MOBILE_PAGE_HEADER_DESCRIPTION_CLASS =
  'mt-1 text-[12px] font-normal text-[#6B7280] leading-[1.4] text-center';

type TextProps = {
  children: ReactNode;
  className?: string;
  center?: boolean;
};

export function PageHeaderTitle({ children, className = '', center = false }: TextProps) {
  return (
    <h1 className={`${PAGE_HEADER_TITLE_CLASS} ${center ? 'text-center' : ''} ${className}`.trim()}>
      {children}
    </h1>
  );
}

export function PageHeaderDescription({ children, className = '', center = false }: TextProps) {
  return (
    <p className={`${PAGE_HEADER_DESCRIPTION_CLASS} ${center ? 'text-center' : ''} ${className}`.trim()}>
      {children}
    </p>
  );
}

export function PageHeaderTextBlock({
  title,
  description,
  center = false,
}: {
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <>
      <PageHeaderTitle center={center}>{title}</PageHeaderTitle>
      {description && <PageHeaderDescription center={center}>{description}</PageHeaderDescription>}
    </>
  );
}

/** 모바일 고정 서브 헤더 (뒤로가기 옆 가운데 정렬) */
export function MobilePageHeaderCenter({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={MOBILE_PAGE_HEADER_TITLE_CLASS}>{title}</span>
      {description && <span className={MOBILE_PAGE_HEADER_DESCRIPTION_CLASS}>{description}</span>}
    </div>
  );
}
