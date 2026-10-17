import { DEFAULT_DOT_DENSITY, type DotDensity } from "../core/dots.js";
import { formatCount, type CountFormat } from "../core/count.js";
import {
  createCountRunner,
  resolveCountSettings,
  type DotCountOptions,
  type DotCountStatus,
} from "../internal/count-runner.js";

export type {
  CountRunner,
  CountRunnerCallbacks,
  CountSettings,
  DotCountMotion,
  DotCountOptions,
  DotCountStatus,
} from "../internal/count-runner.js";
export { createCountRunner, resolveCountSettings } from "../internal/count-runner.js";

/** 数え始めるきっかけ。`DotCount` の `startOn` と同じ意味 */
export type MountDotCountTrigger = "mount" | "view" | "manual";

export type MountDotCountOptions = DotCountOptions & {
  /**
   * 数え始めるきっかけ。省略時は `autoStart` に従う
   * (`autoStart: false` なら `manual`、それ以外は `mount`)。
   */
  readonly startOn?: MountDotCountTrigger;
  /** `startOn="view"` のとき、どれだけ見えたら始めるか (0〜1) */
  readonly viewThreshold?: number;
  /** 書体。`DotCount` の `font` と同じ。要素を新しく組むときだけ使う */
  readonly font?: "dot" | "inherit";
  /** ドットの詰め方。`font="dot"` のときだけ効く */
  readonly density?: DotDensity;
  /** 読み上げる最終値の前に付ける言葉 */
  readonly label?: string;
};

export type DotCountHandle = {
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
  /** 進行と見張りを止める。表示はそのまま残す */
  readonly destroy: () => void;
  readonly status: () => DotCountStatus;
};

const COUNT_CLASS = "dotterel-count";
const VALUE_CLASS = "dotterel-count__value";
const TARGET_CLASS = "dotterel-count__target";

function findPart(element: HTMLElement, className: string): HTMLElement | null {
  return element.querySelector<HTMLElement>(`:scope > .${className}`);
}

/**
 * React を使わずに、要素をカウントアップ (ダウン) させる。
 *
 * `DotCount` と同じ組み立て (途中の値は `aria-hidden` の `.dotterel-count__value`、
 * 読み上げる最終値は `.dotterel-count__target`、状態は `data-status`) にする。
 * 要素の中にすでにその組み立てがあれば (Astro などで `DotCount` を静的に描いた場合)、
 * それを使い回す。無ければ中身を置き換えて組み立てる。
 *
 *   import { mountDotCount } from "dotterel-ui/dom";
 *   const counter = mountDotCount(element, { to: 12345, suffix: " PT", startOn: "view" });
 *
 * 進行は `useDotCount` と同じ進行役 (`createCountRunner`) が受け持つ。
 */
export function mountDotCount(
  element: HTMLElement,
  options: MountDotCountOptions,
): DotCountHandle {
  const settings = resolveCountSettings(options);
  const format: CountFormat = {
    decimals: options.decimals,
    separator: options.separator,
    decimal: options.decimal,
    prefix: options.prefix,
    suffix: options.suffix,
  };
  const document = element.ownerDocument;
  const startOn: MountDotCountTrigger =
    options.startOn ?? (options.autoStart === false ? "manual" : "mount");
  const targetText = formatCount(settings.to, format);
  const label = options.label;
  let valuePart = findPart(element, VALUE_CLASS);
  let targetPart = findPart(element, TARGET_CLASS);
  const reused = valuePart !== null && targetPart !== null;

  if (valuePart === null || targetPart === null) {
    const font = options.font ?? "dot";
    const density = options.density ?? DEFAULT_DOT_DENSITY;
    const classes = [COUNT_CLASS];

    if (font === "dot") {
      classes.push("dotterel-text", "dotterel-text--tabular");

      if (density === "compact") {
        classes.push("dotterel-text--compact");
      }
    }

    element.classList.add(...classes);
    valuePart = document.createElement("span");
    valuePart.className = VALUE_CLASS;
    valuePart.setAttribute("aria-hidden", "true");
    targetPart = document.createElement("span");
    targetPart.className = TARGET_CLASS;
    element.replaceChildren(valuePart, targetPart);
  }

  const valueElement = valuePart;

  // 使い回すときは、ラベルの指定が無ければ静的に描いた読み上げ文をそのまま残す
  if (!reused || label !== undefined) {
    targetPart.textContent = label === undefined ? targetText : `${label} ${targetText}`;
  }

  const runner = createCountRunner(settings, {
    onValue: (value) => {
      valueElement.textContent = formatCount(value, format);
    },
    onStatus: (status) => {
      element.setAttribute("data-status", status);
    },
  });

  valueElement.textContent = formatCount(settings.from, format);
  element.setAttribute("data-status", runner.status());

  let frameId = 0;
  let observer: IntersectionObserver | null = null;
  let destroyed = false;

  const cancelTrigger = () => {
    if (frameId !== 0) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    observer?.disconnect();
    observer = null;
  };

  if (startOn === "mount") {
    // useDotCount と同じく、次のフレームで始める
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      runner.startFrom(settings.from, settings.to);
    });
  } else if (startOn === "view") {
    if (typeof IntersectionObserver === "undefined") {
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        runner.start();
      });
    } else {
      const watcher = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }

          watcher.disconnect();
          observer = null;
          runner.start();
        },
        { threshold: Math.min(Math.max(options.viewThreshold ?? 0, 0), 1) },
      );

      watcher.observe(element);
      observer = watcher;
    }
  }

  // 破棄したあとの操作は何もしない
  const guard =
    (action: () => void): (() => void) =>
    () => {
      if (!destroyed) {
        action();
      }
    };

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    cancelTrigger();
    runner.cancel();
  };

  return {
    start: guard(() => {
      cancelTrigger();
      runner.start();
    }),
    pause: guard(runner.pause),
    resume: guard(runner.resume),
    reset: guard(runner.reset),
    destroy,
    status: runner.status,
  };
}
