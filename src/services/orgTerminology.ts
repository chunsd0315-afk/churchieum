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
  pastorLabel: '교역자',
} as const;

/** Context OrgTerminologySettings 와 동일한 필드 — 순환 import 방지용 로컬 타입 */
export type OrgTerminologySettings = {
  level1Enabled?: boolean;
  level2Enabled?: boolean;
  departmentEnabled?: boolean;
  level1Label: string;
  level2Label: string;
  departmentLabel: string;
  pastorLabel?: string;
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
      pastorLabel: parsed.pastorLabel?.trim() || DEFAULT_ORG_TERMINOLOGY.pastorLabel,
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

/** 화면 표시용 교역자 그룹 명칭 (역할 enum과 무관) */
export function getPastorLabel(
  settings?: Pick<OrgTerminologySettings, 'pastorLabel'> | null,
): string {
  const s = settings ?? readSettingsFromStorage();
  const v = s.pastorLabel?.trim();
  return v || DEFAULT_ORG_TERMINOLOGY.pastorLabel;
}

export function validatePastorLabel(raw: string, maxLen = 10): string | null {
  const v = raw.trim();
  if (!v) return '표시할 용어를 입력해 주세요.';
  if (v.length < 2) return '2자 이상 입력해 주세요.';
  if (v.length > maxLen) return `${maxLen}자 이내로 입력해 주세요.`;
  if (/[<>]/.test(v)) return '사용할 수 없는 문자가 포함되어 있습니다.';
  return null;
}

/** 받침 유무 — 을/를 */
export function withObjectParticle(word: string): string {
  const w = word.trim();
  if (!w) return '을';
  const last = w.charCodeAt(w.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasBatchim = (last - 0xac00) % 28 !== 0;
    return hasBatchim ? '을' : '를';
  }
  return '을';
}

/** 받침 유무 — 이/가 */
export function withSubjectParticle(word: string): string {
  const w = word.trim();
  if (!w) return '이';
  const last = w.charCodeAt(w.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasBatchim = (last - 0xac00) % 28 !== 0;
    return hasBatchim ? '이' : '가';
  }
  return '이';
}

export type PastorTerminologyPhrases = {
  label: string;
  shareVisibility: string;
  shareVisibilityPastor: string;
  shareSelectTitle: string;
  shareSelectDescription: string;
  shareTypeFilter: string;
  sharedPastorChip: string;
  searchPlaceholder: string;
  management: string;
  managementCompact: string;
  mode: string;
  authorRole: string;
  emptyAssignee: string;
  selectAtLeastOne: string;
  inviteDescription: string;
  assigneeTag: string;
  sharedPastorFilterDescription: string;
  authorWrite: string;
  pastorSelectSection: string;
  allPastors: string;
  emptyPastorShareFilteredAdmin: string;
  emptyPastorShareReceivedMember: string;
  emptyPastorShareHintMember: string;
  emptyPastorShareHintDefault: string;
  shareWithSelected: string;
  noSelectablePastor: string;
  currentPastorsGroup: string;
  historicalSharedPastors: string;
};

export function getPastorTerminologyPhrases(
  settings?: OrgTerminologySettings | null,
): PastorTerminologyPhrases {
  const p = getPastorLabel(settings);
  const po = withObjectParticle(p);
  return {
    label: p,
    shareVisibility: `담당 ${p}와 공유`,
    shareVisibilityPastor: `${p}와 공유`,
    shareSelectTitle: `담당 ${p} 선택`,
    shareSelectDescription: `내 소속 조직의 담당 ${p}${withSubjectParticle(p) === '이' ? '를' : '을'} 선택해 공유합니다.`,
    shareTypeFilter: `${p}에게 공유한 기록`,
    sharedPastorChip: `공유받은 ${p}`,
    searchPlaceholder: `${p} 이름 또는 조직을 검색하세요.`,
    management: `${p} 관리`,
    managementCompact: `${p}관리`,
    mode: `${p} 모드`,
    authorRole: p,
    emptyAssignee: `등록된 담당 ${p}가 없습니다.`,
    selectAtLeastOne: `공유할 ${p}${withObjectParticle(p)} 선택해 주세요.`,
    inviteDescription: `성도 및 ${p} 초대 링크를 발송하고 관리합니다`,
    assigneeTag: `담당 ${p}`,
    sharedPastorFilterDescription: `성도 또는 다른 ${p}가 직접 공유 대상으로 선택한 ${p}${withObjectParticle(p)} 선택합니다.`,
    authorWrite: `${p} 작성`,
    pastorSelectSection: `${p} 선택`,
    allPastors: `전체 ${p}`,
    emptyPastorShareFilteredAdmin: `조건에 맞는 ${p} 직접 공유 기록이 없습니다.`,
    emptyPastorShareReceivedMember: `${p}에게 직접 공유받은 기록이 없습니다.`,
    emptyPastorShareHintMember: `성도 모드에서는 다른 사람의 ${p} 직접 공유 기록을 보지 않습니다.`,
    emptyPastorShareHintDefault: `성도·${p}가 ${p}에게 직접 공유한 기록이 이곳에 나타납니다.`,
    shareWithSelected: `선택한 ${p}와 공유`,
    noSelectablePastor: `선택할 수 있는 ${p}가 없습니다.`,
    currentPastorsGroup: `현재 ${p}`,
    historicalSharedPastors: `이전에 공유한 ${p}`,
  };
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
  const s = resolveSettings(settings);
  const dd = getDistrictDepartmentLabel(s);
  const phrases = getPastorTerminologyPhrases(s);
  return {
    private: '나만 보기',
    pastor_share: phrases.shareVisibility,
    organization_share: `${dd}와 공유`,
  };
}

export function getVisibilityLabelsPastor(
  settings?: OrgTerminologySettings | null,
): Record<'private' | 'pastor_share' | 'organization_share', string> {
  const s = resolveSettings(settings);
  const dd = getDistrictDepartmentLabel(s);
  const phrases = getPastorTerminologyPhrases(s);
  return {
    private: '나만 보기',
    pastor_share: phrases.shareVisibilityPastor,
    organization_share: `${dd}와 공유`,
  };
}

export function getVisibilityDescriptions(
  settings?: OrgTerminologySettings | null,
): Record<'private' | 'pastor_share' | 'organization_share', string> {
  const phrases = getPastorTerminologyPhrases(settings);
  return {
    private: '나만 볼 수 있어요.',
    pastor_share: phrases.shareSelectDescription,
    organization_share: '선택한 공동체와 함께 나눠요.',
  };
}

export function getVisibilityDescriptionsPastor(
  settings?: OrgTerminologySettings | null,
): Record<'private' | 'pastor_share' | 'organization_share', string> {
  const s = resolveSettings(settings);
  const p = getPastorLabel(s);
  return {
    private: '나만 볼 수 있어요.',
    pastor_share: `내 소속·담당 조직의 상위 담당 ${p}${withSubjectParticle(p) === '이' ? '를' : '을'} 선택해 공유합니다.`,
    organization_share: '선택한 공동체와 함께 나눠요.',
  };
}

export function getShareTypeFilterLabels(
  settings?: OrgTerminologySettings | null,
): Record<'pastor_share' | 'organization_share', string> {
  const s = resolveSettings(settings);
  const dd = getDistrictDepartmentLabel(s);
  const phrases = getPastorTerminologyPhrases(s);
  return {
    pastor_share: phrases.shareTypeFilter,
    organization_share: `${dd}에 공유한 기록`,
  };
}

export function getAuthorRoleFilterOptions(
  settings?: OrgTerminologySettings | null,
): { id: 'all' | 'member' | 'pastor'; label: string }[] {
  const phrases = getPastorTerminologyPhrases(settings);
  return [
    { id: 'all', label: '전체 작성자' },
    { id: 'member', label: '성도' },
    { id: 'pastor', label: phrases.authorRole },
  ];
}

export { mapLabelForKind };
