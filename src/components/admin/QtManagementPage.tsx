import { useState, useMemo } from 'react';
import { BookHeart, X, Calendar, SortAsc, SortDesc } from 'lucide-react';
import { getDemoData } from '../../lib/demoData';
import { getAllDistricts, getAllZones, getAllDepartments, getDistrictNameById, getDepartmentNameById } from '../../lib/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { PageLayout, Badge, SearchInput, IconButton } from '../ui';

type Visibility = 'all' | 'pastor' | 'public';
type SortDir = 'desc' | 'asc';

const VIS_LABELS: Record<string, string> = { private: '비공개', pastor: '교역자공유', public: '전체공개' };
const VIS_COLORS: Record<string, 'gray' | 'blue' | 'green'> = { private: 'gray', pastor: 'blue', public: 'green' };

export default function QtManagementPage() {
  const { l1, l2, dept, settings } = useOrgSettings();
  const demoData = getDemoData();
  const districts   = getAllDistricts().filter(d => d.is_active);
  const allZones    = getAllZones().filter(z => z.is_active);
  const departments = getAllDepartments().filter(d => d.is_active);

  const [search, setSearch]               = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [districtFilter, setDistrictFilter] = useState('전체');
  const [zoneFilter, setZoneFilter]       = useState('전체');
  const [deptFilter, setDeptFilter]       = useState('전체');
  const [visFilter, setVisFilter]         = useState<Visibility>('all');
  const [sortDir, setSortDir]             = useState<SortDir>('desc');

  const visibleZones = districtFilter !== '전체' ? allZones.filter(z => z.district_id === districtFilter) : allZones;

  const entries = useMemo(() => {
    return demoData.qtEntries
      .filter(e => e.visibility !== 'private')
      .filter(e => { if (visFilter === 'pastor') return e.visibility === 'pastor'; if (visFilter === 'public') return e.visibility === 'public'; return true; })
      .filter(e => !search || e.memberName.includes(search))
      .filter(e => districtFilter === '전체' || e.districtId === districtFilter)
      .filter(e => zoneFilter === '전체' || e.zoneId === zoneFilter)
      .filter(e => deptFilter === '전체' || e.deptId === deptFilter)
      .sort((a, b) => sortDir === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [demoData.qtEntries, search, districtFilter, zoneFilter, deptFilter, visFilter, sortDir]);

  const hasFilter = districtFilter !== '전체' || zoneFilter !== '전체' || deptFilter !== '전체' || visFilter !== 'all';
  const resetFilters = () => { setDistrictFilter('전체'); setZoneFilter('전체'); setDeptFilter('전체'); setVisFilter('all'); };

  return (
    <PageLayout
      header={{ title: '은혜기록', description: '말씀과 삶 속에서 받은 은혜를 기록하고 나누세요.' }}
      toolbar={{
        search: { value: search, onChange: setSearch, placeholder: '성도 이름 검색' },
        right: (
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition-all"
          >
            {sortDir === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            {sortDir === 'desc' ? '최신순' : '오래된순'}
          </button>
        ),
      }}
      empty={{ icon: <BookHeart size={28} />, title: '은혜기록이 없습니다', action: hasFilter ? { label: '필터 초기화', onClick: resetFilters } : undefined }}
    >
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-600 mb-4">
        공개 범위가 <strong>교역자 공유</strong> 또는 <strong>전체 공개</strong>인 은혜기록만 조회됩니다.
      </div>

      {/* Filter panel toggle */}
      <div className="mb-3">
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${showFilters || hasFilter ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          필터{hasFilter ? ' (적용됨)' : ''}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-sm">조직 필터</h4>
            <div className="flex items-center gap-2">
              {hasFilter && <button onClick={resetFilters} className="text-xs text-primary-600 font-medium hover:underline">초기화</button>}
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">공개 범위</p>
            <div className="flex gap-2">
              {([['all','전체'],['pastor','교역자 공유'],['public','전체 공개']] as [Visibility, string][]).map(([v, label]) => (
                <button key={v} onClick={() => setVisFilter(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${visFilter === v ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {settings.level1Enabled && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{l1}</p>
                <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setZoneFilter('전체'); }} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400">
                  <option value="전체">전체</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            {settings.level2Enabled && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{l2}</p>
                <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400">
                  <option value="전체">전체</option>
                  {visibleZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            )}
            {settings.departmentEnabled && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{dept}</p>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400">
                  <option value="전체">전체</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {entries.map(e => (
        <div key={e.id} className="bg-white rounded-card border border-gray-200 shadow-card-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-100 to-primary-100 flex items-center justify-center text-xs font-bold text-accent-700 shrink-0">
                  {e.memberName.charAt(0)}
                </div>
                <span className="font-bold text-gray-900 text-sm">{e.memberName}</span>
                <Badge variant={VIS_COLORS[e.visibility] ?? 'gray'} size="sm">{VIS_LABELS[e.visibility] ?? e.visibility}</Badge>
                {e.districtId && <Badge variant="gray" size="sm">{getDistrictNameById(e.districtId) !== '-' ? getDistrictNameById(e.districtId) : (e.districtName ?? '')}</Badge>}
                {e.deptId && <Badge variant="gray" size="sm">{getDepartmentNameById(e.deptId) !== '-' ? getDepartmentNameById(e.deptId) : (e.deptName ?? '')}</Badge>}
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-0.5">{e.title}</h4>
              <p className="text-xs text-primary-600 font-medium mb-1">{e.bibleVerse}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{e.content}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" /> {e.date}
            </div>
          </div>
        </div>
      ))}
    </PageLayout>
  );
}

