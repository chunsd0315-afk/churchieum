/**
 * 개역한글 성경 데이터 (공개 도메인, 1961년판)
 * 향후 교체: DATA_SOURCE를 변경하거나 getVerse/getChapter 구현체를 교체하세요.
 *   - Firebase: import { getVerseFromFirebase } from './bibleFirebaseAdapter'
 *   - 외부 JSON:  import bibleJson from '/public/bible-kr.json'
 *   - 성경 API:   fetch(`https://your-api.com/bible/${book}/${chapter}/${verse}`)
 */

import { BIBLE_KR, BOOK_LIST } from '../services/bibleVersesKR';
import { loadBibleData, hasChapter as providerHasChapter, getChapter as providerGetChapter } from '../services/bibleProvider';

export type { BibleVerseMap } from '../services/bibleVersesKR';
export { BOOK_LIST } from '../services/bibleVersesKR';

// Kick off JSON load immediately; components call hasChapterData after loading
loadBibleData();

export type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  testament: 'old' | 'new';
  keywords: string[];
};

export type SavedVerse = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  memo: string;
  tags: string[];
  savedAt: string;
};

// ─── Keyword extraction ───────────────────────────────────────────────────────
const THEME_KEYWORDS: Record<string, string[]> = {
  사랑:  ['사랑', '사랑하', '사랑이'],
  믿음:  ['믿음', '믿으', '믿는', '믿어'],
  소망:  ['소망', '바라', '희망'],
  은혜:  ['은혜', '은총'],
  평안:  ['평안', '평화', '평강'],
  기쁨:  ['기쁨', '기뻐', '즐거'],
  감사:  ['감사'],
  구원:  ['구원', '구속', '구하'],
  복음:  ['복음'],
  기도:  ['기도', '간구', '구하라'],
  성령:  ['성령', '신은', '신이'],
  말씀:  ['말씀', '율법'],
  찬양:  ['찬양', '찬송', '할렐루야'],
  복:    ['복이', '복을', '복 있'],
};

function extractKeywords(text: string): string[] {
  const found: string[] = [];
  for (const [theme, words] of Object.entries(THEME_KEYWORDS)) {
    if (words.some(w => text.includes(w))) found.push(theme);
  }
  return found;
}

// ─── Build flat verse array from BIBLE_KR ────────────────────────────────────
function buildVerseArray(): BibleVerse[] {
  const result: BibleVerse[] = [];
  for (const [bookName, chapters] of Object.entries(BIBLE_KR)) {
    const bookInfo = BOOK_LIST.find(b => b.name === bookName);
    const testament = bookInfo?.testament ?? 'old';
    for (const [chStr, verses] of Object.entries(chapters)) {
      const chapter = Number(chStr);
      for (const [vStr, text] of Object.entries(verses)) {
        const verse = Number(vStr);
        result.push({
          book: bookName,
          chapter,
          verse,
          text,
          testament,
          keywords: extractKeywords(text),
        });
      }
    }
  }
  return result;
}

export const ALL_VERSES: BibleVerse[] = buildVerseArray();

// ─── Accessor functions ───────────────────────────────────────────────────────

/** 단일 구절 조회 */
export function getVerse(book: string, chapter: number, verse: number): BibleVerse | null {
  return ALL_VERSES.find(v => v.book === book && v.chapter === chapter && v.verse === verse) ?? null;
}

/** 특정 장의 모든 구절 조회 */
export function getChapter(book: string, chapter: number): BibleVerse[] {
  const entries = providerGetChapter(book, chapter);
  if (entries.length > 0) {
    const bookInfo = BOOK_LIST.find(b => b.name === book);
    const testament = bookInfo?.testament ?? 'old';
    return entries.map(({ verse, text }) => ({
      book, chapter, verse, text, testament, keywords: extractKeywords(text),
    }));
  }
  // Fallback to inline BIBLE_KR
  const raw = BIBLE_KR[book]?.[chapter];
  if (!raw) return [];
  const bookInfo = BOOK_LIST.find(b => b.name === book);
  const testament = bookInfo?.testament ?? 'old';
  return Object.entries(raw)
    .map(([vStr, text]) => ({
      book, chapter, verse: Number(vStr), text, testament, keywords: extractKeywords(text),
    }))
    .sort((a, b) => a.verse - b.verse);
}

/** 데이터가 있는 장인지 확인 */
export function hasChapterData(book: string, chapter: number): boolean {
  return providerHasChapter(book, chapter) || !!BIBLE_KR[book]?.[chapter];
}

/**
 * 성경 검색
 * - "창 1:1" / "창세기 1:1" 형식
 * - "사랑", "믿음" 등 키워드
 * - "요한복음", "시편" 등 책 이름
 */
