/**
 * 은혜와 기도 공개범위 — 단순 3옵션 UI
 * 1. 나만 보기
 * 2. 담당 교역자만
 * 3. 내 조직과 공유
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, Lock, UserRound, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { GraceNoteVisibility, SharedPastorSnapshot } from '../../data/graceNotes';
import {
  uniqueIds,
  filterShareStateToMembership,
  composeSharedGroupIds,
  splitOrganizationShareIds,
  organizationIdsToShareSplit,
  type GraceShareFields,
} from '../../services/graceNoteShareScope';
import {
  resolveOrganizationShareMode,
  type OrganizationShareMode,
} from '../../types/sharedContent';
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
import { getAllClergy, positionLabel } from '../../services/clergyData';

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
  /** 저장 호환용 — 새 작성은 organization_share 시 항상 members_and_pastors */
  organizationShareMode: OrganizationShareMode;
  upperSelectionFlags: Record<string, UpperOrgSelectionFlag>;
};

type VisibilityCard = {
  value: GraceNoteVisibility;
  title: string;
  description: string;
  icon: typeof Lock;
  disabled?: boolean;
  disabledHint?: string;
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
    organizationShareMode:
      state.visibility === 'organization_share' ? 'members_and_pastors' : undefined,
  };
}

/**
 * 수정 복원 — organizationShareMode=pastors_only 는 pastor_share UI로 해석
 */
