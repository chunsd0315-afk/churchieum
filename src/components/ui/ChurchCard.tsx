import type { ReactNode, HTMLAttributes } from 'react';

export type ChurchCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
};

export function ChurchCard({ children, hover = false, className = '', onClick, ...rest }: ChurchCardProps) {
  const base = [
    'bg-white border border-gray-200 rounded-[20px] p-5',
    'shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
    'transition-all duration-200',
    hover || onClick
      ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] cursor-pointer'
      : '',
    className,
  ].join(' ');

  return (
    <div {...rest} onClick={onClick} className={base}>
      {children}
    </div>
  );
}
