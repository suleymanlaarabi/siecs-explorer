import { useEffect, useEffectEvent, useRef } from "react";

type UseIntervalOptions = {
  preventOverlap?: boolean;
  immediate?: boolean;
};

type AsyncIntervalCallback = (signal: AbortSignal) => void | Promise<void>;

export function useInterval(
  callback: AsyncIntervalCallback,
  delay: number | null,
  options: UseIntervalOptions = {},
): void {
  const { preventOverlap = true, immediate = false } = options;

  const runningRef = useRef(false);

  const run = useEffectEvent(async (signal: AbortSignal) => {
    if (preventOverlap && runningRef.current) return;

    runningRef.current = true;

    try {
      await callback(signal);
    } finally {
      runningRef.current = false;
    }
  });

  useEffect(() => {
    if (delay === null) return;

    const controller = new AbortController();

    if (immediate) {
      void run(controller.signal);
    }

    const id = window.setInterval(() => {
      void run(controller.signal);
    }, delay);

    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, [delay, immediate, preventOverlap]);
}
