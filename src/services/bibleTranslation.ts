/**
 * bibleTranslation.ts
 * Multi-translation Bible provider supporting KRV (개역한글) and WEB (World English Bible).
 * Keeps existing bibleProvider.ts intact — this is an additive layer.
 */

import { BIBLE_KR } from './bibleVersesKR';
import { parseBibleReference } from '../utils/bibleParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TranslationId = 'krv' | 'web';

export type TranslationMode = 'korean' | 'web' | 'parallel';

export type TranslationInfo = {
  id: TranslationId;
  name: string;        // e.g. "개역한글"
  shortName: string;   // e.g. "KRV"
  language: 'ko' | 'en';
};

export type VerseEntry = {
  verse: number;
  text: string;
};

export type ParallelVerse = {
  verse: number;
  korean?: string;
  english?: string;
};

// ─── Translation registry ─────────────────────────────────────────────────────

export const TRANSLATIONS: TranslationInfo[] = [
  { id: 'krv', name: '개역한글',          shortName: 'KRV', language: 'ko' },
  { id: 'web', name: 'World English Bible', shortName: 'WEB', language: 'en' },
];

export function getAvailableTranslations(): TranslationInfo[] {
  return TRANSLATIONS;
}

// ─── Korean ↔ English book mapping ────────────────────────────────────────────

export type BookMapping = {
  bookId: string;       // e.g. "GEN"
  korean: string;       // e.g. "창세기"
  english: string;      // e.g. "Genesis"
  koreanAbbr: string;   // e.g. "창"
  englishAbbr: string;  // e.g. "Gen"
};

