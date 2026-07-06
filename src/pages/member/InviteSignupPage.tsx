import { useState } from 'react';
import {
  Check, Eye, EyeOff, Lock, ArrowRight, ChevronLeft,
  Shield, Building, User, CheckCircle, ChevronRight,
} from 'lucide-react';

type Step = 'confirm' | 'password' | 'terms' | 'complete';

type Props = {
  inviteCode?: string;
  onComplete?: () => void;
  onBack?: () => void;
};

const DEMO_CHURCH = {
  name: '순복음성북교회',
  denomination: '기독교대한하나님의성회',
  pastor: '김성기 목사',
  address: '서울시 성북구 보문로 100',
  imageUrl: 'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=400',
};

const ROLE_COLORS: Record<string, string> = {
  '담임목사': 'bg-amber-100 text-amber-700',
  '목사':     'bg-orange-100 text-orange-700',
  '전도사':   'bg-violet-100 text-violet-700',
  '사무':     'bg-teal-100 text-teal-700',
  '직원':     'bg-gray-100 text-gray-600',
  '관리자':   'bg-red-100 text-red-700',
  '장로':     'bg-blue-100 text-blue-700',
  '부서장':   'bg-indigo-100 text-indigo-700',
  '교사':     'bg-green-100 text-green-700',
  '성도':     'bg-gray-100 text-gray-500',
};

function getParam(key: string): string {
  try { return new URLSearchParams(window.location.search).get(key) || ''; }
  catch { return ''; }
}

