"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
} from "react";
import { classNames } from "../internal/class-names.js";
import { useDotCount, type UseDotCountOptions } from "./use-dot-count.js";

export type DotCountTrigger = "mount" | "view" | "manual";

export type DotCountFont = "dot" | "inherit";

type NativeSpanProps = Omit<ComponentPropsWithoutRef<"span">, "children">;

export type DotCountProps = NativeSpanProps &
  Omit<UseDotCountOptions, "autoStart"> & {
    readonly startOn?: DotCountTrigger;
    readonly viewThreshold?: number;
    readonly font?: DotCountFont;
    readonly label?: string;
  };

function DotCountImplementation(
  {
    to,
    from,
    duration,
    delay,
    easing,
    motion,
    decimals,
    separator,
    decimal,
    prefix,
    suffix,
    onStart,
    onComplete,
    startOn = "mount",
    viewThreshold = 0,
    font = "dot",
    label,
    className,
    ...spanProps
  }: DotCountProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const { text, targetText, status, start } = useDotCount({
    to,
    from,
    duration,
    delay,
    easing,
    motion,
    decimals,
    separator,
    decimal,
    prefix,
    suffix,
    onStart,
    onComplete,
    autoStart: startOn === "mount",
  });

  const attachHost = useCallback(
    (node: HTMLSpanElement | null) => {
      hostRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref !== null) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    if (startOn !== "view") {
      return;
    }

    const host = hostRef.current;

    if (host === null || typeof IntersectionObserver === "undefined") {
      const handle = requestAnimationFrame(start);

      return () => {
        cancelAnimationFrame(handle);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        observer.disconnect();
        start();
      },
      { threshold: Math.min(Math.max(viewThreshold, 0), 1) },
    );

    observer.observe(host);

    return () => {
      observer.disconnect();
    };
  }, [start, startOn, viewThreshold]);

  return (
    <span
      {...spanProps}
      ref={attachHost}
      className={classNames(
        "dotterel-count",
        font === "dot" && "dotterel-text dotterel-text--tabular",
        className,
      )}
      data-status={status}
    >
      <span className="dotterel-count__value" aria-hidden="true">
        {text}
      </span>
      <span className="dotterel-count__target">
        {label === undefined ? targetText : `${label} ${targetText}`}
      </span>
    </span>
  );
}

export const DotCount = forwardRef(DotCountImplementation);
DotCount.displayName = "DotCount";
