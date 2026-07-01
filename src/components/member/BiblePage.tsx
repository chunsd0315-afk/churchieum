import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, BookOpen, Bookmark, BookmarkCheck, Copy, Check,
  ChevronRight, ChevronLeft, X, MessageSquare, Trash2,
  CheckSquare, Square, ListChecks, CornerDownRight, Clock, Hash,
  Heart,
} from 'lucide-react';
import { BOOK_LIST } from '../../lib/bibleVersesKR';
import {
  type BibleVerse, type SavedVerse,
  searchBible, getChapter, hasChapterData,
  saveVerse, saveSelectedVerses, deleteSavedVerse,
  getSavedVerses, isVerseSaved, updateSavedVerseMemo,
  copyVerse, copyVerses, analyzeSavedVerses,
} from '../../data/bibleData';
import { getAllProgresses, READING_PLANS, getProgressPercent } from '../../data/readingPlans';
import { createGraceNote } from '../../data/graceNotes';
import { parseBibleReference, type BibleRef } from '../../utils/bibleParser';
import type { Page } from './Layout';
import {
  type TranslationMode,
  loadWebBible, getChapterWEB, getParallelChapter,
  getStoredTranslationMode, setStoredTranslationMode,
  searchBibleTranslation, getEnglishBookName,
} from '../../lib/bibleTranslation';
import TranslationSelector from './TranslationSelector';
import { PageHeaderBar } from '../ui';

type Props = { onNavigate?: (page: Page) => void; initialRef?: BibleRef | null };
type Tab = 'browse' | 'search' | 'saved';

const OT_BOOKS = BOOK_LIST.filter(b => b.testament === 'old');
const NT_BOOKS = BOOK_LIST.filter(b => b.testament === 'new');

// ─── Recent Reading History ───────────────────────────────────────────────────

const LS_RECENT_KEY = 'recentReadings_v1';
type RecentEntry = { book: string; chapter: number; abbr: string; readAt: string };

function getRecentReadings(): RecentEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_RECENT_KEY) ?? '[]'); } catch { return []; }
}

function pushRecentReading(book: string, chapter: number): void {
  try {
    const bookInfo = BOOK_LIST.find(b => b.name === book);
    const abbr = bookInfo?.abbr ?? book;
    const prev = getRecentReadings().filter(r => !(r.book === book && r.chapter === chapter));
    localStorage.setItem(LS_RECENT_KEY, JSON.stringify([{ book, chapter, abbr, readAt: new Date().toISOString() }, ...prev].slice(0, 10)));
  } catch { /* ignore */ }
}

// ─── Add to Grace Note Modal ──────────────────────────────────────────────────

