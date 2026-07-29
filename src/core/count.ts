export const COUNT_EASINGS = ["linear", "ease-in", "ease-out", "ease-in-out"] as const;

export type CountEasing = (typeof COUNT_EASINGS)[number];

export type CountEasingFunction = (progress: number) => number;

export const DEFAULT_COUNT_EASING: CountEasing = "ease-out";

export const DEFAULT_COUNT_DURATION = 1400;

export const COUNT_EASING_FUNCTIONS: Readonly<Record<CountEasing, CountEasingFunction>> = {
  linear: (progress) => progress,
  "ease-in": (progress) => progress * progress * progress,
  "ease-out": (progress) => 1 - (1 - progress) ** 3,
  "ease-in-out": (progress) =>
    progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2,
};

export type CountFormat = {
  readonly decimals?: number | undefined;
  readonly separator?: string | undefined;
  readonly decimal?: string | undefined;
  readonly prefix?: string | undefined;
  readonly suffix?: string | undefined;
};

export type ResolvedCountFormat = {
  readonly decimals: number;
  readonly separator: string;
  readonly decimal: string;
  readonly prefix: string;
  readonly suffix: string;
};

export const DEFAULT_COUNT_FORMAT: ResolvedCountFormat = {
  decimals: 0,
  separator: ",",
  decimal: ".",
  prefix: "",
  suffix: "",
};

export function easingFunction(
  easing: CountEasing | CountEasingFunction = DEFAULT_COUNT_EASING,
): CountEasingFunction {
  if (typeof easing === "function") {
    return easing;
  }

  return COUNT_EASING_FUNCTIONS[easing];
}

export function countProgress(elapsed: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 1;
  }

  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    return 0;
  }

  return Math.min(elapsed / duration, 1);
}

export function countValue(
  from: number,
  to: number,
  progress: number,
  easing: CountEasing | CountEasingFunction = DEFAULT_COUNT_EASING,
): number {
  const start = Number.isFinite(from) ? from : 0;
  const end = Number.isFinite(to) ? to : start;
  const ratio = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;

  if (ratio <= 0) {
    return start;
  }

  if (ratio >= 1) {
    return end;
  }

  return start + (end - start) * easingFunction(easing)(ratio);
}

export function resolveCountFormat(format: CountFormat = {}): ResolvedCountFormat {
  const decimals = Number.isFinite(format.decimals)
    ? Math.min(20, Math.max(0, Math.trunc(format.decimals ?? 0)))
    : DEFAULT_COUNT_FORMAT.decimals;

  return {
    decimals,
    separator: format.separator ?? DEFAULT_COUNT_FORMAT.separator,
    decimal: format.decimal ?? DEFAULT_COUNT_FORMAT.decimal,
    prefix: format.prefix ?? DEFAULT_COUNT_FORMAT.prefix,
    suffix: format.suffix ?? DEFAULT_COUNT_FORMAT.suffix,
  };
}

export function roundTo(value: number, decimals = 0): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const places = Math.min(20, Math.max(0, Math.trunc(decimals)));
  return Number.parseFloat(value.toFixed(places));
}

function groupDigits(digits: string, separator: string): string {
  if (separator === "" || digits.length <= 3) {
    return digits;
  }

  let grouped = "";

  for (let index = 0; index < digits.length; index += 1) {
    const remaining = digits.length - index;

    if (index > 0 && remaining % 3 === 0) {
      grouped += separator;
    }

    grouped += digits[index];
  }

  return grouped;
}

export function formatCount(value: number, format?: CountFormat): string {
  const { decimals, separator, decimal, prefix, suffix } = resolveCountFormat(format);
  const safeValue = Number.isFinite(value) ? value : 0;
  const fixed = Math.abs(safeValue).toFixed(decimals);
  const [whole = "0", fraction = ""] = fixed.split(".");
  const sign = safeValue < 0 && Number.parseFloat(fixed) !== 0 ? "-" : "";
  const digits = groupDigits(whole, separator);
  const decimalPart = fraction === "" ? "" : `${decimal}${fraction}`;

  return `${sign}${prefix}${digits}${decimalPart}${suffix}`;
}
