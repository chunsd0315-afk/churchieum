import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Plus, X, ChevronLeft, ChevronRight, HeartHandshake,
  MapPin, Tag, Calendar, MessageSquare, Users, Edit3, Trash2,
  CheckCircle, Image as ImageIcon, Paperclip,
  Send, ChevronDown, Save,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllPosts, addPost, updatePost, deletePost,
  getAllRequests, addRequest, updateRequestStatus,
  getAllMessages, addMessage,
  CATEGORIES, TYPE_LABELS, STATUS_LABELS,
  type SharingPost, type SharingRequest,
} from '../../services/sharingStorage';
import ContentEditorLayout from '../../components/layout/ContentEditorLayout';
import { PageHeaderBar } from '../../components/common/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = 'all' | SharingPost['type'] | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'give',     label: '나눔합니다' },
  { key: 'need',     label: '필요합니다' },
  { key: 'ministry', label: '사역도움' },
  { key: 'resource', label: '자료공유' },
  { key: 'event',    label: '행사초대' },
  { key: 'completed',label: '완료' },
];

const TYPE_COLORS: Record<SharingPost['type'], string> = {
  give:     'bg-orange-100 text-orange-700',
  need:     'bg-blue-100 text-blue-700',
  ministry: 'bg-green-100 text-green-700',
  resource: 'bg-purple-100 text-purple-700',
  event:    'bg-rose-100 text-rose-700',
};

const TYPE_GRADIENT: Record<SharingPost['type'], string> = {
  give:     'from-orange-400 to-amber-500',
  need:     'from-blue-400 to-blue-600',
  ministry: 'from-green-400 to-emerald-500',
  resource: 'from-purple-400 to-violet-500',
  event:    'from-rose-400 to-pink-500',
};

const STATUS_COLORS: Record<SharingPost['status'], string> = {
  active:    'bg-emerald-100 text-emerald-700',
  reserved:  'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-500',
};

