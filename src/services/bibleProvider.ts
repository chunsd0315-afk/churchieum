/**
 * BibleProvider — swappable Bible data adapter
 *
 * Current backend: JSON file at /bible/korean-revised-hangul.json
 * To swap backend:
 *   - Firebase: replace loadFromJson() with loadFromFirebase()
 *   - External API: replace with fetch calls
 *   - SQLite: replace with libsql queries
 */

import { BIBLE_KR, BOOK_LIST, type BibleVerseMap } from './bibleVersesKR';
import { parseBibleReference, type BibleRef } from '../utils/bibleParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BibleBook = {
  book: string;
  shortName: string;
  testament: '구약' | '신약';
  chapters: BibleChapter[];
};

export type BibleChapter = {
  chapter: number;
  verses: BibleVerseEntry[];
};

export type BibleVerseEntry = {
  verse: number;
  text: string;
};

// ─── Runtime store ────────────────────────────────────────────────────────────

// Merged map: initially from bibleVersesKR.ts inline data, augmented by JSON load
const runtimeStore: BibleVerseMap = {};

// Copy inline data into runtime store on module init
for (const [book, chapters] of Object.entries(BIBLE_KR)) {
  runtimeStore[book] = {};
  for (const [ch, verses] of Object.entries(chapters)) {
    runtimeStore[book][Number(ch)] = { ...verses };
  }
}

let loaded = false;

// ─── JSON Loader ─────────────────────────────────────────────────────────────

async function loadFromJson(): Promise<void> {
  const res = await fetch('/bible/korean-revised-hangul.json');
  if (!res.ok) throw new Error(`Failed to load bible JSON: ${res.status}`);
  const books: BibleBook[] = await res.json();

  for (const book of books) {
    if (!runtimeStore[book.book]) runtimeStore[book.book] = {};
    for (const ch of book.chapters) {
      if (!runtimeStore[book.book][ch.chapter]) {
        runtimeStore[book.book][ch.chapter] = {};
      }
      for (const v of ch.verses) {
        runtimeStore[book.book][ch.chapter][v.verse] = v.text;
      }
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadBibleData(): Promise<void> {
  if (loaded) return;
  try {
    await loadFromJson();
  } catch (e) {
    console.warn('[BibleProvider] JSON load failed, using inline data only:', e);
  }
  loaded = true;
}

export function getBooks(testament?: '구약' | '신약') {
  return testament
    ? BOOK_LIST.filter(b => (testament === '구약' ? b.testament === 'old' : b.testament === 'new'))
    : BOOK_LIST;
}

export function getBook(bookOrShortName: string) {
  return BOOK_LIST.find(b => b.name === bookOrShortName || b.abbr === bookOrShortName) ?? null;
}

export function getChapter(book: string, chapter: number): BibleVerseEntry[] {
  const raw = runtimeStore[book]?.[chapter];
  if (!raw) return [];
  return Object.entries(raw)
    .map(([v, text]) => ({ verse: Number(v), text }))
    .sort((a, b) => a.verse - b.verse);
}

export function getVerse(book: string, chapter: number, verse: number): BibleVerseEntry | null {
  const text = runtimeStore[book]?.[chapter]?.[verse];
  return text ? { verse, text } : null;
}

export function hasChapter(book: string, chapter: number): boolean {
  return !!runtimeStore[book]?.[chapter];
}

export function searchBible(query: string, limit = 30): Array<{ book: string; chapter: number; verse: number; text: string }> {
  const q = query.trim();
  if (!q) return [];

  // Try reference parse first
  const ref = parseBibleReference(q);
  if (ref) {
    if (ref.verse) {
      const v = getVerse(ref.book, ref.chapter, ref.verse);
      return v ? [{ book: ref.book, chapter: ref.chapter, ...v }] : [];
    }
    const verses = getChapter(ref.book, ref.chapter);
    return verses.map(v => ({ book: ref.book, chapter: ref.chapter, ...v })).slice(0, limit);
  }

  // Keyword search across all loaded data
  const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
  for (const [book, chapters] of Object.entries(runtimeStore)) {
    for (const [ch, verses] of Object.entries(chapters)) {
      for (const [v, text] of Object.entries(verses)) {
        if (text.includes(q) || book.includes(q)) {
          results.push({ book, chapter: Number(ch), verse: Number(v), text });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}

export { parseBibleReference };
export type { BibleRef };
