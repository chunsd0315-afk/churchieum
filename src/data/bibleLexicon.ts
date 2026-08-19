/**
 * 성경 단어 원어 사전 (Bible Word Lexicon)
 *
 * 데이터 설계 원칙:
 * - 절+단어위치(tokenIndex) 기반 매핑 — 동일 한글도 원문이 다를 수 있음
 * - 구약: 히브리어, 신약: 헬라어 자동 분기
 * - Strong's 번호로 원어 항목 참조
 * - 현재는 대표 샘플(창 1:1, 요 1:1)만 포함; 이후 외부 JSON lazy load 가능
 *
 * 라이선스 주의:
 * Strong's 번호 체계 자체는 공개 도메인.
 * 한글 뜻·음역 텍스트는 직접 작성 또는 공개 도메인 참고.
 * 저작권 있는 번역본/사전 텍스트는 포함하지 않음.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type OriginalLanguage = 'hebrew' | 'greek';

export type WordMorphology = {
  partOfSpeech?: string;   // 명사, 동사, …
  case?: string;           // 주격, 목적격, …
  number?: string;         // 단수, 복수
  gender?: string;         // 남성, 여성, 중성
  stem?: string;           // Qal, Piel, …(히브리어)
  tense?: string;          // 현재, 과거, …(헬라어)
  lemma?: string;          // 원형
};

/** Strong's 기준 원어 어휘 항목 */
export type LexiconEntry = {
  strongNumber: string;           // H1254 / G3056
  language: OriginalLanguage;
  originalText: string;           // בָּרָא / λόγος
  transliteration: string;        // bara / logos
  pronunciation: string;          // 바라 / 로고스
  englishGloss: string;           // create / word
  koreanGlosses: string[];        // ['창조하다', '만들다']
  briefDefinition: string;        // 1~2줄 간략 정의
  contextualNote?: string;        // 해당 절의 문맥 해설 (선택)
  morphology?: WordMorphology;
  /** 발음 오디오 URL — 없으면 undefined */
  audioUrl?: string;
};

/** 특정 절의 단어 토큰 */
export type VerseToken = {
  bookId: string;            // '창세기'
  chapter: number;
  verse: number;
  tokenIndex: number;        // 0-based 단어 순서
  koreanText: string;        // 한글 단어 표면형 (복합어 포함)
  strongNumber: string;      // H1254
};

// ─── Lexicon Entries ──────────────────────────────────────────────────────────
// Strong's 번호 → 원어 항목

