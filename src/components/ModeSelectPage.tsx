import { Users, Settings, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChurchieumLogo from './common/ChurchieumLogo';

type Props = {
  onSelectMode: (mode: 'member' | 'admin') => void;
  isAdmin: boolean;
};

export default function ModeSelectPage({ onSelectMode, isAdmin }: Props) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: '#F8FAFC' }}>

      {/* Card container */}
      <div className="w-full max-w-sm">

        {/* Logo + greeting */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChurchieumLogo variant="full" size={56} showText showEnglish />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="font-bold text-gray-900" style={{ fontSize: '20px' }}>
              {user?.name || '사용자'}님, 환영합니다! 👋
            </p>
            <p className="text-gray-500" style={{ fontSize: '14px' }}>
              오늘도 주님과 동행하는 아름다운 하루 되세요.
            </p>
          </div>
        </div>

        {/* Mode cards */}
        <div className="space-y-3">
          {/* 성도/교역자 모드 */}
          <button
            onClick={() => onSelectMode('member')}
            className="w-full bg-white rounded-[20px] p-5 text-left group transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)' }}>
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors"
                  style={{ fontSize: '16px' }}>
                  {isAdmin ? '교역자 모드' : '성도 모드'}
                </p>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '13px' }}>
                  설교, 은혜기록, 기도, 공지, 성경
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>

          {/* 관리자 모드 */}
          {isAdmin && (
            <button
              onClick={() => onSelectMode('admin')}
              className="w-full bg-white rounded-[20px] p-5 text-left group transition-all duration-200 hover:-translate-y-0.5"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)' }}>
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors"
                      style={{ fontSize: '16px' }}>관리자 모드</p>
                    <Shield className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-gray-500 mt-0.5" style={{ fontSize: '13px' }}>
                    교인관리, 설교, 은혜기록, 통계
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          )}

          {!isAdmin && (
            <div className="rounded-[16px] p-4 text-center" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-medium text-gray-600" style={{ fontSize: '13px' }}>관리자 권한이 필요하신가요?</p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: '12px' }}>담당자에게 문의하시면 권한을 드리겠습니다.</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 mt-4 py-3 rounded-[14px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          style={{ fontSize: '13px', fontWeight: 500 }}
        >
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>

        <p className="text-center mt-4" style={{ fontSize: '11px', color: '#D1D5DB' }}>
          교회이음 · CHURCHIEUM v1.0
        </p>
      </div>
    </div>
  );
}
