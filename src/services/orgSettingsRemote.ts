/**
 * 교회 기본 조직명·교역자 표시명 — Supabase 원본 + localStorage 캐시
 *
 * Production: Supabase church_settings 가 원본
 * Dev / 미연결: localStorage fallback
 */

import { supabase, supabaseConfigured } from './supabase';

export const ORG_SETTINGS_LS_KEY = 'org_settings_v1';
export const CHURCH_ID_LS_KEY = 'churchieum_church_id_v1';

/** Demo·단일 교회 Beta — churches 행이 없어도 동일 ID로 공유 */
export const DEFAULT_CHURCH_ID = 'churchieum-default';

export type OrgSettingsPayload = {
  level1Enabled: boolean;
  level2Enabled: boolean;
  departmentEnabled: boolean;
  level1Label: string;
  level2Label: string;
  departmentLabel: string;
  pastorLabel: string;
};

export const DEFAULT_ORG_SETTINGS: OrgSettingsPayload = {
  level1Enabled: true,
  level2Enabled: true,
  departmentEnabled: true,
  level1Label: '교구',
  level2Label: '구역',
  departmentLabel: '부서',
  pastorLabel: '교역자',
};

type ChurchSettingsRow = {
  church_id: string;
  level1_label: string | null;
  level2_label: string | null;
  department_label: string | null;
  pastor_label: string | null;
  level1_enabled: boolean | null;
  level2_enabled: boolean | null;
  department_enabled: boolean | null;
  updated_at?: string | null;
};

function normalize(partial: Partial<OrgSettingsPayload> | null | undefined): OrgSettingsPayload {
  const p = partial ?? {};
  return {
    level1Enabled: p.level1Enabled ?? DEFAULT_ORG_SETTINGS.level1Enabled,
    level2Enabled: p.level2Enabled ?? DEFAULT_ORG_SETTINGS.level2Enabled,
    departmentEnabled: p.departmentEnabled ?? DEFAULT_ORG_SETTINGS.departmentEnabled,
    level1Label: (p.level1Label ?? '').trim() || DEFAULT_ORG_SETTINGS.level1Label,
    level2Label: (p.level2Label ?? '').trim() || DEFAULT_ORG_SETTINGS.level2Label,
    departmentLabel: (p.departmentLabel ?? '').trim() || DEFAULT_ORG_SETTINGS.departmentLabel,
    pastorLabel: (p.pastorLabel ?? '').trim() || DEFAULT_ORG_SETTINGS.pastorLabel,
  };
}

export function readOrgSettingsCache(): OrgSettingsPayload {
  try {
    const raw = localStorage.getItem(ORG_SETTINGS_LS_KEY);
    if (!raw) return { ...DEFAULT_ORG_SETTINGS };
    return normalize(JSON.parse(raw) as Partial<OrgSettingsPayload>);
  } catch {
    return { ...DEFAULT_ORG_SETTINGS };
  }
}

export function writeOrgSettingsCache(settings: OrgSettingsPayload): void {
  try {
    localStorage.setItem(ORG_SETTINGS_LS_KEY, JSON.stringify(normalize(settings)));
  } catch {
    /* ignore */
  }
}

function rowToSettings(row: ChurchSettingsRow): OrgSettingsPayload {
  return normalize({
    level1Enabled: row.level1_enabled ?? true,
    level2Enabled: row.level2_enabled ?? true,
    departmentEnabled: row.department_enabled ?? true,
    level1Label: row.level1_label ?? undefined,
    level2Label: row.level2_label ?? undefined,
    departmentLabel: row.department_label ?? undefined,
    pastorLabel: row.pastor_label ?? undefined,
  });
}

function settingsToRow(churchId: string, settings: OrgSettingsPayload) {
  const s = normalize(settings);
  return {
    church_id: churchId,
    level1_label: s.level1Label,
    level2_label: s.level2Label,
    department_label: s.departmentLabel,
    pastor_label: s.pastorLabel,
    level1_enabled: s.level1Enabled,
    level2_enabled: s.level2Enabled,
    department_enabled: s.departmentEnabled,
    updated_at: new Date().toISOString(),
  };
}

