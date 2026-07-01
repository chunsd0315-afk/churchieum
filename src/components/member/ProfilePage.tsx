import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, LogOut, BookHeart, Shield, ChevronRight, Sparkles,
  Bell, Lock, Moon, Globe, HelpCircle, Info, Settings, Award,
} from 'lucide-react';
import { PageHeaderBar } from '../ui';

type ReadingRecord = {
  date: string;
  chapters: string;
};

export default function ProfilePage() {
  const { user, isAdmin, signOut } = useAuth();
  const [bibleProgress, setBibleProgress] = useState(0);
  const [readingStreak, setReadingStreak] = useState(0);
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>([]);

  useEffect(() => {
    const bibleData = localStorage.getItem('bible_progress');
    if (bibleData) {
      const data = JSON.parse(bibleData);
      setBibleProgress(data.totalCompleted || 0);
      setReadingStreak(data.streak || 0);
      setReadingRecords((data.progress || []).slice(0, 10));
    }
  }, []);

  const settingsItems = [
    { icon: Bell,       label: '알림 설정',    desc: '공지, 은혜기록 알림' },
    { icon: Lock,       label: '비밀번호 변경', desc: '계정 보안' },
    { icon: Moon,       label: '다크모드',     desc: '사용 안 함' },
    { icon: Globe,      label: '언어 설정',    desc: '한국어' },
    { icon: HelpCircle, label: '도움말',       desc: '사용 가이드' },
    { icon: Info,       label: '교회이음 정보', desc: '버전 1.0.0' },
  ];

  return (
    <div className="pb-8 space-y-4">
      <PageHeaderBar
        title="내정보"
        description="나의 프로필과 소속 정보를 확인하세요."
      />
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-white/80">{user?.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                <Shield className="w-3 h-3" />
                관리자
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <BookHeart className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{bibleProgress}</p>
          <p className="text-xs text-gray-500">통독 일수</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Award className="w-6 h-6 text-accent-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{readingStreak}</p>
          <p className="text-xs text-gray-500">연속 통독일</p>
        </div>
      </div>

      {/* Reading Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <BookHeart className="w-4 h-4 text-primary-500" />
          <h3 className="font-bold text-gray-900 text-sm">통독현황</h3>
        </div>
        <div className="p-4 max-h-60 overflow-y-auto">
          {readingRecords.length > 0 ? (
            <div className="space-y-2">
              {readingRecords.map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                      <BookHeart className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.chapters}</p>
                      <p className="text-xs text-gray-500">{record.date}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded-full">완료</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-4 text-sm">통독 기록이 없습니다</p>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-bold text-gray-900 text-sm">설정</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {settingsItems.map((item, idx) => (
            <button key={idx} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
              <item.icon className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <p className="text-sm text-amber-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          데모 모드로 실행 중입니다. 데이터는 저장되지 않습니다.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full py-4 bg-red-50 hover:bg-red-100 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-medium transition-colors"
      >
        <LogOut className="w-5 h-5" />
        로그아웃
      </button>
    </div>
  );
}
