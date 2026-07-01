/**
 * 은혜 기록 (Grace Notes) — localStorage persistence
 * Unified schema for reading (성경통독) and sermon (설교) grace notes
 */

const LS_KEY = 'graceNotesV2';

export type GraceNoteType = 'reading' | 'sermon' | 'personal';

export type GraceNoteVisibility = 'private' | 'pastor' | 'group';

export type GraceNote = {
  id: string;
  userId?: string;
  type: GraceNoteType;
  visibility: GraceNoteVisibility;
  // source info
  sourceId?: string;        // progressId (reading) | sermonId (sermon)
  sourceTitle?: string;     // plan name (reading) | sermon title (sermon)
  // reading-specific
  planId?: string;
  planName?: string;
  planColor?: string;
  day?: number;
  // sermon-specific
  sermonTitle?: string;
  sermonPreacher?: string;
  sermonDate?: string;
  // shared
  bibleReference?: string;  // readingReferences (reading) | bible_verse (sermon)
  memorableVerse: string;
  graceContent: string;
  application: string;
  prayer: string;
  createdAt: string;
  updatedAt: string;
};

export type GraceNoteInput = Omit<GraceNote, 'id' | 'createdAt' | 'updatedAt'>;

function load(): GraceNote[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GraceNote[];
      return parsed.map(n => ({ ...n, visibility: n.visibility ?? 'private' }));
    }

    // Migrate from v1
    const oldRaw = localStorage.getItem('graceNotesV1');
    if (oldRaw) {
      type OldNote = {
        id: string; progressId: string; planId: string; planName: string;
        planColor: string; day: number; readingReferences: string;
        graceContent: string; memorableVerse: string; application: string;
        prayer: string; createdAt: string; updatedAt: string;
      };
      const migrated: GraceNote[] = (JSON.parse(oldRaw) as OldNote[]).map(n => ({
        id: n.id,
        type: 'reading' as GraceNoteType,
        visibility: 'private' as GraceNoteVisibility,
        sourceId: n.progressId,
        sourceTitle: n.planName,
        planId: n.planId,
        planName: n.planName,
        planColor: n.planColor,
        day: n.day,
        bibleReference: n.readingReferences,
        memorableVerse: n.memorableVerse,
        graceContent: n.graceContent,
        application: n.application,
        prayer: n.prayer,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
      save(migrated);
      return migrated;
    }
    return [];
  } catch { return []; }
}

function save(notes: GraceNote[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notes)); } catch { /* ignore */ }
}

export function getAllGraceNotes(): GraceNote[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNote(id: string): GraceNote | null {
  return load().find(n => n.id === id) ?? null;
}

export function getGraceNotesByType(type: GraceNoteType): GraceNote[] {
  return load()
    .filter(n => n.type === type)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNotesByProgress(progressId: string): GraceNote[] {
  return load()
    .filter(n => n.sourceId === progressId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNotesByPlan(planId: string): GraceNote[] {
  return load()
    .filter(n => n.planId === planId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGraceNotesBySource(sourceId: string): GraceNote[] {
  return load()
    .filter(n => n.sourceId === sourceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createGraceNote(input: GraceNoteInput): GraceNote {
  const now = new Date().toISOString();
  const note: GraceNote = { ...input, visibility: input.visibility ?? 'private', id: `gn-${Date.now()}`, createdAt: now, updatedAt: now };
  const notes = load();
  notes.push(note);
  save(notes);
  return note;
}

export function updateGraceNote(id: string, updates: Partial<Omit<GraceNote, 'id' | 'createdAt'>>): void {
  const notes = load();
  const idx = notes.findIndex(n => n.id === id);
  if (idx < 0) return;
  notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date().toISOString() };
  save(notes);
}

export function deleteGraceNote(id: string): void {
  save(load().filter(n => n.id !== id));
}

export function analyzeGraceNotes(notes: GraceNote[]) {
  const byPlan: Record<string, number> = {};
  const byBook: Record<string, number> = {};
  const last7 = notes.filter(n => (Date.now() - new Date(n.createdAt).getTime()) < 7 * 86_400_000);
  const byMonth: Record<string, number> = {};

  for (const n of notes) {
    const label = n.planName ?? n.sermonTitle ?? n.sourceTitle ?? '기타';
    byPlan[label] = (byPlan[label] ?? 0) + 1;
    const month = n.createdAt.slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
    const ref = n.bibleReference ?? '';
    const books = ref.match(/[가-힣]+/g) ?? [];
    for (const b of books) byBook[b] = (byBook[b] ?? 0) + 1;
  }

  const topPlan = Object.entries(byPlan).sort((a, b) => b[1] - a[1])[0];
  const topBook = Object.entries(byBook).sort((a, b) => b[1] - a[1])[0];

  return {
    total: notes.length,
    last7Days: last7.length,
    topPlan: topPlan ? topPlan[0] : null,
    topBook: topBook ? topBook[0] : null,
    byMonth,
    readingCount: notes.filter(n => n.type === 'reading').length,
    sermonCount: notes.filter(n => n.type === 'sermon').length,
  };
}
