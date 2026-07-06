import { useState } from 'react';
import { Youtube } from 'lucide-react';

export function SermonYoutubeThumb({
  videoId,
  title,
  className = '',
}: {
  videoId: string;
  title: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 ${className}`}>
        <Youtube className="w-8 h-8 text-white opacity-80" />
      </div>
    );
  }
  return (
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt={title}
      className={`object-cover ${className}`}
      onError={() => setErr(true)}
    />
  );
}

export function formatSermonDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
