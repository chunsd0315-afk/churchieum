import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center bg-white border border-dashed border-gray-300 ${className}`}
      style={{ borderRadius: '20px', padding: '48px 24px' }}
    >
      <div
        className="flex items-center justify-center bg-gray-50 mb-4"
        style={{ width: '64px', height: '64px', borderRadius: '20px' }}
      >
        <Icon className="text-gray-300" style={{ width: '32px', height: '32px' }} />
      </div>
      <p className="font-bold text-gray-700 mb-1.5" style={{ fontSize: '16px' }}>{title}</p>
      {description && (
        <p className="text-gray-400" style={{ fontSize: '14px', lineHeight: 1.6 }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
