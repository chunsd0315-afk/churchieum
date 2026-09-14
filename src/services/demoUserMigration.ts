/**
 * 대표 테스트 계정(3명) localStorage 마이그레이션
 * — 기존 김영수·강수아 등 stale 데이터를 정재명·이변우·천성대로 갱신
 * — v4: 정재명 담임목사 · 순복음성북교회 표시 통일
 */
import {
  PRIMARY_DEMO_ACCOUNTS,
  DEMO_ACCOUNT_IDS,
  buildDemoAppUser,
  normalizePrimaryDemoUser,
} from '../config/demoAccounts';
import { CHURCH_PROFILE_SEED } from '../data/churchProfileSeed';
import type { AppUser } from './permissions';
import { writeStoredChurchName } from './currentUserDisplayMeta';

const VERSION_KEY = 'churchieum_demo_user_version';
export const DEMO_USER_MIGRATION_VERSION = '4';

const DEMO_EMAILS = PRIMARY_DEMO_ACCOUNTS.map(a => a.email.toLowerCase());
const SENIOR_DISPLAY = CHURCH_PROFILE_SEED.pastor.displayName;

function migrateStoredCurrentUser(): void {
  try {
    const raw = localStorage.getItem('churchieum_demo_user');
    if (!raw) return;
    const parsed = JSON.parse(raw) as AppUser;
    const normalized = normalizePrimaryDemoUser(parsed);
    localStorage.setItem('churchieum_demo_user', JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
}

function migrateClergyRecords(): void {
  try {
    const raw = localStorage.getItem('clergy_v1');
    if (!raw) return;
    const list = JSON.parse(raw) as Array<{
      email?: string;
      name?: string;
      position?: string;
      address?: string;
    }>;
    let changed = false;
    for (const row of list) {
      const email = row.email?.toLowerCase();
      if (!email || !DEMO_EMAILS.includes(email)) continue;
      const acc = PRIMARY_DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email);
      if (!acc) continue;
      if (row.name !== acc.name || row.position !== acc.position) {
        row.name = acc.name;
        row.position = acc.position;
        changed = true;
      }
      if (acc.key === 'admin' && row.address !== CHURCH_PROFILE_SEED.address) {
        row.address = CHURCH_PROFILE_SEED.address;
        changed = true;
      }
    }
    if (changed) localStorage.setItem('clergy_v1', JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** 정재명 표시명·최상위 조직·교회명 표시 정리 (ID 유지) */
function migrateChurchDisplayConsistency(): void {
  try {
    writeStoredChurchName(CHURCH_PROFILE_SEED.name);

    const patchLeaderLabel = (label: string | null | undefined): string | null | undefined => {
      if (!label) return label;
      if (label === '정재명 목사' || label === '정재명 당회장' || label === '정재명 당회장 목사') {
        return SENIOR_DISPLAY;
      }
      if (label === '정재명') return SENIOR_DISPLAY;
      return label;
    };

    for (const key of ['org_districts_v1', 'org_departments_v1'] as const) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const list = JSON.parse(raw) as Array<{ leader_name?: string | null }>;
      let changed = false;
      for (const row of list) {
        const next = patchLeaderLabel(row.leader_name);
        if (next !== row.leader_name) {
          row.leader_name = next ?? null;
          changed = true;
        }
      }
      if (changed) localStorage.setItem(key, JSON.stringify(list));
    }

    const orgRaw = localStorage.getItem('org_nodes_v1');
    if (orgRaw) {
      const orgs = JSON.parse(orgRaw) as Array<{ id?: string; name?: string }>;
      let orgChanged = false;
      for (const org of orgs) {
        if (org.id === 'org-church-root' && org.name !== CHURCH_PROFILE_SEED.name) {
          org.name = CHURCH_PROFILE_SEED.name;
          orgChanged = true;
        }
      }
      if (orgChanged) localStorage.setItem('org_nodes_v1', JSON.stringify(orgs));
    }

    const leadersRaw = localStorage.getItem('org_leaders_v1');
    if (leadersRaw) {
      const leaders = JSON.parse(leadersRaw) as Array<{
        id?: string;
        organizationId?: string;
        memberId?: string;
        memberName?: string;
        leaderType?: string;
        createdAt?: string;
      }>;
      let changed = false;
      for (const row of leaders) {
        const next = patchLeaderLabel(row.memberName);
        if (typeof next === 'string' && next !== row.memberName) {
          row.memberName = next;
          changed = true;
        }
      }
      const hasRoot = leaders.some(l => l.organizationId === 'org-church-root');
      if (!hasRoot) {
        leaders.unshift({
          id: 'lead-church-root-senior',
          organizationId: 'org-church-root',
          memberId: DEMO_ACCOUNT_IDS.admin,
          memberName: SENIOR_DISPLAY,
          leaderType: '담임목사',
          createdAt: new Date().toISOString(),
        });
        changed = true;
      } else {
        for (const row of leaders) {
          if (row.organizationId !== 'org-church-root') continue;
          if (row.memberId !== DEMO_ACCOUNT_IDS.admin) {
            row.memberId = DEMO_ACCOUNT_IDS.admin;
            changed = true;
          }
          if (row.memberName !== SENIOR_DISPLAY) {
            row.memberName = SENIOR_DISPLAY;
            changed = true;
          }
        }
      }
      if (changed) localStorage.setItem('org_leaders_v1', JSON.stringify(leaders));
    }
  } catch {
    /* ignore */
  }
}

function migrateGeneratedMembers(): void {
  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (!raw) return;
    const data = JSON.parse(raw) as {
      members?: Array<Record<string, unknown>>;
    };
    const members = [...(data.members ?? [])];
    let changed = false;

    for (const acc of PRIMARY_DEMO_ACCOUNTS) {
      const user = buildDemoAppUser(acc.email);
      if (!user) continue;

      const idx = members.findIndex(m => {
        const email = String(m.email ?? '').toLowerCase();
        const id = String(m.id ?? '');
        return email === acc.email.toLowerCase()
          || id === user.id
          || (acc.key === 'member' && (id === 'member-60' || id === 'demo-member60'));
      });

      const patch = {
        id: user.id,
        name: acc.name,
        email: acc.email,
        position: acc.position,
        districtId: user.districtId,
        zoneId: user.zoneId,
        departmentIds: user.departmentIds,
      };

      if (idx >= 0) {
        members[idx] = { ...members[idx], ...patch };
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem('churchieum_demo_generated_v2', JSON.stringify({ ...data, members }));
    }
  } catch {
    /* ignore */
  }
}

/** 앱 시작 시 1회 — 대표 테스트 사용자 stale 데이터 갱신 */
export function migrateDemoUserStorage(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) === DEMO_USER_MIGRATION_VERSION) return;
    migrateStoredCurrentUser();
    migrateClergyRecords();
    migrateGeneratedMembers();
    migrateChurchDisplayConsistency();
    localStorage.setItem(VERSION_KEY, DEMO_USER_MIGRATION_VERSION);
  } catch {
    /* ignore */
  }
}
