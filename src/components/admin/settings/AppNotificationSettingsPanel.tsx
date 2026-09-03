import { useEffect, useState } from 'react';
import {
  getChurchAppSettings,
  updateChurchAppSettings,
  CHURCH_APP_SETTINGS_EVENT,
  type AppNotificationPrefs,
} from '../../../services/churchAppSettingsStorage';

const NOTIF_ITEMS: { key: keyof AppNotificationPrefs; label: string; description: string }[] = [
  { key: 'announcement', label: '공지사항 등록 알림', description: '새 공지가 등록될 때' },
  { key: 'schedule', label: '일정 등록 알림', description: '새 일정이 등록될 때' },
  { key: 'bulletin', label: '주보 등록 알림', description: '주보가 등록될 때' },
  { key: 'comment', label: '댓글 알림', description: '내 글에 댓글이 달릴 때' },
  { key: 'graceShare', label: '공유받은 은혜와 기도 알림', description: '은혜·기도가 공유될 때' },
];

export function AppNotificationSettingsPanel() {
  const [prefs, setPrefs] = useState<AppNotificationPrefs>(() => getChurchAppSettings().notifications);

  useEffect(() => {
    const sync = () => setPrefs(getChurchAppSettings().notifications);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-[900px]">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#1A1A1A]">알림 설정</h2>
        <p className="text-sm text-gray-500 mt-1">
          교회 공통 기본 알림 정책입니다. 실제 푸시 발송은 기기·브라우저 알림 권한과 연동 범위에 따릅니다.
        </p>
      </div>
      <div className="space-y-2">
        {NOTIF_ITEMS.map(item => (
          <div
            key={item.key}
            className="flex items-center gap-3 px-4 py-3.5 bg-white border border-[#ECECEC] rounded-[16px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1A1A]">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              onClick={() => {
                const next = { ...prefs, [item.key]: !prefs[item.key] };
                setPrefs(next);
                updateChurchAppSettings({ notifications: next });
              }}
              className={`shrink-0 w-12 h-7 rounded-full relative touch-target ${
                prefs[item.key] ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  prefs[item.key] ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
