import React, {
  createContext, useContext, useState, useCallback, useRef, useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/* ── Types ───────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/* ── Context ─────────────────────────────────────────── */

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error:   (message: string, duration?: number) => void;
  info:    (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Single Toast ────────────────────────────────────── */

const toastConfig: Record<ToastType, { icon: React.ReactNode; classes: string }> = {
  success: { icon: <CheckCircle2 size={18} />, classes: 'bg-green-600 text-white' },
  error:   { icon: <AlertCircle  size={18} />, classes: 'bg-red-600 text-white' },
  info:    { icon: <Info         size={18} />, classes: 'bg-gray-800 text-white' },
  warning: { icon: <AlertTriangle size={18} />, classes: 'bg-yellow-500 text-white' },
};

function ToastComponent({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const cfg = toastConfig[item.type];
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 300);
    }, item.duration ?? 3500);
    return () => {
      clearTimeout(t);
      clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onRemove]);

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-overlay min-w-[240px] max-w-sm',
        'transition-[opacity,transform] duration-300',
        cfg.classes,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      role="alert"
    >
      <span className="shrink-0">{cfg.icon}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(() => onRemove(item.id), 300); }}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ── Provider ────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const ctx: ToastContextValue = {
    show,
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d),
    info:    (m, d) => show(m, 'info', d),
    warning: (m, d) => show(m, 'warning', d),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-toast flex flex-col items-center gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastComponent item={t} onRemove={remove} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

/* ── Hook ────────────────────────────────────────────── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
