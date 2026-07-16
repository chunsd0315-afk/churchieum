import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  FileText, Calendar, Eye, Download, ExternalLink, ChevronRight,
  ChevronLeft, Archive, Loader, X, BookOpen,
} from 'lucide-react';
import { TabBar } from '../../components/common/ui';
import { FeatureHubPage, HubBackBar } from '../../components/common/feature-hub';
import { BULLETIN_HUB } from '../../config/featureHub/memberHubs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/ui';

type Bulletin = {
  id: string;
  title: string;
  description?: string;
  bulletin_date: string;
  pdf_url?: string;
  image_url?: string;
  view_count: number;
  is_archived: boolean;
};

const DEMO: Bulletin[] = [
  { id: '1', title: '2026년 6월 4주차 주보', description: '성령 강림 후 제5주 주일예배 주보', bulletin_date: '2026-06-22', view_count: 128, is_archived: false },
  { id: '2', title: '2026년 6월 3주차 주보', description: '성령 강림 후 제4주 주일예배 주보', bulletin_date: '2026-06-15', view_count: 98, is_archived: false },
  { id: '3', title: '2026년 6월 2주차 주보', description: '성령 강림 후 제3주 주일예배 주보', bulletin_date: '2026-06-08', view_count: 115, is_archived: false },
  { id: '4', title: '2026년 6월 1주차 주보', description: '성령 강림 후 제2주 주일예배 주보', bulletin_date: '2026-06-01', view_count: 143, is_archived: true },
  { id: '5', title: '2026년 5월 4주차 주보', description: '성령 강림 후 제1주 주일예배 주보', bulletin_date: '2026-05-25', view_count: 201, is_archived: true },
  { id: '6', title: '2026년 5월 3주차 주보', description: '부활절 후 제7주 주일예배 주보', bulletin_date: '2026-05-18', view_count: 187, is_archived: true },
  { id: '7', title: '2026년 5월 2주차 주보', description: '부활절 후 제6주 주일예배 주보', bulletin_date: '2026-05-11', view_count: 165, is_archived: true },
  { id: '8', title: '2026년 5월 1주차 주보', description: '부활절 후 제5주 주일예배 주보', bulletin_date: '2026-05-04', view_count: 212, is_archived: true },
];

