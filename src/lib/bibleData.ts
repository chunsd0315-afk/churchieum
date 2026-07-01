/**
 * Bible data access abstraction.
 * Switch DATA_SOURCE to plug in Firebase, external JSON, or API.
 *
 * To connect Firebase:
 *   1. Change DATA_SOURCE to 'firebase'
 *   2. Implement getBibleVerseFirebase below
 *
 * To use external JSON file:
 *   1. Place bible-kr.json in /public/
 *   2. Change DATA_SOURCE to 'json'
 */

import { BIBLE_KR, BOOK_LIST } from './bibleVersesKR';

export type DataSource = 'demo' | 'firebase' | 'json-file' | 'api';
export const DATA_SOURCE: DataSource = 'demo';

export type BookInfo = { name: string; abbr: string; chapters: number; testament: 'old' | 'new' };
export type SearchResult = { book: string; chapter: number; verse: number; text: string; reference: string };

/* ─── Verse lookup ──────────────────────────────────── */

export function getVerse(book: string, chapter: number, verse: number): string | null {
  if (DATA_SOURCE === 'demo') {
    return BIBLE_KR[book]?.[chapter]?.[verse] ?? null;
  }
  // Firebase / JSON / API adapters go here
  return null;
}

export function getChapterVerses(book: string, chapter: number): Record<number, string> {
  if (DATA_SOURCE === 'demo') {
    return BIBLE_KR[book]?.[chapter] ?? {};
  }
  return {};
}

export function hasChapterData(book: string, chapter: number): boolean {
  return Object.keys(getChapterVerses(book, chapter)).length > 0;
}

/* ─── Search ────────────────────────────────────────── */

export function searchVerses(query: string, limit = 30): SearchResult[] {
  if (!query.trim() || DATA_SOURCE !== 'demo') return [];
  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  for (const [book, chapters] of Object.entries(BIBLE_KR)) {
    for (const [ch, verses] of Object.entries(chapters)) {
      for (const [v, text] of Object.entries(verses)) {
        if (text.includes(q)) {
          results.push({
            book,
            chapter: Number(ch),
            verse: Number(v),
            text,
            reference: `${book} ${ch}:${v}`,
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}

/* ─── Book list ─────────────────────────────────────── */

export function getBookList(testament?: 'old' | 'new'): BookInfo[] {
  if (!testament) return BOOK_LIST;
  return BOOK_LIST.filter(b => b.testament === testament);
}

export function getBook(name: string): BookInfo | undefined {
  return BOOK_LIST.find(b => b.name === name);
}

/* ─── Verse count estimate ──────────────────────────── */

const VERSE_COUNTS: Record<string, Record<number, number>> = {
  창세기:  { 1: 31, 2: 25, 3: 24, 4: 26, 5: 32, 6: 22, 7: 24, 8: 22, 9: 29, 10: 32, 11: 32, 12: 20, 50: 26 },
  시편:    { 1: 6, 23: 6, 91: 16, 119: 176 },
  요한복음: { 3: 36, 14: 31, 15: 27 },
  로마서:  { 8: 39, 12: 21 },
  마태복음: { 5: 48, 6: 34 },
};

export function getVerseCount(book: string, chapter: number): number {
  return VERSE_COUNTS[book]?.[chapter] ?? 30;
}
