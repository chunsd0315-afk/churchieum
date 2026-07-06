import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getDistrictNameById, getZoneNameById, getDepartmentNameById } from '../services/orgData';
import { getAllClergy, getAssignmentsForClergy } from '../services/clergyData';
import type { AppUser } from '../services/permissions';

const DEMO_CHURCH = '순복음성북교회';

async function fetchChurchName(): Promise<string> {
  try {
    const { data } = await supabase
      .from('churches')
      .select('name')
      .limit(1)
      .maybeSingle();
    if (data?.name) return data.name;
  } catch { /**/ }
  return DEMO_CHURCH;
}

const MAX_ORG_ITEMS = 6;

function buildOrgLabel(user: AppUser): string {
  if (user.role === 'super_admin' || user.role === 'pastor') {
    const clergyRecord = getAllClergy().find(
      c => c.email?.toLowerCase() === user.email.toLowerCase()
    );
    if (!clergyRecord) return '전체 관리';

    const assignments = getAssignmentsForClergy(clergyRecord.id);
    if (assignments.length === 0) return '전체 관리';

    const items: string[] = [];
    for (const a of assignments) {
      if (a.districtId) {
        const n = getDistrictNameById(a.districtId);
        if (n && n !== '-' && !items.includes(n)) items.push(n);
      }
      if (a.zoneId) {
        const n = getZoneNameById(a.zoneId);
        if (n && n !== '-' && !items.includes(n)) items.push(n);
      }
      if (a.departmentId) {
        const n = getDepartmentNameById(a.departmentId);
        if (n && n !== '-' && !items.includes(n)) items.push(n);
      }
    }

    if (items.length === 0) return '전체 관리';
    const shown = items.slice(0, MAX_ORG_ITEMS);
    const extra = items.length - MAX_ORG_ITEMS;
    const base = shown.join(' · ');
    return extra > 0 ? `${base} 외 ${extra}` : base;
  }

  // member
  const items: string[] = [];
  if (user.districtId) {
    const n = getDistrictNameById(user.districtId);
    if (n && n !== '-') items.push(n);
  }
  if (user.zoneId) {
    const n = getZoneNameById(user.zoneId);
    if (n && n !== '-') items.push(n);
  }
  if (user.departmentIds?.length) {
    for (const id of user.departmentIds) {
      const n = getDepartmentNameById(id);
      if (n && n !== '-') items.push(n);
    }
  }

  const shown = items.slice(0, MAX_ORG_ITEMS);
  const extra = items.length - MAX_ORG_ITEMS;
  const base = shown.join(' · ');
  return extra > 0 ? `${base} 외 ${extra}` : base;
}

export function useChurchOrg(user: AppUser | null): { churchName: string; orgLabel: string } {
  const [churchName, setChurchName] = useState(DEMO_CHURCH);

  useEffect(() => {
    fetchChurchName().then(setChurchName);
  }, []);

  const orgLabel = user ? buildOrgLabel(user) : '';
  return { churchName, orgLabel };
}
