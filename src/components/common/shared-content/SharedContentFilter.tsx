import { useMemo, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import type { VisibilityType, ShareTypeFilter } from '../../../types/sharedContent';
import { VISIBILITY_LABELS, SHARE_TYPE_FILTER_LABELS } from '../../../types/sharedContent';
import type { AppUser } from '../../../services/permissions';
import {
  getOrganizationPathLabel,
  resolveOrgTreeMode,
  type UserOrgTreeMode,
} from '../../../services/userOrganizationTree';
import { UserOrganizationTreeSelector } from './UserOrganizationTreeSelector';

export type SharedContentFilterState = {
  visibility?: VisibilityType | 'all';
  /** 공유받은 기록 — 공유 유형 (private 제외) */
  shareType?: ShareTypeFilter;
  /** 교구·부서 세부 선택 ([] = 전체) */
  organizationIds?: string[];
  authorQuery?: string;
  orgId?: string;
  dateFrom?: string;
  dateTo?: string;
  /** 기도 */
  prayerStatus?: 'all' | 'praying' | 'answered';
  /** 사용자 구분 */
  authorRole?: 'all' | 'member' | 'pastor' | 'super_admin';
  /** 은혜기록 유형 / 기도 유형 (도메인별 contentType) */
  contentType?: string;
  /** @deprecated contentType 사용 */
  graceType?: string;
  /** 공유받은 기록 — 교역자 세부 선택 */
  selectedPastorIds?: string[];
};

export type SharedContentFilterProps = {
  value: SharedContentFilterState;
  onChange: (v: SharedContentFilterState) => void;
  search: string;
  onSearchChange: (q: string) => void;
  /** member | pastor | admin */
  mode?: 'member' | 'pastor' | 'admin';
  /** 조직 트리 필터용 로그인 사용자 */
  user?: AppUser | null;
  showPrayerStatus?: boolean;
  /** 공유 유형 필터 (전체/교역자/교구·부서) */
  showShareTypeFilter?: boolean;
  /** 성도 모드: 교역자 공유 옵션 숨김(직접 공유 0건일 때) */
  hidePastorShareTypeOption?: boolean;
  /** 공유 유형과 무관하게 조직 세부 필터 표시 (교구·부서 탭) */
  forceShowOrganizationFilter?: boolean;
  /** @deprecated 칩 보조 — path label로 대체 */
  filterOrganizations?: { id: string; name: string }[];
  orgOptions?: { id: string; name: string }[];
  /** 교역자 전체 조직 트리 확장 (기본 false) */
  allowFullOrgTree?: boolean;
  className?: string;
};

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[12px] font-semibold border border-primary-100 touch-target"
    >
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}

function toTreeMode(mode: SharedContentFilterProps['mode'], user?: AppUser | null): UserOrgTreeMode {
  if (mode === 'admin') return 'super_admin';
  if (mode === 'pastor') return 'pastor';
  if (user) return resolveOrgTreeMode(user);
  return 'member';
}

