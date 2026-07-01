import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getAllPrayers,
  getPrayerById,
  addPrayer,
  markPrayerAnswered,
  toAuthorRole,
  defaultOrganizationScope,
} from '../../lib/prayerStorage';
import type {
  Prayer,
  PrayerOrganizationScope,
  PrayerVisibility,
  PrayerAttachment,
} from '../../types/prayer';
import {
  CHURCH_WIDE_SCOPE,
  VISIBILITY_LABELS,
  VISIBILITY_DESCRIPTIONS,
  STATUS_LABELS,
  ATTACHMENT_TYPE_LABELS,
} from '../../types/prayer';
import {
  getMyActivePrayers,
  getMyAnsweredPrayers,
  getIntercessionPrayers,
  getPastorSharedInbox,
} from '../../lib/prayerHelpers';
import { useAuth } from '../../contexts/AuthContext';
import PrayerOrganizationScopePicker from '../shared/PrayerOrganizationScopePicker';
import PrayerAttachmentPicker from '../shared/PrayerAttachmentPicker';
import PrayerDetailSheet from '../shared/PrayerDetailSheet';
import { getCommentCount } from '../../lib/prayerCommentStorage';
import {
  Heart, Plus, Check, Lock, Users, Send, X, Loader,
  Globe, Eye, Star, Paperclip, MessageCircle,
} from 'lucide-react';
import { PageHeaderBar, TabBar } from '../ui';
import EmptyState from '../shared/EmptyState';

type ChurchPrayer = {
  id: string;
  title: string;
  content: string;
  prayer_date: string;
  is_active: boolean;
};

const DEMO_CHURCH: ChurchPrayer[] = [
  { id: '1', title: '교회 부흥과 성장', content: '주님의 은혜로 교회가 날마다 부흥하게 하소서. 잃어버린 영혼들이 돌아오게 하시고, 성도들이 믿음 안에서 성장하게 하소서.', prayer_date: '2026-06-23', is_active: true },
  { id: '2', title: '다음 세대 양육', content: '청년부와 주일학교 학생들이 말씀과 기도로 성장하게 하소서. 다음 세대가 하나님의 나라를 이어가게 하소서.', prayer_date: '2026-06-23', is_active: true },
  { id: '3', title: '파송 선교사 재정 지원', content: '몽골에서 수고하는 이민준 선교사님 가정의 재정이 풍족하게 채워지게 하소서. 건강과 안전을 지켜주소서.', prayer_date: '2026-06-22', is_active: true },
  { id: '4', title: '동남아시아 단기선교', content: '7월에 파송하는 단기선교팀이 주님의 보호하심 가운데 복음을 전하고 돌아오게 하소서.', prayer_date: '2026-06-21', is_active: true },
];

type PrayerTab = 'my' | 'church' | 'intercession';

const VISIBILITY_OPTIONS: { value: PrayerVisibility; icon: typeof Lock }[] = [
  { value: 'private', icon: Lock },
  { value: 'pastor_shared', icon: Eye },
  { value: 'intercession', icon: Users },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : d.toLocaleDateString('ko-KR');
}

