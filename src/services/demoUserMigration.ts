/**
 * 대표 테스트 계정(3명) localStorage 마이그레이션
 * — 기존 김영수·강수아 등 stale 데이터를 정재명·이변우·천성대로 갱신
 */
import {
  PRIMARY_DEMO_ACCOUNTS,
  buildDemoAppUser,
  normalizePrimaryDemoUser,
} from '../config/demoAccounts';
import type { AppUser } from './permissions';

const VERSION_KEY = 'churchieum_demo_user_version';
export const DEMO_USER_MIGRATION_VERSION = '3';

const DEMO_EMAILS = PRIMARY_DEMO_ACCOUNTS.map(a => a.email.toLowerCase());

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
    }
    if (changed) localStorage.setItem('clergy_v1', JSON.stringify(list));
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
    localStorage.setItem(VERSION_KEY, DEMO_USER_MIGRATION_VERSION);
  } catch {
    /* ignore */
  }
}
