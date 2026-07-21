import { useState, useCallback, useEffect } from 'react';
import {
  Search, X, Users, ChevronDown, ChevronUp,
  ChevronsUpDown, Edit, Trash2, MoreVertical, ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { supabase as _supabase } from '../../services/supabase';
import type { Member } from '../../services/supabase';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import MemberDetailSheet from './MemberDetailSheet';
import { getDemoData } from '../../services/demoData';
import {
  getAllDistricts, getAllZones, getAllDepartments,
  getDistrictNameById, getZoneNameById, getDepartmentNamesByIds,
} from '../../services/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { ChurchList, CHURCH_LIST_ROW_CLASS } from '../common/ui';
import { Avatar } from '../common/ui/Avatar';

/* ── Enriched member type ── */
export type RichMember = Member & {
  departmentName?: string;
  departmentNames?: string[];
  departmentIds?: string[];
  districtName?: string;
  areaName?: string;
  district?: string;
  area?: string;
  position?: string;
  memberStatus: '활동중' | '가입대기' | '장기결석' | '새가족' | '전출' | '기타';
  lastAttendance?: string;
  lastQt?: string;
  memos?: string[];
  baptismDate?: string;
};

const ROLE_COLORS: Record<string, string> = {
  '장로':     'bg-blue-100 text-blue-700',
  '안수집사': 'bg-teal-100 text-teal-700',
  '권사':     'bg-rose-100 text-rose-700',
  '서리집사': 'bg-orange-100 text-orange-700',
  '성도':     'bg-gray-100 text-gray-600',
};

/* ── Avatar (성도 기본 3D 프로필) ── */
function MemberAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return <Avatar name={name} role="member" size={size === 'sm' ? 'sm' : 'md'} />;
}

/* ── Sort icon ── */
type SortDir = 'asc' | 'desc';
type SortKey = 'name' | 'birth_date' | 'gender' | 'position' | 'phone' | 'district' | 'zone' | 'dept';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-gray-300 ml-0.5 inline-block" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-primary-500 ml-0.5 inline-block" />
    : <ChevronDown className="w-3 h-3 text-primary-500 ml-0.5 inline-block" />;
}

