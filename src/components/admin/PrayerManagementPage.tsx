import { useEffect, useState } from 'react';
import { supabase, Prayer } from '../../lib/supabase';
import { Heart, Lock, Check, Eye } from 'lucide-react';
import { PageLayout, Badge } from '../ui';

export default function PrayerManagementPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPrayers(); }, []);

  const fetchPrayers = async () => {
    const { data } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
    if (data) setPrayers(data);
    setLoading(false);
  };

  const handleAnswer = async (id: string, isAnswered: boolean) => {
    await supabase.from('prayers').update({ is_answered: isAnswered, answered_date: isAnswered ? new Date().toISOString().split('T')[0] : null }).eq('id', id);
    fetchPrayers();
  };

  return (
    <PageLayout
      header={{ title: '기도', description: '기도제목을 나누고 함께 기도하세요.' }}
      loading={loading}
      skeletonCount={4}
      empty={{ icon: <Heart size={28} />, title: '기도제목이 없습니다' }}
    >
      {!loading && (
        <>
          {/* Stats row */}
          <div className="flex gap-2 mb-4">
            <Badge variant="gray">전체 {prayers.length}</Badge>
            <Badge variant="green">응답 {prayers.filter(p => p.is_answered).length}</Badge>
            <Badge variant="blue">대기 {prayers.filter(p => !p.is_answered).length}</Badge>
          </div>

          <div className="flex flex-col gap-3">
            {prayers.map(prayer => (
              <div key={prayer.id} className={`bg-white border border-gray-200 rounded-card p-4 shadow-card-md ${prayer.is_answered ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    {prayer.is_private && <Lock size={14} className="text-gray-400" />}
                    {prayer.title}
                  </h4>
                  <button
                    onClick={() => handleAnswer(prayer.id, !prayer.is_answered)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                      prayer.is_answered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                    }`}
                  >
                    {prayer.is_answered && <Check size={14} />}
                    {prayer.is_answered ? '응답됨' : '응답체크'}
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{prayer.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{prayer.created_at.slice(0, 10)}</span>
                  {prayer.is_private && <span className="flex items-center gap-1"><Eye size={12} /> 비공개</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  );
}
