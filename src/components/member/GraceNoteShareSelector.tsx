/**
 * 은혜기록 공개범위 + 공유 대상 선택
 * 조직명은 조직관리(OrgSettings) 설정을 동적으로 반영한다.
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { GraceNoteVisibility } from '../../data/graceNotes';
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
  type GraceShareFields,
} from '../../services/graceNoteShareScope';
import { VisibilitySelector } from '../common/shared-content/VisibilitySelector';
import { PastorShareSelector } from '../common/shared-content/PastorShareSelector';
import { UserOrganizationTreeSelector } from '../common/shared-content/UserOrganizationTreeSelector';
import {
  flattenOrgFilterTree,
  getOrganizationPathLabel,
  getUserOrganizationTree,
  resolveOrgTreeMode,
} from '../../services/userOrganizationTree';

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

export function GraceNoteShareSelector({ value, onChange }: {
  value: GraceNoteShareState;
  onChange: (v: GraceNoteShareState) => void;
}) {
  const { user, isPastor, isAdmin } = useAuth();
  const { l1, l2, dept } = useOrgSettings();
  const labels = useMemo(() => getOrganizationLabels(), [l1, l2, dept]);
  const isPastoralViewer = isPastor || isAdmin;

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

  const handlePastorIdsChange = (ids: string[]) => {
    const allOn =
      eligiblePastors.length > 0 && eligiblePastors.every(p => ids.includes(p.id));
    onChange({
      ...value,
      sharedPastorAll: allOn,
      sharedPastorIds: allOn ? uniqueIds(eligiblePastors.map(p => p.id)) : uniqueIds(ids),
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

  const disabledOptions: GraceNoteVisibility[] = [];
  if (!hasPastors) disabledOptions.push('pastor_share');
  if (!hasOrgTree) disabledOptions.push('organization_share');

  return (
    <div className="space-y-4 pb-6 md:pb-2">
      <div>
        <p className="text-sm font-bold text-gray-800 mb-3">공개범위</p>
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <VisibilitySelector
            value={value.visibility}
            onChange={setVisibility}
            variant={isPastoralViewer ? 'pastor' : 'member'}
            disabledOptions={disabledOptions}
            optionOverrides={{
              organization_share: {
                label: formatGroupShareOptionLabel(labels),
                description: formatGroupShareOptionDesc(labels),
                disabledHint: `현재 소속된 ${labels.upper} 또는 ${labels.department}가 없습니다.`,
              },
              pastor_share: {
                disabledHint: '현재 연결된 담당 교역자가 없습니다.',
              },
            }}
          />
        </div>
      </div>

      {value.visibility === 'pastor_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5">
          <PastorShareSelector
            pastors={eligiblePastors}
            selectedIds={value.sharedPastorIds}
            onChange={handlePastorIdsChange}
            searchable={isAdmin}
          />
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
