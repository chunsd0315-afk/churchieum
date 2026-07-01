/**
 * 교역자관리 — 목록 / 상세 / 기본정보 수정 / 담당 조직 / 사임 처리
 */
import { useState, useMemo } from 'react';
import {
  Users, UserPlus, Edit3, Trash2, X, ChevronRight,
  Phone, Mail, Building2, MapPin, Plus, Link, Search,
  UserMinus, Save, MapPinIcon,
} from 'lucide-react';
import {
  getAllClergy, getClergyById, updateClergy, deleteClergy,
  getAssignmentsForClergy, addAssignment, removeAssignment, getAssignmentSummary,
  POSITION_OPTIONS, POSITION_COLORS, positionLabel,
  type ClergyMember, type StaffAssignment,
} from '../../lib/clergyData';
import { getDistricts, getDepartments } from '../../lib/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { PageHeaderBar } from '../ui';

const INPUT = 'w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0 focus:outline-none';

// ─── Assignment Card ──────────────────────────────────────────────────────────

function AssignmentCard({ assignment, onDelete }: { assignment: StaffAssignment; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const { districtName, departmentName } = assignment;

  const icon = departmentName && !districtName
    ? <Building2 className="w-3.5 h-3.5 text-teal-600" />
    : <MapPin className="w-3.5 h-3.5 text-primary-600" />;

  const bgClass = departmentName && !districtName
    ? 'bg-teal-50 border-teal-100'
    : 'bg-primary-50 border-primary-100';

  return (
    <>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">담당 조직을 해제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-1">{getAssignmentSummary(assignment)}</p>
            <p className="text-xs text-gray-400 mb-5">해제 후에도 과거 작성한 공지·일정·앨범은 유지됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => { onDelete(); setConfirm(false); }} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold">해제</button>
              <button onClick={() => setConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold">취소</button>
            </div>
          </div>
        </div>
      )}
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${bgClass}`}>
        <span className="shrink-0">{icon}</span>
        <p className="text-sm font-semibold text-gray-800 flex-1 truncate">{getAssignmentSummary(assignment)}</p>
        <button onClick={() => setConfirm(true)} className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}

// ─── Add Assignment Modal (checkbox multi-select) ─────────────────────────────

function AddAssignmentModal({ pastorId, onAdd, onClose }: {
  pastorId: string;
  onAdd: () => void;
  onClose: () => void;
}) {
  const { l1, dept, settings } = useOrgSettings();
  const districts = getDistricts();
  const departments = getDepartments();
  const existing = getAssignmentsForClergy(pastorId);

  const assignedDistrictIds = new Set(existing.filter(a => a.districtId && !a.departmentId).map(a => a.districtId!));
  const assignedDeptIds = new Set(existing.filter(a => a.departmentId && !a.districtId).map(a => a.departmentId!));

  const [selectedDistricts, setSelectedDistricts] = useState<Set<string>>(new Set());
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());

  const totalSelected = selectedDistricts.size + selectedDepts.size;

  const toggleDistrict = (id: string) => {
    if (assignedDistrictIds.has(id)) return;
    setSelectedDistricts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDept = (id: string) => {
    if (assignedDeptIds.has(id)) return;
    setSelectedDepts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    selectedDistricts.forEach(id => {
      const d = districts.find(x => x.id === id);
      if (!d) return;
      addAssignment({ pastorId, districtId: id, districtName: d.name, assignmentType: 'district' });
    });
    selectedDepts.forEach(id => {
      const d = departments.find(x => x.id === id);
      if (!d) return;
      addAssignment({ pastorId, departmentId: id, departmentName: d.name, assignmentType: 'department' });
    });
    onAdd();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-900">담당 조직 추가</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {settings.level1Enabled && districts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{l1}</p>
              <div className="space-y-2">
                {districts.map(d => {
                  const isAssigned = assignedDistrictIds.has(d.id);
                  const isChecked = selectedDistricts.has(d.id);
                  return (
                    <button key={d.id} type="button" onClick={() => toggleDistrict(d.id)} disabled={isAssigned}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                        isAssigned ? 'border-gray-100 bg-gray-50 cursor-not-allowed' :
                        isChecked  ? 'border-primary-400 bg-primary-50' :
                                     'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isAssigned ? 'border-gray-200 bg-gray-100' :
                        isChecked  ? 'border-primary-500 bg-primary-500' :
                                     'border-gray-300'
                      }`}>
                        {isChecked && !isAssigned && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isAssigned ? 'text-gray-300' : isChecked ? 'text-primary-700' : 'text-gray-700'}`}>
                        {d.name}
                      </span>
                      {isAssigned && <span className="ml-auto text-[10px] text-gray-400 font-medium">이미 등록됨</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {settings.departmentEnabled && departments.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{dept}</p>
              <div className="space-y-2">
                {departments.map(d => {
                  const isAssigned = assignedDeptIds.has(d.id);
                  const isChecked = selectedDepts.has(d.id);
                  return (
                    <button key={d.id} type="button" onClick={() => toggleDept(d.id)} disabled={isAssigned}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                        isAssigned ? 'border-gray-100 bg-gray-50 cursor-not-allowed' :
                        isChecked  ? 'border-teal-400 bg-teal-50' :
                                     'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isAssigned ? 'border-gray-200 bg-gray-100' :
                        isChecked  ? 'border-teal-500 bg-teal-500' :
                                     'border-gray-300'
                      }`}>
                        {isChecked && !isAssigned && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isAssigned ? 'text-gray-300' : isChecked ? 'text-teal-700' : 'text-gray-700'}`}>
                        {d.name}
                      </span>
                      {isAssigned && <span className="ml-auto text-[10px] text-gray-400 font-medium">이미 등록됨</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 flex gap-2 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
          <button onClick={handleSave} disabled={totalSelected === 0}
            className={`flex-1 py-3.5 font-bold rounded-2xl text-sm ${totalSelected > 0 ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {totalSelected > 0 ? `${totalSelected}개 추가` : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resign Modal ─────────────────────────────────────────────────────────────

type ResignOption = 'admin-only' | 'assignments-only' | 'both' | 'deactivate';

function ResignModal({ clergy, onConfirm, onClose }: {
  clergy: ClergyMember; onConfirm: (o: ResignOption) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<ResignOption | null>(null);
  const options: { value: ResignOption; title: string; desc: string }[] = [
    { value: 'admin-only',       title: '관리자 권한만 해제',                 desc: '담당 조직은 유지하고 관리자 접근만 차단합니다.' },
    { value: 'assignments-only', title: '담당 조직만 해제',                   desc: '관리자 권한은 유지하고 담당 조직 배정을 해제합니다.' },
    { value: 'both',             title: '관리자 권한 + 담당 조직 모두 해제',  desc: '관리자 접근을 차단하고 담당 조직을 모두 해제합니다.' },
    { value: 'deactivate',       title: '계정 비활성화',                      desc: '관리자 접근을 차단합니다. 성도 모드는 유지됩니다.' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">사임/퇴임 처리</h3>
          <p className="text-sm text-gray-500 mt-0.5">{clergy.name} {positionLabel(clergy)}</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            사임/퇴임 처리해도 과거 작성한 공지, 일정, 앨범은 삭제되지 않습니다.
          </div>
          {options.map(opt => (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${selected === opt.value ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${selected === opt.value ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                {selected === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{opt.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
          <button onClick={() => selected && onConfirm(selected)} disabled={!selected}
            className={`flex-1 py-3.5 font-bold rounded-2xl text-sm ${selected ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            처리하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Basic Info Panel ────────────────────────────────────────────────────

function EditBasicInfoPanel({ clergy, onSave, onCancel }: {
  clergy: ClergyMember; onSave: (data: Partial<ClergyMember>) => void; onCancel: () => void;
}) {
  const [name, setName]       = useState(clergy.name);
  const [gender, setGender]   = useState<'남' | '여' | ''>(clergy.gender ?? '');
  const [phone, setPhone]     = useState(clergy.phone ?? '');
  const [email, setEmail]     = useState(clergy.email ?? '');
  const [address, setAddress] = useState(clergy.address ?? '');
  const [position, setPosition] = useState(clergy.position);
  const [custom, setCustom]   = useState(clergy.customPosition ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      gender: gender || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      position,
      customPosition: position === '기타' ? custom || undefined : undefined,
    });
  };

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">기본정보 수정</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">이름 *</label>
          <input value={name} onChange={e => setName(e.target.value)} className={INPUT} placeholder="이름" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">성별</label>
          <div className="flex gap-2">
            {(['남', '여'] as const).map(g => (
              <button key={g} type="button" onClick={() => setGender(prev => prev === g ? '' : g)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${gender === g ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">직분</label>
        <div className="grid grid-cols-4 gap-1.5">
          {POSITION_OPTIONS.map(pos => (
            <button key={pos} type="button" onClick={() => setPosition(pos)}
              className={`py-2 rounded-xl text-xs font-semibold transition-all border-2 ${position === pos ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
              {pos}
            </button>
          ))}
        </div>
        {position === '기타' && (
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="예: 선교사, 원로목사..."
            className={`${INPUT} mt-2`} />
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">연락처</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} placeholder="010-0000-0000" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">이메일</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="pastor@church.kr" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">주소</label>
        <input value={address} onChange={e => setAddress(e.target.value)} className={INPUT} placeholder="서울시 강남구..." />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">취소</button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 bg-primary-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> 저장
        </button>
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ clergyId, onBack, onRefresh }: {
  clergyId: string; onBack: () => void; onRefresh: () => void;
}) {
  const [clergy, setClergy] = useState(() => getClergyById(clergyId));
  const [assignments, setAssignments] = useState(() => getAssignmentsForClergy(clergyId));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResign, setShowResign] = useState(false);
  const [editBasic, setEditBasic] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const refreshLocal = () => {
    setClergy(getClergyById(clergyId));
    setAssignments(getAssignmentsForClergy(clergyId));
  };

  if (!clergy) return (
    <div className="text-center py-16">
      <p className="text-gray-400">교역자를 찾을 수 없습니다.</p>
      <button onClick={onBack} className="mt-3 text-primary-500 text-sm font-semibold">← 목록으로</button>
    </div>
  );

  const handleBasicSave = (data: Partial<ClergyMember>) => {
    updateClergy(clergy.id, data);
    refreshLocal();
    onRefresh();
    setEditBasic(false);
  };

  const handleResign = (option: ResignOption) => {
    if (option === 'admin-only' || option === 'both' || option === 'deactivate') updateClergy(clergy.id, { status: 'resigned' });
    if (option === 'assignments-only' || option === 'both') assignments.forEach(a => removeAssignment(a.id));
    refreshLocal(); onRefresh(); setShowResign(false);
  };

  const handleDeleteAssignment = (id: string) => {
    removeAssignment(id);
    setAssignments(getAssignmentsForClergy(clergyId));
  };

  return (
    <>
      {showAddModal && (
        <AddAssignmentModal pastorId={clergyId} onAdd={() => setAssignments(getAssignmentsForClergy(clergyId))} onClose={() => setShowAddModal(false)} />
      )}
      {showResign && <ResignModal clergy={clergy} onConfirm={handleResign} onClose={() => setShowResign(false)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">교역자를 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">모든 담당 조직 배정도 함께 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => { deleteClergy(clergyId); onRefresh(); onBack(); }} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold">삭제</button>
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back + resign buttons */}
        <div className="flex items-center justify-between px-1">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> 교역자 목록
          </button>
          <div className="flex items-center gap-2">
            {clergy.status !== 'resigned' && (
              <button onClick={() => setShowResign(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                <UserMinus className="w-3.5 h-3.5" /> 사임/퇴임 처리
              </button>
            )}
            <button onClick={() => setDeleteConfirm(true)}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 px-6 py-7 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-lg">
                {clergy.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{clergy.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${POSITION_COLORS[clergy.position] ?? 'bg-white/20 text-white'}`}>
                    {positionLabel(clergy)}
                  </span>
                  {clergy.gender && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">{clergy.gender}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {editBasic ? (
              <EditBasicInfoPanel clergy={clergy} onSave={handleBasicSave} onCancel={() => setEditBasic(false)} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow icon={<Phone className="w-4 h-4 text-primary-400" />} label="연락처" value={clergy.phone ?? '—'} />
                  <InfoRow icon={<Mail className="w-4 h-4 text-secondary-400" />} label="이메일" value={clergy.email ?? '—'} />
                </div>
                {clergy.address && (
                  <InfoRow icon={<MapPinIcon className="w-4 h-4 text-gray-400" />} label="주소" value={clergy.address} />
                )}
                <button onClick={() => setEditBasic(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-50 text-primary-700 rounded-2xl text-sm font-semibold hover:bg-primary-100 transition-colors">
                  <Edit3 className="w-4 h-4" /> 기본정보 수정
                </button>
              </>
            )}
          </div>
        </div>

        {/* Assignments section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-gray-900">담당 조직</h3>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">{assignments.length}</span>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-colors">
              <Plus className="w-3.5 h-3.5" /> 담당 조직 추가
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
              <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">담당 조직이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => (
                <AssignmentCard key={a.id} assignment={a} onDelete={() => handleDeleteAssignment(a.id)} />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            등록된 담당 조직 범위 내에서만 공지·일정·앨범을 작성하고 성도를 초대할 수 있습니다.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Clergy List Card ─────────────────────────────────────────────────────────

function ClergyCard({ clergy, assignments, onClick }: {
  clergy: ClergyMember; assignments: StaffAssignment[]; onClick: () => void;
}) {
  const pl = positionLabel(clergy);
  const posColor = POSITION_COLORS[clergy.position] ?? POSITION_COLORS['기타'];

  return (
    <button onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:border-primary-100 active:scale-[0.99] transition-all">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center flex-shrink-0 font-bold text-xl text-primary-700 shadow-sm">
        {clergy.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-gray-900 text-sm">{clergy.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${posColor}`}>{pl}</span>
          {clergy.gender && (
            <span className="text-[10px] text-gray-400">{clergy.gender}</span>
          )}
        </div>
        {assignments.length > 0 ? (
          <p className="text-xs text-gray-400 truncate">
            {assignments.slice(0, 2).map(a => getAssignmentSummary(a)).join(' · ')}
            {assignments.length > 2 && ` 외 ${assignments.length - 2}개`}
          </p>
        ) : (
          <p className="text-xs text-gray-300">담당 조직 없음</p>
        )}
        {clergy.phone && <p className="text-[10px] text-gray-400 mt-0.5">{clergy.phone}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Props = { onNavigate?: (page: string) => void; initialFilter?: string };

export default function ClergyManagementPage({ onNavigate, initialFilter }: Props) {
  const [list, setList] = useState<ClergyMember[]>(() => getAllClergy());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { l1, dept } = useOrgSettings();

  const refresh = () => setList(getAllClergy());

  const assignmentMap = useMemo(() => {
    const map: Record<string, StaffAssignment[]> = {};
    list.forEach(c => { map[c.id] = getAssignmentsForClergy(c.id); });
    return map;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter(c => {
      const assignments = assignmentMap[c.id] ?? [];
      if (initialFilter) {
        if (initialFilter.startsWith('district:')) {
          const distId = initialFilter.replace('district:', '');
          if (!assignments.some(a => a.districtId === distId)) return false;
        } else if (initialFilter.startsWith('zone:')) {
          const zoneId = initialFilter.replace('zone:', '');
          if (!assignments.some(a => a.zoneId === zoneId)) return false;
        } else if (initialFilter.startsWith('dept:')) {
          const deptId = initialFilter.replace('dept:', '');
          if (!assignments.some(a => a.departmentId === deptId)) return false;
        }
      }
      if (!search) return true;
      const q = search.toLowerCase();
      const pl = positionLabel(c).toLowerCase();
      const assignText = assignments.map(a => getAssignmentSummary(a)).join(' ').toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        pl.includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        assignText.includes(q)
      );
    });
  }, [list, search, assignmentMap, initialFilter]);

  const posStats = useMemo(() => [
    { label: '담임목사', count: list.filter(c => c.position === '담임목사').length },
    { label: '목사',     count: list.filter(c => c.position === '목사').length },
    { label: '전도사',   count: list.filter(c => ['전도사', '교육전도사'].includes(c.position)).length },
    { label: '전체',     count: list.length },
  ], [list]);

  if (detailId) {
    return (
      <div className="p-4 sm:p-6">
        <DetailView clergyId={detailId} onBack={() => { setDetailId(null); refresh(); }} onRefresh={refresh} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeaderBar
        title="교역자관리"
        description="교역자 정보와 담당 조직을 관리합니다."
      />

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <Link className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">교역자 등록은 <strong>초대관리</strong>에서만 가능합니다. 상단 "교역자 초대" 버튼을 이용하세요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5">
        {posStats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 text-center">
            <p className="text-2xl font-bold text-primary-600">{s.count}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          style={{ left: '16px', width: '18px', height: '18px' }}
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`이름, 직분, ${l1}, ${dept} 검색`}
          className="w-full bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
          style={{ height: '48px', borderRadius: '16px', paddingLeft: '46px', paddingRight: '16px' }}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-14">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium text-sm">교역자가 없습니다</p>
            {search && <p className="text-xs text-gray-300 mt-1">검색어를 바꿔보세요.</p>}
          </div>
        ) : filtered.map(c => (
          <ClergyCard key={c.id} clergy={c} assignments={assignmentMap[c.id] ?? []} onClick={() => setDetailId(c.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}
