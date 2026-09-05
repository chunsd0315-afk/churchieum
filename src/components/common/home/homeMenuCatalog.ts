import type { MenuIconKey } from '../../../config/menuIconMap';
import {
  getPastorLabel,
  getPastorTerminologyPhrases,
  type OrgTerminologySettings,
} from '../../../services/orgTerminology';

export type HomeMenuCatalogItem = {
  label: string;
  description: string;
  iconKey: MenuIconKey;
};

/** 교회이음 v3 — 3D 젤리 아이콘 메뉴 카탈로그 (단일 매핑) */
export const HOME_MENU_CATALOG: Record<string, HomeMenuCatalogItem> = {
  sermon: {
    label: '설교',
    description: '하나님의 말씀',
    iconKey: 'sermon',
  },
  grace: {
    label: '은혜와 기도',
    description: '함께 기도해요',
    iconKey: 'grace',
  },
  announcement: {
    label: '공지사항',
    description: '교회 소식을 전해요',
    iconKey: 'announcement',
  },
  bulletin: {
    label: '주보',
    description: '이번 주 주보',
    iconKey: 'bulletin',
  },
  schedule: {
    label: '일정',
    description: '교회 일정을 확인하세요',
    iconKey: 'schedule',
  },
  prayer: {
    label: '기도',
    description: '함께 기도해요',
    iconKey: 'prayer',
  },
  album: {
    label: '앨범',
    description: '소중한 순간',
    iconKey: 'album',
  },
  bible: {
    label: '성경',
    description: '말씀을 읽어요',
    iconKey: 'bible',
  },
  biblePlan: {
    label: '성경통독',
    description: '통독 계획',
    iconKey: 'biblePlan',
  },
  sharing: {
    label: '교회나눔',
    description: '함께 나눠요',
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

/** 교역자 표시명 등 교회별 용어 반영 */
export function resolveCatalogItem(
  key: keyof typeof HOME_MENU_CATALOG,
  settings?: OrgTerminologySettings | null,
): HomeMenuCatalogItem {
  const base = HOME_MENU_CATALOG[key];
  if (key === 'clergy') {
    const phrases = getPastorTerminologyPhrases(settings);
    return {
      ...base,
      label: phrases.management,
      description: `${phrases.label} 정보와 담당 조직을 관리합니다.`,
    };
  }
  if (key === 'invitations') {
    const p = getPastorLabel(settings);
    return {
      ...base,
      description: `성도 및 ${p}를 초대하고 초대 현황을 관리합니다.`,
    };
  }
  return base;
}