export const BOOK_MAPPINGS: BookMapping[] = [
  { bookId: 'GEN', korean: '창세기',    koreanAbbr: '창',    english: 'Genesis',       englishAbbr: 'Gen' },
  { bookId: 'EXO', korean: '출애굽기',  koreanAbbr: '출',    english: 'Exodus',        englishAbbr: 'Ex' },
  { bookId: 'LEV', korean: '레위기',    koreanAbbr: '레',    english: 'Leviticus',     englishAbbr: 'Lev' },
  { bookId: 'NUM', korean: '민수기',    koreanAbbr: '민',    english: 'Numbers',       englishAbbr: 'Num' },
  { bookId: 'DEU', korean: '신명기',    koreanAbbr: '신',    english: 'Deuteronomy',   englishAbbr: 'Deut' },
  { bookId: 'JOS', korean: '여호수아',  koreanAbbr: '수',    english: 'Joshua',        englishAbbr: 'Josh' },
  { bookId: 'JDG', korean: '사사기',    koreanAbbr: '삿',    english: 'Judges',        englishAbbr: 'Judg' },
  { bookId: 'RUT', korean: '룻기',      koreanAbbr: '룻',    english: 'Ruth',          englishAbbr: 'Ruth' },
  { bookId: '1SA', korean: '사무엘상',  koreanAbbr: '삼상',  english: '1 Samuel',      englishAbbr: '1Sam' },
  { bookId: '2SA', korean: '사무엘하',  koreanAbbr: '삼하',  english: '2 Samuel',      englishAbbr: '2Sam' },
  { bookId: '1KI', korean: '열왕기상',  koreanAbbr: '왕상',  english: '1 Kings',       englishAbbr: '1Kgs' },
  { bookId: '2KI', korean: '열왕기하',  koreanAbbr: '왕하',  english: '2 Kings',       englishAbbr: '2Kgs' },
  { bookId: '1CH', korean: '역대상',    koreanAbbr: '대상',  english: '1 Chronicles',  englishAbbr: '1Chr' },
  { bookId: '2CH', korean: '역대하',    koreanAbbr: '대하',  english: '2 Chronicles',  englishAbbr: '2Chr' },
  { bookId: 'EZR', korean: '에스라',    koreanAbbr: '스',    english: 'Ezra',          englishAbbr: 'Ezra' },
  { bookId: 'NEH', korean: '느헤미야',  koreanAbbr: '느',    english: 'Nehemiah',      englishAbbr: 'Neh' },
  { bookId: 'EST', korean: '에스더',    koreanAbbr: '에',    english: 'Esther',        englishAbbr: 'Est' },
  { bookId: 'JOB', korean: '욥기',      koreanAbbr: '욥',    english: 'Job',           englishAbbr: 'Job' },
  { bookId: 'PSA', korean: '시편',      koreanAbbr: '시',    english: 'Psalms',        englishAbbr: 'Ps' },
  { bookId: 'PRO', korean: '잠언',      koreanAbbr: '잠',    english: 'Proverbs',      englishAbbr: 'Prov' },
  { bookId: 'ECC', korean: '전도서',    koreanAbbr: '전',    english: 'Ecclesiastes',  englishAbbr: 'Eccl' },
  { bookId: 'SNG', korean: '아가',      koreanAbbr: '아',    english: 'Song of Songs', englishAbbr: 'Song' },
  { bookId: 'ISA', korean: '이사야',    koreanAbbr: '사',    english: 'Isaiah',        englishAbbr: 'Isa' },
  { bookId: 'JER', korean: '예레미야',  koreanAbbr: '렘',    english: 'Jeremiah',      englishAbbr: 'Jer' },
  { bookId: 'LAM', korean: '예레미야애가', koreanAbbr: '애', english: 'Lamentations', englishAbbr: 'Lam' },
  { bookId: 'EZK', korean: '에스겔',    koreanAbbr: '겔',    english: 'Ezekiel',       englishAbbr: 'Ezek' },
  { bookId: 'DAN', korean: '다니엘',    koreanAbbr: '단',    english: 'Daniel',        englishAbbr: 'Dan' },
  { bookId: 'HOS', korean: '호세아',    koreanAbbr: '호',    english: 'Hosea',         englishAbbr: 'Hos' },
  { bookId: 'JOL', korean: '요엘',      koreanAbbr: '욜',    english: 'Joel',          englishAbbr: 'Joel' },
  { bookId: 'AMO', korean: '아모스',    koreanAbbr: '암',    english: 'Amos',          englishAbbr: 'Amos' },
  { bookId: 'OBA', korean: '오바댜',    koreanAbbr: '옵',    english: 'Obadiah',       englishAbbr: 'Obad' },
  { bookId: 'JON', korean: '요나',      koreanAbbr: '욘',    english: 'Jonah',         englishAbbr: 'Jon' },
  { bookId: 'MIC', korean: '미가',      koreanAbbr: '미',    english: 'Micah',         englishAbbr: 'Mic' },
  { bookId: 'NAH', korean: '나훔',      koreanAbbr: '나',    english: 'Nahum',         englishAbbr: 'Nah' },
  { bookId: 'HAB', korean: '하박국',    koreanAbbr: '합',    english: 'Habakkuk',      englishAbbr: 'Hab' },
  { bookId: 'ZEP', korean: '스바냐',    koreanAbbr: '습',    english: 'Zephaniah',     englishAbbr: 'Zeph' },
  { bookId: 'HAG', korean: '학개',      koreanAbbr: '학',    english: 'Haggai',        englishAbbr: 'Hag' },
  { bookId: 'ZEC', korean: '스가랴',    koreanAbbr: '슥',    english: 'Zechariah',     englishAbbr: 'Zech' },
  { bookId: 'MAL', korean: '말라기',    koreanAbbr: '말',    english: 'Malachi',       englishAbbr: 'Mal' },
  { bookId: 'MAT', korean: '마태복음',  koreanAbbr: '마',    english: 'Matthew',       englishAbbr: 'Matt' },
  { bookId: 'MRK', korean: '마가복음',  koreanAbbr: '막',    english: 'Mark',          englishAbbr: 'Mark' },
  { bookId: 'LUK', korean: '누가복음',  koreanAbbr: '눅',    english: 'Luke',          englishAbbr: 'Luke' },
  { bookId: 'JHN', korean: '요한복음',  koreanAbbr: '요',    english: 'John',          englishAbbr: 'John' },
  { bookId: 'ACT', korean: '사도행전',  koreanAbbr: '행',    english: 'Acts',          englishAbbr: 'Acts' },
  { bookId: 'ROM', korean: '로마서',    koreanAbbr: '롬',    english: 'Romans',        englishAbbr: 'Rom' },
  { bookId: '1CO', korean: '고린도전서', koreanAbbr: '고전', english: '1 Corinthians', englishAbbr: '1Cor' },
  { bookId: '2CO', korean: '고린도후서', koreanAbbr: '고후', english: '2 Corinthians', englishAbbr: '2Cor' },
  { bookId: 'GAL', korean: '갈라디아서', koreanAbbr: '갈',   english: 'Galatians',     englishAbbr: 'Gal' },
  { bookId: 'EPH', korean: '에베소서',  koreanAbbr: '엡',    english: 'Ephesians',     englishAbbr: 'Eph' },
  { bookId: 'PHP', korean: '빌립보서',  koreanAbbr: '빌',    english: 'Philippians',   englishAbbr: 'Phil' },
  { bookId: 'COL', korean: '골로새서',  koreanAbbr: '골',    english: 'Colossians',    englishAbbr: 'Col' },
  { bookId: '1TH', korean: '데살로니가전서', koreanAbbr: '살전', english: '1 Thessalonians', englishAbbr: '1Thess' },
  { bookId: '2TH', korean: '데살로니가후서', koreanAbbr: '살후', english: '2 Thessalonians', englishAbbr: '2Thess' },
  { bookId: '1TI', korean: '디모데전서', koreanAbbr: '딤전', english: '1 Timothy',     englishAbbr: '1Tim' },
  { bookId: '2TI', korean: '디모데후서', koreanAbbr: '딤후', english: '2 Timothy',     englishAbbr: '2Tim' },
  { bookId: 'TIT', korean: '디도서',    koreanAbbr: '딛',    english: 'Titus',         englishAbbr: 'Titus' },
  { bookId: 'PHM', korean: '빌레몬서',  koreanAbbr: '몬',    english: 'Philemon',      englishAbbr: 'Phlm' },
  { bookId: 'HEB', korean: '히브리서',  koreanAbbr: '히',    english: 'Hebrews',       englishAbbr: 'Heb' },
  { bookId: 'JAS', korean: '야고보서',  koreanAbbr: '약',    english: 'James',         englishAbbr: 'Jas' },
  { bookId: '1PE', korean: '베드로전서', koreanAbbr: '벧전', english: '1 Peter',       englishAbbr: '1Pet' },
  { bookId: '2PE', korean: '베드로후서', koreanAbbr: '벧후', english: '2 Peter',       englishAbbr: '2Pet' },
  { bookId: '1JN', korean: '요한1서',   koreanAbbr: '요일',  english: '1 John',        englishAbbr: '1John' },
  { bookId: '2JN', korean: '요한2서',   koreanAbbr: '요이',  english: '2 John',        englishAbbr: '2John' },
  { bookId: '3JN', korean: '요한3서',   koreanAbbr: '요삼',  english: '3 John',        englishAbbr: '3John' },
  { bookId: 'JUD', korean: '유다서',    koreanAbbr: '유',    english: 'Jude',          englishAbbr: 'Jude' },
  { bookId: 'REV', korean: '요한계시록', koreanAbbr: '계',   english: 'Revelation',    englishAbbr: 'Rev' },
];

