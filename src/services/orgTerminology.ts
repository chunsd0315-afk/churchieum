/**
 * 기본 조직명(terminology) — 표시 라벨·자동생성 조직명 동기화
 *
 * - 조직 ID / legacyKind / 계층은 유지
 * - 자동 생성 이름(예: 1교구)만 종류 명칭 변경 반영
 * - 사용자 지정 이름(예: 예루살렘성가대)은 유지
 */

import type { Organization } from '../types/organization';
import {
  getAllOrganizations,
  getOrgTypes,
  saveAllOrganizations,
  saveOrgTypes,
} from './organizationStorage';

export const DEFAULT_ORG_TERMINOLOGY = {
  level1Label: '교구',
  level2Label: '구역',
  departmentLabel: '부서',
} as const;

/** Context OrgTerminologySettings 와 동일한 필드 — 순환 import 방지용 로컬 타입 */
export type OrgTerminologySettings = {
  level1Enabled?: boolean;
  level2Enabled?: boolean;
  departmentEnabled?: boolean;
  level1Label: string;
  level2Label: string;
  departmentLabel: string;
};

const LS_ORG_SETTINGS = 'org_settings_v1';

function readSettingsFromStorage(): OrgTerminologySettings {
  try {
    const raw = localStorage.getItem(LS_ORG_SETTINGS);
    if (!raw) {
      return {
        level1Enabled: true,
        level2Enabled: true,
        departmentEnabled: true,
        ...DEFAULT_ORG_TERMINOLOGY,
      };
    }
    const parsed = JSON.parse(raw) as Partial<OrgTerminologySettings>;
    return {
      level1Enabled: parsed.level1Enabled ?? true,
      level2Enabled: parsed.level2Enabled ?? true,
      departmentEnabled: parsed.departmentEnabled ?? true,
      level1Label: parsed.level1Label?.trim() || DEFAULT_ORG_TERMINOLOGY.level1Label,
      level2Label: parsed.level2Label?.trim() || DEFAULT_ORG_TERMINOLOGY.level2Label,
      departmentLabel: parsed.departmentLabel?.trim() || DEFAULT_ORG_TERMINOLOGY.departmentLabel,
    };
  } catch {
    return {
      level1Enabled: true,
      level2Enabled: true,
      departmentEnabled: true,
      ...DEFAULT_ORG_TERMINOLOGY,
    };
  }
}

function resolveSettings(settings?: OrgTerminologySettings | null): OrgTerminologySettings {
  return settings ?? readSettingsFromStorage();
}

export type OrgLegacyKind = 'district' | 'zone' | 'department';

export function getOrgLevel1Label(settings?: Pick<OrgTerminologySettings, 'level1Label'> | null): string {
  const s = settings ?? readSettingsFromStorage();
  const v = s.level1Label?.trim();
  return v || DEFAULT_ORG_TERMINOLOGY.level1Label;
}

export function getOrgLevel2Label(settings?: Pick<OrgTerminologySettings, 'level2Label'> | null): string {
  const s = settings ?? readSettingsFromStorage();
  const v = s.level2Label?.trim();
  return v || DEFAULT_ORG_TERMINOLOGY.level2Label;
}

export function getOrgDepartmentLabel(
  settings?: Pick<OrgTerminologySettings, 'departmentLabel'> | null,
): string {
  const s = settings ?? readSettingsFromStorage();
  const v = s.departmentLabel?.trim();
  return v || DEFAULT_ORG_TERMINOLOGY.departmentLabel;
}

/** 조합형: 교구·부서 → 목장·공동체 */
export function getDistrictDepartmentLabel(
  settings?: Pick<OrgTerminologySettings, 'level1Label' | 'departmentLabel'> | null,
): string {
  return `${getOrgLevel1Label(settings)}·${getOrgDepartmentLabel(settings)}`;
}

