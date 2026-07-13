import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  PAGE_HEADER_TITLE_CLASS,
  PAGE_HEADER_DESCRIPTION_CLASS,
} from '../common/ui/PageHeaderTypography';

export type MobilePageShellProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  children: ReactNode;
};

/**
 * Full-page shell for mobile sub-screens.
 * Provides a sticky back-button header and scrollable body.
 */
export function MobilePageShell({
  title,
  subtitle,
  onBack,
  action,
  children,
}: MobilePageShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors shrink-0 -ml-1"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${PAGE_HEADER_TITLE_CLASS} truncate`}>{title}</p>
          {subtitle && (
            <p className={`${PAGE_HEADER_DESCRIPTION_CLASS} truncate`}>{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center gap-1">{action}</div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