const ALL_REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

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

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, requestCount, messageCount, onClick }: {
  post: SharingPost;
  requestCount: number;
  messageCount: number;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Thumbnail */}
        <div className={`w-24 shrink-0 bg-gradient-to-br ${TYPE_GRADIENT[post.type]} flex items-center justify-center relative`}>
          {post.images[0] ? (
            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <HeartHandshake className="w-8 h-8 text-white opacity-60" />
          )}
          {/* status badge overlay */}
          <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[post.status]}`}>
            {STATUS_LABELS[post.status]}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start gap-1.5 mb-1">
            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[post.type]}`}>
              {TYPE_LABELS[post.type]}
            </span>
            <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-1 flex-1">{post.title}</p>
          </div>
          <p className="text-xs text-gray-500 font-medium mb-0.5">{post.churchName}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{post.location}</span>
            <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />{post.category}</span>
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{post.createdAt.slice(0, 10)}</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />신청 {requestCount}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />문의 {messageCount}</span>
          </div>
        </div>
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
  const requests = getAllRequests(post.id);
  const messages = getAllMessages(post.id);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 font-bold text-gray-900 text-base truncate">{post.title}</h2>
        {canEdit && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-2 hover:bg-primary-50 text-primary-600 rounded-xl"><Edit3 className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Hero image / gradient */}
        <div className={`w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${TYPE_GRADIENT[post.type]} flex items-center justify-center`}>
          {post.images[0] ? (
            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <HeartHandshake className="w-16 h-16 text-white opacity-40" />
          )}
        </div>

        {/* Image gallery if multiple */}
        {post.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
            {post.images.slice(1).map((img, i) => (
              <img key={i} src={img} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0 border border-gray-100" />
            ))}
          </div>
        )}

        {/* Title + badges */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[post.type]}`}>{TYPE_LABELS[post.type]}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[post.status]}`}>{STATUS_LABELS[post.status]}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{post.category}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{post.title}</h1>
        </div>

        {/* Meta */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
          <Row icon={<MapPin className="w-4 h-4 text-gray-400" />} label="위치" value={post.location} />
          <Row icon={<HeartHandshake className="w-4 h-4 text-gray-400" />} label="교회" value={post.churchName} />
          <Row icon={<Tag className="w-4 h-4 text-gray-400" />} label="작성자" value={`${post.writerName} ${post.writerRole}`} />
          <Row icon={<Calendar className="w-4 h-4 text-gray-400" />} label="등록일" value={post.createdAt.slice(0, 10)} />
          <Row icon={<Users className="w-4 h-4 text-gray-400" />} label="신청" value={`${requests.length}건`} />
          <Row icon={<MessageSquare className="w-4 h-4 text-gray-400" />} label="문의" value={`${messages.length}건`} />
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>

        {/* Files */}
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

        {/* Action buttons */}
        <div className="space-y-2.5">
          {post.status !== 'completed' && (
            <button onClick={onRequest}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-opacity shadow-sm">
              <HeartHandshake className="w-5 h-5" /> 나눔 신청하기
            </button>
          )}
          <button onClick={onMessage}
            className="w-full py-3.5 border-2 border-primary-200 text-primary-600 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-primary-50 transition-colors">
            <MessageSquare className="w-4 h-4" /> 문의하기
          </button>
        </div>

        {/* Admin actions */}
        {(canComplete || canViewRequests) && (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">관리</p>
            <div className="flex gap-2 flex-wrap">
              {canViewRequests && (
                <button onClick={onViewRequests}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                  <Users className="w-4 h-4" /> 신청자 목록 ({requests.length})
                </button>
              )}
              {canComplete && post.status !== 'completed' && (
                <button onClick={onComplete}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-colors">
                  <CheckCircle className="w-4 h-4" /> 완료 처리
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
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
  const isPastor = user?.role === 'pastor';
  const canCreate = isAdmin || isPastor;

  const [view, setView] = useState<ViewState>('list');
  const [posts, setPosts] = useState<SharingPost[]>(() => getAllPosts());
  const [selected, setSelected] = useState<SharingPost | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showRequestList, setShowRequestList] = useState(false);
  const [toast, setToast] = useState('');

  const refreshPosts = () => setPosts(getAllPosts());

  const canEditPost = (p: SharingPost) => isAdmin || (isPastor && p.writerId === user?.id);
  const canCompletePost = (p: SharingPost) => isAdmin || p.writerId === user?.id;
  const canViewRequests = (p: SharingPost) => isAdmin || p.writerId === user?.id;

  const filtered = posts.filter(p => {
    if (activeTab === 'completed') return p.status === 'completed';
    if (activeTab !== 'all') return p.type === activeTab;
    return true;
  }).filter(p => {
    const q = search.toLowerCase();
    if (q && !([p.title, p.content, p.churchName, p.category, p.location, p.writerName]
      .some(v => v.toLowerCase().includes(q)))) return false;
    if (filterRegion && !p.location.includes(filterRegion)) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const allCategories = Array.from(new Set(posts.map(p => p.category)));

  const handleOpen = (p: SharingPost) => { setSelected(p); setView('detail'); };
  const handleBack = () => { setView('list'); setSelected(null); };

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
    if (!confirm('이 나눔 게시물을 삭제하시겠습니까?')) return;
    deletePost(selected.id);
    refreshPosts();
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
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
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
      <div className="min-h-screen bg-gray-50">
        <DetailView
          post={selected}
          canEdit={canEditPost(selected)}
          canComplete={canCompletePost(selected)}
          canViewRequests={canViewRequests(selected)}
          onBack={handleBack}
          onEdit={() => setView('edit')}
          onDelete={handleDelete}
          onComplete={handleComplete}
          onRequest={() => setShowRequest(true)}
          onMessage={() => setShowMessage(true)}
          onViewRequests={() => setShowRequestList(true)}
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
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  const requestCounts = Object.fromEntries(
    filtered.map(p => [p.id, getAllRequests(p.id).length])
  );
  const messageCounts = Object.fromEntries(
    filtered.map(p => [p.id, getAllMessages(p.id).length])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white pb-4">
        <PageHeaderBar
          title="교회나눔"
          description="교회와 교회가 필요한 것을 나누고 함께 성장합니다."
          action={
            canCreate ? (
              <button onClick={() => setView('create')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-colors shadow-sm shrink-0">
                <Plus className="w-4 h-4" /> 나눔 등록
              </button>
            ) : undefined
          }
          mobileFab={canCreate ? { label: '교회나눔 작성', onClick: () => setView('create') } : undefined}
        />

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="w-full pl-11 pr-9 bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            style={{ height: '44px', borderRadius: '14px' }} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
          {/* Region */}
          <div className="relative shrink-0">
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs bg-gray-100 rounded-xl text-gray-700 font-medium focus:outline-none cursor-pointer">
              <option value="">지역 전체</option>
              {ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          {/* Category */}
          <div className="relative shrink-0">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs bg-gray-100 rounded-xl text-gray-700 font-medium focus:outline-none cursor-pointer">
              <option value="">카테고리 전체</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          {/* Status */}
          <div className="relative shrink-0">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 text-xs bg-gray-100 rounded-xl text-gray-700 font-medium focus:outline-none cursor-pointer">
              <option value="">상태 전체</option>
              <option value="active">나눔중</option>
              <option value="reserved">확인중</option>
              <option value="completed">완료</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          {/* Active filter indicators */}
          {(filterRegion || filterCategory || filterStatus) && (
            <button onClick={() => { setFilterRegion(''); setFilterCategory(''); setFilterStatus(''); }}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 bg-red-50 rounded-xl font-medium">
              <X className="w-3 h-3" /> 초기화
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Post count */}
      <div className="px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-400">
        <HeartHandshake className="w-3.5 h-3.5" />
        <span>나눔 <strong className="text-gray-700">{filtered.length}</strong>건</span>
      </div>

      {/* Post list */}
      <div className="px-4 pb-10 space-y-2.5">
        {filtered.length > 0 ? (
          filtered.map(p => (
            <PostCard
              key={p.id}
              post={p}
              requestCount={requestCounts[p.id] ?? 0}
              messageCount={messageCounts[p.id] ?? 0}
              onClick={() => handleOpen(p)}
            />
          ))
        ) : (
          <div className="py-16 text-center">
            <HeartHandshake className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-400 text-sm">
              {search ? '검색 결과가 없습니다' : '등록된 나눔이 없습니다'}
            </p>
            {canCreate && !search && (
              <button onClick={() => setView('create')}
                className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors">
                나눔 등록하기
              </button>
            )}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  );
}
