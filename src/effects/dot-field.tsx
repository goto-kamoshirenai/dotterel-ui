"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import type { DotShape } from "../core/dots.js";
import { classNames } from "../internal/class-names.js";
import {
  DOT_FIELD_CANVAS_CLASS,
  DOT_FIELD_CLASS,
  DOT_FIELD_COLOR_PROPERTY,
  DOT_FIELD_DEFAULTS,
  startDotField,
  type DotFieldMotion,
  type DotFieldPlacement,
} from "../internal/field-canvas.js";

export type { DotFieldMotion, DotFieldPlacement } from "../internal/field-canvas.js";

export type DotFieldProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "aria-hidden" | "children"
> & {
  readonly color?: string;
  readonly density?: number;
  readonly dotSize?: number;
  readonly gap?: number;
  readonly maxDevicePixelRatio?: number;
  readonly motion?: DotFieldMotion;
  readonly placement?: DotFieldPlacement;
  readonly shape?: DotShape;
  readonly speed?: number;
};

export function DotField({
  color,
  density = DOT_FIELD_DEFAULTS.density,
  dotSize = DOT_FIELD_DEFAULTS.dotSize,
  gap = DOT_FIELD_DEFAULTS.gap,
  maxDevicePixelRatio = DOT_FIELD_DEFAULTS.maxDevicePixelRatio,
  motion = DOT_FIELD_DEFAULTS.motion,
  placement = DOT_FIELD_DEFAULTS.placement,
  shape = DOT_FIELD_DEFAULTS.shape,
  speed = DOT_FIELD_DEFAULTS.speed,
  className,
  style,
  ...divProps
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 描画の本体は DOM 版 (mountDotField) と共通。ここでは Canvas を渡すだけにする
  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    return startDotField(canvas, {
      density,
      dotSize,
      gap,
      maxDevicePixelRatio,
      motion,
      shape,
      speed,
    });
  }, [density, dotSize, gap, maxDevicePixelRatio, motion, shape, speed]);

  return (
    <div
      {...divProps}
      className={classNames(DOT_FIELD_CLASS, className)}
      data-placement={placement}
      aria-hidden="true"
      style={
        color === undefined
          ? style
          : ({
              ...style,
              [DOT_FIELD_COLOR_PROPERTY]: color,
            } as CSSProperties)
      }
    >
      <canvas ref={canvasRef} className={DOT_FIELD_CANVAS_CLASS} />
    </div>
  );
}
