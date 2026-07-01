import { useState, useMemo } from 'react';
import {
  BookOpen, Users, TrendingUp, Award, CheckCircle, Plus, X,
  Megaphone, ChevronDown, Search, ArrowLeft, Filter,
  Calendar, Clock, ShieldCheck, Layers,
} from 'lucide-react';
import { READING_PLANS, type PlanId } from '../../data/readingPlans';
import {
  getAllDistricts, getAllZones, getAllDepartments,
  getDistrictNameById, getZoneNameById, getDepartmentNamesByIds,
} from '../../lib/orgData';
import { PageHeaderBar } from '../ui';

// ─── Progress-based demo data (one entry per person×plan) ────────────────────

type DemoProgress = {
  id: string;
  memberName: string;
  districtId: string;
  zoneId: string;
  departmentIds: string[];
  planId: PlanId;
  planName: string;
  currentDay: number;
  progress: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  startDate: string;
  lastCompletedDate: string;
  sharedConsent: boolean;
};

const DEMO_PROGRESSES: DemoProgress[] = [
  { id: 'dp1',  memberName: '김성도', districtId: 'd1', zoneId: 'z1', departmentIds: ['dep1'],  planId: '1year',    planName: '1년 성경통독',     currentDay: 117, progress: 32,  status: 'active',    startDate: '2026-01-01', lastCompletedDate: '2026-06-23', sharedConsent: true },
  { id: 'dp2',  memberName: '김성도', districtId: 'd1', zoneId: 'z1', departmentIds: ['dep1'],  planId: 'mccheyne', planName: '맥체인 성경읽기표',  currentDay: 29,  progress: 8,   status: 'active',    startDate: '2026-04-01', lastCompletedDate: '2026-06-20', sharedConsent: true },
  { id: 'dp3',  memberName: '이믿음', districtId: 'd2', zoneId: 'z3', departmentIds: ['dep2'],  planId: 'mccheyne', planName: '맥체인 성경읽기표',  currentDay: 365, progress: 100, status: 'completed', startDate: '2026-01-01', lastCompletedDate: '2026-06-18', sharedConsent: true },
  { id: 'dp4',  memberName: '이믿음', districtId: 'd2', zoneId: 'z3', departmentIds: ['dep2'],  planId: '30day-nt', planName: '30일 신약통독',     currentDay: 21,  progress: 70,  status: 'active',    startDate: '2026-06-05', lastCompletedDate: '2026-06-23', sharedConsent: true },
  { id: 'dp5',  memberName: '박은혜', districtId: 'd1', zoneId: 'z2', departmentIds: ['dep1'],  planId: '6month',   planName: '6개월 성경읽기',   currentDay: 81,  progress: 45,  status: 'active',    startDate: '2026-01-15', lastCompletedDate: '2026-06-22', sharedConsent: true },
  { id: 'dp6',  memberName: '박은혜', districtId: 'd1', zoneId: 'z2', departmentIds: ['dep1'],  planId: 'history',  planName: '역사순 일년일독',  currentDay: 44,  progress: 12,  status: 'active',    startDate: '2026-03-01', lastCompletedDate: '2026-05-15', sharedConsent: true },
  { id: 'dp7',  memberName: '한소망', districtId: 'd3', zoneId: 'z5', departmentIds: ['dep2'],  planId: '1year',    planName: '1년 성경통독',     currentDay: 78,  progress: 21,  status: 'paused',    startDate: '2026-01-01', lastCompletedDate: '2026-03-20', sharedConsent: false },
  { id: 'dp8',  memberName: '최사랑', districtId: 'd1', zoneId: 'z1', departmentIds: ['dep5'],  planId: '1year',    planName: '1년 성경통독',     currentDay: 201, progress: 55,  status: 'active',    startDate: '2026-01-01', lastCompletedDate: '2026-06-23', sharedConsent: true },
  { id: 'dp9',  memberName: '정요한', districtId: 'd4', zoneId: '',   departmentIds: ['dep2'],  planId: '1year',    planName: '1년 성경통독',     currentDay: 365, progress: 100, status: 'completed', startDate: '2025-07-01', lastCompletedDate: '2026-06-18', sharedConsent: true },
  { id: 'dp10', memberName: '강믿음', districtId: 'd1', zoneId: 'z2', departmentIds: ['dep3'],  planId: '4month',   planName: '4개월 성경일독',   currentDay: 73,  progress: 61,  status: 'active',    startDate: '2026-03-01', lastCompletedDate: '2026-06-21', sharedConsent: true },
  { id: 'dp11', memberName: '신충성', districtId: 'd3', zoneId: 'z5', departmentIds: ['dep4'],  planId: '4month',   planName: '4개월 성경일독',   currentDay: 120, progress: 100, status: 'completed', startDate: '2026-01-15', lastCompletedDate: '2026-05-14', sharedConsent: true },
  { id: 'dp12', memberName: '손빛나', districtId: 'd1', zoneId: 'z2', departmentIds: ['dep1'],  planId: '90day',    planName: '90일 성경통독',    currentDay: 65,  progress: 72,  status: 'active',    startDate: '2026-04-01', lastCompletedDate: '2026-06-23', sharedConsent: true },
  { id: 'dp13', memberName: '윤가나', districtId: 'd1', zoneId: 'z1', departmentIds: ['dep2'],  planId: '90day',    planName: '90일 성경통독',    currentDay: 90,  progress: 100, status: 'completed', startDate: '2026-03-01', lastCompletedDate: '2026-05-29', sharedConsent: true },
  { id: 'dp14', memberName: '조예수', districtId: 'd2', zoneId: 'z4', departmentIds: ['dep2'],  planId: '30day-nt', planName: '30일 신약통독',    currentDay: 17,  progress: 56,  status: 'active',    startDate: '2026-06-10', lastCompletedDate: '2026-06-23', sharedConsent: true },
  { id: 'dp15', memberName: '장하나', districtId: 'd1', zoneId: 'z2', departmentIds: ['dep1'],  planId: '30day-nt', planName: '30일 신약통독',    currentDay: 30,  progress: 100, status: 'completed', startDate: '2026-05-25', lastCompletedDate: '2026-06-23', sharedConsent: true },
  { id: 'dp16', memberName: '황진리', districtId: 'd2', zoneId: 'z4', departmentIds: ['dep4'],  planId: 'history',  planName: '역사순 일년일독',  currentDay: 66,  progress: 18,  status: 'active',    startDate: '2026-01-01', lastCompletedDate: '2026-03-08', sharedConsent: true },
  { id: 'dp17', memberName: '류진주', districtId: 'd2', zoneId: 'z3', departmentIds: ['dep2'],  planId: '6month',   planName: '6개월 성경읽기',   currentDay: 88,  progress: 49,  status: 'active',    startDate: '2026-02-01', lastCompletedDate: '2026-06-24', sharedConsent: true },
  { id: 'dp18', memberName: '문기쁨', districtId: 'd2', zoneId: 'z3', departmentIds: ['dep3'],  planId: 'mccheyne', planName: '맥체인 성경읽기표',  currentDay: 108, progress: 30,  status: 'active',    startDate: '2026-01-01', lastCompletedDate: '2026-04-18', sharedConsent: false },
];

