import type { Prayer, PrayerNotificationType } from '../types/prayer';
import { migrateVisibility } from '../types/sharedContent';
import { getClergyById } from './clergyData';
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

function clergyEmailToUserId(email: string): string {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  return `demo-${local}`;
}

/** pastor_share — 명시적으로 선택된 교역자(clergy id) → user id */
function sharedPastorReceiverIds(prayer: Prayer): string[] {
  const ids = new Set<string>();
  for (const clergyId of prayer.sharedPastorIds ?? []) {
    const clergy = getClergyById(clergyId);
    if (!clergy?.email) continue;
    const userId = clergyEmailToUserId(clergy.email);
    if (userId !== prayer.authorId) ids.add(userId);
  }
  return [...ids];
}

/** 새 기도 등록 시 알림 발송 */
export function notifyPrayerCreated(prayer: Prayer): void {
  const visibility = migrateVisibility(prayer.visibility);
  if (visibility === 'private') return;

  let type: PrayerNotificationType | null = null;
  let receiverIds: string[] = [];

  if (visibility === 'pastor_share') {
    type = 'pastor_shared';
    const explicit = sharedPastorReceiverIds(prayer);
    receiverIds = explicit.length > 0 ? explicit : getAssignedClergyReceiverIds(prayer);
  } else if (visibility === 'organization_share') {
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
