import { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import type { Prayer, PrayerComment } from '../../types/prayer';
import {
  getCommentsForPrayer,
  addPrayerComment,
} from '../../services/prayerCommentStorage';
import { getHistoryForPrayer } from '../../services/prayerHistoryStorage';
import { resolvePrayerAccess, ACCESS_DENY_MESSAGES } from '../../services/prayerHelpers';
import { submitGratitudeTestimony } from '../../services/prayerStorage';
import PrayerJourney from './PrayerJourney';
import type { AppUser } from '../../services/permissions';

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : d.toLocaleDateString('ko-KR');
}

type Props = {
  prayer: Prayer;
  user: AppUser | null;
  onClose: () => void;
  onCommentAdded?: () => void;
  onPrayerUpdated?: () => void;
  /** 관리자 「관리 조회」 탭에서 연 경우 — 공유 대상과 무관하게 조회 허용 */
  auditMode?: boolean;
};

export default function PrayerDetailSheet({
  prayer,
  user,
  onClose,
  onCommentAdded,
  onPrayerUpdated,
  auditMode,
}: Props) {
  const [comments, setComments] = useState<PrayerComment[]>([]);
  const [history, setHistory] = useState(() => getHistoryForPrayer(prayer.id));
  const [draft, setDraft] = useState('');
  const [testimonyDraft, setTestimonyDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingTestimony, setSavingTestimony] = useState(false);

  const access = resolvePrayerAccess(prayer, user, { auditMode, canAuditPrivate: auditMode });
  const canView = access.canView;
  const canComment = access.canComment;
  const isAuthor = user?.id === prayer.authorId;
  const canWriteTestimony =
    isAuthor && prayer.status === 'answered' && !prayer.gratitudeTestimony;

  useEffect(() => {
    setComments(getCommentsForPrayer(prayer.id));
    setHistory(getHistoryForPrayer(prayer.id));
  }, [prayer.id, prayer.gratitudeTestimony]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user || !canComment) return;
    setSaving(true);
    addPrayerComment({
      prayerId: prayer.id,
      authorId: user.id,
      authorName: user.name,
      content: text,
    });
    setComments(getCommentsForPrayer(prayer.id));
    setDraft('');
    setSaving(false);
    onCommentAdded?.();
  };

  const handleTestimonySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = testimonyDraft.trim();
    if (!text || !user || !canWriteTestimony) return;
    setSavingTestimony(true);
    submitGratitudeTestimony(prayer.id, text, {
      actorId: user.id,
      actorName: user.name,
    });
    setHistory(getHistoryForPrayer(prayer.id));
    setTestimonyDraft('');
    setSavingTestimony(false);
    onPrayerUpdated?.();
  };

  if (!canView) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl p-6">
          <p className="text-sm text-gray-600 text-center">
            {access.denyReason ? ACCESS_DENY_MESSAGES[access.denyReason] : '이 기도제목을 볼 수 있는 권한이 없습니다.'}
          </p>
          <button onClick={onClose} className="mt-4 w-full py-3 bg-gray-100 rounded-xl text-sm font-semibold">
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{prayer.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">
              {prayer.authorName} · {formatDate(prayer.createdAt)}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{prayer.content}</p>
          </div>

          <PrayerJourney history={history} />

          {canWriteTestimony && (
            <form onSubmit={handleTestimonySubmit} className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">감사 간증 남기기</p>
              <textarea
                value={testimonyDraft}
                onChange={e => setTestimonyDraft(e.target.value)}
                placeholder="응답하신 은혜를 간단히 나눠 주세요"
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                disabled={!testimonyDraft.trim() || savingTestimony}
                className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                감사 간증 작성
              </button>
            </form>
          )}

          {/* 첨부 UI 숨김 — 기존 데이터는 유지 */}

          <div>
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-3">
              <MessageCircle className="w-3.5 h-3.5" />
              함께 나눔 ({comments.length})
            </p>
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                아직 나눔이 없습니다. 기도의 말씀을 남겨 보세요.
              </p>
            ) : (
              <ul className="space-y-3">
                {comments.map(c => (
                  <li key={c.id} className="bg-primary-50/60 rounded-xl px-3.5 py-3">
                    <p className="text-xs font-semibold text-primary-800 mb-1">{c.authorName}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{formatDate(c.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {canComment && (
          <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-gray-100 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="기도의 말씀을 남겨 주세요"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || saving}
                className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors shrink-0"
                aria-label="나눔 남기기"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
