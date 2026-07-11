/**
 * 교회이음 메뉴 아이콘 매핑
 *
 * - 기본: lucide-react (임시)
 * - 최종 3D 에셋: menuIconAssets에 PNG/WebP/SVG URL 추가 후 자동 교체
 *
 * 예시 (에셋 준비 후):
 *   import sermonIcon from '../assets/icons/sermon.webp';
 *   menuIconAssets.sermon = sermonIcon;
 */
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  Circle,
  HandHeart,
  Home,
  Images,
  MailPlus,
  Megaphone,
  Newspaper,
  Settings,
  Share2,
  Sparkles,
  User,
  Users,
  UserRound,
  Video,
  GitBranch,
} from 'lucide-react';

export type MenuIconKey =
  | 'home'
  | 'sermon'
  | 'grace'
  | 'announcement'
  | 'bulletin'
  | 'schedule'
  | 'prayer'
  | 'album'
  | 'bible'
  | 'biblePlan'
  | 'sharing'
  | 'profile'
  | 'churchInfo'
  | 'statistics'
  | 'org'
  | 'clergy'
  | 'members'
  | 'invitations'
  | 'settings';

/** lucide 임시 아이콘 — 메뉴 키별 1:1 매핑 */
export const menuLucideIcons: Record<MenuIconKey, LucideIcon> = {
  home: Home,
  sermon: Video,
  grace: Sparkles,
  announcement: Megaphone,
  bulletin: Newspaper,
  schedule: Calendar,
  prayer: HandHeart,
  album: Images,
  bible: BookOpen,
  biblePlan: BookMarked,
  sharing: Share2,
  profile: User,
  churchInfo: Building2,
  statistics: BarChart3,
  org: GitBranch,
  clergy: UserRound,
  members: Users,
  invitations: MailPlus,
  settings: Settings,
};

/**
 * 최종 3D 아이콘 에셋 URL — 파일 추가 후 여기에만 등록
 * 비어 있으면 lucide fallback 사용
 */
export const menuIconAssets: Partial<Record<MenuIconKey, string>> = {
  // sermon: sermonIcon,
  // notice: noticeIcon,
};

const FALLBACK_LUCIDE = Circle;

export function getMenuLucideIcon(key: MenuIconKey): LucideIcon {
  return menuLucideIcons[key] ?? FALLBACK_LUCIDE;
}

export function getMenuIconAsset(key: MenuIconKey): string | undefined {
  const url = menuIconAssets[key];
  return url && url.trim().length > 0 ? url : undefined;
}
