/**
 * 공통 공개범위 선택기
 * - personal: 나만 보기 / 담당 교역자만 / 내 조직과 공유
 * - broadcast: 전체 공개 / 내 조직과 공유
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Lock, UserRound, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';
import type { SharedPastorSnapshot } from '../../../data/graceNotes';
import {
  buildDirectPastorShareModel,
  flattenDirectPastorShareRows,
  getPastoralAssigneesForOrganization,
} from '../../../services/directPastorShare';
import { getAllClergy, positionLabel } from '../../../services/clergyData';
import { ORG_TREE_CHANGED_EVENT } from '../../../services/organizationStorage';
import { getOrganizationPathLabel } from '../../../services/userOrganizationTree';
import {
  defaultContentVisibilityValue,
  uniqueVisibilityIds,
  type ContentVisibilityMode,
  type ContentVisibilityPreset,
  type ContentVisibilityValue,
} from '../../../services/visibilityNormalize';
import {
  OrganizationShareSelector,
  useUserShareableOrganizations,
} from './OrganizationShareSelector';

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

function pastorDisplayName(id: string, snapshots: SharedPastorSnapshot[]): string {
  const snap = snapshots.find(s => s.pastorId === id);
  if (snap) return `${snap.name}${snap.position ? ` ${snap.position}` : ''}`.trim();
  const c = getAllClergy().find(cl => cl.id === id);
  if (c) return `${c.name} ${positionLabel(c)}`.trim();
  return id;
}

type CardDef = {
  value: ContentVisibilityMode;
  title: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
  disabledHint?: string;
};

export type VisibilitySelectorProps = {
  value: ContentVisibilityValue;
  onChange: (v: ContentVisibilityValue) => void;
  /** personal = 은혜·기도 / broadcast = 공지·앨범·일정 */
  preset?: ContentVisibilityPreset;
  existingPastorSnapshots?: SharedPastorSnapshot[];
  className?: string;
  showSummary?: boolean;
};

/** 저장용 — 조직 공유 시 담당 교역자 ID도 함께 채움 */
export function visibilityValueToSaveFields(value: ContentVisibilityValue) {
  if (value.visibility === 'private' || value.visibility === 'public') {
    return {
      visibility: value.visibility,
      sharedPastorIds: [] as string[],
      sharedOrganizationIds: [] as string[],
    };
  }
  if (value.visibility === 'pastor_share') {
    return {
      visibility: 'pastor_share' as const,
      sharedPastorIds: uniqueVisibilityIds(value.sharedPastorIds),
      sharedOrganizationIds: [] as string[],
    };
  }
  const orgIds = uniqueVisibilityIds(value.sharedOrganizationIds);
  const assigneeIds = orgIds.flatMap(id =>
    getPastoralAssigneesForOrganization(id).map(p => p.pastorId),
  );
  return {
    visibility: 'organization_share' as const,
    sharedPastorIds: uniqueVisibilityIds(assigneeIds),
    sharedOrganizationIds: orgIds,
  };
}