export function getBookMappingByKorean(korean: string): BookMapping | undefined {
  return BOOK_MAPPINGS.find(m => m.korean === korean || m.koreanAbbr === korean);
}

export function getBookMappingByEnglish(english: string): BookMapping | undefined {
  const q = english.trim();
  return BOOK_MAPPINGS.find(m =>
    m.english.toLowerCase() === q.toLowerCase() ||
    m.englishAbbr.toLowerCase() === q.toLowerCase()
  );
}

export function getEnglishBookName(koreanBook: string): string | undefined {
  return getBookMappingByKorean(koreanBook)?.english;
}

export function getKoreanBookName(englishBook: string): string | undefined {
  return getBookMappingByEnglish(englishBook)?.korean;
}

// ─── Runtime store — WEB data ─────────────────────────────────────────────────
// key: english book name (e.g. "Genesis")

type VerseStore = Record<string, Record<number, Record<number, string>>>;

const webStore: VerseStore = {};
let webLoaded = false;

export async function loadWebBible(): Promise<void> {
  if (webLoaded) return;
  try {
    const res = await fetch('/bible/world-english-bible.json');
    if (!res.ok) throw new Error(`WEB load failed: ${res.status}`);
    const data = await res.json();
    const books: Array<{ book: string; chapters: Array<{ chapter: number; verses: VerseEntry[] }> }> = data.books;
    for (const b of books) {
      if (!webStore[b.book]) webStore[b.book] = {};
      for (const ch of b.chapters) {
        if (!webStore[b.book][ch.chapter]) webStore[b.book][ch.chapter] = {};
        for (const v of ch.verses) {
          webStore[b.book][ch.chapter][v.verse] = v.text;
        }
      }
    }
  } catch (e) {
    console.warn('[BibleTranslation] WEB load failed:', e);
  }
  webLoaded = true;
}

