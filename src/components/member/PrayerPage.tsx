import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Heart, Plus, Check, Lock, Unlock, Globe, Users, Send, X, Loader } from 'lucide-react';
import { PageHeaderBar, TabBar } from '../ui';
import EmptyState from '../shared/EmptyState';

type Prayer = {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  is_answered: boolean;
  answered_date?: string;
  category?: string;
  created_at: string;
  member_id?: string;
};

type ChurchPrayer = {
  id: string;
  title: string;
  content: string;
  prayer_date: string;
  is_active: boolean;
};

const DEMO_MY: Prayer[] = [
  { id: '1', title: '가족의 건강', content: '어머니의 무릎 수술이 잘 회복되도록 기도합니다. 빠른 회복과 일상 복귀를 위해 기도드립니다.', is_private: true, is_answered: false, created_at: '2026-06-20' },
  { id: '2', title: '직장에서의 지혜', content: '새 프로젝트를 진행하는 데 있어 하나님의 지혜를 구합니다. 팀원들과의 협력이 잘 이루어지게 해주세요.', is_private: false, is_answered: false, created_at: '2026-06-18', category: 'intercession' },
  { id: '3', title: '믿음 성장', content: '말씀 묵상과 기도 생활이 더욱 깊어지도록 기도합니다. 주님과의 친밀함이 날마다 더해지게 하소서.', is_private: false, is_answered: true, created_at: '2026-06-10' },
];

const DEMO_CHURCH: ChurchPrayer[] = [
  { id: '1', title: '교회 부흥과 성장', content: '주님의 은혜로 교회가 날마다 부흥하게 하소서. 잃어버린 영혼들이 돌아오게 하시고, 성도들이 믿음 안에서 성장하게 하소서.', prayer_date: '2026-06-23', is_active: true },
  { id: '2', title: '다음 세대 양육', content: '청년부와 주일학교 학생들이 말씀과 기도로 성장하게 하소서. 다음 세대가 하나님의 나라를 이어가게 하소서.', prayer_date: '2026-06-23', is_active: true },
  { id: '3', title: '파송 선교사 재정 지원', content: '몽골에서 수고하는 이민준 선교사님 가정의 재정이 풍족하게 채워지게 하소서. 건강과 안전을 지켜주소서.', prayer_date: '2026-06-22', is_active: true },
  { id: '4', title: '동남아시아 단기선교', content: '7월에 파송하는 단기선교팀이 주님의 보호하심 가운데 복음을 전하고 돌아오게 하소서.', prayer_date: '2026-06-21', is_active: true },
];

type PrayerTab = 'my' | 'church' | 'intercession';

