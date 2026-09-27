import { useEffect, useRef } from "react";

export type DebouncedFn<T extends unknown[]> = {
  schedule: (...args: T) => void;
  flush: () => void;
  cancel: () => void;
};

export function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void,
  delayMs: number,
): DebouncedFn<T> {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const apiRef = useRef<DebouncedFn<T> | null>(null);

  if (!apiRef.current) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: T | null = null;

    const run = () => {
      if (lastArgs) fnRef.current(...lastArgs);
    };

    apiRef.current = {
      schedule: (...args: T) => {
        lastArgs = args;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          run();
        }, delayMs);
      },
      flush: () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        run();
      },
      cancel: () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
    };
  }

  useEffect(() => {
    return () => apiRef.current?.cancel();
  }, []);

  return apiRef.current;
}
