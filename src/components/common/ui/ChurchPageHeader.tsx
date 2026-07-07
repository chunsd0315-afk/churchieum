import type { ReactNode } from 'react';

export type ChurchPageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function ChurchPageHeader({ title, subtitle, action }: ChurchPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* 메뉴명/설명: PC 전용 (모바일은 고정 상단바와 중복되므로 숨김) */}
      <div className="hidden md:block min-w-0">
        <h1
          className="font-extrabold text-gray-900 leading-tight"
          style={{ fontSize: 28, letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-gray-500 leading-relaxed"
            style={{ fontSize: 15, marginTop: 6 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-2 mt-1 ml-auto">
          {action}
        </div>
      )}
    </div>
  );
}
