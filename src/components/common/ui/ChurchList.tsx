import type { ReactNode } from 'react';

/** Continuous list container — no item gaps; rows separated by divide-y / border-b */
export const CHURCH_LIST_CLASS =
  'bg-white border border-gray-200 overflow-hidden rounded-card divide-y divide-gray-100';

/** Single list row — internal padding only; no shadow / rounded / outer margin */
export const CHURCH_LIST_ROW_CLASS =
  'w-full bg-white px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80 active:bg-gray-50 touch-target';

export type ChurchListProps = {
  className?: string;
  children: ReactNode;
};

export function ChurchList({ className = '', children }: ChurchListProps) {
  return (
    <div className={[CHURCH_LIST_CLASS, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
