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

/** 공통 메뉴 설명 (관리자 기준) */
export const HOME_MENU_CATALOG: Record<string, HomeMenuCatalogItem> = {
  sermon: {
    label: '설교',
    description: '예배 설교 말씀을 다시 보고 묵상하세요.',
    icon: BookOpen,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  grace: {
    label: '은혜기록',
    description: '말씀과 삶 속에서 받은 은혜를 기록하고 나누세요.',
    icon: BookHeart,
    bg: 'bg-primary-50',
    iconColor: 'text-primary-500',
  },
  announcement: {
    label: '공지사항',
    description: '교회 소식과 안내를 확인하세요.',
    icon: Megaphone,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
  },
  bulletin: {
    label: '주보',
    description: '예배 순서와 주간 소식을 확인하세요.',
    icon: FileText,
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
  },
  schedule: {
    label: '일정',
    description: '교회 예배와 행사 일정을 확인하세요.',
    icon: Calendar,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  prayer: {
    label: '기도',
    description: '기도제목을 나누고 함께 기도하세요.',
    icon: Heart,
    bg: 'bg-rose-50',
    iconColor: 'text-rose-500',
  },
  album: {
    label: '앨범',
    description: '교회 공동체의 소중한 순간을 함께 나누세요.',
    icon: Image,
    bg: 'bg-pink-50',
    iconColor: 'text-pink-500',
  },
  bible: {
    label: '성경',
    description: '하나님의 말씀을 읽고 묵상하세요.',
    icon: BookMarked,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  biblePlan: {
    label: '성경통독',
    description: '말씀 통독 계획과 진행률을 확인하세요.',
    icon: Book,
    bg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  sharing: {
    label: '교회나눔',
    description: '교회와 교회가 필요한 것을 나누고 함께 성장합니다.',
    icon: HeartHandshake,
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  profile: {
    label: '내정보',
    description: '나의 프로필과 소속 정보를 확인하세요.',
    icon: User,
    bg: 'bg-gray-50',
    iconColor: 'text-gray-500',
  },
  churchInfo: {
    label: '교회정보',
    description: '우리 교회의 기본 정보를 확인하세요.',
    icon: Church,
    bg: 'bg-teal-50',
    iconColor: 'text-teal-500',
  },
  statistics: {
    label: '통계/보고서',
    description: '교회 활동과 참여 현황을 확인하세요.',
    icon: BarChart,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  org: {
    label: '조직관리',
    description: '상위조직, 하위조직, 부서를 관리합니다.',
    icon: Network,
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
  },
  clergy: {
    label: '교역자관리',
    description: '교역자 정보와 담당 조직을 관리합니다.',
    icon: UserCog,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  members: {
    label: '성도관리',
    description: '성도 정보와 소속을 관리합니다.',
    icon: Users,
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  invitations: {
    label: '초대관리',
    description: '교역자와 성도를 초대하고 초대 현황을 관리합니다.',
    icon: Link,
    bg: 'bg-lime-50',
    iconColor: 'text-lime-600',
  },
  settings: {
    label: '설정',
    description: '교회 설정과 관리 항목을 확인하세요.',
    icon: Settings,
    bg: 'bg-slate-50',
    iconColor: 'text-slate-600',
  },
};

export function catalogItem(key: keyof typeof HOME_MENU_CATALOG): HomeMenuCatalogItem {
  return HOME_MENU_CATALOG[key];
}