export function VisibilitySelector({
  value,
  onChange,
  preset = 'personal',
  existingPastorSnapshots = [],
  className = '',
  showSummary = true,
}: VisibilitySelectorProps) {
  const { user } = useAuth();
  const { pastorLabel } = useOrgSettings();
  const { orgs: selectableOrgs, hasOrgTree, orgTick } = useUserShareableOrganizations();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
  }, []);

  void tick;
  void orgTick;

  const pastorModel = useMemo(
    () => buildDirectPastorShareModel(user, { relatedOnly: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, orgTick, tick],
  );

  const pastorRows = useMemo(
    () => flattenDirectPastorShareRows(pastorModel.tree),
    [pastorModel.tree],
  );

  const hasPastors =
    pastorModel.pastors.length > 0
    || (value.visibility === 'pastor_share' && value.sharedPastorIds.length > 0);

  const cards: CardDef[] = useMemo(() => {
    const personal: CardDef[] = [
      {
        value: 'private',
        title: '나만 보기',
        description: '나만 확인할 수 있습니다.',
        icon: Lock,
      },
      {
        value: 'pastor_share',
        title: `담당 ${pastorLabel}만`,
        description: `내 담당 ${pastorLabel}에게만 공유합니다.`,
        icon: UserRound,
        disabled: !hasPastors && value.visibility !== 'pastor_share',
        disabledHint: `현재 연결된 담당 ${pastorLabel}가 없습니다.`,
      },
      {
        value: 'organization_share',
        title: '내 조직과 공유',
        description: '내가 속한 조직 구성원과 공유합니다.',
        icon: Users,
        disabled: !hasOrgTree && value.visibility !== 'organization_share',
        disabledHint: '현재 소속·담당 조직이 없습니다.',
      },
    ];
    const broadcast: CardDef[] = [
      {
        value: 'public',
        title: '전체 공개',
        description: '교회 구성원 모두가 볼 수 있습니다.',
        icon: Globe,
      },
      {
        value: 'organization_share',
        title: '내 조직과 공유',
        description: '선택한 조직 구성원과 공유합니다.',
        icon: Users,
        disabled: !hasOrgTree && value.visibility !== 'organization_share',
        disabledHint: '현재 소속·담당 조직이 없습니다.',
      },
    ];
    return preset === 'broadcast' ? broadcast : personal;
  }, [preset, pastorLabel, hasPastors, hasOrgTree, value.visibility]);

  const setVisibility = (visibility: ContentVisibilityMode) => {
    if (visibility === 'pastor_share' && pastorModel.pastors.length === 0 && !hasPastors) return;
    if (visibility === 'organization_share' && !hasOrgTree) return;
    onChange(defaultContentVisibilityValue({ visibility }, preset));
  };

  const togglePastor = (id: string) => {
    const next = value.sharedPastorIds.includes(id)
      ? value.sharedPastorIds.filter(x => x !== id)
      : [...value.sharedPastorIds, id];
    onChange({
      ...value,
      visibility: 'pastor_share',
      sharedPastorIds: uniqueVisibilityIds(next),
      sharedOrganizationIds: [],
    });
  };

  const summaryText = useMemo(() => {
    if (value.visibility === 'private') return '공개범위 : 나만 보기';
    if (value.visibility === 'public') return '공개범위 : 전체 공개';
    if (value.visibility === 'pastor_share') {
      const n = value.sharedPastorIds.length;
      if (n === 0) return `공개범위 : 담당 ${pastorLabel}만 (선택 필요)`;
      if (n === 1) {
        return `공개범위 : ${pastorDisplayName(value.sharedPastorIds[0], existingPastorSnapshots)}`;
      }
      const first = pastorDisplayName(value.sharedPastorIds[0], existingPastorSnapshots);
      return `공개범위 : ${first} 외 ${n - 1}명`;
    }
    if (value.sharedOrganizationIds.length === 0) return '공개범위 : 내 조직과 공유 (선택 필요)';
    const names = value.sharedOrganizationIds.map(id => {
      const row = selectableOrgs.find(o => o.id === id);
      return row?.name || getOrganizationPathLabel(id) || id;
    });
    return `공개범위 : ${names.join(' · ')}`;
  }, [
    value.visibility,
    value.sharedPastorIds,
    value.sharedOrganizationIds,
    pastorLabel,
    existingPastorSnapshots,
    selectableOrgs,
  ]);

  return (
    <div className={`space-y-3 pb-2 ${className}`}>
      <div>
        <p className="text-sm font-bold text-gray-800 mb-3">공개범위</p>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="공개범위">
          {cards.map(card => {
            const selected = value.visibility === card.value;
            const Icon = card.icon;
            const disabled = !!card.disabled;
            return (
              <div key={card.value} className="space-y-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => !disabled && setVisibility(card.value)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 min-h-[56px] text-left rounded-[18px] border-2 transition-colors touch-target ${
                    selected
                      ? 'bg-[#FFF7D6] border-primary-500 shadow-sm'
                      : 'bg-white border-[#E5E7EB] hover:bg-gray-50'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? 'text-primary-600' : 'text-gray-400'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[15px] ${selected ? 'font-bold text-[#1A1A1A]' : 'font-semibold text-gray-900'}`}
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
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>

                {selected && card.value === 'pastor_share' && preset === 'personal' && (
                  <div className="rounded-[18px] border border-[#E5E7EB] bg-white overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 px-4 pt-3.5 pb-2">
                      담당 {pastorLabel} 선택
                    </p>
                    {pastorRows.length === 0 ? (
                      <p className="text-sm text-gray-500 px-4 pb-4">
                        현재 연결된 담당 {pastorLabel}가 없습니다.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {pastorRows.map(row => (
                          <div key={row.organizationId}>
                            <p
                              className="text-[13px] font-bold text-gray-800 px-4 pt-3 pb-1"
                              style={{ paddingLeft: 16 + Math.min(row.depth, 4) * 12 }}
                            >
                              {row.organizationName}
                            </p>
                            {row.pastors.map(p => {
                              const checked = value.sharedPastorIds.includes(p.pastorId);
                              return (
                                <button
                                  key={`${row.organizationId}-${p.pastorId}`}
                                  type="button"
                                  onClick={() => togglePastor(p.pastorId)}
                                  className={`w-full flex items-center gap-3 min-h-[48px] touch-target text-left px-4 py-2 ${
                                    checked ? 'bg-[#FFF7D6]/70' : 'bg-white hover:bg-gray-50'
                                  }`}
                                  style={{ paddingLeft: 16 + Math.min(row.depth, 4) * 12 }}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[14px] font-semibold text-gray-900">
                                      {p.name} {p.position}
                                      <span className="font-medium text-gray-500">
                                        {' '}· {p.organizationRole || '담당교역자'}
                                      </span>
                                    </span>
                                  </span>
                                  <span
                                    className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                      checked
                                        ? 'border-primary-500 bg-primary-500'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                    aria-hidden
                                  >
                                    {checked && (
                                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                    {value.sharedPastorIds.length === 0 && pastorRows.length > 0 && (
                      <p className="text-[12px] text-amber-800 bg-[#FFF7D6] mx-3 mb-3 mt-2 rounded-xl px-3 py-2 border border-primary-200">
                        공유할 담당 {pastorLabel}를 선택해 주세요.
                      </p>
                    )}
                    {value.sharedPastorIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100">
                        {value.sharedPastorIds.map(id => (
                          <Chip
                            key={id}
                            label={pastorDisplayName(id, existingPastorSnapshots)}
                            onRemove={() => togglePastor(id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selected && card.value === 'organization_share' && (
                  <OrganizationShareSelector
                    selectedIds={value.sharedOrganizationIds}
                    onChange={ids =>
                      onChange({
                        ...value,
                        visibility: 'organization_share',
                        sharedOrganizationIds: ids,
                        sharedPastorIds: [],
                      })
                    }
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
    </div>
  );
}
