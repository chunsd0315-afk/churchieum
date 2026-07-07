import { useState } from 'react';
import { X, Edit3, Trash2, Plus, GripVertical, ChevronUp, ChevronDown, Check } from 'lucide-react';
import type { SermonFolder } from '../../../types/sermon';
import {
  addFolder, updateFolder, deleteFolder, reorderFolders, getSelectableFolders,
} from '../../../services/sermonStorage';
import { sermonCardStyle, sermonInputClass, sermonPrimaryBtnClass } from './sermonDesign';

type Props = { onClose: () => void; onRefresh: () => void };

export default function SermonFolderManager({ onClose, onRefresh }: Props) {
  const [folders, setFolders] = useState<SermonFolder[]>(() => getSelectableFolders());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const reload = () => { setFolders(getSelectableFolders()); onRefresh(); };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addFolder({ name, type: 'worship', worshipType: 'other' });
    setNewName('');
    reload();
  };

  const handleRename = (id: string) => {
    const name = editName.trim();
    if (!name) return;
    updateFolder(id, { name });
    setEditingId(null);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteFolder(id);
    setConfirmDelete(null);
    reload();
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = folders.findIndex(f => f.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= folders.length) return;
    const ids = folders.map(f => f.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorderFolders(ids);
    reload();
  };

  const applyDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const ids = folders.map(f => f.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderFolders(ids);
    setDragId(null);
    setOverId(null);
    reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-[24px] sm:rounded-[24px] overflow-hidden" style={{ ...sermonCardStyle }}>
        <div className="px-5 md:px-7 py-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">예배 폴더 관리</h3>
            <p className="text-[13px] text-[#6B7280] mt-1">추가 · 이름 수정 · 삭제 · 순서 변경(드래그)</p>
          </div>
          <button type="button" onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-[14px]">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7F9FB] space-y-2">
          {folders.map(f => {
            const isEditing = editingId === f.id;
            const isOver = overId === f.id && dragId !== f.id;
            return (
              <div
                key={f.id}
                draggable={!isEditing}
                onDragStart={() => setDragId(f.id)}
                onDragOver={e => { e.preventDefault(); setOverId(f.id); }}
                onDragLeave={() => setOverId(prev => (prev === f.id ? null : prev))}
                onDrop={() => applyDrop(f.id)}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={`flex items-center gap-2 rounded-[14px] border px-2.5 py-2.5 bg-white transition-colors ${
                  isOver ? 'border-primary-400 ring-2 ring-primary-100' : 'border-[#E5E7EB]'
                } ${dragId === f.id ? 'opacity-50' : ''}`}
              >
                <span className="shrink-0 text-gray-300 cursor-grab active:cursor-grabbing touch-none" aria-hidden>
                  <GripVertical className="w-5 h-5" />
                </span>

                {isEditing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename(f.id)}
                    autoFocus
                    className={`${sermonInputClass} !min-h-[44px] flex-1`}
                  />
                ) : (
                  <span className="flex-1 text-[15px] font-bold text-gray-800 truncate">{f.name}</span>
                )}

                {isEditing ? (
                  <button type="button" onClick={() => handleRename(f.id)}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-[12px] bg-primary-600 text-white">
                    <Check className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-0.5">
                    <button type="button" onClick={() => move(f.id, -1)} aria-label="위로"
                      className="w-9 h-9 flex items-center justify-center rounded-[10px] text-gray-400 hover:bg-gray-100">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => move(f.id, 1)} aria-label="아래로"
                      className="w-9 h-9 flex items-center justify-center rounded-[10px] text-gray-400 hover:bg-gray-100">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => { setEditingId(f.id); setEditName(f.name); }} aria-label="이름 수정"
                      className="w-9 h-9 flex items-center justify-center rounded-[10px] text-gray-500 hover:bg-gray-100">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(f.id)} aria-label="삭제"
                      className="w-9 h-9 flex items-center justify-center rounded-[10px] text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {folders.length === 0 && (
            <p className="text-center text-[15px] text-[#6B7280] py-10">폴더가 없습니다. 아래에서 추가하세요.</p>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-[#E5E7EB] bg-white shrink-0 space-y-3">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="새 폴더명 (예: 청년부예배)"
              className={sermonInputClass}
            />
            <button type="button" onClick={handleAdd} className={`${sermonPrimaryBtnClass} shrink-0 !px-5`}>
              <Plus className="w-5 h-5" /> 추가
            </button>
          </div>
          <button type="button" onClick={onClose} className="w-full h-12 rounded-[14px] bg-[#F1F5F9] text-gray-700 font-bold text-[15px] hover:bg-gray-200 transition-colors">
            완료
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-sm" style={sermonCardStyle}>
            <h4 className="text-lg font-bold text-gray-900 mb-2">폴더를 삭제하시겠습니까?</h4>
            <p className="text-sm text-[#6B7280] mb-5">폴더의 설교는 삭제되지 않고 “전체”에만 남습니다.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => handleDelete(confirmDelete)}
                className="flex-1 h-12 bg-red-500 text-white rounded-[14px] font-bold">삭제</button>
              <button type="button" onClick={() => setConfirmDelete(null)}
                className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-[14px] font-bold">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
