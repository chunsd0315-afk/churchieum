import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import ChurchieumLogo from './common/ChurchieumLogo';

// ─── Welcome Messages ─────────────────────────────────────────────────────────

const WELCOME_MESSAGES = [
  { line1: '오늘도', line2: '하나님의 은혜가 함께합니다.' },
  { line1: '예배는 삶이 되고', line2: '말씀은 능력이 됩니다.' },
  { line1: '오늘도', line2: '말씀으로 하루를 시작하세요.' },
  { line1: '교회를 잇고', line2: '사람을 잇고, 믿음을 잇습니다.' },
  { line1: '한 영혼을', line2: '말씀으로 세워갑니다.' },
  { line1: '은혜를 나누고', line2: '사랑으로 섬깁니다.' },
  { line1: '믿음의 공동체 안에서', line2: '함께 성장합니다.' },
  { line1: '말씀이 심겨지고', line2: '삶이 변화됩니다.' },
  { line1: '주님의 사랑 안에서', line2: '오늘도 승리합니다.' },
  { line1: '성도의 교제로', line2: '하나님 나라를 세웁니다.' },
  { line1: '기도로 시작하고', line2: '감사로 마칩니다.' },
  { line1: '말씀 위에 세워진', line2: '교회, 교회이음입니다.' },
  { line1: '매일의 묵상이', line2: '영혼의 양식이 됩니다.' },
  { line1: '하나님을 예배하는', line2: '공동체로 함께합니다.' },
  { line1: '오늘의 말씀으로', line2: '새 힘을 얻으세요.' },
  { line1: '사랑하고 섬기며', line2: '주님을 높입니다.' },
  { line1: '진리 안에서', line2: '자유를 누리세요.' },
  { line1: '교회는 나의 가족,', line2: '말씀은 나의 힘입니다.' },
  { line1: '오늘도 주님과 함께', line2: '한 걸음 나아갑니다.' },
  { line1: '은혜 위에 은혜를', line2: '더하시는 하나님을 찬양합니다.' },
];

function dailyRandom(max: number): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % max;
}

// ─── Demo Accounts ────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  { label: '👑 최고관리자', name: '김영수', title: '담임목사', email: 'pastor01@churchieum.com', password: 'Church@2026', toast: '최고관리자 계정이 입력되었습니다.' },
  { label: '👨‍💼 교역자',   name: '이성호', title: '목사',     email: 'pastor02@churchieum.com', password: 'Church@2026', toast: '교역자 계정이 입력되었습니다.' },
  { label: '👤 성도',       name: '강수아', title: '성도',     email: 'member60@demo.com',        password: 'Church@2026', toast: '성도 계정이 입력되었습니다.' },
];

// ─── Demo Panel ───────────────────────────────────────────────────────────────

type DemoPanelProps = {
  selectedEmail: string;
  onSelectAccount: (email: string, password: string, toast: string) => void;
};

