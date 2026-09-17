/**
 * 공통 공개범위 선택기
 *
 * 선택지는 역할 정책(services/visibilityRolePolicy)에서 결정한다.
 * - 성도: 나만 보기 / 담당 교역자만 / 내 조직과 공유
 * - 교역자: 나만 보기 / 교역자와 공유 / 내 조직과 공유
 * - 최고관리자: 나만 보기 / 교역자와 공유 / 교회 조직과 공유 / 전체 공개
 *
 * 선택 후에는 결과만 보여주고, [변경]을 눌렀을 때만 선택창(PC 다이얼로그 · 모바일 전체화면)을 연다.
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Lock, UserRound, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';
import type { SharedPastorSnapshot } from '../../../data/graceNotes';
import {
  getPastoralAssigneesForOrganization,
  resolvePastorDisplay,
} from '../../../services/directPastorShare';
import { ORG_TREE_CHANGED_EVENT } from '../../../services/organizationStorage';
import { getOrganizationPathLabel } from '../../../services/userOrganizationTree';
import { getCurrentUserFromStorage } from '../../../services/graceNoteShareScope';
import {
  filterVisibilityValueByPermission,
  getSelectableOrganizationIdsForVisibility,
  getVisibilityPolicy,
} from '../../../services/visibilityRolePolicy';
import {
  defaultContentVisibilityValue,
  uniqueVisibilityIds,
  type ContentVisibilityMode,
  type ContentVisibilityPreset,
  type ContentVisibilityValue,
} from '../../../services/visibilityNormalize';
import { OrganizationPicker } from '../organization';
import { PastorSharePicker } from './PastorSharePicker';
import { useUserShareableOrganizations } from './OrganizationShareSelector';

export type {
  ContentVisibilityMode,
  ContentVisibilityPreset,
  ContentVisibilityValue,
} from '../../../services/visibilityNormalize';

export {
  defaultContentVisibilityValue,
  normalizeVisibility,
  validateContentVisibility,
  contentVisibilityBadgeLabel,
} from '../../../services/visibilityNormalize';

const MODE_ICONS: Record<ContentVisibilityMode, LucideIcon> = {
  private: Lock,
  pastor_share: UserRound,
  organization_share: Users,
  public: Globe,
};

export type VisibilitySelectorProps = {
  value: ContentVisibilityValue;
  onChange: (v: ContentVisibilityValue) => void;
  /** personal = 은혜·기도 / broadcast = 공지·앨범·일정 */
  preset?: ContentVisibilityPreset;
  existingPastorSnapshots?: SharedPastorSnapshot[];
  className?: string;
  showSummary?: boolean;
  /** 교역자와 공유 지원 여부 (기본: personal만) */
  allowPastorShare?: boolean;
};

/**
 * 저장용 — 조직 공유 시 담당 교역자 ID도 함께 채운다.
 * 저장 직전 현재 사용자 권한으로 선택 범위를 다시 검사한다.
 */
export function visibilityValueToSaveFields(
  value: ContentVisibilityValue,
  preset: ContentVisibilityPreset = 'personal',
  opts?: { allowPastorShare?: boolean },
) {
  const user = getCurrentUserFromStorage();
  const safe = user ? filterVisibilityValueByPermission(user, value, preset, opts) : value;

  if (safe.visibility === 'private' || safe.visibility === 'public') {
    return {
      visibility: safe.visibility,
      sharedPastorIds: [] as string[],
      sharedOrganizationIds: [] as string[],
    };
  }
  if (safe.visibility === 'pastor_share') {
    return {
      visibility: 'pastor_share' as const,
      sharedPastorIds: uniqueVisibilityIds(safe.sharedPastorIds),
      sharedOrganizationIds: [] as string[],
    };
  }
  const orgIds = uniqueVisibilityIds(safe.sharedOrganizationIds);
  const assigneeIds = orgIds.flatMap(id =>
    getPastoralAssigneesForOrganization(id).map(p => p.pastorId),
  );
  return {
    visibility: 'organization_share' as const,
    sharedPastorIds: uniqueVisibilityIds(assigneeIds),
    sharedOrganizationIds: orgIds,
  };
}

