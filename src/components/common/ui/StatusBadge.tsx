export type StatusVariant =
  | 'active' | 'inactive' | 'pending' | 'success'
  | 'warning' | 'error' | 'info' | 'draft' | 'published';

export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  dot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusVariant, { label: string; classes: string; dot: string }> = {
  active:    { label: '활성',   classes: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  inactive:  { label: '비활성', classes: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
  pending:   { label: '대기',   classes: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  success:   { label: '완료',   classes: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  warning:   { label: '주의',   classes: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  error:     { label: '오류',   classes: 'bg-red-100 text-red-600',       dot: 'bg-red-500' },
  info:      { label: '정보',   classes: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  draft:     { label: '임시저장', classes: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
  published: { label: '게시됨', classes: 'bg-primary-100 text-primary-700', dot: 'bg-primary-500' },
};

export function StatusBadge({ status, label, dot = true, className = '' }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
        cfg.classes,
        className,
      ].join(' ')}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
      {label ?? cfg.label}
    </span>
  );
}
