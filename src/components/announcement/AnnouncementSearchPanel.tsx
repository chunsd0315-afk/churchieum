/**
 * 공지사항 상세설정 패널
 *
 * 기능:
 * - 검색어 (상단 검색창과 동일 상태)
 * - 공개범위: 전체 / 내 조직
 * - 내 조직 선택: 은혜와 기도와 동일한 방식으로 사용자 관련 조직만 표시
 * - 기간: 오늘·최근7일·최근30일·이번달·직접설정
 * - 최고관리자에게만 "전체 조직 보기" 추가 제공
 */

import { useMemo, useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Globe, Building2, Calendar, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserOrganizationTree,
  collectTreeNodeIds,
  resolveOrgTreeMode,
  type OrgFilterTreeNode,
} from '../../services/userOrganizationTree';
import { getAllOrganizations } from '../../services/organizationStorage';
import { isSuperAdmin } from '../../services/permissions';
import {
  getPastoralAssigneesForOrganization,
  type DirectPastorOnOrg,
} from '../../services/directPastorShare';
import type { Announcement } from '../../services/announcementStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnouncementScopeMode = 'all' | 'my_org';

export type DatePreset = 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom';

export type AnnouncementSearchFilter = {
  scopeMode: AnnouncementScopeMode;
  selectedOrgIds: string[];
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  keyword: string;
  /** 최고관리자: 내 조직 대신 교회 전체 트리 */
  showFullOrgTree: boolean;
};

export const EMPTY_FILTER: AnnouncementSearchFilter = {
  scopeMode: 'all',
  selectedOrgIds: [],
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
  keyword: '',
  showFullOrgTree: false,
};

export function isFilterActive(f: AnnouncementSearchFilter): boolean {
  return (
    f.scopeMode !== 'all' ||
    f.selectedOrgIds.length > 0 ||
    f.datePreset !== 'all' ||
    !!f.dateFrom ||
    !!f.dateTo ||
    !!f.keyword ||
    f.showFullOrgTree
  );
}

export function countActiveFilters(f: AnnouncementSearchFilter): number {
  let n = 0;
  if (f.scopeMode !== 'all') n++;
  if (f.selectedOrgIds.length > 0) n++;
  if (f.datePreset !== 'all' || f.dateFrom || f.dateTo) n++;
  if (f.keyword) n++;
  return n;
}

/** 상단 검색어를 제외한 상세설정 조건 개수 (배지용) */
export function countDetailSettingFilters(f: AnnouncementSearchFilter): number {
  let n = 0;
  if (f.scopeMode !== 'all') n++;
  if (f.selectedOrgIds.length > 0) n++;
  if (f.datePreset !== 'all' || f.dateFrom || f.dateTo) n++;
  if (f.showFullOrgTree) n++;
  return n;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  if (preset === 'today') {
    const t = toISODate(now);
    return { from: t, to: t };
  }
  if (preset === '7days') {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === '30days') {
    const from = new Date(now);
    from.setDate(now.getDate() - 29);
    return { from: toISODate(from), to: toISODate(now) };
  }
  if (preset === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISODate(from), to: toISODate(now) };
  }
  return { from: '', to: '' };
}

function formatAssigneeLine(pastors: DirectPastorOnOrg[]): string {
  if (pastors.length === 0) return '담당 교역자 없음';
  const first = `${pastors[0].name}${pastors[0].position ? ` ${pastors[0].position}` : ''}`.trim();
  if (pastors.length === 1) return `담당 : ${first}`;
  return `담당 : ${first} 외 ${pastors.length - 1}명`;
}

function announcementOrgIds(a: Announcement): string[] {
  const ids = [...(a.sharedOrganizationIds ?? [])];
  if (a.scopeId) ids.push(a.scopeId);
  return [...new Set(ids.filter(Boolean))];
}

function announcementDateKey(a: Announcement): string {
  const raw = a.created_at || a.date || '';
  return raw.slice(0, 10);
}

