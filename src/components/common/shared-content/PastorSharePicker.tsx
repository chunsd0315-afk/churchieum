/**
 * 공개범위 — 교역자 선택기 (공통)
 *
 * 조직관리 조직트리를 그대로 사용해 교역자를 찾는다.
 * - church: 최고관리자 — 교회 전체 조직트리
 * - related: 성도·교역자 — 소속·담당 조직 경로
 * PC는 다이얼로그, 모바일은 전체 화면 선택기.
 *
 * 모달은 createPortal(document.body)로 렌더해 sticky 등 부모 stacking context
 * 충돌을 피한다. (OrganizationPicker와 동일)
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, UserRound, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import type { SharedPastorSnapshot } from '../../../data/graceNotes';
import {
  buildChurchWidePastorShareTree,
  buildDirectPastorShareModel,
  getUnassignedChurchPastors,
  resolvePastorDisplay,
  type DirectPastorOnOrg,
  type DirectPastorOrgNode,
} from '../../../services/directPastorShare';
import { getClergyByEmail } from '../../../services/clergyData';
import { ORG_TREE_CHANGED_EVENT } from '../../../services/organizationStorage';
import { uniqueVisibilityIds } from '../../../services/visibilityNormalize';
import { ChurchSearchInput } from '../ui';

export type PastorShareScope = 'church' | 'related';

export type PastorSharePickerProps = {
  open: boolean;
  onClose: () => void;
  value: string[];
  onConfirm: (pastorIds: string[]) => void;
  scope: PastorShareScope;
  title?: string;
  description?: string;
  /** 이전에 공유한 교역자 표시용 */
  snapshots?: SharedPastorSnapshot[];
};

const UNASSIGNED_GROUP_ID = '__unassigned__';

function matchesQuery(pastor: DirectPastorOnOrg, orgName: string, needle: string): boolean {
  if (!needle) return true;
  return [pastor.name, pastor.position, pastor.organizationRole, orgName]
    .filter(Boolean)
    .some(v => v!.toLowerCase().includes(needle));
}

/** 검색어에 맞는 교역자만 남기고 빈 조직은 숨긴다 */
function filterTree(nodes: DirectPastorOrgNode[], needle: string): DirectPastorOrgNode[] {
  const out: DirectPastorOrgNode[] = [];
  for (const node of nodes) {
    const orgHit = !needle || node.organizationName.toLowerCase().includes(needle);
    const pastors = node.pastors.filter(p =>
      orgHit ? true : matchesQuery(p, node.organizationName, needle),
    );
    const children = filterTree(node.children, needle);
    if (pastors.length === 0 && children.length === 0) continue;
    out.push({ ...node, pastors, children });
  }
  return out;
}

