'use client';

import { useCallback, useState } from 'react';

export type Toast = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
};

export type ToastInput = Omit<Toast, 'id'>;

export function useToastQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: ToastInput) => {
    const id = `${toast.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, remove };
}
