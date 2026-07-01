import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { MediaThumbnail } from './MediaThumbnail';

export interface PlayerCardProps {
  title: string;
  subtitle?: string;
  thumbnail?: string | null;
  duration?: string;
  currentTime?: string;
  progress?: number;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  compact?: boolean;
  className?: string;
}

export function PlayerCard({
  title,
  subtitle,
  thumbnail,
  duration,
  currentTime,
  progress = 0,
  isPlaying = false,
  onPlay,
  onPause,
  onPrev,
  onNext,
  compact = false,
  className = '',
}: PlayerCardProps) {
  const togglePlay = isPlaying ? onPause : onPlay;
  const btnBase = 'flex items-center justify-center rounded-full transition-[background-color,transform] duration-[var(--duration-base)] active:scale-95';

  if (compact) {
    return (
      <div className={`flex items-center gap-3 bg-white border border-gray-200 rounded-card p-3 shadow-card-md ${className}`}>
        <MediaThumbnail src={thumbnail} aspectRatio="1/1" rounded="rounded-lg" className="w-12 h-12" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onPrev && (
            <button type="button" onClick={onPrev} aria-label="이전" className={`${btnBase} w-8 h-8 text-gray-500 hover:bg-gray-100`}>
              <SkipBack size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className={`${btnBase} w-10 h-10 bg-primary-500 text-white hover:bg-primary-600`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          {onNext && (
            <button type="button" onClick={onNext} aria-label="다음" className={`${btnBase} w-8 h-8 text-gray-500 hover:bg-gray-100`}>
              <SkipForward size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-card overflow-hidden shadow-card-md ${className}`}>
      <MediaThumbnail src={thumbnail} aspectRatio="16/9" rounded="rounded-none" />
      <div className="p-4 flex flex-col gap-4">
        <div>
          <p className="text-base font-bold text-gray-900 leading-snug">{title}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{currentTime ?? '0:00'}</span>
            <span>{duration ?? '0:00'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {onPrev && (
            <button type="button" onClick={onPrev} aria-label="이전" className={`${btnBase} w-10 h-10 text-gray-500 hover:bg-gray-100`}>
              <SkipBack size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className={`${btnBase} w-14 h-14 bg-primary-500 text-white hover:bg-primary-600 shadow-btn-primary`}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>
          {onNext && (
            <button type="button" onClick={onNext} aria-label="다음" className={`${btnBase} w-10 h-10 text-gray-500 hover:bg-gray-100`}>
              <SkipForward size={20} />
            </button>
          )}
          <button type="button" aria-label="볼륨" className={`${btnBase} w-10 h-10 text-gray-400 hover:bg-gray-100 ml-auto`}>
            <Volume2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
