import type { ReactNode } from 'react';
import {
  PageHeaderTextBlock,
  PAGE_HEADER_SPACING_DEFAULT,
} from '../common/ui/PageHeaderTypography';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <>
      <div className={`hidden md:flex items-start justify-between gap-4 ${PAGE_HEADER_SPACING_DEFAULT}`}>
        <div className="min-w-0">
          <PageHeaderTextBlock title={title} description={subtitle} />
        </div>
        {action && <div className="shrink-0 mt-1">{action}</div>}
      </div>
      {action && (
        <div className="flex md:hidden justify-end mb-4">{action}</div>
      )}
    </>
  );
}
