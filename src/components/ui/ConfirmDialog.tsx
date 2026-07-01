import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export type ConfirmVariant = 'danger' | 'warning' | 'default';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const iconClasses = variant === 'danger'
    ? 'bg-red-100 text-red-600'
    : variant === 'warning'
    ? 'bg-yellow-100 text-yellow-600'
    : 'bg-primary-100 text-primary-600';

  const btnVariant = variant === 'default' ? 'primary' : 'danger';

  const defaultConfirmLabel = variant === 'danger' ? '삭제' : '확인';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      hideClose
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={btnVariant} size="md" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? defaultConfirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconClasses}`}>
          {variant === 'danger'
            ? <Trash2 size={24} />
            : <AlertTriangle size={24} />
          }
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{title}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