export const LEXICON_ENTRIES: Record<string, LexiconEntry> = {

  // ── 구약 히브리어 ────────────────────────────────────────────────────────

  H7225: {
    strongNumber: 'H7225',
    language: 'hebrew',
    originalText: 'רֵאשִׁית',
    transliteration: 'reshith',
    pronunciation: '레쉬트',
    englishGloss: 'beginning · first',
    koreanGlosses: ['태초', '처음', '시작'],
    briefDefinition: '시작, 첫째, 처음; 특히 시간의 첫 지점을 가리킴.',
    contextualNote: '창세기 1:1의 "태초에"는 בְּרֵאשִׁית(b\'reshith)로, 시간의 절대적 시작점을 선언합니다.',
    morphology: { partOfSpeech: '명사', gender: '여성', number: '단수' },
  },

  H430: {
    strongNumber: 'H430',
    language: 'hebrew',
    originalText: 'אֱלֹהִים',
    transliteration: 'elohim',
    pronunciation: '엘로힘',
    englishGloss: 'God · gods',
    koreanGlosses: ['하나님', '신', '하느님'],
    briefDefinition: '하나님; 복수형이지만 유일신 야웨를 가리킬 때는 단수 동사와 함께 쓰임.',
    contextualNote: '형태는 복수지만 창 1:1에서 단수 동사(בָּרָא)와 함께 쓰여 삼위일체적 복수 또는 위엄의 복수로 해석됨.',
    morphology: { partOfSpeech: '명사', number: '복수(위엄의 복수)' },
  },

  H853: {
    strongNumber: 'H853',
    language: 'hebrew',
    originalText: 'אֵת',
    transliteration: 'eth',
    pronunciation: '에트',
    englishGloss: '(direct object marker)',
    koreanGlosses: ['목적어 표지(번역 불가)'],
    briefDefinition: '히브리어 직접목적어 표지어; 한글·영어로는 별도 번역 없음.',
    morphology: { partOfSpeech: '목적어 표지' },
  },

  H8064: {
    strongNumber: 'H8064',
    language: 'hebrew',
    originalText: 'שָׁמַיִם',
    transliteration: 'shamayim',
    pronunciation: '샤마임',
    englishGloss: 'heavens · sky',
    koreanGlosses: ['하늘', '천', '하늘들'],
    briefDefinition: '하늘, 하늘나라; 항상 복수형으로 쓰임.',
    morphology: { partOfSpeech: '명사', number: '복수', gender: '남성' },
  },

  H776: {
    strongNumber: 'H776',
    language: 'hebrew',
    originalText: 'אֶרֶץ',
    transliteration: 'erets',
    pronunciation: '에레츠',
    englishGloss: 'earth · land',
    koreanGlosses: ['땅', '지', '나라'],
    briefDefinition: '땅, 대지, 지구; 하늘(שָׁמַיִם)의 대응 개념으로 온 피조세계를 나타냄.',
    morphology: { partOfSpeech: '명사', gender: '여성', number: '단수' },
  },

  H1254: {
    strongNumber: 'H1254',
    language: 'hebrew',
    originalText: 'בָּרָא',
    transliteration: 'bara',
    pronunciation: '바라',
    englishGloss: 'create',
    koreanGlosses: ['창조하다', '만들다', '창조하시다'],
    briefDefinition: '창조하다; 성경에서 하나님만 주어로 사용되는 특별 동사. 무에서 유를 만드는 창조를 표현.',
    contextualNote: '창 1:1의 바라(בָּרָא)는 Qal 완료형. 오직 하나님(엘로힘)만이 이 동사의 주어가 됨.',
    morphology: { partOfSpeech: '동사', stem: 'Qal', tense: '완료', number: '단수', gender: '남성' },
  },

  // ── 신약 헬라어 ────────────────────────────────────────────────────────────

  G746: {
    strongNumber: 'G746',
    language: 'greek',
    originalText: 'ἀρχή',
    transliteration: 'archē',
    pronunciation: '아르케',
    englishGloss: 'beginning · origin',
    koreanGlosses: ['태초', '처음', '시작', '근원'],
    briefDefinition: '시작, 기원; 요한복음 1:1의 ἐν ἀρχῇ는 창세기 1:1의 히브리어 בְּרֵאשִׁית와 의도적으로 대응.',
    contextualNote: '요 1:1은 창 1:1의 "태초에"를 그대로 인용하여 로고스가 태초부터 계셨음을 강조.',
    morphology: { partOfSpeech: '명사', case: '여격', number: '단수', gender: '여성' },
  },

  G3056: {
    strongNumber: 'G3056',
    language: 'greek',
    originalText: 'λόγος',
    transliteration: 'logos',
    pronunciation: '로고스',
    englishGloss: 'word · message · reason',
    koreanGlosses: ['말씀', '말', '메시지', '이성', '표현'],
    briefDefinition: '말, 말씀, 메시지, 이성 또는 표현; 헬라 철학에서는 우주적 이성(理性)을 의미하기도 함.',
    contextualNote: '요한복음 1:1에서 로고스(λόγος)는 예수 그리스도를 가리키는 칭호로 사용됨. 헬라 독자에게 익숙한 철학 용어를 차용해 그리스도의 신성과 창조를 선언.',
    morphology: { partOfSpeech: '명사', case: '주격', number: '단수', gender: '남성', lemma: 'λόγος' },
  },

  G2316: {
    strongNumber: 'G2316',
    language: 'greek',
    originalText: 'θεός',
    transliteration: 'theos',
    pronunciation: '테오스',
    englishGloss: 'God · god',
    koreanGlosses: ['하나님', '신'],
    briefDefinition: '하나님, 신; 신약에서 압도적으로 야웨 하나님을 지칭.',
    contextualNote: '요 1:1c "말씀은 곧 하나님이시니라"의 θεός는 관사 없이 사용되어 술어 명사로서 로고스의 본성(신성)을 강조.',
    morphology: { partOfSpeech: '명사', case: '주격', number: '단수', gender: '남성' },
  },

  G1510: {
    strongNumber: 'G1510',
    language: 'greek',
    originalText: 'ἦν',
    transliteration: 'ēn',
    pronunciation: '엔',
    englishGloss: 'was · existed',
    koreanGlosses: ['계시니라', '있었다', '이었다'],
    briefDefinition: 'εἰμί(이다/있다)의 미완료 과거형; 태초부터 계속 존재했음을 나타내는 지속적 과거.',
    contextualNote: '요 1:1에서 3번 반복되는 ἦν은 영원한 선재(先在)를 표현. 창조된 것을 가리키는 ἐγένετο(1:14)와 대비됨.',
    morphology: { partOfSpeech: '동사', tense: '미완료(지속적 존재)', number: '단수', gender: '중성' },
  },
};

// ─── Verse Token Map ──────────────────────────────────────────────────────────
// 특정 절의 단어 → Strong's 번호 매핑
// key: `${bookId}:${chapter}:${verse}` → VerseToken[]

export type VerseTokenKey = `${string}:${number}:${number}`;

