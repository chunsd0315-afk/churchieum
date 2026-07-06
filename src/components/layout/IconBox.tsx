type Color = 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'red' | 'teal';

const BG: Record<Color, string> = {
  blue:   'bg-primary-50',
  green:  'bg-emerald-50',
  purple: 'bg-violet-50',
  orange: 'bg-accent-50',
  gray:   'bg-gray-100',
  red:    'bg-red-50',
  teal:   'bg-teal-50',
};

const ICON_COLOR: Record<Color, string> = {
  blue:   'text-primary-500',
  green:  'text-emerald-500',
  purple: 'text-violet-500',
  orange: 'text-accent-500',
  gray:   'text-gray-400',
  red:    'text-red-500',
  teal:   'text-teal-500',
};

type Props = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: Color;
  size?: number;
  iconSize?: number;
  className?: string;
};

export default function IconBox({ icon: Icon, color = 'blue', size = 40, iconSize = 18, className = '' }: Props) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${BG[color]} ${className}`}
      style={{ width: size, height: size, borderRadius: '14px' }}
    >
      <Icon className={ICON_COLOR[color]} style={{ width: iconSize, height: iconSize }} />
    </div>
  );
}