function getPlanStats(planId: string) {
  const list = DEMO_PROGRESSES.filter(p => p.planId === planId);
  const completions = list.filter(p => p.status === 'completed').length;
  const active = list.filter(p => p.status === 'active' || p.status === 'paused').length;
  const avgProgress = list.length ? Math.round(list.reduce((s, p) => s + p.progress, 0) / list.length) : 0;
  const members = new Set(list.map(p => p.memberName)).size;
  return { total: list.length, completions, active, avgProgress, members };
}

// ─── Campaign Modal ───────────────────────────────────────────────────────────

function CampaignModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedPlan) return;
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">통독 캠페인 생성</h3>
            <p className="text-xs text-white/70 mt-0.5">성도들의 통독 참여를 독려하는 캠페인을 만드세요.</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">캠페인 제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="예: 2026 여름 성경통독 캠페인"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">통독 플랜</label>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400">
              <option value="">플랜 선택</option>
              {READING_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">시작일</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">종료일</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">캠페인 안내</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="성도들에게 전달할 안내 내용을 입력하세요."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none" />
          </div>
          <button type="submit"
            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
            {saved ? '저장됨!' : '캠페인 생성'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Progress List View ───────────────────────────────────────────────────────

function ProgressListView({ planId, planName, color, onBack }: {
  planId: string; planName: string; color: string; onBack: () => void;
}) {
  const allEntries = DEMO_PROGRESSES.filter(p => p.planId === planId);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const districts = getAllDistricts().filter(d => d.is_active);
  const zones = getAllZones().filter(z => z.is_active);
  const departments = getAllDepartments().filter(d => d.is_active);

  const getDistrictDisplay = (p: DemoProgress) =>
    p.districtId ? (getDistrictNameById(p.districtId) ?? '-') : '-';
  const getZoneDisplay = (p: DemoProgress) =>
    p.zoneId ? (getZoneNameById(p.zoneId) ?? '-') : '-';
  const getDeptDisplay = (p: DemoProgress) => {
    const names = getDepartmentNamesByIds(p.departmentIds);
    return names.length > 0 ? names.join(', ') : '-';
  };

  const filtered = useMemo(() => {
    return allEntries.filter(p => {
      const distName = getDistrictDisplay(p);
      if (search && !p.memberName.includes(search) && !distName.includes(search)) return false;
      if (districtFilter && p.districtId !== districtFilter) return false;
      if (zoneFilter && p.zoneId !== zoneFilter) return false;
      if (deptFilter && !p.departmentIds.includes(deptFilter)) return false;
      if (statusFilter === 'active' && p.status !== 'active') return false;
      if (statusFilter === 'paused' && p.status !== 'paused') return false;
      if (statusFilter === 'completed' && p.status !== 'completed') return false;
      return true;
    });
  }, [allEntries, search, districtFilter, zoneFilter, deptFilter, statusFilter]);

  const stats = getPlanStats(planId);
  const plan = READING_PLANS.find(p => p.id === planId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`bg-gradient-to-r ${color} px-5 py-4 text-white`}>
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> 전체 현황으로
          </button>
          <h2 className="text-lg font-bold">{planName}</h2>
          <p className="text-white/70 text-xs mt-0.5">참여 현황 (readingProgress 기준)</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {[
            { label: '전체 참여', value: stats.total,      color: 'text-gray-900' },
            { label: '진행중',   value: stats.active,     color: 'text-primary-600' },
            { label: '완독',     value: stats.completions, color: 'text-amber-600' },
            { label: '평균',     value: `${stats.avgProgress}%`, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          진행률은 <strong>공유에 동의한 성도</strong>의 정보만 표시됩니다. 미동의 성도는 이름과 소속만 표시됩니다. (데모에서는 모두 표시)
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 교구 검색"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 bg-gray-50" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50">
              <option value="">전체 상위조직</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50">
              <option value="">전체 하위조직</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50">
              <option value="">전체 부서</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50">
              <option value="all">전체 상태</option>
              <option value="active">진행중</option>
              <option value="paused">일시중지</option>
              <option value="completed">완독</option>
            </select>
          </div>
        )}
        <p className="text-xs text-gray-400">{filtered.length}건</p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['이름', '상위조직', '하위조직', '부서', '현재 진도', '진행률', '상태', '최근 완료일'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">검색 결과가 없습니다.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">{p.memberName[0]}</div>
                    <span className="font-medium text-gray-900">{p.memberName}</span>
                    {!p.sharedConsent && <span className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded-full">미동의</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{getDistrictDisplay(p)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{getZoneDisplay(p)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{getDeptDisplay(p)}</td>
                <td className="px-4 py-3 text-gray-600">{p.currentDay}일차</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${p.status === 'completed' ? 'bg-amber-400' : 'bg-primary-500'}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${p.status === 'completed' ? 'text-amber-600' : 'text-primary-600'}`}>{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full"><Award className="w-3 h-3" /> 완독</span>
                  ) : p.status === 'paused' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full">일시중지</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full"><TrendingUp className="w-3 h-3" /> 진행중</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.lastCompletedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl">검색 결과가 없습니다.</div>
        ) : filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">{p.memberName[0]}</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900">{p.memberName}</p>
                    {!p.sharedConsent && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">미동의</span>}
                  </div>
                  <p className="text-xs text-gray-500">{getDistrictDisplay(p)} · {getZoneDisplay(p)}</p>
                  {getDeptDisplay(p) !== '-' && <p className="text-xs text-gray-400">{getDeptDisplay(p)}</p>}
                </div>
              </div>
              {p.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full shrink-0"><Award className="w-3 h-3" /> 완독</span>
              ) : p.status === 'paused' ? (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full shrink-0">일시중지</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full shrink-0"><TrendingUp className="w-3 h-3" /> 진행중</span>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{p.currentDay}일차</span>
                <span className={`font-bold ${p.status === 'completed' ? 'text-amber-600' : 'text-primary-600'}`}>{p.progress}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${p.status === 'completed' ? 'bg-amber-400' : 'bg-primary-500'}`} style={{ width: `${p.progress}%` }} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.lastCompletedDate}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.startDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BiblePlanManagementPage() {
  const [showCampaign, setShowCampaign] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; color: string } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  if (selectedPlan) {
    return (
      <ProgressListView
        planId={selectedPlan.id}
        planName={selectedPlan.name}
        color={selectedPlan.color}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  const uniqueMembers = new Set(DEMO_PROGRESSES.map(p => p.memberName)).size;
  const totalProgresses = DEMO_PROGRESSES.length;
  const totalCompletions = DEMO_PROGRESSES.filter(p => p.status === 'completed').length;
  const totalActive = DEMO_PROGRESSES.filter(p => p.status === 'active' || p.status === 'paused').length;
  const overallAvg = Math.round(DEMO_PROGRESSES.reduce((s, p) => s + p.progress, 0) / (totalProgresses || 1));

  return (
    <div className="space-y-5">
      {showCampaign && <CampaignModal onClose={() => setShowCampaign(false)} />}

      <PageHeaderBar
        title="성경통독"
        description="말씀 통독 계획과 진행률을 확인하세요."
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: '참여자 수',    value: uniqueMembers,    unit: '명',  icon: Users,        bg: 'bg-primary-50',  ic: 'text-primary-500' },
          { label: '전체 참여',    value: totalProgresses,  unit: '건',  icon: Layers,       bg: 'bg-blue-50',     ic: 'text-blue-500' },
          { label: '진행 중',      value: totalActive,      unit: '건',  icon: TrendingUp,   bg: 'bg-emerald-50',  ic: 'text-emerald-500' },
          { label: '완독',         value: totalCompletions, unit: '건',  icon: Award,        bg: 'bg-amber-50',    ic: 'text-amber-500' },
          { label: '평균 진행률',  value: `${overallAvg}%`, unit: '',    icon: CheckCircle,  bg: 'bg-violet-50',   ic: 'text-violet-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.ic}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}<span className="text-sm font-normal text-gray-400 ml-0.5">{s.unit}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" /> 전체 통독 현황
        </h3>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-full rounded-full" style={{ width: `${overallAvg}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>참여자 {uniqueMembers}명 · 전체 {totalProgresses}건 참여</span>
          <span>평균 {overallAvg}%</span>
        </div>
      </div>

      {/* Per-plan cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-500" /> 플랜별 참여 현황
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">한 성도가 여러 플랜에 동시 참여 가능 — 플랜별 참여 건수 기준</p>
        </div>
        <div className="divide-y divide-gray-50">
          {READING_PLANS.map(plan => {
            const stats = getPlanStats(plan.id);
            const isExpanded = expandedPlan === plan.id;
            return (
              <div key={plan.id}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{plan.badge}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <span className="text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" /> {stats.members}명 · {stats.total}건</span>
                      <span className="text-primary-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 평균 {stats.avgProgress}%</span>
                      {stats.completions > 0 && <span className="text-amber-600 flex items-center gap-1"><Award className="w-3 h-3" /> 완독 {stats.completions}건</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {stats.total > 0 && (
                      <button onClick={() => setSelectedPlan({ id: plan.id, name: plan.name, color: plan.color })}
                        className="px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors">
                        참여자 보기
                      </button>
                    )}
                    <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)} className="p-1 text-gray-400 hover:text-gray-600">
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-4 bg-gray-50/50">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { val: stats.members, label: '참여자', c: 'text-gray-900' },
                        { val: stats.active, label: '진행중', c: 'text-primary-600' },
                        { val: stats.completions, label: '완독', c: 'text-amber-600' },
                        { val: `${stats.avgProgress}%`, label: '평균', c: 'text-emerald-600' },
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                          <p className={`text-base font-bold ${s.c}`}>{s.val}</p>
                          <p className="text-[10px] text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5"><span>평균 진행률</span><span>{stats.avgProgress}%</span></div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`bg-gradient-to-r ${plan.color} h-full rounded-full`} style={{ width: `${stats.avgProgress}%` }} />
                      </div>
                    </div>
                    {stats.total > 0 && (
                      <button onClick={() => setSelectedPlan({ id: plan.id, name: plan.name, color: plan.color })}
                        className="mt-3 w-full py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
                        참여자 {stats.total}건 보기
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-gray-400" /></div>
            <div className="flex-1"><p className="font-semibold text-gray-500 text-sm">맞춤형 통독</p><p className="text-xs text-gray-400">준비 중</p></div>
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold shrink-0">준비 중</span>
          </div>
        </div>
      </div>

      {/* Campaign */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary-500" /> 통독 캠페인</h3>
          <button onClick={() => setShowCampaign(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors">
            <Plus className="w-3.5 h-3.5" /> 새 캠페인
          </button>
        </div>
        <div className="text-center py-6 text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm text-gray-500">진행 중인 캠페인이 없습니다</p>
          <button onClick={() => setShowCampaign(true)} className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600">캠페인 만들기</button>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-xs text-amber-700 font-semibold mb-1">개인정보 보호 안내</p>
        <p className="text-xs text-amber-600 leading-relaxed">
          날짜별 세부 읽기 기록은 표시되지 않습니다. 이름·교구·구역·진행률·완독여부·최근 완료일만 표시됩니다.
          향후 성도가 <strong>공유에 동의한 경우</strong>에만 담당자와 상세 기록이 공유됩니다.
        </p>
      </div>
    </div>
  );
}