/**
 * 동일 교회 전체 사용자가 공유하는 church_id.
 * churches 조회 가능하면 그 id, 아니면 DEFAULT_CHURCH_ID.
 */
export async function resolveChurchId(): Promise<string> {
  try {
    const cached = localStorage.getItem(CHURCH_ID_LS_KEY)?.trim();
    if (cached) return cached;
  } catch {
    /* ignore */
  }

  if (!supabaseConfigured) return DEFAULT_CHURCH_ID;

  try {
    const { data, error } = await supabase
      .from('churches')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (!error && data?.id) {
      const id = String(data.id);
      try {
        localStorage.setItem(CHURCH_ID_LS_KEY, id);
      } catch {
        /* ignore */
      }
      return id;
    }
  } catch {
    /* ignore */
  }

  return DEFAULT_CHURCH_ID;
}

export type FetchOrgSettingsResult =
  | { ok: true; settings: OrgSettingsPayload; source: 'supabase' | 'cache' | 'default' }
  | { ok: false; settings: OrgSettingsPayload; source: 'cache' | 'default'; error: string };

/**
 * 우선순위: Supabase → localStorage 캐시 → 기본값
 */
export async function fetchOrgSettingsFromRemote(): Promise<FetchOrgSettingsResult> {
  const cache = readOrgSettingsCache();

  if (!supabaseConfigured) {
    return { ok: true, settings: cache, source: cache === DEFAULT_ORG_SETTINGS ? 'default' : 'cache' };
  }

  try {
    const churchId = await resolveChurchId();
    const { data, error } = await supabase
      .from('church_settings')
      .select(
        'church_id, level1_label, level2_label, department_label, pastor_label, level1_enabled, level2_enabled, department_enabled, updated_at',
      )
      .eq('church_id', churchId)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        settings: cache,
        source: 'cache',
        error: error.message || '조직명 설정을 불러오지 못했습니다.',
      };
    }

    if (!data) {
      // 원격에 없음 → 캐시/기본값 유지 (첫 저장 시 upsert)
      return {
        ok: true,
        settings: cache,
        source: Object.keys(cache).length ? 'cache' : 'default',
      };
    }

    const settings = rowToSettings(data as ChurchSettingsRow);
    writeOrgSettingsCache(settings);
    return { ok: true, settings, source: 'supabase' };
  } catch (e) {
    return {
      ok: false,
      settings: cache,
      source: 'cache',
      error: e instanceof Error ? e.message : '조직명 설정을 불러오지 못했습니다.',
    };
  }
}

export type UpsertOrgSettingsResult =
  | { ok: true; settings: OrgSettingsPayload }
  | { ok: false; error: string };

/**
 * Production(Supabase 설정됨): 서버 upsert 성공 후에만 캐시 갱신.
 * 미설정(로컬 데모): localStorage만 저장.
 */
export async function upsertOrgSettingsToRemote(
  settings: OrgSettingsPayload,
): Promise<UpsertOrgSettingsResult> {
  const next = normalize(settings);

  if (!supabaseConfigured) {
    writeOrgSettingsCache(next);
    return { ok: true, settings: next };
  }

  try {
    const churchId = await resolveChurchId();
    const row = settingsToRow(churchId, next);
    const { data, error } = await supabase
      .from('church_settings')
      .upsert(row, { onConflict: 'church_id' })
      .select(
        'church_id, level1_label, level2_label, department_label, pastor_label, level1_enabled, level2_enabled, department_enabled',
      )
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error: '조직명을 서버에 저장하지 못했습니다. 다시 시도해 주세요.',
      };
    }

    const saved = data ? rowToSettings(data as ChurchSettingsRow) : next;
    writeOrgSettingsCache(saved);
    return { ok: true, settings: saved };
  } catch {
    return {
      ok: false,
      error: '조직명을 서버에 저장하지 못했습니다. 다시 시도해 주세요.',
    };
  }
}
