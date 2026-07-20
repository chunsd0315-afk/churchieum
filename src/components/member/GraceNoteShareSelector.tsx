/**
 * 은혜기록 공개범위 + 공유 대상 선택
 * 조직명은 조직관리(OrgSettings) 설정을 동적으로 반영한다.
 */

import { useMemo } from 'react';
import { Lock, Users, UserRound, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { GraceNoteVisibility } from '../../data/graceNotes';
import {
  VISIBILITY_LABELS,
  VISIBILITY_LABELS_PASTOR,
  VISIBILITY_DESCRIPTIONS,
  VISIBILITY_DESCRIPTIONS_PASTOR,
} from '../../types/sharedContent';
import {
  getEligiblePastorsForUser,
  uniqueIds,
  filterShareStateToMembership,
  composeSharedGroupIds,
  splitOrganizationShareIds,
  organizationIdsToShareSplit,
  formatGroupShareOptionLabel,
  formatGroupShareOptionDesc,
  getOrganizationLabels,
  type EligiblePastor,
  type GraceShareFields,
} from '../../services/graceNoteShareScope';
import { UserOrganizationTreeSelector } from '../common/shared-content/UserOrganizationTreeSelector';
import {
  flattenOrgFilterTree,
  getOrganizationPathLabel,
  getUserOrganizationTree,
  resolveOrgTreeMode,
} from '../../services/userOrganizationTree';
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
  /** UI용 — 상위조직 직접/자식선택 구분 (레거시 호환) */
  upperSelectionFlags: Record<string, UpperOrgSelectionFlag>;
};

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
      (existing as GraceNoteShareState | undefined)?.upperSelectionFlags ?? {},
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
  const { user, isPastor, isAdmin } = useAuth();
  const { l1, l2, dept } = useOrgSettings();
  const { isMobile } = useBreakpoint();
  const labels = useMemo(() => getOrganizationLabels(), [l1, l2, dept]);
  const isPastoralViewer = isPastor || isAdmin;
  const visibilityLabels = isPastoralViewer ? VISIBILITY_LABELS_PASTOR : VISIBILITY_LABELS;
  const visibilityDescriptions = isPastoralViewer ? VISIBILITY_DESCRIPTIONS_PASTOR : VISIBILITY_DESCRIPTIONS;

  const orgTreeMode = useMemo(() => resolveOrgTreeMode(user), [user]);
  const orgTreeDefaultScope = isAdmin ? 'all' : 'mine';

  const orgTree = useMemo(
    () =>
      getUserOrganizationTree({
        user,
        mode: orgTreeMode,
        scope: orgTreeDefaultScope,
      }),
    [user, orgTreeMode, orgTreeDefaultScope],
  );

  const hasOrgTree = useMemo(
    () => flattenOrgFilterTree(orgTree).some(n => n.selectable),
    [orgTree],
  );

  const eligiblePastors = useMemo(() => getEligiblePastorsForUser(user), [user]);

  const hasPastors = eligiblePastors.length > 0;

  const visibilityOptions = useMemo(() => [
    {
      value: 'private' as const,
      label: visibilityLabels.private,
      desc: visibilityDescriptions.private,
      icon: Lock,
    },
    {
      value: 'pastor_share' as const,
      label: visibilityLabels.pastor_share,
      desc: visibilityDescriptions.pastor_share,
      icon: UserRound,
    },
    {
      value: 'organization_share' as const,
      label: formatGroupShareOptionLabel(labels),
      desc: formatGroupShareOptionDesc(labels),
      icon: Users,
    },
  ], [labels, visibilityLabels, visibilityDescriptions]);

  const pastorChipList: EligiblePastor[] = useMemo(() => {
    if (value.sharedPastorAll) return eligiblePastors;
    return eligiblePastors.filter(p => value.sharedPastorIds.includes(p.id));
  }, [value.sharedPastorAll, value.sharedPastorIds, eligiblePastors]);

  const selectedOrgIds = useMemo(
    () =>
      composeSharedGroupIds(
        value.sharedUpperOrganizationIds,
        value.sharedLowerOrganizationIds,
        value.sharedDepartmentIds,
      ),
    [
      value.sharedUpperOrganizationIds,
      value.sharedLowerOrganizationIds,
      value.sharedDepartmentIds,
    ],
  );

  const allPastorsSelected =
    value.sharedPastorAll ||
    (eligiblePastors.length > 0 &&
      eligiblePastors.every(p => value.sharedPastorIds.includes(p.id)));

  const setVisibility = (visibility: GraceNoteVisibility) => {
    if (visibility === 'pastor_share' && !hasPastors) return;
    if (visibility === 'organization_share' && !hasOrgTree) return;
    const cleared = defaultShareState({ visibility });
    const filtered = filterShareStateToMembership(toShareFields(cleared), user);
    onChange({
      ...cleared,
      ...filtered,
      upperSelectionFlags: {},
    });
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

  const handleOrgTreeChange = (ids: string[]) => {
    const split = organizationIdsToShareSplit(ids);
    onChange({
      ...value,
      sharedGroupAll: false,
      sharedUpperOrganizationIds: split.upper,
      sharedLowerOrganizationIds: split.lower,
      sharedDepartmentIds: split.departments,
      sharedGroupIds: composeSharedGroupIds(split.upper, split.lower, split.departments),
      upperSelectionFlags: {},
    });
  };

  const isOptionDisabled = (v: GraceNoteVisibility) => {
    if (v === 'pastor_share') return !hasPastors;
    if (v === 'organization_share') return !hasOrgTree;
    return false;
  };

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
                onClick={() => setVisibility(opt.value)}
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
                  {disabled && opt.value === 'pastor_share' && (
                    <span className="block text-[11px] text-amber-600 mt-1.5">
                      현재 연결된 담당 교역자가 없습니다.
                    </span>
                  )}
                  {disabled && opt.value === 'organization_share' && (
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

      {value.visibility === 'pastor_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800">담당 교역자 선택</p>
          {!hasPastors ? (
            <p className="text-sm text-gray-500 py-2">선택할 수 있는 교역자가 없습니다.</p>
          ) : (
            <>
              {pastorChipList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pastorChipList.map(p => (
                    <Chip
                      key={p.id}
                      label={`${p.name} ${p.position}`.trim()}
                      onRemove={() => togglePastor(p.id)}
                    />
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 max-h-[min(50vh,360px)] overflow-y-auto">
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

      {value.visibility === 'organization_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">
              {labels.upper} · {labels.department} 선택
            </p>
            {selectedOrgIds.length > 0 && (
              <span className="text-[11px] font-semibold text-primary-600 shrink-0">
                {selectedOrgIds.length}개 선택
              </span>
            )}
          </div>

          {!hasOrgTree ? (
            <p className="text-sm text-gray-500 py-2">
              현재 소속된 {labels.upper} 또는 {labels.department}가 없습니다.
            </p>
          ) : (
            <>
              <UserOrganizationTreeSelector
                user={user}
                selectedOrganizationIds={selectedOrgIds}
                onChange={handleOrgTreeChange}
                mode={orgTreeMode}
                defaultScope={orgTreeDefaultScope}
                emptyMeansAll={false}
                showSelectAll
                sectionTitle="공유 조직"
                searchPlaceholder="조직 검색"
                treeScrollClassName={isMobile ? 'max-h-none' : 'max-h-64'}
              />

              {selectedOrgIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  {selectedOrgIds.map(id => (
                    <Chip
                      key={id}
                      label={getOrganizationPathLabel(id)}
                      onRemove={() => handleOrgTreeChange(selectedOrgIds.filter(x => x !== id))}
                    />
                  ))}
                </div>
              )}

              {selectedOrgIds.length === 0 && (
                <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  공유할 {labels.upper}·{labels.department}를 하나 이상 선택해 주세요.
                </p>
              )}
            </>
          )}
        </div>
      )}
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