// ─── Chapter/Verse access ─────────────────────────────────────────────────────

export function getChapterKRV(book: string, chapter: number): VerseEntry[] {
  const raw = BIBLE_KR[book]?.[chapter];
  if (!raw) return [];
  return Object.entries(raw).map(([v, text]) => ({ verse: Number(v), text })).sort((a, b) => a.verse - b.verse);
}

export function getChapterWEB(koreanBook: string, chapter: number): VerseEntry[] {
  const engName = getEnglishBookName(koreanBook);
  if (!engName) return [];
  const raw = webStore[engName]?.[chapter];
  if (!raw) return [];
  return Object.entries(raw).map(([v, text]) => ({ verse: Number(v), text })).sort((a, b) => a.verse - b.verse);
}

export function getChapterByTranslation(book: string, chapter: number, translationId: TranslationId): VerseEntry[] {
  return translationId === 'krv'
    ? getChapterKRV(book, chapter)
    : getChapterWEB(book, chapter);
}

export function getParallelChapter(koreanBook: string, chapter: number): ParallelVerse[] {
  const krVerses = getChapterKRV(koreanBook, chapter);
  const webVerses = getChapterWEB(koreanBook, chapter);

  const verseNums = new Set([...krVerses.map(v => v.verse), ...webVerses.map(v => v.verse)]);
  const krMap: Record<number, string> = {};
  const webMap: Record<number, string> = {};
  for (const v of krVerses) krMap[v.verse] = v.text;
  for (const v of webVerses) webMap[v.verse] = v.text;

  return Array.from(verseNums).sort((a, b) => a - b).map(n => ({
    verse: n,
    korean: krMap[n],
    english: webMap[n],
  }));
}

export function getVerseKRV(book: string, chapter: number, verse: number): string | undefined {
  return BIBLE_KR[book]?.[chapter]?.[verse];
}

export function getVerseWEB(koreanBook: string, chapter: number, verse: number): string | undefined {
  const engName = getEnglishBookName(koreanBook);
  if (!engName) return undefined;
  return webStore[engName]?.[chapter]?.[verse];
}

