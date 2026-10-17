/**
 * リップルのレイヤーを動かす部分。React に依存しない。
 *
 * `useDotRipple` (React) と `mountDotRipple` (dotterel-ui/dom) の両方がここを呼ぶ。
 * クラス名、CSS変数、計測、押したときの処理をここへ集め、2つの実装で
 * 出力がずれないようにする。
 */
import type { DotShape } from "../core/dots.js";
import {
  DEFAULT_RIPPLE_CELL_DURATION,
  DEFAULT_RIPPLE_STEP,
  pressOrigin,
  rippleGrid,
  type RippleCell,
  type RippleDotSize,
  type RippleGrid,
} from "../core/ripple.js";

export type DotRippleOptions = {
  /** マスの形。既定は四角。余白が無いので、四角のときだけ面がすき間なく塗り替わる */
  readonly shape?: DotShape;
  /** マス1つの辺の大きさ */
  readonly size?: RippleDotSize;
  /** 押したときに1マスが明滅する時間 (ms) */
  readonly duration?: number;
  /**
   * この条件に合うときだけマスを作る (合わないあいだは何も描かない)。
   * 画面幅で演出の有無が変わる場所で、余分な要素を作らないために使う。
   */
  readonly media?: string;
};

/** レイヤーとマスへ載せるCSS変数。値は文字列にそろえ、React と DOM で同じ表記にする */
export type RippleStyle = Readonly<Record<`--${string}`, string>>;

export const RIPPLE_LAYER_CLASS = "dotterel-ripple";

export const RIPPLE_CELL_CLASS = "dotterel-ripple__cell";

export function rippleLayerClassName(shape: DotShape): string {
  return `${RIPPLE_LAYER_CLASS} ${RIPPLE_LAYER_CLASS}--${shape}`;
}

/** レイヤーのCSS変数。マスがまだ無い (測る前、条件に合わない) ときは 0 を入れる */
export function rippleLayerStyle(grid: RippleGrid | null, duration: number): RippleStyle {
  return {
    "--dotterel-ripple-columns": String(grid?.columns ?? 0),
    "--dotterel-ripple-cell": `${grid?.cell ?? 0}px`,
    "--dotterel-ripple-ring-span": String(grid?.ringSpan ?? 0),
    "--dotterel-ripple-step": `${DEFAULT_RIPPLE_STEP}ms`,
    "--dotterel-ripple-cell-duration": `${DEFAULT_RIPPLE_CELL_DURATION}ms`,
    "--dotterel-ripple-press-duration": `${duration}ms`,
  };
}

/** マス1つのCSS変数 */
export function rippleCellStyle(cell: RippleCell): RippleStyle {
  return {
    "--dotterel-ripple-ring": String(cell.ring),
    "--dotterel-ripple-jitter": `${cell.jitter}ms`,
    "--dotterel-ripple-cx": String(cell.x),
    "--dotterel-ripple-cy": String(cell.y),
  };
}

export function rippleCellKey(cell: RippleCell): string {
  return `${cell.x}-${cell.y}`;
}

export function sameRippleGrid(a: RippleGrid | null, b: RippleGrid): boolean {
  return a !== null && a.columns === b.columns && a.rows === b.rows && a.cell === b.cell;
}

/**
 * ホストの寸法を見張り、マス目が変わったときだけ `onChange` を呼ぶ。
 *
 * 計測は ResizeObserver (observe 直後にも1回呼ばれる) か、無い環境では
 * 次のフレームで行う。比べる相手は `current` で毎回読み、呼び出し側が
 * 持っている最新のマス目と照らす (1pxの揺れで数百要素を捨てない)。
 * 戻り値は見張りをやめる関数。
 */
export function observeRippleGrid(
  host: HTMLElement,
  size: RippleDotSize,
  current: () => RippleGrid | null,
  onChange: (grid: RippleGrid) => void,
): () => void {
  const measure = () => {
    const rect = host.getBoundingClientRect();
    const next = rippleGrid(rect.width, rect.height, size);

    if (sameRippleGrid(current(), next)) {
      return;
    }

    onChange(next);
  };

  if (typeof ResizeObserver === "undefined") {
    const schedule =
      typeof window.requestAnimationFrame === "function"
        ? { set: window.requestAnimationFrame, clear: window.cancelAnimationFrame }
        : { set: (callback: () => void) => window.setTimeout(callback, 0), clear: window.clearTimeout };
    const handle = schedule.set(measure);
    window.addEventListener("resize", measure);
    return () => {
      schedule.clear(handle);
      window.removeEventListener("resize", measure);
    };
  }

  const observer = new ResizeObserver(measure);
  observer.observe(host);
  return () => observer.disconnect();
}

/**
 * 押した位置から明滅させる。座標が無いとき (キーボード) は中心から。
 * 起点はCSS変数で渡し、マスは作り直さない (押すたびに数百要素を触らない)。
 */
export function pressRipple(
  layer: HTMLElement | null,
  grid: RippleGrid | null,
  clientX: number | null,
  clientY: number | null,
): void {
  if (layer === null || grid === null || grid.cells.length === 0) {
    return;
  }

  const rect = layer.getBoundingClientRect();
  const origin =
    clientX === null || clientY === null
      ? pressOrigin(grid, Number.NaN, Number.NaN)
      : pressOrigin(grid, clientX - rect.left, clientY - rect.top);

  layer.style.setProperty("--dotterel-ripple-press-x", String(origin.x));
  layer.style.setProperty("--dotterel-ripple-press-y", String(origin.y));
  // 属性を付け直すだけでは再生し直されない。一度外して配置を確定させる
  layer.removeAttribute("data-press");
  void layer.offsetWidth;
  layer.setAttribute("data-press", "");
}

/** 要素へCSS変数をまとめて載せる (DOM 側でだけ使う。React は style 属性で渡す) */
export function applyRippleStyle(element: HTMLElement, style: RippleStyle): void {
  for (const [name, value] of Object.entries(style)) {
    element.style.setProperty(name, value);
  }
}
