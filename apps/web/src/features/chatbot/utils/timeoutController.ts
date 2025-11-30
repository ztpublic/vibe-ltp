'use client';

export type TimeoutController<T> = {
  promise: Promise<T>;
  cancel: () => void;
};

export function createTimeoutController<T>(timeoutMs: number, errorMessage = 'Operation timed out'): TimeoutController<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let rejectRef: ((err: Error) => void) | null = null;
  let settled = false;

  const promise = new Promise<T>((_resolve, reject) => {
    rejectRef = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    timer = setTimeout(() => {
      rejectRef?.(new Error(errorMessage));
    }, timeoutMs);
  });

  const cancel = () => {
    if (settled) {
      return;
    }

    settled = true;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // Clear rejectRef to prevent any late rejections
    rejectRef = null;
  };

  return { promise, cancel };
}
