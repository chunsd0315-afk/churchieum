/**
 * OrgSettingsContext — 교회별 조직명 + 사용 여부 전역 관리
 *
 * 내부 데이터 키는 level1/level2/department 고정.
 * UI에서만 관리자가 설정한 이름을 표시한다.
 * 저장 시 조직 트리(자동생성명·종류명)와 앱 전체 표시에 즉시 반영한다.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {
  ensureOrganizationTerminologySynced,
  getDistrictDepartmentLabel,
  getOrgDepartmentLabel,
  getOrgLevel1Label,
  getOrgLevel2Label,
  syncOrganizationTerminology,
  validateOrgTerminologyLabel,
} from '../services/orgTerminology';

const LS_KEY = 'org_settings_v1';

export type OrgSettings = {
  level1Enabled: boolean;
  level2Enabled: boolean;
  departmentEnabled: boolean;
  level1Label: string;
  level2Label: string;
  departmentLabel: string;
};

const DEFAULTS: OrgSettings = {
  level1Enabled: true,
  level2Enabled: true,
  departmentEnabled: true,
  level1Label: '교구',
  level2Label: '구역',
  departmentLabel: '부서',
};

function load(): OrgSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<OrgSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      level1Label: (parsed.level1Label ?? DEFAULTS.level1Label).trim() || DEFAULTS.level1Label,
      level2Label: (parsed.level2Label ?? DEFAULTS.level2Label).trim() || DEFAULTS.level2Label,
      departmentLabel:
        (parsed.departmentLabel ?? DEFAULTS.departmentLabel).trim() || DEFAULTS.departmentLabel,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(s: OrgSettings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export type OrgSettingsUpdateResult =
  | { ok: true; settings: OrgSettings }
  | { ok: false; error: string };

type Ctx = {
  settings: OrgSettings;
  /** 설정 저장 성공 시마다 증가 — 트리·목록 useMemo 의존성 */
  terminologyVersion: number;
  updateSettings: (updates: Partial<OrgSettings>) => OrgSettingsUpdateResult;
  l1: string;
  l2: string;
  dept: string;
  /** 조합: 교구·부서 */
  districtDepartmentLabel: string;
};

const OrgSettingsContext = createContext<Ctx | null>(null);

export function OrgSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OrgSettings>(() => load());
  const [terminologyVersion, setTerminologyVersion] = useState(0);

  useEffect(() => {
    ensureOrganizationTerminologySynced(settings);
    setTerminologyVersion(v => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || e.newValue == null) return;
      try {
        const parsed = JSON.parse(e.newValue) as Partial<OrgSettings>;
        const next: OrgSettings = {
          ...DEFAULTS,
          ...parsed,
          level1Label: (parsed.level1Label ?? DEFAULTS.level1Label).trim() || DEFAULTS.level1Label,
          level2Label: (parsed.level2Label ?? DEFAULTS.level2Label).trim() || DEFAULTS.level2Label,
          departmentLabel:
            (parsed.departmentLabel ?? DEFAULTS.departmentLabel).trim() || DEFAULTS.departmentLabel,
        };
        setSettings(prev => {
          syncOrganizationTerminology(prev, next);
          return next;
        });
        setTerminologyVersion(v => v + 1);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateSettings = useCallback((updates: Partial<OrgSettings>): OrgSettingsUpdateResult => {
    const prev = load();
    const merged: OrgSettings = { ...prev, ...updates };

    const l1 = (updates.level1Label !== undefined ? updates.level1Label : merged.level1Label).trim();
    const l2 = (updates.level2Label !== undefined ? updates.level2Label : merged.level2Label).trim();
    const dept = (
      updates.departmentLabel !== undefined ? updates.departmentLabel : merged.departmentLabel
    ).trim();

    for (const [label, value] of [
      ['상위조직', l1],
      ['하위조직', l2],
      ['부서', dept],
    ] as const) {
      const err = validateOrgTerminologyLabel(value);
      if (err) return { ok: false, error: err.replace('조직명', `${label} 이름`) };
    }

    const next: OrgSettings = {
      ...merged,
      level1Label: l1 || DEFAULTS.level1Label,
      level2Label: l2 || DEFAULTS.level2Label,
      departmentLabel: dept || DEFAULTS.departmentLabel,
    };

    try {
      syncOrganizationTerminology(prev, next);
      persist(next);
      setSettings(next);
      setTerminologyVersion(v => v + 1);
      return { ok: true, settings: next };
    } catch {
      return { ok: false, error: '조직명을 저장하지 못했습니다. 다시 시도해 주세요.' };
    }
  }, []);

  const value = useMemo<Ctx>(() => ({
    settings,
    terminologyVersion,
    updateSettings,
    l1: getOrgLevel1Label(settings),
    l2: getOrgLevel2Label(settings),
    dept: getOrgDepartmentLabel(settings),
    districtDepartmentLabel: getDistrictDepartmentLabel(settings),
  }), [settings, terminologyVersion, updateSettings]);

  return (
    <OrgSettingsContext.Provider value={value}>
      {children}
    </OrgSettingsContext.Provider>
  );
}

export function useOrgSettings(): Ctx {
  const ctx = useContext(OrgSettingsContext);
  if (!ctx) throw new Error('useOrgSettings must be used within OrgSettingsProvider');
  return ctx;
}

/** Read settings without React (for non-component use) */
export function readOrgSettings(): OrgSettings {
  return load();
}
