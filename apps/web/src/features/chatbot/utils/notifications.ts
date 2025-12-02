'use client';

import { useCallback, useState, useEffect, useRef } from 'react';

export type Toast = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
};

export type ToastInput = Omit<Toast, 'id'>;

const TOAST_DURATION_MS = 3000; // 3 seconds

export function useToastQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const push = useCallback((toast: ToastInput) => {
    const id = `${toast.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-dismiss after 3 seconds
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutRefs.current.delete(id);
    }, TOAST_DURATION_MS);

    timeoutRefs.current.set(id, timeoutId);
  }, []);

  const remove = useCallback((id: string) => {
    // Clear timeout if toast is manually removed
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  return { toasts, push, remove };
}
