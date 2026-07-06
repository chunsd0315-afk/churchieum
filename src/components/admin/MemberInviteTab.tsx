import { useState, useCallback } from 'react';
import {
  UserPlus, Link, Copy, Check, Send, Trash2,
  RefreshCw, X, MessageSquare, Share2, Clock,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  Smartphone, Globe,
} from 'lucide-react';

type Role = '담임목사' | '교역자' | '장로' | '부서장' | '교사' | '성도';
type InviteStatus = '대기중' | '발송완료' | '가입완료' | '만료';

type Invite = {
  id: string;
  name: string;
  phone: string;
  church: string;
  district: string;
  area: string;
  department: string;
  role: Role;
  code: string;
  status: InviteStatus;
  created_at: string;
  method: string;
};

const ROLES: Role[] = ['담임목사', '교역자', '장로', '부서장', '교사', '성도'];

const ROLE_COLORS: Record<Role, string> = {
  '담임목사': 'bg-amber-100 text-amber-700',
  '교역자':   'bg-violet-100 text-violet-700',
  '장로':     'bg-blue-100 text-blue-700',
  '부서장':   'bg-teal-100 text-teal-700',
  '교사':     'bg-green-100 text-green-700',
  '성도':     'bg-gray-100 text-gray-600',
};

const STATUS_STYLES: Record<InviteStatus, string> = {
  '대기중':   'bg-amber-50 text-amber-600 border border-amber-200',
  '발송완료': 'bg-blue-50 text-blue-600 border border-blue-200',
  '가입완료': 'bg-secondary-50 text-secondary-600 border border-secondary-200',
  '만료':     'bg-gray-50 text-gray-400 border border-gray-200',
};

const STATUS_ICONS: Record<InviteStatus, React.ComponentType<{ className?: string }>> = {
  '대기중':   Clock,
  '발송완료': Send,
  '가입완료': CheckCircle,
  '만료':     AlertCircle,
};

const DEMO_INVITES: Invite[] = [
  { id: '1', name: '김민준', phone: '010-1234-5678', church: '순복음성북교회', district: '1교구', area: '1구역', department: '청년부', role: '성도', code: 'CHI-A7X3K', status: '가입완료', created_at: '2026-06-20', method: 'SMS' },
  { id: '2', name: '박서연', phone: '010-9876-5432', church: '순복음성북교회', district: '2교구', area: '3구역', department: '여성부', role: '교사', code: 'CHI-B9M2P', status: '발송완료', created_at: '2026-06-21', method: '링크' },
  { id: '3', name: '이준혁', phone: '010-5555-1111', church: '순복음성북교회', district: '3교구', area: '2구역', department: '남성부', role: '장로', code: 'CHI-C4R7T', status: '대기중', created_at: '2026-06-22', method: 'QR' },
  { id: '4', name: '최수빈', phone: '010-3333-2222', church: '순복음성북교회', district: '1교구', area: '4구역', department: '주일학교', role: '부서장', code: 'CHI-D1N6W', status: '만료', created_at: '2026-06-10', method: 'SMS' },
  { id: '5', name: '정다은', phone: '010-7777-4444', church: '순복음성북교회', district: '2교구', area: '1구역', department: '찬양팀', role: '성도', code: 'CHI-E8S5Q', status: '발송완료', created_at: '2026-06-23', method: 'KakaoTalk' },
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CHI-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function QrVisual({ code }: { code: string }) {
  const seed = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const size = 21;
  const cells = Array.from({ length: size * size }, (_, i) => ((seed * (i + 7) * 31) % 97) < 45);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-36 h-36 mx-auto" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="white" />
      {[[0, 0], [14, 0], [0, 14]].map(([ox, oy], fi) => (
        <g key={fi}>
          <rect x={ox} y={oy} width={7} height={7} fill="#1e293b" />
          <rect x={ox + 1} y={oy + 1} width={5} height={5} fill="white" />
          <rect x={ox + 2} y={oy + 2} width={3} height={3} fill="#1e293b" />
        </g>
      ))}
      {cells.map((on, i) => {
        const row = Math.floor(i / size), col = i % size;
        const inFinder = (row < 8 && col < 8) || (row < 8 && col >= 13) || (row >= 13 && col < 8);
        if (inFinder || !on) return null;
        return <rect key={i} x={col} y={row} width={1} height={1} fill="#1e293b" />;
      })}
    </svg>
  );
}

