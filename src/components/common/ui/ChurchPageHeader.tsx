import type { ReactNode } from 'react';
import { PageHeaderBar } from './PageLayout';

export type ChurchPageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/** @deprecated Prefer PageHeaderBar — kept for existing imports */
export function ChurchPageHeader({ title, subtitle, action }: ChurchPageHeaderProps) {
  return <PageHeaderBar title={title} description={subtitle} action={action} />;
}
