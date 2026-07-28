export type DotShape = "square" | "circle" | "diamond";

export const DOT_SHAPES: readonly DotShape[] = ["square", "circle", "diamond"];

export const DEFAULT_DOT_SHAPE: DotShape = "square";

export type DotSize = "sm" | "md" | "lg";

export const DOT_SIZES: readonly DotSize[] = ["sm", "md", "lg"];

export const DOT_METRICS: Readonly<
  Record<DotSize, { readonly dot: number; readonly gap: number }>
> = {
  sm: { dot: 2, gap: 1 },
  md: { dot: 2, gap: 2 },
  lg: { dot: 3, gap: 3 },
};

export type DotGeometry = {
  readonly dot: number;
  readonly gap: number;
  readonly pitch: number;
  readonly span: number;
};

export function dotGeometry(cells: number, size: DotSize): DotGeometry {
  const { dot, gap } = DOT_METRICS[size];
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
