export type DotShape = "square" | "circle" | "diamond";

export const DOT_SHAPES: readonly DotShape[] = ["square", "circle", "diamond"];

export const DEFAULT_DOT_SHAPE: DotShape = "square";

export type DotSize = "sm" | "md" | "lg";

export const DOT_SIZES: readonly DotSize[] = ["sm", "md", "lg"];

/**
 * ドットの間隔の詰め方。
 *
 * - `comfortable`: ドットと同じくらいの隙間を空ける、これまでの既定値
 * - `compact`: 隙間を最小限にする。小さいサイズでは 0 にして、
 *   大きいサイズでもドット1個ぶんではなく1単位だけ空ける
 */
export type DotDensity = "comfortable" | "compact";

export const DOT_DENSITIES: readonly DotDensity[] = ["comfortable", "compact"];

export const DEFAULT_DOT_DENSITY: DotDensity = "comfortable";

export type DotMetric = {
  readonly dot: number;
  readonly gap: number;
};

/**
 * 密度ごとのドットと隙間の大きさ。
 *
 * `compact` は隙間を削るぶんドットを太らせ、5セルの総幅を `comfortable` と
 * ほぼ同じに保つ。密度を切り替えても、並べたアイコンの大きさは変わらない。
 */
export const DOT_DENSITY_METRICS = {
  comfortable: {
    sm: { dot: 2, gap: 1 },
    md: { dot: 2, gap: 2 },
    lg: { dot: 3, gap: 3 },
  },
  compact: {
    sm: { dot: 3, gap: 0 },
    md: { dot: 3, gap: 1 },
    lg: { dot: 5, gap: 1 },
  },
} as const satisfies Readonly<Record<DotDensity, Readonly<Record<DotSize, DotMetric>>>>;

/** `comfortable` の寸法。密度を指定しない呼び出しの基準になる */
export const DOT_METRICS: Readonly<Record<DotSize, DotMetric>> =
  DOT_DENSITY_METRICS[DEFAULT_DOT_DENSITY];

export type DotGeometry = {
  readonly dot: number;
  readonly gap: number;
  readonly pitch: number;
  readonly span: number;
};

export function dotGeometry(
  cells: number,
  size: DotSize,
  density: DotDensity = DEFAULT_DOT_DENSITY,
): DotGeometry {
  const { dot, gap } = DOT_DENSITY_METRICS[density][size];
  const count = Math.max(0, Math.trunc(cells));

  return {
    dot,
    gap,
    pitch: dot + gap,
    span: count === 0 ? 0 : count * dot + (count - 1) * gap,
  };
}

export function ringIndex(x: number, y: number, columns: number, rows: number): number {
  const centerX = (columns - 1) / 2;
  const centerY = (rows - 1) / 2;
  return Math.round(Math.hypot(x - centerX, y - centerY));
}

export function diamondPoints(x: number, y: number, dot: number): string {
  const half = dot / 2;
  return `${x + half},${y} ${x + dot},${y + half} ${x + half},${y + dot} ${x},${y + half}`;
}
