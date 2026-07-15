import {
  BookOpen, Mic, PenLine, Library, HeartHandshake,
  Plus, Settings,
  FileText, Archive, Calendar, CalendarDays, CalendarPlus,
  Heart, Users, CheckCircle, Image, FolderOpen,
  BookMarked, Search, Bookmark, NotebookPen,
  PlayCircle, BarChart3, HandHeart, Share2, HelpCircle,
  User, MapPin, Route, Phone, Church,
} from 'lucide-react';
import type { FeatureCardConfig, FeatureHubPageConfig } from '../../components/common/feature-hub/types';
import { HOME_MENU_CATALOG } from '../../components/common/home/homeMenuCatalog';

export const GRACE_HUB_FEATURES: FeatureCardConfig[] = [
  {
    id: 'write',
    title: '은혜기록 작성',
    description: '성경통독·설교·일상에서 받은 은혜를 한곳에서 기록합니다.',
    icon: PenLine,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    id: 'all-list',
    title: '은혜기록 모아보기',
    description: '작성한 은혜기록을 한곳에서 확인하고 검색합니다.',
    icon: Library,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 'pastor-notes',
    title: '담당 성도 은혜기록',
    description: '담당 성도가 공유한 은혜기록을 확인하고 함께 돌봅니다.',
    icon: HeartHandshake,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    roles: ['pastor', 'super_admin'],
  },
];

export const GRACE_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.grace.label,
  description: HOME_MENU_CATALOG.grace.description,
  features: GRACE_HUB_FEATURES,
};

