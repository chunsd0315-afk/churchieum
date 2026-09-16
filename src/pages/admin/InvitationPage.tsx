/**
 * InvitationPage — 키즈노트 스타일 초대 관리
 * - 왼쪽: 소속/담당 범위 선택
 * - 오른쪽: 연락처 입력
 * - 하단: 초대장 보내기
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy, Check, Trash2, RefreshCw, X,
  MessageSquare, Share2, Clock, CheckCircle,
  Send, QrCode, Link,
  Users, UserCog, MapPin, Plus,
  AlertTriangle, Mail, ShieldCheck,
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useOrganizationTree } from '../../hooks/useOrganizationTree';
import { PageHeaderBar, ChurchList } from '../../components/common/ui';
import { OrganizationPickerField } from '../../components/common/organization';
import TabSection from '../../components/layout/TabSection';
import { useAuth } from '../../contexts/AuthContext';
import {
  filterOrganizationIdsByPermission,
  formatOrganizationSummary,
  resolveOrganizationChips,
} from '../../services/organizationSelection';

/* ── Types ── */
type MainTab = 'member' | 'clergy' | 'admin' | 'list';
type InviteStatus = '대기중' | '발송완료' | '가입완료' | '만료';
type ClergyPosition = '담임목사' | '목사' | '전도사' | '교육전도사' | '간사' | '직원' | '기타';
type MemberJikbun  = '장로' | '안수집사' | '권사' | '서리집사' | '성도' | '기타';

type InviteRow = {
  id: string;
  type: 'member' | 'clergy' | 'admin';
  name: string;
  phone: string;
  email: string;
  /** 성도 소속 조직 (조직관리 조직트리 기준 ID) */
  organizationIds?: string[];
  /** 교역자 담당 조직 (조직관리 조직트리 기준 ID) */
  assignedOrganizationIds?: string[];
  jikbun?: string;
  position?: string;
  // 레거시 초대 데이터 표시용 (신규 저장에는 사용하지 않음)
  districtName?: string;
  zoneName?: string;
  departmentName?: string;
  assignedDistrictNames?: string[];
  assignedDepartmentNames?: string[];
  code: string;
  status: InviteStatus;
  created_at: string;
};

const CLERGY_POSITIONS: ClergyPosition[] = ['담임목사', '목사', '전도사', '교육전도사', '간사', '직원', '기타'];
const MEMBER_JIKBUN: MemberJikbun[] = ['장로', '안수집사', '권사', '서리집사', '성도', '기타'];

const STATUS_STYLES: Record<InviteStatus, string> = {
  '대기중':   'bg-amber-50 text-amber-600 border border-amber-200',
  '발송완료': 'bg-blue-50 text-blue-600 border border-blue-200',
  '가입완료': 'bg-secondary-50 text-secondary-600 border border-secondary-200',
  '만료':     'bg-gray-50 text-gray-400 border border-gray-200',
};
const DEMO_INVITES: InviteRow[] = [
  { id: '1', type: 'member', name: '김민준', phone: '010-1234-5678', email: 'minjun@email.com', districtName: '1교구', zoneName: '1구역', departmentName: '청년부', jikbun: '성도', code: 'CHI-A7X3K', status: '가입완료', created_at: '2026-06-20' },
  { id: '2', type: 'member', name: '박서연', phone: '010-9876-5432', email: 'seoyeon@email.com', districtName: '2교구', zoneName: '3구역', departmentName: '여성부', jikbun: '권사', code: 'CHI-B9M2P', status: '발송완료', created_at: '2026-06-21' },
  { id: '3', type: 'clergy', name: '이준혁', phone: '010-5555-1111', email: 'pastor.lee@sfbc.kr', position: '목사', assignedDistrictNames: ['1교구', '2교구'], code: 'CHI-C4R7T', status: '대기중', created_at: '2026-06-22' },
  { id: '4', type: 'member', name: '최수빈', phone: '010-3333-2222', email: 'subin@email.com', districtName: '1교구', jikbun: '장로', code: 'CHI-D1N6W', status: '만료', created_at: '2026-06-10' },
  { id: '5', type: 'clergy', name: '정다은', phone: '010-7777-4444', email: 'daeeun@sfbc.kr', position: '전도사', assignedDepartmentNames: ['청년부'], code: 'CHI-E8S5Q', status: '발송완료', created_at: '2026-06-23' },
];