export const VERSE_TOKEN_MAP: Record<string, VerseToken[]> = {
  // ── 창세기 1:1 ──────────────────────────────────────────────────────────
  '창세기:1:1': [
    { bookId: '창세기', chapter: 1, verse: 1, tokenIndex: 0, koreanText: '태초에',       strongNumber: 'H7225' },
    { bookId: '창세기', chapter: 1, verse: 1, tokenIndex: 1, koreanText: '하나님이',     strongNumber: 'H430'  },
    { bookId: '창세기', chapter: 1, verse: 1, tokenIndex: 2, koreanText: '천지를',       strongNumber: 'H8064' },
    { bookId: '창세기', chapter: 1, verse: 1, tokenIndex: 3, koreanText: '창조하시니라', strongNumber: 'H1254' },
  ],

  // ── 창세기 1:2 ──────────────────────────────────────────────────────────
  '창세기:1:2': [
    { bookId: '창세기', chapter: 1, verse: 2, tokenIndex: 0, koreanText: '땅이',   strongNumber: 'H776'  },
  ],

  // ── 창세기 1:27 ─────────────────────────────────────────────────────────
  '창세기:1:27': [
    { bookId: '창세기', chapter: 1, verse: 27, tokenIndex: 0, koreanText: '하나님이',   strongNumber: 'H430'  },
    { bookId: '창세기', chapter: 1, verse: 27, tokenIndex: 1, koreanText: '창조하시되', strongNumber: 'H1254' },
  ],

  // ── 요한복음 1:1 ────────────────────────────────────────────────────────
  '요한복음:1:1': [
    { bookId: '요한복음', chapter: 1, verse: 1, tokenIndex: 0, koreanText: '태초에', strongNumber: 'G746'  },
    { bookId: '요한복음', chapter: 1, verse: 1, tokenIndex: 1, koreanText: '말씀이', strongNumber: 'G3056' },
    { bookId: '요한복음', chapter: 1, verse: 1, tokenIndex: 2, koreanText: '계시니라', strongNumber: 'G1510' },
    { bookId: '요한복음', chapter: 1, verse: 1, tokenIndex: 3, koreanText: '하나님',  strongNumber: 'G2316' },
  ],

  // ── 요한복음 3:16 ───────────────────────────────────────────────────────
  '요한복음:3:16': [
    { bookId: '요한복음', chapter: 3, verse: 16, tokenIndex: 0, koreanText: '하나님이', strongNumber: 'G2316' },
    { bookId: '요한복음', chapter: 3, verse: 16, tokenIndex: 1, koreanText: '말씀을',   strongNumber: 'G3056' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 절 토큰 목록 조회 */
export function getVerseTokens(bookId: string, chapter: number, verse: number): VerseToken[] {
  return VERSE_TOKEN_MAP[`${bookId}:${chapter}:${verse}`] ?? [];
}

/** 한 절에서 주어진 한글 표면형과 가장 잘 맞는 토큰 찾기 */
export function findToken(
  bookId: string,
  chapter: number,
  verse: number,
  koreanSurface: string,
): VerseToken | null {
  const tokens = getVerseTokens(bookId, chapter, verse);
  if (tokens.length === 0) return null;

  // 완전 일치 우선
  const exact = tokens.find(t => t.koreanText === koreanSurface);
  if (exact) return exact;

  // 포함 일치 (짧은 단어가 긴 토큰의 일부인 경우)
  const partial = tokens.find(t =>
    t.koreanText.includes(koreanSurface) || koreanSurface.includes(t.koreanText),
  );
  return partial ?? null;
}

/** Strong's 번호로 어휘 항목 조회 */
export function getLexiconEntry(strongNumber: string): LexiconEntry | null {
  return LEXICON_ENTRIES[strongNumber] ?? null;
}

/** 한 절의 본문을 클릭 가능한 토큰으로 분리 */
export type TextToken = {
  text: string;
  token: VerseToken | null;
};

export function tokenizeVerseText(
  bookId: string,
  chapter: number,
  verse: number,
  verseText: string,
): TextToken[] {
  const tokens = getVerseTokens(bookId, chapter, verse);
  if (tokens.length === 0) {
    // 토큰 데이터 없으면 공백 단위로 분리 (단어 선택은 가능, 원어는 없음)
    return verseText.split(/(\s+)/).map(seg => ({ text: seg, token: null }));
  }

  const result: TextToken[] = [];
  let remaining = verseText;
  let consumed = 0;

  for (const token of tokens) {
    const idx = remaining.indexOf(token.koreanText);
    if (idx < 0) continue;

    // token 이전 텍스트 (일반 세그먼트)
    if (idx > 0) {
      const before = remaining.slice(0, idx);
      // 공백 단위로 분리
      before.split(/(\s+)/).forEach(seg => {
        if (seg) result.push({ text: seg, token: null });
      });
    }

    result.push({ text: token.koreanText, token });
    remaining = remaining.slice(idx + token.koreanText.length);
    consumed += idx + token.koreanText.length;
  }

  // 나머지 텍스트
  if (remaining) {
    remaining.split(/(\s+)/).forEach(seg => {
      if (seg) result.push({ text: seg, token: null });
    });
  }

  return result;
}