export function getOrgTypeLabelByLegacyKind(
  kind: OrgLegacyKind | null | undefined,
  settings?: OrgTerminologySettings | null,
): string {
  if (kind === 'district') return getOrgLevel1Label(settings);
  if (kind === 'zone') return getOrgLevel2Label(settings);
  if (kind === 'department') return getOrgDepartmentLabel(settings);
  return '조직';
}

/** 숫자+종류명 자동생성 패턴 (예: 1교구, 12 구역) */
export function isGeneratedOrganizationName(name: string, typeLabel: string): boolean {
  const label = typeLabel.trim();
  if (!label || !name.trim()) return false;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\d+\\s*${escaped}$`).test(name.trim());
}

export function applyGeneratedOrganizationName(
  name: string,
  oldLabel: string,
  newLabel: string,
): string {
  if (!oldLabel.trim() || oldLabel === newLabel) return name;
  if (!isGeneratedOrganizationName(name, oldLabel)) return name;
  const escaped = oldLabel.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return name.trim().replace(new RegExp(`^(\\d+)\\s*${escaped}$`), `$1${newLabel.trim()}`);
}

export function validateOrgTerminologyLabel(raw: string, maxLen = 10): string | null {
  const v = raw.trim();
  if (!v) return '조직명을 입력해 주세요.';
  if (v.length > maxLen) return `조직명은 ${maxLen}자 이내로 입력해 주세요.`;
  return null;
}

function mapLabelForKind(
  kind: OrgLegacyKind,
  settings: Pick<OrgTerminologySettings, 'level1Label' | 'level2Label' | 'departmentLabel'>,
): string {
  if (kind === 'district') return getOrgLevel1Label(settings);
  if (kind === 'zone') return getOrgLevel2Label(settings);
  return getOrgDepartmentLabel(settings);
}

/**
 * 이전 terminology → 새 terminology 로
 * 시스템 종류명·조직 type·자동생성 name 을 동기화한다.
 */
export function syncOrganizationTerminology(
  prev: Pick<OrgTerminologySettings, 'level1Label' | 'level2Label' | 'departmentLabel'>,
  next: Pick<OrgTerminologySettings, 'level1Label' | 'level2Label' | 'departmentLabel'>,
): { renamedOrgs: number; updatedTypes: number } {
  const pairs: { kind: OrgLegacyKind; typeId: string; oldLabel: string; newLabel: string }[] = [
    {
      kind: 'district',
      typeId: 't-district',
      oldLabel: getOrgLevel1Label(prev),
      newLabel: getOrgLevel1Label(next),
    },
    {
      kind: 'zone',
      typeId: 't-zone',
      oldLabel: getOrgLevel2Label(prev),
      newLabel: getOrgLevel2Label(next),
    },
    {
      kind: 'department',
      typeId: 't-dept',
      oldLabel: getOrgDepartmentLabel(prev),
      newLabel: getOrgDepartmentLabel(next),
    },
  ];

  let updatedTypes = 0;
  const types = getOrgTypes().map(t => ({ ...t }));
  for (const p of pairs) {
    if (p.oldLabel === p.newLabel) continue;
    for (const t of types) {
      if (t.id === p.typeId || t.name === p.oldLabel) {
        if (t.name !== p.newLabel) {
          t.name = p.newLabel;
          updatedTypes += 1;
        }
      }
    }
  }
  if (updatedTypes > 0) saveOrgTypes(types);

  let renamedOrgs = 0;
  const orgs = getAllOrganizations().map(o => ({ ...o }));
  const ts = new Date().toISOString();

  for (const org of orgs) {
    let changed = false;
    for (const p of pairs) {
      if (p.oldLabel === p.newLabel) continue;

      const kindMatch = org.legacyKind === p.kind;
      if (kindMatch || org.type === p.oldLabel) {
        const nextType = kindMatch ? p.newLabel : (org.type === p.oldLabel ? p.newLabel : org.type);
        if (org.type !== nextType) {
          org.type = nextType;
          changed = true;
        }
      }

      const nextName = applyGeneratedOrganizationName(org.name, p.oldLabel, p.newLabel);
      if (nextName !== org.name) {
        org.name = nextName;
        changed = true;
        renamedOrgs += 1;
      }
    }
    if (changed) org.updatedAt = ts;
  }

  if (renamedOrgs > 0 || updatedTypes > 0) {
    saveAllOrganizations(orgs);
  }

  return { renamedOrgs, updatedTypes };
}

/**
 * 앱 기동 시: 설정 라벨과 시스템 종류명/자동생성 이름이 어긋나면 맞춤
 */
export function ensureOrganizationTerminologySynced(
  settings: Pick<OrgTerminologySettings, 'level1Label' | 'level2Label' | 'departmentLabel'>,
): void {
  const types = getOrgTypes();
  const fromTypes = {
    level1Label: types.find(t => t.id === 't-district')?.name
      ?? DEFAULT_ORG_TERMINOLOGY.level1Label,
    level2Label: types.find(t => t.id === 't-zone')?.name
      ?? DEFAULT_ORG_TERMINOLOGY.level2Label,
    departmentLabel: types.find(t => t.id === 't-dept')?.name
      ?? DEFAULT_ORG_TERMINOLOGY.departmentLabel,
  };

  const target = {
    level1Label: getOrgLevel1Label(settings),
    level2Label: getOrgLevel2Label(settings),
    departmentLabel: getOrgDepartmentLabel(settings),
  };

  if (
    fromTypes.level1Label === target.level1Label
    && fromTypes.level2Label === target.level2Label
    && fromTypes.departmentLabel === target.departmentLabel
  ) {
    // 종류명은 맞지만 자동생성 조직명이 예전 접미사를 쓸 수 있음 → 기본값 대비 한 번 더
    const defaults = { ...DEFAULT_ORG_TERMINOLOGY };
    if (
      defaults.level1Label !== target.level1Label
      || defaults.level2Label !== target.level2Label
      || defaults.departmentLabel !== target.departmentLabel
    ) {
      // 기본 접미사 → 현재 설정으로 자동생성명만 보정
      syncOrganizationTerminology(defaults, target);
    }
    return;
  }

  syncOrganizationTerminology(fromTypes, target);
}

/** 화면 표시용 — 저장된 name 우선 (동기화 후 이미 최신) */
export function getOrganizationDisplayName(
  org: Pick<Organization, 'name' | 'type' | 'legacyKind'>,
  settings?: OrgTerminologySettings | null,
): string {
  void settings;
  return org.name?.trim() || getOrgTypeLabelByLegacyKind(org.legacyKind, settings);
}

export function getOrganizationTypeDisplay(
  org: Pick<Organization, 'type' | 'legacyKind'>,
  settings?: OrgTerminologySettings | null,
): string {
  if (org.legacyKind) return getOrgTypeLabelByLegacyKind(org.legacyKind, settings);
  return org.type?.trim() || '조직';
}

export function getVisibilityLabels(
  settings?: OrgTerminologySettings | null,
): Record<'private' | 'pastor_share' | 'organization_share', string> {
  const dd = getDistrictDepartmentLabel(resolveSettings(settings));
  return {
    private: '나만 보기',
    pastor_share: '담당 교역자와 공유',
    organization_share: `${dd}와 공유`,
  };
}

export function getVisibilityLabelsPastor(
  settings?: OrgTerminologySettings | null,
): Record<'private' | 'pastor_share' | 'organization_share', string> {
  const dd = getDistrictDepartmentLabel(resolveSettings(settings));
  return {
    private: '나만 보기',
    pastor_share: '교역자와 공유',
    organization_share: `${dd}와 공유`,
  };
}

export function getShareTypeFilterLabels(
  settings?: OrgTerminologySettings | null,
): Record<'pastor_share' | 'organization_share', string> {
  const dd = getDistrictDepartmentLabel(resolveSettings(settings));
  return {
    pastor_share: '교역자에게 공유한 기록',
    organization_share: `${dd}에 공유한 기록`,
  };
}

export { mapLabelForKind };
