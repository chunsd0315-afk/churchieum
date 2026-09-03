import { useEffect, useState } from 'react';
import {
  getChurchAppSettings,
  updateChurchAppSettings,
  CHURCH_APP_SETTINGS_EVENT,
  type AppFeatureFlags,
} from '../../../services/churchAppSettingsStorage';

type FeatureDef = {
  key: keyof AppFeatureFlags;
  label: string;
  description: string;
  /** 앱에 실제로 연결된 기능만 ON 가능. ready=false면 토글 비활성 */
  ready: boolean;
};

const FEATURES: FeatureDef[] = [
  { key: 'comments', label: '댓글', description: '은혜와 기도·공지 등 댓글 작성', ready: true },
  { key: 'reactions', label: '공감', description: '게시물에 공감 표시', ready: true },
  { key: 'announcementNotify', label: '공지 알림', description: '공지 등록 시 알림 정책', ready: true },
  { key: 'orgShare', label: '조직 공유', description: '조직 단위 은혜·기도 공유', ready: true },
  { key: 'albumComments', label: '앨범 댓글', description: '앨범에 댓글 남기기', ready: true },
  { key: 'bibleParallel', label: '성경 함께보기', description: '성경 본문 함께 보기', ready: true },
  {
    key: 'bibleWordStudy',
    label: '성경 단어 연구',
    description: '준비 중인 기능입니다. 아직 앱에 연결되지 않았습니다.',
    ready: false,
  },
];

function Toggle({
  on,
  disabled,
  onClick,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 w-12 h-7 rounded-full transition-colors relative touch-target disabled:opacity-40 ${
        on ? 'bg-primary-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          on ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function AppFeatureSettingsPanel() {
  const [features, setFeatures] = useState<AppFeatureFlags>(() => getChurchAppSettings().features);

  useEffect(() => {
    const sync = () => setFeatures(getChurchAppSettings().features);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-[900px]">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#1A1A1A]">기능 설정</h2>
        <p className="text-sm text-gray-500 mt-1">
          교회에서 사용할 부가기능을 설정합니다. 아직 구현되지 않은 기능은 켤 수 없습니다.
        </p>
      </div>
      <div className="space-y-2">
        {FEATURES.map(f => (
          <div
            key={f.key}
            className="flex items-center gap-3 px-4 py-3.5 bg-white border border-[#ECECEC] rounded-[16px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1A1A]">{f.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
            </div>
            <Toggle
              on={features[f.key]}
              disabled={!f.ready}
              onClick={() => {
                if (!f.ready) return;
                const next = { ...features, [f.key]: !features[f.key] };
                setFeatures(next);
                updateChurchAppSettings({ features: next });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
