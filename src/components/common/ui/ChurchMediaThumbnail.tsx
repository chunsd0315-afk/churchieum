import { Play } from 'lucide-react';

export type ChurchMediaSize = 'sm' | 'md' | 'lg';

export type ChurchMediaThumbnailProps = {
  src: string;
  type: 'image' | 'video';
  size?: ChurchMediaSize;
  rounded?: boolean;
  alt?: string;
};

const SIZE_STYLES: Record<ChurchMediaSize, string> = {
  sm: 'w-16 h-12',
  md: 'w-24 h-18',
  lg: 'w-full aspect-video',
};

const ROUNDED_STYLES: Record<ChurchMediaSize, string> = {
  sm: 'rounded-xl',
  md: 'rounded-[14px]',
  lg: 'rounded-[20px]',
};

export function ChurchMediaThumbnail({
  src,
  type,
  size = 'md',
  rounded = true,
  alt = '',
}: ChurchMediaThumbnailProps) {
  return (
    <div
      className={[
        'relative overflow-hidden bg-gray-100 shrink-0',
        SIZE_STYLES[size],
        rounded ? ROUNDED_STYLES[size] : '',
      ].join(' ')}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-gray-800 fill-gray-800 ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
