import type { Prayer, PrayerNotificationType } from '../types/prayer';
import { addPrayerNotification } from './prayerNotificationStorage';
import { getAssignedClergyReceiverIds, getIntercessionTargetReceiverIds } from './prayerHelpers';

export const NOTIFICATION_TYPE_LABELS: Record<PrayerNotificationType, string> = {
  pastor_shared: '작성자 + 담당 교역자',
  intercession: '작성자 + 중보기도 대상자',
  answered: '기도 응답',
};

export const NOTIFICATION_TYPE_MESSAGES: Record<PrayerNotificationType, string> = {
  pastor_shared: '담당 교역자에게 나눔 기도제목이 등록되었습니다.',
  intercession: '함께 기도해 주세요. 중보기도 대상자에게 요청이 있습니다.',
  answered: '기도 응답이 등록되었습니다.',
};

/** 새 기도 등록 시 알림 발송 */
export function notifyPrayerCreated(prayer: Prayer): void {
  if (prayer.visibility === 'private') return;

  let type: PrayerNotificationType | null = null;
  let receiverIds: string[] = [];

  if (prayer.visibility === 'pastor_shared') {
    type = 'pastor_shared';
    receiverIds = getAssignedClergyReceiverIds(prayer);
  } else if (prayer.visibility === 'intercession') {
    type = 'intercession';
    receiverIds = getIntercessionTargetReceiverIds(prayer);
  }

  if (!type || receiverIds.length === 0) return;

  receiverIds.forEach(receiverId => {
    addPrayerNotification({ prayerId: prayer.id, receiverId, type: type! });
  });
}

/** 기도 응답 시 작성자에게 알림 */
export function notifyPrayerAnswered(prayer: Prayer): void {
  addPrayerNotification({
    prayerId: prayer.id,
    receiverId: prayer.authorId,
    type: 'answered',
  });
}
