import { AlertTriangle } from 'lucide-react';

export type ChurchConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export function ChurchConfirmDialog({
  open,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  danger = false,
}: ChurchConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        {danger && (
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 text-center mb-2">{title}</h2>

        {/* Message */}
        {message && (
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">{message}</p>
        )}

        {!message && <div className="mb-6" />}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-[14px] border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={[
              'flex-1 h-12 rounded-[14px] text-sm font-bold text-white transition-colors',
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700',
            ].join(' ')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