function DemoPanel({ selectedEmail, onSelectAccount }: DemoPanelProps) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full font-bold tracking-wide">
          🧪 체험용 Demo Account
        </span>
      </div>

      {/* Account cards */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {DEMO_ACCOUNTS.map((acc, i) => {
          const selected = selectedEmail === acc.email;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectAccount(acc.email, acc.password, acc.toast)}
              className="w-full text-left px-4 py-3.5 transition-all duration-150"
              style={{
                background: selected ? 'rgba(79,134,247,0.18)' : 'transparent',
                borderLeft: selected ? '3px solid rgba(79,134,247,0.9)' : '3px solid transparent',
              }}
            >
              {/* Role + name/title + check */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold" style={{ color: selected ? 'rgba(147,197,253,0.95)' : 'rgba(255,255,255,0.55)' }}>{acc.label}</span>
                  <span className="text-[12px] font-semibold" style={{ color: selected ? '#fff' : 'rgba(255,255,255,0.8)' }}>{acc.name}</span>
                  <span className="text-[11px]" style={{ color: selected ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.4)' }}>/ {acc.title}</span>
                </div>
                {selected && <Check className="w-3.5 h-3.5 text-blue-300 shrink-0" />}
              </div>

              {/* Email */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>ID</span>
                <span className="text-[11px] font-medium" style={{ color: selected ? 'rgba(147,197,253,0.9)' : 'rgba(255,255,255,0.55)' }}>{acc.email}</span>
              </div>

              {/* PW */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>PW</span>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{acc.password}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>
        {children}
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

type Props = { onSuccess: () => void };

export default function LoginPage({ onSuccess }: Props) {
  const { signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const welcome = WELCOME_MESSAGES[dailyRandom(WELCOME_MESSAGES.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const { error: err } = await signIn(email, password);
        if (err) throw new Error(err);
        onSuccess();
      } else {
        if (!name.trim()) throw new Error('이름을 입력해주세요.');
        const { error: err } = await signUp(email, password, name);
        if (err) throw new Error(err);
        setIsLogin(true);
        setError('회원가입이 완료되었습니다. 로그인해주세요.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail: string, demoPassword: string, toastMsg: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLogin(true);
    setError('');
    setToast(toastMsg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 flex flex-col items-center justify-start overflow-y-auto relative">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-[13px] font-semibold text-white shadow-xl"
          style={{ background: 'rgba(20,20,30,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {toast}
        </div>
      )}

      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[55vw] h-[55vw] max-w-2xl rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-6%] right-[-6%] w-[48vw] h-[48vw] max-w-xl rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(148,163,184,0.08) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute top-[35%] left-[55%] w-[28vw] h-[28vw] max-w-md rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[380px] mx-auto px-5 pt-12 pb-10 flex flex-col gap-7">

        {/* Brand block */}
        <div className="flex flex-col items-center gap-5">
          <ChurchieumLogo
            variant="full"
            size={76}
            showText
            showEnglish
            showTagline
            textColor="light"
          />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <p className="text-center text-[13px] font-medium leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.62)' }}>
              {welcome.line1}<br />{welcome.line2}
            </p>
          </div>
        </div>

        {/* Login card */}
        <div>
          <div className="bg-white overflow-hidden"
            style={{ borderRadius: '30px', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08)' }}>
            <div className="h-[3px] bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-500" />
            <div className="px-7 pt-6 pb-7">
              {/* Mode tabs */}
              <div className="flex mb-6 p-1 rounded-2xl" style={{ background: '#f3f4f6' }}>
                {[{ label: '로그인', val: true }, { label: '회원가입', val: false }].map(t => (
                  <button key={String(t.val)} type="button"
                    onClick={() => { setIsLogin(t.val); setError(''); }}
                    className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-200 ${
                      isLogin === t.val
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <Field label="이름" icon={<User className="w-4 h-4 text-gray-400" />}>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 rounded-2xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-0 focus:outline-none transition-colors" />
                  </Field>
                )}

                <Field label="이메일" icon={<Mail className="w-4 h-4 text-gray-400" />}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com" required
                    className="w-full pl-11 pr-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 rounded-2xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-0 focus:outline-none transition-colors" />
                </Field>

                <Field label="비밀번호" icon={<Lock className="w-4 h-4 text-gray-400" />}>
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="6자리 이상" minLength={6} required
                    className="w-full pl-11 pr-11 py-3.5 text-sm text-gray-800 placeholder-gray-400 rounded-2xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-0 focus:outline-none transition-colors" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>

                {error && (
                  <div className={`px-4 py-3 rounded-xl text-[13px] font-medium ${
                    error.includes('완료')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-[15px] text-[14px] font-bold text-white rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #4f86f7 0%, #3b6fd4 100%)',
                    boxShadow: '0 8px 24px rgba(79,134,247,0.35)',
                  }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 처리 중...</>
                    : (isLogin ? '로그인' : '회원가입')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Demo accounts */}
        {isLogin && (
          <DemoPanel
            selectedEmail={email}
            onSelectAccount={handleSelectDemo}
          />
        )}

        {/* Footer */}
        <div className="text-center space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
            CHURCHIEUM · VERSION 1.0.0
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © 2026 Churchieum
          </p>
          <p className="text-[12px] font-medium leading-relaxed mt-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
            "오늘도 한 영혼을<br />말씀으로 세웁니다."
          </p>
        </div>

      </div>
    </div>
  );
}
