import { useEffect, useState } from 'react';
import { supabase, Department, District, Member } from '../../services/supabase';
import { Building, Home, Users } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'department' | 'district'>('department');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, distRes, memberRes] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('districts').select('*').order('name'),
        supabase.from('members').select('*').eq('is_active', true),
      ]);

      if (deptRes.data) setDepartments(deptRes.data);
      if (distRes.data) setDistricts(distRes.data);
      if (memberRes.data) setMembers(memberRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getMemberCount = (type: 'department' | 'district', id: string) => {
    if (type === 'department') {
      return members.filter(m => m.department_id === id).length;
    }
    return members.filter(m => m.district_id === id).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B73FF]"></div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">부서/구역</h2>
        <p className="text-sm text-gray-500 mt-1">교회 부서와 구역 정보를 확인하세요</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('department')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'department'
              ? 'bg-[#2B73FF] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Building className="w-4 h-4 inline mr-1" />
          부서
        </button>
        <button
          onClick={() => setActiveTab('district')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'district'
              ? 'bg-[#00C6A7] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Home className="w-4 h-4 inline mr-1" />
          구역
        </button>
      </div>

      {/* Department List */}
      {activeTab === 'department' && (
        <div className="church-list">
          {departments.map(dept => (
            <div key={dept.id} className="church-list-row">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2B73FF]/10 flex items-center justify-center">
                    <Building className="w-6 h-6 text-[#2B73FF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{getMemberCount('department', dept.id)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* District List */}
      {activeTab === 'district' && (
        <div className="church-list">
          {districts.map(dist => (
            <div key={dist.id} className="church-list-row">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#00C6A7]/10 flex items-center justify-center">
                    <Home className="w-6 h-6 text-[#00C6A7]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{dist.name}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{getMemberCount('district', dist.id)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {(activeTab === 'department' && departments.length === 0) && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">등록된 부서가 없습니다.</p>
        </div>
      )}

      {(activeTab === 'district' && districts.length === 0) && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">등록된 구역이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