function SelectedTargets({
  labels,
  emptyHint,
  onOpen,
}: {
  labels: string[];
  emptyHint: string;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {labels.length === 0 ? (
            <p className="text-[13px] text-amber-700 font-medium">{emptyHint}</p>
          ) : (
            <ul className="space-y-1">
              {labels.map(label => (
                <li key={label} className="text-[14px] font-semibold text-[#1A1A1A] truncate">
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 min-h-[40px] px-4 rounded-[14px] border border-[#FFCD00] bg-[#FFF7D6] text-[13px] font-bold text-[#1A1A1A] hover:bg-[#FFEFB8] touch-target"
        >
          변경
        </button>
      </div>
    </div>
  );
}

export function VisibilitySelector({
  value,
  onChange,
  preset = 'personal',
  existingPastorSnapshots = [],
  className = '',
  showSummary = true,
  allowPastorShare,
}: VisibilitySelectorProps) {
  const { user } = useAuth();
  const { settings, terminologyVersion } = useOrgSettings();
  const { orgs: myOrgs } = useUserShareableOrganizations();
  const [orgTick, setOrgTick] = useState(0);
  const [pastorPickerOpen, setPastorPickerOpen] = useState(false);
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);

  useEffect(() => {
    const bump = () => setOrgTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
  }, []);

  const policy = useMemo(
    () => getVisibilityPolicy(user, preset, settings, { allowPastorShare }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, preset, settings, terminologyVersion, orgTick, allowPastorShare],
  );

  // 권한에 없는 공개범위(레거시 값 등)는 기본 옵션으로 되돌린다
  useEffect(() => {
    if (policy.modes.includes(value.visibility)) return;
    onChange(defaultContentVisibilityValue({ visibility: policy.modes[0] }, preset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy, value.visibility]);

  const allowedOrgIds = useMemo(
    () => getSelectableOrganizationIdsForVisibility(user),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, orgTick],
  );

  const pastorLabels = useMemo(
    () =>
      value.sharedPastorIds.map(id => {
        const display = resolvePastorDisplay(id, existingPastorSnapshots);
        return `${display.name}${display.position ? ` ${display.position}` : ''}`.trim();
      }),
    [value.sharedPastorIds, existingPastorSnapshots],
  );

  const organizationLabels = useMemo(
    () =>
      value.sharedOrganizationIds.map(id => {
        const mine = myOrgs.find(o => o.id === id);
        return mine?.name || getOrganizationPathLabel(id) || id;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value.sharedOrganizationIds, myOrgs, orgTick],
  );

  const setVisibility = (visibility: ContentVisibilityMode) => {
    if (visibility === value.visibility) return;
    onChange(defaultContentVisibilityValue({ visibility }, preset));
  };

  const summaryText = useMemo(() => {
    if (value.visibility === 'private') return '공개범위 : 나만 보기';
    if (value.visibility === 'public') return `공개범위 : ${policy.publicScopeLabel}`;
    if (value.visibility === 'pastor_share') {
      const option = policy.options.find(o => o.mode === 'pastor_share');
      if (pastorLabels.length === 0) return `공개범위 : ${option?.title ?? ''} (선택 필요)`;
      return `공개범위 : ${pastorLabels.join(' · ')}`;
    }
    const option = policy.options.find(o => o.mode === 'organization_share');
    if (organizationLabels.length === 0) return `공개범위 : ${option?.title ?? ''} (선택 필요)`;
    return `공개범위 : ${organizationLabels.join(' · ')}`;
  }, [value.visibility, policy, pastorLabels, organizationLabels]);

  return (
    <div className={`space-y-3 pb-2 ${className}`}>
      <div>
        <p className="text-sm font-bold text-gray-800 mb-3">공개범위</p>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="공개범위">
          {policy.options.map(option => {
            const selected = value.visibility === option.mode;
            const Icon = MODE_ICONS[option.mode];
            return (
              <div key={option.mode} className="space-y-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setVisibility(option.mode)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 min-h-[56px] text-left rounded-[18px] border-2 transition-colors touch-target ${
                    selected
                      ? 'bg-[#FFF7D6] border-primary-500 shadow-sm'
                      : 'bg-white border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? 'text-primary-600' : 'text-gray-400'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[15px] ${selected ? 'font-bold text-[#1A1A1A]' : 'font-semibold text-gray-900'}`}
                    >
                      {option.title}
                    </span>
                    <span className="block text-[13px] text-gray-500 mt-0.5 leading-snug">
                      {option.description}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>

                {selected && option.mode === 'pastor_share' && (
                  <SelectedTargets
                    labels={pastorLabels}
                    emptyHint={`공유할 ${policy.pastorLabel}를 선택해 주세요.`}
                    onOpen={() => setPastorPickerOpen(true)}
                  />
                )}

                {selected && option.mode === 'organization_share' && (
                  <SelectedTargets
                    labels={organizationLabels}
                    emptyHint="공유할 조직을 선택해 주세요."
                    onOpen={() => setOrgPickerOpen(true)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showSummary && (
        <p className="text-[13px] text-gray-600 font-medium px-0.5">{summaryText}</p>
      )}

      <PastorSharePicker
        open={pastorPickerOpen}
        onClose={() => setPastorPickerOpen(false)}
        value={value.sharedPastorIds}
        scope={policy.pastorScope}
        title={policy.pastorPickerTitle}
        description={policy.pastorPickerDescription}
        snapshots={existingPastorSnapshots}
        onConfirm={ids =>
          onChange({
            ...value,
            visibility: 'pastor_share',
            sharedPastorIds: uniqueVisibilityIds(ids),
            sharedOrganizationIds: [],
          })
        }
      />

      <OrganizationPicker
        open={orgPickerOpen}
        onClose={() => setOrgPickerOpen(false)}
        value={value.sharedOrganizationIds}
        allowedOrganizationIds={allowedOrgIds}
        visibleOrganizationIds={policy.organizationScope === 'church' ? null : allowedOrgIds}
        title={policy.organizationPickerTitle}
        description={policy.organizationPickerDescription}
        onConfirm={ids =>
          onChange({
            ...value,
            visibility: 'organization_share',
            sharedOrganizationIds: uniqueVisibilityIds(ids),
            sharedPastorIds: [],
          })
        }
      />
    </div>
  );
}
