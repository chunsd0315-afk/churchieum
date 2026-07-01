/**
 * 은혜기록 관련 화면 컴포넌트
 * - ReadingGraceFormView  : 성경통독 은혜기록 작성/수정
 * - SermonGraceFormView   : 설교 은혜기록 작성/수정
 * - GraceNoteListView     : 모아보기 (검색·필터)
 * - GraceNoteDetailView   : 상세 보기
 * - PlanGraceNotesSummary : 통독 계획 내 은혜기록 요약 (BibleReadingCenter에서 사용)
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeft, Heart, BookOpen, Edit3, Trash2, Copy, Search,
  Filter, X, CheckCircle, ChevronDown, BookMarked,
  Sparkles, Mic, Lock, Users, Eye,
} from 'lucide-react';
import {
  getAllGraceNotes, getGraceNote, getGraceNotesByProgress,
  createGraceNote, updateGraceNote, deleteGraceNote,
  type GraceNote, type GraceNoteInput, type GraceNoteType, type GraceNoteVisibility,
} from '../../data/graceNotes';
import { READING_PLANS } from '../../data/readingPlans';

// ─── Reading Grace Form Context ───────────────────────────────────────────────

export type GraceFormCtx = {
  progressId: string;
  planId: string;
  planName: string;
  planColor: string;
  day: number;
  readingReferences: string;
  editId?: string;
};

// ─── Sermon Grace Form Context ────────────────────────────────────────────────

export type SermonGraceFormCtx = {
  sermonId?: string;
  sermonTitle?: string;
  sermonPreacher?: string;
  sermonDate?: string;
  bibleReference?: string;
  editId?: string;
};

// ─── Shared field row ─────────────────────────────────────────────────────────

function FieldBlock({
  icon, label, required, value, onChange, placeholder, rows,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
        {icon}
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:border-primary-400 resize-none placeholder-gray-300"
      />
    </div>
  );
}

// ─── Visibility helpers ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: { value: GraceNoteVisibility; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { value: 'private', label: '나만 보기', desc: '나만 볼 수 있어요', icon: <Lock className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-100' },
  { value: 'pastor', label: '담당 교역자와 공유', desc: '담당 교역자만 볼 수 있어요', icon: <Eye className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
  { value: 'group', label: '교구/부서 내 공유', desc: '같은 교구·구역·부서원이 볼 수 있어요', icon: <Users className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50' },
];

export function visibilityMeta(v: GraceNoteVisibility) {
  return VISIBILITY_OPTIONS.find(o => o.value === v) ?? VISIBILITY_OPTIONS[0];
}

function VisibilitySelector({ value, onChange }: { value: GraceNoteVisibility; onChange: (v: GraceNoteVisibility) => void }) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
        <Lock className="w-4 h-4 text-gray-500" /> 공개 범위
      </label>
      <div className="grid grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-center transition-all ${
              value === opt.value
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${value === opt.value ? 'bg-primary-100 text-primary-600' : opt.color}`}>
              {opt.icon}
            </span>
            <span className={`text-[11px] font-bold leading-tight ${value === opt.value ? 'text-primary-700' : 'text-gray-700'}`}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1.5 text-center">{visibilityMeta(value).desc}</p>
    </div>
  );
}

// ─── Reading Grace Form View ──────────────────────────────────────────────────

export function GraceNoteFormView({ ctx, onSave, onBack }: {
  ctx: GraceFormCtx;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  const existing = ctx.editId ? getGraceNote(ctx.editId) : null;

  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [memorableVerse, setMemorableVerse] = useState(existing?.memorableVerse ?? '');
  const [application, setApplication] = useState(existing?.application ?? '');
  const [prayer, setPrayer] = useState(existing?.prayer ?? '');
  const [visibility, setVisibility] = useState<GraceNoteVisibility>(existing?.visibility ?? 'private');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!graceContent.trim()) return;
    const input: GraceNoteInput = {
      type: 'reading',
      visibility,
      sourceId: ctx.progressId,
      sourceTitle: ctx.planName,
      planId: ctx.planId,
      planName: ctx.planName,
      planColor: ctx.planColor,
      day: ctx.day,
      bibleReference: ctx.readingReferences,
      memorableVerse,
      graceContent,
      application,
      prayer,
    };
    let id: string;
    if (ctx.editId) {
      updateGraceNote(ctx.editId, input);
      id = ctx.editId;
    } else {
      id = createGraceNote(input).id;
    }
    setSaved(true);
    setTimeout(() => { onSave(id); }, 700);
  };

  const hasContent = graceContent.trim().length > 0;

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-sm">{ctx.editId ? '성경통독 은혜기록 수정' : '성경통독 은혜기록'}</h2>
          <p className="text-xs text-gray-400">{ctx.planName} · {ctx.day}일차</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasContent || saved}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            saved ? 'bg-green-500 text-white' : hasContent ? `bg-gradient-to-r ${ctx.planColor} text-white hover:opacity-90` : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {saved ? '저장됨 ✓' : '저장'}
        </button>
      </div>

      <div className="flex-1 bg-gray-50 lg:grid lg:grid-cols-2 lg:gap-0">
        {/* Left: plan info */}
        <div className="lg:border-r lg:border-gray-100 p-4 space-y-3">
          <div className={`bg-gradient-to-br ${ctx.planColor} rounded-2xl p-4 text-white`}>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 opacity-80" />
              <span className="font-bold">{ctx.planName}</span>
            </div>
            <p className="text-white/70 text-xs">{ctx.day}일차 · {ctx.readingReferences}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5" /> 오늘 읽은 말씀
            </h3>
            <p className="text-sm font-semibold text-gray-800">{ctx.readingReferences}</p>
            <p className="text-xs text-gray-400 mt-1">위 말씀을 바탕으로 은혜를 기록하세요.</p>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
            <h3 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 기록 도움말
            </h3>
            <ul className="text-xs text-amber-600 space-y-1">
              <li>• 오늘 읽은 말씀을 통해 받은 깨달음을 적어보세요</li>
              <li>• 마음에 남는 구절을 기억해두면 좋아요</li>
              <li>• 삶에 적용할 한 가지를 정해보세요</li>
            </ul>
          </div>
        </div>

        {/* Right: form fields */}
        <div className="p-4 space-y-4">
          <FieldBlock
            icon={<Heart className="w-4 h-4 text-rose-500" />}
            label="받은 은혜" required
            value={graceContent} onChange={setGraceContent}
            placeholder="하나님께서 오늘 말씀을 통해 주신 은혜를 적어보세요."
            rows={5}
          />
          <FieldBlock
            icon={<BookMarked className="w-4 h-4 text-primary-500" />}
            label="마음에 남은 말씀"
            value={memorableVerse} onChange={setMemorableVerse}
            placeholder="예: 창세기 1장 1절 - 태초에 하나님이 천지를 창조하시니라"
            rows={3}
          />
          <FieldBlock
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            label="적용할 점"
            value={application} onChange={setApplication}
            placeholder="예: 하루의 시작을 말씀과 기도로 시작하겠습니다."
            rows={3}
          />
          <FieldBlock
            icon={<Sparkles className="w-4 h-4 text-violet-500" />}
            label="기도문"
            value={prayer} onChange={setPrayer}
            placeholder="예: 주님, 오늘도 말씀 안에서 하루를 시작하게 하소서."
            rows={3}
          />
          <VisibilitySelector value={visibility} onChange={setVisibility} />
          <div className="pt-2 pb-4 lg:hidden">
            <button
              onClick={handleSave}
              disabled={!hasContent || saved}
              className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                saved ? 'bg-green-500 text-white' : hasContent ? `bg-gradient-to-r ${ctx.planColor} text-white` : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {saved ? '저장됨 ✓' : '은혜기록 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sermon Grace Form View ───────────────────────────────────────────────────

export function SermonGraceFormView({ ctx, onSave, onBack }: {
  ctx: SermonGraceFormCtx;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  const existing = ctx.editId ? getGraceNote(ctx.editId) : null;

  const [sermonTitle, setSermonTitle] = useState(existing?.sermonTitle ?? ctx.sermonTitle ?? '');
  const [sermonPreacher, setSermonPreacher] = useState(existing?.sermonPreacher ?? ctx.sermonPreacher ?? '');
  const [sermonDate, setSermonDate] = useState(existing?.sermonDate ?? ctx.sermonDate ?? new Date().toISOString().slice(0, 10));
  const [bibleRef, setBibleRef] = useState(existing?.bibleReference ?? ctx.bibleReference ?? '');
  const [memorableVerse, setMemorableVerse] = useState(existing?.memorableVerse ?? '');
  const [graceContent, setGraceContent] = useState(existing?.graceContent ?? '');
  const [application, setApplication] = useState(existing?.application ?? '');
  const [prayer, setPrayer] = useState(existing?.prayer ?? '');
  const [visibility, setVisibility] = useState<GraceNoteVisibility>(existing?.visibility ?? 'private');
  const [saved, setSaved] = useState(false);

  const hasContent = graceContent.trim().length > 0;

  const handleSave = () => {
    if (!hasContent) return;
    const input: GraceNoteInput = {
      type: 'sermon',
      visibility,
      sourceId: ctx.sermonId,
      sourceTitle: sermonTitle,
      sermonTitle,
      sermonPreacher,
      sermonDate,
      bibleReference: bibleRef,
      memorableVerse,
      graceContent,
      application,
      prayer,
    };
    let id: string;
    if (ctx.editId) {
      updateGraceNote(ctx.editId, input);
      id = ctx.editId;
    } else {
      id = createGraceNote(input).id;
    }
    setSaved(true);
    setTimeout(() => { onSave(id); }, 700);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-sm">{ctx.editId ? '설교 은혜기록 수정' : '설교 은혜기록'}</h2>
          <p className="text-xs text-gray-400">{sermonTitle || '설교 은혜를 기록하세요'}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasContent || saved}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            saved ? 'bg-green-500 text-white' : hasContent ? 'bg-gradient-to-r from-secondary-500 to-primary-600 text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {saved ? '저장됨 ✓' : '저장'}
        </button>
      </div>

      <div className="flex-1 bg-gray-50 lg:grid lg:grid-cols-2 lg:gap-0">
        {/* Left: sermon info fields */}
        <div className="lg:border-r lg:border-gray-100 p-4 space-y-3">
          <div className="bg-gradient-to-br from-secondary-500 to-primary-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Mic className="w-5 h-5 opacity-80" />
              <span className="font-bold text-sm">설교 은혜기록</span>
            </div>
            <p className="text-white/70 text-xs">설교를 통해 받은 은혜를 기록하세요</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">설교 제목</label>
              <input
                value={sermonTitle}
                onChange={e => setSermonTitle(e.target.value)}
                placeholder="설교 제목을 입력하세요"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">설교자</label>
                <input
                  value={sermonPreacher}
                  onChange={e => setSermonPreacher(e.target.value)}
                  placeholder="설교자"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">날짜</label>
                <input
                  type="date"
                  value={sermonDate}
                  onChange={e => setSermonDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">설교 본문</label>
              <input
                value={bibleRef}
                onChange={e => setBibleRef(e.target.value)}
                placeholder="예: 히브리서 11:1"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50"
              />
            </div>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
            <h3 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 기록 도움말
            </h3>
            <ul className="text-xs text-amber-600 space-y-1">
              <li>• 설교를 통해 마음에 울림이 온 말씀을 기록하세요</li>
              <li>• 하나님께서 나에게 주시는 메시지를 적어보세요</li>
              <li>• 결단하고 삶에 적용할 한 가지를 정해보세요</li>
            </ul>
          </div>
        </div>

        {/* Right: grace fields */}
        <div className="p-4 space-y-4">
          <FieldBlock
            icon={<Heart className="w-4 h-4 text-rose-500" />}
            label="받은 은혜" required
            value={graceContent} onChange={setGraceContent}
            placeholder="설교를 통해 하나님께서 주신 은혜를 적어보세요."
            rows={5}
          />
          <FieldBlock
            icon={<BookMarked className="w-4 h-4 text-primary-500" />}
            label="마음에 남은 말씀"
            value={memorableVerse} onChange={setMemorableVerse}
            placeholder="마음에 남은 성경 구절이나 설교 내용을 적어보세요."
            rows={3}
          />
          <FieldBlock
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            label="결단 / 적용"
            value={application} onChange={setApplication}
            placeholder="설교를 듣고 삶에 적용하거나 결단할 내용을 적어보세요."
            rows={3}
          />
          <FieldBlock
            icon={<Sparkles className="w-4 h-4 text-violet-500" />}
            label="기도문"
            value={prayer} onChange={setPrayer}
            placeholder="예: 주님, 오늘 말씀대로 살아갈 수 있도록 도와주세요."
            rows={3}
          />
          <VisibilitySelector value={visibility} onChange={setVisibility} />
          <div className="pt-2 pb-4 lg:hidden">
            <button
              onClick={handleSave}
              disabled={!hasContent || saved}
              className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                saved ? 'bg-green-500 text-white' : hasContent ? 'bg-gradient-to-r from-secondary-500 to-primary-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {saved ? '저장됨 ✓' : '은혜기록 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grace Note List View (모아보기) ─────────────────────────────────────────

export function GraceNoteListView({ onBack, onDetail, onEdit, initialPlanId, initialType }: {
  onBack: () => void;
  onDetail: (id: string) => void;
  onEdit: (note: GraceNote) => void;
  initialPlanId?: string;
  initialType?: GraceNoteType;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<GraceNoteType | ''>(initialType ?? '');
  const [planFilter, setPlanFilter] = useState(initialPlanId ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notes, setNotes] = useState(() => getAllGraceNotes());

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (typeFilter && n.type !== typeFilter) return false;
      if (planFilter && n.planId !== planFilter) return false;
      if (dateFrom && n.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo   && n.createdAt.slice(0, 10) > dateTo)   return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = [
          n.planName, n.sermonTitle, n.sermonPreacher, n.bibleReference,
          n.graceContent, n.memorableVerse, n.application,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [notes, search, typeFilter, planFilter, dateFrom, dateTo]);

  const handleDelete = (id: string) => {
    deleteGraceNote(id);
    setNotes(getAllGraceNotes());
    setDeleteId(null);
  };

  const typeLabel = (type: GraceNoteType) =>
    type === 'reading' ? '성경통독' : type === 'sermon' ? '설교' : '개인';
  const typeBadgeClass = (type: GraceNoteType) =>
    type === 'reading' ? 'bg-green-100 text-green-700' : type === 'sermon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';

  return (
    <>
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">은혜기록을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">은혜기록 모아보기</h2>
          </div>
          <span className="text-xs text-gray-400">{notes.length}개</span>
        </div>

        <div className="flex-1 bg-gray-50 p-4 space-y-3">
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="키워드, 말씀, 설교 검색"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 bg-gray-50"
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${showFilters ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Type tabs */}
            <div className="flex gap-1.5">
              {(['', 'reading', 'sermon'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t === '' ? '전체' : t === 'reading' ? '성경통독' : '설교'}
                </button>
              ))}
            </div>

            {showFilters && (
              <div className="space-y-2 pt-1">
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50">
                  <option value="">전체 통독 플랜</option>
                  {READING_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">시작 날짜</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">종료 날짜</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50" />
                  </div>
                </div>
                <button
                  onClick={() => { setSearch(''); setPlanFilter(''); setDateFrom(''); setDateTo(''); setTypeFilter(''); }}
                  className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> 필터 초기화
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400">{filtered.length}개의 기록</p>
          </div>

          {/* Notes list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
              <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 text-sm">은혜기록이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">말씀과 설교를 통해 받은 은혜를 기록해보세요.</p>
            </div>
          ) : filtered.map(note => {
            const plan = note.planId ? READING_PLANS.find(p => p.id === note.planId) : undefined;
            const accentColor = plan?.color ?? 'from-primary-500 to-secondary-500';
            return (
              <div key={note.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${accentColor}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeBadgeClass(note.type)}`}>
                        {typeLabel(note.type)}
                      </span>
                      {note.type === 'reading' && note.planName && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${accentColor} text-white`}>
                          {note.planName}
                        </span>
                      )}
                      {note.type === 'reading' && note.day && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{note.day}일차</span>
                      )}
                      {note.type === 'sermon' && note.sermonTitle && (
                        <span className="text-[10px] text-gray-600 font-medium">{note.sermonTitle}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {note.createdAt.slice(0, 10).replace(/-/g, '.')}
                    </span>
                  </div>

                  {note.bibleReference && (
                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {note.bibleReference}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{note.graceContent}</p>

                  {note.memorableVerse && (
                    <div className="mt-2 bg-primary-50 rounded-xl px-3 py-2 border-l-2 border-primary-300">
                      <p className="text-xs text-primary-700 font-medium line-clamp-1">
                        <BookMarked className="w-3 h-3 inline mr-1" />{note.memorableVerse}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => onDetail(note.id)}
                      className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors">
                      자세히 보기
                    </button>
                    <button onClick={() => onEdit(note)}
                      className="py-2 px-3 bg-primary-50 hover:bg-primary-100 text-primary-600 text-xs font-semibold rounded-xl transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(note.id)}
                      className="py-2 px-3 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 text-xs font-semibold rounded-xl transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Grace Note Detail View ───────────────────────────────────────────────────

export function GraceNoteDetailView({ noteId, onBack, onEdit, onDelete }: {
  noteId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(() => getGraceNote(noteId));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-48">
        <p className="text-gray-400 text-sm">기록을 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-3 text-primary-500 text-sm font-medium">← 돌아가기</button>
      </div>
    );
  }

  const plan = note.planId ? READING_PLANS.find(p => p.id === note.planId) : undefined;
  const bannerGradient = note.type === 'sermon'
    ? 'from-secondary-500 to-primary-600'
    : (note.planColor ?? plan?.color ?? 'from-primary-500 to-primary-700');

  const handleCopy = () => {
    const typeStr = note.type === 'reading'
      ? `[${note.planName} ${note.day}일차] ${note.bibleReference ?? ''}`
      : `[설교] ${note.sermonTitle ?? ''} · ${note.sermonPreacher ?? ''} (${note.bibleReference ?? ''})`;
    const text = [
      typeStr,
      note.createdAt.slice(0, 10),
      '',
      '받은 은혜', note.graceContent,
      note.memorableVerse ? `\n마음에 남은 말씀\n${note.memorableVerse}` : '',
      note.application ? `\n적용할 점\n${note.application}` : '',
      note.prayer ? `\n기도문\n${note.prayer}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDelete = () => {
    deleteGraceNote(noteId);
    setNote(null);
    onDelete();
  };

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">은혜기록을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-sm">은혜기록</h2>
            <p className="text-xs text-gray-400">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${copied ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {copied ? '복사됨' : <><Copy className="w-3.5 h-3.5 inline mr-1" />복사</>}
            </button>
            <button onClick={onEdit} className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold hover:bg-primary-100">
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />수정
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 p-4 space-y-4">
          {/* Banner */}
          <div className={`bg-gradient-to-br ${bannerGradient} rounded-2xl p-4 text-white`}>
            {note.type === 'reading' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 opacity-80" />
                  <span className="font-bold text-sm">{note.planName}</span>
                  {note.day && <span className="text-white/60 text-xs">· {note.day}일차</span>}
                </div>
                <p className="text-white/70 text-xs">{note.bibleReference}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 opacity-80" />
                  <span className="font-bold text-sm">{note.sermonTitle ?? '설교 은혜기록'}</span>
                </div>
                <p className="text-white/70 text-xs">
                  {[note.sermonPreacher, note.bibleReference, note.sermonDate].filter(Boolean).join(' · ')}
                </p>
              </>
            )}
            <p className="text-white/50 text-[10px] mt-1.5">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</p>
            <div className="mt-2">
              {(() => {
                const vm = visibilityMeta(note.visibility ?? 'private');
                return (
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white/80 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {vm.icon} {vm.label}
                  </span>
                );
              })()}
            </div>
          </div>

          <Section icon={<Heart className="w-3.5 h-3.5 text-rose-500" />} label="받은 은혜" text={note.graceContent} />
          {note.memorableVerse && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-primary-500" /> 마음에 남은 말씀
              </h3>
              <div className="bg-primary-50 rounded-xl px-4 py-3 border-l-4 border-primary-400">
                <p className="text-sm text-primary-800 leading-relaxed italic whitespace-pre-wrap">{note.memorableVerse}</p>
              </div>
            </div>
          )}
          {note.application && (
            <Section icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              label={note.type === 'sermon' ? '결단 / 적용' : '적용할 점'} text={note.application} />
          )}
          {note.prayer && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" /> 기도문
              </h3>
              <div className="bg-violet-50 rounded-xl px-4 py-3 border-l-4 border-violet-400">
                <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-wrap">{note.prayer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon} {label}
      </h3>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ─── Plan Grace Notes Summary (used inside BibleReadingCenter DetailView) ─────

export function PlanGraceNotesSummary({ progressId, planName, planColor, onViewAll, onWrite, onViewNote }: {
  progressId: string;
  planName: string;
  planColor: string;
  onViewAll: () => void;
  onWrite: () => void;
  onViewNote: (id: string) => void;
}) {
  const notes = getGraceNotesByProgress(progressId).slice(0, 3);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-sm text-gray-900">은혜기록</span>
          {notes.length > 0 && (
            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-semibold">{notes.length}개</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <button
            onClick={onWrite}
            className={`w-full mt-3 py-3 bg-gradient-to-r ${planColor} text-white text-sm font-bold rounded-2xl hover:opacity-90 shadow-sm flex items-center justify-center gap-2`}>
            <Heart className="w-4 h-4" />
            오늘 받은 은혜 기록하기
          </button>

          {notes.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-4 pb-2">아직 기록된 은혜가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {notes.map(note => (
                <button key={note.id} onClick={() => onViewNote(note.id)}
                  className="w-full text-left bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">{note.day}일차</span>
                    <span className="text-[10px] text-gray-400">{note.createdAt.slice(0, 10).replace(/-/g, '.')}</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{note.graceContent}</p>
                </button>
              ))}
              <button onClick={onViewAll} className="w-full py-2 text-xs text-primary-600 font-semibold hover:text-primary-700">
                전체 기록 보기 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