export function SharedContentSearchFilter({
  value,
  onChange,
  search,
  onSearchChange,
  mode = 'member',
  user = null,
  showPrayerStatus = false,
  showShareTypeFilter = false,
  hidePastorShareTypeOption = false,
  forceShowOrganizationFilter = false,
  filterOrganizations = [],
  orgOptions = [],
  allowFullOrgTree = false,
  className = '',
}: SharedContentFilterProps) {
  const [open, setOpen] = useState(false);
  const organizationIds = value.organizationIds ?? [];
  const showOrgDetail =
    Boolean(user) &&
    (forceShowOrganizationFilter ||
      (showShareTypeFilter && value.shareType === 'organization_share'));

  const chips = useMemo(() => {
    const list: { key: string; label: string; orgId?: string }[] = [];
    if (value.shareType && value.shareType !== 'all') {
      list.push({
        key: 'shareType',
        label: SHARE_TYPE_FILTER_LABELS[value.shareType],
      });
    }
    for (const id of organizationIds) {
      const path = getOrganizationPathLabel(id);
      const fallback =
        filterOrganizations.find(o => o.id === id)?.name ??
        orgOptions.find(o => o.id === id)?.name ??
        id;
      list.push({ key: `org:${id}`, label: path || fallback, orgId: id });
    }
    if (value.visibility && value.visibility !== 'all') {
      list.push({
        key: 'visibility',
        label: VISIBILITY_LABELS[value.visibility],
      });
    }
    if (value.orgId) {
      const name =
        getOrganizationPathLabel(value.orgId) ||
        orgOptions.find(o => o.id === value.orgId)?.name ||
        value.orgId;
      list.push({ key: 'orgId', label: name });
    }
    if (value.prayerStatus && value.prayerStatus !== 'all') {
      list.push({
        key: 'prayerStatus',
        label: value.prayerStatus === 'answered' ? '응답' : '기도 중',
      });
    }
    if (value.authorRole && value.authorRole !== 'all') {
      const roleLabel =
        value.authorRole === 'member'
          ? '성도'
          : value.authorRole === 'pastor'
            ? '교역자'
            : '최고관리자';
      list.push({ key: 'authorRole', label: roleLabel });
    }
    if (value.dateFrom || value.dateTo) {
      list.push({
        key: 'dateFrom',
        label: `${value.dateFrom || '…'} ~ ${value.dateTo || '…'}`,
      });
    }
    if (value.authorQuery) {
      list.push({ key: 'authorQuery', label: `작성자: ${value.authorQuery}` });
    }
    return list;
  }, [value, orgOptions, organizationIds, filterOrganizations]);

  const clearAll = () => {
    onChange({
      visibility: 'all',
      shareType: 'all',
      organizationIds: [],
      prayerStatus: 'all',
      authorRole: 'all',
      orgId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      authorQuery: undefined,
      graceType: undefined,
    });
  };

  const setShareType = (shareType: ShareTypeFilter) => {
    onChange({
      ...value,
      shareType,
      organizationIds: shareType === 'organization_share' ? value.organizationIds ?? [] : [],
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="제목, 내용, 작성자, 구절, 조직 검색"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold touch-target ${
            open || chips.length > 0
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-600'
          }`}
        >
          <Filter className="w-4 h-4" />
          상세설정
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map(c => (
            <Chip
              key={c.key + c.label}
              label={c.label}
              onRemove={() => {
                if (c.key === 'dateFrom') {
                  onChange({ ...value, dateFrom: undefined, dateTo: undefined });
                } else if (c.key === 'visibility') {
                  onChange({ ...value, visibility: 'all' });
                } else if (c.key === 'shareType') {
                  onChange({ ...value, shareType: 'all', organizationIds: [] });
                } else if (c.orgId) {
                  onChange({
                    ...value,
                    organizationIds: organizationIds.filter(id => id !== c.orgId),
                  });
                } else if (c.key === 'prayerStatus') {
                  onChange({ ...value, prayerStatus: 'all' });
                } else if (c.key === 'authorRole') {
                  onChange({ ...value, authorRole: 'all' });
                } else if (c.key === 'orgId') {
                  onChange({ ...value, orgId: undefined });
                } else if (c.key === 'authorQuery') {
                  onChange({ ...value, authorQuery: undefined });
                }
              }}
            />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-semibold text-gray-500 px-2 touch-target"
          >
            전체 초기화
          </button>
        </div>
      )}

      {open && (
        <div className="bg-white border border-gray-200 rounded-card p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {showShareTypeFilter && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5">공유 유형</p>
              <select
                value={value.shareType ?? 'all'}
                onChange={e => setShareType(e.target.value as ShareTypeFilter)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="all">{SHARE_TYPE_FILTER_LABELS.all}</option>
                {!hidePastorShareTypeOption && (
                  <option value="pastor_share">{SHARE_TYPE_FILTER_LABELS.pastor_share}</option>
                )}
                <option value="organization_share">
                  {SHARE_TYPE_FILTER_LABELS.organization_share}
                </option>
              </select>
            </div>
          )}

          {showOrgDetail && (
            <UserOrganizationTreeSelector
              user={user}
              mode={toTreeMode(mode, user)}
              selectedOrganizationIds={organizationIds}
              onChange={ids => onChange({ ...value, organizationIds: ids })}
              allowFullOrgTree={allowFullOrgTree}
            />
          )}

          {showPrayerStatus && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5">기도 상태</p>
              <select
                value={value.prayerStatus ?? 'all'}
                onChange={e =>
                  onChange({
                    ...value,
                    prayerStatus: e.target.value as SharedContentFilterState['prayerStatus'],
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="all">전체</option>
                <option value="praying">기도 중</option>
                <option value="answered">응답</option>
              </select>
            </div>
          )}

          {(mode === 'pastor' || mode === 'admin') && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5">작성자</p>
              <input
                value={value.authorQuery ?? ''}
                onChange={e => onChange({ ...value, authorQuery: e.target.value })}
                placeholder="작성자 이름"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          )}

          {mode === 'admin' && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5">사용자 구분</p>
              <select
                value={value.authorRole ?? 'all'}
                onChange={e =>
                  onChange({
                    ...value,
                    authorRole: e.target.value as SharedContentFilterState['authorRole'],
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="all">전체</option>
                <option value="member">성도</option>
                <option value="pastor">교역자</option>
                <option value="super_admin">최고관리자</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5">시작일</p>
              <input
                type="date"
                value={value.dateFrom ?? ''}
                onChange={e => onChange({ ...value, dateFrom: e.target.value || undefined })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5">종료일</p>
              <input
                type="date"
                value={value.dateTo ?? ''}
                onChange={e => onChange({ ...value, dateTo: e.target.value || undefined })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
