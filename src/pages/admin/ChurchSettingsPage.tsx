/**
 * 교회이음 설정 — 화면 셸은 공통 AppLayout + SettingsSidebar로 통합되었다.
 * 설정 메뉴 정의와 콘텐츠는 components/admin/settings 에 있으며,
 * 기존 import 경로를 위해 여기서 다시 내보낸다.
 */
export {
  SETTINGS_GROUP_LABELS,
  SETTINGS_GROUP_ORDER,
  DEFAULT_SETTINGS_SUB_PAGE,
  useSettingsItems,
} from '../../components/admin/settings/settingsMenu';
export type {
  SettingsSubPage,
  SettingsGroup,
  SettingsItem,
} from '../../components/admin/settings/settingsMenu';
export { SettingsContent } from '../../components/admin/settings/SettingsContent';
export { SettingsSidebar } from '../../components/admin/settings/SettingsSidebar';
export { SettingsMobileHome } from '../../components/admin/settings/SettingsMobileHome';
export { useSettingsWorkspace } from '../../components/admin/settings/useSettingsWorkspace';