/** 초대 1건의 소속/담당 표시 — 저장된 organizationId를 현재 조직트리로 조회해 경로를 만든다 */
function useInviteOrgLabel() {
  const { organizations } = useOrganizationTree();
  return useCallback((inv: InviteRow): string => {
    const ids = inv.type === 'clergy' ? inv.assignedOrganizationIds : inv.organizationIds;
    const fromTree = formatOrganizationSummary(ids, organizations);
    if (fromTree) return fromTree;
    const legacy = inv.type === 'clergy'
      ? [...(inv.assignedDistrictNames ?? []), ...(inv.assignedDepartmentNames ?? [])].join(', ')
      : [inv.districtName, inv.zoneName, inv.departmentName].filter(Boolean).join(' · ');
    return legacy || (inv.type === 'clergy' ? '전체' : '-');
  }, [organizations]);
}

function generateCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'CHI-' + Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}

// ─── QR Visual ────────────────────────────────────────────────────────────────
function QrVisual({ code }: { code: string }) {
  const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const size = 21;
  const cells = Array.from({ length: size * size }, (_, i) => ((seed * (i + 7) * 31) % 97) < 45);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-32 h-32" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="white" />
      {([[0,0],[14,0],[0,14]] as [number,number][]).map(([ox,oy],fi) => (
        <g key={fi}><rect x={ox} y={oy} width={7} height={7} fill="#1e293b" /><rect x={ox+1} y={oy+1} width={5} height={5} fill="white" /><rect x={ox+2} y={oy+2} width={3} height={3} fill="#1e293b" /></g>
      ))}
      {cells.map((on, i) => {
        const r = Math.floor(i/size), cl = i%size;
        if ((r<8&&cl<8)||(r<8&&cl>=13)||(r>=13&&cl<8)||!on) return null;
        return <rect key={i} x={cl} y={r} width={1} height={1} fill="#1e293b" />;
      })}
    </svg>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ invite, onClose }: { invite: InviteRow; onClose: () => void }) {
  const [copied, setCopied] = useState<string|null>(null);
  const [showQr, setShowQr] = useState(false);

  const orgChips = resolveOrganizationChips(
    invite.type === 'clergy' ? invite.assignedOrganizationIds : invite.organizationIds,
  );
  const orgPathLabel = orgChips.filter(c => !c.missing).map(c => c.pathLabel).join(', ');

  const params = new URLSearchParams({
    code: invite.code, name: invite.name,
    inviteType: invite.type,
    ...(invite.type === 'member' ? {
      organizationIds: (invite.organizationIds ?? []).join(','),
      organizationPath: orgPathLabel,
      role: invite.jikbun ?? '성도',
    } : {
      position: invite.position ?? '',
      assignedOrganizationIds: (invite.assignedOrganizationIds ?? []).join(','),
      assignedOrganizationPath: orgPathLabel,
    }),
  });
  const url = `https://churchieum.app/invite?${params.toString()}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  };
  const smsMsg = `[교회이음] ${invite.name}님, 순복음성북교회에 초대합니다!\n가입 링크: ${url}`;
  const kakaoMsg = `${invite.name}님을 순복음성북교회로 초대합니다!\n${url}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500 to-secondary-500 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">초대장 공유</h3>
            <p className="text-sm opacity-80">{invite.name} · {
              invite.type === 'member'
                ? (invite.jikbun ?? '성도')
                : invite.type === 'admin'
                  ? '최고관리자'
                  : (invite.position ?? '교역자')
            }</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 mb-0.5">초대 코드</p>
              <p className="font-bold text-primary-700 tracking-widest">{invite.code}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{url}</p>
            </div>
            <button onClick={() => copy(url, 'url')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${copied==='url' ? 'bg-secondary-500 text-white' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}>
              {copied==='url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied==='url' ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'link', label: '초대 링크 복사', icon: Link, text: url, cls: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
              { key: 'sms',  label: '문자 초대',     icon: MessageSquare, text: smsMsg, cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { key: 'kakao',label: '카카오톡 공유', icon: Share2, text: kakaoMsg, cls: 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100' },
            ].map(({ key, label, icon: Icon, text, cls }) => (
              <button key={key} onClick={() => copy(text, key)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-medium text-sm transition-all ${copied===key ? 'bg-secondary-500 text-white' : cls}`}>
                {copied===key ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                {copied===key ? '복사됨!' : label}
              </button>
            ))}
            <button onClick={() => setShowQr(q => !q)}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-medium text-sm transition-all ${showQr ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
              <QrCode className="w-6 h-6" />{showQr ? 'QR 닫기' : 'QR코드 보기'}
            </button>
          </div>
          {showQr && (
            <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-4 gap-2">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200"><QrVisual code={invite.code} /></div>
              <p className="text-xs text-gray-400">스캔하면 초대 가입 화면으로 이동합니다</p>
            </div>
          )}
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl p-3">
            데모 버전: 링크·코드 복사만 작동합니다. 실제 문자·카카오톡 발송은 운영 환경에서 활성화됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── OrgEmpty Banner ──────────────────────────────────────────────────────────
function OrgEmptyBanner({ onNavigate }: { onNavigate?: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-amber-50 rounded-2xl border border-amber-200">
      <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
      <p className="font-bold text-gray-800 text-base mb-1">조직을 먼저 생성하세요</p>
      <p className="text-sm text-gray-500 mb-5">먼저 교구, 구역 또는 부서를 생성해 주세요.<br />조직이 있어야 초대 시 소속을 지정할 수 있습니다.</p>
      {onNavigate && (
        <button onClick={() => onNavigate('org')}
          className="px-6 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm hover:bg-primary-600 transition-colors shadow-sm">
          조직관리로 이동
        </button>
      )}
    </div>
  );
}

// ─── Org Selector ─────────────────────────────────────────────────────────────
// 소속 데이터는 설정 > 조직관리 > 조직트리를 단일 원본으로 사용한다.
// 초대관리에서는 organizationId만 저장하고, 표시 경로는 조직트리에서 조회한다.

// ─── Member Invite Panel ──────────────────────────────────────────────────────
function MemberInvitePanel({ onCreated }: { onCreated: (inv: InviteRow) => void }) {
  const { user } = useAuth();
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [entries, setEntries] = useState([{ name: '', phone: '', email: '', jikbun: '성도' as string, jikbun_custom: '' }]);
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [sent, setSent] = useState<InviteRow | null>(null);
  const { isDesktop } = useBreakpoint();

  const addEntry = () => setEntries(p => [...p, { name: '', phone: '', email: '', jikbun: '성도', jikbun_custom: '' }]);
  const removeEntry = (i: number) => setEntries(p => p.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, k: string, v: string) => setEntries(p => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e));

  const validate = () => {
    const errs: { [k: number]: string } = {};
    entries.forEach((e, i) => {
      if (!e.name.trim()) errs[i] = '이름을 입력해주세요';
      else if (!e.phone.trim()) errs[i] = '휴대폰 번호를 입력해주세요';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSend = () => {
    if (!validate()) return;
    const inv: InviteRow = {
      id: Date.now().toString(), type: 'member',
      name: entries[0].name, phone: entries[0].phone, email: entries[0].email,
      // 저장 시에도 권한 범위를 다시 확인한다
      organizationIds: filterOrganizationIdsByPermission(user, organizationIds),
      jikbun: entries[0].jikbun === '기타' ? (entries[0].jikbun_custom || '기타') : entries[0].jikbun,
      code: generateCode(), status: '대기중',
      created_at: new Date().toISOString().split('T')[0],
    };
    onCreated(inv); setSent(inv);
  };

  if (sent) return <ShareModal invite={sent} onClose={() => setSent(null)} />;

  const form = (
    <div className="flex flex-col gap-4">
      {/* Entries */}
      <div className="space-y-4">
        {entries.map((e, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 relative">
            {entries.length > 1 && (
              <button onClick={() => removeEntry(i)} className="absolute top-3 right-3 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            )}
            {entries.length > 1 && <p className="text-xs font-bold text-gray-400">{i + 1}번째 초대</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">이름 *</label>
                <input value={e.name} onChange={ev => updateEntry(i, 'name', ev.target.value)} placeholder="홍길동"
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-xl focus:ring-0 ${errors[i] && !e.name ? 'border-red-300' : 'border-gray-200 focus:border-primary-400'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">휴대폰 *</label>
                <input value={e.phone} onChange={ev => updateEntry(i, 'phone', ev.target.value)} placeholder="010-0000-0000"
                  className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-xl focus:ring-0 ${errors[i] && !e.phone ? 'border-red-300' : 'border-gray-200 focus:border-primary-400'}`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">이메일 (선택)</label>
              <input type="email" value={e.email} onChange={ev => updateEntry(i, 'email', ev.target.value)} placeholder="member@email.com"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">직분</label>
              <div className="grid grid-cols-3 gap-1.5">
                {MEMBER_JIKBUN.map(j => (
                  <button key={j} type="button" onClick={() => updateEntry(i, 'jikbun', j)}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${e.jikbun===j ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                    {j}
                  </button>
                ))}
              </div>
              {e.jikbun === '기타' && (
                <input value={e.jikbun_custom} onChange={ev => updateEntry(i, 'jikbun_custom', ev.target.value)} placeholder="직접 입력"
                  className="mt-2 w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-0" />
              )}
            </div>
            {errors[i] && <p className="text-xs text-red-500">{errors[i]}</p>}
          </div>
        ))}
      </div>
      {/* Add / Batch buttons */}
      <div className="flex gap-2">
        <button onClick={addEntry}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-primary-300 text-primary-600 rounded-xl text-xs font-semibold hover:bg-primary-50 transition-colors">
          <Plus className="w-3.5 h-3.5" /> 항목 추가
        </button>
      </div>
      {/* Selected org summary */}
      {organizationIds.length > 0 && (
        <div className="bg-[#FFF7D6] rounded-xl p-3 text-xs text-[#1A1A1A] flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>선택된 소속: {formatOrganizationSummary(organizationIds)}</p>
        </div>
      )}
      {/* Send button */}
      <button onClick={handleSend}
        className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 shadow-sm flex items-center justify-center gap-2 transition-colors">
        <Send className="w-4 h-4" /> 초대장 보내기
      </button>
    </div>
  );

  const orgCard = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary-500" /> 소속 선택
      </h3>
      <p className="text-xs text-gray-400 mb-3">조직관리에 등록된 조직트리에서 선택합니다. 여러 조직을 함께 선택할 수 있습니다.</p>
      <OrganizationPickerField
        label="소속"
        value={organizationIds}
        onChange={setOrganizationIds}
        mode="multiple"
        pickerTitle="소속 선택"
        pickerDescription="설정 > 조직관리에 등록된 조직에서 선택합니다."
        emptyText="아직 선택한 소속이 없습니다."
      />
    </div>
  );

  if (isDesktop) {
    return (
      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left: org selection */}
        <div className="sticky top-4">{orgCard}</div>
        {/* Right: form */}
        <div>{form}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orgCard}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" /> 초대 정보 입력
        </h3>
        {form}
      </div>
    </div>
  );
}

// ─── Clergy Invite Panel ──────────────────────────────────────────────────────
function ClergyInvitePanel({ onCreated }: { onCreated: (inv: InviteRow) => void }) {
  const { user } = useAuth();
  const [assignedOrganizationIds, setAssignedOrganizationIds] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', position: '전도사' as string, position_custom: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sent, setSent] = useState<InviteRow | null>(null);
  const { isDesktop } = useBreakpoint();

  const validate = () => {
    const e: { name?: string; phone?: string } = {};
    if (!form.name.trim()) e.name = '이름을 입력해주세요';
    if (!form.phone.trim()) e.phone = '휴대폰 번호를 입력해주세요';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSend = () => {
    if (!validate()) return;
    const pos = form.position === '기타' ? (form.position_custom || '기타') : form.position;
    const inv: InviteRow = {
      id: Date.now().toString(), type: 'clergy',
      name: form.name, phone: form.phone, email: form.email,
      position: pos,
      // 교역자는 "담당 조직" 의미를 그대로 유지한다
      assignedOrganizationIds: filterOrganizationIdsByPermission(user, assignedOrganizationIds),
      code: generateCode(), status: '대기중',
      created_at: new Date().toISOString().split('T')[0],
    };
    onCreated(inv); setSent(inv);
  };

  if (sent) return <ShareModal invite={sent} onClose={() => setSent(null)} />;

  const formEl = (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">이름 *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="홍길동"
              className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-xl focus:ring-0 ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-primary-400'}`} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">휴대폰 *</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000"
              className={`w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-xl focus:ring-0 ${errors.phone ? 'border-red-300' : 'border-gray-200 focus:border-primary-400'}`} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">이메일 (선택)</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="pastor@church.kr"
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">직분</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CLERGY_POSITIONS.map(p => (
              <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, position: p }))}
                className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.position===p ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                {p}
              </button>
            ))}
          </div>
          {form.position === '기타' && (
            <input value={form.position_custom} onChange={e => setForm(p => ({ ...p, position_custom: e.target.value }))} placeholder="직접 입력 (예: 선교사)"
              className="mt-2 w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-0" />
          )}
        </div>
      </div>
      {/* Assigned scope summary */}
      {assignedOrganizationIds.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
          <UserCog className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">담당 조직:</p>
            <p>{formatOrganizationSummary(assignedOrganizationIds)}</p>
          </div>
        </div>
      )}
      <button onClick={handleSend}
        className="w-full py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 shadow-sm flex items-center justify-center gap-2 transition-colors">
        <Send className="w-4 h-4" /> 초대장 보내기
      </button>
    </div>
  );

  const orgCard = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
        <UserCog className="w-4 h-4 text-amber-500" /> 담당 조직 선택
      </h3>
      <p className="text-xs text-gray-400 mb-3">조직관리에 등록된 조직트리에서 담당할 조직을 선택합니다.</p>
      <OrganizationPickerField
        label="담당 조직"
        value={assignedOrganizationIds}
        onChange={setAssignedOrganizationIds}
        mode="multiple"
        pickerTitle="담당 조직 선택"
        pickerDescription="설정 > 조직관리에 등록된 조직에서 선택합니다."
        emptyText="아직 선택한 담당 조직이 없습니다."
      />
    </div>
  );

  if (isDesktop) {
    return (
      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        <div className="sticky top-4">{orgCard}</div>
        <div>{formEl}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orgCard}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <UserCog className="w-4 h-4 text-amber-500" /> 초대 정보 입력
        </h3>
        {formEl}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
      <CheckCircle className="w-4 h-4 text-green-400" /> {message}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[350] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full">
        <p className="text-gray-800 font-semibold text-sm text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Invite List (초대중 탭) ──────────────────────────────────────────
const PENDING_STATUSES: InviteStatus[] = ['대기중', '발송완료'];

function PendingInviteList({ invites, onShare, onResend, onDelete }: {
  invites: InviteRow[];
  onShare: (i: InviteRow) => void;
  onResend: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { isDesktop } = useBreakpoint();

  const pending = invites.filter(i => PENDING_STATUSES.includes(i.status));

  const handleResend = (id: string) => {
    onResend(id);
    setToast('초대장이 재전송되었습니다.');
  };

  const handleDeleteConfirmed = () => {
    if (confirmId) {
      onDelete(confirmId);
      setConfirmId(null);
    }
  };

  const getOrgLabel = useInviteOrgLabel();

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {confirmId && (
        <ConfirmDialog
          message="이 초대장을 삭제하시겠습니까?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-gray-700">초대중 <span className="text-primary-600">{pending.length}</span>건</p>
        <p className="text-xs text-gray-400">대기중·발송완료 상태만 표시</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Mail className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-sm">초대중인 사람이 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">성도 또는 교역자 탭에서 초대장을 보내보세요.</p>
        </div>
      ) : isDesktop ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['이름', '휴대폰', '초대 유형', '소속/담당', '초대일', '상태', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pending.map(inv => {
                const orgLabel = getOrgLabel(inv);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">{inv.name[0]}</div>
                        <span className="font-semibold text-gray-900">{inv.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{inv.phone}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.type === 'clergy'
                          ? 'bg-amber-100 text-amber-700'
                          : inv.type === 'admin'
                            ? 'bg-[#FFF7D6] text-primary-800'
                            : 'bg-primary-100 text-primary-700'
                      }`}>
                        {inv.type === 'clergy'
                          ? (inv.position ?? '교역자')
                          : inv.type === 'admin'
                            ? '최고관리자'
                            : (inv.jikbun ?? '성도')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[160px]">
                      <p className="truncate">{orgLabel}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{inv.created_at}</td>
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full w-fit ${STATUS_STYLES[inv.status]}`}>
                        <Clock className="w-3 h-3" /> 초대중
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onShare(inv)}
                          className="p-1.5 hover:bg-primary-50 text-primary-600 rounded-lg" title="공유">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleResend(inv.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold">
                          <RefreshCw className="w-3 h-3" /> 재전송
                        </button>
                        <button onClick={() => setConfirmId(inv.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="삭제">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ChurchList>
          {pending.map(inv => {
            const orgLabel = getOrgLabel(inv);
            return (
              <div key={inv.id} className="px-4 py-3.5 bg-white">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 flex-shrink-0">{inv.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-gray-900">{inv.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.type === 'clergy'
                          ? 'bg-amber-100 text-amber-700'
                          : inv.type === 'admin'
                            ? 'bg-[#FFF7D6] text-primary-800'
                            : 'bg-primary-100 text-primary-700'
                      }`}>
                        {inv.type === 'clergy'
                          ? (inv.position ?? '교역자')
                          : inv.type === 'admin'
                            ? '최고관리자'
                            : (inv.jikbun ?? '성도')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">초대중</span>
                    </div>
                    <p className="text-xs text-gray-500">{inv.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{orgLabel}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">초대일 {inv.created_at}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onShare(inv)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold hover:bg-primary-100">
                    <Share2 className="w-3.5 h-3.5" /> 공유
                  </button>
                  <button onClick={() => handleResend(inv.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100">
                    <RefreshCw className="w-3.5 h-3.5" /> 재전송
                  </button>
                  <button onClick={() => setConfirmId(inv.id)}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </ChurchList>
      )}
    </div>
  );
}

// ─── Admin Invite Panel ───────────────────────────────────────────────────────
function AdminInvitePanel({ onCreated }: { onCreated: (inv: InviteRow) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sent, setSent] = useState<InviteRow | null>(null);

  const handleSend = () => {
    const e: { name?: string; phone?: string } = {};
    if (!form.name.trim()) e.name = '이름을 입력해주세요';
    if (!form.phone.trim()) e.phone = '휴대폰 번호를 입력해주세요';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const inv: InviteRow = {
      id: Date.now().toString(),
      type: 'admin',
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      code: generateCode(),
      status: '대기중',
      created_at: new Date().toISOString().split('T')[0],
    };
    onCreated(inv);
    setSent(inv);
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <CheckCircle className="w-10 h-10 text-secondary-500 mx-auto mb-3" />
        <p className="font-bold text-gray-900 mb-1">최고관리자 초대가 생성되었습니다</p>
        <p className="text-sm text-gray-500 mb-4">초대 코드: <span className="font-mono font-bold">{sent.code}</span></p>
        <button
          type="button"
          onClick={() => { setSent(null); setForm({ name: '', phone: '', email: '' }); }}
          className="text-sm font-semibold text-primary-700 hover:underline"
        >
          추가 초대하기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 max-w-lg">
      <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary-600" /> 최고관리자 초대
      </h3>
      <p className="text-xs text-gray-400 mb-4">이름·휴대전화만 입력하고 초대 링크를 전달합니다.</p>
      <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
      <input
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full mb-1 px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
        placeholder="이름"
      />
      {errors.name && <p className="text-xs text-red-500 mb-2">{errors.name}</p>}
      <label className="block text-xs font-semibold text-gray-500 mb-1 mt-2">휴대전화번호</label>
      <input
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        className="w-full mb-1 px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
        placeholder="010-0000-0000"
      />
      {errors.phone && <p className="text-xs text-red-500 mb-2">{errors.phone}</p>}
      <label className="block text-xs font-semibold text-gray-500 mb-1 mt-2">이메일 (선택)</label>
      <input
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        className="w-full mb-4 px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
        placeholder="email@church.kr"
      />
      <button
        type="button"
        onClick={handleSend}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-[#1A1A1A] font-bold rounded-2xl hover:bg-primary-600 text-sm min-h-[48px]"
      >
        <Send className="w-4 h-4" /> 초대 보내기
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
type Props = { onNavigate?: (p: string) => void };

export default function InvitationPage({ onNavigate }: Props) {
  const [tab, setTab] = useState<MainTab>('member');
  const [invites, setInvites] = useState<InviteRow[]>(DEMO_INVITES);
  const [sharingInvite, setSharingInvite] = useState<InviteRow | null>(null);
  // 조직관리 조직트리를 그대로 사용 — 조직 추가·수정·삭제가 새로고침 없이 반영된다
  const { tree } = useOrganizationTree();
  const hasOrg = useMemo(
    () => tree.some(root => root.children.length > 0) || tree.length > 1,
    [tree],
  );

  const pendingCount = invites.filter(i => PENDING_STATUSES.includes(i.status)).length;

  const handleCreated = useCallback((inv: InviteRow) => {
    setInvites(p => [inv, ...p]);
    setTab('list');
  }, []);
  const handleDelete = (id: string) => setInvites(p => p.filter(i => i.id !== id));
  const handleResend = (id: string) => setInvites(p => p.map(i =>
    i.id === id ? { ...i, status: '발송완료' as InviteStatus } : i
  ));

  const TABS: { id: MainTab; label: string; icon: import('../../types/icons').NavIcon; badge?: number }[] = [
    { id: 'member', label: '성도', icon: Users, badge: undefined },
    { id: 'clergy', label: '교역자', icon: UserCog, badge: undefined },
    { id: 'admin', label: '최고관리자', icon: ShieldCheck, badge: undefined },
    { id: 'list', label: '초대중', icon: Mail, badge: pendingCount },
  ];

  return (
    <div className="space-y-5 max-w-5xl pb-8">
      <PageHeaderBar
        title="초대관리"
        description="초대할 대상을 선택하세요. 교역자·성도·최고관리자를 초대하고 현황을 관리합니다."
      />
      <TabSection
        tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon, badge: t.badge }))}
        activeTab={tab}
        onTabChange={id => setTab(id as MainTab)}
      />

      {/* No org warning */}
      {!hasOrg && (tab === 'member' || tab === 'clergy') && (
        <OrgEmptyBanner onNavigate={onNavigate} />
      )}

      {tab === 'member' && hasOrg && <MemberInvitePanel onCreated={handleCreated} />}
      {tab === 'clergy' && hasOrg && <ClergyInvitePanel onCreated={handleCreated} />}
      {tab === 'admin' && <AdminInvitePanel onCreated={handleCreated} />}
      {tab === 'list' && (
        <PendingInviteList
          invites={invites}
          onShare={setSharingInvite}
          onResend={handleResend}
          onDelete={handleDelete}
        />
      )}

      {sharingInvite && <ShareModal invite={sharingInvite} onClose={() => setSharingInvite(null)} />}
    </div>
  );
}
