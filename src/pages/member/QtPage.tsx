import { useEffect, useState } from 'react';
import { supabase, Qt } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BookHeart, ChevronLeft, ChevronRight, Heart, Pencil, Archive, Check, Send } from 'lucide-react';

// Demo QT data so page works without Supabase data
const DEMO_QT_LIST: Qt[] = [
  {
    id: '1',
    title: '주께 가까이',
    bible_verse: '야고보서 4:8',
    content: '하나님을 가까이 하라 그리하면 너희를 가까이 하시리라 죄인들아 손을 깨끗이 하라 두 마음을 품은 자들아 마음을 성결하게 하라',
    meditation: '하나님과의 친밀함은 나의 적극적인 노력에서 시작됩니다. 먼저 나아가는 것, 그것이 오늘 저에게 주시는 말씀입니다.',
    prayer: '주님, 오늘 하루도 주님 가까이 머물게 하소서. 세상의 일들에 치여 주님과 멀어지지 않게 붙들어 주세요.',
    qt_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: '믿음의 방패',
    bible_verse: '에베소서 6:16',
    content: '모든 것 위에 믿음의 방패를 가지고 이로써 능히 악한 자의 모든 불화살을 소멸하고',
    meditation: '믿음은 방패입니다. 어떤 시험과 유혹이 와도 믿음으로 막아낼 수 있습니다.',
    prayer: '하나님, 오늘도 믿음의 방패를 굳게 들고 하루를 살아가게 도와주세요.',
    qt_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: '새 힘을 얻으리니',
    bible_verse: '이사야 40:31',
    content: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하겠고 걸어가도 피곤하지 아니하리로다',
    meditation: '지치고 힘들 때 여호와를 바라보면 새 힘을 얻습니다. 내 힘이 아닌 하나님의 힘으로 살아갑니다.',
    prayer: '주님, 오늘 하루 당신만을 바라보며 당신의 힘으로 살게 하소서.',
    qt_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export default function QtPage() {
  const { user } = useAuth();
  const [qtList, setQtList] = useState<Qt[]>(DEMO_QT_LIST);
  const [selectedQt, setSelectedQt] = useState<Qt | null>(DEMO_QT_LIST[0]);
  const [loading, _setLoading] = useState(false);
  const [today] = useState(new Date());
  const [showArchive, setShowArchive] = useState(false);
  const [myQtContent, setMyQtContent] = useState('');
  const [myPrayer, setMyPrayer] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchQt();
  }, []);

  const fetchQt = async () => {
    try {
      const { data } = await supabase
        .from('qt')
        .select('*')
        .order('qt_date', { ascending: false })
        .limit(30);
      if (data && data.length > 0) {
        setQtList(data);
        const todayStr = today.toISOString().split('T')[0];
        const todayQt = data.find(q => q.qt_date === todayStr);
        setSelectedQt(todayQt || data[0]);
      }
    } catch {
      // Keep demo data on error
    }
  };

  const prevDay = () => {
    const prev = new Date(selectedQt?.qt_date || today);
    prev.setDate(prev.getDate() - 1);
    const prevStr = prev.toISOString().split('T')[0];
    const found = qtList.find(q => q.qt_date === prevStr);
    if (found) setSelectedQt(found);
  };

  const nextDay = () => {
    const next = new Date(selectedQt?.qt_date || today);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split('T')[0];
    const found = qtList.find(q => q.qt_date === nextStr);
    if (found) setSelectedQt(found);
  };

  const handleSaveQtWrite = async () => {
    if (!selectedQt || saving || !myQtContent) return;
    setSaving(true);
    try {
      // Save to localStorage as demo
      const writings = JSON.parse(localStorage.getItem('qt_writings') || '[]');
      const newWriting = {
        qt_id: selectedQt.id,
        qt_date: selectedQt.qt_date,
        content: myQtContent,
        prayer: myPrayer,
        created_at: new Date().toISOString(),
      };
      const updated = [newWriting, ...writings.filter((w: typeof newWriting) => w.qt_id !== selectedQt.id)];
      localStorage.setItem('qt_writings', JSON.stringify(updated));

      // Also try to save to Supabase if user is logged in
      if (user) {
        void Promise.resolve(
          supabase.from('qt_writings').upsert({
            qt_id: selectedQt.id,
            content: myQtContent,
            prayer: myPrayer,
          })
        ).catch(() => null);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">오늘의 QT</h2>
          <p className="text-sm text-gray-500">말씀으로 하루를 시작하세요</p>
        </div>
        <button onClick={() => setShowArchive(!showArchive)} className={`p-3 rounded-xl transition-colors ${showArchive ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>
          <Archive className="w-5 h-5" />
        </button>
      </div>

      {/* Archive View */}
      {showArchive ? (
        <div className="church-list">
          {qtList.map(qt => (
            <button
              key={qt.id}
              onClick={() => { setSelectedQt(qt); setShowArchive(false); }}
              className={`church-list-row ${selectedQt?.id === qt.id ? 'bg-primary-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{qt.qt_date}</p>
                  <h4 className="font-semibold text-gray-900 mt-1">{qt.title}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{qt.bible_verse}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${selectedQt?.id === qt.id ? 'text-primary-500' : 'text-gray-300'}`} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="font-bold text-lg text-gray-900">
                {selectedQt ? new Date(selectedQt.qt_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }) : 'QT 없음'}
              </p>
            </div>
            <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-xl">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* QT Content */}
          {selectedQt ? (
            <div className="space-y-4">
              {/* Verse Card */}
              <div className="bg-gradient-to-br from-primary-500 to-accent-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BookHeart className="w-5 h-5" />
                  <span className="font-medium text-sm opacity-90">{selectedQt.bible_verse}</span>
                </div>
                <h2 className="text-2xl font-bold mb-4">{selectedQt.title}</h2>
                <p className="text-white/90 leading-relaxed">{selectedQt.content}</p>
              </div>

              {/* Meditation */}
              {selectedQt.meditation && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                    <Heart className="w-5 h-5 text-secondary-500" />
                    묵상
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedQt.meditation}</p>
                </div>
              )}

              {/* Prayer */}
              {selectedQt.prayer && (
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-5 border border-rose-200">
                  <h3 className="flex items-center gap-2 font-bold text-rose-900 mb-3">
                    <Send className="w-5 h-5 text-rose-500" />
                    기도
                  </h3>
                  <p className="text-rose-800 leading-relaxed whitespace-pre-wrap">{selectedQt.prayer}</p>
                </div>
              )}

              {/* My QT Writing */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                  <Pencil className="w-5 h-5 text-primary-500" />
                  나의 묵상
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">묵상 내용</label>
                    <textarea
                      value={myQtContent}
                      onChange={(e) => setMyQtContent(e.target.value)}
                      placeholder="말씀을 묵상하고 적용할 내용을 적어보세요..."
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-0 text-sm resize-none"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">기도</label>
                    <textarea
                      value={myPrayer}
                      onChange={(e) => setMyPrayer(e.target.value)}
                      placeholder="오늘의 기도 제목을 적어보세요..."
                      className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-0 text-sm resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleSaveQtWrite}
                    disabled={saving || !myQtContent}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : saved ? (
                      <>
                        <Check className="w-5 h-5" />
                        저장되었습니다!
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        저장하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <BookHeart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">해당 날짜의 QT가 없습니다</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