export function searchBible(query: string, limit = 30): BibleVerse[] {
  const q = query.trim();
  if (!q) return [];

  // 구절 직접 참조 패턴: "창 1:1", "창세기 1장 1절", "요 3:16"
  const refPattern = /^([가-힣]+)\s*(\d+)[장:]\s*(\d+)/;
  const refMatch = q.match(refPattern);
  if (refMatch) {
    const bookQuery = refMatch[1];
    const ch = Number(refMatch[2]);
    const vs = Number(refMatch[3]);
    const bookInfo = BOOK_LIST.find(b => b.name === bookQuery || b.abbr === bookQuery);
    if (bookInfo) {
      const v = getVerse(bookInfo.name, ch, vs);
      return v ? [v] : [];
    }
  }

  // 책 이름 + 장만: "창세기 1장"
  const chapterPattern = /^([가-힣]+)\s*(\d+)[장]?$/;
  const chMatch = q.match(chapterPattern);
  if (chMatch) {
    const bookInfo = BOOK_LIST.find(b => b.name === chMatch[1] || b.abbr === chMatch[1]);
    if (bookInfo) {
      const ch = Number(chMatch[2]);
      const result = getChapter(bookInfo.name, ch);
      if (result.length > 0) return result.slice(0, limit);
    }
  }

  // 책 이름만: "요한복음"
  const exactBook = BOOK_LIST.find(b => b.name === q || b.abbr === q);
  if (exactBook) {
    return ALL_VERSES.filter(v => v.book === exactBook.name).slice(0, limit);
  }

  // 키워드 검색 (본문 포함)
  return ALL_VERSES.filter(v =>
    v.text.includes(q) ||
    v.keywords.includes(q) ||
    v.book.includes(q)
  ).slice(0, limit);
}

// ─── localStorage 저장/불러오기 ────────────────────────────────────────────────
const LS_KEY = 'savedVerses_v1';

export function getSavedVerses(): SavedVerse[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVerse(verse: BibleVerse, memo = '', tags: string[] = []): SavedVerse {
  const saved = getSavedVerses();
  // 중복 방지
  const exists = saved.find(s => s.book === verse.book && s.chapter === verse.chapter && s.verse === verse.verse);
  if (exists) {
    // update memo/tags
    const updated = saved.map(s =>
      s.id === exists.id ? { ...s, memo, tags } : s
    );
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    return exists;
  }
  const entry: SavedVerse = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text,
    memo,
    tags: tags.length ? tags : verse.keywords.slice(0, 3),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(LS_KEY, JSON.stringify([entry, ...saved]));
  return entry;
}

export function deleteSavedVerse(id: string): void {
  const saved = getSavedVerses().filter(s => s.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(saved));
}

export function updateSavedVerseMemo(id: string, memo: string): void {
  const saved = getSavedVerses().map(s => s.id === id ? { ...s, memo } : s);
  localStorage.setItem(LS_KEY, JSON.stringify(saved));
}

export function isVerseSaved(book: string, chapter: number, verse: number): boolean {
  return getSavedVerses().some(s => s.book === book && s.chapter === chapter && s.verse === verse);
}

/** 클립보드 복사 */
export function copyVerse(verse: { book: string; chapter: number; verse: number; text: string }): Promise<void> {
  const text = `${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}`;
  return navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

// ─── 분석 ──────────────────────────────────────────────────────────────────────

export type VerseAnalytics = {
  totalSaved: number;
  topTags: { tag: string; count: number }[];
  topBooks: { book: string; count: number }[];
};

export function analyzeSavedVerses(): VerseAnalytics {
  const saved = getSavedVerses();
  const tagCount: Record<string, number> = {};
  const bookCount: Record<string, number> = {};
  for (const v of saved) {
    bookCount[v.book] = (bookCount[v.book] || 0) + 1;
    for (const tag of v.tags) tagCount[tag] = (tagCount[tag] || 0) + 1;
  }
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => ({ tag, count }));
  const topBooks = Object.entries(bookCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([book, count]) => ({ book, count }));
  return { totalSaved: saved.length, topTags, topBooks };
}

/** 여러 절 일괄 저장 */
export function saveSelectedVerses(verses: BibleVerse[], memo = ''): SavedVerse[] {
  return verses.map(v => saveVerse(v, memo));
}

/** 클립보드 복사 (여러 절) */
export function copyVerses(verses: { book: string; chapter: number; verse: number; text: string }[]): Promise<void> {
  const text = verses
    .map(v => `${v.book} ${v.chapter}:${v.verse}  ${v.text}`)
    .join('\n');
  return navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

