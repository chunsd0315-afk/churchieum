import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import {
  BookOpen, BookHeart, Heart, Users, FileText, TrendingUp,
  UserPlus, BarChart2, Calendar, Award, Target, Flame,
} from 'lucide-react';
import { PageHeaderBar } from '../../components/common/ui';
import TestDataSeedPanel from '../../components/admin/TestDataSeedPanel';

type FaithStats = {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  sermonCount: number;
  qtCount: number;
  prayerCount: number;
  bulletinCount: number;
  newFamilyCount: number;
  departmentStats: { name: string; count: number }[];
  genderStats: { male: number; female: number; unknown: number };
  ageStats: { range: string; count: number }[];
  newFamilyThisMonth: number;
};

type MonthlyItem = { month: string; value: number };

export default function StatisticsPage() {
  const [stats, setStats] = useState<FaithStats>({
    totalMembers: 0,
    activeMembers: 0,
    newMembersThisMonth: 0,
    sermonCount: 0,
    qtCount: 0,
    prayerCount: 0,
    bulletinCount: 0,
    newFamilyCount: 0,
    departmentStats: [],
    genderStats: { male: 0, female: 0, unknown: 0 },
    ageStats: [],
    newFamilyThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  });

  // Demo monthly trend data
  const sermonTrend: MonthlyItem[] = [
    { month: '1월', value: 4 }, { month: '2월', value: 4 }, { month: '3월', value: 5 },
    { month: '4월', value: 4 }, { month: '5월', value: 5 }, { month: '6월', value: 3 },
  ];
  const qtTrend: MonthlyItem[] = [
    { month: '1월', value: 12 }, { month: '2월', value: 18 }, { month: '3월', value: 22 },
    { month: '4월', value: 19 }, { month: '5월', value: 28 }, { month: '6월', value: 31 },
  ];
  const newFamilyTrend: MonthlyItem[] = [
    { month: '1월', value: 2 }, { month: '2월', value: 1 }, { month: '3월', value: 3 },
    { month: '4월', value: 2 }, { month: '5월', value: 4 }, { month: '6월', value: 3 },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const [membersRes, deptsRes, sermonsRes, qtsRes, prayersRes, bulletinsRes, newFamilyRes] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('sermons').select('id', { count: 'exact', head: true }),
        supabase.from('qt').select('id', { count: 'exact', head: true }),
        supabase.from('prayers').select('id', { count: 'exact', head: true }),
        supabase.from('bulletins').select('id', { count: 'exact', head: true }),
        supabase.from('new_families').select('*'),
      ]);

      const members = membersRes.data || [];
      const depts = deptsRes.data || [];
      const newFamilies = newFamilyRes.data || [];

      const deptCounts: Record<string, number> = {};
      members.forEach(m => {
        if (m.department_id) {
          const name = depts.find(d => d.id === m.department_id)?.name || '미지정';
          deptCounts[name] = (deptCounts[name] || 0) + 1;
        }
      });

      setStats({
        totalMembers: members.length,
        activeMembers: members.filter(m => m.is_active).length,
        newMembersThisMonth: members.filter(m => m.join_date && m.join_date >= thisMonthStart).length,
        sermonCount: sermonsRes.count || 0,
        qtCount: qtsRes.count || 0,
        prayerCount: prayersRes.count || 0,
        bulletinCount: bulletinsRes.count || 0,
        newFamilyCount: newFamilies.length,
        newFamilyThisMonth: newFamilies.filter(f => f.created_at && f.created_at >= thisMonthStart).length,
        departmentStats: Object.entries(deptCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        genderStats: {
          male: members.filter(m => m.gender === 'male').length,
          female: members.filter(m => m.gender === 'female').length,
          unknown: members.filter(m => !m.gender).length,
        },
        ageStats: calcAgeStats(members),
      });
    } catch {
      // keep zeros
    } finally {
      setLoading(false);
    }
  };

  const calcAgeStats = (members: { birth_date?: string }[]) => {
    const now = new Date();
    return [
      { range: '10대 이하', min: 0, max: 19 },
      { range: '20대', min: 20, max: 29 },
      { range: '30대', min: 30, max: 39 },
      { range: '40대', min: 40, max: 49 },
      { range: '50대', min: 50, max: 59 },
      { range: '60대+', min: 60, max: 200 },
    ].map(({ range, min, max }) => ({
      range,
      count: members.filter(m => {
        if (!m.birth_date) return false;
        const age = now.getFullYear() - new Date(m.birth_date).getFullYear();
        return age >= min && age <= max;
      }).length,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const maxDept = Math.max(...stats.departmentStats.map(d => d.count), 1);
  const maxSermon = Math.max(...sermonTrend.map(s => s.value), 1);
  const maxQt = Math.max(...qtTrend.map(q => q.value), 1);
  const maxNf = Math.max(...newFamilyTrend.map(n => n.value), 1);

  return (
    <div className="space-y-6">
      <PageHeaderBar
        title="통계/보고서"
        description="교회 활동과 참여 현황을 확인하세요."
      />

      {/* Monthly report header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-xs mb-1">{reportMonth} 보고서</p>
            <h2 className="text-xl font-bold">신앙 활동 현황</h2>
            <p className="text-gray-400 text-xs mt-1">교회이음 플랫폼 통계</p>
          </div>
          <span className="text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full font-semibold">● 집계중</span>
        </div>
      </div>

      {/* Core faith metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체 교인', value: stats.totalMembers, icon: Users, color: 'bg-primary-100', iconColor: 'text-primary-600', sub: `재직 ${stats.activeMembers}명` },
          { label: '설교 수', value: stats.sermonCount, icon: BookOpen, color: 'bg-rose-100', iconColor: 'text-rose-600', sub: '전체 등록 설교' },
          { label: '은혜와 기도 수', value: stats.qtCount, icon: BookHeart, color: 'bg-violet-100', iconColor: 'text-violet-600', sub: '은혜와 기도 참여 현황' },
          { label: '기도제목', value: stats.prayerCount, icon: Heart, color: 'bg-pink-100', iconColor: 'text-pink-600', sub: '등록된 기도제목' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '이번 달 등록', value: stats.newMembersThisMonth, icon: UserPlus, color: 'bg-accent-100', iconColor: 'text-accent-600', sub: '신규 교인' },
          { label: '새가족', value: stats.newFamilyCount, icon: Award, color: 'bg-amber-100', iconColor: 'text-amber-600', sub: `이번 달 ${stats.newFamilyThisMonth}명` },
          { label: '주보', value: stats.bulletinCount, icon: FileText, color: 'bg-cyan-100', iconColor: 'text-cyan-600', sub: '발행된 주보' },
          { label: '성경통독', value: '-', icon: Target, color: 'bg-emerald-100', iconColor: 'text-emerald-600', sub: '참여중 (예정)' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sermon trend chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-500" />
          월별 설교 등록 추이 (최근 6개월)
        </h3>
        <div className="flex items-end gap-3 h-28">
          {sermonTrend.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">{d.value}</span>
              <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '72px' }}>
                <div
                  className="bg-gradient-to-t from-rose-500 to-rose-300 rounded-t-lg w-full transition-all"
                  style={{ height: `${(d.value / maxSermon) * 100}%`, marginTop: 'auto' }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* QT trend chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookHeart className="w-5 h-5 text-violet-500" />
          월별 QT 작성 추이 (최근 6개월)
        </h3>
        <div className="flex items-end gap-3 h-28">
          {qtTrend.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">{d.value}</span>
              <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '72px' }}>
                <div
                  className="bg-gradient-to-t from-violet-500 to-violet-300 rounded-t-lg w-full transition-all"
                  style={{ height: `${(d.value / maxQt) * 100}%`, marginTop: 'auto' }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{d.month}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">
          <Flame className="w-3 h-3 inline text-violet-400 mr-1" />
          6개월 총 {qtTrend.reduce((a, b) => a + b.value, 0)}회 작성
        </p>
      </div>

      {/* New family trend */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-500" />
          월별 새가족 등록 (최근 6개월)
        </h3>
        <div className="flex items-end gap-3 h-28">
          {newFamilyTrend.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">{d.value}</span>
              <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '72px' }}>
                <div
                  className="bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg w-full transition-all"
                  style={{ height: `${(d.value / maxNf) * 100}%`, marginTop: 'auto' }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gender stats */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          성별 분포
        </h3>
        <div className="flex items-center justify-around">
          {[
            { emoji: '👦', label: '남성', count: stats.genderStats.male, color: 'bg-blue-100' },
            { emoji: '👧', label: '여성', count: stats.genderStats.female, color: 'bg-pink-100' },
            { emoji: '❓', label: '미입력', count: stats.genderStats.unknown, color: 'bg-gray-100' },
          ].map(g => (
            <div key={g.label} className="text-center">
              <div className={`w-16 h-16 ${g.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-2xl">{g.emoji}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{g.count}</p>
              <p className="text-sm text-gray-500">{g.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department stats */}
      {stats.departmentStats.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-gray-500" />
            부서별 인원
          </h3>
          <div className="space-y-2">
            {stats.departmentStats.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-20 shrink-0">{d.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-accent-500 h-full rounded-full transition-all"
                    style={{ width: `${(d.count / maxDept) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age stats */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          연령대 분포
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {stats.ageStats.map(a => (
            <div key={a.range} className="text-center bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-bold text-gray-900">{a.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly report summary */}
      <div className="card border-l-4 border-l-primary-500">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          {reportMonth} 월간 보고서 요약
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: '신규 교인 등록', value: `${stats.newMembersThisMonth}명` },
            { label: '새가족 등록', value: `${stats.newFamilyThisMonth}명` },
            { label: '은혜와 기도 (이번 달)', value: `${qtTrend[qtTrend.length - 1].value}회` },
            { label: '설교 등록 (이번 달)', value: `${sermonTrend[sermonTrend.length - 1].value}편` },
            { label: '기도제목 총 수', value: `${stats.prayerCount}건` },
            { label: '주보 발행 수', value: `${stats.bulletinCount}호` },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-gray-500 text-xs">{item.label}</span>
              <span className="font-bold text-gray-900 text-sm">{item.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">* 데모 데이터 포함. 실제 집계는 운영 환경에서 확인하세요.</p>
      </div>

      <TestDataSeedPanel />
    </div>
  );
}
