/**
 * 공지사항 공개범위 — 전체 공개 / 내 조직과 공유
 * 조직 선택 UI·로직은 은혜와 기도 GracePrayerVisibilitySelector 와 동일
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uniqueIds } from '../../services/graceNoteShareScope';
import {
  getOrganizationPathLabel,
  getUserOrganizationTree,
  resolveOrgTreeMode,
  type OrgFilterTreeNode,
} from '../../services/userOrganizationTree';
import {
  buildDirectPastorShareModel,
  getPastoralAssigneesForOrganization,
  type DirectPastorOnOrg,
} from '../../services/directPastorShare';
import { ORG_TREE_CHANGED_EVENT } from '../../services/organizationStorage';

export type AnnouncementVisibilityMode = 'all' | 'organization_share';

export type AnnouncementVisibilityValue = {
  mode: AnnouncementVisibilityMode;
  sharedOrganizationIds: string[];
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

function flattenOrgsWithDepth(
  nodes: OrgFilterTreeNode[],
  depth = 0,
): { node: OrgFilterTreeNode; depth: number }[] {
  return nodes.flatMap(n => [
    { node: n, depth },
    ...flattenOrgsWithDepth(n.children, depth + 1),
  ]);
}

export function defaultAnnouncementVisibility(
  existing?: Partial<AnnouncementVisibilityValue> | null,
): AnnouncementVisibilityValue {
  if (existing?.mode === 'organization_share') {
    return {
      mode: 'organization_share',
      sharedOrganizationIds: uniqueIds(existing.sharedOrganizationIds),
    };
  }
  return { mode: 'all', sharedOrganizationIds: [] };
}

export function AnnouncementVisibilitySelector({
  value,
  onChange,
}: {
  value: AnnouncementVisibilityValue;
  onChange: (v: AnnouncementVisibilityValue) => void;
}) {
  const { user } = useAuth();
  const [orgTick, setOrgTick] = useState(0);

  useEffect(() => {
    const bump = () => setOrgTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
  }, []);

  const orgTree = useMemo(() => {
    void orgTick;
    return getUserOrganizationTree({
      user,
      mode: resolveOrgTreeMode(user),
      scope: 'mine',
    });
  }, [user, orgTick]);

  const pastorModel = useMemo(
    () => buildDirectPastorShareModel(user, { relatedOnly: true }),
    [user, orgTick],
  );

  const selectableOrgs = useMemo(() => {
    const flat = flattenOrgsWithDepth(orgTree).filter(x => x.node.selectable);
    return flat.map(({ node, depth }) => {
      const pastors =
        pastorModel.pastorsByOrgId.get(node.id)
        ?? getPastoralAssigneesForOrganization(node.id);
      return {
        id: node.id,
        name: node.name,
        depth,
        pastors,
        assigneeLine: formatAssigneeLine(pastors),
      };
    });
  }, [orgTree, pastorModel]);

  const hasOrgTree = selectableOrgs.length > 0;

  const setMode = (mode: AnnouncementVisibilityMode) => {
    if (mode === 'organization_share' && !hasOrgTree) return;
    onChange(defaultAnnouncementVisibility({ mode }));
  };

  const toggleOrg = (orgId: string) => {
    const next = value.sharedOrganizationIds.includes(orgId)
      ? value.sharedOrganizationIds.filter(id => id !== orgId)
      : [...value.sharedOrganizationIds, orgId];
    onChange({ mode: 'organization_share', sharedOrganizationIds: uniqueIds(next) });
  };

  const cards: {
    value: AnnouncementVisibilityMode;
    title: string;
    description: string;
    icon: typeof Globe;
    disabled?: boolean;
    disabledHint?: string;
  }[] = [
    {
      value: 'all',
      title: '전체 공개',
      description: '교회 구성원 모두가 볼 수 있습니다.',
      icon: Globe,
    },
    {
      value: 'organization_share',
      title: '내 조직과 공유',
      description: '내가 속한 조직 구성원과 공유합니다.',
      icon: Users,
      disabled: !hasOrgTree && value.mode !== 'organization_share',
      disabledHint: '현재 소속·담당 조직이 없습니다.',
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-800">공개범위</p>
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="공개범위">
        {cards.map(card => {
          const selected = value.mode === card.value;
          const Icon = card.icon;
          const disabled = !!card.disabled;
          return (
            <div key={card.value} className="space-y-2">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => !disabled && setMode(card.value)}
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
  );
}