export function hasChapterWEB(koreanBook: string, chapter: number): boolean {
  const engName = getEnglishBookName(koreanBook);
  if (!engName) return false;
  return !!webStore[engName]?.[chapter];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export type SearchResult = {
  book: string;       // always korean book name
  chapter: number;
  verse: number;
  text: string;
  translation: TranslationId;
};

export function searchBibleTranslation(
  query: string,
  mode: TranslationMode,
  limit = 30,
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  if (mode === 'korean' || mode === 'parallel') {
    // Try parsing as Korean reference first
    const ref = parseBibleReference(q);
    if (ref) {
      const verses = getChapterKRV(ref.book, ref.chapter);
      if (ref.verse) {
        const v = verses.find(vv => vv.verse === ref.verse);
        if (v) results.push({ book: ref.book, chapter: ref.chapter, verse: v.verse, text: v.text, translation: 'krv' });
      } else {
        verses.slice(0, limit).forEach(v =>
          results.push({ book: ref.book, chapter: ref.chapter, verse: v.verse, text: v.text, translation: 'krv' })
        );
      }
      if (results.length > 0) return results;
    }
    // Full-text search KRV
    for (const [book, chapters] of Object.entries(BIBLE_KR)) {
      for (const [ch, verses] of Object.entries(chapters)) {
        for (const [v, text] of Object.entries(verses)) {
          if (text.includes(q) || book.includes(q)) {
            results.push({ book, chapter: Number(ch), verse: Number(v), text, translation: 'krv' });
            if (results.length >= limit) return results;
          }
        }
      }
    }
  }

  if (mode === 'web' || mode === 'parallel') {
    // English reference search
    const engRef = parseEnglishReference(q);
    if (engRef) {
      const korBook = getKoreanBookName(engRef.book);
      if (korBook) {
        const verses = getChapterWEB(korBook, engRef.chapter);
        if (engRef.verse) {
          const v = verses.find(vv => vv.verse === engRef.verse);
          if (v) results.push({ book: korBook, chapter: engRef.chapter, verse: v.verse, text: v.text, translation: 'web' });
        } else {
          verses.slice(0, limit).forEach(v =>
            results.push({ book: korBook, chapter: engRef.chapter, verse: v.verse, text: v.text, translation: 'web' })
          );
        }
        if (results.length > 0) return results;
      }
    }
    // Full-text search WEB
    for (const [engBook, chapters] of Object.entries(webStore)) {
      const korBook = getKoreanBookName(engBook) ?? engBook;
      for (const [ch, verses] of Object.entries(chapters)) {
        for (const [v, text] of Object.entries(verses)) {
          if (text.toLowerCase().includes(q.toLowerCase()) || engBook.toLowerCase().includes(q.toLowerCase())) {
            results.push({ book: korBook, chapter: Number(ch), verse: Number(v), text, translation: 'web' });
            if (results.length >= limit) return results;
          }
        }
      }
    }
  }

  return results;
}

// Simple English reference parser: "Gen 1:1", "John 3", "Romans 8:28"
function parseEnglishReference(q: string): { book: string; chapter: number; verse?: number } | null {
  const m = q.trim().match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+)(?::(\d+))?$/);
  if (!m) return null;
  const bookRaw = m[1].trim();
  const chapter = parseInt(m[2]);
  const verse = m[3] ? parseInt(m[3]) : undefined;
  const mapping = getBookMappingByEnglish(bookRaw);
  if (!mapping) return null;
  return { book: mapping.english, chapter, verse };
}

// ─── Translation mode localStorage ───────────────────────────────────────────

const LS_KEY = 'bibleTranslationMode';

export function getStoredTranslationMode(): TranslationMode {
  try {
    const val = localStorage.getItem(LS_KEY);
    if (val === 'korean' || val === 'web' || val === 'parallel') return val;
  } catch { /* ignore */ }
  return 'korean';
}

export function setStoredTranslationMode(mode: TranslationMode): void {
  try { localStorage.setItem(LS_KEY, mode); } catch { /* ignore */ }
}

// ─── Copy text builder ────────────────────────────────────────────────────────

export function buildCopyText(
  koreanBook: string,
  chapter: number,
  verse: number,
  mode: TranslationMode,
): string {
  const engBook = getEnglishBookName(koreanBook);
  const kr = getVerseKRV(koreanBook, chapter, verse);
  const web = getVerseWEB(koreanBook, chapter, verse);

  if (mode === 'korean' && kr) return `${koreanBook} ${chapter}:${verse} ${kr}`;
  if (mode === 'web' && web && engBook) return `${engBook} ${chapter}:${verse} ${web}`;
  if (mode === 'parallel') {
    const lines: string[] = [];
    if (kr) lines.push(`${koreanBook} ${chapter}:${verse} ${kr}`);
    if (web && engBook) lines.push(`${engBook} ${chapter}:${verse} ${web}`);
    return lines.join('\n');
  }
  return kr ? `${koreanBook} ${chapter}:${verse} ${kr}` : '';
}