export default function PrayerPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [churchPrayers, setChurchPrayers] = useState<ChurchPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PrayerTab>('my');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isIntercession, setIsIntercession] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [prayRes, churchRes] = await Promise.all([
        supabase.from('prayers').select('*').order('created_at', { ascending: false }),
        supabase.from('church_prayers').select('*').eq('is_active', true).order('prayer_date', { ascending: false }),
      ]);
      setPrayers(prayRes.data && prayRes.data.length > 0 ? prayRes.data : DEMO_MY);
      setChurchPrayers(churchRes.data && churchRes.data.length > 0 ? churchRes.data : DEMO_CHURCH);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title,
      content,
      is_private: isPrivate,
      is_answered: false,
      category: isIntercession ? 'intercession' : 'personal',
    };
    try {
      const { data } = await supabase.from('prayers').insert(payload).select().single();
      const newPrayer: Prayer = data || { id: Date.now().toString(), ...payload, created_at: new Date().toISOString() };
      setPrayers([newPrayer, ...prayers]);
    } catch {
      setPrayers([{ id: Date.now().toString(), ...payload, created_at: new Date().toISOString().split('T')[0] }, ...prayers]);
    }
    setTitle(''); setContent(''); setIsPrivate(false); setIsIntercession(false);
    setShowForm(false);
    setSaving(false);
  };

  const handleAnswer = async (id: string) => {
    try {
      await supabase.from('prayers').update({ is_answered: true, answered_date: new Date().toISOString() }).eq('id', id);
    } catch { /* ignore */ }
    setPrayers(prayers.map(p => p.id === id ? { ...p, is_answered: true } : p));
  };

  const myPrayers = prayers.filter(p => !p.is_answered && p.category !== 'intercession');
  const answeredPrayers = prayers.filter(p => p.is_answered);
  const intercessionPrayers = prayers.filter(p => p.category === 'intercession' && !p.is_answered);

  if (loading) {
    return <div className="flex items-center justify-center h-48"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="pb-8">
      <PageHeaderBar
        title="기도"
        description="기도제목을 나누고 함께 기도하세요."
        action={
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" /> 기도제목
          </button>
        }
      />

      <TabBar
        tabs={[
          { id: 'my', label: '내 기도', icon: Heart, count: myPrayers.length || undefined },
          { id: 'church', label: '교회 기도', icon: Globe, count: churchPrayers.length || undefined },
          { id: 'intercession', label: '중보기도', icon: Users, count: intercessionPrayers.length || undefined },
        ]}
        activeTab={activeTab}
        onChange={id => setActiveTab(id as PrayerTab)}
      />

      <div className="space-y-3">
        {activeTab === 'my' && (
          <>
            {myPrayers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                    {p.is_private ? <Lock className="w-3.5 h-3.5 text-gray-400" /> : <Unlock className="w-3.5 h-3.5 text-gray-300" />}
                    {p.title}
                  </h3>
                  <button onClick={() => handleAnswer(p.id)}
                    className="p-1.5 hover:bg-secondary-100 rounded-lg text-secondary-500 flex-shrink-0 transition-colors"
                    title="응답받은 기도로 표시">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{p.content}</p>
                <p className="text-xs text-gray-400 mt-2">{p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''}</p>
              </div>
            ))}

            {answeredPrayers.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-secondary-400" /> 응답받은 기도 ({answeredPrayers.length})
                </p>
                {answeredPrayers.map(p => (
                  <div key={p.id} className="bg-secondary-50 rounded-2xl p-4 border border-secondary-100 mb-2 opacity-75">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-secondary-800 text-sm">{p.title}</h3>
                      <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> 응답
                      </span>
                    </div>
                    <p className="text-xs text-secondary-600 line-clamp-2">{p.content}</p>
                  </div>
                ))}
              </div>
            )}

            {myPrayers.length === 0 && answeredPrayers.length === 0 && (
              <EmptyState
                icon={Heart}
                title="기도제목을 등록해보세요"
                description="나의 기도제목을 기록하고 응답을 기다려요."
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-5 py-2 bg-primary-500 text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors"
                  >
                    기도제목 추가하기
                  </button>
                }
              />
            )}
          </>
        )}

        {activeTab === 'church' && (
          <>
            {churchPrayers.map(p => (
              <div key={p.id} className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4 border border-rose-200">
                <h3 className="font-semibold text-rose-900 mb-1.5 text-sm">{p.title}</h3>
                <p className="text-sm text-rose-700 leading-relaxed">{p.content}</p>
                <p className="text-[10px] text-rose-400 mt-2">
                  {new Date(p.prayer_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            ))}
            {churchPrayers.length === 0 && (
              <EmptyState icon={Globe} title="교회 기도제목이 없습니다" description="교회 기도제목이 등록되면 여기에 표시됩니다." />
            )}
          </>
        )}

        {activeTab === 'intercession' && (
          <>
            {intercessionPrayers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''}</p>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
                    <Send className="w-3.5 h-3.5" /> 기도하기
                  </button>
                </div>
              </div>
            ))}
            {intercessionPrayers.length === 0 && (
              <EmptyState
                icon={Users}
                title="중보기도 요청이 없습니다"
                description="기도제목 등록 시 중보요청을 선택하세요."
              />
            )}
          </>
        )}
      </div>

      {/* New Prayer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">새 기도제목</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="기도 제목" required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 text-sm" />
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="기도 내용을 입력하세요" required rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 text-sm resize-none" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="rounded accent-primary-500" />
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />} 비공개
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isIntercession} onChange={e => setIsIntercession(e.target.checked)} className="rounded accent-primary-500" />
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="w-4 h-4" /> 중보요청
                  </span>
                </label>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50">
                {saving ? '저장 중...' : '등록하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