export default function BulletinPage() {
  const { isPastor, isAdmin, user } = useAuth();
  const toast = useToast();
  const [hubView, setHubView] = useState(true);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Bulletin | null>(null);
  const [tab, setTab] = useState<'current' | 'archive'>('current');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('bulletin_date', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setBulletins(data);
      } else {
        setBulletins(DEMO);
      }
    } catch {
      setBulletins(DEMO);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (b: Bulletin) => {
    setSelected(b);
    try {
      await supabase.from('bulletins').update({ view_count: (b.view_count || 0) + 1 }).eq('id', b.id);
      setBulletins(prev => prev.map(x => x.id === b.id ? { ...x, view_count: (x.view_count || 0) + 1 } : x));
    } catch { /* ignore */ }
  };

  const current = bulletins.filter(b => !b.is_archived);
  const archived = bulletins.filter(b => b.is_archived);
  const latest = current[0];

  const archivedByMonth = archived.reduce<Record<string, Bulletin[]>>((acc, b) => {
    const key = (b.bulletin_date ?? '').slice(0, 7) || '0000-00';
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (hubView) {
    return (
      <FeatureHubPage
        title={BULLETIN_HUB.title}
        description={BULLETIN_HUB.description}
        features={BULLETIN_HUB.features}
        viewer={{ isPastor, isAdmin, role: user?.role }}
        onSelect={id => {
          if (id === 'create' || id === 'manage') {
            toast.info('관리자 모드의 주보 메뉴에서 등록·관리할 수 있습니다.');
            return;
          }
          if (id === 'archive') setTab('archive');
          else setTab('current');
          setHubView(false);
        }}
      />
    );
  }

  return (
    <div className="pb-8">
      <HubBackBar
        title="주보"
        description="예배 순서와 주간 소식을 확인하세요."
        onBack={() => setHubView(true)}
      />
      <TabBar
        tabs={[
          { id: 'current', label: '최신 주보' },
          { id: 'archive', label: '지난 주보', icon: Archive },
        ]}
        activeTab={tab}
        onChange={id => setTab(id as 'current' | 'archive')}
      />

      {tab === 'current' && (
        <div className="space-y-5">
          {latest && (
            <div
              onClick={() => handleView(latest)}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">이번 주 주보</span>
                <h3 className="text-xl font-bold mt-3 mb-1">{latest.title}</h3>
                {latest.description && <p className="text-sm opacity-80 mb-1">{latest.description}</p>}
                <p className="text-sm opacity-70 flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5" /> {latest.bulletin_date}
                  <Eye className="w-3.5 h-3.5" /> {latest.view_count}회
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <button className="flex items-center gap-1.5 bg-white text-primary-600 font-semibold px-4 py-2.5 rounded-xl text-sm">
                    <BookOpen className="w-4 h-4" /> 지금 보기
                  </button>
                  {latest.pdf_url && (
                    <a
                      href={latest.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {current.length > 1 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 mb-3">이번 달 주보</h3>
              <div className="church-list">
                {current.slice(1).map(b => (
                  <BulletinCard key={b.id} bulletin={b} onView={() => handleView(b)} />
                ))}
              </div>
            </div>
          )}

          {current.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl">
              <FileText className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">등록된 주보가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-5">
          {Object.keys(archivedByMonth).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <Archive className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">보관된 주보가 없습니다</p>
            </div>
          ) : (
            Object.entries(archivedByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, items]) => {
                const [yr = '?', mo = '0'] = month.split('-');
                return (
                  <div key={month}>
                    <h3 className="text-sm font-bold text-gray-500 mb-2.5">{yr}년 {parseInt(mo)}월</h3>
                    <div className="church-list">
                      {items.map(b => (
                        <BulletinCard key={b.id} bulletin={b} onView={() => handleView(b)} />
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[92vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
              <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-primary-500 font-medium text-sm">
                <ChevronLeft className="w-4 h-4" /> 목록으로
              </button>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center relative overflow-hidden">
                {selected.image_url ? (
                  <img src={selected.image_url} alt="주보 표지" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                      <FileText className="w-10 h-10 text-primary-500" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{selected.title}</h3>
                    <p className="text-gray-500 text-sm">{selected.bulletin_date}</p>
                    <p className="text-gray-400 text-xs mt-2">순복음성북교회</p>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4 pb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                  {selected.description && <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selected.bulletin_date}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{selected.view_count}회 조회</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 transition-colors">
                    <BookOpen className="w-4 h-4" /> 주보 보기
                  </button>
                  {selected.pdf_url ? (
                    <a
                      href={selected.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" /> PDF 다운로드
                    </a>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-400 rounded-2xl font-semibold cursor-not-allowed">
                      <Download className="w-4 h-4" /> PDF 없음
                    </button>
                  )}
                </div>

                {selected.pdf_url && (
                  <a
                    href={selected.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="flex-1">PDF 파일 새 탭에서 열기</span>
                    <ExternalLink className="w-4 h-4 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BulletinCard({ bulletin, onView }: { bulletin: Bulletin; onView: () => void }) {
  return (
    <button
      onClick={onView}
      className="church-list-row flex items-center gap-4"
    >
      <div className="w-14 h-16 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {bulletin.image_url ? (
          <img src={bulletin.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-7 h-7 text-primary-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm truncate">{bulletin.title}</h4>
        {bulletin.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{bulletin.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{bulletin.bulletin_date}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{bulletin.view_count}회</span>
          {bulletin.pdf_url && <span className="font-semibold text-red-400">PDF</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </button>
  );
}
