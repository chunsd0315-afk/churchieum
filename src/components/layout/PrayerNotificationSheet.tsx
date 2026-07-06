import { useEffect, useState } from 'react';
import { X, Bell, Check, Heart } from 'lucide-react';
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/prayerNotificationStorage';
import type { PrayerNotification } from '../../types/prayer';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_MESSAGES,
} from '../../services/prayerNotificationHelpers';
import { getPrayerById } from '../../services/prayerStorage';
import type { Page } from '../member/Layout';

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : d.toLocaleDateString('ko-KR');
}

type Props = {
  userId: string;
  onClose: () => void;
  onNavigate?: (page: Page) => void;
  onChanged?: () => void;
};

export default function PrayerNotificationSheet({
  userId,
  onClose,
  onNavigate,
  onChanged,
}: Props) {
  const [items, setItems] = useState<PrayerNotification[]>([]);

  const refresh = () => {
    setItems(getNotificationsForUser(userId));
    onChanged?.();
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  const handleSelect = (n: PrayerNotification) => {
    markNotificationRead(n.id);
    refresh();
    onNavigate?.('prayer');
    onClose();
  };

  const handleMarkAll = () => {
    markAllNotificationsRead(userId);
    refresh();
  };

  const unread = items.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[85vh] shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-bold text-gray-900">기도 알림</h3>
            {unread > 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length > 0 && unread > 0 && (
          <div className="px-5 py-2 border-b border-gray-50 shrink-0">
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              모두 읽음 처리
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">새 기도 알림이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {items.map(n => {
                const prayer = getPrayerById(n.prayerId);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(n)}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-colors ${
                        n.read
                          ? 'border-gray-100 bg-white hover:bg-gray-50'
                          : 'border-primary-100 bg-primary-50/80 hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          n.read ? 'bg-gray-100' : 'bg-primary-100'
                        }`}>
                          {n.read ? (
                            <Check className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Heart className="w-4 h-4 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary-700 mb-0.5">
                            {NOTIFICATION_TYPE_LABELS[n.type]}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {prayer?.title ?? '기도제목'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {NOTIFICATION_TYPE_MESSAGES[n.type]}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
