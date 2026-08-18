/**
 * 은혜기록(설교·성경통독·기도 기록) 공개범위
 * UI는 GracePrayerVisibilitySelector 공통 컴포넌트를 사용합니다.
 */

import {
  GracePrayerVisibilitySelector,
  type VisibilityShareValue,
} from './GracePrayerVisibilitySelector';
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
import { getPastoralAssigneesForOrganization } from '../../services/directPastorShare';
import { useAuth } from '../../contexts/AuthContext';

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
    organizationShareMode: 'members_and_pastors',
    upperSelectionFlags:
      (existing as GraceNoteShareState | undefined)?.upperSelectionFlags ?? {},
  };
}

function toSimpleValue(state: GraceNoteShareState): VisibilityShareValue {
  return {
    visibility: state.visibility,
    sharedPastorIds: uniqueIds(state.sharedPastorIds),
    sharedOrganizationIds: composeSharedGroupIds(
      state.sharedUpperOrganizationIds,
      state.sharedLowerOrganizationIds,
      state.sharedDepartmentIds,
    ),
  };
}

function fromSimpleValue(
  simple: VisibilityShareValue,
  prev: GraceNoteShareState,
): GraceNoteShareState {
  const split = organizationIdsToShareSplit(simple.sharedOrganizationIds);
  const next: GraceNoteShareState = {
    ...prev,
    visibility: simple.visibility,
    sharedPastorAll: false,
    sharedPastorIds: uniqueIds(simple.sharedPastorIds),
    sharedGroupAll: false,
    sharedUpperOrganizationIds: split.upper,
    sharedLowerOrganizationIds: split.lower,
    sharedDepartmentIds: split.departments,
    sharedGroupIds: composeSharedGroupIds(split.upper, split.lower, split.departments),
    organizationShareMode: 'members_and_pastors',
    upperSelectionFlags: {},
  };
  return next;
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
  const { user } = useAuth();

  return (
    <GracePrayerVisibilitySelector
      value={toSimpleValue(value)}
      existingPastorSnapshots={existingPastorSnapshots}
      onChange={next => {
        const mapped = fromSimpleValue(next, value);
        const filtered = filterShareStateToMembership(toShareFields(mapped), user);
        onChange({
          ...mapped,
          ...filtered,
          organizationShareMode: 'members_and_pastors',
          upperSelectionFlags: {},
        });
      }}
    />
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
