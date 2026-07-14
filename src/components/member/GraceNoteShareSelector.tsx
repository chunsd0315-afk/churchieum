/**
 * 은혜기록 공개범위 + 공유 대상 선택
 * 조직명은 조직관리(OrgSettings) 설정을 동적으로 반영한다.
 */

import { useMemo, useState } from 'react';
import { Lock, Users, Globe, UserRound, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { GraceNoteVisibility } from '../../data/graceNotes';
import {
  getEligiblePastorsForUser,
  getEligibleGroupsForUser,
  uniqueIds,
  filterShareStateToMembership,
  composeSharedGroupIds,
  splitOrganizationShareIds,
  ensureParentUpperIds,
  formatGroupShareOptionLabel,
  formatGroupShareOptionDesc,
  getOrganizationLabels,
  formatLowerWithUpperLabel,
  getLowerOrganizationDisplayLabel,
  type EligiblePastor,
  type GraceShareFields,
} from '../../services/graceNoteShareScope';
import { ChurchConfirmDialog } from '../common/ui/ChurchConfirmDialog';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export type UpperOrgSelectionFlag = {
  selectedDirectly: boolean;
  selectedByChildren: boolean;
};

export type GraceNoteShareState = {
  visibility: GraceNoteVisibility;
  sharedPastorAll: boolean;
  sharedPastorIds: string[];
  sharedGroupAll: boolean;
  sharedGroupIds: string[];
  sharedUpperOrganizationIds: string[];
  sharedLowerOrganizationIds: string[];
  sharedDepartmentIds: string[];
  /** UI용 — 상위조직 직접/자식선택 구분 */
  upperSelectionFlags: Record<string, UpperOrgSelectionFlag>;
};

function buildUpperFlags(
  upperIds: string[],
  lowerIds: string[],
  zones: { id: string; parentId?: string }[],
  existing?: Record<string, UpperOrgSelectionFlag>,
): Record<string, UpperOrgSelectionFlag> {
  const flags: Record<string, UpperOrgSelectionFlag> = { ...(existing ?? {}) };
  const lowerByParent = new Map<string, string[]>();
  for (const z of zones) {
    if (!z.parentId) continue;
    if (!lowerByParent.has(z.parentId)) lowerByParent.set(z.parentId, []);
    if (lowerIds.includes(z.id)) lowerByParent.get(z.parentId)!.push(z.id);
  }

  for (const id of upperIds) {
    const selectedByChildren = (lowerByParent.get(id)?.length ?? 0) > 0;
    const prev = flags[id];
    const selectedDirectly = prev ? prev.selectedDirectly : !selectedByChildren;
    flags[id] = {
      selectedDirectly: selectedDirectly || (!selectedByChildren),
      selectedByChildren,
    };
  }

  for (const key of Object.keys(flags)) {
    if (!upperIds.includes(key)) delete flags[key];
  }
  return flags;
}

function toShareFields(state: GraceNoteShareState): GraceShareFields {
  const upper = uniqueIds(state.sharedUpperOrganizationIds);
  const lower = uniqueIds(state.sharedLowerOrganizationIds);
  const departments = uniqueIds(state.sharedDepartmentIds);
  return {
    visibility: state.visibility,
    sharedPastorAll: state.sharedPastorAll,
    sharedPastorIds: uniqueIds(state.sharedPastorIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
  };
}

export function defaultShareState(existing?: Partial<GraceNoteShareState> | Partial<GraceShareFields>): GraceNoteShareState {
  const split = splitOrganizationShareIds({
    sharedGroupIds: existing?.sharedGroupIds,
    sharedUpperOrganizationIds: existing?.sharedUpperOrganizationIds,
    sharedLowerOrganizationIds: existing?.sharedLowerOrganizationIds,
    sharedDepartmentIds: existing?.sharedDepartmentIds,
  });
  const upper = uniqueIds(split.upper);
  const lower = uniqueIds(split.lower);
  const departments = uniqueIds(split.departments);
  return {
    visibility: existing?.visibility ?? 'private',
    sharedPastorAll: existing?.sharedPastorAll ?? false,
    sharedPastorIds: uniqueIds(existing?.sharedPastorIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
    upperSelectionFlags:
      (existing as GraceNoteShareState | undefined)?.upperSelectionFlags ??
      buildUpperFlags(upper, lower, [], {}),
  };
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 max-w-full px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[12px] font-semibold border border-primary-100">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded-full hover:bg-primary-100 touch-target"
          aria-label={`${label} 선택 해제`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  sublabel,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 py-2.5 min-h-[48px] touch-target cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-gray-800 leading-snug">{label}</span>
        {sublabel && <span className="block text-[12px] text-gray-500 mt-0.5">{sublabel}</span>}
      </span>
    </label>
  );
}

export function GraceNoteShareSelector({ value, onChange }: {
  value: GraceNoteShareState;
  onChange: (v: GraceNoteShareState) => void;
}) {
  const { user } = useAuth();
  const { l1, l2, dept } = useOrgSettings();
  const { isMobile } = useBreakpoint();
  const labels = useMemo(() => getOrganizationLabels(), [l1, l2, dept]);

  const [orgPanelOpen, setOrgPanelOpen] = useState(true);
  const [confirmUpperClear, setConfirmUpperClear] = useState<string | null>(null);

  const eligiblePastors = useMemo(() => getEligiblePastorsForUser(user), [user]);
  const eligibleGroups = useMemo(() => getEligibleGroupsForUser(user), [user]);

  const hasPastors = eligiblePastors.length > 0;
  const hasGroups =
    eligibleGroups.districts.length +
      eligibleGroups.zones.length +
      eligibleGroups.departments.length >
    0;

  const visibilityOptions = useMemo(() => [
    {
      value: 'private' as const,
      label: '나만 보기',
      desc: '나만 확인할 수 있습니다.',
      icon: Lock,
    },
    {
      value: 'pastor' as const,
      label: '담당 교역자와 공유',
      desc: '내 소속 담당 교역자에게만 공유합니다.',
      icon: UserRound,
    },
    {
      value: 'group' as const,
      label: formatGroupShareOptionLabel(labels),
      desc: formatGroupShareOptionDesc(labels),
      icon: Users,
    },
    {
      value: 'public' as const,
      label: '전체 공개',
      desc: '교회 구성원 전체가 볼 수 있습니다.',
      icon: Globe,
    },
  ], [labels]);

  const childZonesOf = (districtId: string) =>
    eligibleGroups.zones.filter(z => z.parentId === districtId);

  const orphanZones = useMemo(
    () =>
      eligibleGroups.zones.filter(
        z => !z.parentId || !eligibleGroups.districts.some(d => d.id === z.parentId),
      ),
    [eligibleGroups],
  );

  const pastorChipList: EligiblePastor[] = useMemo(() => {
    if (value.sharedPastorAll) return eligiblePastors;
    return eligiblePastors.filter(p => value.sharedPastorIds.includes(p.id));
  }, [value.sharedPastorAll, value.sharedPastorIds, eligiblePastors]);

  const emitOrgState = (
    next: {
      upper: string[];
      lower: string[];
      departments: string[];
      flags: Record<string, UpperOrgSelectionFlag>;
    },
  ) => {
    const upper = uniqueIds(next.upper);
    const lower = uniqueIds(next.lower);
    const departments = uniqueIds(next.departments);
    onChange({
      ...value,
      sharedGroupAll: false,
      sharedUpperOrganizationIds: upper,
      sharedLowerOrganizationIds: lower,
      sharedDepartmentIds: departments,
      sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
      upperSelectionFlags: buildUpperFlags(upper, lower, eligibleGroups.zones, next.flags),
    });
  };

  const allPastorsSelected =
    value.sharedPastorAll ||
    (eligiblePastors.length > 0 &&
      eligiblePastors.every(p => value.sharedPastorIds.includes(p.id)));

  const setVisibility = (visibility: GraceNoteVisibility) => {
    if (visibility === 'pastor' && !hasPastors) return;
    if (visibility === 'group' && !hasGroups) return;
    const cleared = defaultShareState({ visibility });
    const filtered = filterShareStateToMembership(toShareFields(cleared), user);
    onChange({
      ...cleared,
      ...filtered,
      upperSelectionFlags: {},
    });
    if (visibility === 'group') setOrgPanelOpen(true);
  };

  const togglePastorAll = () => {
    if (allPastorsSelected) {
      onChange({ ...value, sharedPastorAll: false, sharedPastorIds: [] });
    } else {
      onChange({
        ...value,
        sharedPastorAll: true,
        sharedPastorIds: uniqueIds(eligiblePastors.map(p => p.id)),
      });
    }
  };

  const togglePastor = (id: string) => {
    let ids = value.sharedPastorAll
      ? eligiblePastors.map(p => p.id)
      : [...value.sharedPastorIds];
    ids = ids.includes(id) ? ids.filter(x => x !== id) : uniqueIds([...ids, id]);
    const allOn =
      eligiblePastors.length > 0 && eligiblePastors.every(p => ids.includes(p.id));
    onChange({
      ...value,
      sharedPastorAll: allOn,
      sharedPastorIds: allOn ? uniqueIds(eligiblePastors.map(p => p.id)) : ids,
    });
  };

  const isUpperOn = (id: string) => value.sharedUpperOrganizationIds.includes(id);
  const isLowerOn = (id: string) => value.sharedLowerOrganizationIds.includes(id);
  const isDeptOn = (id: string) => value.sharedDepartmentIds.includes(id);

  const selectUpperDirect = (id: string) => {
    const flags = { ...value.upperSelectionFlags };
    flags[id] = { selectedDirectly: true, selectedByChildren: flags[id]?.selectedByChildren ?? false };
    emitOrgState({
      upper: uniqueIds([...value.sharedUpperOrganizationIds, id]),
      lower: value.sharedLowerOrganizationIds,
      departments: value.sharedDepartmentIds,
      flags,
    });
  };

  const clearUpperWithChildren = (id: string) => {
    const childIds = new Set(childZonesOf(id).map(z => z.id));
    const flags = { ...value.upperSelectionFlags };
    delete flags[id];
    emitOrgState({
      upper: value.sharedUpperOrganizationIds.filter(x => x !== id),
      lower: value.sharedLowerOrganizationIds.filter(x => !childIds.has(x)),
      departments: value.sharedDepartmentIds,
      flags,
    });
  };

  const requestToggleUpper = (id: string) => {
    if (isUpperOn(id)) {
      const hasSelectedChildren = childZonesOf(id).some(z => isLowerOn(z.id));
      if (hasSelectedChildren) {
        setConfirmUpperClear(id);
        return;
      }
      const flags = { ...value.upperSelectionFlags };
      delete flags[id];
      emitOrgState({
        upper: value.sharedUpperOrganizationIds.filter(x => x !== id),
        lower: value.sharedLowerOrganizationIds,
        departments: value.sharedDepartmentIds,
        flags,
      });
      return;
    }
    selectUpperDirect(id);
  };

  const toggleLower = (zoneId: string, parentId?: string) => {
    const turningOff = isLowerOn(zoneId);
    let lower = turningOff
      ? value.sharedLowerOrganizationIds.filter(x => x !== zoneId)
      : uniqueIds([...value.sharedLowerOrganizationIds, zoneId]);

    let upper = [...value.sharedUpperOrganizationIds];
    const flags = { ...value.upperSelectionFlags };

    if (!turningOff && parentId) {
      upper = uniqueIds([...upper, parentId]);
      const prev = flags[parentId];
      flags[parentId] = {
        selectedDirectly: prev?.selectedDirectly ?? false,
        selectedByChildren: true,
      };
      if (!prev?.selectedDirectly && !prev?.selectedByChildren) {
        // 자식으로만 자동 선택된 경우
        flags[parentId].selectedDirectly = false;
        flags[parentId].selectedByChildren = true;
      } else if (prev?.selectedDirectly) {
        flags[parentId] = { selectedDirectly: true, selectedByChildren: true };
      }
    }

    if (turningOff && parentId) {
      const stillHasChild = childZonesOf(parentId).some(
        z => z.id !== zoneId && lower.includes(z.id),
      );
      const flag = flags[parentId];
      if (stillHasChild) {
        flags[parentId] = {
          selectedDirectly: flag?.selectedDirectly ?? false,
          selectedByChildren: true,
        };
      } else if (flag?.selectedDirectly) {
        flags[parentId] = { selectedDirectly: true, selectedByChildren: false };
        // 상위조직 유지
      } else {
        // 자식으로만 선택됐던 경우 상위도 해제
        upper = upper.filter(x => x !== parentId);
        delete flags[parentId];
      }
    }

    upper = ensureParentUpperIds(lower, upper);
    emitOrgState({
      upper,
      lower,
      departments: value.sharedDepartmentIds,
      flags,
    });
  };

  const toggleDept = (id: string) => {
    const departments = isDeptOn(id)
      ? value.sharedDepartmentIds.filter(x => x !== id)
      : uniqueIds([...value.sharedDepartmentIds, id]);
    emitOrgState({
      upper: value.sharedUpperOrganizationIds,
      lower: value.sharedLowerOrganizationIds,
      departments,
      flags: value.upperSelectionFlags,
    });
  };

  const removeChip = (kind: 'upper' | 'lower' | 'dept', id: string) => {
    if (kind === 'upper') {
      requestToggleUpper(id);
      return;
    }
    if (kind === 'lower') {
      const zone = eligibleGroups.zones.find(z => z.id === id);
      toggleLower(id, zone?.parentId);
      return;
    }
    toggleDept(id);
  };

  const isOptionDisabled = (v: GraceNoteVisibility) => {
    if (v === 'pastor') return !hasPastors;
    if (v === 'group') return !hasGroups;
    return false;
  };

  const chipItems = useMemo(() => {
    const items: { key: string; label: string; kind: 'upper' | 'lower' | 'dept'; id: string }[] = [];
    for (const d of eligibleGroups.districts) {
      if (!value.sharedUpperOrganizationIds.includes(d.id)) continue;
      const hasSelectedChild = childZonesOf(d.id).some(z =>
        value.sharedLowerOrganizationIds.includes(z.id),
      );
      // 하위가 있으면 상위 단독 칩 숨김 (데이터상 상위 ID는 유지, selectedDirectly로 복원)
      if (!hasSelectedChild) {
        items.push({ key: `u-${d.id}`, label: d.name, kind: 'upper', id: d.id });
      }
    }
    for (const z of eligibleGroups.zones) {
      if (!value.sharedLowerOrganizationIds.includes(z.id)) continue;
      items.push({
        key: `l-${z.id}`,
        label: getLowerOrganizationDisplayLabel(z.id),
        kind: 'lower',
        id: z.id,
      });
    }
    for (const d of eligibleGroups.departments) {
      if (value.sharedDepartmentIds.includes(d.id)) {
        items.push({ key: `d-${d.id}`, label: d.name, kind: 'dept', id: d.id });
      }
    }
    return items;
  }, [
    eligibleGroups,
    value.sharedUpperOrganizationIds,
    value.sharedLowerOrganizationIds,
    value.sharedDepartmentIds,
  ]);

  const orgSelectionPanel = (
    <div className="space-y-3">
      {chipItems.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 mb-2">선택된 대상</p>
          <div className="flex flex-wrap gap-2">
            {chipItems.map(c => (
              <Chip key={c.key} label={c.label} onRemove={() => removeChip(c.kind, c.id)} />
            ))}
          </div>
        </div>
      )}

      {eligibleGroups.districts.length > 0 && (
        <div className="space-y-1">
          <p className="text-[12px] font-bold text-gray-600 pt-1">{labels.upper}</p>
          {eligibleGroups.districts.map(d => {
            const children = childZonesOf(d.id);
            const on = isUpperOn(d.id);
            return (
              <div key={d.id} className="space-y-0.5">
                <CheckboxRow
                  checked={on}
                  onChange={() => requestToggleUpper(d.id)}
                  label={d.name}
                />
                {on && children.length > 0 && (
                  <div className="ml-4 pl-3 border-l-2 border-primary-100 space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 pt-1">{labels.lower}</p>
                    {children.map(z => (
                      <CheckboxRow
                        key={z.id}
                        checked={isLowerOn(z.id)}
                        onChange={() => toggleLower(z.id, d.id)}
                        label={formatLowerWithUpperLabel(d.name, z.name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {orphanZones.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold text-gray-600 pt-1">{labels.lower}</p>
          {orphanZones.map(z => (
            <CheckboxRow
              key={z.id}
              checked={isLowerOn(z.id)}
              onChange={() => toggleLower(z.id, z.parentId)}
              label={getLowerOrganizationDisplayLabel(z.id)}
            />
          ))}
        </div>
      )}

      {eligibleGroups.departments.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold text-gray-600 pt-1">{labels.department}</p>
          {eligibleGroups.departments.map(d => (
            <CheckboxRow
              key={d.id}
              checked={isDeptOn(d.id)}
              onChange={() => toggleDept(d.id)}
              label={d.name}
            />
          ))}
        </div>
      )}

      {isMobile && (
        <button
          type="button"
          onClick={() => setOrgPanelOpen(false)}
          className="w-full mt-2 h-12 rounded-[14px] bg-primary-500 text-white text-sm font-bold touch-target"
        >
          선택 완료
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-6 md:pb-2">
      <div>
        <p className="text-sm font-bold text-gray-800 mb-3">공개범위</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibilityOptions.map(opt => {
            const disabled = isOptionDisabled(opt.value);
            const selected = value.visibility === opt.value && !disabled;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (opt.value === 'group' && value.visibility === 'group') {
                    setOrgPanelOpen(true);
                    return;
                  }
                  setVisibility(opt.value);
                }}
                aria-pressed={selected}
                className={`relative w-full flex items-start gap-3 p-4 rounded-[18px] border-2 text-left transition-all touch-target min-h-[72px] ${
                  disabled
                    ? 'border-gray-100 bg-gray-50 opacity-55 cursor-not-allowed'
                    : selected
                      ? 'border-primary-500 bg-primary-50/70 shadow-[0_0_0_1px_rgba(37,99,235,0.12)]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <span className="flex-1 min-w-0 pr-6">
                  <span
                    className={`block text-[15px] font-bold leading-snug ${
                      selected ? 'text-primary-800' : 'text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="block text-[12px] md:text-[13px] text-[#6B7280] mt-1 leading-snug">
                    {opt.desc}
                  </span>
                  {disabled && opt.value === 'pastor' && (
                    <span className="block text-[11px] text-amber-600 mt-1.5">
                      현재 연결된 담당 교역자가 없습니다.
                    </span>
                  )}
                  {disabled && opt.value === 'group' && (
                    <span className="block text-[11px] text-amber-600 mt-1.5">
                      현재 소속된 {labels.upper} 또는 {labels.department}가 없습니다.
                    </span>
                  )}
                </span>
                {selected && (
                  <span className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {value.visibility === 'pastor' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">담당 교역자 선택</p>
            <span className="text-[11px] text-gray-400">{pastorChipList.length}명</span>
          </div>

          {!hasPastors ? (
            <p className="text-sm text-gray-500 py-2">현재 연결된 담당 교역자가 없습니다.</p>
          ) : (
            <>
              {pastorChipList.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {pastorChipList.map(p => (
                    <Chip
                      key={p.id}
                      label={`${p.name} ${p.position}`.trim()}
                      onRemove={() => togglePastor(p.id)}
                    />
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-2 space-y-0.5 max-h-56 md:max-h-72 overflow-y-auto">
                <CheckboxRow
                  checked={allPastorsSelected}
                  onChange={togglePastorAll}
                  label="전체 선택"
                  sublabel="내 소속 담당 교역자 모두"
                />
                {eligiblePastors.map(p => (
                  <CheckboxRow
                    key={p.id}
                    checked={
                      value.sharedPastorAll || value.sharedPastorIds.includes(p.id)
                    }
                    onChange={() => togglePastor(p.id)}
                    label={`${p.name} ${p.position}`.trim()}
                    sublabel={p.orgLabels.length ? p.orgLabels.join(' · ') : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {value.visibility === 'group' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">
              {labels.upper} · {labels.department} 선택
            </p>
            <span className="text-[11px] text-gray-400">{chipItems.length}개</span>
          </div>

          {!hasGroups ? (
            <p className="text-sm text-gray-500 py-2">
              현재 소속된 {labels.upper} 또는 {labels.department}가 없습니다.
            </p>
          ) : (
            <>
              {isMobile && !orgPanelOpen && (
                <div className="space-y-3">
                  {chipItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {chipItems.map(c => (
                        <Chip key={c.key} label={c.label} onRemove={() => removeChip(c.kind, c.id)} />
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setOrgPanelOpen(true)}
                    className="w-full h-12 rounded-[14px] border-2 border-primary-200 text-primary-700 text-sm font-bold touch-target"
                  >
                    {labels.upper} · {labels.department} 다시 선택
                  </button>
                </div>
              )}
              {(!isMobile || orgPanelOpen) && (
                <div className="border-t border-gray-100 pt-3 max-h-[min(60vh,420px)] overflow-y-auto">
                  {orgSelectionPanel}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ChurchConfirmDialog
        open={!!confirmUpperClear}
        title={`${labels.upper} 선택 해제`}
        message={`${labels.upper} 선택을 해제하면 선택한 ${labels.lower}도 함께 해제됩니다.`}
        confirmText="해제"
        cancelText="취소"
        danger
        onCancel={() => setConfirmUpperClear(null)}
        onConfirm={() => {
          if (confirmUpperClear) clearUpperWithChildren(confirmUpperClear);
          setConfirmUpperClear(null);
        }}
      />
    </div>
  );
}

export function shareStateToInput(state: GraceNoteShareState) {
  const upper = uniqueIds(state.sharedUpperOrganizationIds);
  const lower = uniqueIds(state.sharedLowerOrganizationIds);
  const departments = uniqueIds(state.sharedDepartmentIds);
  return {
    visibility: state.visibility,
    sharedPastorAll: state.sharedPastorAll,
    sharedPastorIds: uniqueIds(state.sharedPastorIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
  };
}
