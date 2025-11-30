'use client';

export type TimeoutController<T> = {
  promise: Promise<T>;
  cancel: () => void;
};

export function createTimeoutController<T>(timeoutMs: number, errorMessage = 'Operation timed out'): TimeoutController<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let rejectRef: ((err: Error) => void) | null = null;

  const promise = new Promise<T>((_resolve, reject) => {
    rejectRef = reject;
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (rejectRef) {
      rejectRef(new Error('Operation cancelled'));
      rejectRef = null;
    }
  };

  return { promise, cancel };
}
