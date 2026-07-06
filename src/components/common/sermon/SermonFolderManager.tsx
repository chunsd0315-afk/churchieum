import { useState } from 'react';
import {
  X, ChevronDown, ChevronRight, Edit3, Trash2, Plus, Folder, FolderOpen, Calendar,
} from 'lucide-react';
import type { SermonFolder, WorshipType } from '../../../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../../../types/sermon';
import {
  addFolder, updateFolder, deleteFolder, reorderFolders,
  getYearFolders, getMonthFolders, getWorshipFolders,
} from '../../../services/sermonStorage';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import {
  SermonCard, sermonCardStyle, sermonInputClass, sermonPrimaryBtnClass, sermonSecondaryBtnClass,
} from './sermonDesign';

type Props = { onClose: () => void; onRefresh: () => void };

export default function SermonFolderManager({ onClose, onRefresh }: Props) {
  const { isMobile } = useBreakpoint();
  const [expandedYear, setExpandedYear] = useState<string | null>(getYearFolders()[0]?.id ?? null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newYear, setNewYear] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newWorship, setNewWorship] = useState<WorshipType>('sunday');
  const [addMode, setAddMode] = useState<'year' | 'month' | 'worship' | null>(null);

  const years = getYearFolders();
  const refresh = () => onRefresh();

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateFolder(id, { name: editName.trim() });
    setEditingId(null);
    refresh();
  };

  const moveFolder = (siblings: SermonFolder[], id: string, dir: -1 | 1) => {
    const idx = siblings.findIndex(f => f.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= siblings.length) return;
    const ids = siblings.map(f => f.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorderFolders(ids);
    refresh();
  };

  const treePanel = (
    <div className="space-y-2">
      {years.map(year => {
        const months = getMonthFolders(year.id);
        const open = expandedYear === year.id;
        return (
          <div key={year.id}>
            <button type="button" onClick={() => setExpandedYear(open ? null : year.id)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-[14px] text-left font-bold text-[15px] transition-colors ${
                open ? 'bg-primary-50 text-primary-800' : 'bg-[#F7F9FB] text-gray-800 hover:bg-gray-100'
              }`}>
              {open ? <FolderOpen className="w-5 h-5 shrink-0" /> : <Folder className="w-5 h-5 shrink-0" />}
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {year.name}
            </button>
            {open && (
              <div className="mt-1 ml-3 pl-3 border-l-2 border-[#E5E7EB] space-y-1">
                {months.map(month => {
                  const worships = getWorshipFolders(month.id);
                  const mOpen = expandedMonth === month.id;
                  return (
                    <div key={month.id}>
                      <button type="button" onClick={() => setExpandedMonth(mOpen ? null : month.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-left font-semibold text-sm text-gray-700 hover:bg-gray-50">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {mOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {month.name}
                      </button>
                      {mOpen && (
                        <div className="ml-4 space-y-1 mt-1">
                          {worships.map(w => (
                            <button key={w.id} type="button" onClick={() => setSelectedId(w.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors ${
                                selectedId === w.id ? 'bg-primary-100 text-primary-800' : 'text-gray-600 hover:bg-[#F7F9FB]'
                              }`}>
                              {w.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const managePanel = (
    <SermonCard className="p-5 md:p-6 h-full">
      <h4 className="text-base font-bold text-gray-900 mb-4">폴더 추가 · 관리</h4>
      <p className="text-sm text-[#6B7280] mb-5 leading-relaxed">연도 → 월 → 예배 순으로 폴더를 만듭니다.</p>

      {addMode === 'year' ? (
        <div className="flex gap-2 mb-4">
          <input value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="연도 (예: 2026)" className={sermonInputClass} />
          <button type="button" onClick={() => { const y = parseInt(newYear, 10); if (y >= 2000) { addFolder({ name: `${y}년`, type: 'year', year: y }); setNewYear(''); setAddMode(null); refresh(); } }}
            className={sermonPrimaryBtnClass}>추가</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAddMode('year')}
          className="w-full mb-4 flex items-center justify-center gap-2 min-h-[48px] border-2 border-dashed border-[#E5E7EB] rounded-[14px] text-primary-600 font-bold text-sm hover:bg-primary-50">
          <Plus className="w-5 h-5" /> 연도 폴더 추가
        </button>
      )}

      {expandedYear && addMode === 'month' && (
        <div className="flex gap-2 mb-4">
          <input value={newMonth} onChange={e => setNewMonth(e.target.value)} placeholder="월 (1-12)" className={sermonInputClass} />
          <button type="button" onClick={() => {
            const y = years.find(yr => yr.id === expandedYear);
            const m = parseInt(newMonth, 10);
            if (y && m >= 1 && m <= 12) { addFolder({ name: `${m}월`, type: 'month', parentId: y.id, year: y.year!, month: m }); setNewMonth(''); setAddMode(null); refresh(); }
          }} className={sermonPrimaryBtnClass}>추가</button>
        </div>
      )}

      {expandedMonth && addMode === 'worship' && (
        <div className="flex gap-2 mb-4">
          <select value={newWorship} onChange={e => setNewWorship(e.target.value as WorshipType)} className={sermonInputClass}>
            {(Object.keys(WORSHIP_TYPE_LABELS) as WorshipType[]).map(wt => (
              <option key={wt} value={wt}>{WORSHIP_TYPE_LABELS[wt]}</option>
            ))}
          </select>
          <button type="button" onClick={() => { addFolder({ name: WORSHIP_TYPE_LABELS[newWorship], type: 'worship', parentId: expandedMonth, worshipType: newWorship }); setAddMode(null); refresh(); }}
            className={sermonPrimaryBtnClass}>추가</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {expandedYear && <button type="button" onClick={() => setAddMode('month')} className={sermonSecondaryBtnClass + ' !h-11 !text-sm'}>+ 월</button>}
        {expandedMonth && <button type="button" onClick={() => setAddMode('worship')} className={sermonSecondaryBtnClass + ' !h-11 !text-sm'}>+ 예배</button>}
      </div>

      {selectedId && (() => {
        const f = [...years.flatMap(y => getMonthFolders(y.id).flatMap(m => getWorshipFolders(m.id)))].find(x => x.id === selectedId);
        if (!f) return null;
        const siblings = getWorshipFolders(f.parentId ?? '');
        return (
          <div className="border-t border-[#E5E7EB] pt-5 space-y-3">
            <p className="text-sm font-bold text-gray-800">선택: {f.name}</p>
            {editingId === f.id ? (
              <div className="flex gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} className={sermonInputClass} autoFocus />
                <button type="button" onClick={() => saveEdit(f.id)} className={sermonPrimaryBtnClass}>저장</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveFolder(siblings, f.id, -1)} className={sermonSecondaryBtnClass + ' !h-11 !px-4 !text-sm'}>▲ 위로</button>
                <button type="button" onClick={() => moveFolder(siblings, f.id, 1)} className={sermonSecondaryBtnClass + ' !h-11 !px-4 !text-sm'}>▼ 아래로</button>
                <button type="button" onClick={() => { setEditingId(f.id); setEditName(f.name); }} className={sermonSecondaryBtnClass + ' !h-11 !text-sm'}>
                  <Edit3 className="w-4 h-4" /> 이름 수정
                </button>
                {!f.isDefault && (
                  <button type="button" onClick={() => setConfirmDelete(f.id)}
                    className="inline-flex items-center gap-2 h-11 px-4 rounded-[14px] text-red-600 font-semibold text-sm border border-red-100 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /> 삭제
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <button type="button" onClick={onClose} className={`${sermonPrimaryBtnClass} w-full mt-8`}>저장하고 닫기</button>
    </SermonCard>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full sm:max-w-4xl max-h-[92vh] flex flex-col rounded-t-[24px] sm:rounded-[24px] overflow-hidden" style={{ ...sermonCardStyle }}>
        <div className="px-5 md:px-7 py-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
          <h3 className="text-xl font-extrabold text-gray-900">예배 폴더 관리</h3>
          <button type="button" onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-[14px]">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7F9FB]">
          {isMobile ? (
            <div className="space-y-5">
              <SermonCard className="p-4">{treePanel}</SermonCard>
              {managePanel}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
              <SermonCard className="p-5">{treePanel}</SermonCard>
              {managePanel}
            </div>
          )}
        </div>
      </div>
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-sm" style={sermonCardStyle}>
            <h4 className="text-lg font-bold text-gray-900 mb-2">폴더를 삭제하시겠습니까?</h4>
            <p className="text-sm text-[#6B7280] mb-5">해당 폴더의 설교는 기타로 이동됩니다.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { deleteFolder(confirmDelete); setConfirmDelete(null); setSelectedId(null); refresh(); }}
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
