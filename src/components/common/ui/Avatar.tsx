import type { UserRole } from '../../../services/permissions';
import {
  resolveProfileImage,
  type ProfileImageRole,
  roleToProfileImageRole,
} from '../../../services/profileImage';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  userId?: string | null;
  role?: UserRole | ProfileImageRole | null;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; badge: string }> = {
  xs: { container: 'w-6 h-6',   badge: 'w-1.5 h-1.5 -right-px -bottom-px' },
  sm: { container: 'w-8 h-8',   badge: 'w-2 h-2 -right-px -bottom-px' },
  md: { container: 'w-10 h-10', badge: 'w-2.5 h-2.5 right-0 bottom-0' },
  lg: { container: 'w-12 h-12', badge: 'w-3 h-3 right-0 bottom-0' },
  xl: { container: 'w-16 h-16', badge: 'w-3.5 h-3.5 right-0.5 bottom-0.5' },
};

export function Avatar({
  src,
  name,
  userId,
  role,
  size = 'md',
  online,
  className = '',
}: AvatarProps) {
  const { container, badge } = sizeClasses[size];
  const imageSrc = resolveProfileImage({
    userId,
    role: role ?? roleToProfileImageRole(null),
    src,
  });

  return (
    <div className={`relative inline-flex shrink-0 ${container} ${className}`}>
      <img
        src={imageSrc}
        alt={name ?? '프로필'}
        className={`${container} rounded-full object-cover`}
      />
      {online !== undefined && (
        <span
          className={`absolute ${badge} rounded-full ring-2 ring-white ${online ? 'bg-green-500' : 'bg-gray-300'}`}
        />
      )}
    </div>
  );
}
