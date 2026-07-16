import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, Plus } from 'lucide-react';
import type { OrgTreeNode } from '../../../types/organization';

type Props = {
  tree: OrgTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
};

function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  expanded,
  toggle,
}: {
  node: OrgTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const active = selectedId === node.id;

  return (
    <div>
      <div
        className={[
          'group flex items-center gap-1 rounded-[12px] pr-1 transition-colors',
          active ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-800',
        ].join(' ')}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg touch-target"
          aria-label={isOpen ? '접기' : '펼치기'}
          onClick={() => hasChildren && toggle(node.id)}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <span className="w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 min-w-0 text-left py-2.5 touch-target"
        >
          <span className={`block text-[14px] font-semibold truncate ${!node.isActive ? 'text-gray-400 line-through' : ''}`}>
            {node.name}
          </span>
          <span className="block text-[11px] text-gray-400 truncate">{node.type}</span>
        </button>
        <button
          type="button"
          aria-label="하위 조직 추가"
          onClick={() => onAddChild(node.id)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgTreePanel({ tree, selectedId, onSelect, onAddChild }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>();
    tree.forEach(n => init.add(n.id));
    return init;
  });

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <FolderTree className="w-4 h-4 text-primary-600 shrink-0" />
          <h3 className="text-[15px] font-bold text-gray-900 truncate">조직 트리</h3>
        </div>
        <button
          type="button"
          onClick={() => onAddChild(null)}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-[12px] text-[13px] font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100"
        >
          <Plus className="w-4 h-4" />
          최상위
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">조직이 없습니다. 최상위 조직을 추가하세요.</p>
        ) : (
          tree.map(node => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              expanded={expanded}
              toggle={toggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