function AddToGraceModal({ verse, verses, onClose }: {
  verse?: BibleVerse;
  verses?: BibleVerse[];
  onClose: () => void;
}) {
  const progresses = getAllProgresses().filter(p => p.status === 'active' || p.status === 'paused');
  const [selectedProgressId, setSelectedProgressId] = useState(progresses[0]?.id ?? '');
  const [graceContent, setGraceContent] = useState('');
  const [saved, setSaved] = useState(false);

  const verseRef = verse
    ? `${verse.book} ${verse.chapter}:${verse.verse} — ${verse.text}`
    : verses?.map(v => `${v.book} ${v.chapter}:${v.verse} — ${v.text}`).join('\n') ?? '';

  const handleSave = () => {
    if (!selectedProgressId || !graceContent.trim()) return;
    const progress = progresses.find(p => p.id === selectedProgressId);
    if (!progress) return;
    const plan = READING_PLANS.find(p => p.id === progress.planId);
    createGraceNote({
      type: 'reading',
      sourceId: selectedProgressId,
      sourceTitle: progress.planName,
      planId: progress.planId,
      planName: progress.planName,
      planColor: plan?.color ?? 'from-primary-500 to-primary-700',
      day: progress.currentDay,
      bibleReference: verse ? `${verse.book} ${verse.chapter}장` : `${verses?.[0]?.book ?? ''} ${verses?.[0]?.chapter ?? ''}장`,
      graceContent,
      memorableVerse: verseRef,
      application: '',
      prayer: '',
    });
    setSaved(true);
    setTimeout(onClose, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-4 text-white flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold">은혜 기록에 추가</h2>
            <p className="text-white/70 text-xs mt-0.5">말씀과 함께 받은 은혜를 기록하세요</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Verse reference */}
          <div className="bg-primary-50 rounded-2xl p-3 border-l-4 border-primary-400">
            <p className="text-xs text-primary-700 font-medium leading-relaxed whitespace-pre-wrap line-clamp-4">{verseRef}</p>
          </div>

          {/* Plan select */}
          {progresses.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">참여 중인 통독 플랜이 없습니다.</p>
              <p className="text-xs text-gray-400 mt-1">성경통독센터에서 플랜에 참여하세요.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">통독 플랜 선택</label>
                <div className="space-y-1.5">
                  {progresses.map(p => {
                    const plan = READING_PLANS.find(r => r.id === p.planId);
                    return (
                      <button key={p.id} onClick={() => setSelectedProgressId(p.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedProgressId === p.id ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${plan?.color ?? 'from-gray-400 to-gray-500'} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.planName}</p>
                          <p className="text-xs text-gray-500">{p.currentDay}일차 · {getProgressPercent(p)}%</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedProgressId === p.id ? 'border-rose-500 bg-rose-500' : 'border-gray-300'}`}>
                          {selectedProgressId === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  오늘 받은 은혜 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={graceContent}
                  onChange={e => setGraceContent(e.target.value)}
                  placeholder="이 말씀을 통해 받은 은혜나 깨달음을 적어보세요."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>
              <button onClick={handleSave} disabled={!graceContent.trim() || !selectedProgressId || saved}
                className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${
                  saved ? 'bg-green-500 text-white' : graceContent.trim() ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                {saved ? '저장됨 ✓' : '은혜 기록 저장'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Breadcrumb (inside BrowseTab) ────────────────────────────────────────────

function Breadcrumb({ testament, book, chapter, onGoRoot, onGoTestament, onGoBook }: {
  testament: 'old' | 'new' | null;
  book: string | null;
  chapter: number | null;
  onGoRoot: () => void;
  onGoTestament: () => void;
  onGoBook: () => void;
}) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-1 text-xs overflow-x-auto whitespace-nowrap">
      <button onClick={onGoRoot} className="text-primary-600 font-medium hover:underline shrink-0">성경</button>
      {testament && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <button onClick={onGoTestament} className={`font-medium hover:underline shrink-0 ${book ? 'text-primary-600' : 'text-gray-700'}`}>
            {testament === 'old' ? '구약' : '신약'}
          </button>
        </>
      )}
      {book && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <button onClick={onGoBook} className={`font-medium hover:underline shrink-0 ${chapter ? 'text-primary-600' : 'text-gray-700'}`}>{book}</button>
        </>
      )}
      {chapter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <span className="text-gray-700 font-medium shrink-0">{chapter}장</span>
        </>
      )}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */

export default function BiblePage({ onNavigate, initialRef }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [testament, setTestament] = useState<'old' | 'new' | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [quickRef, setQuickRef] = useState('');
  const [quickRefError, setQuickRefError] = useState('');
  const [translationMode, setTranslationMode] = useState<TranslationMode>(getStoredTranslationMode);

  // Load WEB data once
  useEffect(() => { loadWebBible(); }, []);

  const handleTranslationChange = (mode: TranslationMode) => {
    setTranslationMode(mode);
    setStoredTranslationMode(mode);
  };

  const navigateToRef = useCallback((ref: BibleRef) => {
    const bookInfo = BOOK_LIST.find(b => b.name === ref.book);
    if (!bookInfo) return;
    setTestament(bookInfo.testament);
    setSelectedBook(ref.book);
    setSelectedChapter(ref.chapter);
    setHighlightVerse(ref.verse ?? null);
    setTab('browse');
    pushRecentReading(ref.book, ref.chapter);
  }, []);

  // Navigate to initialRef on mount
  useEffect(() => {
    if (initialRef) navigateToRef(initialRef);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickRef = () => {
    const parsed = parseBibleReference(quickRef);
    if (!parsed) {
      setQuickRefError('구절을 찾을 수 없습니다. 예: 창 1:1 / 요 3:16');
      setTimeout(() => setQuickRefError(''), 3000);
      return;
    }
    setQuickRefError('');
    setQuickRef('');
    navigateToRef(parsed);
  };

  const handleChapterSelect = (ch: number) => {
    setSelectedChapter(ch);
    setHighlightVerse(null);
    if (selectedBook) pushRecentReading(selectedBook, ch);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Page header */}
      <PageHeaderBar
        title="성경"
        description="하나님의 말씀을 읽고 묵상하세요."
      />
      {/* Quick-reference bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 sticky top-0 z-20">
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <CornerDownRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              value={quickRef}
              onChange={e => { setQuickRef(e.target.value); setQuickRefError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleQuickRef()}
              placeholder={translationMode === 'web' ? 'Gen 1:1 · John 3:16 · Ps 23' : '창 1:1 · 요 3:16 · 시편 23편'}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${
                quickRefError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-200'
              }`}
            />
          </div>
          <button onClick={handleQuickRef}
            className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors shrink-0">
            이동
          </button>
        </div>
        <TranslationSelector mode={translationMode} onChange={handleTranslationChange} />
        {quickRefError && <p className="text-xs text-red-500 mt-1 pl-1">{quickRefError}</p>}
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 flex shrink-0 sticky top-[52px] z-10">
        {([
          { id: 'browse', label: '말씀 읽기' },
          { id: 'search', label: '말씀 검색' },
          { id: 'saved',  label: '저장한 말씀' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === t.id ? 'text-primary-600 border-primary-500' : 'text-gray-500 border-transparent'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 flex-1">
        {tab === 'browse' && (
          <BrowseTab
            testament={testament}
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            highlightVerse={highlightVerse}
            translationMode={translationMode}
            onTestamentChange={t => { setTestament(t); setSelectedBook(null); setSelectedChapter(null); }}
            onBookChange={b => { setSelectedBook(b); setSelectedChapter(null); }}
            onChapterChange={handleChapterSelect}
            onGoRoot={() => { setTestament(null); setSelectedBook(null); setSelectedChapter(null); }}
            onGoTestament={() => { setSelectedBook(null); setSelectedChapter(null); }}
            onGoBook={() => { setSelectedChapter(null); }}
            onNavigatePage={onNavigate}
            onNavigateToRef={navigateToRef}
          />
        )}
        {tab === 'search' && <SearchTab onNavigate={onNavigate} onJumpTo={navigateToRef} setTab={setTab} translationMode={translationMode} />}
        {tab === 'saved'  && <SavedTab  onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

/* ─── Browse Tab ─────────────────────────────────────────────────────────────── */

type BrowseProps = {
  testament: 'old' | 'new' | null;
  selectedBook: string | null;
  selectedChapter: number | null;
  highlightVerse: number | null;
  translationMode: TranslationMode;
  onTestamentChange: (t: 'old' | 'new') => void;
  onBookChange: (b: string) => void;
  onChapterChange: (ch: number) => void;
  onGoRoot: () => void;
  onGoTestament: () => void;
  onGoBook: () => void;
  onNavigatePage?: (page: Page) => void;
  onNavigateToRef?: (ref: BibleRef) => void;
};

function BrowseTab(props: BrowseProps) {
  const { testament, selectedBook, selectedChapter, highlightVerse,
    onTestamentChange, onBookChange, onChapterChange,
    onGoRoot, onGoTestament, onGoBook,
    onNavigatePage, onNavigateToRef, translationMode } = props;
  const bookInfo = BOOK_LIST.find(b => b.name === selectedBook);

  const breadcrumb = testament && (
    <Breadcrumb
      testament={testament}
      book={selectedBook}
      chapter={selectedChapter}
      onGoRoot={onGoRoot}
      onGoTestament={onGoTestament}
      onGoBook={onGoBook}
    />
  );

  // Testament select
  if (!testament) {
    return <TestamentSelect onSelect={onTestamentChange} onNavigateToRef={onNavigateToRef} />;
  }

  // Book select — canonical order, no category groupings
  if (!selectedBook) {
    const books = testament === 'old' ? OT_BOOKS : NT_BOOKS;
    return (
      <div>
        {breadcrumb}
        <div className="p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            {testament === 'old' ? '구약성경 39권' : '신약성경 27권'}
          </p>
          {/* 3 cols mobile, 4 cols sm, 6 cols lg, 8 cols xl */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {books.map(b => (
              <button key={b.name} onClick={() => onBookChange(b.name)}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border-2 text-center transition-all ${
                  hasChapterData(b.name, 1)
                    ? 'bg-white border-gray-100 hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm active:scale-95'
                    : 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                }`}>
                <p className="font-bold text-gray-900 text-xs leading-tight mb-0.5">{b.name}</p>
                <p className="text-[10px] text-gray-400">({b.abbr})</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chapter select
  if (!selectedChapter) {
    const chapters = Array.from({ length: bookInfo?.chapters ?? 1 }, (_, i) => i + 1);
    return (
      <div>
        {breadcrumb}
        <div className="p-4">
          <p className="text-sm font-bold text-gray-900 mb-4 mt-1">
            {selectedBook} <span className="text-gray-400 font-normal">· {bookInfo?.chapters}장</span>
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2">
            {chapters.map(ch => (
              <button key={ch} onClick={() => onChapterChange(ch)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                  hasChapterData(selectedBook, ch)
                    ? 'bg-white border border-gray-200 text-gray-800 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 active:scale-95'
                    : 'bg-gray-50 border border-gray-100 text-gray-300'
                }`}>
                {ch}장
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {breadcrumb}
      <ChapterView
        book={selectedBook}
        chapter={selectedChapter}
        totalChapters={bookInfo?.chapters ?? 1}
        highlightVerse={highlightVerse}
        translationMode={translationMode}
        onChapterChange={onChapterChange}
        onNavigatePage={onNavigatePage}
      />
    </>
  );
}

/* ─── Testament Select ───────────────────────────────────────────────────────── */

function TestamentSelect({ onSelect, onNavigateToRef }: {
  onSelect: (t: 'old' | 'new') => void;
  onNavigateToRef?: (ref: BibleRef) => void;
}) {
  const recent = getRecentReadings();
  return (
    <div className="p-4 space-y-4 pt-5">
      <div className="grid grid-cols-2 gap-3">
        {(['old', 'new'] as const).map(t => (
          <button key={t} onClick={() => onSelect(t)}
            className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-all group active:scale-95">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${t === 'old' ? 'bg-amber-50' : 'bg-blue-50'}`}>
              <BookOpen className={`w-7 h-7 ${t === 'old' ? 'text-amber-500' : 'text-blue-500'}`} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{t === 'old' ? '구약성경' : '신약성경'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t === 'old' ? '39권' : '27권'}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
        <p className="text-xs text-primary-700 font-semibold mb-1">바로가기 사용법</p>
        <p className="text-xs text-primary-600">위 입력창에 <strong>창 1:1</strong>, <strong>요 3:16</strong>, <strong>시편 23편</strong>을 입력하고 이동을 누르세요.</p>
      </div>
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">최근 본 말씀</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map(r => (
              <button key={`${r.book}-${r.chapter}`}
                onClick={() => onNavigateToRef?.({ book: r.book, chapter: r.chapter })}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors">
                {r.abbr} {r.chapter}장
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Chapter View ───────────────────────────────────────────────────────────── */

type ChapterViewProps = {
  book: string;
  chapter: number;
  totalChapters: number;
  highlightVerse: number | null;
  translationMode: TranslationMode;
  onChapterChange: (ch: number) => void;
  onNavigatePage?: (page: Page) => void;
};

function ChapterView({ book, chapter, totalChapters, highlightVerse, translationMode, onChapterChange, onNavigatePage }: ChapterViewProps) {
  const krvVerses = getChapter(book, chapter);
  const webVerses = getChapterWEB(book, chapter);
  const parallelVerses = getParallelChapter(book, chapter);

  // Choose what to display based on mode
  const displayKRV = translationMode === 'korean' || translationMode === 'parallel';
  const displayWEB = translationMode === 'web' || translationMode === 'parallel';
  const isParallel = translationMode === 'parallel';

  // For select mode we always work with KRV verse objects
  const verses = krvVerses;
  const hasData = translationMode === 'web' ? webVerses.length > 0
    : translationMode === 'parallel' ? (krvVerses.length > 0 || webVerses.length > 0)
    : krvVerses.length > 0;

  const engBook = getEnglishBookName(book);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [savedToast, setSavedToast] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [verseInput, setVerseInput] = useState('');
  const [batchGraceModal, setBatchGraceModal] = useState(false);

  useEffect(() => {
    if (highlightVerse && verseRefs.current[highlightVerse]) {
      setTimeout(() => {
        verseRefs.current[highlightVerse]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [highlightVerse, book, chapter]);

  useEffect(() => { setSelected(new Set()); setSelectMode(false); setVerseInput(''); }, [book, chapter]);

  const scrollToVerse = (n: number) => {
    verseRefs.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleVerseJump = () => {
    const n = parseInt(verseInput, 10);
    if (!isNaN(n) && n >= 1) scrollToVerse(n);
    setVerseInput('');
  };

  const toggleSelect = (verseNum: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(verseNum) ? next.delete(verseNum) : next.add(verseNum);
      return next;
    });
  };

  const selectedVerses = verses.filter(v => selected.has(v.verse));

  const handleBatchSave = () => {
    if (selectedVerses.length === 0) return;
    saveSelectedVerses(selectedVerses);
    setSavedToast(`${selectedVerses.length}절 저장됨`);
    setSelected(new Set()); setSelectMode(false);
    setTimeout(() => setSavedToast(''), 2500);
  };

  const handleBatchCopy = async () => {
    if (selectedVerses.length === 0) return;
    await copyVerses(selectedVerses);
    setCopiedToast(true);
    setSelected(new Set()); setSelectMode(false);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div className="flex flex-col">
      {batchGraceModal && (
        <AddToGraceModal
          verses={selectedVerses}
          onClose={() => { setBatchGraceModal(false); setSelected(new Set()); setSelectMode(false); }}
        />
      )}

      {/* Chapter navigation bar */}
      <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={() => chapter > 1 && onChapterChange(chapter - 1)} disabled={chapter <= 1}
          className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-30 hover:bg-gray-200 transition-colors shrink-0">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-800 min-w-[3.5rem] text-center shrink-0">
          {translationMode === 'web' && engBook ? `${engBook} ${chapter}` : `${book} ${chapter}장`}
        </span>
        <button onClick={() => chapter < totalChapters && onChapterChange(chapter + 1)} disabled={chapter >= totalChapters}
          className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-30 hover:bg-gray-200 transition-colors shrink-0">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input value={verseInput} onChange={e => setVerseInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerseJump()}
            placeholder="절 이동" className="w-full min-w-0 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary-300 bg-white"
            type="number" min={1} />
          <button onClick={handleVerseJump} className="px-2 py-1 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 shrink-0">이동</button>
        </div>
        <button onClick={() => { setSelectMode(m => !m); setSelected(new Set()); }}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
            selectMode ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          <ListChecks className="w-3.5 h-3.5" />
          {selectMode ? '선택중' : '선택'}
        </button>
      </div>

      {hasData && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-100">
          <p className="text-xs text-gray-400">
            {isParallel ? `개역한글 ${krvVerses.length}절 · WEB ${webVerses.length}절` : `총 ${translationMode === 'web' ? webVerses.length : krvVerses.length}절`}
          </p>
        </div>
      )}

      {!hasData ? (
        <div className="p-8 text-center bg-white">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {translationMode === 'web' ? '이 장의 WEB 데이터가 없습니다.' : '이 장의 데이터가 없습니다.'}
          </p>
          <p className="text-xs text-gray-300 mt-1">데모 버전은 일부 장만 제공됩니다 (창 1, 시 23, 요 3, 롬 8).</p>
        </div>
      ) : isParallel ? (
        /* ── Parallel view ── */
        <div className="bg-white divide-y divide-gray-50">
          {parallelVerses.map(pv => (
            <div key={pv.verse}
              ref={el => { verseRefs.current[pv.verse] = el as HTMLDivElement | null; }}
              className={`transition-colors px-4 py-3 ${highlightVerse === pv.verse ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}`}>
              <div className="flex gap-3">
                <span className="shrink-0 font-bold text-xs mt-0.5 w-5 text-right leading-5 text-primary-500">{pv.verse}</span>
                <div className="flex-1 space-y-1">
                  {pv.korean && (
                    <p className="text-sm text-gray-800 leading-relaxed">{pv.korean}</p>
                  )}
                  {pv.english && (
                    <p className="text-xs text-gray-400 leading-relaxed italic">{pv.english}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : translationMode === 'web' ? (
        /* ── WEB only view ── */
        <div className="bg-white divide-y divide-gray-50">
          {webVerses.map(v => (
            <div key={v.verse}
              ref={el => { verseRefs.current[v.verse] = el as HTMLDivElement | null; }}
              className={`flex gap-3 px-4 py-3 transition-colors ${highlightVerse === v.verse ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}`}>
              <span className="shrink-0 font-bold text-xs mt-0.5 w-5 text-right leading-5 text-primary-500">{v.verse}</span>
              <p className="flex-1 text-gray-800 text-sm leading-relaxed select-text" style={{ userSelect: 'text' }}>{v.text}</p>
            </div>
          ))}
        </div>
      ) : (
        /* ── KRV only view (default) ── */
        <div className="bg-white divide-y divide-gray-50">
          {verses.map(v => (
            <VerseRow key={v.verse} verse={v}
              isHighlighted={highlightVerse === v.verse}
              isSelected={selected.has(v.verse)}
              selectMode={selectMode}
              onToggleSelect={() => toggleSelect(v.verse)}
              onNavigatePage={onNavigatePage}
              verseRef={el => { verseRefs.current[v.verse] = el; }}
            />
          ))}
        </div>
      )}

      {/* Batch action bar */}
      {selectMode && selected.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2 shadow-lg z-10 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">{selected.size}절 선택됨</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button onClick={handleBatchSave}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors">
              <Bookmark className="w-3.5 h-3.5" /> 저장
            </button>
            <button onClick={handleBatchCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
              <Copy className="w-3.5 h-3.5" /> 복사
            </button>
            <button onClick={() => setBatchGraceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors">
              <Heart className="w-3.5 h-3.5" /> 은혜 기록
            </button>
            <button onClick={() => { setSelectMode(false); setSelected(new Set()); }}
              className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {savedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-400" /> {savedToast}
        </div>
      )}
      {copiedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-400" /> 복사됨
        </div>
      )}
    </div>
  );
}

/* ─── Verse Row ──────────────────────────────────────────────────────────────── */

type VerseRowProps = {
  verse: BibleVerse;
  isHighlighted: boolean;
  isSelected: boolean;
  selectMode: boolean;
  onToggleSelect: () => void;
  onNavigatePage?: (page: Page) => void;
  verseRef: (el: HTMLDivElement | null) => void;
};

function VerseRow({ verse, isHighlighted, isSelected, selectMode, onToggleSelect, onNavigatePage: _onNav, verseRef }: VerseRowProps) {
  const [showActions, setShowActions] = useState(false);
  const [saved, setSaved] = useState(() => isVerseSaved(verse.book, verse.chapter, verse.verse));
  const [copied, setCopied] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [memo, setMemo] = useState('');
  const [savedConfirm, setSavedConfirm] = useState(false);
  const [showGrace, setShowGrace] = useState(false);

  const handleSave = () => {
    saveVerse(verse, memo);
    setSaved(true); setSavedConfirm(true);
    setTimeout(() => setSavedConfirm(false), 2000);
  };

  const handleCopy = async () => {
    await copyVerse(verse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {showGrace && (
        <AddToGraceModal verse={verse} onClose={() => setShowGrace(false)} />
      )}
      <div ref={verseRef}
        className={`transition-colors ${
          isHighlighted ? 'bg-amber-50 border-l-4 border-l-amber-400' :
          isSelected    ? 'bg-primary-50' :
          showActions   ? 'bg-gray-50' : ''
        }`}>
        <div className="flex gap-3 px-4 py-3 cursor-pointer"
          onClick={() => selectMode ? onToggleSelect() : setShowActions(a => !a)}>
          {selectMode && (
            <div className="shrink-0 mt-0.5">
              {isSelected ? <CheckSquare className="w-4 h-4 text-primary-500" /> : <Square className="w-4 h-4 text-gray-300" />}
            </div>
          )}
          <span className={`shrink-0 font-bold text-xs mt-0.5 w-5 text-right leading-5 ${isHighlighted ? 'text-amber-600' : 'text-primary-500'}`}>
            {verse.verse}
          </span>
          <p className="flex-1 text-gray-800 text-sm leading-relaxed select-text"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
            {verse.text}
          </p>
          {!selectMode && (
            <span className="shrink-0 text-gray-200 mt-1">
              {showActions ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>

        {showActions && !selectMode && (
          <div className="px-4 pb-3">
            {showMemo && (
              <textarea value={memo} onChange={e => setMemo(e.target.value)}
                placeholder="이 말씀에 대한 묵상이나 메모..."
                className="w-full text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none mb-2"
                rows={2} onClick={e => e.stopPropagation()} />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleSave}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  saved ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                }`}>
                {savedConfirm ? <Check className="w-3.5 h-3.5 text-green-500" /> : saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {savedConfirm ? '저장됨!' : saved ? '저장됨' : '저장'}
              </button>
              <button onClick={() => setShowMemo(m => !m)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${showMemo ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <MessageSquare className="w-3.5 h-3.5" /> 메모
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
              <button onClick={() => setShowGrace(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                <Heart className="w-3.5 h-3.5" /> 은혜 기록
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Search Tab ─────────────────────────────────────────────────────────────── */

function SearchTab({ onNavigate, onJumpTo, setTab, translationMode }: {
  onNavigate?: (page: Page) => void;
  onJumpTo?: (ref: BibleRef) => void;
  setTab?: (t: Tab) => void;
  translationMode: TranslationMode;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (q = query) => {
    const t = q.trim();
    if (!t) return;
    // Try Korean reference for jump (browse tab)
    const ref = parseBibleReference(t);
    if (ref && onJumpTo && setTab) { onJumpTo(ref); setTab('browse'); return; }
    // Use translation-aware search returning raw results
    const raw = searchBibleTranslation(t, translationMode);
    // Map to BibleVerse format for display
    const mapped: BibleVerse[] = raw.map(r => ({
      book: r.book,
      chapter: r.chapter,
      verse: r.verse,
      text: r.text,
      translation: r.translation,
      keywords: [],
    })) as BibleVerse[];
    setResults(mapped);
    setSearched(true);
  };

  const suggestions = translationMode === 'web'
    ? ['love', 'faith', 'pray', 'hope', 'peace', 'Ps 23', 'John 3:16', 'Rom 8:28']
    : ['사랑', '믿음', '기도', '소망', '평안', '시편 23', '요한복음 3:16', '빌립보서 4:13'];

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 pt-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={translationMode === 'web' ? 'Keyword, Gen 1:1, John 3:16' : '키워드, 구절, 책 이름 검색'}
            className="w-full pl-9 pr-9 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <button onClick={() => handleSearch()} className="px-4 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600">검색</button>
      </div>
      {!searched && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
      {searched && (
        <>
          <p className="text-sm text-gray-500"><strong className="text-gray-800">&quot;{query}&quot;</strong> — {results.length}건</p>
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(v => (
                <SearchVerseCard key={`${v.book}-${v.chapter}-${v.verse}`} verse={v} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchVerseCard({ verse, onNavigate: _onNav }: { verse: BibleVerse; onNavigate?: (page: Page) => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => isVerseSaved(verse.book, verse.chapter, verse.verse));
  const [showGrace, setShowGrace] = useState(false);

  const handleCopy = async () => { await copyVerse(verse); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSave = () => { saveVerse(verse); setSaved(true); };

  return (
    <>
      {showGrace && <AddToGraceModal verse={verse} onClose={() => setShowGrace(false)} />}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">{verse.book} {verse.chapter}:{verse.verse}</span>
            {verse.keywords.slice(0, 2).map(k => (
              <span key={k} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">#{k}</span>
            ))}
          </div>
          <p className="text-sm text-gray-800 leading-relaxed select-text" style={{ userSelect: 'text' }}>{verse.text}</p>
        </div>
        <div className="px-4 pb-3 flex gap-2">
          <button onClick={handleSave} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${saved ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'}`}>
            {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {saved ? '저장됨' : '저장'}
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사됨' : '복사'}
          </button>
          <button onClick={() => setShowGrace(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors ml-auto">
            <Heart className="w-3.5 h-3.5" /> 은혜 기록
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Saved Tab ──────────────────────────────────────────────────────────────── */

function SavedTab({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const [saved, setSaved] = useState<SavedVerse[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = () => setSaved(getSavedVerses());
  useEffect(() => { refresh(); }, []);

  const analytics = analyzeSavedVerses();
  const tags = Array.from(new Set(saved.flatMap(v => v.tags)));
  const filtered = saved
    .filter(v => !filterTag || v.tags.includes(filterTag))
    .filter(v => !searchQuery || v.text.includes(searchQuery) || v.book.includes(searchQuery) || v.memo.includes(searchQuery));

  if (saved.length === 0) {
    return (
      <div className="p-4 mt-4">
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">저장한 말씀이 없습니다</p>
          <p className="text-sm mt-1">말씀 읽기에서 절을 선택하여 저장하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-primary-600">{analytics.totalSaved}</p>
          <p className="text-xs text-gray-500 mt-0.5">저장한 말씀</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">많이 저장한 책</p>
          {analytics.topBooks.slice(0, 2).map(b => (
            <p key={b.book} className="text-xs font-semibold text-gray-800 truncate">{b.book} ({b.count})</p>
          ))}
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="저장한 말씀 검색..."
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200" />
        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilterTag(null)} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterTag ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>전체</button>
          {tags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${filterTag === tag ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>#{tag}</button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {filtered.map(v => (
          <SavedVerseCard key={v.id} saved={v}
            onDelete={id => { deleteSavedVerse(id); refresh(); }}
            onMemoSave={(id, m) => { updateSavedVerseMemo(id, m); refresh(); }}
            onNavigate={onNavigate}
          />
        ))}
        {filtered.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">검색 결과가 없습니다.</div>}
      </div>
    </div>
  );
}

function SavedVerseCard({ saved, onDelete, onMemoSave, onNavigate: _onNav }: {
  saved: SavedVerse;
  onDelete: (id: string) => void;
  onMemoSave: (id: string, memo: string) => void;
  onNavigate?: (page: Page) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editingMemo, setEditingMemo] = useState(false);
  const [memo, setMemo] = useState(saved.memo);
  const [showGrace, setShowGrace] = useState(false);

  const handleCopy = async () => { await copyVerse(saved); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      {showGrace && <AddToGraceModal verse={saved} onClose={() => setShowGrace(false)} />}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">{saved.book} {saved.chapter}:{saved.verse}</span>
            <span className="text-[10px] text-gray-400">{new Date(saved.savedAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed mb-2 select-text" style={{ userSelect: 'text' }}>{saved.text}</p>
          {saved.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {saved.tags.map(t => <span key={t} className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full">#{t}</span>)}
            </div>
          )}
          {saved.memo && !editingMemo && (
            <p className="mt-2 text-xs text-gray-500 bg-amber-50 rounded-lg px-3 py-2 border-l-2 border-amber-300">{saved.memo}</p>
          )}
          {editingMemo && (
            <div className="mt-2">
              <textarea value={memo} onChange={e => setMemo(e.target.value)}
                className="w-full text-xs text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none" rows={3} />
              <div className="flex gap-2 mt-1">
                <button onClick={() => { onMemoSave(saved.id, memo); setEditingMemo(false); }} className="text-xs text-white bg-primary-500 hover:bg-primary-600 px-3 py-1.5 rounded-lg">저장</button>
                <button onClick={() => setEditingMemo(false)} className="text-xs text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg">취소</button>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-50 pt-2 flex-wrap">
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사됨' : '복사'}
          </button>
          <button onClick={() => setEditingMemo(!editingMemo)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> 메모
          </button>
          <button onClick={() => setShowGrace(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
            <Heart className="w-3.5 h-3.5" /> 은혜 기록
          </button>
          <button onClick={() => onDelete(saved.id)} className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
