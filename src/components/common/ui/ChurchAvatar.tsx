export type ChurchAvatarSize = 32 | 40 | 48 | 56 | 64;

export type ChurchAvatarProps = {
  name: string;
  src?: string | null;
  size?: ChurchAvatarSize;
};

const SIZE_STYLES: Record<ChurchAvatarSize, { wh: string; text: string }> = {
  32: { wh: 'w-8 h-8',   text: 'text-xs' },
  40: { wh: 'w-10 h-10', text: 'text-sm' },
  48: { wh: 'w-12 h-12', text: 'text-base' },
  56: { wh: 'w-14 h-14', text: 'text-lg' },
  64: { wh: 'w-16 h-16', text: 'text-xl' },
};

export function ChurchAvatar({ name, src, size = 40 }: ChurchAvatarProps) {
  const { wh, text } = SIZE_STYLES[size];
  const initial = (name ?? '?').charAt(0);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${wh} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={[
        wh,
        text,
        'rounded-full shrink-0 flex items-center justify-center',
        'bg-gradient-to-br from-blue-400 to-emerald-400',
        'text-white font-bold select-none',
      ].join(' ')}
    >
      {initial}
    </div>
  );
}
