import { DEFAULT_DOT_SHAPE, DOT_SHAPES, type DotShape } from "../core/dots.js";
import {
  DEFAULT_RIPPLE_DOT_SIZE,
  resolveRippleDuration,
  sweepDuration,
  type RippleGrid,
} from "../core/ripple.js";
import {
  applyRippleStyle,
  observeRippleGrid,
  pressRipple,
  RIPPLE_CELL_CLASS,
  RIPPLE_LAYER_CLASS,
  rippleCellStyle,
  rippleLayerClassName,
  rippleLayerStyle,
  type DotRippleOptions,
} from "../internal/ripple-layer.js";

export type { DotRippleOptions } from "../internal/ripple-layer.js";

/** マス目が変わったときに渡す状態。`useDotRipple` の `hasCells` と `sweepMs` と同じ意味 */
export type DotRippleState = {
  readonly hasCells: boolean;
  readonly sweepMs: number;
};

export type MountDotRippleOptions = DotRippleOptions & {
  /**
   * ホストへ押したときの処理を付けるか。既定は付ける。
   * 付けない場合は、戻り値の `press` を自分で呼ぶ。
   */
  readonly bindEvents?: boolean;
  /** マス目が作り直されたとき (条件に合わなくなって消えたときを含む) に呼ぶ */
  readonly onChange?: (state: DotRippleState) => void;
};

export type DotRippleHandle = {
  /** マス目を置いたレイヤー (ホストの最初の子) */
  readonly layer: HTMLElement;
  /** 押した位置から明滅させる。座標が無いとき (キーボード) は中心から */
  readonly press: (clientX: number | null, clientY: number | null) => void;
  /** マスを作れたか (作れない大きさでは演出の代わりに面をそのまま出す) */
  readonly hasCells: () => boolean;
  /** 横へ1列ずつ流しきる時間 (ms)。隠す・見せるの切り替えをこれに合わせる */
  readonly sweepMs: () => number;
  /** 見張りと押したときの処理を外し、マスを消す。差し込んだレイヤーは取り除く */
  readonly destroy: () => void;
};

/** すでに置かれたレイヤー (静的に描いたもの) を探す。ホストの直下だけを見る */
function findLayer(host: HTMLElement): HTMLElement | null {
  return host.querySelector<HTMLElement>(`:scope > .${RIPPLE_LAYER_CLASS}`);
}

/** 静的に描いたレイヤーのクラスから形を読む。読めなければ既定 */
function shapeOf(layer: HTMLElement): DotShape {
  return (
    DOT_SHAPES.find((shape) => layer.classList.contains(`${RIPPLE_LAYER_CLASS}--${shape}`)) ??
    DEFAULT_DOT_SHAPE
  );
}

/** 静的に描いたレイヤーの CSS 変数から明滅の時間を読む。読めなければ undefined */
function durationOf(layer: HTMLElement): number | undefined {
  const value = Number.parseFloat(
    layer.style.getPropertyValue("--dotterel-ripple-press-duration"),
  );
  return Number.isFinite(value) ? value : undefined;
}

function isDisabled(host: HTMLElement): boolean {
  return host.matches(":disabled") || host.getAttribute("aria-disabled") === "true";
}

/**
 * React を使わずに、要素へドットのリップルを載せる。
 *
 * `useDotRipple` が描くものと同じレイヤー (クラス名、`aria-hidden`、CSS変数) を
 * ホストの最初の子として差し込む。ホストの直下にすでに `.dotterel-ripple` が
 * あれば (Astro などで `DotButton` を静的に描いた場合)、それを使い回す。
 * 使い回すときは、指定の無い `shape` と `duration` をそのレイヤーから読む。
 *
 *   import { mountDotRipple } from "dotterel-ui/dom";
 *   for (const host of document.querySelectorAll(".dotterel-ripple-host")) {
 *     mountDotRipple(host);
 *   }
 *
 * 押したときの処理 (pointerdown は押した位置から、キーボードでの click は中心から)
 * もホストへ付ける。無効なホスト (`disabled`、`aria-disabled="true"`) では動かさない。
 */
