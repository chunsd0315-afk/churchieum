import { useRef } from 'react';
import { Paperclip, X, FileText, Image, FileAudio, FileVideo, File } from 'lucide-react';
import type { PrayerAttachment, PrayerAttachmentType } from '../../types/prayer';
import { ATTACHMENT_TYPE_LABELS } from '../../types/prayer';
import { createPrayerAttachmentFromFile, formatAttachmentSize } from '../../services/prayerAttachmentHelpers';

const TYPE_ICON: Record<PrayerAttachmentType, typeof File> = {
  image: Image,
  pdf: FileText,
  document: FileText,
  audio: FileAudio,
  video: FileVideo,
};

const ACCEPT = 'image/*,application/pdf,.pdf,.doc,.docx,.hwp,.txt,.mp3,.wav,.m4a,.mp4,.mov,.webm';

type Props = {
  value: PrayerAttachment[];
  onChange: (attachments: PrayerAttachment[]) => void;
  disabled?: boolean;
  maxCount?: number;
};

export default function PrayerAttachmentPicker({
  value,
  onChange,
  disabled,
  maxCount = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return;
    const remaining = maxCount - value.length;
    if (remaining <= 0) return;

    const picked = Array.from(files).slice(0, remaining);
    const created = await Promise.all(picked.map(createPrayerAttachmentFromFile));
    onChange([...value, ...created]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id: string) => {
    const target = value.find(a => a.id === id);
    if (target?.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(target.url); } catch { /* ignore */ }
    }
    onChange(value.filter(a => a.id !== id));
  };

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500">첨부</p>
        <span className="text-[10px] text-gray-400">{value.length}/{maxCount}</span>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2 mb-3">
          {value.map(att => {
            const Icon = TYPE_ICON[att.type] ?? File;
            return (
              <li
                key={att.id}
                className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              >
                {att.type === 'image' ? (
                  <img src={att.url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {ATTACHMENT_TYPE_LABELS[att.type]} · {formatAttachmentSize(att.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(att.id)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 shrink-0"
                  aria-label="첨부 삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {value.length < maxCount && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={e => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            사진·문서·음성·영상 첨부
          </button>
        </>
      )}
    </div>
  );
}