type FormData = {
  name: string; phone: string; church: string;
  district: string; area: string; department: string; role: Role;
};

const EMPTY_FORM: FormData = {
  name: '', phone: '', church: '순복음성북교회',
  district: '', area: '', department: '', role: '성도',
};

const DISTRICTS = ['1교구', '2교구', '3교구', '4교구', '5교구'];
const AREAS = ['1구역', '2구역', '3구역', '4구역', '5구역', '6구역'];
const DEPARTMENTS = ['청년부', '여성부', '남성부', '주일학교', '찬양팀', '선교부', '기도부', '봉사부'];

/* ── Share Modal ── */
function ShareModal({
  invite, onClose,
}: {
  invite: Invite;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const url = `https://churchieum.app/invite?code=${invite.code}&name=${encodeURIComponent(invite.name)}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const smsText = `[교회이음] ${invite.name}님, 순복음성북교회에 초대합니다!\n아래 링크에서 가입해주세요 👇\n${url}\n초대코드: ${invite.code}`;
  const kakaoText = `${invite.name}님을 ${invite.church}에 초대합니다! 교회이음 앱에서 가입하시면 교회 정보가 자동 연결됩니다.\n초대링크: ${url}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500 to-secondary-500 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">초대 공유</h3>
            <p className="text-sm opacity-80">{invite.name} · {invite.role}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Invite code */}
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">초대 코드</p>
            <p className="text-2xl font-bold tracking-widest text-primary-700">{invite.code}</p>
            <p className="text-xs text-gray-400 mt-1 font-mono break-all">{url}</p>
          </div>

          {/* Share buttons grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Copy link */}
            <button
              onClick={() => copy(url, 'url')}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-medium text-sm transition-all ${
                copied === 'url' ? 'bg-secondary-500 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {copied === 'url' ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied === 'url' ? '복사됨!' : '링크 복사'}
            </button>

            {/* Copy SMS text */}
            <button
              onClick={() => copy(smsText, 'sms')}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-medium text-sm transition-all ${
                copied === 'sms' ? 'bg-secondary-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {copied === 'sms' ? <Check className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
              {copied === 'sms' ? '복사됨!' : '문자 내용 복사'}
            </button>

            {/* KakaoTalk */}
            <button
              onClick={() => copy(kakaoText, 'kakao')}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-medium text-sm transition-all ${
                copied === 'kakao' ? 'bg-secondary-500 text-white' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
              }`}
            >
              {copied === 'kakao' ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
              {copied === 'kakao' ? '복사됨!' : '카카오톡 공유'}
            </button>

            {/* Copy code only */}
            <button
              onClick={() => copy(invite.code, 'code')}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-medium text-sm transition-all ${
                copied === 'code' ? 'bg-secondary-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {copied === 'code' ? <Check className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              {copied === 'code' ? '복사됨!' : '코드만 복사'}
            </button>
          </div>

          {/* QR */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">QR 코드</p>
            <QrVisual code={invite.code} />
            <p className="text-xs text-center text-gray-400 mt-2">스캔하면 가입 화면으로 이동합니다</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
            <p>데모 버전: 링크/코드 복사만 작동합니다. 실제 문자·카카오톡 발송은 운영 환경에서 활성화됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── New Invite Form Modal ── */
function InviteFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (invite: Invite) => void;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [step, setStep] = useState<'form' | 'share'>('form');
  const [created, setCreated] = useState<Invite | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const f = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = '이름을 입력해주세요';
    if (!form.phone.trim()) e.phone = '휴대폰 번호를 입력해주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const invite: Invite = {
      id: Date.now().toString(),
      ...form,
      code: generateCode(),
      status: '대기중',
      created_at: new Date().toISOString().split('T')[0],
      method: '링크',
    };
    setCreated(invite);
    onCreated(invite);
    setStep('share');
  };

  if (step === 'share' && created) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-secondary-500 to-primary-600 px-5 py-4 text-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">초대장이 생성되었습니다!</h3>
              <p className="text-sm opacity-80">아래 방법으로 초대 링크를 공유하세요</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5">
            <div className="bg-secondary-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-secondary-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-900">{created.name}</p>
                <p className="text-sm text-gray-500">{created.role} · {created.church}</p>
                <p className="text-xs font-mono text-secondary-600 mt-0.5">{created.code}</p>
              </div>
            </div>
            <ShareModalContent invite={created} onDone={onClose} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">교인 초대</h3>
              <p className="text-xs text-gray-400">초대 정보를 입력하세요</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">이름 *</label>
              <input
                type="text" value={form.name} onChange={e => f('name', e.target.value)}
                placeholder="홍길동"
                className={`w-full px-3.5 py-3 text-sm bg-gray-50 border rounded-xl focus:ring-0 ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary-400'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">휴대폰 번호 *</label>
              <input
                type="tel" value={form.phone} onChange={e => f('phone', e.target.value)}
                placeholder="010-0000-0000"
                className={`w-full px-3.5 py-3 text-sm bg-gray-50 border rounded-xl focus:ring-0 ${errors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary-400'}`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Church */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">소속 교회</label>
            <input
              type="text" value={form.church} onChange={e => f('church', e.target.value)}
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0"
            />
          </div>

          {/* District + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">교구</label>
              <select value={form.district} onChange={e => f('district', e.target.value)}
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                <option value="">선택 안함</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">구역</label>
              <select value={form.area} onChange={e => f('area', e.target.value)}
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                <option value="">선택 안함</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Department + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">부서</label>
              <select value={form.department} onChange={e => f('department', e.target.value)}
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                <option value="">선택 안함</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">권한</label>
              <select value={form.role} onChange={e => f('role', e.target.value as Role)}
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Role badge preview */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <span className="text-xs text-gray-500">권한 미리보기:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[form.role]}`}>{form.role}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors text-sm">
              취소
            </button>
            <button type="button" onClick={handleCreate}
              className="flex-1 py-3.5 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
              <Link className="w-4 h-4" /> 초대링크 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline share content (used after creation) ── */
function ShareModalContent({ invite, onDone }: { invite: Invite; onDone: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const url = `https://churchieum.app/invite?code=${invite.code}&name=${encodeURIComponent(invite.name)}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => copy(url, 'url')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${copied === 'url' ? 'bg-secondary-500 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}>
          {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === 'url' ? '복사됨!' : '링크 복사'}
        </button>
        <button onClick={() => copy(`[교회이음] ${invite.name}님, ${invite.church} 초대합니다!\n${url}`, 'sms')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${copied === 'sms' ? 'bg-secondary-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
          {copied === 'sms' ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          {copied === 'sms' ? '복사됨!' : '문자 내용'}
        </button>
        <button onClick={() => copy(`${invite.name}님을 ${invite.church}에 초대합니다! 교회이음: ${url}`, 'kakao')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${copied === 'kakao' ? 'bg-secondary-500 text-white' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'}`}>
          {copied === 'kakao' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied === 'kakao' ? '복사됨!' : '카카오톡'}
        </button>
        <button onClick={() => copy(invite.code, 'code')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${copied === 'code' ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          {copied === 'code' ? <Check className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          {copied === 'code' ? '복사됨!' : '코드 복사'}
        </button>
      </div>
      <button onClick={onDone}
        className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
        닫기
      </button>
    </div>
  );
}

/* ── Invite Row ── */
function InviteRow({
  invite,
  onShare,
  onResend,
  onDelete,
}: {
  invite: Invite;
  onShare: () => void;
  onResend: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = STATUS_ICONS[invite.status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700">
          {invite.name.charAt(0)}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{invite.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[invite.role]}`}>{invite.role}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{invite.phone}</p>
        </div>

        {/* Status + toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[invite.status]}`}>
            <StatusIcon className="w-3 h-3" />
            {invite.status}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            {[
              ['소속 교회', invite.church],
              ['교구', invite.district || '-'],
              ['구역', invite.area || '-'],
              ['부서', invite.department || '-'],
              ['초대 코드', invite.code],
              ['초대일', invite.created_at],
              ['발송 방법', invite.method],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-xl px-3 py-2">
                <p className="text-gray-400">{label}</p>
                <p className="font-semibold text-gray-700 font-mono mt-0.5 text-xs">{value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {invite.status !== '가입완료' && (
              <>
                <button
                  onClick={onShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> 공유
                </button>
                {invite.status !== '만료' && (
                  <button
                    onClick={onResend}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 다시 보내기
                  </button>
                )}
              </>
            )}
            <button
              onClick={onDelete}
              className="py-2.5 px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Export ── */
export default function MemberInviteTab({ targetType = 'member' }: { targetType?: 'member' | 'staff' }) {
  const [invites, setInvites] = useState<Invite[]>(DEMO_INVITES);
  const [showForm, setShowForm] = useState(false);
  const [sharingInvite, setSharingInvite] = useState<Invite | null>(null);
  const [filterStatus, setFilterStatus] = useState<InviteStatus | 'all'>('all');
  const [resent, setResent] = useState<string | null>(null);
  const isStaff = targetType === 'staff';

  const filtered = filterStatus === 'all' ? invites : invites.filter(i => i.status === filterStatus);

  const statusCounts: Record<InviteStatus | 'all', number> = {
    all: invites.length,
    '대기중': invites.filter(i => i.status === '대기중').length,
    '발송완료': invites.filter(i => i.status === '발송완료').length,
    '가입완료': invites.filter(i => i.status === '가입완료').length,
    '만료': invites.filter(i => i.status === '만료').length,
  };

  const handleCreated = useCallback((invite: Invite) => {
    setInvites(prev => [invite, ...prev]);
  }, []);

  const handleDelete = (id: string) => {
    setInvites(prev => prev.filter(i => i.id !== id));
  };

  const handleResend = (id: string) => {
    setInvites(prev => prev.map(i => i.id === id ? { ...i, status: '발송완료' as InviteStatus } : i));
    setResent(id);
    setTimeout(() => setResent(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { key: 'all', label: '전체', color: 'text-gray-700' },
          { key: '대기중', label: '대기중', color: 'text-amber-600' },
          { key: '발송완료', label: '발송', color: 'text-blue-600' },
          { key: '가입완료', label: '완료', color: 'text-secondary-600' },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`rounded-2xl p-3 text-center transition-all ${
              filterStatus === s.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
            }`}
          >
            <p className={`text-xl font-bold ${filterStatus === s.key ? 'text-white' : s.color}`}>
              {statusCounts[s.key]}
            </p>
            <p className={`text-xs mt-0.5 ${filterStatus === s.key ? 'text-white/80' : 'text-gray-400'}`}>
              {s.label}
            </p>
          </button>
        ))}
      </div>

      {/* New invite button */}
      <button
        onClick={() => setShowForm(true)}
        className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-2xl transition-colors shadow-sm ${
          isStaff ? 'bg-secondary-500 hover:bg-secondary-600' : 'bg-primary-500 hover:bg-primary-600'
        }`}
      >
        <UserPlus className="w-5 h-5" /> {isStaff ? '교역자/직원 초대하기' : '교인 초대하기'}
      </button>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(invite => (
            <InviteRow
              key={invite.id}
              invite={resent === invite.id ? { ...invite, status: '발송완료' } : invite}
              onShare={() => setSharingInvite(invite)}
              onResend={() => handleResend(invite.id)}
              onDelete={() => handleDelete(invite.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <UserPlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">초대 내역이 없습니다</p>
          <p className="text-xs text-gray-300 mt-1">위 버튼을 눌러 교인을 초대해보세요</p>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <InviteFormModal onClose={() => setShowForm(false)} onCreated={handleCreated} />
      )}
      {sharingInvite && (
        <ShareModal invite={sharingInvite} onClose={() => setSharingInvite(null)} />
      )}
    </div>
  );
}