/* ── Row Action Menu ── */
function RowActions({ onView, onEdit, onDelete }: {
  onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 overflow-hidden">
            {[
              { label: '상세보기', icon: ChevronRight, action: onView },
              { label: '수정', icon: Edit, action: onEdit },
              { label: '삭제', icon: Trash2, action: onDelete, danger: true },
            ].map(a => (
              <button key={a.label} onClick={(e) => { e.stopPropagation(); setOpen(false); a.action(); }}
                className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm transition-colors ${a.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                <a.icon className="w-3.5 h-3.5" /> {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── PC Table ── */
function MemberTable({
  members, onSelect, onEdit, onDelete,
  l1, l2, deptLabel, sortKey, sortDir, onSort,
}: {
  members: RichMember[];
  onSelect: (m: RichMember) => void;
  onEdit: (m: RichMember) => void;
  onDelete: (id: string) => void;
  l1: string; l2: string; deptLabel: string;
  sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const cols: { label: string; key: SortKey | null }[] = [
    { label: '이름', key: 'name' },
    { label: '생년월일', key: 'birth_date' },
    { label: '성별', key: 'gender' },
    { label: '직분', key: 'position' },
    { label: '휴대폰', key: 'phone' },
    { label: l1, key: 'district' },
    { label: l2, key: 'zone' },
    { label: deptLabel, key: 'dept' },
    { label: '', key: null },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {cols.map((col, i) => (
                <th key={i}
                  className={`text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap ${col.key ? 'cursor-pointer select-none hover:text-primary-600' : ''}`}
                  onClick={col.key ? () => onSort(col.key!) : undefined}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    {col.key && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map(m => (
              <tr key={m.id} onClick={() => onSelect(m)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} role="member" size="sm" />
                    <span className="font-semibold text-gray-900">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{m.birth_date || '-'}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="text-xs text-gray-500">{m.gender === 'male' ? '남' : m.gender === 'female' ? '여' : '-'}</span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[m.position ?? ''] ?? ROLE_COLORS['성도']}`}>
                    {m.position || '성도'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{m.phone || '-'}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="text-xs text-gray-600">{m.districtName || '-'}</span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="text-xs text-gray-600">{m.areaName || '-'}</span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap max-w-[180px]">
                  {m.departmentNames && m.departmentNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {m.departmentNames.slice(0, 2).map(n => (
                        <span key={n} className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">{n}</span>
                      ))}
                      {m.departmentNames.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{m.departmentNames.length - 2}</span>
                      )}
                    </div>
                  ) : <span className="text-xs text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                  <RowActions onView={() => onSelect(m)} onEdit={() => onEdit(m)} onDelete={() => onDelete(m.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Mobile Card — shows all fields ── */
function MemberCard({ member, onSelect, l1, l2, deptLabel }: {
  member: RichMember;
  onSelect: () => void;
  l1: string; l2: string; deptLabel: string;
}) {
  return (
    <button onClick={onSelect}
      className={`${CHURCH_LIST_ROW_CLASS}`}>
      <div className="flex items-start gap-3">
        <Avatar name={member.name} role="member" size="md" />
        <div className="flex-1 min-w-0">
          {/* Name + position */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-900">{member.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[member.position ?? ''] ?? ROLE_COLORS['성도']}`}>
              {member.position || '성도'}
            </span>
          </div>
          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
            <span className="flex gap-1">
              <span className="text-gray-400 shrink-0">생년월일</span>
              <span className="text-gray-700 font-medium">{member.birth_date || '-'}</span>
            </span>
            <span className="flex gap-1">
              <span className="text-gray-400 shrink-0">성별</span>
              <span className="text-gray-700 font-medium">{member.gender === 'male' ? '남' : member.gender === 'female' ? '여' : '-'}</span>
            </span>
            <span className="flex gap-1">
              <span className="text-gray-400 shrink-0">휴대폰</span>
              <span className="text-gray-700">{member.phone || '-'}</span>
            </span>
            {(member.districtName && member.districtName !== '-') && (
              <span className="flex gap-1">
                <span className="text-gray-400 shrink-0">{l1}</span>
                <span className="text-gray-700">{member.districtName}</span>
              </span>
            )}
            {(member.areaName && member.areaName !== '-') && (
              <span className="flex gap-1">
                <span className="text-gray-400 shrink-0">{l2}</span>
                <span className="text-gray-700">{member.areaName}</span>
              </span>
            )}
          </div>
          {/* Departments */}
          {member.departmentNames && member.departmentNames.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              <span className="text-[10px] text-gray-400">{deptLabel}</span>
              {member.departmentNames.map(n => (
                <span key={n} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{n}</span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

/* ── Filter state type ── */
type ActiveFilters = {
  districtId: string;   // '' = none
  zoneId: string;       // '' = none
  deptId: string;       // '' = none
};

/* ── Dropdown helper ── */
function FilterBtn({
  label, active, open, count, onClick,
}: {
  label: string; active: boolean; open: boolean; count?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
        active
          ? 'bg-primary-50 text-primary-700 border-primary-200'
          : open
            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:text-primary-600'
      }`}
    >
      {label}
      {active && count !== undefined && count > 0 && (
        <span className="w-4 h-4 bg-primary-500 text-white rounded-full text-[10px] flex items-center justify-center">{count}</span>
      )}
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

function DropdownList({ items, selectedId, onSelect, onClose, emptyLabel }: {
  items: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onClose: () => void;
  emptyLabel: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute left-0 top-11 z-40 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 min-w-[160px] max-h-60 overflow-y-auto">
        {items.map(item => (
          <button key={item.id}
            onClick={() => { onSelect(item.id, item.name); onClose(); }}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              selectedId === item.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.name}
          </button>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-400 text-center py-3">{emptyLabel}</p>}
      </div>
    </>
  );
}

/* ── Sort helper ── */
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: '이름' },
  { key: 'birth_date', label: '생년월일' },
  { key: 'gender', label: '성별' },
  { key: 'position', label: '직분' },
  { key: 'phone', label: '휴대폰' },
  { key: 'district', label: '상위조직' },
  { key: 'zone', label: '하위조직' },
  { key: 'dept', label: '부서' },
];

function sortMembers(members: RichMember[], key: SortKey, dir: SortDir): RichMember[] {
  return [...members].sort((a, b) => {
    let va = '', vb = '';
    switch (key) {
      case 'name':       va = a.name; vb = b.name; break;
      case 'birth_date': va = a.birth_date ?? ''; vb = b.birth_date ?? ''; break;
      case 'gender':     va = a.gender ?? ''; vb = b.gender ?? ''; break;
      case 'position':   va = a.position ?? ''; vb = b.position ?? ''; break;
      case 'phone':      va = a.phone ?? ''; vb = b.phone ?? ''; break;
      case 'district':   va = a.districtName ?? ''; vb = b.districtName ?? ''; break;
      case 'zone':       va = a.areaName ?? ''; vb = b.areaName ?? ''; break;
      case 'dept':       va = a.departmentNames?.[0] ?? ''; vb = b.departmentNames?.[0] ?? ''; break;
    }
    const cmp = va.localeCompare(vb, 'ko');
    return dir === 'asc' ? cmp : -cmp;
  });
}

/* ── Main Export ── */
type Props = {
  onOpenForm: (member?: RichMember) => void;
  initialFilter?: string;
};

export default function MemberListTab({ onOpenForm, initialFilter }: Props) {
  const { isDesktop } = useBreakpoint();
  const { l1, l2, dept, settings } = useOrgSettings();
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<RichMember | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [openDropdown, setOpenDropdown] = useState<'district' | 'zone' | 'dept' | null>(null);

  const parseInitialFilter = (): ActiveFilters => {
    const base: ActiveFilters = { districtId: '', zoneId: '', deptId: '' };
    if (!initialFilter) return base;
    if (initialFilter.startsWith('district:')) return { ...base, districtId: initialFilter.replace('district:', '') };
    if (initialFilter.startsWith('zone:')) return { ...base, zoneId: initialFilter.replace('zone:', '') };
    if (initialFilter.startsWith('dept:')) return { ...base, deptId: initialFilter.replace('dept:', '') };
    return base;
  };

  const [filters, setFilters] = useState<ActiveFilters>(parseInitialFilter);

  const buildMembers = (): RichMember[] => {
    const demoData = getDemoData();
    return demoData.members.map(m => {
      const deptIds = m.departmentIds ?? (m.deptId ? [m.deptId] : []);
      return {
        id: m.id, user_id: m.id, name: m.name, phone: m.phone, email: m.email,
        gender: m.gender, birth_date: m.birthDate, baptism_date: m.baptismDate,
        role: m.position, is_active: m.memberStatus === '활동중' || m.memberStatus === '새가족',
        district: m.districtId, district_id: m.districtId,
        districtName: getDistrictNameById(m.districtId),
        area: m.zoneId, areaName: getZoneNameById(m.zoneId),
        department_id: m.deptId, departmentIds: deptIds,
        departmentName: getDepartmentNamesByIds(deptIds)[0] ?? '',
        departmentNames: getDepartmentNamesByIds(deptIds),
        position: m.position,
        memberStatus: m.memberStatus as RichMember['memberStatus'],
        lastAttendance: m.lastAttendance, lastQt: m.lastQt,
        join_date: m.joinDate, address: m.address ?? '',
        created_at: '', updated_at: '', memos: [],
      };
    });
  };

  const [allMembers, setAllMembers] = useState<RichMember[]>(buildMembers);
  useEffect(() => { setAllMembers(buildMembers()); }, [refreshKey]);

  const handleSort = (key: SortKey) => {
    setSortDir(d => sortKey === key ? (d === 'desc' ? 'asc' : 'desc') : 'desc');
    setSortKey(key);
  };

  // Org data
  const districts = getAllDistricts().filter(d => d.is_active);
  const allZones = getAllZones().filter(z => z.is_active);
  const zonesForSelected = filters.districtId
    ? allZones.filter(z => z.district_id === filters.districtId)
    : [];
  const departments = getAllDepartments().filter(d => d.is_active);

  // Derived display names
  const districtName = filters.districtId ? (getDistrictNameById(filters.districtId) ?? filters.districtId) : '';
  const zoneName = filters.zoneId ? (getZoneNameById(filters.zoneId) ?? filters.zoneId) : '';
  const deptName = filters.deptId ? (getDepartmentNamesByIds([filters.deptId])[0] ?? filters.deptId) : '';

  const setDistrict = (id: string) => {
    setFilters({ districtId: id, zoneId: '', deptId: filters.deptId });
  };
  const setZone = (id: string) => {
    setFilters(f => ({ ...f, zoneId: id }));
  };
  const setDept = (id: string) => {
    setFilters(f => ({ ...f, deptId: id }));
  };
  const removeDistrict = () => setFilters(f => ({ ...f, districtId: '', zoneId: '' }));
  const removeZone = () => setFilters(f => ({ ...f, zoneId: '' }));
  const removeDept = () => setFilters(f => ({ ...f, deptId: '' }));
  const resetFilters = () => setFilters({ districtId: '', zoneId: '', deptId: '' });

  const filtered = allMembers.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || m.name.toLowerCase().includes(q)
      || (m.phone || '').includes(q)
      || (m.position || '').toLowerCase().includes(q)
      || (m.districtName || '').toLowerCase().includes(q);
    const matchDistrict = !filters.districtId || m.district === filters.districtId;
    const matchZone = !filters.zoneId || m.area === filters.zoneId;
    const matchDept = !filters.deptId || (m.departmentIds ?? []).includes(filters.deptId);
    return matchSearch && matchDistrict && matchZone && matchDept;
  });

  const sorted = sortMembers(filtered, sortKey, sortDir);
  const handleDelete = useCallback((_id: string) => { /* demo only */ }, []);
  const handleClose = () => { setSelectedMember(null); setRefreshKey(k => k + 1); };

  const l1Label = settings.level1Enabled ? l1 : '교구';
  const l2Label = settings.level2Enabled ? l2 : '구역';
  const deptLabel = settings.departmentEnabled ? dept : '부서';

  const hasFilters = !!(filters.districtId || filters.zoneId || filters.deptId);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="이름, 직분, 연락처 검색"
          className="w-full pl-10 pr-4 bg-white border border-gray-200 text-sm focus:border-primary-400 focus:ring-0 focus:outline-none transition-all"
          style={{ height: '44px', borderRadius: '14px' }} />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter buttons row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* District dropdown */}
        <div className="relative">
          <FilterBtn
            label={l1Label} active={!!filters.districtId} open={openDropdown === 'district'}
            onClick={() => setOpenDropdown(o => o === 'district' ? null : 'district')}
          />
          {openDropdown === 'district' && (
            <DropdownList
              items={districts} selectedId={filters.districtId}
              onSelect={(id) => { setDistrict(id); }}
              onClose={() => setOpenDropdown(null)}
              emptyLabel="항목 없음"
            />
          )}
        </div>

        {/* Zone dropdown — only visible after district selected */}
        {filters.districtId && (
          <div className="relative">
            <FilterBtn
              label={l2Label} active={!!filters.zoneId} open={openDropdown === 'zone'}
              onClick={() => setOpenDropdown(o => o === 'zone' ? null : 'zone')}
            />
            {openDropdown === 'zone' && (
              <DropdownList
                items={zonesForSelected} selectedId={filters.zoneId}
                onSelect={(id) => { setZone(id); }}
                onClose={() => setOpenDropdown(null)}
                emptyLabel="해당 구역 없음"
              />
            )}
          </div>
        )}

        {/* Dept dropdown — always available */}
        <div className="relative">
          <FilterBtn
            label={deptLabel} active={!!filters.deptId} open={openDropdown === 'dept'}
            onClick={() => setOpenDropdown(o => o === 'dept' ? null : 'dept')}
          />
          {openDropdown === 'dept' && (
            <DropdownList
              items={departments} selectedId={filters.deptId}
              onSelect={(id) => { setDept(id); }}
              onClose={() => setOpenDropdown(null)}
              emptyLabel="항목 없음"
            />
          )}
        </div>

        {/* Mobile sort */}
        {!isDesktop && (
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={e => {
              const [k, d] = e.target.value.split(':');
              setSortKey(k as SortKey);
              setSortDir(d as SortDir);
            }}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 focus:border-primary-400 focus:ring-0"
          >
            {SORT_OPTIONS.map(o => (
              <optgroup key={o.key} label={o.label}>
                <option value={`${o.key}:desc`}>{o.label} ↓</option>
                <option value={`${o.key}:asc`}>{o.label} ↑</option>
              </optgroup>
            ))}
          </select>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {filters.districtId && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              {districtName}
              <button onClick={removeDistrict} className="hover:text-primary-900 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.zoneId && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              {zoneName}
              <button onClick={removeZone} className="hover:text-primary-900 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.deptId && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              {deptName}
              <button onClick={removeDept} className="hover:text-primary-900 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full text-xs font-semibold transition-colors">
            <RotateCcw className="w-3 h-3" /> 초기화
          </button>
        </div>
      )}

      {/* Result summary */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          총 <strong className="text-gray-700">{allMembers.length}</strong>명 중&nbsp;
          <strong className="text-primary-600">{sorted.length}</strong>명 표시
        </span>
        <span className="bg-amber-50 text-amber-600 text-[10px] px-2.5 py-1 rounded-full font-semibold">데모 데이터</span>
      </div>

      {/* Desktop: Table */}
      {isDesktop && (
        <MemberTable
          members={sorted} onSelect={setSelectedMember} onEdit={onOpenForm} onDelete={handleDelete}
          l1={l1Label} l2={l2Label} deptLabel={deptLabel}
          sortKey={sortKey} sortDir={sortDir} onSort={handleSort}
        />
      )}

      {/* Mobile: Cards */}
      {!isDesktop && (
        <ChurchList>
          {sorted.map(m => (
            <MemberCard
              key={m.id} member={m} onSelect={() => setSelectedMember(m)}
              l1={l1Label} l2={l2Label} deptLabel={deptLabel}
            />
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-14">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">검색 결과가 없습니다</p>
              <button onClick={() => { setSearch(''); resetFilters(); }}
                className="mt-2 text-primary-500 text-sm font-medium hover:underline">
                필터 초기화
              </button>
            </div>
          )}
        </ChurchList>
      )}

      {/* Detail sheet */}
      {selectedMember && (
        <MemberDetailSheet member={selectedMember} onClose={handleClose} />
      )}
    </div>
  );
}
