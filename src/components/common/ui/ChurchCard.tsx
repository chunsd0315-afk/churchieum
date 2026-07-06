import type { ReactNode, HTMLAttributes } from 'react';

export type ChurchCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
};

export function ChurchCard({ children, hover = false, className = '', onClick, ...rest }: ChurchCardProps) {
  const base = [
    'church-card',
    hover || onClick ? 'church-card-interactive' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div {...rest} onClick={onClick} className={base}>
      {children}
    </div>
  );
}
