import { useState } from 'react';
import {
  X, ChevronDown, ChevronRight, Edit3, Trash2, Plus, GripVertical,
} from 'lucide-react';
import type { SermonFolder, WorshipType } from '../../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../../types/sermon';
import {
  addFolder, updateFolder, deleteFolder, reorderFolders,
  getYearFolders, getMonthFolders, getWorshipFolders,
} from '../../lib/sermonStorage';

type Props = {
  onClose: () => void;
  onRefresh: () => void;
};

export default function SermonFolderManager({ onClose, onRefresh }: Props) {
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newYear, setNewYear] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newWorship, setNewWorship] = useState<WorshipType>('sunday');
  const [addUnder, setAddUnder] = useState<{ type: 'year' | 'month' | 'worship'; parentId?: string } | null>(null);

  const years = getYearFolders();

  const refresh = () => onRefresh();

  const startEdit = (f: SermonFolder) => {
    setEditingId(f.id);
    setEditName(f.name);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateFolder(id, { name: editName.trim() });
    setEditingId(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteFolder(id);
    setConfirmDelete(null);
    refresh();
  };

  const moveFolder = (siblings: SermonFolder[], id: string, dir: -1 | 1) => {
    const idx = siblings.findIndex(f => f.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= siblings.length) return;
    const ids = siblings.map(f => f.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorderFolders(ids);
    refresh();
  };

  const handleAddYear = () => {
    const y = parseInt(newYear, 10);
    if (!y || y < 2000) return;
    addFolder({ name: `${y}년`, type: 'year', year: y });
    setNewYear('');
    setAddUnder(null);
    refresh();
  };

  const handleAddMonth = (yearId: string, year: number) => {
    const m = parseInt(newMonth, 10);
    if (!m || m < 1 || m > 12) return;
    addFolder({ name: `${m}월`, type: 'month', parentId: yearId, year, month: m });
    setNewMonth('');
    setAddUnder(null);
    refresh();
  };

  const handleAddWorship = (monthId: string) => {
    addFolder({
      name: WORSHIP_TYPE_LABELS[newWorship],
      type: 'worship',
      parentId: monthId,
      worshipType: newWorship,
    });
    setAddUnder(null);
    refresh();
  };

  const renderFolderRow = (f: SermonFolder, siblings: SermonFolder[]) => (
    <div key={f.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-3">
      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
      {editingId === f.id ? (
        <>
          <input value={editName} onChange={e => setEditName(e.target.value)}
            className="flex-1 px-3 py-2 text-base bg-white border border-primary-300 rounded-lg focus:outline-none" autoFocus />
          <button type="button" onClick={() => saveEdit(f.id)}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold">저장</button>
          <button type="button" onClick={() => setEditingId(null)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm">취소</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-base font-medium text-gray-800">{f.name}</span>
          <button type="button" onClick={() => moveFolder(siblings, f.id, -1)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600">▲</button>
          <button type="button" onClick={() => moveFolder(siblings, f.id, 1)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600">▼</button>
          <button type="button" onClick={() => startEdit(f)}
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-primary-500">
            <Edit3 className="w-4 h-4" />
          </button>
          {!f.isDefault && (
            <button type="button" onClick={() => setConfirmDelete(f.id)}
              className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-gray-900">예배 폴더 관리</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <p className="text-sm text-gray-500">연도 → 월 → 예배별로 폴더를 정리합니다.</p>

          {years.map(year => {
            const months = getMonthFolders(year.id);
            const yearOpen = expandedYear === year.id;
            return (
              <div key={year.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button type="button"
                  onClick={() => setExpandedYear(yearOpen ? null : year.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-left font-bold text-gray-800">
                  {yearOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  {year.name}
                </button>
                {yearOpen && (
                  <div className="p-3 space-y-2">
                    {months.map(month => {
                      const worships = getWorshipFolders(month.id);
                      const monthOpen = expandedMonth === month.id;
                      return (
                        <div key={month.id} className="ml-2">
                          <button type="button"
                            onClick={() => setExpandedMonth(monthOpen ? null : month.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-semibold text-gray-700">
                            {monthOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {month.name}
                          </button>
                          {monthOpen && (
                            <div className="ml-4 space-y-2 mt-1">
                              {worships.map(w => renderFolderRow(w, worships))}
                              {addUnder?.type === 'worship' && addUnder.parentId === month.id ? (
                                <div className="flex gap-2">
                                  <select value={newWorship} onChange={e => setNewWorship(e.target.value as WorshipType)}
                                    className="flex-1 px-3 py-2 border rounded-xl text-sm">
                                    {(Object.keys(WORSHIP_TYPE_LABELS) as WorshipType[]).map(wt => (
                                      <option key={wt} value={wt}>{WORSHIP_TYPE_LABELS[wt]}</option>
                                    ))}
                                  </select>
                                  <button type="button" onClick={() => handleAddWorship(month.id)}
                                    className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold">추가</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => setAddUnder({ type: 'worship', parentId: month.id })}
                                  className="text-sm text-primary-600 font-semibold flex items-center gap-1 py-1">
                                  <Plus className="w-4 h-4" /> 예배 폴더 추가
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {addUnder?.type === 'month' && addUnder.parentId === year.id ? (
                      <div className="flex gap-2 ml-2">
                        <input value={newMonth} onChange={e => setNewMonth(e.target.value)}
                          placeholder="월 (1-12)" className="flex-1 px-3 py-2 border rounded-xl text-sm" />
                        <button type="button" onClick={() => handleAddMonth(year.id, year.year!)}
                          className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold">추가</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setAddUnder({ type: 'month', parentId: year.id })}
                        className="text-sm text-primary-600 font-semibold flex items-center gap-1 py-1 ml-2">
                        <Plus className="w-4 h-4" /> 월 폴더 추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {addUnder?.type === 'year' ? (
            <div className="flex gap-2">
              <input value={newYear} onChange={e => setNewYear(e.target.value)}
                placeholder="연도 (예: 2026)" className="flex-1 px-4 py-3 border rounded-xl text-base" />
              <button type="button" onClick={handleAddYear}
                className="px-4 py-3 bg-primary-500 text-white rounded-xl font-semibold">추가</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddUnder({ type: 'year' })}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-primary-600 font-semibold flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> 연도 폴더 추가
            </button>
          )}
        </div>

        <div className="p-4 border-t shrink-0">
          <button type="button" onClick={onClose}
            className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl text-base">
            닫기
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h4 className="text-lg font-bold text-gray-900 mb-2">폴더를 삭제하시겠습니까?</h4>
            <p className="text-sm text-gray-500 mb-5">하위 폴더의 설교는 기타 폴더로 이동됩니다.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold">삭제</button>
              <button type="button" onClick={() => setConfirmDelete(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
