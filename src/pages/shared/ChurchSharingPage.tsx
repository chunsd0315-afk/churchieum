import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight, HeartHandshake,
  MapPin, Tag, Calendar, MessageSquare, Users, Edit3, Trash2,
  CheckCircle, Image as ImageIcon, Paperclip,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  getAllPosts, addPost, updatePost, deletePost,
  getAllRequests, addRequest, updateRequestStatus,
  getAllMessages, addMessage,
  CATEGORIES, TYPE_LABELS, STATUS_LABELS,
  type SharingPost, type SharingRequest,
} from '../../services/sharingStorage';
import {
  EMPTY_SHARING_FILTER,
  countSharingDetailFilters,
  isSharingFilterActive,
  sharingMatchesDetailFilter,
  sharingMatchesTab,
  sortSharingPosts,
  TYPE_COLORS,
  TYPE_GRADIENT,
  STATUS_COLORS,
  formatSharingDate,
  type SharingTabKey,
  type SharingSearchFilter,
} from '../../services/sharingHelpers';
import ContentEditorLayout, { MobileFullScreenPage } from '../../components/layout/ContentEditorLayout';
import {
  PageHeaderBar,
  ContentListToolbar,
  CONTENT_CARD_GRID_CLASS,
  CONTENT_LIST_SHELL_CLASS,
  readStoredViewMode,
  writeStoredViewMode,
  ConfirmDialog,
  type ContentViewMode,
} from '../../components/common/ui';
import EmptyState from '../../components/layout/EmptyState';
import {
  SharingSearchPanel,
  SharingFilterChips,
} from '../../components/sharing/SharingSearchPanel';
import { SharingGridCard, SharingListRow } from '../../components/sharing/SharingListViews';

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = SharingTabKey;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'give',     label: '나눔합니다' },
  { key: 'need',     label: '필요합니다' },
  { key: 'ministry', label: '사역도움' },
  { key: 'resource', label: '자료공유' },
  { key: 'event',    label: '행사초대' },
  { key: 'completed',label: '완료' },
];

