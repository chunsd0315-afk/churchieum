import type { UserRole } from '../../../services/permissions';
import {
  resolveProfileImage,
  type ProfileImageRole,
} from '../../../services/profileImage';

export type ChurchAvatarSize = 32 | 40 | 48 | 56 | 64;

export type ChurchAvatarProps = {
  name: string;
  src?: string | null;
  userId?: string | null;
  role?: UserRole | ProfileImageRole | null;
  size?: ChurchAvatarSize;
  className?: string;
};

const SIZE_STYLES: Record<ChurchAvatarSize, string> = {
  32: 'w-8 h-8',
  40: 'w-10 h-10',
  48: 'w-12 h-12',
  56: 'w-14 h-14',
  64: 'w-16 h-16',
};

export function ChurchAvatar({
  name,
  src,
  userId,
  role = 'member',
  size = 40,
  className = '',
}: ChurchAvatarProps) {
  const wh = SIZE_STYLES[size];
  const imageSrc = resolveProfileImage({ userId, role, src });

  return (
    <img
      src={imageSrc}
      alt={name}
      className={`${wh} rounded-full object-cover shrink-0 ${className}`}
    />
  );
}
