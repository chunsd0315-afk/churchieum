/**
 * 은혜와 기도 — 댓글 허용 설정 (작성·수정 공통)
 */

import { MessageCircle } from 'lucide-react';
import type { GraceNoteVisibility } from '../../data/graceNotes';

export type CommentPermissionSettingProps = {
  visibility: GraceNoteVisibility;
  allowComments: boolean;
  onChange: (next: boolean) => void;
};

export function CommentPermissionSetting({
  visibility,
  allowComments,
  onChange,
}: CommentPermissionSettingProps) {
  const isPrivate = visibility === 'private';
  const effectiveOn = !isPrivate && allowComments;

  const handleToggle = () => {
    if (isPrivate) return;
    onChange(!allowComments);
  };

  return (
    <div>
      <p className="text-sm font-bold text-gray-800 mb-1">댓글 설정</p>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        이 기록에 댓글을 작성할 수 있도록 허용합니다.
      </p>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPrivate}
        aria-label="댓글 허용"
        aria-checked={effectiveOn}
        aria-disabled={isPrivate}
        role="switch"
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors min-h-[52px] touch-target ${
          isPrivate
            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-90'
            : effectiveOn
              ? 'border-primary-200 bg-primary-50/60 hover:border-primary-300'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
            effectiveOn ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}
          aria-hidden
        >
          <MessageCircle className="w-5 h-5" />
        </span>

        <span className="flex-1 min-w-0">
          <span className={`block text-sm font-bold ${effectiveOn ? 'text-primary-700' : 'text-gray-800'}`}>
            댓글 허용
          </span>
          <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
            {isPrivate
              ? '나만 보기 기록에는 댓글을 사용할 수 없습니다.'
              : effectiveOn
                ? '댓글을 작성할 수 있습니다.'
                : '댓글 작성을 허용하지 않습니다.'}
          </span>
        </span>

        <span
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
            effectiveOn ? 'bg-primary-500' : 'bg-gray-300'
          }`}
          aria-hidden
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              effectiveOn ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
