import type { DotShape } from "./dots.js";

export type RippleOrigin = {
  readonly x: number;
  readonly y: number;
};

export type RippleDotSize = "sm" | "md" | "lg";

export const RIPPLE_DOT_SIZES: readonly RippleDotSize[] = ["sm", "md", "lg"];

export const RIPPLE_METRICS: Readonly<
  Record<RippleDotSize, { readonly dot: number; readonly gap: number }>
> = {
  sm: { dot: 4, gap: 2 },
  md: { dot: 6, gap: 2 },
  lg: { dot: 9, gap: 3 },
};

export const DEFAULT_RIPPLE_DOT_SIZE: RippleDotSize = "md";

export const DEFAULT_RIPPLE_DURATION = 520;

export const DEFAULT_RIPPLE_OPACITY = 0.5;

export function ripplePitch(size: RippleDotSize = DEFAULT_RIPPLE_DOT_SIZE): number {
  const { dot, gap } = RIPPLE_METRICS[size];
  return dot + gap;
}

export function rippleOrigin(
  width: number,
  height: number,
  x: number,
  y: number,
): RippleOrigin {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;

  const clamp = (value: number, max: number): number => {
    if (!Number.isFinite(value)) {
      return max / 2;
    }

    return Math.min(max, Math.max(0, value));
  };

  return {
    x: clamp(x, safeWidth),
    y: clamp(y, safeHeight),
  };
}

export function rippleDiameter(
  width: number,
  height: number,
  origin: RippleOrigin,
): number {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return 0;
  }

  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const corners = [
    [0, 0],
    [safeWidth, 0],
    [0, safeHeight],
    [safeWidth, safeHeight],
  ] as const;
  const radius = corners.reduce(
    (longest, [cornerX, cornerY]) =>
      Math.max(longest, Math.hypot(cornerX - origin.x, cornerY - origin.y)),
    0,
  );

  return Math.ceil(radius * 2);
}

export function coverDiameter(width: number, height: number): number {
  const origin = rippleOrigin(width, height, Number.NaN, Number.NaN);
  return rippleDiameter(width, height, origin);
}

export function resolveRippleDuration(value?: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_RIPPLE_DURATION;
  }

  return Math.trunc(value);
}

export function resolveRippleOpacity(value?: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_RIPPLE_OPACITY;
  }

  return Math.min(1, Math.max(0, value));
}

const TILE_SHAPES: Readonly<Record<DotShape, (dot: number) => string>> = {
  square: (dot) => `<rect width="${dot}" height="${dot}"/>`,
  circle: (dot) => `<circle cx="${dot / 2}" cy="${dot / 2}" r="${dot / 2}"/>`,
  diamond: (dot) =>
    `<polygon points="${dot / 2},0 ${dot},${dot / 2} ${dot / 2},${dot} 0,${dot / 2}"/>`,
};

export function dotTileMask(
  shape: DotShape,
  size: RippleDotSize = DEFAULT_RIPPLE_DOT_SIZE,
): string {
  const { dot } = RIPPLE_METRICS[size];
  const pitch = ripplePitch(size);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pitch} ${pitch}">` +
    `${TILE_SHAPES[shape](dot)}</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
