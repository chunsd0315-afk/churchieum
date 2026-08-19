/**
 * 공지사항 상세검색 패널
 *
 * 기능:
 * - 공개범위: 전체 / 내 조직
 * - 내 조직 선택: 은혜와 기도와 동일한 방식으로 사용자 관련 조직만 표시
 * - 기간: 오늘·최근7일·최근30일·이번달·직접설정
 * - 검색어
 * - 최고관리자에게만 "전체 조직 보기" 추가 제공
 */

import { useMemo, useState } from 'react';
import { X, ChevronDown, ChevronUp, Globe, Building2, Calendar, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserOrganizationTree,
  flattenOrgFilterTree,
  getUserVisibleOrganizationIds,
  type OrgFilterTreeNode,
} from '../../services/userOrganizationTree';
import { getUserCoreOrganizationIds } from '../../services/userOrganizationTree';
import { getAllOrganizations } from '../../services/organizationStorage';
import { isSuperAdmin } from '../../services/permissions';

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
};

export const EMPTY_FILTER: AnnouncementSearchFilter = {
  scopeMode: 'all',
  selectedOrgIds: [],
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
  keyword: '',
};

export function isFilterActive(f: AnnouncementSearchFilter): boolean {
  return (
    f.scopeMode !== 'all' ||
    f.selectedOrgIds.length > 0 ||
    f.datePreset !== 'all' ||
    !!f.dateFrom ||
    !!f.dateTo ||
    !!f.keyword
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

  return (
    <div>
      <button
        type="button"
        onClick={() => node.selectable && onToggle(node.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-colors touch-target ${
          isSelected
            ? 'bg-primary-50 border border-primary-200 text-primary-800'
            : node.selectable
            ? 'hover:bg-gray-50 text-gray-800'
            : 'text-gray-400 cursor-default'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        disabled={!node.selectable}
      >
        {/* Checkbox */}
        <span
          className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 bg-white'
          }`}
        >
          {isSelected && (
            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span className="flex-1 min-w-0">
          <span className={`text-sm font-semibold ${isSelected ? 'text-primary-800' : ''}`}>
            {node.name}
          </span>
          {node.description && (
            <span className="text-[11px] text-gray-400 ml-1.5">{node.description}</span>
          )}
        </span>

        {/* 자식 펼치기 */}
        {node.children.length > 0 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400"
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

  // 전체 조직 보기 (최고관리자 전용)
  const [showAllOrgs, setShowAllOrgs] = useState(false);

  // 내 조직 트리
  const myOrgTree = useMemo(
    () => getUserOrganizationTree({ user, scope: 'mine' }),
    [user],
  );

  // 전체 조직 트리 (최고관리자)
  const allOrgTree = useMemo(() => {
    if (!isAdmin || !showAllOrgs) return [];
    return getUserOrganizationTree({ user, scope: 'all' });
  }, [user, isAdmin, showAllOrgs]);

  const displayTree = showAllOrgs && isAdmin ? allOrgTree : myOrgTree;
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
                  onClick={() => { setShowAllOrgs(v => !v); onChange({ ...value, selectedOrgIds: [] }); }}
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
            <div className="border border-gray-200 rounded-[16px] overflow-hidden max-h-52 overflow-y-auto">
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

      {/* ── 검색어 ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">검색어</span>
        </div>
        <input
          type="search"
          value={value.keyword}
          onChange={e => onChange({ ...value, keyword: e.target.value })}
          placeholder="제목 또는 내용을 검색하세요."
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700"
        />
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
          검색
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
        필터 초기화
      </button>
    </div>
  );
}