/** 상세설정 조건 매칭 — 공개범위·조직·기간·검색어. 열람 권한은 호출측에서 먼저 적용. */
export function announcementMatchesDetailFilter(
  a: Announcement,
  f: AnnouncementSearchFilter,
  myOrgFallbackIds: string[],
  orgNameById: Map<string, string>,
): boolean {
  if (f.scopeMode === 'my_org') {
    const target = f.selectedOrgIds.length > 0 ? f.selectedOrgIds : myOrgFallbackIds;
    if (target.length === 0) return false;
    const ids = announcementOrgIds(a);
    if (!ids.some(id => target.includes(id))) return false;
  }

  const { dateFrom, dateTo } = f;
  if (dateFrom || dateTo) {
    const key = announcementDateKey(a);
    if (dateFrom && key && key < dateFrom) return false;
    if (dateTo && key && key > dateTo) return false;
    if (!key && (dateFrom || dateTo)) return false;
  }

  if (f.keyword) {
    const q = f.keyword.toLowerCase();
    const orgNames = announcementOrgIds(a)
      .map(id => orgNameById.get(id) ?? '')
      .join(' ');
    const hay = [
      a.title || '',
      a.content || '',
      a.author || '',
      a.scopeName || '',
      orgNames,
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function collectAnnouncementSelectableOrgIds(tree: OrgFilterTreeNode[]): string[] {
  return tree.flatMap(n => collectTreeNodeIds(n, true));
}

export function getAnnouncementMyOrgSelectableIds(
  user: Parameters<typeof getUserOrganizationTree>[0]['user'],
  showFullOrgTree = false,
): string[] {
  const tree = getUserOrganizationTree({
    user,
    mode: resolveOrgTreeMode(user),
    scope: showFullOrgTree && isSuperAdmin(user) ? 'all' : 'mine',
  });
  return collectAnnouncementSelectableOrgIds(tree);
}

// ─── Org node row ─────────────────────────────────────────────────────────────

function OrgRow({
  node,
  selectedIds,
  onToggle,
  depth = 0,
}: {
  node: OrgFilterTreeNode;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  const isSelected = selectedIds.has(node.id);
  const pastors = getPastoralAssigneesForOrganization(node.id);
  const assigneeLine = formatAssigneeLine(pastors);

  return (
    <div>
      <button
        type="button"
        onClick={() => node.selectable && onToggle(node.id)}
        className={`w-full flex items-start gap-3 px-3 py-2.5 min-h-[52px] rounded-[14px] text-left transition-colors touch-target ${
          isSelected
            ? 'bg-primary-50 border border-primary-200 text-primary-800'
            : node.selectable
            ? 'hover:bg-gray-50 text-gray-800'
            : 'text-gray-400 cursor-default'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        disabled={!node.selectable}
      >
        <span
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 bg-white'
          }`}
          aria-hidden
        >
          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </span>

        <span className="flex-1 min-w-0">
          <span className={`block text-sm font-semibold ${isSelected ? 'text-primary-800' : 'text-gray-900'}`}>
            {node.name}
          </span>
          <span
            className={`block text-[12px] mt-0.5 ${
              pastors.length === 0 ? 'text-amber-700' : 'text-gray-500'
            }`}
          >
            {assigneeLine}
          </span>
        </span>

        {node.children.length > 0 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 touch-target min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
            aria-label={open ? '접기' : '펼치기'}
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </button>

      {open && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <OrgRow
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

type Props = {
  value: AnnouncementSearchFilter;
  onChange: (f: AnnouncementSearchFilter) => void;
  onApply: () => void;
  onReset: () => void;
  /** 모바일 BottomSheet 모드 */
  asSheet?: boolean;
};

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'all',        label: '전체 기간' },
  { id: 'today',      label: '오늘' },
  { id: '7days',      label: '최근 7일' },
  { id: '30days',     label: '최근 30일' },
  { id: 'this_month', label: '이번 달' },
  { id: 'custom',     label: '직접 설정' },
];

export function AnnouncementSearchPanel({ value, onChange, onApply, onReset, asSheet = false }: Props) {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);
  const treeMode = resolveOrgTreeMode(user);

  const showAllOrgs = isAdmin && value.showFullOrgTree;

  const displayTree = useMemo(
    () => getUserOrganizationTree({
      user,
      mode: treeMode,
      scope: showAllOrgs ? 'all' : 'mine',
    }),
    [user, treeMode, showAllOrgs],
  );

  const selectedIds = new Set(value.selectedOrgIds);

  const toggleOrg = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ ...value, selectedOrgIds: [...next] });
  };

  const handlePreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      onChange({ ...value, datePreset: 'custom' });
      return;
    }
    const { from, to } = getPresetDates(preset);
    onChange({ ...value, datePreset: preset, dateFrom: from, dateTo: to });
  };

  const dateError =
    value.datePreset === 'custom' &&
    value.dateFrom &&
    value.dateTo &&
    value.dateFrom > value.dateTo
      ? '종료일은 시작일 이후로 설정해 주세요.'
      : '';

  const wrapCls = asSheet ? '' : 'bg-white border border-gray-200 rounded-[24px] shadow-lg';

  return (
    <div className={`${wrapCls} p-5 space-y-5`}>
      {/* ── 검색어 (상단 검색과 동일 상태) ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">검색어</span>
        </div>
        <input
          type="search"
          value={value.keyword}
          onChange={e => onChange({ ...value, keyword: e.target.value })}
          placeholder="제목 또는 내용 검색"
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm min-h-[48px] focus:outline-none focus:border-primary-400 text-gray-700"
        />
      </div>

      {/* ── 공개범위 ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">공개범위</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'my_org'] as AnnouncementScopeMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...value, scopeMode: mode, selectedOrgIds: [] })}
              className={`flex-1 h-11 rounded-[14px] text-sm font-bold border-2 transition-all touch-target ${
                value.scopeMode === mode
                  ? 'bg-primary-50 border-primary-400 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {mode === 'all' ? '전체' : '내 조직'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 내 조직 선택 ── */}
      {value.scopeMode === 'my_org' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-700">내 조직 선택</span>
            </div>
            <div className="flex items-center gap-2">
              {value.selectedOrgIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, selectedOrgIds: [] })}
                  className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                >
                  선택 해제
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onChange({
                    ...value,
                    showFullOrgTree: !showAllOrgs,
                    selectedOrgIds: [],
                  })}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    showAllOrgs
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {showAllOrgs ? '내 조직만 보기' : '전체 조직 보기'}
                </button>
              )}
            </div>
          </div>

          {displayTree.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              소속된 조직 정보가 없습니다.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-[16px] overflow-hidden max-h-[40vh] md:max-h-52 overflow-y-auto overscroll-contain">
              <div className="p-2 space-y-0.5">
                {displayTree.map(node => (
                  <OrgRow
                    key={node.id}
                    node={node}
                    selectedIds={selectedIds}
                    onToggle={toggleOrg}
                  />
                ))}
              </div>
            </div>
          )}

          {value.selectedOrgIds.length > 0 && (
            <p className="text-[12px] text-primary-700 font-semibold">
              {value.selectedOrgIds.length}개 조직 선택됨
            </p>
          )}
        </div>
      )}

      {/* ── 기간 ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">기간</span>
        </div>

        {/* 빠른 선택 */}
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all touch-target ${
                value.datePreset === p.id
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 직접 설정 */}
        {value.datePreset === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={value.dateFrom}
              onChange={e => onChange({ ...value, dateFrom: e.target.value })}
              className="flex-1 min-w-[130px] px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700"
            />
            <span className="text-gray-400 text-sm shrink-0">~</span>
            <input
              type="date"
              value={value.dateTo}
              onChange={e => onChange({ ...value, dateTo: e.target.value })}
              min={value.dateFrom || undefined}
              className="flex-1 min-w-[130px] px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700"
            />
          </div>
        )}

        {dateError && (
          <p className="text-xs text-red-500 font-medium">{dateError}</p>
        )}
      </div>

      {/* ── 버튼 ── */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 h-12 border border-gray-200 rounded-[14px] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors touch-target"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!!dateError}
          className="flex-2 flex-[2] h-12 bg-primary-500 text-white rounded-[14px] text-sm font-bold hover:bg-primary-600 transition-colors touch-target disabled:opacity-40"
        >
          상세설정 적용
        </button>
      </div>
    </div>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} 필터 제거`}
        className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

export function AnnouncementFilterChips({
  filter,
  onChange,
}: {
  filter: AnnouncementSearchFilter;
  onChange: (f: AnnouncementSearchFilter) => void;
}) {
  const chips: { label: string; remove: () => void }[] = [];

  if (filter.scopeMode === 'my_org') {
    chips.push({
      label: '내 조직',
      remove: () => onChange({ ...filter, scopeMode: 'all', selectedOrgIds: [] }),
    });
  }

  // 선택된 조직 이름
  const allOrgs = useMemo(() => getAllOrganizations(), []);
  const orgMap = useMemo(() => new Map(allOrgs.map(o => [o.id, o.name])), [allOrgs]);

  for (const id of filter.selectedOrgIds) {
    const name = orgMap.get(id) ?? id;
    chips.push({
      label: name,
      remove: () => onChange({
        ...filter,
        selectedOrgIds: filter.selectedOrgIds.filter(x => x !== id),
      }),
    });
  }

  // 기간
  const presetLabel = DATE_PRESETS.find(p => p.id === filter.datePreset)?.label;
  if (filter.datePreset === 'custom' && (filter.dateFrom || filter.dateTo)) {
    const label = [filter.dateFrom, filter.dateTo].filter(Boolean).join(' ~ ');
    chips.push({
      label,
      remove: () => onChange({ ...filter, datePreset: 'all', dateFrom: '', dateTo: '' }),
    });
  } else if (filter.datePreset !== 'all' && presetLabel) {
    chips.push({
      label: presetLabel,
      remove: () => onChange({ ...filter, datePreset: 'all', dateFrom: '', dateTo: '' }),
    });
  }

  if (filter.showFullOrgTree) {
    chips.push({
      label: '전체 조직 보기',
      remove: () => onChange({ ...filter, showFullOrgTree: false, selectedOrgIds: [] }),
    });
  }

  if (filter.keyword) {
    chips.push({
      label: `"${filter.keyword}"`,
      remove: () => onChange({ ...filter, keyword: '' }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <Chip key={i} label={c.label} onRemove={c.remove} />
      ))}
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTER)}
        className="text-[11px] text-gray-400 hover:text-gray-600 underline px-1"
      >
        상세설정 초기화
      </button>
    </div>
  );
}
