import type { AppUser } from '../../../services/permissions';
import { resolveProfileImage } from '../../../services/profileImage';

type UserProfileAvatarProps = {
  user?: Pick<AppUser, 'id' | 'role' | 'name'> | null;
  src?: string | null;
  size?: number;
  className?: string;
  rounded?: 'full' | '2xl';
  alt?: string;
};

/** 로그인 사용자 / 작성자 — 등록 사진 없으면 역할별 3D 기본 프로필 */
export function UserProfileAvatar({
  user,
  src,
  size = 40,
  className = '',
  rounded = 'full',
  alt,
}: UserProfileAvatarProps) {
  const imageSrc = resolveProfileImage({
    userId: user?.id,
    role: user?.role,
    src,
  });
  const radius = rounded === '2xl' ? 'rounded-2xl' : 'rounded-full';

  return (
    <img
      src={imageSrc}
      alt={alt ?? user?.name ?? '프로필'}
      className={`object-cover shrink-0 ${radius} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
