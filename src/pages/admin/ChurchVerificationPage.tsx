import { useState, useEffect } from 'react';
import { supabase, Church } from '../../services/supabase';
import { Award, Check, X, Clock, Building, MapPin, Globe, Youtube, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function ChurchVerificationPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('churches').select('*').order('created_at', { ascending: false });
      setChurches(data || []);
    } catch (e) {
      console.error('Error fetching churches:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, approve: boolean) => {
    try {
      await supabase.from('churches').update({
        is_verified: approve,
        verification_status: approve ? 'approved' : 'rejected',
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      fetchChurches();
      setSelectedChurch(null);
    } catch (e) {
      console.error('Error updating church:', e);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-primary-500" />
          교회인증센터
        </h2>
        <p className="text-sm text-gray-500 mt-1">교회 인증 신청을 검토하고 승인합니다.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{churches.filter(c => c.verification_status === 'pending').length}</p>
          <p className="text-xs text-gray-500">대기중</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{churches.filter(c => c.is_verified).length}</p>
          <p className="text-xs text-gray-500">인증완료</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{churches.filter(c => c.verification_status === 'rejected').length}</p>
          <p className="text-xs text-gray-500">반려</p>
        </div>
      </div>

      {/* Church List */}
      <div className="church-list">
        {churches.map(church => (
          <button
            key={church.id}
            onClick={() => setSelectedChurch(church)}
            className="church-list-row text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  {church.is_verified && <span className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
                  {church.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{church.denomination}</p>
                <p className="text-xs text-gray-400 mt-1">{church.pastor_name} |</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[church.verification_status]}`}>
                {church.verification_status === 'pending' ? '대기' : church.is_verified ? '인증' : '반려'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {churches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Building className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">등록된 교회가 없습니다</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedChurch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-lg">인증 상세</h3>
              <button onClick={() => setSelectedChurch(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {selectedChurch.is_verified && (
                <div className="bg-primary-50 rounded-xl p-4 flex items-center gap-3">
                  <Award className="w-8 h-8 text-primary-500" />
                  <div>
                    <p className="text-primary-700 font-bold">인증 교회</p>
                    <p className="text-xs text-primary-600">교회찾기에 노출됩니다</p>
                  </div>
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-900">{selectedChurch.name}</h2>
              <p className="text-gray-600">{selectedChurch.denomination}</p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">담임목사</p>
                    <p className="text-gray-900">{selectedChurch.pastor_name}</p>
                  </div>
                </div>
                {selectedChurch.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">주소</p>
                      <p className="text-gray-900">{selectedChurch.address}</p>
                    </div>
                  </div>
                )}
                {selectedChurch.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">홈페이지</p>
                      <a href={selectedChurch.website_url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{selectedChurch.website_url}</a>
                    </div>
                  </div>
                )}
                {selectedChurch.youtube_url && (
                  <div className="flex items-start gap-3">
                    <Youtube className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">유튜브</p>
                      <a href={selectedChurch.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{selectedChurch.youtube_url}</a>
                    </div>
                  </div>
                )}
              </div>

              {selectedChurch.verification_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => handleVerify(selectedChurch.id, false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 transition-colors">
                    <X className="w-5 h-5" />
                    반려
                  </button>
                  <button onClick={() => handleVerify(selectedChurch.id, true)} className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-colors">
                    <Check className="w-5 h-5" />
                    승인
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
