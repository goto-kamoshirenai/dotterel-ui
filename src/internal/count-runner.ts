/**
 * カウントの進行 (遅延、フレーム送り、一時停止、完了) を受け持つ部分。React に依存しない。
 *
 * `useDotCount` (React) と `mountDotCount` (dotterel-ui/dom) の両方がここを使う。
 * 値と状態は `onValue` と `onStatus` で知らせ、表示は呼び出し側が持つ。
 */
import {
  DEFAULT_COUNT_DURATION,
  DEFAULT_COUNT_EASING,
  countProgress,
  countValue,
  type CountEasing,
  type CountEasingFunction,
  type CountFormat,
} from "../core/count.js";

export type DotCountStatus = "idle" | "counting" | "paused" | "completed";

export type DotCountMotion = "auto" | "always" | "none";

export type DotCountOptions = CountFormat & {
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

/** 進行に使う設定。既定値を埋めたもの */
export type CountSettings = {
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly delay: number;
  readonly easing: CountEasing | CountEasingFunction;
  readonly motion: DotCountMotion;
  readonly onStart: (() => void) | undefined;
  readonly onComplete: (() => void) | undefined;
};

export type CountRunnerCallbacks = {
  /** 表示する値が変わったとき */
  readonly onValue: (value: number) => void;
  /** 状態が変わったとき */
  readonly onStatus: (status: DotCountStatus) => void;
};

export type CountRunner = {
  /** 設定を差し替える。目標値も新しい `to` へ移す (進行中のカウントはそこへ向かう) */
  readonly update: (settings: CountSettings) => void;
  /** `from` から `to` へ数え始める */
  readonly start: () => void;
  /** 起点と目標を指定して数え始める */
  readonly startFrom: (origin: number, target: number) => void;
  readonly pause: () => void;
  readonly resume: () => void;
  /** 止めて `from` へ戻す */
  readonly reset: () => void;
  /** 予約したフレームと遅延を取り消す。状態は変えない */
  readonly cancel: () => void;
  readonly status: () => DotCountStatus;
};

/** オプションへ既定値を埋める */
export function resolveCountSettings(options: DotCountOptions): CountSettings {
  return {
    from: options.from ?? 0,
    to: options.to,
    duration: options.duration ?? DEFAULT_COUNT_DURATION,
    delay: options.delay ?? 0,
    easing: options.easing ?? DEFAULT_COUNT_EASING,
    motion: options.motion ?? "auto",
    onStart: options.onStart,
    onComplete: options.onComplete,
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * カウントの進行役を作る。
 *
 * 経過時間はフレームごとの差分を足して数える。一時停止のあいだは足さないので、
 * 再開すると止めた位置から続く。`motion` が `none` のとき、`auto` で
 * 動きを減らす設定のとき、`duration` が 0 以下のときは、すぐに目標値へ置く。
 */
export function createCountRunner(
  initial: CountSettings,
  { onValue, onStatus }: CountRunnerCallbacks,
): CountRunner {
  let settings = initial;
  let status: DotCountStatus = "idle";
  let origin = initial.from;
  let target = initial.to;
  let elapsed = 0;
  let frameId = 0;
  let timerId = 0;
  let previousTime = 0;

  const applyStatus = (next: DotCountStatus) => {
    status = next;
    onStatus(next);
  };

  const cancel = () => {
    if (frameId !== 0) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    if (timerId !== 0) {
      clearTimeout(timerId);
      timerId = 0;
    }

    previousTime = 0;
  };

  const settle = () => {
    cancel();
    onValue(target);
    applyStatus("completed");
    settings.onComplete?.();
  };

  const run = () => {
    const { duration: span, motion: mode } = settings;
    const instant =
      span <= 0 || mode === "none" || (mode === "auto" && prefersReducedMotion());

    if (instant) {
      settle();
      return;
    }

    const frame = (time: number) => {
      const { duration: length, easing: curve } = settings;
      const delta = previousTime === 0 ? 0 : time - previousTime;
      previousTime = time;
      elapsed += Math.max(0, delta);

      const progress = countProgress(elapsed, length);

      if (progress >= 1) {
        settle();
        return;
      }

      onValue(countValue(origin, target, progress, curve));
      frameId = requestAnimationFrame(frame);
    };

    applyStatus("counting");
    previousTime = 0;
    frameId = requestAnimationFrame(frame);
  };

  const startFrom = (nextOrigin: number, nextTarget: number) => {
    cancel();
    origin = nextOrigin;
    target = nextTarget;
    elapsed = 0;
    onValue(nextOrigin);
    applyStatus("counting");
    settings.onStart?.();

    const { delay: wait } = settings;

    if (wait > 0) {
      timerId = window.setTimeout(() => {
        timerId = 0;
        run();
      }, wait);
      return;
    }

    run();
  };

  const start = () => {
    startFrom(settings.from, settings.to);
  };

  const pause = () => {
    if (status !== "counting") {
      return;
    }

    cancel();
    applyStatus("paused");
  };

  const resume = () => {
    if (status !== "paused") {
      return;
    }

    run();
  };

  const reset = () => {
    cancel();
    origin = settings.from;
    elapsed = 0;
    onValue(settings.from);
    applyStatus("idle");
  };

  const update = (next: CountSettings) => {
    settings = next;
    target = next.to;
  };

  return { update, start, startFrom, pause, resume, reset, cancel, status: () => status };
}
