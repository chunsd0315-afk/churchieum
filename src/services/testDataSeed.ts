/**
 * 은혜기록·기도 테스트 Seed 통합 실행
 */

import {
  getAllGraceNotes,
  isDemoGraceNotesSeeded,
} from '../data/graceNotes';
import {
  ensureGraceNoteDemoData,
  resetGraceNoteDemoData,
  prepareDemoSeedAuthors,
  validateCurrentGraceSeedData,
} from '../data/graceNoteSeed';
import {
  formatGraceSeedValidationReport,
  type GraceSeedValidationReport,
} from './graceNoteSeedNormalize';
import { ensurePrayerDemoData, resetPrayerDemoData } from '../data/prayerSeed';
import { getAllPrayers, isDemoPrayersSeeded } from '../services/prayerStorage';
import { migrateVisibility } from '../types/sharedContent';
import {
  matchesSharedContentSearch,
  filterSharedContentByTab,
} from '../services/sharedContentAccess';
import type { AppUser } from '../services/permissions';

export type TestDataSeedReport = {
  graceNoteCount: number;
  prayerCount: number;
  authorCount: number;
  visibilityDistribution: Record<string, number>;
  graceTypeDistribution: Record<string, number>;
  alreadySeeded: boolean;
  searchTestPassed: boolean;
  permissionTestPassed: boolean;
  filterTestPassed: boolean;
  paginationTestPassed: boolean;
  graceValidation?: GraceSeedValidationReport;
};

const DEMO_MEMBER: AppUser = {
  id: 'demo-member60',
  email: 'member60@demo.com',
  name: '천성대',
  role: 'member',
  position: '장로',
  districtId: 'd1',
  zoneId: 'z1',
  departmentIds: ['dep3', 'dep5'],
};

function countVisibility(items: { visibility: string }[]): Record<string, number> {
  const counts: Record<string, number> = {
    private: 0,
    pastor_share: 0,
    organization_share: 0,
  };
  for (const item of items) {
    const v = migrateVisibility(item.visibility);
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return counts;
}

function runSmokeTests(user: AppUser): Pick<
  TestDataSeedReport,
  'searchTestPassed' | 'permissionTestPassed' | 'filterTestPassed' | 'paginationTestPassed'
> {
  const graceNotes = getAllGraceNotes();
  const prayers = getAllPrayers();

  const searchGrace = graceNotes.filter(n => matchesSharedContentSearch(n, '감사'));
  const searchPrayer = prayers.filter(p => matchesSharedContentSearch(p, '기도'));
  const searchTestPassed = searchGrace.length > 0 && searchPrayer.length > 0;

  const mineGrace = filterSharedContentByTab(graceNotes, user, 'mine');
  const sharedGrace = filterSharedContentByTab(graceNotes, user, 'shared');
  const minePrayer = filterSharedContentByTab(prayers, user, 'mine');
  const permissionTestPassed =
    mineGrace.length > 0 && sharedGrace.length > 0 && minePrayer.length > 0;

  const privateGrace = graceNotes.filter(n => migrateVisibility(n.visibility) === 'private');
  const pastorGrace = graceNotes.filter(n => migrateVisibility(n.visibility) === 'pastor_share');
  const filterTestPassed = privateGrace.length > 0 && pastorGrace.length > 0;

  const pageSize = 20;
  const paginationTestPassed =
    Math.ceil(graceNotes.length / pageSize) >= 2 &&
    Math.ceil(prayers.length / pageSize) >= 2;

  return { searchTestPassed, permissionTestPassed, filterTestPassed, paginationTestPassed };
}

export function isTestDataSeeded(): boolean {
  return isDemoGraceNotesSeeded() && isDemoPrayersSeeded();
}

export function runTestDataSeed(options?: { force?: boolean }): TestDataSeedReport {
  const wasSeeded = isTestDataSeeded();

  if (options?.force) {
    resetGraceNoteDemoData();
    resetPrayerDemoData();
  } else if (wasSeeded) {
    return buildReport(true);
  } else {
    ensureGraceNoteDemoData();
    ensurePrayerDemoData();
  }

  return buildReport(wasSeeded && !options?.force);
}

function buildReport(alreadySeeded: boolean): TestDataSeedReport {
  const graceNotes = getAllGraceNotes();
  const prayers = getAllPrayers();
  const authors = prepareDemoSeedAuthors();

  const graceTypeDistribution: Record<string, number> = {};
  for (const n of graceNotes) {
    graceTypeDistribution[n.type] = (graceTypeDistribution[n.type] ?? 0) + 1;
  }

  const combined = [...graceNotes, ...prayers];
  const visibilityDistribution = countVisibility(combined);
  const smoke = runSmokeTests(DEMO_MEMBER);
  const graceValidation = validateCurrentGraceSeedData();

  return {
    graceNoteCount: graceNotes.length,
    prayerCount: prayers.length,
    authorCount: authors.length,
    visibilityDistribution,
    graceTypeDistribution,
    alreadySeeded,
    graceValidation,
    ...smoke,
  };
}

export function resetAllTestData(): TestDataSeedReport {
  resetGraceNoteDemoData();
  resetPrayerDemoData();
  return buildReport(false);
}

export function formatTestDataSeedReport(report: TestDataSeedReport): string {
  const vis = Object.entries(report.visibilityDistribution)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const types = Object.entries(report.graceTypeDistribution)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return [
    `은혜기록 ${report.graceNoteCount}건`,
    `기도 ${report.prayerCount}건`,
    `작성자 ${report.authorCount}명`,
    `공개범위 — ${vis}`,
    `기록유형 — ${types}`,
    `검색 테스트: ${report.searchTestPassed ? '통과' : '실패'}`,
    `권한 테스트: ${report.permissionTestPassed ? '통과' : '실패'}`,
    `상세설정 테스트: ${report.filterTestPassed ? '통과' : '실패'}`,
    `페이지네이션 테스트: ${report.paginationTestPassed ? '통과' : '실패'}`,
    report.graceValidation
      ? `은혜 seed 검증: ${report.graceValidation.passed ? '통과' : '실패'} (seed ${report.graceValidation.seedCount} / 사용자 ${report.graceValidation.userCount})`
      : '',
  ].filter(Boolean).join('\n');
}
