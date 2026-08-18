/**
 * 은혜와 기도 공개범위 — 기도·설교·성경통독 공통
 * 1. 나만 보기
 * 2. 담당 교역자만
 * 3. 내 조직과 공유
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, Lock, UserRound, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import type { VisibilityType } from '../../types/sharedContent';
import type { SharedPastorSnapshot } from '../../data/graceNotes';
import { uniqueIds } from '../../services/graceNoteShareScope';
import {
  getOrganizationPathLabel,
  getUserOrganizationTree,
  resolveOrgTreeMode,
  type OrgFilterTreeNode,
} from '../../services/userOrganizationTree';
import {
  buildDirectPastorShareModel,
  flattenDirectPastorShareRows,
  getPastoralAssigneesForOrganization,
  type DirectPastorOnOrg,
} from '../../services/directPastorShare';
import { ORG_TREE_CHANGED_EVENT } from '../../services/organizationStorage';
import { getAllClergy, positionLabel } from '../../services/clergyData';

export type VisibilityShareValue = {
  visibility: VisibilityType;
  sharedPastorIds: string[];
  sharedOrganizationIds: string[];
};

type VisibilityCard = {
  value: VisibilityType;
  title: string;
  description: string;
  icon: typeof Lock;
  disabled?: boolean;
  disabledHint?: string;
};

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
  if (pastors.length === 1) return `담당 : ${first}`;
  return `담당 : ${first} 외 ${pastors.length - 1}명`;
}

function pastorDisplayName(id: string, snapshots: SharedPastorSnapshot[]): string {
  const snap = snapshots.find(s => s.pastorId === id);
  if (snap) return `${snap.name}${snap.position ? ` ${snap.position}` : ''}`.trim();
  const c = getAllClergy().find(cl => cl.id === id);
  if (c) return `${c.name} ${positionLabel(c)}`.trim();
  return id;
}

function flattenOrgsWithDepth(
  nodes: OrgFilterTreeNode[],
  depth = 0,
): { node: OrgFilterTreeNode; depth: number }[] {
  return nodes.flatMap(n => [
    { node: n, depth },
    ...flattenOrgsWithDepth(n.children, depth + 1),
  ]);
}

export function defaultVisibilityShareValue(
  existing?: Partial<VisibilityShareValue> | null,
): VisibilityShareValue {
  const visibility = (existing?.visibility ?? 'private') as VisibilityType;
  if (visibility === 'private') {
    return { visibility: 'private', sharedPastorIds: [], sharedOrganizationIds: [] };
  }
  if (visibility === 'pastor_share') {
    return {
      visibility: 'pastor_share',
      sharedPastorIds: uniqueIds(existing?.sharedPastorIds),
      sharedOrganizationIds: [],
    };
  }
  return {
    visibility: 'organization_share',
    sharedPastorIds: [],
    sharedOrganizationIds: uniqueIds(existing?.sharedOrganizationIds),
  };
}

export function visibilityShareToSaveFields(value: VisibilityShareValue) {
  if (value.visibility === 'private') {
    return {
      visibility: 'private' as const,
      sharedPastorIds: [] as string[],
      sharedOrganizationIds: [] as string[],
    };
  }
  if (value.visibility === 'pastor_share') {
    return {
      visibility: 'pastor_share' as const,
      sharedPastorIds: uniqueIds(value.sharedPastorIds),
      sharedOrganizationIds: [] as string[],
    };
  }
  const orgIds = uniqueIds(value.sharedOrganizationIds);
  const assigneeIds = orgIds.flatMap(id =>
    getPastoralAssigneesForOrganization(id).map(p => p.pastorId),
  );
  return {
    visibility: 'organization_share' as const,
    sharedPastorIds: uniqueIds(assigneeIds),
    sharedOrganizationIds: orgIds,
  };
}

export function GracePrayerVisibilitySelector({
  value,
  onChange,
  existingPastorSnapshots = [],
}: {
  value: VisibilityShareValue;
  onChange: (v: VisibilityShareValue) => void;
  existingPastorSnapshots?: SharedPastorSnapshot[];
}) {
  const { user } = useAuth();
  const { pastorLabel } = useOrgSettings();
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

  const orgTree = useMemo(
    () =>
      getUserOrganizationTree({
        user,
        mode: orgTreeMode,
        scope: 'mine',
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, orgTreeMode, orgTick],
  );

  const selectableOrgs = useMemo(() => {
    return flattenOrgsWithDepth(orgTree)
      .filter(row => row.node.selectable)
      .map(({ node, depth }) => {
        const pastors = getPastoralAssigneesForOrganization(node.id);
        return {
          id: node.id,
          name: node.name,
          depth,
          pastors,
          assigneeLine: formatAssigneeLine(pastors),
        };
      });
  }, [orgTree, orgTick]);

  const hasOrgTree = selectableOrgs.length > 0;

  const pastorModel = useMemo(
    () => buildDirectPastorShareModel(user, { relatedOnly: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, orgTick],
  );

  const pastorRows = useMemo(
    () => flattenDirectPastorShareRows(pastorModel.tree),
    [pastorModel.tree],
  );

  const hasPastors =
    pastorModel.pastors.length > 0
    || (value.visibility === 'pastor_share' && value.sharedPastorIds.length > 0);

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

  const setVisibility = (visibility: VisibilityType) => {
    if (visibility === 'pastor_share' && pastorModel.pastors.length === 0 && !hasPastors) return;
    if (visibility === 'organization_share' && !hasOrgTree) return;
    onChange(defaultVisibilityShareValue({ visibility }));
  };

  const togglePastor = (id: string) => {
    const next = value.sharedPastorIds.includes(id)
      ? value.sharedPastorIds.filter(x => x !== id)
      : [...value.sharedPastorIds, id];
    onChange({ ...value, sharedPastorIds: uniqueIds(next), sharedOrganizationIds: [] });
  };

  const toggleOrg = (orgId: string) => {
    const next = value.sharedOrganizationIds.includes(orgId)
      ? value.sharedOrganizationIds.filter(id => id !== orgId)
      : [...value.sharedOrganizationIds, orgId];
    onChange({ ...value, sharedOrganizationIds: uniqueIds(next), sharedPastorIds: [] });
  };

  const summaryText = useMemo(() => {
    if (value.visibility === 'private') return '공개범위 : 나만 보기';
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
    <div className="space-y-3 pb-6 md:pb-2">
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
                      ? 'bg-primary-50 border-primary-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
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
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>

                {selected && card.value === 'pastor_share' && (
                  <div className="rounded-[18px] border border-gray-200 bg-white overflow-hidden">
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
                                    checked ? 'bg-primary-50/70' : 'bg-white hover:bg-gray-50'
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
                                      checked ? 'border-primary-500 bg-primary-500' : 'border-gray-300 bg-white'
                                    }`}
                                    aria-hidden
                                  >
                                    {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                    {value.sharedPastorIds.length === 0 && pastorRows.length > 0 && (
                      <p className="text-[12px] text-amber-700 bg-amber-50 mx-3 mb-3 mt-2 rounded-xl px-3 py-2">
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
                  <div className="rounded-[18px] border border-gray-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
                      <p className="text-sm font-bold text-gray-800">내 조직 선택</p>
                      {value.sharedOrganizationIds.length > 0 && (
                        <span className="text-[11px] font-semibold text-primary-600 shrink-0">
                          {value.sharedOrganizationIds.length}개 선택
                        </span>
                      )}
                    </div>
                    {!hasOrgTree ? (
                      <p className="text-sm text-gray-500 px-4 pb-4">현재 소속·담당 조직이 없습니다.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {selectableOrgs.map(org => {
                          const checked = value.sharedOrganizationIds.includes(org.id);
                          return (
                            <button
                              key={org.id}
                              type="button"
                              onClick={() => toggleOrg(org.id)}
                              className={`w-full flex items-start gap-3 min-h-[52px] touch-target text-left px-4 py-3 ${
                                checked ? 'bg-primary-50/70' : 'bg-white hover:bg-gray-50'
                              }`}
                              style={{ paddingLeft: 16 + Math.min(org.depth, 4) * 12 }}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block text-[15px] font-bold text-gray-900">{org.name}</span>
                                <span
                                  className={`block text-[13px] mt-0.5 ${
                                    org.pastors.length === 0 ? 'text-amber-700' : 'text-gray-500'
                                  }`}
                                >
                                  {org.assigneeLine}
                                </span>
                              </span>
                              <span
                                className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                  checked ? 'border-primary-500 bg-primary-500' : 'border-gray-300 bg-white'
                                }`}
                                aria-hidden
                              >
                                {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {value.sharedOrganizationIds.length === 0 && hasOrgTree && (
                      <p className="text-[12px] text-amber-700 bg-amber-50 mx-3 my-3 rounded-xl px-3 py-2">
                        공유할 조직을 하나 이상 선택해 주세요.
                      </p>
                    )}
                    {value.sharedOrganizationIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100">
                        {value.sharedOrganizationIds.map(id => {
                          const row = selectableOrgs.find(o => o.id === id);
                          return (
                            <Chip
                              key={id}
                              label={row?.name || getOrganizationPathLabel(id)}
                              onRemove={() => toggleOrg(id)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[13px] text-gray-600 font-medium px-0.5">{summaryText}</p>
    </div>
  );
}
