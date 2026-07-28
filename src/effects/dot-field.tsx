"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import type { DotShape } from "../core/dots.js";
import { classNames } from "../internal/class-names.js";

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export type DotFieldMotion = "auto" | "always" | "static";

export type DotFieldPlacement = "fixed" | "absolute";

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

function finiteAtLeast(value: number, minimum: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(minimum, value) : fallback;
}

export function DotField({
  color,
  density = 0.85,
  dotSize = 2,
  gap = 6,
  maxDevicePixelRatio = 2,
  motion = "auto",
  placement = "fixed",
  shape = "square",
  speed = 1,
  className,
  style,
  ...divProps
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const safeDotSize = finiteAtLeast(dotSize, 1, 2);
    const safeGap = finiteAtLeast(gap, 0, 6);
    const safeDensity = Number.isFinite(density) ? Math.min(1, Math.max(0, density)) : 0.85;
    const safeMaxDpr = finiteAtLeast(maxDevicePixelRatio, 1, 2);
    const safeSpeed = finiteAtLeast(speed, 0, 1);
    let width = 0;
    let height = 0;
    let frameId = 0;
    let running = false;
    let destroyed = false;
    let pitchPixels = safeDotSize + safeGap;
    let dotPixels = safeDotSize;
    let offsetX = 0;
    let offsetY = 0;

    const readColor = (): string => {
      const computed = getComputedStyle(canvas);
      const value = computed.getPropertyValue("--dotterel-field-color").trim();
      return value === "" ? "rgba(120, 130, 140, 0.2)" : value;
    };

    let ink = readColor();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, safeMaxDpr);
      width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      context.setTransform(1, 0, 0, 1, 0, 0);
      dotPixels = Math.max(1, Math.round(safeDotSize * dpr));
      pitchPixels = Math.max(dotPixels + 1, Math.round((safeDotSize + safeGap) * dpr));
      offsetX = Math.floor(((width % pitchPixels) - (pitchPixels - dotPixels)) / 2);
      offsetY = Math.floor(((height % pitchPixels) - (pitchPixels - dotPixels)) / 2);
    };

    const drawDot = (x: number, y: number) => {
      if (shape === "circle") {
        context.beginPath();
        context.arc(
          x + dotPixels / 2,
          y + dotPixels / 2,
          dotPixels / 2,
          0,
          Math.PI * 2,
        );
        context.fill();
        return;
      }

      if (shape === "diamond") {
        const half = dotPixels / 2;
        context.beginPath();
        context.moveTo(x + half, y);
        context.lineTo(x + dotPixels, y + half);
        context.lineTo(x + half, y + dotPixels);
        context.lineTo(x, y + half);
        context.closePath();
        context.fill();
        return;
      }

      context.fillRect(x, y, dotPixels, dotPixels);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = ink;
      const columns = Math.ceil(width / pitchPixels);
      const rows = Math.ceil(height / pitchPixels);
      const phase = (time * safeSpeed) / 9000;

      for (let row = 0; row < rows; row += 1) {
        const depth = 1 - row / rows;

        for (let column = 0; column < columns; column += 1) {
          const wave =
            0.5 +
            0.5 *
              Math.sin(phase + column / 18 + row / 26) *
              Math.cos(phase * 0.6 + column / 30);
          const threshold = (BAYER_4X4[row % 4]![column % 4]! + 0.5) / 16;

          if (depth * safeDensity * wave <= threshold) {
            continue;
          }

          drawDot(offsetX + column * pitchPixels, offsetY + row * pitchPixels);
        }
      }
    };

    const shouldAnimate = () =>
      safeSpeed > 0 && motion !== "static" && (motion === "always" || !motionQuery.matches);

    const frame = (time: number) => {
      if (destroyed) {
        return;
      }

      draw(time);
      frameId = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    const start = () => {
      if (destroyed || running) {
        return;
      }

      if (!shouldAnimate()) {
        draw(0);
        return;
      }

      running = true;
      frameId = requestAnimationFrame(frame);
    };

    resize();
    start();

    const onResize = () => {
      resize();

      if (!running) {
        draw(0);
      }
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);

    if (resizeObserver === null) {
      window.addEventListener("resize", onResize);
    } else {
      resizeObserver.observe(canvas);
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };
    const onMotionChange = () => {
      stop();
      start();
    };
    const onThemeChange = () => {
      ink = readColor();

      if (!running) {
        draw(0);
      }
    };
    const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const themeObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(onThemeChange);

    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);
    schemeQuery.addEventListener("change", onThemeChange);
    themeObserver?.observe(document.documentElement, {
      attributeFilter: ["class", "data-dotterel-theme", "data-theme", "style"],
      attributes: true,
    });
    themeObserver?.observe(canvas.parentElement ?? canvas, {
      attributeFilter: ["class", "style"],
      attributes: true,
    });

    return () => {
      destroyed = true;
      stop();
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      schemeQuery.removeEventListener("change", onThemeChange);
    };
  }, [density, dotSize, gap, maxDevicePixelRatio, motion, shape, speed]);

  return (
    <div
      {...divProps}
      className={classNames("dotterel-field", className)}
      data-placement={placement}
      aria-hidden="true"
      style={
        color === undefined
          ? style
          : ({
              ...style,
              "--dotterel-field-color": color,
            } as CSSProperties)
      }
    >
      <canvas ref={canvasRef} className="dotterel-field__canvas" />
    </div>
  );
}
