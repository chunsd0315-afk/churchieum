import { useEffect, useRef } from 'react';

type Options = {
  /** Debounce delay before save (default 800ms) */
  delayMs?: number;
  /** Skip auto-save when false */
  enabled?: boolean;
};

/**
 * Debounced auto-save for form fields and editors.
 * UI principle: 모든 입력은 자동 저장 지원.
 */
export function useAutoSave<T>(
  value: T,
  save: (value: T) => void | Promise<void>,
  { delayMs = 800, enabled = true }: Options = {},
) {
  const saveRef = useRef(save);
  const isFirst = useRef(true);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void saveRef.current(value);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [value, delayMs, enabled]);
}