function PasswordStrength({ pw }: { pw: string }) {
  const len = pw.length;
  const strength = len === 0 ? 0 : len < 6 ? 1 : len < 9 ? 2 : len < 12 ? 3 : 4;
  const labels = ['', '약함', '보통', '강함', '매우 강함'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-primary-400', 'bg-secondary-500'];
  if (len === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i<=strength ? colors[strength] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${strength<=1?'text-red-500':strength===2?'text-amber-500':'text-success-600'}`}>{labels[strength]}</p>
    </div>
  );
}

/* ── Step: Confirm (welcome) ── */
function ConfirmStep({ inviteCode, onNext, onBack, name, role, dept, district, area }: {
  inviteCode: string; onNext: ()=>void; onBack?: ()=>void;
  name: string; role: string; dept: string; district: string; area: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Church card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl mb-5">
          <div className="h-32 overflow-hidden relative">
            <img src={DEMO_CHURCH.imageUrl} alt={DEMO_CHURCH.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 text-white">
              <p className="text-[10px] opacity-80">{DEMO_CHURCH.denomination}</p>
              <h2 className="text-base font-bold">{DEMO_CHURCH.name}</h2>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {name && (
              <div className="bg-primary-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">초대 받은 분</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{name}</p>
                  {role && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]||'bg-gray-100 text-gray-600'}`}>{role}</span>}
                </div>
                {(dept||district||area) && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {[district, area, dept].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">초대 코드</p>
                <p className="font-bold text-primary-700 tracking-widest">{inviteCode}</p>
              </div>
              <Shield className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>

        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-white mb-1.5">교회이음에 초대되었습니다!</h1>
          <p className="text-white/70 text-sm">회원가입 후 교회에 자동으로 연결됩니다.</p>
        </div>

        <button onClick={onNext}
          className="w-full bg-white text-primary-600 font-bold py-4 rounded-2xl shadow-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
          <ArrowRight className="w-5 h-5" /> 초대 확인 및 가입 시작
        </button>
        {onBack && (
          <button onClick={onBack} className="w-full mt-3 text-white/60 text-sm py-2 hover:text-white transition-colors">취소</button>
        )}
      </div>
    </div>
  );
}

/* ── Step: Password ── */
function PasswordStep({ name, onNext, onBack }: { name: string; onNext: (pw:string)=>void; onBack:()=>void }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [error, setError] = useState('');

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다'); return; }
    if (pw !== pw2) { setError('비밀번호가 일치하지 않습니다'); return; }
    onNext(pw);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">비밀번호 설정</h1>
          <p className="text-xs text-gray-400">2/4 단계</p>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4].map(i => <div key={i} className={`w-8 h-1.5 rounded-full ${i<=2?'bg-primary-500':'bg-gray-200'}`} />)}
        </div>
      </header>

      <div className="flex-1 flex flex-col p-5 max-w-md mx-auto w-full">
        <div className="bg-primary-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">가입하는 분</p>
            <p className="font-bold text-gray-900">{name || '(이름 미입력)'}</p>
          </div>
        </div>

        <form onSubmit={handle} className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={show?'text':'password'} value={pw} onChange={e=>{setPw(e.target.value);setError('');}}
                placeholder="6자 이상 입력"
                className="w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary-400 focus:ring-0" />
              <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                {show?<EyeOff className="w-4 h-4 text-gray-400"/>:<Eye className="w-4 h-4 text-gray-400"/>}
              </button>
            </div>
            <PasswordStrength pw={pw} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={show2?'text':'password'} value={pw2} onChange={e=>{setPw2(e.target.value);setError('');}}
                placeholder="비밀번호 재입력"
                className={`w-full pl-11 pr-12 py-3.5 bg-white border rounded-xl text-sm focus:ring-0 ${pw2&&pw2===pw?'border-success-400 focus:border-success-400':'border-gray-200 focus:border-primary-400'}`} />
              <button type="button" onClick={()=>setShow2(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                {show2?<EyeOff className="w-4 h-4 text-gray-400"/>:<Eye className="w-4 h-4 text-gray-400"/>}
              </button>
              {pw2 && pw2 === pw && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4 text-success-500" />
                </div>
              )}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
            비밀번호는 6자 이상, 영문·숫자·특수문자를 조합하면 더 안전합니다.
          </div>
          <button type="submit"
            className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 shadow-lg flex items-center justify-center gap-2 mt-auto">
            다음 단계 <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Step: Terms ── */
function TermsStep({ onNext, onBack }: { onNext: ()=>void; onBack: ()=>void }) {
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const allAgreed = agreed1 && agreed2 && agreed3;

  const toggleAll = () => {
    const next = !allAgreed;
    setAgreed1(next); setAgreed2(next); setAgreed3(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">약관 동의</h1>
          <p className="text-xs text-gray-400">3/4 단계</p>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4].map(i => <div key={i} className={`w-8 h-1.5 rounded-full ${i<=3?'bg-primary-500':'bg-gray-200'}`} />)}
        </div>
      </header>

      <div className="flex-1 flex flex-col p-5 max-w-md mx-auto w-full space-y-4">
        {/* All agree */}
        <label onClick={toggleAll}
          className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${allAgreed?'border-primary-500 bg-primary-50':'border-gray-200 bg-white'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${allAgreed?'bg-primary-500':'bg-gray-200'}`}>
            {allAgreed && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className="font-bold text-gray-900">전체 동의</span>
        </label>

        <div className="space-y-2">
          {[
            { state: agreed1, set: setAgreed1, label: '[필수] 이용약관 동의', required: true },
            { state: agreed2, set: setAgreed2, label: '[필수] 개인정보 처리방침 동의', required: true },
            { state: agreed3, set: setAgreed3, label: '[선택] 마케팅 및 서비스 알림 수신 동의', required: false },
          ].map((item, i) => (
            <label key={i} onClick={() => item.set(s=>!s)}
              className={`flex items-center gap-3 p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${item.state?'border-primary-200':'border-gray-100'}`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${item.state?'bg-primary-500':'bg-white border-2 border-gray-300'}`}>
                {item.state && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm flex-1 ${item.state?'text-gray-900':'text-gray-600'}`}>{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </label>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
          교회이음은 수집된 개인정보를 교회 커뮤니티 서비스 제공 목적으로만 사용하며, 제3자에게 제공하지 않습니다.
          교회 가입 시 입력된 정보는 해당 교회 관리자에게만 공개됩니다.
        </div>

        <button onClick={onNext} disabled={!agreed1||!agreed2}
          className={`w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
            agreed1&&agreed2 ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          동의하고 가입 완료 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Step: Complete ── */
function CompleteStep({ name, role, dept, district, area, inviteCode, isClergy, onDone }: {
  name: string; role: string; dept: string; district: string; area: string; inviteCode: string; isClergy?: boolean; onDone: ()=>void;
}) {
  const isStaff = isClergy || ['담임목사','목사','전도사','사무','직원','관리자'].includes(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-500 to-primary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-success-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">가입 완료!</h2>
        <p className="text-gray-500 mb-5 text-sm">
          <span className="font-bold text-gray-900">{name}</span>님, 교회이음에 오신 것을 환영합니다!
        </p>

        {/* Checklist */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left space-y-2.5">
          {[
            { label: '계정 생성 완료', done: true },
            { label: '비밀번호 설정 완료', done: true },
            { label: '약관 동의 완료', done: true },
            { label: `${DEMO_CHURCH.name} 교회 연결`, done: true },
            ...(district ? [{ label: `교구/구역 배정 (${[district,area].filter(Boolean).join(' · ')})`, done: true }] : []),
            ...(dept ? [{ label: `부서 배정 (${dept})`, done: true }] : []),
            { label: `초대 코드 처리 완료 (${inviteCode})`, done: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Role badge */}
        {role && (
          <div className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-3 mb-5">
            <span className="text-sm text-gray-600">부여된 권한</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${ROLE_COLORS[role]||'bg-gray-100 text-gray-600'}`}>{role}</span>
          </div>
        )}

        <button onClick={onDone}
          className="w-full bg-primary-500 text-white font-bold py-4 rounded-2xl hover:bg-primary-600 transition-colors shadow-sm">
          {isStaff ? '관리자 모드로 이동' : '성도 모드 홈으로 이동'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Export ── */
export default function InviteSignupPage({ inviteCode = 'CHI-DEMO1', onComplete, onBack }: Props) {
  const prefilledName     = getParam('name');
  const prefilledRole     = getParam('role') || getParam('position') || '성도';
  const prefilledDept     = getParam('departmentName') || getParam('dept');
  const prefilledDistrict = getParam('districtName')   || getParam('district');
  const prefilledArea     = getParam('zoneName')       || getParam('area');
  const inviteType        = getParam('inviteType') || 'member';

  const [step, setStep] = useState<Step>('confirm');
  const [, setPassword] = useState('');
  const isClergy = inviteType === 'pastor' || ['담임목사','목사','전도사','교육전도사','간사','직원'].includes(prefilledRole);

  if (step === 'confirm') {
    return (
      <ConfirmStep
        inviteCode={inviteCode}
        name={prefilledName}
        role={prefilledRole}
        dept={prefilledDept}
        district={prefilledDistrict}
        area={prefilledArea}
        onNext={() => setStep('password')}
        onBack={onBack}
      />
    );
  }

  if (step === 'password') {
    return (
      <PasswordStep
        name={prefilledName}
        onNext={pw => { setPassword(pw); setStep('terms'); }}
        onBack={() => setStep('confirm')}
      />
    );
  }

  if (step === 'terms') {
    return (
      <TermsStep
        onNext={() => setStep('complete')}
        onBack={() => setStep('password')}
      />
    );
  }

  return (
    <CompleteStep
      name={prefilledName}
      role={prefilledRole}
      dept={prefilledDept}
      district={prefilledDistrict}
      area={prefilledArea}
      inviteCode={inviteCode}
      isClergy={isClergy}
      onDone={onComplete || (() => {})}
    />
  );
}