// ─── TabBar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [check]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const btn = el.querySelector(`[data-tab="${active}"]`) as HTMLElement | null;
    if (!btn) return;
    el.scrollTo({ left: btn.offsetLeft + btn.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const scroll = (delta: number) => ref.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div className="flex items-center border-b border-gray-100 bg-white sticky top-0 z-10">
      <div className="relative flex-1 overflow-hidden">
        {canLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
            <button onClick={() => scroll(-200)} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow border border-gray-100">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </>
        )}
        <div ref={ref} className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
          {TABS.map(t => (
            <button key={t.key} data-tab={t.key} onClick={() => onChange(t.key)}
              className={`shrink-0 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all ${
                active === t.key
                  ? 'font-bold text-primary-600 border-primary-500'
                  : 'font-medium text-gray-500 border-transparent hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
          <div className="shrink-0 w-8" />
        </div>
        {canRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            <button onClick={() => scroll(200)} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow border border-gray-100">
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({
  post, canEdit, canComplete, canViewRequests,
  onBack, onEdit, onDelete, onComplete,
  onRequest, onMessage, onViewRequests,
}: {
  post: SharingPost;
  canEdit: boolean;
  canComplete: boolean;
  canViewRequests: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onRequest: () => void;
  onMessage: () => void;
  onViewRequests: () => void;
}) {
  const { isMobile } = useBreakpoint();
  const requests = getAllRequests(post.id);
  const messages = getAllMessages(post.id);

  const actions = canEdit ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 touch-target"
      >
        <Edit3 className="w-4 h-4" />
        {!isMobile && '수정'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 touch-target"
      >
        <Trash2 className="w-4 h-4" />
        {!isMobile && '삭제'}
      </button>
    </div>
  ) : undefined;

  return (
    <MobileFullScreenPage
      title={post.title}
      description={`${post.churchName} · ${formatSharingDate(post.createdAt)}`}
      onBack={onBack}
      saveButton={actions}
    >
      <div className="space-y-5 max-w-[900px] mx-auto pb-8">
        <div className={`w-full aspect-video rounded-[24px] overflow-hidden bg-gradient-to-br ${TYPE_GRADIENT[post.type]} flex items-center justify-center`}>
          {post.images[0] ? (
            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <HeartHandshake className="w-16 h-16 text-white opacity-40" />
          )}
        </div>

        {post.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {post.images.slice(1).map((img, i) => (
              <img key={i} src={img} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0 border border-gray-100" />
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[post.status]}`}>{STATUS_LABELS[post.status]}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[post.type]}`}>{TYPE_LABELS[post.type]}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{post.category}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{post.title}</h1>
        </div>

        <div className="bg-gray-50 rounded-[20px] p-4 space-y-2.5 border border-[#ECECEC]">
          <Row icon={<MapPin className="w-4 h-4 text-gray-400" />} label="위치" value={post.location} />
          <Row icon={<HeartHandshake className="w-4 h-4 text-gray-400" />} label="교회" value={post.churchName} />
          <Row icon={<Tag className="w-4 h-4 text-gray-400" />} label="작성자" value={`${post.writerName} ${post.writerRole}`} />
          <Row icon={<Calendar className="w-4 h-4 text-gray-400" />} label="등록일" value={formatSharingDate(post.createdAt)} />
          <Row icon={<Users className="w-4 h-4 text-gray-400" />} label="신청" value={`${requests.length}건`} />
          <Row icon={<MessageSquare className="w-4 h-4 text-gray-400" />} label="문의" value={`${messages.length}건`} />
        </div>

        <div className="bg-white rounded-[20px] border border-[#ECECEC] p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>

        {post.files.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">첨부파일</p>
            {post.files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
                <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{f}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2.5">
          {post.status !== 'completed' && (
            <button
              type="button"
              onClick={onRequest}
              className="w-full py-4 bg-primary-500 text-[#1A1A1A] font-bold rounded-[18px] flex items-center justify-center gap-2 text-sm hover:bg-primary-600 transition-colors min-h-[56px] touch-target"
            >
              <HeartHandshake className="w-5 h-5" /> 나눔 신청하기
            </button>
          )}
          <button
            type="button"
            onClick={onMessage}
            className="w-full py-3.5 border-2 border-primary-200 text-primary-700 font-bold rounded-[18px] flex items-center justify-center gap-2 text-sm hover:bg-primary-50 transition-colors min-h-[48px] touch-target"
          >
            <MessageSquare className="w-4 h-4" /> 문의하기
          </button>
        </div>

        {(canComplete || canViewRequests) && (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">관리</p>
            <div className="flex gap-2 flex-wrap">
              {canViewRequests && (
                <button
                  type="button"
                  onClick={onViewRequests}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors min-h-[48px] touch-target"
                >
                  <Users className="w-4 h-4" /> 신청자 목록 ({requests.length})
                </button>
              )}
              {canComplete && post.status !== 'completed' && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-colors min-h-[48px] touch-target"
                >
                  <CheckCircle className="w-4 h-4" /> 완료 처리
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileFullScreenPage>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0">{icon}</div>
      <span className="text-xs text-gray-400 w-12 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value}</span>
    </div>
  );
}

// ─── Post Form ────────────────────────────────────────────────────────────────

type FormState = {
  type: SharingPost['type'];
  category: string;
  title: string;
  content: string;
  location: string;
  images: string[];
  files: string[];
};

function PostForm({
  initial, onSave, onClose, isInline, saveTriggerRef,
}: {
  initial?: Partial<FormState> & { type: SharingPost['type'] };
  onSave: (data: FormState) => void;
  onClose: () => void;
  isInline?: boolean;
  saveTriggerRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const [form, setForm] = useState<FormState>({
    type:     initial?.type ?? 'give',
    category: initial?.category ?? CATEGORIES[initial?.type ?? 'give'][0],
    title:    initial?.title ?? '',
    content:  initial?.content ?? '',
    location: initial?.location ?? '',
    images:   initial?.images ?? [],
    files:    initial?.files ?? [],
  });

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleTypeChange = (t: SharingPost['type']) =>
    setForm(p => ({ ...p, type: t, category: CATEGORIES[t][0] }));

  const handleSaveClick = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    onSave(form);
  };

  useEffect(() => {
    if (saveTriggerRef) saveTriggerRef.current = handleSaveClick;
  });

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - form.images.length);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setForm(p => ({ ...p, images: [...p.images, ev.target!.result as string].slice(0, 3) }));
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map(f => f.name).slice(0, 3 - form.files.length);
    setForm(p => ({ ...p, files: [...p.files, ...names].slice(0, 3) }));
    e.target.value = '';
  };

  const TYPE_OPTS: { type: SharingPost['type']; label: string; color: string }[] = [
    { type: 'give',     label: '나눔합니다', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { type: 'need',     label: '필요합니다', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { type: 'ministry', label: '사역도움',   color: 'bg-green-100 text-green-700 border-green-200' },
    { type: 'resource', label: '자료공유',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { type: 'event',    label: '행사초대',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  ];

  const INPUT = 'w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';
  const LABEL = 'block text-xs font-bold text-gray-600 mb-1.5';

  const fields = (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className={LABEL}>나눔 유형</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTS.map(o => (
            <button key={o.type} type="button" onClick={() => handleTypeChange(o.type)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                form.type === o.type ? o.color + ' border-2' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={LABEL}>카테고리</label>
        <div className="relative">
          <select value={form.category} onChange={e => setField('category', e.target.value)} className={INPUT + ' appearance-none pr-8'}>
            {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={LABEL}>제목 *</label>
        <input value={form.title} onChange={e => setField('title', e.target.value)}
          placeholder="제목을 입력하세요" className={INPUT} />
      </div>

      {/* Content */}
      <div>
        <label className={LABEL}>내용 *</label>
        <textarea value={form.content} onChange={e => setField('content', e.target.value)}
          placeholder="나눔 내용을 자세히 입력해주세요" rows={5}
          className={INPUT + ' resize-none'} />
      </div>

      {/* Location */}
      <div>
        <label className={LABEL}>지역</label>
        <input value={form.location} onChange={e => setField('location', e.target.value)}
          placeholder="예: 서울 강남구" className={INPUT} />
      </div>

      {/* Images */}
      <div>
        <label className={LABEL}>사진 (최대 3장)</label>
        {form.images.length < 3 && (
          <label className="flex items-center gap-2 px-3.5 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">사진 추가</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageFile} />
          </label>
        )}
        {form.images.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Files */}
      <div>
        <label className={LABEL}>파일 첨부 (최대 3개)</label>
        {form.files.length < 3 && (
          <label className="flex items-center gap-2 px-3.5 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">파일 추가</span>
            <input type="file" multiple className="hidden" onChange={handleAttachFile} />
          </label>
        )}
        {form.files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-gray-50 rounded-xl">
            <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex-1 text-sm text-gray-700 truncate">{f}</span>
            <button onClick={() => setForm(p => ({ ...p, files: p.files.filter((_, j) => j !== i) }))}>
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isInline) {
    return fields;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white sm:bg-black/50 sm:items-center sm:justify-center sm:p-4">
      <div className="flex flex-col h-full w-full sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-lg sm:rounded-3xl bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 shrink-0">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-gray-900 text-base flex-1">{initial?.title ? '나눔 수정' : '나눔 등록'}</h3>
          <button onClick={onClose} className="hidden sm:block p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto p-5">
          {fields}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
          <button onClick={handleSaveClick} className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm hover:bg-primary-600 transition-colors">저장</button>
        </div>
      </div>
    </div>
  );
}

// ─── Request Modal ────────────────────────────────────────────────────────────

function RequestModal({ post, user, onSubmit, onClose }: {
  post: SharingPost;
  user: { id: string; name?: string; role?: string };
  onSubmit: (msg: string) => void;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">나눔 신청하기</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-primary-50 rounded-2xl p-3.5">
            <p className="text-xs text-primary-600 font-semibold mb-0.5">{TYPE_LABELS[post.type]}</p>
            <p className="font-bold text-gray-900 text-sm">{post.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{post.churchName}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">신청자</label>
            <p className="px-3.5 py-3 bg-gray-50 rounded-xl text-sm text-gray-700">{user.name || '(이름 없음)'}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">신청 메시지</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="신청 사유나 사용 목적을 간략히 작성해주세요." rows={4}
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none resize-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
          <button onClick={() => { if (!msg.trim()) return; onSubmit(msg); }}
            className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-primary-600">
            <HeartHandshake className="w-4 h-4" /> 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Modal ────────────────────────────────────────────────────────────

function MessageModal({ post, user: _user, onSubmit, onClose }: {
  post: SharingPost;
  user: { id: string; name?: string };
  onSubmit: (msg: string) => void;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState('');
  const prevMessages = getAllMessages(post.id);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">문의하기</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Previous messages */}
          {prevMessages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">이전 문의</p>
              {prevMessages.slice(0, 5).map(m => (
                <div key={m.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">{m.senderName}</span>
                    <span className="text-[10px] text-gray-400">{m.senderChurchName}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{m.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{m.message}</p>
                </div>
              ))}
            </div>
          )}
          {/* New message */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">문의 내용</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="문의하실 내용을 작성해주세요." rows={4}
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none resize-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
          <button onClick={() => { if (!msg.trim()) return; onSubmit(msg); }}
            className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-primary-600">
            <Send className="w-4 h-4" /> 전송하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Request List ─────────────────────────────────────────────────────────────

const REQ_STATUS_LABELS: Record<SharingRequest['status'], string> = {
  requested: '신청중', reviewing: '확인중', connected: '연결완료', cancelled: '취소',
};
const REQ_STATUS_COLORS: Record<SharingRequest['status'], string> = {
  requested: 'bg-blue-100 text-blue-700', reviewing: 'bg-amber-100 text-amber-700',
  connected: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-gray-100 text-gray-500',
};

function RequestListModal({ post, onClose }: { post: SharingPost; onClose: () => void }) {
  const [requests, setRequests] = useState(() => getAllRequests(post.id));

  const handleStatus = (id: string, status: SharingRequest['status']) => {
    updateRequestStatus(id, status);
    setRequests(getAllRequests(post.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-gray-900">신청자 목록 ({requests.length})</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {requests.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">아직 신청자가 없습니다</p>
            </div>
          ) : requests.map(r => (
            <div key={r.id} className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-sm text-gray-900">{r.requesterName}</p>
                  <p className="text-xs text-gray-500">{r.requesterChurchName}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${REQ_STATUS_COLORS[r.status]}`}>
                  {REQ_STATUS_LABELS[r.status]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{r.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{r.createdAt.slice(0, 10)}</span>
                <div className="flex gap-1">
                  {(['requested', 'reviewing', 'connected', 'cancelled'] as const).map(s => (
                    <button key={s} onClick={() => handleStatus(r.id, s)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                        r.status === s ? REQ_STATUS_COLORS[s] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {REQ_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-gray-900 text-white rounded-2xl text-sm font-semibold shadow-xl">
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewState = 'list' | 'detail' | 'create' | 'edit';

export default function ChurchSharingPage() {
  const { user, isAdmin } = useAuth();
  const { isMobile } = useBreakpoint();
  const isPastor = user?.role === 'pastor';
  const canCreate = isAdmin || isPastor;

  const [view, setView] = useState<ViewState>('list');
  const [posts, setPosts] = useState<SharingPost[]>(() => getAllPosts());
  const [selected, setSelected] = useState<SharingPost | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SharingSearchFilter>(EMPTY_SHARING_FILTER);
  const [draftFilter, setDraftFilter] = useState<SharingSearchFilter>(EMPTY_SHARING_FILTER);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showRequestList, setShowRequestList] = useState(false);
  const [toast, setToast] = useState('');

  const [viewMode, setViewModeState] = useState<ContentViewMode>(() =>
    readStoredViewMode('sharing', 'card'),
  );
  const setViewMode = (mode: ContentViewMode) => {
    setViewModeState(mode);
    writeStoredViewMode('sharing', mode);
  };

  const listScrollRef = useRef(0);

  const refreshPosts = () => setPosts(getAllPosts());

  const canEditPost = (p: SharingPost) => isAdmin || (isPastor && p.writerId === user?.id);
  const canCompletePost = (p: SharingPost) => isAdmin || p.writerId === user?.id;
  const canViewRequests = (p: SharingPost) => isAdmin || p.writerId === user?.id;

  const allCategories = useMemo(
    () => Array.from(new Set(posts.map(p => p.category))),
    [posts],
  );

  const filtered = useMemo(
    () =>
      posts
        .filter(p => sharingMatchesTab(p, activeTab))
        .filter(p => sharingMatchesDetailFilter(p, searchFilter))
        .sort(sortSharingPosts),
    [posts, activeTab, searchFilter],
  );

  const captureListScroll = useCallback(() => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  const restoreListScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: 'auto' });
    });
  }, []);

  const setKeyword = (keyword: string) => {
    setSearchFilter({ ...searchFilter, keyword });
    setDraftFilter({ ...draftFilter, keyword });
  };

  const handleDraftChange = (f: SharingSearchFilter) => {
    setDraftFilter(f);
    if (f.keyword !== searchFilter.keyword) {
      setSearchFilter({ ...searchFilter, keyword: f.keyword });
    }
  };

  const resetFilters = () => {
    setSearchFilter(EMPTY_SHARING_FILTER);
    setDraftFilter(EMPTY_SHARING_FILTER);
    setShowSearch(false);
  };

  const handleOpen = (p: SharingPost) => {
    captureListScroll();
    setSelected(p);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelected(null);
    restoreListScroll();
  };

  const handleSave = (data: FormState) => {
    if (view === 'edit' && selected) {
      updatePost(selected.id, { ...data });
      refreshPosts();
      const updated = getAllPosts().find(p => p.id === selected.id) ?? null;
      setSelected(updated);
      setView('detail');
    } else {
      addPost({
        ...data,
        churchId:   user?.id ?? 'demo',
        churchName: '우리교회',
        writerId:   user?.id ?? 'demo',
        writerName: user?.name ?? '관리자',
        writerRole: user?.position ?? (isAdmin ? '최고관리자' : isPastor ? '교역자' : '성도'),
        status:     'active',
      });
      refreshPosts();
      setView('list');
    }
    setToast(view === 'edit' ? '나눔 게시물이 수정되었습니다.' : '나눔 게시물이 등록되었습니다.');
  };

  const handleDelete = () => {
    if (!selected) return;
    deletePost(selected.id);
    refreshPosts();
    setDeleteConfirm(null);
    handleBack();
    setToast('삭제되었습니다.');
  };

  const handleComplete = () => {
    if (!selected) return;
    updatePost(selected.id, { status: 'completed' });
    refreshPosts();
    const updated = getAllPosts().find(p => p.id === selected.id) ?? null;
    setSelected(updated);
    setToast('완료 처리되었습니다.');
  };

  const handleRequest = (msg: string) => {
    if (!selected || !user) return;
    addRequest({
      postId: selected.id,
      requesterChurchId: user.id,
      requesterChurchName: '우리교회',
      requesterId: user.id,
      requesterName: user.name ?? '(이름 없음)',
      message: msg,
      status: 'requested',
    });
    setShowRequest(false);
    setToast('나눔 신청이 접수되었습니다.');
  };

  const handleMessage = (msg: string) => {
    if (!selected || !user) return;
    addMessage({
      postId: selected.id,
      senderId: user.id,
      senderName: user.name ?? '(이름 없음)',
      senderChurchName: '우리교회',
      message: msg,
    });
    setShowMessage(false);
    setToast('문의가 전송되었습니다.');
  };

  // ── Detail / Form views ───────────────────────────────────────────────────
  const saveTriggerRef = React.useRef<(() => void) | null>(null);

  if ((view === 'create' || view === 'edit') && canCreate) {
    const formInitial = view === 'edit' && selected ? {
      type: selected.type, category: selected.category, title: selected.title,
      content: selected.content, location: selected.location,
      images: selected.images, files: selected.files,
    } : undefined;

    return (
      <>
        <ContentEditorLayout
          title={view === 'edit' ? '나눔 수정' : '나눔 등록'}
          onBack={() => setView(view === 'edit' && selected ? 'detail' : 'list')}
          saveButton={
            <button
              onClick={() => saveTriggerRef.current?.()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-[#1A1A1A] rounded-[18px] text-sm font-bold transition-colors"
            >
              <Save className="w-4 h-4" /> 저장
            </button>
          }
        >
          <PostForm
            initial={formInitial}
            onSave={handleSave}
            onClose={() => setView(view === 'edit' && selected ? 'detail' : 'list')}
            isInline
            saveTriggerRef={saveTriggerRef}
          />
        </ContentEditorLayout>
        {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      </>
    );
  }

  if (view === 'detail' && selected) {
    return (
      <>
        <DetailView
          post={selected}
          canEdit={canEditPost(selected)}
          canComplete={canCompletePost(selected)}
          canViewRequests={canViewRequests(selected)}
          onBack={handleBack}
          onEdit={() => setView('edit')}
          onDelete={() => setDeleteConfirm(selected.id)}
          onComplete={handleComplete}
          onRequest={() => setShowRequest(true)}
          onMessage={() => setShowMessage(true)}
          onViewRequests={() => setShowRequestList(true)}
        />
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="나눔 삭제"
          description="이 나눔 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          variant="danger"
        />
        {showRequest && user && (
          <RequestModal post={selected} user={user} onSubmit={handleRequest} onClose={() => setShowRequest(false)} />
        )}
        {showMessage && user && (
          <MessageModal post={selected} user={user} onSubmit={handleMessage} onClose={() => setShowMessage(false)} />
        )}
        {showRequestList && (
          <RequestListModal post={selected} onClose={() => setShowRequestList(false)} />
        )}
        {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      </>
    );
  }

  const requestCounts = Object.fromEntries(
    filtered.map(p => [p.id, getAllRequests(p.id).length]),
  );
  const messageCounts = Object.fromEntries(
    filtered.map(p => [p.id, getAllMessages(p.id).length]),
  );

  return (
    <div className="space-y-5 pb-24 md:pb-8 max-w-[900px] mx-auto">
      <PageHeaderBar
        title="교회나눔"
        description="교회와 교회가 필요한 것을 나누고 함께 성장합니다."
        action={
          canCreate ? (
            <button
              type="button"
              onClick={() => setView('create')}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              나눔 작성
            </button>
          ) : undefined
        }
        mobileFab={canCreate ? { label: '나눔 작성', onClick: () => setView('create') } : undefined}
      />

      <ContentListToolbar
        search={searchFilter.keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="검색어를 입력하세요"
        onOpenDetailSettings={() => {
          if (!showSearch) setDraftFilter(searchFilter);
          setShowSearch(s => !s);
        }}
        detailSettingsActive={showSearch}
        activeFilterCount={countSharingDetailFilters(searchFilter)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {showSearch && isMobile && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[24px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-bold text-gray-900">상세설정</h3>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <SharingSearchPanel
              asSheet
              categories={allCategories}
              value={draftFilter}
              onChange={handleDraftChange}
              onApply={() => {
                setSearchFilter(draftFilter);
                setShowSearch(false);
              }}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      {showSearch && !isMobile && (
        <SharingSearchPanel
          categories={allCategories}
          value={draftFilter}
          onChange={handleDraftChange}
          onApply={() => {
            setSearchFilter(draftFilter);
            setShowSearch(false);
          }}
          onReset={resetFilters}
        />
      )}

      {isSharingFilterActive(searchFilter) && !showSearch && (
        <SharingFilterChips
          filter={searchFilter}
          onChange={f => {
            setSearchFilter(f);
            setDraftFilter(f);
          }}
        />
      )}

      <TabBar active={activeTab} onChange={setActiveTab} />

      <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
        <HeartHandshake className="w-3.5 h-3.5" />
        <span>나눔 <strong className="text-gray-700">{filtered.length}</strong>건</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="나눔이 없습니다"
          description="등록된 나눔이 없거나 검색 조건에 맞는 항목이 없습니다."
        />
      ) : viewMode === 'list' ? (
        <div className={CONTENT_LIST_SHELL_CLASS}>
          {filtered.map(p => (
            <div key={p.id} className="px-4">
              <SharingListRow
                post={p}
                requestCount={requestCounts[p.id] ?? 0}
                messageCount={messageCounts[p.id] ?? 0}
                canManage={canEditPost(p)}
                onOpen={() => handleOpen(p)}
                onEdit={() => { setSelected(p); setView('edit'); }}
                onDelete={() => setDeleteConfirm(p.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={CONTENT_CARD_GRID_CLASS}>
          {filtered.map(p => (
            <SharingGridCard
              key={p.id}
              post={p}
              requestCount={requestCounts[p.id] ?? 0}
              messageCount={messageCounts[p.id] ?? 0}
              canManage={canEditPost(p)}
              onOpen={() => handleOpen(p)}
              onEdit={() => { setSelected(p); setView('edit'); }}
              onDelete={() => setDeleteConfirm(p.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          const target = posts.find(p => p.id === deleteConfirm);
          if (target) {
            deletePost(deleteConfirm);
            refreshPosts();
            if (selected?.id === deleteConfirm) handleBack();
            setToast('삭제되었습니다.');
          }
          setDeleteConfirm(null);
        }}
        title="나눔 삭제"
        description="이 나눔 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  );
}
