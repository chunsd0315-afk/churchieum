/**
 * 헤더·사이드바·모바일 — 현재 사용자 표시 메타 (실시간 갱신)
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrgSettings } from '../contexts/OrgSettingsContext';
import { supabase } from '../services/supabase';
import { ORG_TREE_CHANGED_EVENT } from '../services/organizationStorage';
import {
  CHURCH_NAME_CHANGED_EVENT,
  CHURCH_NAME_STORAGE_KEY,
  buildCurrentUserDisplayMeta,
  readStoredChurchName,
  writeStoredChurchName,
  type CurrentUserDisplayMeta,
} from '../services/currentUserDisplayMeta';
import { PROFILE_IMAGE_CHANGED_EVENT } from '../services/profileImage';

async function fetchChurchNameFromBackend(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('churches')
      .select('name')
      .limit(1)
      .maybeSingle();
    const name = data?.name?.trim();
    return name || null;
  } catch {
    return null;
  }
}

/** 데모/세션 스냅샷 — UI 하드코딩이 아닌 단일 소스 fallback */
const DEMO_CHURCH_SESSION_SNAPSHOT = '순복음성북교회';

function resolveInitialChurchName(): string {
  return readStoredChurchName() || DEMO_CHURCH_SESSION_SNAPSHOT || '교회이음';
}

/**
 * PC 헤더 / 사이드바 / 모바일 헤더·메뉴 공통 표시 데이터
 * 사용자·조직·용어·프로필·교회명 변경 시 자동 재계산
 */
export function useCurrentUserDisplayMeta(): CurrentUserDisplayMeta {
  const { user } = useAuth();
  const { terminologyVersion } = useOrgSettings();
  const [orgTick, setOrgTick] = useState(0);
  const [profileTick, setProfileTick] = useState(0);
  const [churchName, setChurchName] = useState(resolveInitialChurchName);

  useEffect(() => {
    let cancelled = false;
    fetchChurchNameFromBackend().then(name => {
      if (cancelled) return;
      if (name) {
        writeStoredChurchName(name);
        setChurchName(name);
        return;
      }
      const stored = readStoredChurchName();
      if (stored) {
        setChurchName(stored);
        return;
      }
      writeStoredChurchName(DEMO_CHURCH_SESSION_SNAPSHOT);
      setChurchName(DEMO_CHURCH_SESSION_SNAPSHOT);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const bumpOrg = () => setOrgTick(t => t + 1);
    const bumpProfile = () => setProfileTick(t => t + 1);
    const onChurch = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string }>).detail;
      if (detail?.name?.trim()) setChurchName(detail.name.trim());
      else setChurchName(resolveInitialChurchName());
    };
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        e.key === 'org_nodes_v1'
        || e.key === 'org_settings_v1'
        || e.key === 'org_memberships_v1'
        || e.key === 'clergy_v1'
        || e.key === 'staff_assignments_v1'
        || e.key.startsWith('churchieum_profile_img_')
      ) {
        bumpOrg();
        bumpProfile();
      }
      if (e.key === CHURCH_NAME_STORAGE_KEY) {
        setChurchName(resolveInitialChurchName());
      }
    };

    window.addEventListener(ORG_TREE_CHANGED_EVENT, bumpOrg);
    window.addEventListener(PROFILE_IMAGE_CHANGED_EVENT, bumpProfile);
    window.addEventListener(CHURCH_NAME_CHANGED_EVENT, onChurch as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ORG_TREE_CHANGED_EVENT, bumpOrg);
      window.removeEventListener(PROFILE_IMAGE_CHANGED_EVENT, bumpProfile);
      window.removeEventListener(CHURCH_NAME_CHANGED_EVENT, onChurch as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(
    () => buildCurrentUserDisplayMeta(user, churchName),
    // terminologyVersion / orgTick / profileTick force recompute from storage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, churchName, terminologyVersion, orgTick, profileTick],
  );
}
