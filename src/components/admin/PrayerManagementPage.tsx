import { useEffect, useState, useCallback } from 'react';
import {
  getAllPrayers,
  updatePrayer,
  markPrayerAnswered,
} from '../../lib/prayerStorage';
import type { Prayer } from '../../types/prayer';
import { VISIBILITY_LABELS, STATUS_LABELS, ATTACHMENT_TYPE_LABELS } from '../../types/prayer';
import { formatOrganizationScopeLines, resolvePrayerAccess } from '../../lib/prayerHelpers';
import { formatAttachmentSize } from '../../lib/prayerAttachmentHelpers';
import { getCommentCount } from '../../lib/prayerCommentStorage';
import { Heart, Lock, Check, Eye, Users, Star, MessageCircle } from 'lucide-react';
import { PageLayout, Badge } from '../ui';

const VISIBILITY_ICON = {
  private: Lock,
  pastor_shared: Eye,
  intercession: Users,
} as const;

export default function PrayerManagementPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setPrayers(getAllPrayers());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAnswer = (id: string, answered: boolean) => {
    if (answered) {
      markPrayerAnswered(id);
    } else {
      updatePrayer(id, { status: 'praying', answeredAt: undefined, answerContent: undefined });
    }
    refresh();
  };

  const praying = prayers.filter(p => p.status === 'praying');
  const answered = prayers.filter(p => p.status === 'answered');

  return (
    <PageLayout
      header={{ title: '기도', description: '기도제목을 나누고 함께 기도하세요.' }}
      loading={loading}
      skeletonCount={4}
      empty={{ icon: <Heart size={28} />, title: '기도제목이 없습니다' }}
    >
      {!loading && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Badge variant="gray">전체 {prayers.length}</Badge>
            <Badge variant="blue">{STATUS_LABELS.praying} {praying.length}</Badge>
            <Badge variant="green">{STATUS_LABELS.answered} {answered.length}</Badge>
          </div>

          <div className="flex flex-col gap-3">
            {prayers.map(prayer => {
              const VisIcon = VISIBILITY_ICON[prayer.visibility];
              const orgLines = formatOrganizationScopeLines(prayer.organizationScope);
              return (
                <div
                  key={prayer.id}
                  className={`bg-white border border-gray-200 rounded-card p-4 shadow-card-md ${
                    prayer.status === 'answered' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        {prayer.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                        <span className="truncate">{prayer.title}</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>
                          {prayer.authorName} · {prayer.authorRole === 'admin' ? '관리자' : prayer.authorRole === 'pastor' ? '목회자' : '성도'}
                        </span>
                        {getCommentCount(prayer.id) > 0 && (
                          <span className="flex items-center gap-0.5 text-primary-500">
                            <MessageCircle className="w-3 h-3" />
                            나눔 {getCommentCount(prayer.id)}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAnswer(prayer.id, prayer.status !== 'answered')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors shrink-0 ${
                        prayer.status === 'answered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                      }`}
                    >
                      {prayer.status === 'answered' && <Check size={14} />}
                      {prayer.status === 'answered' ? '응답됨' : '응답체크'}
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{prayer.content}</p>

                  {prayer.answerContent && (
                    <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-2">
                      응답: {prayer.answerContent}
                    </p>
                  )}

                  {prayer.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {prayer.attachments.map(att => (
                        <span
                          key={att.id}
                          className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {ATTACHMENT_TYPE_LABELS[att.type]} {att.name} ({formatAttachmentSize(att.size)})
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col items-end gap-0.5 text-xs text-gray-400">
                    <span>{prayer.createdAt.slice(0, 10)}</span>
                    <span className="flex items-center gap-1">
                      <VisIcon size={12} /> {VISIBILITY_LABELS[prayer.visibility]}
                    </span>
                    {orgLines.map(line => (
                      <span key={line} className="text-gray-400">{line}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PageLayout>
  );
}
