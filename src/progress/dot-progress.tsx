import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
} from "react";
import { DEFAULT_DOT_SHAPE, type DotShape, type DotSize } from "../core/dots.js";
import {
  DEFAULT_PROGRESS_DOT_COUNT,
  dotUnitCount,
  filledDots,
  formatPercent,
} from "../core/progress.js";
import { classNames } from "../internal/class-names.js";

export type DotProgressSize = DotSize | "dynamic";

type NativeSpanProps = Omit<
  ComponentPropsWithoutRef<"span">,
  | "aria-label"
  | "aria-valuemax"
  | "aria-valuemin"
  | "aria-valuenow"
  | "aria-valuetext"
  | "children"
  | "role"
>;

export type DotProgressProps = NativeSpanProps & {
  readonly value: number;
  readonly max: number;
  readonly count?: number;
  readonly label?: string;
  readonly valueText?: string;
  readonly size?: DotProgressSize;
  readonly shape?: DotShape;
  readonly width?: CSSProperties["width"];
};

export type PercentProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  readonly value: number;
  readonly max: number;
};

export type DotProgressValueProps = DotProgressProps & {
  readonly valueClassName?: string;
};

function normalizedProgress(value: number, max: number): {
  readonly value: number;
  readonly max: number;
} {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  return { value: safeValue, max: safeMax };
}

function DotProgressImplementation(
  {
    value,
    max,
    count = DEFAULT_PROGRESS_DOT_COUNT,
    label,
    valueText,
    size = "md",
    shape = DEFAULT_DOT_SHAPE,
    width,
    className,
    style,
    ...spanProps
  }: DotProgressProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  const total = Math.max(1, Math.trunc(count));
  const filled = filledDots(value, max, total);
  const normalized = normalizedProgress(value, max);
  const classes = classNames(
    "dotterel-progress",
    `dotterel-progress--${size}`,
    `dotterel-progress--${shape}`,
    className,
  );
  const progressStyle =
    size === "dynamic" || width !== undefined
      ? ({
          ...style,
          "--dotterel-progress-units": dotUnitCount(total),
          width,
        } as CSSProperties)
      : style;

  return (
    <span
      {...spanProps}
      ref={ref}
      className={classes}
      style={progressStyle}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={normalized.max}
      aria-valuenow={normalized.value}
      aria-valuetext={valueText ?? formatPercent(value, max)}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={classNames(
            "dotterel-progress__dot",
            index < filled && "dotterel-progress__dot--filled",
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export const DotProgress = forwardRef(DotProgressImplementation);
DotProgress.displayName = "DotProgress";

function PercentImplementation(
  { value, max, className, ...spanProps }: PercentProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  return (
    <span
      {...spanProps}
      ref={ref}
      className={classNames("dotterel-percent", className)}
    >
      {formatPercent(value, max)}
    </span>
  );
}

export const Percent = forwardRef(PercentImplementation);
Percent.displayName = "Percent";

function DotProgressValueImplementation(
  {
    value,
    max,
    valueClassName,
    className,
    style,
    ...progressProps
  }: DotProgressValueProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  return (
    <span
      ref={ref}
      className={classNames("dotterel-progress-value", className)}
      style={style}
    >
      <DotProgress {...progressProps} value={value} max={max} />
      <Percent
        className={classNames("dotterel-progress-value__percent", valueClassName)}
        value={value}
        max={max}
      />
    </span>
  );
}

export const DotProgressValue = forwardRef(DotProgressValueImplementation);
DotProgressValue.displayName = "DotProgressValue";
