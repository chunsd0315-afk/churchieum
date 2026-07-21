import { useState, useEffect } from 'react';
import { ChevronLeft, Save, User, Building2, ChevronDown, Check } from 'lucide-react';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import type { RichMember } from './MemberListTab';
import { updateDemoMember } from '../../services/demoData';
import { getAllDistricts, getAllZones, getAllDepartments, getDistrictNameById, getZoneNameById, getDepartmentNamesByIds } from '../../services/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';

const POSITION_OPTIONS = ['장로', '안수집사', '권사', '서리집사', '성도', '기타'] as const;

type FormState = {
  name: string;
  gender: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  joinDate: string;
  baptismDate: string;
  position: string;
  customPosition: string;
  districtId: string;
  zoneId: string;
  departmentIds: string[];
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-500 mb-1.5">{children}</label>;
}

function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-0 transition-colors"
    />
  );
}

export default function MemberDetailSheet({
  member,
  onClose,
}: {
  member: RichMember;
  onClose: () => void;
  onEdit?: (m: RichMember) => void;
}) {
  const { l1, l2, dept, settings } = useOrgSettings();
  const districts = getAllDistricts().filter(d => d.is_active);
  const allZones = getAllZones().filter(z => z.is_active);
  const departments = getAllDepartments().filter(d => d.is_active);

  const initialDeptIds = member.departmentIds && member.departmentIds.length > 0
    ? member.departmentIds
    : (member.department_id ? [member.department_id] : []);

  const initialPosition = POSITION_OPTIONS.includes(member.position as typeof POSITION_OPTIONS[number])
    ? (member.position ?? '성도')
    : (member.position ? '기타' : '성도');
  const initialCustomPosition = POSITION_OPTIONS.includes(member.position as typeof POSITION_OPTIONS[number])
    ? ''
    : (member.position ?? '');

  const [form, setForm] = useState<FormState>({
    name: member.name ?? '',
    gender: member.gender ?? '',
    birthDate: member.birth_date ?? '',
    phone: member.phone ?? '',
    email: member.email ?? '',
    address: member.address ?? '',
    joinDate: member.join_date ?? '',
    baptismDate: member.baptism_date ?? '',
    position: initialPosition,
    customPosition: initialCustomPosition,
    districtId: member.district_id ?? member.district ?? '',
    zoneId: member.area ?? '',
    departmentIds: initialDeptIds,
  });

  const [saved, setSaved] = useState(false);

  const f = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm(p => ({ ...p, [k]: v }));

  const zonesForDistrict = form.districtId
    ? allZones.filter(z => z.district_id === form.districtId)
    : allZones;

  useEffect(() => {
    if (form.zoneId && !zonesForDistrict.some(z => z.id === form.zoneId)) {
      setForm(p => ({ ...p, zoneId: '' }));
    }
  }, [form.districtId]);

  const toggleDept = (id: string) => {
    setForm(p => ({
      ...p,
      departmentIds: p.departmentIds.includes(id)
        ? p.departmentIds.filter(d => d !== id)
        : [...p.departmentIds, id],
    }));
  };

  const handleSave = () => {
    const effectivePosition = form.position === '기타' ? (form.customPosition || '기타') : form.position;
    const district = districts.find(d => d.id === form.districtId);
    const zone = allZones.find(z => z.id === form.zoneId);
    const primaryDept = departments.find(d => d.id === form.departmentIds[0]);

    updateDemoMember(member.id, {
      name: form.name.trim() || member.name,
      phone: form.phone,
      email: form.email,
      gender: form.gender as 'male' | 'female',
      birthDate: form.birthDate,
      position: effectivePosition,
      districtId: form.districtId,
      districtName: district?.name ?? '',
      zoneId: form.zoneId,
      zoneName: zone?.name ?? '',
      deptId: form.departmentIds[0] ?? '',
      deptName: primaryDept?.name ?? '',
      departmentIds: form.departmentIds,
      address: form.address,
      baptismDate: form.baptismDate,
      joinDate: form.joinDate,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayDistrict = form.districtId ? getDistrictNameById(form.districtId) : '';
  const displayZone = form.zoneId ? getZoneNameById(form.zoneId) : '';
  const displayDepts = getDepartmentNamesByIds(form.departmentIds);

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            목록으로 돌아가기
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              saved ? 'bg-secondary-500 text-white' : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? '저장됨' : '저장'}
          </button>
        </div>

        {/* Member heading */}
        <div className="flex items-center gap-4 mb-6">
          <UserProfileAvatar
            user={{ id: member.id, name: form.name || member.name, role: 'member' }}
            size={56}
            rounded="2xl"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{form.name || member.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {form.position === '기타' ? (form.customPosition || '기타') : form.position}
              {form.gender === 'male' ? ' · 남성' : form.gender === 'female' ? ' · 여성' : ''}
            </p>
          </div>
        </div>

        {/* 2-card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Card 1: 기본정보 ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary-500" />
              <h2 className="font-bold text-gray-900">기본정보</h2>
            </div>

            <div>
              <FieldLabel>이름</FieldLabel>
              <FieldInput value={form.name} onChange={v => f('name', v)} placeholder="홍길동" />
            </div>

            <div>
              <FieldLabel>성별</FieldLabel>
              <div className="flex gap-2">
                {[{ v: 'male', label: '남성' }, { v: 'female', label: '여성' }].map(opt => (
                  <button key={opt.v} type="button" onClick={() => f('gender', opt.v)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.gender === opt.v
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>직분</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {POSITION_OPTIONS.map(pos => (
                  <button key={pos} type="button" onClick={() => f('position', pos)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      form.position === pos
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}>
                    {pos}
                  </button>
                ))}
              </div>
              {form.position === '기타' && (
                <div className="mt-2">
                  <FieldInput value={form.customPosition} onChange={v => f('customPosition', v)} placeholder="예: 집사, 권찰..." />
                </div>
              )}
            </div>

            <div>
              <FieldLabel>생년월일</FieldLabel>
              <FieldInput value={form.birthDate} onChange={v => f('birthDate', v)} type="date" />
            </div>

            <div>
              <FieldLabel>휴대폰</FieldLabel>
              <FieldInput value={form.phone} onChange={v => f('phone', v)} placeholder="010-0000-0000" type="tel" />
            </div>

            <div>
              <FieldLabel>이메일</FieldLabel>
              <FieldInput value={form.email} onChange={v => f('email', v)} placeholder="email@example.com" type="email" />
            </div>

            <div>
              <FieldLabel>주소</FieldLabel>
              <FieldInput value={form.address} onChange={v => f('address', v)} placeholder="서울시..." />
            </div>

            <div>
              <FieldLabel>등록일</FieldLabel>
              <FieldInput value={form.joinDate} onChange={v => f('joinDate', v)} type="date" />
            </div>

            <div>
              <FieldLabel>세례일</FieldLabel>
              <FieldInput value={form.baptismDate} onChange={v => f('baptismDate', v)} type="date" />
            </div>
          </div>

          {/* ── Card 2: 소속 ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary-500" />
              <h2 className="font-bold text-gray-900">소속</h2>
            </div>

            {/* 소속교회 — read-only */}
            <div>
              <FieldLabel>소속교회</FieldLabel>
              <div className="px-3.5 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 font-medium select-none">
                순복음성북교회
              </div>
            </div>

            {/* 교구 */}
            {settings.level1Enabled && (
              <div>
                <FieldLabel>{l1}</FieldLabel>
                <div className="relative">
                  <select
                    value={form.districtId}
                    onChange={e => f('districtId', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none appearance-none"
                  >
                    <option value="">{l1} 선택</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* 구역 — cascades from district */}
            {settings.level2Enabled && (
              <div>
                <FieldLabel>{l2}</FieldLabel>
                <div className="relative">
                  <select
                    value={form.zoneId}
                    onChange={e => f('zoneId', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none appearance-none"
                  >
                    <option value="">{l2} 선택</option>
                    {zonesForDistrict.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {form.districtId === '' && (
                  <p className="text-[10px] text-gray-400 mt-1">{l1}를 먼저 선택하면 해당 {l2}만 표시됩니다.</p>
                )}
              </div>
            )}

            {/* 부서 — 다중 선택 */}
            {settings.departmentEnabled && (
              <div>
                <FieldLabel>{dept} (복수 선택 가능)</FieldLabel>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {departments.map(d => {
                    const checked = form.departmentIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDept(d.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-sm transition-all text-left ${
                          checked
                            ? 'border-primary-400 bg-primary-50 text-primary-800'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                          checked ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white'
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium">{d.name}</span>
                      </button>
                    );
                  })}
                </div>
                {form.departmentIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {getDepartmentNamesByIds(form.departmentIds).map(n => (
                      <span key={n} className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold">{n}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {(displayDistrict || displayZone || displayDepts.length > 0) && (
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-primary-600 mb-2">현재 소속</p>
                <div className="space-y-1.5">
                  {displayDistrict && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{l1}</span>
                      <span className="text-xs font-semibold text-gray-800">{displayDistrict}</span>
                    </div>
                  )}
                  {displayZone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{l2}</span>
                      <span className="text-xs font-semibold text-gray-800">{displayZone}</span>
                    </div>
                  )}
                  {displayDepts.length > 0 && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">{dept}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {displayDepts.map(n => (
                          <span key={n} className="text-xs font-semibold text-gray-800">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom save */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
              saved ? 'bg-secondary-500 text-white' : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? '저장됨' : '변경 사항 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
