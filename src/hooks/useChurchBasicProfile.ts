import { useEffect, useState } from 'react';
import {
  CHURCH_BASIC_PROFILE_EVENT,
  getChurchBasicProfile,
  type ChurchBasicProfile,
} from '../services/churchProfileStorage';

/** 교회 기본정보 — 설정 저장 시 즉시 반영 */
export function useChurchBasicProfile(): ChurchBasicProfile {
  const [profile, setProfile] = useState<ChurchBasicProfile>(() => getChurchBasicProfile());

  useEffect(() => {
    const sync = () => setProfile(getChurchBasicProfile());
    window.addEventListener(CHURCH_BASIC_PROFILE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHURCH_BASIC_PROFILE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return profile;
}
