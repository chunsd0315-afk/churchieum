/**
 * orgData — shared org data store for districts, zones, departments
 * Used by InvitationPage and OrganizationManagementPage
 */

import { supabase } from './supabase';

export type OrgDistrict = {
  id: string;
  name: string;
  leader_name: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type OrgZone = {
  id: string;
  district_id: string;
  name: string;
  leader_name: string | null;
  is_active: boolean;
  sort_order: number;
};

export type OrgDepartment = {
  id: string;
  name: string;
  leader_name: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_DISTRICTS   = 'org_districts_v1';
const LS_ZONES       = 'org_zones_v1';
const LS_DEPARTMENTS = 'org_departments_v1';

// ─── Defaults (only if nothing stored) ───────────────────────────────────────
const DEFAULT_DISTRICTS: OrgDistrict[] = [
  { id: 'd1', name: '1교구', leader_name: '정재명 목사',  description: '서울 북부',  is_active: true, sort_order: 1 },
  { id: 'd2', name: '2교구', leader_name: '이변우 목사',  description: '서울 중부',  is_active: true, sort_order: 2 },
  { id: 'd3', name: '3교구', leader_name: '박민수 목사',  description: '서울 남부',  is_active: true, sort_order: 3 },
  { id: 'd4', name: '4교구', leader_name: '정현우 목사',  description: '서울 동부',  is_active: true, sort_order: 4 },
  { id: 'd-youth', name: '청년국', leader_name: '박지훈 전도사', description: '청년 사역', is_active: true, sort_order: 5 },
];
const DEFAULT_ZONES: OrgZone[] = [
  { id: 'z1', district_id: 'd1', name: '1구역', leader_name: '홍길동', is_active: true, sort_order: 1 },
  { id: 'z2', district_id: 'd1', name: '2구역', leader_name: '김영희', is_active: true, sort_order: 2 },
  { id: 'z3', district_id: 'd2', name: '3구역', leader_name: '박철수', is_active: true, sort_order: 1 },
  { id: 'z4', district_id: 'd2', name: '4구역', leader_name: '이민정', is_active: true, sort_order: 2 },
  { id: 'z5', district_id: 'd3', name: '5구역', leader_name: '최수빈', is_active: true, sort_order: 1 },
  { id: 'z-y1', district_id: 'd-youth', name: '1청년부', leader_name: '김민준', is_active: true, sort_order: 1 },
];
const DEFAULT_DEPARTMENTS: OrgDepartment[] = [
  { id: 'dep1',  name: '청년부',     leader_name: '강다은 전도사',   description: '20-30대 청년',    is_active: true, sort_order: 1 },
  { id: 'dep2',  name: '장년부',     leader_name: '정재명 목사',     description: '장년 성도',       is_active: true, sort_order: 2 },
  { id: 'dep3',  name: '찬양대',     leader_name: null,              description: '예배 찬양',       is_active: true, sort_order: 3 },
  { id: 'dep4',  name: '남선교회',   leader_name: null,              description: '남성 선교 모임',  is_active: true, sort_order: 4 },
  { id: 'dep5',  name: '여선교회',   leader_name: null,              description: '여성 선교 모임',  is_active: true, sort_order: 5 },
  { id: 'dep6',  name: '유아부',     leader_name: '김은혜 전도사',   description: '영아~7세',        is_active: true, sort_order: 6 },
  { id: 'dep7',  name: '유치부',     leader_name: '김은혜 전도사',   description: '유치원 과정',     is_active: true, sort_order: 7 },
  { id: 'dep8',  name: '유초등부',   leader_name: '박지은 전도사',   description: '유치~초등',       is_active: true, sort_order: 8 },
  { id: 'dep9',  name: '중등부',     leader_name: '이수진 전도사',   description: '중학교 과정',     is_active: true, sort_order: 9 },
  { id: 'dep10', name: '고등부',     leader_name: '최하나 전도사',   description: '고등학교 과정',   is_active: true, sort_order: 10 },
  { id: 'dep11', name: '브릿지선교회', leader_name: '오예린 전도사', description: '청년 선교 연합',  is_active: true, sort_order: 11 },
  { id: 'dep12', name: '주일학교',   leader_name: '김도현 교육전도사', description: '어린이 예배',   is_active: true, sort_order: 12 },
  { id: 'dep13', name: '선교부',     leader_name: null,              description: '국내외 선교',     is_active: true, sort_order: 13 },
  { id: 'dep-y-nf',  name: '새가족팀', leader_name: null,              description: '청년 새가족',     is_active: true, sort_order: 14 },
  { id: 'dep-y-ws',  name: '찬양팀',   leader_name: null,              description: '청년 찬양',       is_active: true, sort_order: 15 },
];

function loadLS<T>(key: string, defaults: T[], minCount = 0): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (parsed.length >= minCount) return parsed;
    }
  } catch { /**/ }
  saveLS(key, defaults);
  return defaults;
}
function saveLS<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /**/ }
}

