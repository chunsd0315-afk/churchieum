import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image,
  BookMarked, Book, HeartHandshake, User, Church, BarChart, Network,
  UserCog, Users, Link, Settings,
} from 'lucide-react';
import type { NavIcon } from '../../../types/icons';

export type HomeMenuCatalogItem = {
  label: string;
  description: string;
  icon: NavIcon;
  bg: string;
  iconColor: string;
};

/** 교회이음 1.0 — 프리미엄 블루 아이콘 팔레트
 *  (Apple / Fluent / Notion / Stripe 톤: 블루 계열 다색, 통일감 유지)
 *  각 항목: [카드 배경 tint, 아이콘 컬러] */
const BLUE = {
  primary: { bg: 'bg-blue-50',   ic: 'text-blue-600'   }, // Primary   #2563EB
  deep:    { bg: 'bg-blue-50',   ic: 'text-blue-700'   }, // Secondary #1D4ED8
  indigo:  { bg: 'bg-indigo-50', ic: 'text-indigo-600' }, // Indigo    #4F46E5
  sky:     { bg: 'bg-sky-50',    ic: 'text-sky-500'    }, // Sky Blue  #0EA5E9
  teal:    { bg: 'bg-teal-50',   ic: 'text-teal-700'   }, // Teal      #0F766E
  cyan:    { bg: 'bg-cyan-50',   ic: 'text-cyan-600'   }, // Cyan Blue #0891B2
  slate:   { bg: 'bg-slate-100', ic: 'text-slate-500'  }, // Blue Gray #647488
} as const;

export const HOME_MENU_CATALOG: Record<string, HomeMenuCatalogItem> = {
  sermon: {
    label: '설교',
    description: '예배 설교 말씀을 다시 보고 묵상하세요.',
    icon: BookOpen,
    bg: BLUE.primary.bg,
    iconColor: BLUE.primary.ic,
  },
  grace: {
    label: '은혜기록',
    description: '말씀과 삶 속에서 받은 은혜를 기록하고 나누세요.',
    icon: BookHeart,
    bg: BLUE.indigo.bg,
    iconColor: BLUE.indigo.ic,
  },
  announcement: {
    label: '공지사항',
    description: '교회 소식과 안내를 확인하세요.',
    icon: Megaphone,
    bg: BLUE.indigo.bg,
    iconColor: BLUE.indigo.ic,
  },
  bulletin: {
    label: '주보',
    description: '예배 순서와 주간 소식을 확인하세요.',
    icon: FileText,
    bg: BLUE.primary.bg,
    iconColor: BLUE.primary.ic,
  },
  schedule: {
    label: '일정',
    description: '교회 예배와 행사 일정을 확인하세요.',
    icon: Calendar,
    bg: BLUE.indigo.bg,
    iconColor: BLUE.indigo.ic,
  },
  prayer: {
    label: '기도',
    description: '기도제목을 나누고 함께 기도하세요.',
    icon: Heart,
    bg: BLUE.sky.bg,
    iconColor: BLUE.sky.ic,
  },
  album: {
    label: '앨범',
    description: '교회 공동체의 소중한 순간을 함께 나누세요.',
    icon: Image,
    bg: BLUE.indigo.bg,
    iconColor: BLUE.indigo.ic,
  },
  bible: {
    label: '성경',
    description: '하나님의 말씀을 읽고 묵상하세요.',
    icon: BookMarked,
    bg: BLUE.primary.bg,
    iconColor: BLUE.primary.ic,
  },
  biblePlan: {
    label: '성경통독',
    description: '말씀 통독 계획과 진행률을 확인하세요.',
    icon: Book,
    bg: BLUE.cyan.bg,
    iconColor: BLUE.cyan.ic,
  },
  sharing: {
    label: '교회나눔',
    description: '교회와 교회가 필요한 것을 나누고 함께 성장합니다.',
    icon: HeartHandshake,
    bg: BLUE.teal.bg,
    iconColor: BLUE.teal.ic,
  },
  profile: {
    label: '내정보',
    description: '나의 프로필과 소속 정보를 확인하세요.',
    icon: User,
    bg: BLUE.slate.bg,
    iconColor: BLUE.slate.ic,
  },
  churchInfo: {
    label: '교회정보',
    description: '우리 교회의 기본 정보를 확인하세요.',
    icon: Church,
    bg: BLUE.primary.bg,
    iconColor: BLUE.primary.ic,
  },
  statistics: {
    label: '통계/보고서',
    description: '교회 활동과 참여 현황을 확인하세요.',
    icon: BarChart,
    bg: BLUE.teal.bg,
    iconColor: BLUE.teal.ic,
  },
  org: {
    label: '조직관리',
    description: '상위조직, 하위조직, 부서를 관리합니다.',
    icon: Network,
    bg: BLUE.slate.bg,
    iconColor: BLUE.slate.ic,
  },
  clergy: {
    label: '교역자관리',
    description: '교역자 정보와 담당 조직을 관리합니다.',
    icon: UserCog,
    bg: BLUE.primary.bg,
    iconColor: BLUE.primary.ic,
  },
  members: {
    label: '성도관리',
    description: '성도 정보와 소속을 관리합니다.',
    icon: Users,
    bg: BLUE.sky.bg,
    iconColor: BLUE.sky.ic,
  },
  invitations: {
    label: '초대관리',
    description: '교역자와 성도를 초대하고 초대 현황을 관리합니다.',
    icon: Link,
    bg: BLUE.cyan.bg,
    iconColor: BLUE.cyan.ic,
  },
  settings: {
    label: '설정',
    description: '교회 설정과 관리 항목을 확인하세요.',
    icon: Settings,
    bg: BLUE.slate.bg,
    iconColor: BLUE.slate.ic,
  },
};

export function catalogItem(key: keyof typeof HOME_MENU_CATALOG): HomeMenuCatalogItem {
  return HOME_MENU_CATALOG[key];
}
