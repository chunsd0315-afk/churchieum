import React from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';

export type AspectRatio = '16/9' | '4/3' | '1/1' | '3/4';

export interface MediaThumbnailProps {
  src?: string | null;
  alt?: string;
  aspectRatio?: AspectRatio;
  badge?: React.ReactNode;
  playable?: boolean;
  onClick?: () => void;
  className?: string;
  rounded?: string;
}

const aspectClasses: Record<AspectRatio, string> = {
  '16/9': 'aspect-video',
  '4/3':  'aspect-[4/3]',
  '1/1':  'aspect-square',
  '3/4':  'aspect-[3/4]',
};

export function MediaThumbnail({
  src,
  alt = '미디어',
  aspectRatio = '16/9',
  badge,
  playable = false,
  onClick,
  className = '',
  rounded = 'rounded-xl',
}: MediaThumbnailProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={[
        'relative overflow-hidden bg-gray-100',
        aspectClasses[aspectRatio],
        rounded,
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <ImageIcon size={32} />
        </div>
      )}

      {/* Overlay on hover if clickable */}
      {onClick && src && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-[var(--duration-base)]" />
      )}

      {/* Play button */}
      {playable && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
            <Play size={20} className="ml-0.5" />
          </div>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-2 left-2">
          {badge}
        </div>
      )}
    </div>
  );
}
