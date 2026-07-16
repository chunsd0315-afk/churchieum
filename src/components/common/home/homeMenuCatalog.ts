import type { MenuIconKey } from '../../../config/menuIconMap';

export type HomeMenuCatalogItem = {
  label: string;
  description: string;
  iconKey: MenuIconKey;
};

/** 교회이음 v3 — 3D 젤리 아이콘 메뉴 카탈로그 (단일 매핑) */
export const HOME_MENU_CATALOG: Record<string, HomeMenuCatalogItem> = {
  sermon: {
    label: '설교',
    description: '예배 설교 말씀을 다시 보고 묵상하세요.',
    iconKey: 'sermon',
  },
  grace: {
    label: '은혜기록',
    description: '말씀과 삶 속에서 받은 은혜를 기록하고 나누세요.',
    iconKey: 'grace',
  },
  announcement: {
    label: '공지사항',
    description: '교회 소식과 안내를 확인하세요.',
    iconKey: 'announcement',
  },
  bulletin: {
    label: '주보',
    description: '예배 순서와 주간 소식을 확인하세요.',
    iconKey: 'bulletin',
  },
  schedule: {
    label: '일정',
    description: '교회 예배와 행사 일정을 확인하세요.',
    iconKey: 'schedule',
  },
  prayer: {
    label: '기도',
    description: '기도제목을 나누고 함께 기도하세요.',
    iconKey: 'prayer',
  },
  album: {
    label: '앨범',
    description: '교회 공동체의 소중한 순간을 함께 나누세요.',
    iconKey: 'album',
  },
  bible: {
    label: '성경',
    description: '하나님의 말씀을 읽고 묵상하세요.',
    iconKey: 'bible',
  },
  biblePlan: {
    label: '성경통독',
    description: '말씀 통독 계획과 진행률을 확인하세요.',
    iconKey: 'biblePlan',
  },
  sharing: {
    label: '교회나눔',
    description: '교회와 교회가 필요한 것을 나누고 함께 성장합니다.',
    iconKey: 'sharing',
  },
  profile: {
    label: '내정보',
    description: '나의 프로필과 소속 정보를 확인하세요.',
    iconKey: 'profile',
  },
  churchInfo: {
    label: '교회정보',
    description: '우리 교회의 기본 정보를 확인하세요.',
    iconKey: 'churchInfo',
  },
  statistics: {
    label: '통계/보고서',
    description: '교회 활동과 참여 현황을 확인하세요.',
    iconKey: 'statistics',
  },
  org: {
    label: '조직관리',
    description: '상위조직, 하위조직, 부서를 관리합니다.',
    iconKey: 'org',
  },
  clergy: {
    label: '교역자관리',
    description: '교역자 정보와 담당 조직을 관리합니다.',
    iconKey: 'clergy',
  },
  members: {
    label: '성도관리',
    description: '성도 정보와 소속을 관리합니다.',
    iconKey: 'members',
  },
  invitations: {
    label: '초대관리',
    description: '교역자와 성도를 초대하고 초대 현황을 관리합니다.',
    iconKey: 'invitations',
  },
  settings: {
    label: '설정',
    description: '교회 설정과 관리 항목을 확인하세요.',
    iconKey: 'settings',
  },
};

export function catalogItem(key: keyof typeof HOME_MENU_CATALOG): HomeMenuCatalogItem {
  return HOME_MENU_CATALOG[key];
}