export function defaultShareState(
  existing?: Partial<GraceNoteShareState> | Partial<GraceShareFields> | null,
): GraceNoteShareState {
  let visibility = (existing?.visibility ?? 'private') as GraceNoteVisibility;
  let sharedPastorIds = uniqueIds(existing?.sharedPastorIds);
  let split = splitOrganizationShareIds({
    sharedGroupIds: existing?.sharedGroupIds,
    sharedUpperOrganizationIds: existing?.sharedUpperOrganizationIds,
    sharedLowerOrganizationIds: existing?.sharedLowerOrganizationIds,
    sharedDepartmentIds: existing?.sharedDepartmentIds,
  });

  const legacyMode = resolveOrganizationShareMode(
    (existing as { organizationShareMode?: OrganizationShareMode } | undefined)?.organizationShareMode,
  );

  // 레거시: 조직 공유 + 담당만 → 담당 교역자만(pastor_share)
  if (visibility === 'organization_share' && legacyMode === 'pastors_only') {
    visibility = 'pastor_share';
    split = { upper: [], lower: [], departments: [] };
  }

  if (visibility === 'private') {
    sharedPastorIds = [];
    split = { upper: [], lower: [], departments: [] };
  }
  if (visibility === 'pastor_share') {
    split = { upper: [], lower: [], departments: [] };
  }
  if (visibility === 'organization_share') {
    // members_and_pastors — 담당 ID는 저장 시 조직 기준으로 재계산
  }

  const upper = uniqueIds(split.upper);
  const lower = uniqueIds(split.lower);
  const departments = uniqueIds(split.departments);

  return {
    visibility,
    sharedPastorAll: false,
    sharedPastorIds,
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: composeSharedGroupIds(upper, lower, departments),
    organizationShareMode:
      visibility === 'organization_share' ? 'members_and_pastors' : 'members_and_pastors',
    upperSelectionFlags:
      (existing as GraceNoteShareState | undefined)?.upperSelectionFlags ?? {},
  };
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 max-w-full px-2.5 py-1 rounded-full bg-primary-50 text-primary-800 text-[12px] font-semibold border border-primary-200">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded-full hover:bg-primary-100 touch-target min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          aria-label={`${label} 선택 해제`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

function formatAssigneeLine(pastors: DirectPastorOnOrg[]): string {
  if (pastors.length === 0) return '담당 교역자 없음';
  const first = `${pastors[0].name}${pastors[0].position ? ` ${pastors[0].position}` : ''}`.trim();
  if (pastors.length === 1) return `담당 ${first}`;
  return `담당 ${first} 외 ${pastors.length - 1}명`;
}

function pastorDisplayName(id: string, snapshots: SharedPastorSnapshot[]): string {
  const snap = snapshots.find(s => s.pastorId === id);
  if (snap) return `${snap.name}${snap.position ? ` ${snap.position}` : ''}`.trim();
  const c = getAllClergy().find(cl => cl.id === id);
  if (c) return `${c.name} ${positionLabel(c)}`.trim();
  return id;
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
  const { pastorLabel } = useOrgSettings();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const cards: VisibilityCard[] = [
    {
      value: 'private',
      title: '나만 보기',
      description: '나만 확인할 수 있습니다.',
      icon: Lock,
    },
    {
      value: 'pastor_share',
      title: `담당 ${pastorLabel}만`,
      description: `선택한 담당 ${pastorLabel}만 볼 수 있습니다.`,
      icon: UserRound,
      disabled: !hasPastors && value.visibility !== 'pastor_share',
      disabledHint: `현재 연결된 담당 ${pastorLabel}가 없습니다.`,
    },
    {
      value: 'organization_share',
      title: '내 조직과 공유',
      description: `선택한 조직 구성원과 담당 ${pastorLabel}가 함께 봅니다.`,
      icon: Users,
      disabled: !hasOrgTree && value.visibility !== 'organization_share',
      disabledHint: '현재 소속·담당 조직이 없습니다.',
    },
  ];

  const setVisibility = (visibility: GraceNoteVisibility) => {
    if (visibility === 'pastor_share' && !hasPastors && pastorModel.pastors.length === 0) return;
    if (visibility === 'organization_share' && !hasOrgTree) return;
    const cleared = defaultShareState({ visibility });
    const filtered = filterShareStateToMembership(toShareFields(cleared), user);
    onChange({
      ...cleared,
      ...filtered,
      organizationShareMode: 'members_and_pastors',
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
    const assigneeIds = next.flatMap(id =>
      getPastoralAssigneesForOrganization(id).map(p => p.pastorId),
    );
    onChange({
      ...value,
      sharedGroupAll: false,
      sharedUpperOrganizationIds: split.upper,
      sharedLowerOrganizationIds: split.lower,
      sharedDepartmentIds: split.departments,
      sharedGroupIds: composeSharedGroupIds(split.upper, split.lower, split.departments),
      sharedPastorIds: uniqueIds(assigneeIds),
      organizationShareMode: 'members_and_pastors',
      upperSelectionFlags: {},
    });
  };

  const summaryText = useMemo(() => {
    if (value.visibility === 'private') return '공개범위: 나만 보기';
    if (value.visibility === 'pastor_share') {
      const n = value.sharedPastorIds.length;
      if (n === 0) return `공개범위: 담당 ${pastorLabel}만 (선택 필요)`;
      if (n === 1) {
        return `공개범위: ${pastorDisplayName(value.sharedPastorIds[0], existingPastorSnapshots)}`;
      }
      const first = pastorDisplayName(value.sharedPastorIds[0], existingPastorSnapshots);
      return `공개범위: ${first} 외 ${n - 1}명`;
    }
    if (value.visibility === 'organization_share') {
      if (selectedOrgIds.length === 0) return '공개범위: 내 조직과 공유 (선택 필요)';
      const names = selectedOrgIds.map(id => getOrganizationPathLabel(id) || id);
      return `공개범위: ${names.join(' · ')}`;
    }
    return '공개범위: 나만 보기';
  }, [value.visibility, value.sharedPastorIds, selectedOrgIds, pastorLabel, existingPastorSnapshots]);

  return (
    <div className="space-y-4 pb-6 md:pb-2">
      <div>
        <p className="text-sm font-bold text-gray-800 mb-3">공개범위</p>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="공개범위">
          {cards.map(card => {
            const selected = value.visibility === card.value;
            const Icon = card.icon;
            const disabled = !!card.disabled;
            return (
              <button
                key={card.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => !disabled && setVisibility(card.value)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 min-h-[56px] text-left rounded-2xl border-2 transition-colors touch-target ${
                  selected
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <Icon
                  className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? 'text-primary-600' : 'text-gray-400'}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[15px] ${selected ? 'font-bold text-primary-900' : 'font-semibold text-gray-900'}`}
                  >
                    {card.title}
                  </span>
                  <span className="block text-[13px] text-gray-500 mt-0.5 leading-snug">
                    {card.description}
                  </span>
                  {disabled && card.disabledHint && (
                    <span className="block text-[11px] text-amber-600 mt-1">{card.disabledHint}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {value.visibility === 'pastor_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800">담당 {pastorLabel} 선택</p>
          <DirectPastorOrgShareSelector
            user={user}
            selectedIds={value.sharedPastorIds}
            onChange={handlePastorIdsChange}
            existingSnapshots={existingPastorSnapshots}
            viewerIsMember={!isPastoralViewer}
          />
          {value.sharedPastorIds.length === 0 && (
            <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              공유할 담당 {pastorLabel}를 선택해 주세요.
            </p>
          )}
          {value.sharedPastorIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              {value.sharedPastorIds.map(id => (
                <Chip
                  key={id}
                  label={pastorDisplayName(id, existingPastorSnapshots)}
                  onRemove={() =>
                    handlePastorIdsChange(value.sharedPastorIds.filter(x => x !== id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {value.visibility === 'organization_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">공유할 조직</p>
            {selectedOrgIds.length > 0 && (
              <span className="text-[11px] font-semibold text-primary-600 shrink-0">
                {selectedOrgIds.length}개 선택
              </span>
            )}
          </div>

          {!hasOrgTree ? (
            <p className="text-sm text-gray-500 py-2">현재 소속·담당 조직이 없습니다.</p>
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
                      className="mt-1 w-5 h-5 min-w-[20px] min-h-[20px] rounded border-gray-300 text-primary-600 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold text-gray-900">{org.pathLabel}</span>
                      <span
                        className={`block text-[13px] mt-0.5 ${
                          org.pastors.length === 0 ? 'text-amber-700' : 'text-gray-500'
                        }`}
                      >
                        {org.assigneeLine}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {selectedOrgIds.length === 0 && hasOrgTree && (
            <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              공유할 조직을 하나 이상 선택해 주세요.
            </p>
          )}

          {selectedOrgIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
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

      <p className="text-[13px] text-gray-600 font-medium px-0.5">{summaryText}</p>
    </div>
  );
}

export function shareStateToInput(state: GraceNoteShareState) {
  const upper = uniqueIds(state.sharedUpperOrganizationIds);
  const lower = uniqueIds(state.sharedLowerOrganizationIds);
  const departments = uniqueIds(state.sharedDepartmentIds);
  const visibility = state.visibility;

  if (visibility === 'private') {
    return {
      visibility: 'private' as const,
      sharedPastorAll: false,
      sharedPastorIds: [] as string[],
      sharedGroupAll: false,
      sharedUpperOrganizationIds: [] as string[],
      sharedLowerOrganizationIds: [] as string[],
      sharedDepartmentIds: [] as string[],
      sharedGroupIds: [] as string[],
      organizationShareMode: undefined,
    };
  }

  if (visibility === 'pastor_share') {
    return {
      visibility: 'pastor_share' as const,
      sharedPastorAll: false,
      sharedPastorIds: uniqueIds(state.sharedPastorIds),
      sharedGroupAll: false,
      sharedUpperOrganizationIds: [] as string[],
      sharedLowerOrganizationIds: [] as string[],
      sharedDepartmentIds: [] as string[],
      sharedGroupIds: [] as string[],
      organizationShareMode: undefined,
    };
  }

  const orgIds = composeSharedGroupIds(upper, lower, departments);
  const assigneeIds = orgIds.flatMap(id =>
    getPastoralAssigneesForOrganization(id).map(p => p.pastorId),
  );

  return {
    visibility: 'organization_share' as const,
    sharedPastorAll: false,
    sharedPastorIds: uniqueIds(assigneeIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: upper,
    sharedLowerOrganizationIds: lower,
    sharedDepartmentIds: departments,
    sharedGroupIds: orgIds,
    organizationShareMode: 'members_and_pastors' as const,
  };
}