export function mountDotRipple(
  host: HTMLElement,
  options: MountDotRippleOptions = {},
): DotRippleHandle {
  const existing = findLayer(host);
  const layer = existing ?? host.ownerDocument.createElement("span");
  const shape = options.shape ?? (existing === null ? DEFAULT_DOT_SHAPE : shapeOf(existing));
  const size = options.size ?? DEFAULT_RIPPLE_DOT_SIZE;
  const duration = resolveRippleDuration(
    options.duration ?? (existing === null ? undefined : durationOf(existing)),
  );
  const view = host.ownerDocument.defaultView ?? window;
  const mediaQuery = options.media === undefined ? null : view.matchMedia(options.media);
  let grid: RippleGrid | null = null;
  let stopObserving: (() => void) | null = null;
  let destroyed = false;

  const hasCells = () => (grid?.cells.length ?? 0) > 0;
  const sweepMs = () => sweepDuration(grid?.columns ?? 1);

  // マス目を描き直す。React 版と同じく、レイヤーの変数とマスの変数を同じ関数で組む
  const render = (next: RippleGrid | null) => {
    grid = next;
    applyRippleStyle(layer, rippleLayerStyle(next, duration));

    const fragment = host.ownerDocument.createDocumentFragment();

    for (const cell of next?.cells ?? []) {
      const element = host.ownerDocument.createElement("span");
      element.className = RIPPLE_CELL_CLASS;
      applyRippleStyle(element, rippleCellStyle(cell));
      fragment.append(element);
    }

    layer.replaceChildren(fragment);
    options.onChange?.({ hasCells: hasCells(), sweepMs: sweepMs() });
  };

  const stop = () => {
    stopObserving?.();
    stopObserving = null;
  };

  // 条件に合うあいだだけ寸法を見張る。合わなくなったら前に測ったマスも消す
  const sync = () => {
    stop();

    if (mediaQuery !== null && !mediaQuery.matches) {
      if (grid !== null) {
        render(null);
      }
      return;
    }

    stopObserving = observeRippleGrid(host, size, () => grid, render);
  };

  layer.className = rippleLayerClassName(shape);
  layer.setAttribute("aria-hidden", "true");
  applyRippleStyle(layer, rippleLayerStyle(null, duration));

  if (existing === null) {
    host.prepend(layer);
  }

  const press = (clientX: number | null, clientY: number | null) => {
    if (!destroyed) {
      pressRipple(layer, grid, clientX, clientY);
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.defaultPrevented && !isDisabled(host)) {
      press(event.clientX, event.clientY);
    }
  };

  const onClick = (event: MouseEvent) => {
    // キーボードでの実行はポインタ座標が無い (detail=0)。中心から広げる
    if (!event.defaultPrevented && !isDisabled(host) && event.detail === 0) {
      press(null, null);
    }
  };

  const bindEvents = options.bindEvents ?? true;

  if (bindEvents) {
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("click", onClick);
  }

  mediaQuery?.addEventListener("change", sync);
  sync();

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    stop();
    mediaQuery?.removeEventListener("change", sync);

    if (bindEvents) {
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("click", onClick);
    }

    grid = null;
    layer.replaceChildren();

    if (existing === null) {
      layer.remove();
      return;
    }

    // 使い回したレイヤーは残し、静的に描いたときと同じ空の状態へ戻す
    layer.removeAttribute("data-press");
    layer.style.removeProperty("--dotterel-ripple-press-x");
    layer.style.removeProperty("--dotterel-ripple-press-y");
    applyRippleStyle(layer, rippleLayerStyle(null, duration));
  };

  return { layer, press, hasCells, sweepMs, destroy };
}
