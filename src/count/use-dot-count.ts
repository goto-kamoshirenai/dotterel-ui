"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_COUNT_DURATION,
  DEFAULT_COUNT_EASING,
  formatCount,
  type CountFormat,
} from "../core/count.js";
import {
  createCountRunner,
  type DotCountOptions,
  type DotCountStatus,
} from "../internal/count-runner.js";

export type { DotCountMotion, DotCountStatus } from "../internal/count-runner.js";

export type UseDotCountOptions = DotCountOptions;

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
  // 進行は React に依存しない進行役 (DOM 版の mountDotCount と共通) に任せる。
  // 値と状態の通知を state へつなぐだけにし、作るのは最初の1回だけ
  const [runner] = useState(() =>
    createCountRunner(
      { from, to, duration, delay, easing, motion, onStart, onComplete },
      { onValue: setValue, onStatus: setStatus },
    ),
  );

  useEffect(() => {
    runner.update({ from, to, duration, delay, easing, motion, onStart, onComplete });
  }, [runner, from, to, duration, delay, easing, motion, onStart, onComplete]);

  useEffect(() => {
    if (!autoStart) {
      return;
    }

    const handle = requestAnimationFrame(() => {
      runner.startFrom(from, to);
    });

    return () => {
      cancelAnimationFrame(handle);
      runner.cancel();
    };
  }, [autoStart, runner, from, to]);

  useEffect(() => runner.cancel, [runner]);

  const format = useMemo<CountFormat>(
    () => ({ decimals, separator, decimal, prefix, suffix }),
    [decimals, separator, decimal, prefix, suffix],
  );
  const text = useMemo(() => formatCount(value, format), [value, format]);
  const targetText = useMemo(() => formatCount(to, format), [to, format]);

  return {
    value,
    text,
    targetText,
    status,
    start: runner.start,
    pause: runner.pause,
    resume: runner.resume,
    reset: runner.reset,
  };
}