export function PastorSharePicker({
  open,
  onClose,
  value,
  onConfirm,
  scope,
  title = '교역자 선택',
  description = '공유할 교역자를 선택합니다.',
  snapshots = [],
}: PastorSharePickerProps) {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [selected, setSelected] = useState<string[]>(value);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [orgTick, setOrgTick] = useState(0);

  useEffect(() => {
    const bump = () => setOrgTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelected(value);
    setQuery('');
    setCollapsed(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const excludeSelf = useMemo(() => {
    if (!user) return null;
    if (user.role === 'member') return null;
    return getClergyByEmail(user.email)?.id ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orgTick]);

  const baseTree = useMemo(() => {
    if (!open) return [];
    if (scope === 'church') return buildChurchWidePastorShareTree(excludeSelf);
    return buildDirectPastorShareModel(user, { relatedOnly: true }).tree;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope, user, excludeSelf, orgTick]);

  const unassigned = useMemo(() => {
    if (!open || scope !== 'church') return [];
    return getUnassignedChurchPastors(excludeSelf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope, excludeSelf, orgTick]);

  const needle = query.trim().toLowerCase();

  const tree = useMemo(() => filterTree(baseTree, needle), [baseTree, needle]);

  const unassignedRows = useMemo(
    () => unassigned.filter(p => matchesQuery(p, '', needle)),
    [unassigned, needle],
  );

  const hasResult = tree.length > 0 || unassignedRows.length > 0;

  const togglePastor = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : uniqueVisibilityIds([...prev, id]),
    );
  };

  const toggleOrg = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  const isOpenNode = (id: string) => (needle ? true : !collapsed.has(id));

  const pastorRow = (pastor: DirectPastorOnOrg, depth: number, key: string) => {
    const checked = selected.includes(pastor.pastorId);
    return (
      <button
        key={key}
        type="button"
        onClick={() => togglePastor(pastor.pastorId)}
        className={[
          'w-full flex items-center gap-2.5 min-h-[48px] px-2 py-2 text-left rounded-[14px]',
          checked ? 'bg-[#FFF7D6]' : 'hover:bg-[#FFFDF7]',
        ].join(' ')}
        style={{ paddingLeft: 12 + Math.min(depth, 5) * 16 }}
      >
        <span
          className={[
            'w-5 h-5 shrink-0 flex items-center justify-center rounded-[6px] border-2',
            checked ? 'border-[#FFCD00] bg-[#FFCD00]' : 'border-gray-300 bg-white',
          ].join(' ')}
        >
          {checked && <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-[#1A1A1A] truncate">
            {pastor.name} <span className="font-medium text-gray-600">{pastor.position}</span>
          </span>
          {pastor.organizationRole && (
            <span className="block text-[12px] text-gray-500 truncate">
              {pastor.organizationRole}
            </span>
          )}
        </span>
      </button>
    );
  };

  const renderNode = (node: DirectPastorOrgNode, depth: number) => {
    const open = isOpenNode(node.organizationId);
    const hasChildren = node.children.length > 0 || node.pastors.length > 0;
    return (
      <li key={node.organizationId}>
        <div
          className="flex items-center gap-1 rounded-[14px] hover:bg-[#FFFDF7]"
          style={{ paddingLeft: Math.min(depth, 5) * 16 }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleOrg(node.organizationId)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg hover:bg-gray-100 shrink-0"
              aria-label={open ? `${node.organizationName} 접기` : `${node.organizationName} 펼치기`}
            >
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-8 h-8 shrink-0" />
          )}
          <span className="py-2 text-[14px] font-bold text-[#1A1A1A] truncate">
            {node.organizationName}
          </span>
        </div>

        {open && (
          <>
            {node.pastors.map(p =>
              pastorRow(p, depth + 1, `${node.organizationId}-${p.pastorId}`),
            )}
            {node.children.length > 0 && (
              <ul>{node.children.map(child => renderNode(child, depth + 1))}</ul>
            )}
          </>
        )}
      </li>
    );
  };

  const body = (
    <div className="px-2 py-2">
      {!hasResult ? (
        <div className="py-14 text-center">
          <UserRound className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {needle ? `‘${query}’ 검색 결과가 없습니다.` : '선택할 수 있는 교역자가 없습니다.'}
          </p>
        </div>
      ) : (
        <ul>
          {tree.map(node => renderNode(node, 0))}
          {unassignedRows.length > 0 && (
            <li key={UNASSIGNED_GROUP_ID}>
              <div className="flex items-center gap-1 rounded-[14px]">
                <span className="w-8 h-8 shrink-0" />
                <span className="py-2 text-[14px] font-bold text-[#1A1A1A]">소속 미지정</span>
              </div>
              {unassignedRows.map(p => pastorRow(p, 1, `${UNASSIGNED_GROUP_ID}-${p.pastorId}`))}
            </li>
          )}
        </ul>
      )}
    </div>
  );

  const selectedBar = (
    <div className="space-y-2">
      <p className="text-[12px] font-bold text-gray-500">선택 {selected.length}명</p>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-[84px] overflow-y-auto">
          {selected.map(id => {
            const display = resolvePastorDisplay(id, snapshots);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-[12px] font-semibold border bg-[#FFF7D6] text-[#1A1A1A] border-[#FFCD00]"
              >
                <span className="truncate max-w-[200px]">
                  {display.name} {display.position}
                </span>
                <button
                  type="button"
                  onClick={() => togglePastor(id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5"
                  aria-label={`${display.name} 선택 해제`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  const handleConfirm = () => {
    onConfirm(uniqueVisibilityIds(selected));
    onClose();
  };

  const searchBar = (
    <ChurchSearchInput
      value={query}
      onChange={setQuery}
      placeholder="교역자 이름 또는 조직 검색"
    />
  );

  const overlay = isMobile ? (
    <div
      className="fixed inset-0 z-modal bg-[#FFFDF7] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="shrink-0 bg-white border-b border-[#ECECEC] px-3 py-3">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600"
            aria-label="닫기"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#1A1A1A] truncate">{title}</h2>
            <p className="text-[12px] text-gray-500 truncate">{description}</p>
          </div>
        </div>
        {searchBar}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {body}
      </div>

      <footer className="shrink-0 bg-white border-t border-[#ECECEC] px-4 py-3 space-y-3">
        {selectedBar}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[56px] rounded-[18px] bg-[#FFCD00] hover:bg-[#F5BE00] text-[#1A1A1A] font-bold text-[15px]"
        >
          선택 완료
        </button>
      </footer>
    </div>
  ) : (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="닫기" onClick={onClose} />
      <div
        className="relative w-full max-w-[640px] bg-white rounded-[24px] border border-[#ECECEC] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col min-h-0"
        style={{ maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-[#1A1A1A]">{title}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 shrink-0"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchBar}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border-y border-[#ECECEC] bg-white">
          {body}
        </div>

        <div className="shrink-0 px-5 py-4 space-y-3">
          {selectedBar}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 rounded-[18px] border border-[#ECECEC] text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="min-h-[48px] px-6 rounded-[18px] bg-[#FFCD00] hover:bg-[#F5BE00] text-[#1A1A1A] font-bold text-sm"
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return overlay;
  return createPortal(overlay, document.body);
}
