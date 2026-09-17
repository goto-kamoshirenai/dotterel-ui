/**
 * ドットのリップル。データと純関数のみ。
 *
 * 面をマス目で覆い、1マスずつ色を差し替えることで「ドットで塗り替わる」を作る。
 *
 * - マスの**間に余白は置かない**。余白があるとドットが下地の上に乗って見え、
 *   面そのものが塗り替わったようには見えない
 * - 余白なしで同心円状に広げると、縁が滑らかな円に見えてドットが立たない。
 *   そこで1マスごとの遅れに**ばらつき**を混ぜ、点く順番を崩す
 * - ばらつきは決定的な擬似乱数で出す。SSRとクライアントで値が揺れず、
 *   同じ入力なら同じ絵になるのでテストできる
 */

/** マス1つの辺の大きさ。余白が無いので、これがそのままドットの大きさになる */
export type RippleDotSize = "sm" | "md" | "lg" | "xl";

export const RIPPLE_DOT_SIZES: readonly RippleDotSize[] = ["sm", "md", "lg", "xl"];

/** 大きさごとのマスの辺 (px、整数)。刻み = 辺 (余白なし) */
export const RIPPLE_CELL_SIZES: Readonly<Record<RippleDotSize, number>> = {
  sm: 8,
  md: 10,
  lg: 14,
  /** 面の広いもの (サイドシートなど) 用。1マス=1要素なので細かすぎると数が爆発する */
  xl: 20,
};

export const DEFAULT_RIPPLE_DOT_SIZE: RippleDotSize = "md";

/** 1マスが切り替わる時間 (ms) */
export const DEFAULT_RIPPLE_CELL_DURATION = 120;

/** 中心から1段外へ進むごとの遅れ (ms) */
export const DEFAULT_RIPPLE_STEP = 22;

/**
 * 遅れに混ぜるばらつきの幅 (ms)。0にすると縁が円に見えてドットが立たない。
 * 1段ぶんの遅れ (STEP) の2〜3倍が目安。これより大きいと中心から広がって見えない。
 */
export const DEFAULT_RIPPLE_JITTER = 55;

/** 押したときに1マスが明滅する時間 (ms) */
export const DEFAULT_RIPPLE_DURATION = 260;

/**
 * マス目の上限。これを超える大きさでは演出を出さない。
 * 1マス=1要素なので、際限なく増やすと描画費用が演出の価値を上回る。
 */
export const MAX_RIPPLE_CELLS = 1600;

export type RippleOrigin = {
  readonly x: number;
  readonly y: number;
};

export type RippleCell = {
  /** 列・行の番号 (0起点) */
  readonly x: number;
  readonly y: number;
  /** 中心からの距離 (マス単位)。ホバーの塗りはこの順に広がる */
  readonly ring: number;
  /** このマスだけの遅れ (ms) */
  readonly jitter: number;
};

export type RippleGrid = {
  readonly columns: number;
  readonly rows: number;
  /** マス1つの辺 (px) */
  readonly cell: number;
  /** 中心から一番遠いマスまでの距離 (マス単位)。離脱時の逆順に使う */
  readonly ringSpan: number;
  readonly cells: readonly RippleCell[];
};

export const EMPTY_RIPPLE_GRID: RippleGrid = Object.freeze({
  columns: 0,
  rows: 0,
  cell: 0,
  ringSpan: 0,
  cells: Object.freeze([]) as readonly RippleCell[],
});

/**
 * 決定的な擬似乱数 (0以上 spread 以下、msの整数)。
 *
 * 位置から直接求めるので、状態を持たずに同じ絵を再現できる。
 * 縦横それぞれ別の係数を掛けて、行や列で模様が繰り返さないようにする。
 */
export function cellJitter(x: number, y: number, spread: number): number {
  if (!Number.isFinite(spread) || spread <= 0) {
    return 0;
  }

  const hashed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  const fraction = hashed - Math.floor(hashed);
  return Math.round(fraction * spread);
}

/** 2点間の距離 (マス単位) */
export function ringFrom(x: number, y: number, originX: number, originY: number): number {
  return Math.hypot(x - originX, y - originY);
}

/**
 * 面を覆うマス目。
 *
 * マスは整数の正方形にし、端数は**外へはみ出させて**要素の縁で切り取る。
 * 内側へ縮めると縁に下地の帯が残り、面が塗り替わって見えない。
 */
export function rippleGrid(
  width: number,
  height: number,
  size: RippleDotSize = DEFAULT_RIPPLE_DOT_SIZE,
  jitterSpread: number = DEFAULT_RIPPLE_JITTER,
): RippleGrid {
  const cell = RIPPLE_CELL_SIZES[size];

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return EMPTY_RIPPLE_GRID;
  }

  const columns = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);

  if (columns * rows > MAX_RIPPLE_CELLS) {
    return EMPTY_RIPPLE_GRID;
  }

  const centerX = (columns - 1) / 2;
  const centerY = (rows - 1) / 2;
  const cells: RippleCell[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      cells.push({
        x,
        y,
        ring: ringFrom(x, y, centerX, centerY),
        jitter: cellJitter(x, y, jitterSpread),
      });
    }
  }

  return { columns, rows, cell, ringSpan: ringFrom(0, 0, centerX, centerY), cells };
}

/**
 * 押した位置 (マス単位)。マス目の左上を原点とする。
 * 要素の外や異常値は中心へ倒す (キーボード操作は座標を持たない)。
 */
export function pressOrigin(grid: RippleGrid, x: number, y: number): RippleOrigin {
  const center = { x: (grid.columns - 1) / 2, y: (grid.rows - 1) / 2 };

  if (grid.cell === 0 || !Number.isFinite(x) || !Number.isFinite(y)) {
    return center;
  }

  const clamp = (value: number, max: number): number =>
    Math.min(max, Math.max(0, value / grid.cell - 0.5));

  return { x: clamp(x, grid.columns - 1), y: clamp(y, grid.rows - 1) };
}

/**
 * 横方向へ1列ずつ流したときに、全体が入れ替わりきる時間 (ms)。
 * サイドシートのように「横から展開する」動きで、隠す・見せるの切り替えを
 * 演出の終わりに合わせるために使う。
 */
export function sweepDuration(
  columns: number,
  step: number = DEFAULT_RIPPLE_STEP,
  jitterSpread: number = DEFAULT_RIPPLE_JITTER,
  cellDuration: number = DEFAULT_RIPPLE_CELL_DURATION,
): number {
  const count = Math.max(1, Math.trunc(Number.isFinite(columns) ? columns : 1));
  return (count - 1) * step + jitterSpread + cellDuration;
}

/** 押したときの明滅の時間 (ms)。異常値は既定へ倒す */
export function resolveRippleDuration(value?: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_RIPPLE_DURATION;
  }

  return Math.trunc(value);
}
