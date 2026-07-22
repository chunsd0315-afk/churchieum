/**
 * 기존 기도(prayer) 데이터 → 은혜와 기도(grace note, type=prayer) 1회 마이그레이션
 * 원본 기도 데이터는 삭제하지 않습니다.
 */

import type { GraceNote } from '../data/graceNotes';
import { getAllGraceNotes, replaceAllGraceNotes } from '../data/graceNotes';
import { composeSharedGroupIds } from './graceNoteShareScope';
import { getAllPrayers } from './prayerStorage';
import type { Prayer } from '../types/prayer';
import { migrateVisibility } from '../types/sharedContent';

const LS_MIGRATED = 'churchieum_prayer_to_grace_migrated_v1';

export function graceNoteIdFromPrayer(prayerId: string): string {
  return `gn-prayer-mig-${prayerId}`;
}

export function isMigratedPrayerGraceNote(note: Pick<GraceNote, 'id' | 'migratedFromPrayerId'>): boolean {
  return Boolean(note.migratedFromPrayerId) || note.id.startsWith('gn-prayer-mig-');
}

function prayerToGraceNote(prayer: Prayer): GraceNote {
  const visibility = migrateVisibility(prayer.visibility);
  const orgIds = prayer.sharedOrganizationIds ?? [];
  const sharedGroupIds = composeSharedGroupIds(
    prayer.organizationScope?.districtIds ?? [],
    prayer.organizationScope?.groupIds ?? [],
    prayer.organizationScope?.departmentIds ?? [],
  );
  const groupIds = orgIds.length > 0 ? orgIds : sharedGroupIds;

  let graceContent = prayer.content?.trim() ?? '';
  if (prayer.status === 'answered' && prayer.answerContent?.trim()) {
    graceContent = `${graceContent}\n\n[응답] ${prayer.answerContent.trim()}`.trim();
  }
  if (prayer.gratitudeTestimony?.trim()) {
    graceContent = `${graceContent}\n\n[감사] ${prayer.gratitudeTestimony.trim()}`.trim();
  }

  return {
    id: graceNoteIdFromPrayer(prayer.id),
    userId: prayer.authorId,
    authorName: prayer.authorName,
    authorRole: prayer.authorRole,
    type: 'prayer',
    visibility,
    sharedPastorIds: prayer.sharedPastorIds ?? [],
    sharedPastorAll: false,
    sharedGroupAll: false,
    sharedGroupIds: groupIds,
    sharedOrganizationIds: groupIds,
    sharedUpperOrganizationIds: prayer.organizationScope?.districtIds ?? [],
    sharedLowerOrganizationIds: prayer.organizationScope?.groupIds ?? [],
    sharedDepartmentIds: prayer.organizationScope?.departmentIds ?? [],
    sourceId: prayer.id,
    sourceTitle: prayer.title,
    graceTitle: prayer.title,
    graceContent,
    memorableVerse: '',
    application: '',
    prayer: '',
    isFavorite: prayer.starred ?? false,
    migratedFromPrayerId: prayer.id,
    createdAt: prayer.createdAt,
    updatedAt: prayer.updatedAt,
    likeCount: 0,
    amenCount: 0,
    prayCount: 0,
    comments: [],
  };
}

export type PrayerGraceMigrationReport = {
  migratedCount: number;
  skippedCount: number;
  totalPrayers: number;
};

/** 기도 → grace note 마이그레이션 (1회, 원본 기도 유지) */
export function migratePrayersToGraceNotes(): PrayerGraceMigrationReport {
  const prayers = getAllPrayers().filter(p => !p.deleted);
  const existing = getAllGraceNotes();
  const existingMigratedIds = new Set(
    existing
      .filter(isMigratedPrayerGraceNote)
      .map(n => n.migratedFromPrayerId ?? n.id.replace(/^gn-prayer-mig-/, '')),
  );

  const toAdd: GraceNote[] = [];
  for (const p of prayers) {
    if (existingMigratedIds.has(p.id)) continue;
    if (existing.some(n => n.id === graceNoteIdFromPrayer(p.id))) continue;
    toAdd.push(prayerToGraceNote(p));
  }

  if (toAdd.length > 0) {
    replaceAllGraceNotes([...existing, ...toAdd]);
  }

  try {
    localStorage.setItem(LS_MIGRATED, '1');
  } catch { /* ignore */ }

  return {
    migratedCount: toAdd.length,
    skippedCount: prayers.length - toAdd.length,
    totalPrayers: prayers.length,
  };
}

export function isPrayerGraceMigrationDone(): boolean {
  try {
    return localStorage.getItem(LS_MIGRATED) === '1';
  } catch {
    return false;
  }
}

/** 앱 로드 시 1회 — 신규 기도도 누락 없이 동기화 */
export function ensurePrayersMigratedToGraceNotes(): PrayerGraceMigrationReport | null {
  const prayers = getAllPrayers().filter(p => !p.deleted);
  const existing = getAllGraceNotes();
  const missing = prayers.some(
    p => !existing.some(n => n.id === graceNoteIdFromPrayer(p.id) || n.migratedFromPrayerId === p.id),
  );
  if (!missing && isPrayerGraceMigrationDone()) return null;
  return migratePrayersToGraceNotes();
}
