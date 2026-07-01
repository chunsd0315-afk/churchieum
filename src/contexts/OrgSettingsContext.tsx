/**
 * OrgSettingsContext — 교회별 조직명 + 사용 여부 전역 관리
 *
 * 내부 데이터 키는 level1/level2/department 고정.
 * UI에서만 관리자가 설정한 이름을 표시한다.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const LS_KEY = 'org_settings_v1';

export type OrgSettings = {
  // 사용 여부
  level1Enabled: boolean;
  level2Enabled: boolean;
  departmentEnabled: boolean;
  // 표시 명칭
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
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

function persist(s: OrgSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /**/ }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  settings: OrgSettings;
  updateSettings: (updates: Partial<OrgSettings>) => void;
  /** Convenience: label for level1 (e.g. "교구") */
  l1: string;
  /** Convenience: label for level2 (e.g. "구역") */
  l2: string;
  /** Convenience: label for department (e.g. "부서") */
  dept: string;
};

const OrgSettingsContext = createContext<Ctx | null>(null);

export function OrgSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OrgSettings>(load);

  const updateSettings = useCallback((updates: Partial<OrgSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      persist(next);
      return next;
    });
  }, []);

  return (
    <OrgSettingsContext.Provider value={{
      settings,
      updateSettings,
      l1: settings.level1Label,
      l2: settings.level2Label,
      dept: settings.departmentLabel,
    }}>
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