// ─── Districts ────────────────────────────────────────────────────────────────
export function getDistricts(): OrgDistrict[] {
  return loadLS(LS_DISTRICTS, DEFAULT_DISTRICTS, 4).filter(d => d.is_active);
}
export function getAllDistricts(): OrgDistrict[] {
  return loadLS(LS_DISTRICTS, DEFAULT_DISTRICTS, 4);
}
export function saveDistricts(list: OrgDistrict[]): void {
  saveLS(LS_DISTRICTS, list);
}
export async function loadDistrictsFromSupabase(): Promise<OrgDistrict[]> {
  try {
    const { data } = await supabase.from('church_districts').select('*').order('sort_order');
    if (data && data.length > 0) {
      saveLS(LS_DISTRICTS, data);
      return data;
    }
  } catch { /**/ }
  return getAllDistricts();
}

// ─── Zones ────────────────────────────────────────────────────────────────────
export function getZones(districtId?: string): OrgZone[] {
  const all = loadLS(LS_ZONES, DEFAULT_ZONES, 0).filter(z => z.is_active);
  return districtId ? all.filter(z => z.district_id === districtId) : all;
}
export function getAllZones(): OrgZone[] {
  return loadLS(LS_ZONES, DEFAULT_ZONES, 0);
}
export function saveZones(list: OrgZone[]): void {
  saveLS(LS_ZONES, list);
}
export async function loadZonesFromSupabase(): Promise<OrgZone[]> {
  try {
    const { data } = await supabase.from('church_zones').select('*').order('sort_order');
    if (data && data.length > 0) {
      saveLS(LS_ZONES, data);
      return data;
    }
  } catch { /**/ }
  return getAllZones();
}

// ─── Departments ──────────────────────────────────────────────────────────────
export function getDepartments(): OrgDepartment[] {
  return loadLS(LS_DEPARTMENTS, DEFAULT_DEPARTMENTS, 13).filter(d => d.is_active);
}
export function getAllDepartments(): OrgDepartment[] {
  return loadLS(LS_DEPARTMENTS, DEFAULT_DEPARTMENTS, 13);
}
export function saveDepartments(list: OrgDepartment[]): void {
  saveLS(LS_DEPARTMENTS, list);
}
export async function loadDepartmentsFromSupabase(): Promise<OrgDepartment[]> {
  try {
    const { data } = await supabase.from('departments').select('*').order('sort_order');
    if (data && data.length > 0) {
      saveLS(LS_DEPARTMENTS, data);
      return data;
    }
  } catch { /**/ }
  return getAllDepartments();
}

// ─── hasOrgs ─────────────────────────────────────────────────────────────────
export function hasAnyOrg(): boolean {
  return getAllDistricts().length > 0 || getAllDepartments().length > 0;
}

// ─── Name lookup helpers ──────────────────────────────────────────────────────
export function getDistrictNameById(id: string | undefined | null): string {
  if (!id) return '-';
  return getAllDistricts().find(d => d.id === id)?.name ?? '-';
}
export function getZoneNameById(id: string | undefined | null): string {
  if (!id) return '-';
  return getAllZones().find(z => z.id === id)?.name ?? '-';
}
export function getDepartmentNameById(id: string | undefined | null): string {
  if (!id) return '-';
  return getAllDepartments().find(d => d.id === id)?.name ?? '-';
}
export function getDepartmentNamesByIds(ids: string[] | undefined | null): string[] {
  if (!ids || ids.length === 0) return [];
  const all = getAllDepartments();
  return ids.map(id => all.find(d => d.id === id)?.name ?? id).filter(Boolean);
}

/** Get all zones that belong to a specific district */
export function getZonesByDistrictId(districtId: string): OrgZone[] {
  return getAllZones().filter(z => z.district_id === districtId && z.is_active);
}

/** 데모: 청년국 · 1청년부 · 새가족팀 · 찬양팀 조직이 없으면 추가 */
export function ensureYouthOrgDemo(): void {
  const YOUTH_DISTRICT_ID = 'd-youth';
  const YOUTH_ZONE_ID = 'z-y1';
  const YOUTH_DEPT_IDS = ['dep-y-nf', 'dep-y-ws'] as const;

  const districts = getAllDistricts();
  if (!districts.some(d => d.id === YOUTH_DISTRICT_ID)) {
    const seed = DEFAULT_DISTRICTS.find(d => d.id === YOUTH_DISTRICT_ID);
    if (seed) saveDistricts([...districts, seed]);
  }

  const zones = getAllZones();
  if (!zones.some(z => z.id === YOUTH_ZONE_ID)) {
    const seed = DEFAULT_ZONES.find(z => z.id === YOUTH_ZONE_ID);
    if (seed) saveZones([...zones, seed]);
  }

  const depts = getAllDepartments();
  const missingDepts = YOUTH_DEPT_IDS
    .map(id => DEFAULT_DEPARTMENTS.find(d => d.id === id))
    .filter((d): d is OrgDepartment => !!d && !depts.some(x => x.id === d.id));
  if (missingDepts.length > 0) {
    saveDepartments([...depts, ...missingDepts]);
  }
}

