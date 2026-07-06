type Variant = 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'red' | 'teal';

const STYLES: Record<Variant, string> = {
  blue:   'bg-primary-50  text-primary-600',
  green:  'bg-emerald-50  text-emerald-600',
  purple: 'bg-violet-50   text-violet-600',
  orange: 'bg-accent-50   text-accent-500',
  red:    'bg-red-50      text-red-500',
  teal:   'bg-teal-50     text-teal-600',
  gray:   'bg-gray-100    text-gray-500',
};

type Props = {
  label: string;
  variant?: Variant;
  className?: string;
};

export default function StatusBadge({ label, variant = 'gray', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 font-bold ${STYLES[variant]} ${className}`}
      style={{ height: '24px', borderRadius: '999px', fontSize: '12px', whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  );
}
