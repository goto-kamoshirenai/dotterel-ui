"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_COUNT_DURATION,
  DEFAULT_COUNT_EASING,
  countProgress,
  countValue,
  formatCount,
  type CountEasing,
  type CountEasingFunction,
  type CountFormat,
} from "../core/count.js";

export type DotCountStatus = "idle" | "counting" | "paused" | "completed";

export type DotCountMotion = "auto" | "always" | "none";

export type UseDotCountOptions = CountFormat & {
  readonly to: number;
  readonly from?: number | undefined;
  readonly duration?: number | undefined;
  readonly delay?: number | undefined;
  readonly easing?: CountEasing | CountEasingFunction | undefined;
  readonly autoStart?: boolean | undefined;
  readonly motion?: DotCountMotion | undefined;
  readonly onStart?: (() => void) | undefined;
  readonly onComplete?: (() => void) | undefined;
};

export type DotCountController = {
  readonly value: number;
  readonly text: string;
  readonly targetText: string;
  readonly status: DotCountStatus;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
};

type CountSettings = {
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly delay: number;
  readonly easing: CountEasing | CountEasingFunction;
  readonly motion: DotCountMotion;
  readonly onStart: (() => void) | undefined;
  readonly onComplete: (() => void) | undefined;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useDotCount(options: UseDotCountOptions): DotCountController {
  const {
    to,
    from = 0,
    duration = DEFAULT_COUNT_DURATION,
    delay = 0,
    easing = DEFAULT_COUNT_EASING,
    autoStart = true,
    motion = "auto",
    decimals,
    separator,
    decimal,
    prefix,
    suffix,
    onStart,
    onComplete,
  } = options;

  const [value, setValue] = useState(from);
  const [status, setStatus] = useState<DotCountStatus>("idle");
  const settingsRef = useRef<CountSettings>({
    from,
    to,
    duration,
    delay,
    easing,
    motion,
    onStart,
    onComplete,
  });
  const statusRef = useRef<DotCountStatus>("idle");
  const originRef = useRef(from);
  const targetRef = useRef(to);
  const elapsedRef = useRef(0);
  const frameRef = useRef(0);
  const timerRef = useRef(0);
  const previousTimeRef = useRef(0);

  useEffect(() => {
    settingsRef.current = {
      from,
      to,
      duration,
      delay,
      easing,
      motion,
      onStart,
      onComplete,
    };
    targetRef.current = to;
  }, [from, to, duration, delay, easing, motion, onStart, onComplete]);

  const applyStatus = useCallback((next: DotCountStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const cancel = useCallback(() => {
    if (frameRef.current !== 0) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }

    if (timerRef.current !== 0) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
    }

    previousTimeRef.current = 0;
  }, []);

  const settle = useCallback(() => {
    cancel();
    setValue(targetRef.current);
    applyStatus("completed");
    settingsRef.current.onComplete?.();
  }, [applyStatus, cancel]);

  const run = useCallback(() => {
    const { duration: span, motion: mode } = settingsRef.current;
    const instant =
      span <= 0 || mode === "none" || (mode === "auto" && prefersReducedMotion());

    if (instant) {
      settle();
      return;
    }

    const frame = (time: number) => {
      const { duration: length, easing: curve } = settingsRef.current;
      const delta = previousTimeRef.current === 0 ? 0 : time - previousTimeRef.current;
      previousTimeRef.current = time;
      elapsedRef.current += Math.max(0, delta);

      const progress = countProgress(elapsedRef.current, length);

      if (progress >= 1) {
        settle();
        return;
      }

      setValue(countValue(originRef.current, targetRef.current, progress, curve));
      frameRef.current = requestAnimationFrame(frame);
    };

    applyStatus("counting");
    previousTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(frame);
  }, [applyStatus, settle]);

  const startFrom = useCallback(
    (origin: number, target: number) => {
      cancel();
      originRef.current = origin;
      targetRef.current = target;
      elapsedRef.current = 0;
      setValue(origin);
      applyStatus("counting");
      settingsRef.current.onStart?.();

      const { delay: wait } = settingsRef.current;

      if (wait > 0) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = 0;
          run();
        }, wait);
        return;
      }

      run();
    },
    [applyStatus, cancel, run],
  );

  const start = useCallback(() => {
    startFrom(settingsRef.current.from, settingsRef.current.to);
  }, [startFrom]);

  const pause = useCallback(() => {
    if (statusRef.current !== "counting") {
      return;
    }

    cancel();
    applyStatus("paused");
  }, [applyStatus, cancel]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") {
      return;
    }

    run();
  }, [run]);

  const reset = useCallback(() => {
    cancel();
    originRef.current = settingsRef.current.from;
    elapsedRef.current = 0;
    setValue(settingsRef.current.from);
    applyStatus("idle");
  }, [applyStatus, cancel]);

  useEffect(() => {
    if (!autoStart) {
      return;
    }

    const handle = requestAnimationFrame(() => {
      startFrom(from, to);
    });

    return () => {
      cancelAnimationFrame(handle);
      cancel();
    };
  }, [autoStart, cancel, startFrom, from, to]);

  useEffect(() => cancel, [cancel]);

  const format = useMemo<CountFormat>(
    () => ({ decimals, separator, decimal, prefix, suffix }),
    [decimals, separator, decimal, prefix, suffix],
  );
  const text = useMemo(() => formatCount(value, format), [value, format]);
  const targetText = useMemo(() => formatCount(to, format), [to, format]);

  return { value, text, targetText, status, start, pause, resume, reset };
}
