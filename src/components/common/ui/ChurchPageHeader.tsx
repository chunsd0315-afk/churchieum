import type { ReactNode } from 'react';

export type ChurchPageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function ChurchPageHeader({ title, subtitle, action }: ChurchPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 md:mb-8">
      {/* 메뉴명/설명: PC 전용 (모바일은 고정 App Header와 중복되므로 숨김) */}
      <div className="hidden md:block min-w-0 flex-1">
        <h1 className="text-[28px] font-bold text-[#111827] leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-[15px] font-normal text-[#64748B] leading-snug">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="hidden md:flex shrink-0 items-center gap-2 ml-auto">
          {action}
        </div>
      )}
    </div>
  );
}
