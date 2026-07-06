import type { ReactNode, CSSProperties } from 'react';

/** Churchieum 1.0 설교 메뉴 디자인 토큰 */
export const SERMON_PAGE_BG = '#F8FAFC';

export const sermonCardStyle: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(15,23,42,.04)',
};

export const sermonCardClass =
  'bg-white border border-[#E5E7EB] rounded-card transition-shadow duration-200';

export const sermonInputClass =
  'w-full min-h-[48px] px-4 py-3 text-base text-gray-900 bg-white border border-[#E5E7EB] rounded-input focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';

export const sermonTextareaClass =
  'w-full min-h-[120px] px-4 py-3 text-base text-gray-900 bg-white border border-[#E5E7EB] rounded-input focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none';

export const sermonLabelClass = 'block text-sm font-bold text-gray-800 mb-2';

export const sermonPrimaryBtnClass =
  'inline-flex items-center justify-center gap-2 h-14 px-6 rounded-btn bg-primary-600 text-white font-bold text-base hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50';

export const sermonSecondaryBtnClass =
  'inline-flex items-center justify-center gap-2 h-14 px-6 rounded-btn bg-white border border-[#E5E7EB] text-gray-700 font-bold text-base hover:bg-gray-50 transition-colors';

export const sermonGhostBtnClass =
  'inline-flex items-center justify-center gap-2 h-12 px-4 rounded-btn text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors';

type ShellProps = { children: ReactNode; className?: string };

export function SermonShell({ children, className = '' }: ShellProps) {
  return (
    <div className={`min-h-full ${className}`} style={{ background: SERMON_PAGE_BG }}>
      <div className="mx-auto w-full max-w-[900px] px-4 md:px-7 pb-12">
        {children}
      </div>
    </div>
  );
}

type CardProps = { children: ReactNode; className?: string; hover?: boolean };

export function SermonCard({ children, className = '', hover }: CardProps) {
  return (
    <div
      className={`${sermonCardClass} ${hover ? 'hover:shadow-[0_12px_32px_rgba(15,23,42,.08)] hover:-translate-y-0.5' : ''} ${className}`}
      style={sermonCardStyle}
    >
      {children}
    </div>
  );
}

type SectionProps = { title: string; icon?: ReactNode; children: ReactNode };

export function SermonSectionCard({ title, icon, children }: SectionProps) {
  return (
    <SermonCard className="p-5 md:p-6">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
        {icon}
        {title}
      </h3>
      {children}
    </SermonCard>
  );
}

type HeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SermonPageHeader({ title, description, action }: HeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 pt-1">
      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] font-extrabold text-gray-900 leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[15px] text-[#6B7280] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  );
}