export default function PrayerPage() {
  const { user, isPastor } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [churchPrayers, setChurchPrayers] = useState<ChurchPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PrayerTab>('my');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PrayerVisibility>('private');
  const [orgScope, setOrgScope] = useState<PrayerOrganizationScope>(CHURCH_WIDE_SCOPE);
  const [attachments, setAttachments] = useState<PrayerAttachment[]>([]);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [commentTick, setCommentTick] = useState(0);
  const [saving, setSaving] = useState(false);

  const openForm = () => {
    setOrgScope(user ? defaultOrganizationScope(user) : CHURCH_WIDE_SCOPE);
    setAttachments([]);
    setShowForm(true);
  };

  const closeForm = () => {
    attachments.forEach(a => {
      if (a.url.startsWith('blob:')) {
        try { URL.revokeObjectURL(a.url); } catch { /* ignore */ }
      }
    });
    setShowForm(false);
    setTitle('');
    setContent('');
    setVisibility('private');
    setOrgScope(CHURCH_WIDE_SCOPE);
    setAttachments([]);
  };

  const refreshPrayers = useCallback(() => {
    setPrayers(getAllPrayers());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const churchRes = await supabase
          .from('church_prayers')
          .select('*')
          .eq('is_active', true)
          .order('prayer_date', { ascending: false });
        setChurchPrayers(
          churchRes.data && churchRes.data.length > 0 ? churchRes.data : DEMO_CHURCH,
        );
      } catch {
        setChurchPrayers(DEMO_CHURCH);
      }
      refreshPrayers();
      setLoading(false);
    })();
  }, [refreshPrayers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      churchId: 'demo',
      authorId: user.id,
      authorName: user.name,
      authorRole: toAuthorRole(user.role),
      title,
      content,
      visibility,
      status: 'praying' as const,
      organizationScope: visibility === 'private' ? CHURCH_WIDE_SCOPE : orgScope,
      attachments,
    };

    try {
      await supabase.from('prayers').insert({
        title,
        content,
        is_private: visibility === 'private',
        is_answered: false,
        category: visibility === 'intercession' ? 'intercession' : 'personal',
      });
    } catch { /* demo fallback */ }

    addPrayer(payload);
    refreshPrayers();
    closeForm();
    setSaving(false);
  };

  const handleAnswer = (id: string) => {
    try {
      supabase.from('prayers').update({
        is_answered: true,
        answered_date: new Date().toISOString().split('T')[0],
      }).eq('id', id);
    } catch { /* ignore */ }
    markPrayerAnswered(id);
    refreshPrayers();
  };

  const myPrayers = getMyActivePrayers(prayers, user);
  const answeredPrayers = getMyAnsweredPrayers(prayers, user);
  const intercessionPrayers = getIntercessionPrayers(prayers, user);
  const pastorInbox = getPastorSharedInbox(prayers, user);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeaderBar
        title="기도"
        description="기도제목을 나누고 함께 기도하세요."
        action={
          <button
            onClick={openForm}
            className="flex items-center gap-1.5 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:bg-primary-600 transition-colors"
          >
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

      {isPastor && pastorInbox.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> 함께 나눈 기도 ({pastorInbox.length})
          </p>
          <div className="space-y-2">
            {pastorInbox.map(p => (
              <PrayerCard
                key={`inbox-${p.id}-${commentTick}`}
                prayer={p}
                commentCount={getCommentCount(p.id)}
                showAuthor
                onOpen={() => setSelectedPrayer(p)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {activeTab === 'my' && (
          <>
            {myPrayers.map(p => (
              <PrayerCard
                key={`${p.id}-${commentTick}`}
                prayer={p}
                commentCount={getCommentCount(p.id)}
                onAnswer={() => handleAnswer(p.id)}
                onOpen={() => setSelectedPrayer(p)}
                showAnswerBtn
              />
            ))}

            {answeredPrayers.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-secondary-400" />
                  {STATUS_LABELS.answered} ({answeredPrayers.length})
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
                    {p.answerContent && (
                      <p className="text-xs text-secondary-500 mt-1.5 italic">{p.answerContent}</p>
                    )}
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
                    onClick={openForm}
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
              <PrayerCard
                key={`${p.id}-${commentTick}`}
                prayer={p}
                commentCount={getCommentCount(p.id)}
                showAuthor
                onOpen={() => setSelectedPrayer(p)}
              />
            ))}
            {intercessionPrayers.length === 0 && (
              <EmptyState
                icon={Users}
                title="중보기도 요청이 없습니다"
                description="기도제목 등록 시 중보기도 요청을 선택하세요."
              />
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">새 기도제목</h3>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="기도 제목"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 text-sm"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="기도 내용을 입력하세요"
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 text-sm resize-none"
              />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">공개 범위</p>
                <div className="flex flex-col gap-2">
                  {VISIBILITY_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setVisibility(opt.value)}
                        className={`flex flex-col items-start gap-0.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left w-full ${
                          visibility === opt.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0" />
                          {VISIBILITY_LABELS[opt.value]}
                        </span>
                        <span className={`text-xs font-normal pl-6 ${
                          visibility === opt.value ? 'text-primary-600' : 'text-gray-400'
                        }`}>
                          {VISIBILITY_DESCRIPTIONS[opt.value]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {visibility !== 'private' && (
                <PrayerOrganizationScopePicker
                  value={orgScope}
                  onChange={setOrgScope}
                />
              )}
              <PrayerAttachmentPicker
                value={attachments}
                onChange={setAttachments}
              />
              <button
                type="submit"
                disabled={saving || !user}
                className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '등록하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedPrayer && (
        <PrayerDetailSheet
          prayer={selectedPrayer}
          user={user}
          onClose={() => setSelectedPrayer(null)}
          onCommentAdded={() => setCommentTick(t => t + 1)}
          onPrayerUpdated={() => {
            refreshPrayers();
            const updated = getPrayerById(selectedPrayer.id);
            if (updated) setSelectedPrayer(updated);
          }}
        />
      )}
    </div>
  );
}

function PrayerCard({
  prayer,
  onAnswer,
  onOpen,
  showAnswerBtn,
  showAuthor,
  commentCount = 0,
}: {
  prayer: Prayer;
  onAnswer?: () => void;
  onOpen?: () => void;
  showAnswerBtn?: boolean;
  showAuthor?: boolean;
  commentCount?: number;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${onOpen ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onOpen}
      onKeyDown={onOpen ? e => { if (e.key === 'Enter') onOpen(); } : undefined}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
          {prayer.visibility === 'private' && <Lock className="w-3.5 h-3.5 text-gray-400" />}
          {prayer.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
          {prayer.title}
        </h3>
        {showAnswerBtn && onAnswer && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAnswer(); }}
            className="p-1.5 hover:bg-secondary-100 rounded-lg text-secondary-500 flex-shrink-0 transition-colors"
            title="응답받은 기도로 표시"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{prayer.content}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{formatDate(prayer.createdAt)}</span>
          {showAuthor && <span>· {prayer.authorName}</span>}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-primary-500">
              <MessageCircle className="w-3 h-3" /> {commentCount}
            </span>
          )}
          {prayer.attachments.length > 0 && (
            <span className="flex items-center gap-0.5" title={
              prayer.attachments.map(a => ATTACHMENT_TYPE_LABELS[a.type]).join(', ')
            }>
              <Paperclip className="w-3 h-3" /> {prayer.attachments.length}
            </span>
          )}
        </div>
        {showAuthor && onOpen && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onOpen(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> 기도하기
          </button>
        )}
      </div>
    </div>
  );
}
