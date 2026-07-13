/**
 * 은혜기록 공개범위 + 공유 대상 선택 (사용자 소속 조직 기준)
 */

import { useMemo } from 'react';
import { Lock, Eye, Users, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { GraceNoteVisibility } from '../../data/graceNotes';
import {
  getEligiblePastorsForUser,
  getEligibleGroupsForUser,
  uniqueIds,
  filterShareStateToMembership,
} from '../../services/graceNoteShareScope';

export type GraceNoteShareState = {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
};

const VISIBILITY_OPTIONS: {
  value: GraceNoteVisibility;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { value: 'private', label: '나만 보기', desc: '나만 볼 수 있어요', icon: <Lock className="w-3.5 h-3.5" /> },
  { value: 'pastor', label: '담당 교역자와 공유', desc: '내 소속 담당 교역자만', icon: <Eye className="w-3.5 h-3.5" /> },
  { value: 'group', label: '교구/부서 공유', desc: '내가 속한 조직·부서원', icon: <Users className="w-3.5 h-3.5" /> },
  { value: 'public', label: '전체 공개', desc: '교회 성도 모두가 볼 수 있어요', icon: <Globe className="w-3.5 h-3.5" /> },
];

export function defaultShareState(existing?: Partial<GraceNoteShareState>): GraceNoteShareState {
  return {
    visibility: existing?.visibility ?? 'private',
    sharedPastorAll: existing?.sharedPastorAll ?? false,
    sharedPastorIds: uniqueIds(existing?.sharedPastorIds),
    sharedGroupAll: existing?.sharedGroupAll ?? false,
    sharedGroupIds: uniqueIds(existing?.sharedGroupIds),
  };
}

export function GraceNoteShareSelector({ value, onChange }: {
  value: GraceNoteShareState;
  onChange: (v: GraceNoteShareState) => void;
}) {
  const { user } = useAuth();

  const eligiblePastors = useMemo(() => getEligiblePastorsForUser(user), [user]);
  const eligibleGroups = useMemo(() => getEligibleGroupsForUser(user), [user]);

  const hasPastors = eligiblePastors.length > 0;
  const hasGroups =
    eligibleGroups.districts.length +
    eligibleGroups.zones.length +
    eligibleGroups.departments.length > 0;

  const setVisibility = (visibility: GraceNoteVisibility) => {
    if (visibility === 'pastor' && !hasPastors) return;
    if (visibility === 'group' && !hasGroups) return;
    onChange(filterShareStateToMembership({
      ...value,
      visibility,
      sharedPastorAll: visibility === 'pastor' ? value.sharedPastorAll : false,
      sharedPastorIds: visibility === 'pastor' ? uniqueIds(value.sharedPastorIds) : [],
      sharedGroupAll: visibility === 'group' ? value.sharedGroupAll : false,
      sharedGroupIds: visibility === 'group' ? uniqueIds(value.sharedGroupIds) : [],
    }, user));
  };

  const togglePastor = (id: string) => {
    const ids = value.sharedPastorIds.includes(id)
      ? value.sharedPastorIds.filter(x => x !== id)
      : uniqueIds([...value.sharedPastorIds, id]);
    onChange({ ...value, sharedPastorAll: false, sharedPastorIds: ids });
  };

  const toggleGroup = (id: string) => {
    const ids = value.sharedGroupIds.includes(id)
      ? value.sharedGroupIds.filter(x => x !== id)
      : uniqueIds([...value.sharedGroupIds, id]);
    onChange({ ...value, sharedGroupAll: false, sharedGroupIds: ids });
  };

  const isOptionDisabled = (v: GraceNoteVisibility) => {
    if (v === 'pastor') return !hasPastors;
    if (v === 'group') return !hasGroups;
    return false;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-gray-500" /> 공개 범위
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VISIBILITY_OPTIONS.map(opt => {
            const disabled = isOptionDisabled(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => setVisibility(opt.value)}
                className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all touch-target ${
                  disabled
                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                    : value.visibility === opt.value
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  value.visibility === opt.value && !disabled
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {opt.icon}
                </span>
                <span className="min-w-0">
                  <span className={`block text-xs font-bold leading-tight ${
                    value.visibility === opt.value && !disabled ? 'text-primary-700' : 'text-gray-700'
                  }`}>
                    {opt.label}
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        {!hasPastors && (
          <p className="text-xs text-amber-600 mt-2">현재 연결된 담당 교역자가 없습니다.</p>
        )}
        {!hasGroups && (
          <p className="text-xs text-amber-600 mt-1">현재 소속된 교구 또는 부서가 없습니다.</p>
        )}
      </div>

      {value.visibility === 'pastor' && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-600">공유할 담당 교역자 선택</p>
          {!hasPastors ? (
            <p className="text-sm text-gray-500">현재 연결된 담당 교역자가 없습니다.</p>
          ) : (
            <>
              <label className="flex items-center gap-3 touch-target cursor-pointer">
                <input
                  type="radio"
                  name="pastor-share-mode"
                  checked={value.sharedPastorAll}
                  onChange={() => onChange({ ...value, sharedPastorAll: true, sharedPastorIds: [] })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-semibold text-gray-800">전체 (내 담당 교역자)</span>
              </label>
              <label className="flex items-center gap-3 touch-target cursor-pointer">
                <input
                  type="radio"
                  name="pastor-share-mode"
                  checked={!value.sharedPastorAll}
                  onChange={() => onChange({ ...value, sharedPastorAll: false })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-semibold text-gray-800">직접 선택</span>
              </label>
              {!value.sharedPastorAll && (
                <div className="space-y-2 pt-1 max-h-52 overflow-y-auto">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">담당 교역자</p>
                  {eligiblePastors.map(p => (
                    <label key={p.id} className="flex items-start gap-3 touch-target cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={value.sharedPastorIds.includes(p.id)}
                        onChange={() => togglePastor(p.id)}
                        className="w-4 h-4 rounded text-primary-600 mt-0.5"
                      />
                      <span className="text-sm text-gray-800 leading-snug">
                        {p.name} {p.position}
                        {p.orgLabels.length > 0 && (
                          <span className="text-gray-400"> · {p.orgLabels.join(', ')}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {value.visibility === 'group' && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-600">공유할 교구·부서 선택</p>
          {!hasGroups ? (
            <p className="text-sm text-gray-500">현재 소속된 교구 또는 부서가 없습니다.</p>
          ) : (
            <>
              <label className="flex items-center gap-3 touch-target cursor-pointer">
                <input
                  type="radio"
                  name="group-share-mode"
                  checked={value.sharedGroupAll}
                  onChange={() => onChange({ ...value, sharedGroupAll: true, sharedGroupIds: [] })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-semibold text-gray-800">전체 (내 소속 조직)</span>
              </label>
              <label className="flex items-center gap-3 touch-target cursor-pointer">
                <input
                  type="radio"
                  name="group-share-mode"
                  checked={!value.sharedGroupAll}
                  onChange={() => onChange({ ...value, sharedGroupAll: false })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-semibold text-gray-800">직접 선택</span>
              </label>
              {!value.sharedGroupAll && (
                <div className="space-y-3 pt-1 max-h-56 overflow-y-auto">
                  {eligibleGroups.districts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">상위조직</p>
                      <div className="space-y-1">
                        {eligibleGroups.districts.map(d => (
                          <label key={d.id} className="flex items-center gap-3 touch-target cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={value.sharedGroupIds.includes(d.id)}
                              onChange={() => toggleGroup(d.id)}
                              className="w-4 h-4 rounded text-primary-600"
                            />
                            <span className="text-sm text-gray-800">{d.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {eligibleGroups.zones.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">하위조직</p>
                      <div className="space-y-1">
                        {eligibleGroups.zones.map(z => (
                          <label key={z.id} className="flex items-center gap-3 touch-target cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={value.sharedGroupIds.includes(z.id)}
                              onChange={() => toggleGroup(z.id)}
                              className="w-4 h-4 rounded text-primary-600"
                            />
                            <span className="text-sm text-gray-800">{z.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {eligibleGroups.departments.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">부서</p>
                      <div className="space-y-1">
                        {eligibleGroups.departments.map(d => (
                          <label key={d.id} className="flex items-center gap-3 touch-target cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={value.sharedGroupIds.includes(d.id)}
                              onChange={() => toggleGroup(d.id)}
                              className="w-4 h-4 rounded text-primary-600"
                            />
                            <span className="text-sm text-gray-800">{d.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function shareStateToInput(state: GraceNoteShareState) {
  return {
    visibility: state.visibility,
    sharedPastorAll: state.sharedPastorAll,
    sharedPastorIds: uniqueIds(state.sharedPastorIds),
    sharedGroupAll: state.sharedGroupAll,
    sharedGroupIds: uniqueIds(state.sharedGroupIds),
  };
}
