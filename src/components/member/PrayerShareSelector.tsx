/**
 * 기도 작성 — 공개범위 + 공유 대상 (은혜기록 GraceNoteShareSelector 패턴)
 */

import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { VisibilityType } from '../../types/sharedContent';
import {
  getEligiblePastorsForUser,
  uniqueIds,
  formatGroupShareOptionLabel,
  formatGroupShareOptionDesc,
  getOrganizationLabels,
  organizationIdsToShareSplit,
  composeSharedGroupIds,
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

export type PrayerShareState = {
  visibility: VisibilityType;
  sharedPastorIds: string[];
  sharedOrganizationIds: string[];
};

export function defaultPrayerShareState(
  existing?: Partial<PrayerShareState>,
): PrayerShareState {
  return {
    visibility: existing?.visibility ?? 'private',
    sharedPastorIds: uniqueIds(existing?.sharedPastorIds),
    sharedOrganizationIds: uniqueIds(existing?.sharedOrganizationIds),
  };
}

export function PrayerShareSelector({
  value,
  onChange,
}: {
  value: PrayerShareState;
  onChange: (v: PrayerShareState) => void;
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

  const setVisibility = (visibility: VisibilityType) => {
    if (visibility === 'pastor_share' && !hasPastors) return;
    if (visibility === 'organization_share' && !hasOrgTree) return;
    onChange({
      visibility,
      sharedPastorIds: visibility === 'pastor_share' ? value.sharedPastorIds : [],
      sharedOrganizationIds: visibility === 'organization_share' ? value.sharedOrganizationIds : [],
    });
  };

  const handleOrgTreeChange = (ids: string[]) => {
    onChange({ ...value, sharedOrganizationIds: uniqueIds(ids) });
  };

  const disabledOptions: VisibilityType[] = [];
  if (!hasPastors) disabledOptions.push('pastor_share');
  if (!hasOrgTree) disabledOptions.push('organization_share');

  return (
    <div className="space-y-4">
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
        <PastorShareSelector
          pastors={eligiblePastors}
          selectedIds={value.sharedPastorIds}
          onChange={ids => onChange({ ...value, sharedPastorIds: uniqueIds(ids) })}
          searchable={isAdmin}
        />
      )}

      {value.visibility === 'organization_share' && (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 md:p-5 space-y-3">
          {!hasOrgTree ? (
            <p className="text-sm text-gray-500 py-2">
              현재 소속된 {labels.upper} 또는 {labels.department}가 없습니다.
            </p>
          ) : (
            <>
              <UserOrganizationTreeSelector
                user={user}
                selectedOrganizationIds={value.sharedOrganizationIds}
                onChange={handleOrgTreeChange}
                mode={orgTreeMode}
                defaultScope={orgTreeDefaultScope}
                emptyMeansAll={false}
                showSelectAll
                sectionTitle="공유 조직"
                searchPlaceholder="조직 검색"
              />
              {value.sharedOrganizationIds.length === 0 && (
                <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  공유할 {labels.upper}·{labels.department}를 하나 이상 선택해 주세요.
                </p>
              )}
              {value.sharedOrganizationIds.length > 0 && (
                <p className="text-[11px] text-primary-600 font-semibold">
                  {value.sharedOrganizationIds.length}개 조직 선택 ·{' '}
                  {value.sharedOrganizationIds
                    .slice(0, 2)
                    .map(id => getOrganizationPathLabel(id))
                    .join(', ')}
                  {value.sharedOrganizationIds.length > 2 ? ' …' : ''}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** 저장용 — split ids는 prayer flat 배열로 통합 저장 */
export function prayerShareToSaveFields(state: PrayerShareState) {
  const split = organizationIdsToShareSplit(state.sharedOrganizationIds);
  const orgIds = composeSharedGroupIds(split.upper, split.lower, split.departments);
  return {
    visibility: state.visibility,
    sharedPastorIds: state.visibility === 'pastor_share' ? uniqueIds(state.sharedPastorIds) : [],
    sharedOrganizationIds: state.visibility === 'organization_share' ? orgIds : [],
  };
}
