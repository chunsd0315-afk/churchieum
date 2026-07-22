/**
 * 교회이음 메뉴 아이콘 매핑 — v0.4 3D 젤리 + lucide fallback
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

const ICON_3D_BASE = '/icons/3d';

/** 3D WebP 에셋 — public/icons/3d (단일 경로) */
export const menuIconAssets: Partial<Record<MenuIconKey, string>> = {
  sermon: `${ICON_3D_BASE}/sermon.webp`,
  grace: `${ICON_3D_BASE}/grace-record.webp`,
  announcement: `${ICON_3D_BASE}/notice.webp`,
  bulletin: `${ICON_3D_BASE}/bulletin.webp`,
  schedule: `${ICON_3D_BASE}/schedule.webp`,
  prayer: `${ICON_3D_BASE}/prayer.webp`,
  album: `${ICON_3D_BASE}/album.webp`,
  bible: `${ICON_3D_BASE}/bible.webp`,
  biblePlan: `${ICON_3D_BASE}/bible-reading.webp`,
  sharing: `${ICON_3D_BASE}/sharing.webp`,
  profile: `${ICON_3D_BASE}/profile.webp`,
  churchInfo: `${ICON_3D_BASE}/church-info.webp`,
  settings: `${ICON_3D_BASE}/settings.webp`,
  statistics: `${ICON_3D_BASE}/statistics.webp`,
  org: `${ICON_3D_BASE}/organization.webp`,
  clergy: `${ICON_3D_BASE}/pastor-management.webp`,
  members: `${ICON_3D_BASE}/member-management.webp`,
  invitations: `${ICON_3D_BASE}/invitation.webp`,
};

/** alt / 접근성 라벨 */
export const menuIconLabels: Record<MenuIconKey, string> = {
  home: '홈',
  sermon: '설교',
  grace: '은혜와 기도',
  announcement: '공지사항',
  bulletin: '주보',
  schedule: '일정',
  prayer: '기도',
  album: '앨범',
  bible: '성경',
  biblePlan: '성경통독',
  sharing: '교회나눔',
  profile: '내정보',
  churchInfo: '교회정보',
  statistics: '통계/보고서',
  org: '조직관리',
  clergy: '교역자관리',
  members: '성도관리',
  invitations: '초대관리',
  settings: '설정',
};

export function getMenuIconLabel(key: MenuIconKey): string {
  return menuIconLabels[key] ?? '메뉴';
}

/** lucide fallback — 사이드바·하단 내비·에셋 실패 시 */
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

const FALLBACK_LUCIDE = Circle;

export function getMenuLucideIcon(key: MenuIconKey): LucideIcon {
  return menuLucideIcons[key] ?? FALLBACK_LUCIDE;
}

export function getMenuIconAsset(key: MenuIconKey): string | undefined {
  const url = menuIconAssets[key];
  return url && url.trim().length > 0 ? url : undefined;
}
