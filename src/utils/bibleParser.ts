/**
 * parseBibleReference — 성경 구절 참조 파싱
 *
 * 지원 형식:
 *   창세기 1장 1절   → { book: "창세기", chapter: 1, verse: 1 }
 *   창세기 1:1       → { book: "창세기", chapter: 1, verse: 1 }
 *   창 1:1           → abbreviation 처리
 *   시편 23편 1절    → { book: "시편",   chapter: 23, verse: 1 }
 *   요 3:16          → { book: "요한복음", chapter: 3, verse: 16 }
 *   창세기 1장       → { book: "창세기", chapter: 1 }
 */

import { BOOK_LIST } from '../lib/bibleVersesKR';

export type BibleRef = {
  book: string;
  chapter: number;
  verse?: number;
};

// Abbreviation map: abbr/name → canonical name
const BOOK_MAP: Record<string, string> = {};
for (const b of BOOK_LIST) {
  BOOK_MAP[b.name] = b.name;
  BOOK_MAP[b.abbr] = b.name;
}

// Additional common abbreviations not covered by abbr field
const EXTRA: Record<string, string> = {
  '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기',
  '신': '신명기', '수': '여호수아', '삿': '사사기', '룻': '룻기',
  '삼상': '사무엘상', '삼하': '사무엘하', '왕상': '열왕기상', '왕하': '열왕기하',
  '대상': '역대상', '대하': '역대하', '스': '에스라', '느': '느헤미야',
  '에': '에스더', '욥': '욥기', '시': '시편', '잠': '잠언',
  '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
  '애': '예레미야 애가', '겔': '에스겔', '단': '다니엘', '호': '호세아',
  '욜': '요엘', '암': '아모스', '옵': '오바댜', '욘': '요나',
  '미': '미가', '나': '나훔', '합': '하박국', '습': '스바냐',
  '학': '학개', '슥': '스가랴', '말': '말라기',
  '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음',
  '행': '사도행전', '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서',
  '갈': '갈라디아서', '엡': '에베소서', '빌': '빌립보서', '골': '골로새서',
  '살전': '데살로니가전서', '살후': '데살로니가후서',
  '딤전': '디모데전서', '딤후': '디모데후서', '딛': '디도서', '몬': '빌레몬서',
  '히': '히브리서', '약': '야고보서', '벧전': '베드로전서', '벧후': '베드로후서',
  '요일': '요한일서', '요이': '요한이서', '요삼': '요한삼서',
  '유': '유다서', '계': '요한계시록',
};

function resolveBook(raw: string): string | null {
  const t = raw.trim();
  if (BOOK_MAP[t]) return BOOK_MAP[t];
  if (EXTRA[t]) return EXTRA[t];
  // Partial prefix match (e.g. "창세" → "창세기")
  const found = BOOK_LIST.find(b => b.name.startsWith(t));
  return found?.name ?? null;
}

export function parseBibleReference(input: string): BibleRef | null {
  const s = input.trim().replace(/\s+/g, ' ');
  if (!s) return null;

  // "창세기 1장 1절" / "시편 23편 1절"
  const p1 = s.match(/^(.+?)\s+(\d+)[장편]\s*(\d+)\s*절?$/);
  if (p1) {
    const book = resolveBook(p1[1]);
    if (book) return { book, chapter: +p1[2], verse: +p1[3] };
  }

  // "창세기 1:1" / "창 1:1" / "요 3:16"
  const p2 = s.match(/^(.+?)\s+(\d+)\s*[:：]\s*(\d+)$/);
  if (p2) {
    const book = resolveBook(p2[1]);
    if (book) return { book, chapter: +p2[2], verse: +p2[3] };
  }

  // "창세기 1장" / "시편 23편"
  const p3 = s.match(/^(.+?)\s+(\d+)\s*[장편]$/);
  if (p3) {
    const book = resolveBook(p3[1]);
    if (book) return { book, chapter: +p3[2] };
  }

  // "창세기 1" (book + chapter number, no 장)
  const p4 = s.match(/^(.+?)\s+(\d+)$/);
  if (p4) {
    const book = resolveBook(p4[1]);
    if (book) return { book, chapter: +p4[2] };
  }

  // Book name only
  const book = resolveBook(s);
  if (book) return { book, chapter: 1 };

  return null;
}
