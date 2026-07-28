export const PROGRESS_DOT_COUNTS = [10, 20] as const;

export const DEFAULT_PROGRESS_DOT_COUNT = 10;

export function dotUnitCount(count: number = DEFAULT_PROGRESS_DOT_COUNT): number {
  const total = Math.max(1, Math.trunc(count));
  return total * 2 - 1;
}

export function ratioOf(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.min(Math.max(value / max, 0), 1);
}

export function percentOf(value: number, max: number): number {
  const ratio = ratioOf(value, max);

  if (ratio <= 0) {
    return 0;
  }

  if (ratio >= 1) {
    return 100;
  }

  return Math.min(99, Math.max(1, Math.round(ratio * 100)));
}

export function formatPercent(value: number, max: number): string {
  return `${percentOf(value, max)}%`;
}

export function filledDots(
  value: number,
  max: number,
  count: number = DEFAULT_PROGRESS_DOT_COUNT,
): number {
  const total = Math.max(1, Math.trunc(count));
  const ratio = ratioOf(value, max);

  if (ratio <= 0) {
    return 0;
  }

  if (ratio >= 1) {
    return total;
  }

  return Math.min(total - 1, Math.max(1, Math.round(ratio * total)));
}
