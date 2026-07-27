/**
 * OrgSettingsContext — 교회별 조직명 + 사용 여부 전역 관리
 *
 * 원본: Supabase church_settings (church_id)
 * 캐시: localStorage org_settings_v1
 * Supabase 미연결 시에만 localStorage를 원본처럼 사용
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
  validatePastorLabel,
  getPastorLabel,
  getPastorTerminologyPhrases,
} from '../services/orgTerminology';
import {
  DEFAULT_ORG_SETTINGS,
  fetchOrgSettingsFromRemote,
  readOrgSettingsCache,
  upsertOrgSettingsToRemote,
  writeOrgSettingsCache,
  type OrgSettingsPayload,
} from '../services/orgSettingsRemote';
import { supabaseConfigured } from '../services/supabase';

export type OrgSettings = OrgSettingsPayload;

const DEFAULTS: OrgSettings = { ...DEFAULT_ORG_SETTINGS };

function load(): OrgSettings {
  return readOrgSettingsCache();
}

function persist(s: OrgSettings) {
  writeOrgSettingsCache(s);
}

export type OrgSettingsUpdateResult =
  | { ok: true; settings: OrgSettings }
  | { ok: false; error: string };

type Ctx = {
  settings: OrgSettings;
  /** 원격 동기화 완료 여부 */
  remoteReady: boolean;
  /** 설정 저장 성공 시마다 증가 — 트리·목록 useMemo 의존성 */
  terminologyVersion: number;
  updateSettings: (updates: Partial<OrgSettings>) => Promise<OrgSettingsUpdateResult>;
  refreshFromRemote: () => Promise<void>;
  l1: string;
  l2: string;
  dept: string;
  /** 조합: 교구·부서 */
  districtDepartmentLabel: string;
  /** 교역자 그룹 표시명 */
  pastorLabel: string;
  pastorPhrases: ReturnType<typeof getPastorTerminologyPhrases>;
};

const OrgSettingsContext = createContext<Ctx | null>(null);

function applyValidated(
  prev: OrgSettings,
  updates: Partial<OrgSettings>,
): OrgSettingsUpdateResult {
  const merged: OrgSettings = { ...prev, ...updates };

  const l1 = (updates.level1Label !== undefined ? updates.level1Label : merged.level1Label).trim();
  const l2 = (updates.level2Label !== undefined ? updates.level2Label : merged.level2Label).trim();
  const dept = (
    updates.departmentLabel !== undefined ? updates.departmentLabel : merged.departmentLabel
  ).trim();
  const pastor = (
    updates.pastorLabel !== undefined ? updates.pastorLabel : merged.pastorLabel
  ).trim();

  for (const [label, value] of [
    ['상위조직', l1],
    ['하위조직', l2],
    ['부서', dept],
  ] as const) {
    const err = validateOrgTerminologyLabel(value);
    if (err) return { ok: false, error: err.replace('조직명', `${label} 이름`) };
  }

  const pastorErr = validatePastorLabel(pastor);
  if (pastorErr) return { ok: false, error: pastorErr };

  return {
    ok: true,
    settings: {
      ...merged,
      level1Label: l1 || DEFAULTS.level1Label,
      level2Label: l2 || DEFAULTS.level2Label,
      departmentLabel: dept || DEFAULTS.departmentLabel,
      pastorLabel: pastor || DEFAULTS.pastorLabel,
    },
  };
}

export function OrgSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OrgSettings>(() => load());
  const [terminologyVersion, setTerminologyVersion] = useState(0);
  const [remoteReady, setRemoteReady] = useState(!supabaseConfigured);

  const applySettings = useCallback((prev: OrgSettings, next: OrgSettings) => {
    syncOrganizationTerminology(prev, next);
    persist(next);
    setSettings(next);
    setTerminologyVersion(v => v + 1);
  }, []);

  const refreshFromRemote = useCallback(async () => {
    const result = await fetchOrgSettingsFromRemote();
    setSettings(prev => {
      const next = result.settings;
      if (
        prev.level1Label === next.level1Label
        && prev.level2Label === next.level2Label
        && prev.departmentLabel === next.departmentLabel
        && prev.pastorLabel === next.pastorLabel
        && prev.level1Enabled === next.level1Enabled
        && prev.level2Enabled === next.level2Enabled
        && prev.departmentEnabled === next.departmentEnabled
      ) {
        return prev;
      }
      syncOrganizationTerminology(prev, next);
      setTerminologyVersion(v => v + 1);
      return next;
    });
    setRemoteReady(true);
  }, []);

  useEffect(() => {
    ensureOrganizationTerminologySynced(settings);
    setTerminologyVersion(v => v + 1);
    void refreshFromRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'org_settings_v1' || e.newValue == null) return;
      try {
        const next = readOrgSettingsCache();
        setSettings(prev => {
          syncOrganizationTerminology(prev, next);
          return next;
        });
        setTerminologyVersion(v => v + 1);
      } catch { /* ignore */ }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshFromRemote();
      }
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshFromRemote]);

  const updateSettings = useCallback(async (
    updates: Partial<OrgSettings>,
  ): Promise<OrgSettingsUpdateResult> => {
    const prev = settings;
    const validated = applyValidated(prev, updates);
    if (!validated.ok) return validated;

    const remote = await upsertOrgSettingsToRemote(validated.settings);
    if (!remote.ok) {
      return { ok: false, error: remote.error };
    }

    try {
      applySettings(prev, remote.settings);
      return { ok: true, settings: remote.settings };
    } catch {
      return { ok: false, error: '조직명을 저장하지 못했습니다. 다시 시도해 주세요.' };
    }
  }, [applySettings, settings]);

  const value = useMemo<Ctx>(() => ({
    settings,
    remoteReady,
    terminologyVersion,
    updateSettings,
    refreshFromRemote,
    l1: getOrgLevel1Label(settings),
    l2: getOrgLevel2Label(settings),
    dept: getOrgDepartmentLabel(settings),
    districtDepartmentLabel: getDistrictDepartmentLabel(settings),
    pastorLabel: getPastorLabel(settings),
    pastorPhrases: getPastorTerminologyPhrases(settings),
  }), [settings, remoteReady, terminologyVersion, updateSettings, refreshFromRemote]);

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

/** Read settings without React (for non-component use) — 캐시 기준 */
export function readOrgSettings(): OrgSettings {
  return load();
}
