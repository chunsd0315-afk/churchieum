/**
 * 교회 기본정보 — 설정·교회정보 페이지 공통 원본 (localStorage + 이벤트)
 * Supabase churches 테이블과 병행; 데모/오프라인 시 시드 폴백
 */

import { CHURCH_PROFILE_SEED } from '../data/churchProfileSeed';
import { writeStoredChurchName } from './currentUserDisplayMeta';

export const CHURCH_BASIC_PROFILE_KEY = 'churchieum_church_basic_profile_v1';
export const CHURCH_BASIC_PROFILE_EVENT = 'churchieum-church-basic-profile-changed';

export type ChurchWorshipTime = {
  type: string;
  time: string;
  location?: string;
  day?: string;
};

export type ChurchHistoryItem = {
  date: string;
  text: string;
};

export type ChurchBasicProfile = {
  name: string;
  denomination: string;
  postalCode: string;
  address: string;
  phone: string;
  fax: string;
  website: string;
  /** 교회 표어 (slogan) */
  motto: string;
  /** 교회 소개 */
  description: string;
  /** 담임목사 표시명 — 예: 정재명 담임목사 */
  pastorName: string;
  pastorTitleLine: string;
  pastorBio: string;
  photoUrl: string;
  heroImageUrl: string;
  worshipTimes: ChurchWorshipTime[];
  history: ChurchHistoryItem[];
  directions: {
    subway: string;
    bus: string;
    parking: string;
  };
  updatedAt: string;
};

function seedProfile(): ChurchBasicProfile {
  const s = CHURCH_PROFILE_SEED;
  return {
    name: s.name,
    denomination: s.denomination,
    postalCode: s.postalCode,
    address: s.address,
    phone: s.phone,
    fax: s.fax,
    website: s.website,
    motto: s.motto,
    description: s.intro,
    pastorName: s.pastor.displayName,
    pastorTitleLine: s.pastor.titleLine,
    pastorBio: s.pastor.bio,
    photoUrl: '',
    heroImageUrl: s.heroImageUrl,
    worshipTimes: s.worshipTimes.map(w => ({ ...w })),
    history: s.history.map(h => ({ ...h })),
    directions: { ...s.directions },
    updatedAt: new Date().toISOString(),
  };
}

function websiteLabel(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

export function getWebsiteDisplayLabel(url: string): string {
  return websiteLabel(url.trim() || CHURCH_PROFILE_SEED.website);
}

function normalize(raw: Partial<ChurchBasicProfile> | null | undefined): ChurchBasicProfile {
  const base = seedProfile();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    worshipTimes: Array.isArray(raw.worshipTimes) && raw.worshipTimes.length > 0
      ? raw.worshipTimes
      : base.worshipTimes,
    history: Array.isArray(raw.history) && raw.history.length > 0
      ? raw.history
      : base.history,
    directions: { ...base.directions, ...(raw.directions ?? {}) },
    name: (raw.name ?? base.name).trim() || base.name,
    pastorName: (raw.pastorName ?? base.pastorName).trim() || base.pastorName,
    motto: (raw.motto ?? base.motto).trim() || base.motto,
    description: (raw.description ?? base.description).trim() || base.description,
    address: (raw.address ?? base.address).trim() || base.address,
    phone: (raw.phone ?? base.phone).trim() || base.phone,
    website: (raw.website ?? base.website).trim() || base.website,
  };
}

export function getDefaultChurchBasicProfile(): ChurchBasicProfile {
  return seedProfile();
}

export function getChurchBasicProfile(): ChurchBasicProfile {
  try {
    const raw = localStorage.getItem(CHURCH_BASIC_PROFILE_KEY);
    if (!raw) return getDefaultChurchBasicProfile();
    return normalize(JSON.parse(raw) as Partial<ChurchBasicProfile>);
  } catch {
    return getDefaultChurchBasicProfile();
  }
}

export function saveChurchBasicProfile(
  patch: Partial<ChurchBasicProfile>,
): ChurchBasicProfile {
  const next = normalize({
    ...getChurchBasicProfile(),
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(CHURCH_BASIC_PROFILE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  if (next.name.trim()) {
    writeStoredChurchName(next.name);
  }
  try {
    window.dispatchEvent(new CustomEvent(CHURCH_BASIC_PROFILE_EVENT));
  } catch {
    /* ignore */
  }
  return next;
}

/** 관리 화면 저장값 → 공통 프로필 패치 */
export function applyChurchManagementToProfile(input: {
  name: string;
  denomination?: string;
  description?: string;
  pastor_name?: string;
  address?: string;
  phone?: string;
  fax?: string;
  motto?: string;
  website_url?: string;
  photo_url?: string;
  worship_times?: Array<{ type: string; time: string; day?: string; location?: string }>;
}): ChurchBasicProfile {
  const current = getChurchBasicProfile();
  return saveChurchBasicProfile({
    name: input.name || current.name,
    denomination: input.denomination ?? current.denomination,
    description: input.description ?? current.description,
    pastorName: input.pastor_name?.trim() || current.pastorName,
    address: input.address ?? current.address,
    phone: input.phone ?? current.phone,
    fax: input.fax ?? current.fax,
    motto: input.motto ?? current.motto,
    website: input.website_url?.trim() || current.website,
    photoUrl: input.photo_url ?? current.photoUrl,
    worshipTimes: input.worship_times?.length
      ? input.worship_times.map(w => ({
          type: w.type,
          time: w.time,
          day: w.day,
          location: w.location ?? '본당',
        }))
      : current.worshipTimes,
  });
}
