/**
 * 교회이음 설정 메뉴 정의
 * PC 설정 사이드바와 모바일 설정 홈이 같은 목록을 사용한다.
 */
import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bell, Home, LayoutGrid, ToggleLeft } from 'lucide-react';
import type { MenuIconKey } from '../../../config/menuIconMap';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';

export type SettingsSubPage =
  | 'superAdmins'
  | 'clergy'
  | 'members'
  | 'invitations'
  | 'church'
  | 'org'
  | 'appMenus'
  | 'appFeatures'
  | 'appHome'
  | 'appNotifications';

export type SettingsGroup = 'members' | 'church' | 'app';

export type SettingsItem = {
  id: SettingsSubPage;
  title: string;
  description: string;
  group: SettingsGroup;
  /** Soft-3D 메뉴 아이콘 (구성원·교회 관리) */
  iconKey?: MenuIconKey;
  /** Soft-3D 아이콘이 없는 앱 설정 항목 */
  icon?: LucideIcon;
};

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
  members: '구성원 관리',
  church: '교회 관리',
  app: '앱 설정',
};

export const SETTINGS_GROUP_ORDER: SettingsGroup[] = ['members', 'church', 'app'];

export const DEFAULT_SETTINGS_SUB_PAGE: SettingsSubPage = 'superAdmins';

export function useSettingsItems(): SettingsItem[] {
  const { pastorPhrases, terminologyVersion } = useOrgSettings();
  return useMemo(
    () => [
      {
        id: 'superAdmins',
        iconKey: 'profile',
        title: '최고관리자 관리',
        description: '교회 전체를 관리할 최고관리자를 설정합니다',
        group: 'members',
      },
      {
        id: 'clergy',
        iconKey: 'clergy',
        title: pastorPhrases.management,
        description: `담임목사, 부목사, 전도사 등 ${pastorPhrases.label}를 관리합니다`,
        group: 'members',
      },
      {
        id: 'members',
        iconKey: 'members',
        title: '성도 관리',
        description: '성도 명단 조회, 수정, 조직·직분 배정을 합니다',
        group: 'members',
      },
      {
        id: 'invitations',
        iconKey: 'invitations',
        title: '초대관리',
        description: pastorPhrases.inviteDescription,
        group: 'members',
      },
      {
        id: 'church',
        iconKey: 'churchInfo',
        title: '교회 기본정보 설정',
        description: '교회 이름, 로고, 주소, 표어 등을 수정합니다',
        group: 'church',
      },
      {
        id: 'org',
        iconKey: 'org',
        title: '조직관리',
        description: '교구·구역·부서 등 교회 조직을 관리합니다',
        group: 'church',
      },
      {
        id: 'appMenus',
        icon: LayoutGrid,
        title: '메뉴 관리',
        description: '홈·사이드바에 표시할 메뉴와 순서를 설정합니다',
        group: 'app',
      },
      {
        id: 'appFeatures',
        icon: ToggleLeft,
        title: '기능 설정',
        description: '댓글, 공감, 공유 등 부가기능을 설정합니다',
        group: 'app',
      },
      {
        id: 'appHome',
        icon: Home,
        title: '홈 화면 설정',
        description: '홈에 표시할 요약 영역을 설정합니다',
        group: 'app',
      },
      {
        id: 'appNotifications',
        icon: Bell,
        title: '알림 설정',
        description: '교회 공통 기본 알림 정책을 설정합니다',
        group: 'app',
      },
    ],
    [pastorPhrases, terminologyVersion],
  );
}