export const BULLETIN_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.bulletin.label,
  description: HOME_MENU_CATALOG.bulletin.description,
  features: [
    { id: 'latest', title: '최신 주보', description: '이번 주 주보를 확인합니다.', icon: FileText, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    { id: 'archive', title: '지난 주보', description: '보관한 주보를 찾아봅니다.', icon: Archive, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { id: 'create', title: '주보 등록', description: '새 주보를 등록합니다.', icon: Plus, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', roles: ['pastor', 'super_admin'] },
    { id: 'manage', title: '주보 관리', description: '주보를 수정·관리합니다.', icon: Settings, iconBg: 'bg-gray-100', iconColor: 'text-gray-600', roles: ['super_admin'] },
  ],
};

export const SCHEDULE_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.schedule.label,
  description: HOME_MENU_CATALOG.schedule.description,
  features: [
    { id: 'month', title: '월간 일정', description: '달력으로 교회 일정을 봅니다.', icon: Calendar, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'week', title: '이번 주 일정', description: '이번 주 예배와 행사를 확인합니다.', icon: CalendarDays, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
    { id: 'create', title: '일정 등록', description: '새 일정을 등록합니다.', icon: CalendarPlus, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', roles: ['pastor', 'super_admin'] },
    { id: 'manage', title: '일정 관리', description: '일정을 수정·관리합니다.', icon: Settings, iconBg: 'bg-gray-100', iconColor: 'text-gray-600', roles: ['super_admin'] },
  ],
};

export const PRAYER_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.prayer.label,
  description: HOME_MENU_CATALOG.prayer.description,
  features: [
    { id: 'my', title: '나의 기도', description: '내가 올린 기도제목을 확인합니다.', icon: Heart, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { id: 'church', title: '공동체 기도', description: '교회 공동 기도제목을 함께 기도합니다.', icon: Users, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'create', title: '기도 작성', description: '새 기도제목을 작성합니다.', icon: Plus, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { id: 'answered', title: '기도 응답', description: '응답받은 기도를 돌아봅니다.', icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'pastor-inbox', title: '공유받은 기도', description: '성도가 공유한 기도를 살핍니다.', icon: HeartHandshake, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', roles: ['pastor', 'super_admin'] },
  ],
};

export const ALBUM_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.album.label,
  description: HOME_MENU_CATALOG.album.description,
  features: [
    { id: 'latest', title: '최신 앨범', description: '최근 업로드된 앨범을 봅니다.', icon: Image, iconBg: 'bg-pink-50', iconColor: 'text-pink-600' },
    { id: 'categories', title: '행사별 앨범', description: '행사·카테고리별로 앨범을 봅니다.', icon: FolderOpen, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { id: 'create', title: '앨범 등록', description: '새 앨범을 만듭니다.', icon: Plus, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', roles: ['pastor', 'super_admin'] },
    { id: 'manage', title: '앨범 관리', description: '앨범을 수정·관리합니다.', icon: Settings, iconBg: 'bg-gray-100', iconColor: 'text-gray-600', roles: ['super_admin'] },
  ],
};

export const BIBLE_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.bible.label,
  description: HOME_MENU_CATALOG.bible.description,
  features: [
    { id: 'browse', title: '성경 읽기', description: '성경을 읽고 묵상합니다.', icon: BookMarked, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { id: 'today', title: '오늘의 말씀', description: '오늘 읽을 말씀을 확인합니다.', icon: BookOpen, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'saved', title: '즐겨찾기', description: '저장한 구절을 다시 봅니다.', icon: Bookmark, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { id: 'memo', title: '말씀 메모', description: '말씀과 묵상을 메모합니다.', icon: NotebookPen, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { id: 'search', title: '말씀 검색', description: '키워드로 말씀을 찾습니다.', icon: Search, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  ],
};

export const BIBLE_PLAN_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.biblePlan.label,
  description: HOME_MENU_CATALOG.biblePlan.description,
  features: [
    { id: 'active', title: '진행 중인 통독', description: '지금 진행 중인 통독 계획을 이어서 읽습니다.', icon: PlayCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { id: 'start', title: '통독 시작', description: '새 통독 계획을 시작합니다.', icon: Plus, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'completed', title: '완독 기록', description: '완독한 계획을 확인합니다.', icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'stats', title: '통독 통계', description: '통독 진행과 통계를 봅니다.', icon: BarChart3, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
  ],
};

export const SHARING_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.sharing.label,
  description: HOME_MENU_CATALOG.sharing.description,
  features: [
    { id: 'all', title: '전체 나눔', description: '교회 간 나눔을 모두 봅니다.', icon: Share2, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { id: 'offer', title: '나눔합니다', description: '나눌 수 있는 것을 올립니다.', icon: HandHeart, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'need', title: '필요합니다', description: '필요한 것을 요청합니다.', icon: HelpCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { id: 'ministry', title: '사역도움', description: '사역 도움을 나누고 받습니다.', icon: Users, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'resource', title: '자료공유', description: '자료를 함께 나눕니다.', icon: FileText, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { id: 'event', title: '행사초대', description: '행사를 초대하고 참여합니다.', icon: Calendar, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { id: 'create', title: '나눔 등록', description: '새 나눔을 등록합니다.', icon: Plus, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', roles: ['pastor', 'super_admin'] },
  ],
};

export const PROFILE_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.profile.label,
  description: HOME_MENU_CATALOG.profile.description,
  features: [
    { id: 'profile', title: '프로필', description: '나의 기본 정보를 확인·수정합니다.', icon: User, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'org', title: '소속 정보', description: '소속 조직과 부서를 확인합니다.', icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'grace', title: '나의 은혜기록', description: '내가 남긴 은혜기록을 봅니다.', icon: BookOpen, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { id: 'timeline', title: '신앙 성장 타임라인', description: '신앙 활동의 흐름을 봅니다.', icon: Route, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { id: 'report', title: '나의 신앙 리포트', description: '나의 신앙 성장을 요약합니다.', icon: BarChart3, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
  ],
};

export const CHURCH_INFO_HUB: FeatureHubPageConfig = {
  title: HOME_MENU_CATALOG.churchInfo.label,
  description: HOME_MENU_CATALOG.churchInfo.description,
  features: [
    { id: 'basic', title: '기본 정보', description: '교회 소개와 기본 정보를 봅니다.', icon: Church, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'worship', title: '예배 안내', description: '예배 시간과 안내를 확인합니다.', icon: Calendar, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'pastors', title: '교역자 안내', description: '교역자 소개를 확인합니다.', icon: Users, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { id: 'location', title: '오시는 길', description: '교회 위치를 확인합니다.', icon: MapPin, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    { id: 'contact', title: '연락처', description: '교회 연락처를 확인합니다.', icon: Phone, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ],
};
