import { useCallback, useEffect, useState } from 'react';
import { Crown, UserPlus, Shield, Mail, Phone, Link2, Copy, Check } from 'lucide-react';
import { PRIMARY_DEMO_ACCOUNTS, DEMO_ACCOUNT_IDS } from '../../../config/demoAccounts';
import { useAuth } from '../../../contexts/AuthContext';
import { ChurchButton } from '../../common/ui/ChurchButton';
import {
  getPrimarySuperAdminId,
  setPrimarySuperAdminId,
  getSuperAdminInvites,
  saveSuperAdminInvites,
  PRIMARY_SUPER_ADMIN_EVENT,
  type SuperAdminInvite,
} from '../../../services/superAdminSettingsStorage';

type AdminRow = {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
  isCurrent: boolean;
};

function genCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'ADM-' + Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}

export function SuperAdminManagementPanel() {
  const { user } = useAuth();
  const [primaryId, setPrimaryId] = useState(() => getPrimarySuperAdminId() ?? DEMO_ACCOUNT_IDS.admin);
  const [invites, setInvites] = useState<SuperAdminInvite[]>(() => getSuperAdminInvites());
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const sync = () => setPrimaryId(getPrimarySuperAdminId() ?? DEMO_ACCOUNT_IDS.admin);
    window.addEventListener(PRIMARY_SUPER_ADMIN_EVENT, sync);
    return () => window.removeEventListener(PRIMARY_SUPER_ADMIN_EVENT, sync);
  }, []);

  const baseAdmins: AdminRow[] = PRIMARY_DEMO_ACCOUNTS
    .filter(a => a.role === 'super_admin')
    .map(a => ({
      id: DEMO_ACCOUNT_IDS[a.key],
      name: a.name,
      position: a.position,
      email: a.email,
      isPrimary: (primaryId || DEMO_ACCOUNT_IDS.admin) === DEMO_ACCOUNT_IDS[a.key],
      isCurrent: user?.id === DEMO_ACCOUNT_IDS[a.key],
    }));

  const admins: AdminRow[] =
    user?.role === 'super_admin' && !baseAdmins.some(a => a.id === user.id)
      ? [
          {
            id: user.id,
            name: user.name,
            position: user.position ?? '최고관리자',
            email: user.email,
            phone: user.phone,
            isPrimary: primaryId === user.id,
            isCurrent: true,
          },
          ...baseAdmins,
        ]
      : baseAdmins;

  const pendingInvites = invites.filter(i => i.status === '초대 대기');

  const makePrimary = useCallback((id: string) => {
    setPrimarySuperAdminId(id);
    setPrimaryId(id);
    setToast('대표 최고관리자로 지정했습니다.');
    window.setTimeout(() => setToast(''), 2000);
  }, []);

  const sendInvite = () => {
    if (!inviteName.trim() || !invitePhone.trim()) {
      setToast('이름과 휴대전화를 입력해 주세요.');
      window.setTimeout(() => setToast(''), 2000);
      return;
    }
    const inv: SuperAdminInvite = {
      id: `sai-${Date.now()}`,
      name: inviteName.trim(),
      phone: invitePhone.trim(),
      email: inviteEmail.trim(),
      code: genCode(),
      status: '초대 대기',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = [inv, ...invites];
    setInvites(next);
    saveSuperAdminInvites(next);
    setShowInvite(false);
    setInviteName('');
    setInvitePhone('');
    setInviteEmail('');
    setToast('초대가 생성되었습니다. 링크를 복사해 전달하세요.');
    window.setTimeout(() => setToast(''), 2500);
  };

  const copyInvite = async (code: string) => {
    const url = `${window.location.origin}/invite/${code}?role=super_admin`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1500);
    } catch { /* ignore */ }
  };

  const cancelInvite = (id: string) => {
    const next = invites.filter(i => i.id !== id);
    setInvites(next);
    saveSuperAdminInvites(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1100px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">최고관리자 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            교회 전체를 관리할 최고관리자를 설정합니다. 기존 권한 구조(super_admin)는 그대로 유지됩니다.
          </p>
        </div>
        <ChurchButton icon={<UserPlus size={18} />} size="md" onClick={() => setShowInvite(true)}>
          최고관리자 초대
        </ChurchButton>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF7D6] text-[#1A1A1A] text-xs font-bold border border-primary-200">
          <Shield className="w-3.5 h-3.5" /> 최고관리자 {admins.length}명
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-gray-600 text-xs font-semibold border border-[#ECECEC]">
          초대 중 {pendingInvites.length}명
        </span>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2.5 rounded-[14px] bg-[#FFF7D6] border border-primary-200 text-sm font-medium text-[#1A1A1A]">
          {toast}
        </div>
      )}

      <div className="space-y-3 mb-8">
        {admins.map(a => (
          <div
            key={a.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-[#ECECEC] rounded-[20px] shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-[#FFF7D6] flex items-center justify-center text-lg font-bold text-primary-700 shrink-0">
              {a.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-[#1A1A1A]">{a.name} {a.position}</p>
                {a.isPrimary && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500 text-[#1A1A1A] text-[10px] font-bold">
                    <Crown className="w-3 h-3" /> 대표 최고관리자
                  </span>
                )}
                {a.isCurrent && (
                  <span className="text-[10px] font-semibold text-gray-400">나</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0" /> {a.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!a.isPrimary && (
                <ChurchButton
                  variant="outline"
                  size="sm"
                  icon={<Crown size={14} />}
                  onClick={() => makePrimary(a.id)}
                >
                  대표로 지정
                </ChurchButton>
              )}
              <ChurchButton variant="ghost" size="sm" disabled title="데모·권한 보호">
                권한 변경
              </ChurchButton>
            </div>
          </div>
        ))}
      </div>

      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">초대 대기</h3>
          <div className="space-y-2">
            {pendingInvites.map(inv => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-[#ECECEC] rounded-[16px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1A1A1A]">{inv.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {inv.phone}
                    <span className="mx-1">·</span>
                    코드 {inv.code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ChurchButton
                    variant="outline"
                    size="sm"
                    icon={copiedCode === inv.code ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => copyInvite(inv.code)}
                  >
                    {copiedCode === inv.code ? '복사됨' : '링크 복사'}
                  </ChurchButton>
                  <ChurchButton variant="danger" size="sm" onClick={() => cancelInvite(inv.id)}>
                    초대 취소
                  </ChurchButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-[400] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] p-5 shadow-xl">
            <h3 className="text-base font-bold text-[#1A1A1A] mb-1">최고관리자 초대</h3>
            <p className="text-xs text-gray-400 mb-4">최소 정보만 입력하고 초대 링크를 전달합니다.</p>
            <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
            <input
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="w-full mb-3 px-3.5 py-3 text-sm bg-gray-50 border border-[#ECECEC] rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="이름"
            />
            <label className="block text-xs font-semibold text-gray-500 mb-1">휴대전화번호</label>
            <input
              value={invitePhone}
              onChange={e => setInvitePhone(e.target.value)}
              className="w-full mb-3 px-3.5 py-3 text-sm bg-gray-50 border border-[#ECECEC] rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="010-0000-0000"
            />
            <label className="block text-xs font-semibold text-gray-500 mb-1">이메일 (선택)</label>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full mb-4 px-3.5 py-3 text-sm bg-gray-50 border border-[#ECECEC] rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="email@church.kr"
            />
            <div className="flex gap-2">
              <ChurchButton variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>
                취소
              </ChurchButton>
              <ChurchButton icon={<Link2 size={16} />} className="flex-1" onClick={sendInvite}>
                초대 보내기
              </ChurchButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
