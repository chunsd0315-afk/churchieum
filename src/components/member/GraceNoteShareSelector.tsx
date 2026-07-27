/**
 * 은혜기록 공개범위 + 공유 대상 선택
 * 조직명은 조직관리(OrgSettings) 설정을 동적으로 반영한다.
 */

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { GraceNoteVisibility, SharedPastorSnapshot } from '../../data/graceNotes';
import {
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
import {
  resolveOrganizationShareMode,
  type OrganizationShareMode,
} from '../../types/sharedContent';
import { VisibilitySelector } from '../common/shared-content/VisibilitySelector';
import { DirectPastorOrgShareSelector } from '../common/shared-content/DirectPastorOrgShareSelector';
import {
  flattenOrgFilterTree,
  getOrganizationPathLabel,
  getUserOrganizationTree,
  resolveOrgTreeMode,
} from '../../services/userOrganizationTree';
import {
  buildDirectPastorShareModel,
  getPastoralAssigneesForOrganization,
  type DirectPastorOnOrg,
} from '../../services/directPastorShare';
import { ORG_TREE_CHANGED_EVENT } from '../../services/organizationStorage';

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
  organizationShareMode: OrganizationShareMode;
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
    organizationShareMode: resolveOrganizationShareMode(state.organizationShareMode),
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
  const visibility = existing?.visibility ?? 'private';
  return {
    visibility,
    sharedPastorAll: existing?.sharedPastorAll ?? false,
    sharedPastorIds: uniqueIds(existing?.sharedPastorIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
    organizationShareMode:
      visibility === 'organization_share'
        ? resolveOrganizationShareMode(
            (existing as { organizationShareMode?: OrganizationShareMode })?.organizationShareMode,
          )
        : 'members_and_pastors',
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

function formatAssigneeLine(pastors: DirectPastorOnOrg[]): string {
  if (pastors.length === 0) return '';
  return pastors
    .map(p => `${p.name}${p.position ? ` ${p.position}` : ''}`.trim())
    .join(', ');
}

export function GraceNoteShareSelector({
  value,
  onChange,
  existingPastorSnapshots = [],
}: {
  value: GraceNoteShareState;
  onChange: (v: GraceNoteShareState) => void;
  existingPastorSnapshots?: SharedPastorSnapshot[];
}) {
  const { user, isPastor, isAdmin } = useAuth();
  const { l1, l2, dept, pastorPhrases } = useOrgSettings();
  const labels = useMemo(() => getOrganizationLabels(), [l1, l2, dept]);
  const isPastoralViewer = isPastor || isAdmin;
  const [orgTick, setOrgTick] = useState(0);

  useEffect(() => {
    const bump = () => setOrgTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const orgTreeMode = useMemo(() => resolveOrgTreeMode(user), [user]);
  const orgTreeDefaultScope = isAdmin ? 'all' : 'mine';

  const orgTree = useMemo(
    () =>
      getUserOrganizationTree({
        user,
        mode: orgTreeMode,
        scope: orgTreeDefaultScope,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- orgTick refreshes labels/structure
    [user, orgTreeMode, orgTreeDefaultScope, orgTick],
  );

  const selectableOrgs = useMemo(() => {
    return flattenOrgFilterTree(orgTree)
      .filter(n => n.selectable)
      .map(n => {
        const pastors = getPastoralAssigneesForOrganization(n.id);
        return {
          id: n.id,
          name: n.name,
          pathLabel: getOrganizationPathLabel(n.id) || n.name,
          pastors,
          assigneeLine: formatAssigneeLine(pastors),
        };
      });
  }, [orgTree, orgTick]);

  const hasOrgTree = selectableOrgs.length > 0;

  const pastorModel = useMemo(
    () => buildDirectPastorShareModel(user),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, orgTick],
  );
  const hasPastors =
    pastorModel.pastors.length > 0
    || (value.visibility === 'pastor_share' && value.sharedPastorIds.length > 0);

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

  const orgShareMode = resolveOrganizationShareMode(value.organizationShareMode);

  const activeOrgPastors = useMemo(() => {
    const map = new Map<string, DirectPastorOnOrg & { orgNames: string[] }>();
    for (const orgId of selectedOrgIds) {
      const org = selectableOrgs.find(o => o.id === orgId);
      const orgName = org?.name ?? getOrganizationPathLabel(orgId);
      for (const p of getPastoralAssigneesForOrganization(orgId)) {
        const prev = map.get(p.pastorId);
        if (prev) {
          if (orgName && !prev.orgNames.includes(orgName)) prev.orgNames.push(orgName);
        } else {
          map.set(p.pastorId, { ...p, orgNames: orgName ? [orgName] : [] });
        }
      }
    }
    return [...map.values()].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [selectedOrgIds, selectableOrgs, orgTick]);

  const activePastorIdSet = useMemo(
    () => new Set(activeOrgPastors.map(p => p.pastorId)),
    [activeOrgPastors],
  );

  const historicalPastors = useMemo(() => {
    return existingPastorSnapshots
      .filter(s => s.pastorId && !activePastorIdSet.has(s.pastorId) && value.sharedPastorIds.includes(s.pastorId))
      .map(s => ({
        pastorId: s.pastorId,
        name: s.name,
        position: s.position ?? '',
        organizationRole: '이전 공유 대상',
        isPrimary: false,
        orgNames: s.organizationName ? [s.organizationName] : [],
        historical: true as const,
      }));
  }, [existingPastorSnapshots, activePastorIdSet, value.sharedPastorIds]);

  const hasAnyOrgAssignees = activeOrgPastors.length > 0 || historicalPastors.length > 0;

  const setVisibility = (visibility: GraceNoteVisibility) => {
    if (visibility === 'pastor_share' && !hasPastors && pastorModel.pastors.length === 0) return;
    if (visibility === 'organization_share' && !hasOrgTree) return;
    const cleared = defaultShareState({ visibility });
    const filtered = filterShareStateToMembership(toShareFields(cleared), user);
    onChange({
      ...cleared,
      ...filtered,
      organizationShareMode:
        visibility === 'organization_share' ? 'members_and_pastors' : 'members_and_pastors',
      upperSelectionFlags: {},
    });
  };

  const handlePastorIdsChange = (ids: string[]) => {
    onChange({
      ...value,
      sharedPastorAll: false,
      sharedPastorIds: uniqueIds(ids),
    });
  };

  const handleOrgToggle = (orgId: string) => {
    const next = selectedOrgIds.includes(orgId)
      ? selectedOrgIds.filter(id => id !== orgId)
      : [...selectedOrgIds, orgId];
    const split = organizationIdsToShareSplit(next);
    const nextActiveIds = new Set(
      next.flatMap(id => getPastoralAssigneesForOrganization(id).map(p => p.pastorId)),
    );
    let nextPastorIds = value.sharedPastorIds;
    if (orgShareMode === 'pastors_only') {
      // 활성 담당만 유지 + 이전 공유(스냅샷) 유지
      const histIds = new Set(historicalPastors.map(p => p.pastorId));
      nextPastorIds = uniqueIds(value.sharedPastorIds).filter(
        id => nextActiveIds.has(id) || histIds.has(id),
      );
    } else {
      nextPastorIds = [...nextActiveIds];
    }
    onChange({
      ...value,
      sharedGroupAll: false,
      sharedUpperOrganizationIds: split.upper,
      sharedLowerOrganizationIds: split.lower,
      sharedDepartmentIds: split.departments,
      sharedGroupIds: composeSharedGroupIds(split.upper, split.lower, split.departments),
      sharedPastorIds: nextPastorIds,
      upperSelectionFlags: {},
    });
  };

  const setOrgShareMode = (mode: OrganizationShareMode) => {
    if (mode === 'pastors_only' && activeOrgPastors.length === 0 && historicalPastors.length === 0) {
      return;
    }
    if (mode === 'pastors_only') {
      const preferred = activeOrgPastors.map(p => p.pastorId);
      const keepHist = historicalPastors.map(p => p.pastorId);
      onChange({
        ...value,
        organizationShareMode: mode,
        sharedPastorIds: uniqueIds([
          ...(preferred.length > 0 ? preferred : value.sharedPastorIds.filter(id => activePastorIdSet.has(id))),
          ...keepHist.filter(id => value.sharedPastorIds.includes(id)),
        ]),
      });
      return;
    }
    onChange({
      ...value,
      organizationShareMode: mode,
      sharedPastorIds: activeOrgPastors.map(p => p.pastorId),
    });
  };

  const toggleOrgPastor = (pastorId: string, historical: boolean) => {
    if (historical) {
      // 이전 공유 대상: 유지 해제만 가능
      onChange({
        ...value,
        sharedPastorIds: value.sharedPastorIds.filter(id => id !== pastorId),
      });
      return;
    }
    const selected = value.sharedPastorIds.includes(pastorId);
    onChange({
      ...value,
      sharedPastorIds: selected
        ? value.sharedPastorIds.filter(id => id !== pastorId)
        : uniqueIds([...value.sharedPastorIds, pastorId]),
    });
  };

  const disabledOptions: GraceNoteVisibility[] = [];
  if (pastorModel.pastors.length === 0 && value.visibility !== 'pastor_share') {
    disabledOptions.push('pastor_share');
  }
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
                description: pastorPhrases.shareSelectDescription,
                disabledHint: `현재 연결된 담당 ${pastorPhrases.label}가 없습니다.`,
              },
            }}
          />
        </div>
      </div>

      {value.visibility === 'pastor_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5">
          <DirectPastorOrgShareSelector
            user={user}
            selectedIds={value.sharedPastorIds}
            onChange={handlePastorIdsChange}
            existingSnapshots={existingPastorSnapshots}
            viewerIsMember={!isPastoralViewer}
          />
        </div>
      )}

      {value.visibility === 'organization_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-sm font-bold text-gray-800">내 조직</p>
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
              <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {selectableOrgs.map(org => {
                  const checked = selectedOrgIds.includes(org.id);
                  return (
                    <label
                      key={org.id}
                      className={`flex items-start gap-3 px-4 py-3.5 min-h-[56px] touch-target cursor-pointer ${
                        checked ? 'bg-primary-50/60' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleOrgToggle(org.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold text-gray-900">{org.pathLabel}</span>
                        {org.assigneeLine ? (
                          <span className="block text-[13px] text-gray-500 mt-0.5">
                            담당 : {org.assigneeLine}
                          </span>
                        ) : (
                          <span className="block text-[12px] text-amber-700 mt-0.5">
                            등록된 담당 {pastorPhrases.label}가 없습니다.
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {selectedOrgIds.length === 0 && hasOrgTree && (
              <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-3">
                공유할 {labels.upper}·{labels.department}를 하나 이상 선택해 주세요.
              </p>
            )}
          </div>

          {selectedOrgIds.length > 0 && (
            <div className="pt-1 border-t border-gray-100 space-y-3">
              <p className="text-sm font-bold text-gray-800">공유 방식</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden" role="radiogroup" aria-label="공유 방식">
                <button
                  type="button"
                  role="radio"
                  aria-checked={orgShareMode === 'members_and_pastors'}
                  onClick={() => setOrgShareMode('members_and_pastors')}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-100 touch-target ${
                    orgShareMode === 'members_and_pastors' ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      orgShareMode === 'members_and_pastors' ? 'border-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {orgShareMode === 'members_and_pastors' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-gray-900">
                      조직 구성원과 담당 {pastorPhrases.label}
                    </span>
                    <span className="block text-[13px] text-gray-500 mt-0.5">
                      선택한 조직 구성원과 담당 {pastorPhrases.label}가 함께 봅니다.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={orgShareMode === 'pastors_only'}
                  disabled={!hasAnyOrgAssignees}
                  onClick={() => setOrgShareMode('pastors_only')}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left touch-target ${
                    orgShareMode === 'pastors_only' ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'
                  } ${!hasAnyOrgAssignees ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      orgShareMode === 'pastors_only' ? 'border-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {orgShareMode === 'pastors_only' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-gray-900">
                      담당 {pastorPhrases.label}에게만
                    </span>
                    <span className="block text-[13px] text-gray-500 mt-0.5">
                      선택한 담당 {pastorPhrases.label}만 봅니다.
                    </span>
                    {!hasAnyOrgAssignees && (
                      <span className="block text-[11px] text-amber-600 mt-1">
                        이 조직에는 등록된 담당 {pastorPhrases.label}가 없습니다.
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}

          {selectedOrgIds.length > 0 && orgShareMode === 'pastors_only' && (
            <div className="pt-1 border-t border-gray-100 space-y-3">
              <p className="text-sm font-bold text-gray-800">담당 {pastorPhrases.label} 선택</p>
              {activeOrgPastors.length === 0 && historicalPastors.length === 0 ? (
                <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  이 조직에는 등록된 담당 {pastorPhrases.label}가 없습니다.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {activeOrgPastors.map(p => {
                    const checked = value.sharedPastorIds.includes(p.pastorId);
                    return (
                      <label
                        key={p.pastorId}
                        className="flex items-start gap-3 px-4 py-3.5 min-h-[56px] touch-target cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOrgPastor(p.pastorId, false)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold text-gray-900">
                            {p.name}{p.position ? ` ${p.position}` : ''}
                            {p.organizationRole ? ` · ${p.organizationRole}` : ''}
                          </span>
                          {p.orgNames.length > 0 && (
                            <span className="block text-[12px] text-gray-500 mt-0.5">
                              {p.orgNames.join(' · ')}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                  {historicalPastors.length > 0 && (
                    <>
                      <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400">
                        이전 공유 대상
                      </p>
                      {historicalPastors.map(p => {
                        const checked = value.sharedPastorIds.includes(p.pastorId);
                        return (
                          <label
                            key={`hist-${p.pastorId}`}
                            className="flex items-start gap-3 px-4 py-3.5 min-h-[56px] touch-target cursor-pointer hover:bg-gray-50 opacity-80"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleOrgPastor(p.pastorId, true)}
                              className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold text-gray-800">
                                {p.name}{p.position ? ` ${p.position}` : ''}
                              </span>
                              <span className="block text-[12px] text-amber-700 mt-0.5">
                                이전 공유 대상 · 유지 또는 해제만 가능
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
              {value.sharedPastorIds.length === 0 && (
                <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  공유할 담당 {pastorPhrases.label}를 선택해 주세요.
                </p>
              )}
            </div>
          )}

          {selectedOrgIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedOrgIds.map(id => (
                <Chip
                  key={id}
                  label={getOrganizationPathLabel(id)}
                  onRemove={() => handleOrgToggle(id)}
                />
              ))}
            </div>
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
  const visibility = state.visibility;
  return {
    visibility,
    sharedPastorAll: state.sharedPastorAll,
    sharedPastorIds: uniqueIds(state.sharedPastorIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
    organizationShareMode:
      visibility === 'organization_share'
        ? resolveOrganizationShareMode(state.organizationShareMode)
        : undefined,
  };
}
