import { useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { PrayerOrganizationScope } from '../../types/prayer';
import { CHURCH_WIDE_SCOPE } from '../../types/prayer';
import {
  getDistricts,
  getZones,
  getDepartments,
  ensureYouthOrgDemo,
  getDepartmentNamesByIds,
} from '../../services/orgData';

const SELECT =
  'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700';

type Props = {
  value: PrayerOrganizationScope;
  onChange: (scope: PrayerOrganizationScope) => void;
  disabled?: boolean;
};

/**
 * 기도 조직범위 — 상위조직 → 하위조직 → 부서(복수)
 */
export default function PrayerOrganizationScopePicker({ value, onChange, disabled }: Props) {
  useEffect(() => { ensureYouthOrgDemo(); }, []);

  const districts = useMemo(() => getDistricts(), []);
  const departments = useMemo(() => getDepartments(), []);

  const selectedDistrictId = value.districtIds[0] ?? '';
  const selectedGroupId = value.groupIds[0] ?? '';
  const groups = useMemo(
    () => (selectedDistrictId ? getZones(selectedDistrictId) : []),
    [selectedDistrictId],
  );

  const setDistrict = (id: string) => {
    onChange({
      districtIds: id ? [id] : [],
      groupIds: [],
      departmentIds: value.departmentIds,
    });
  };

  const setGroup = (id: string) => {
    onChange({
      ...value,
      groupIds: id ? [id] : [],
    });
  };

  const toggleDept = (id: string) => {
    const has = value.departmentIds.includes(id);
    onChange({
      ...value,
      departmentIds: has
        ? value.departmentIds.filter(d => d !== id)
        : [...value.departmentIds, id],
    });
  };

  const isWide = (
    value.districtIds.length === 0 &&
    value.groupIds.length === 0 &&
    value.departmentIds.length === 0
  );

  const deptNames = getDepartmentNamesByIds(value.departmentIds);

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">조직 범위</p>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(CHURCH_WIDE_SCOPE)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg transition-colors ${
              isWide ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            전체 교회
          </button>
        )}
      </div>

      {/* 상위조직 */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-1.5 block">상위조직</label>
        <select
          value={selectedDistrictId}
          onChange={e => setDistrict(e.target.value)}
          disabled={disabled}
          className={SELECT}
        >
          <option value="">선택하세요</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-center text-gray-300">
        <ChevronDown className="w-4 h-4" />
      </div>

      {/* 하위조직 */}
      <div>
        <label className={`text-xs font-bold mb-1.5 block ${
          selectedDistrictId ? 'text-gray-600' : 'text-gray-300'
        }`}>
          하위조직
        </label>
        <select
          value={selectedGroupId}
          onChange={e => setGroup(e.target.value)}
          disabled={disabled || !selectedDistrictId}
          className={`${SELECT} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <option value="">선택하세요</option>
          {groups.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-center text-gray-300">
        <ChevronDown className="w-4 h-4" />
      </div>

      {/* 부서 (복수) */}
      <div>
        <label className="text-xs font-bold text-gray-600 mb-1.5 block">부서</label>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {departments.map(d => {
            const checked = value.departmentIds.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDept(d.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-sm transition-all text-left ${
                  checked
                    ? 'border-primary-400 bg-primary-50 text-primary-800'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 ${
                  checked ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-medium">{d.name}</span>
              </button>
            );
          })}
        </div>
        {deptNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {deptNames.map(n => (
              <span key={n} className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
