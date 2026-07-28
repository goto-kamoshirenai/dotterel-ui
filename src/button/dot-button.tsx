"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { DEFAULT_DOT_SHAPE, type DotShape } from "../core/dots.js";
import {
  DEFAULT_RIPPLE_DOT_SIZE,
  coverDiameter,
  dotTileMask,
  resolveRippleDuration,
  resolveRippleOpacity,
  rippleDiameter,
  rippleOrigin,
  ripplePitch,
  type RippleDotSize,
} from "../core/ripple.js";
import { classNames } from "../internal/class-names.js";

export type DotButtonVariant = "default" | "primary" | "quiet" | "danger";

export type DotButtonStatus = "idle" | "busy";

export type DotRippleOptions = {
  readonly shape?: DotShape;
  readonly size?: RippleDotSize;
  readonly duration?: number;
  readonly opacity?: number;
};

type VisualProps = {
  readonly variant?: DotButtonVariant;
  readonly status?: DotButtonStatus;
  readonly ripple?: DotRippleOptions | "none";
};

type SharedProps = VisualProps & {
  readonly children: ReactNode;
};

export type DotButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> &
  SharedProps;

export type DotLinkProps = Omit<ComponentPropsWithoutRef<"a">, "children"> &
  SharedProps;

type AdaptedLinkElementProps = {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly onClick?: MouseEventHandler<HTMLElement>;
  readonly onPointerDown?: PointerEventHandler<HTMLElement>;
  readonly "aria-busy"?: boolean | "false" | "true";
  readonly "aria-disabled"?: boolean | "false" | "true";
  readonly "data-status"?: string;
};

export type DotLinkAdapterProps = VisualProps & {
  readonly children: ReactElement<AdaptedLinkElementProps>;
  readonly className?: string;
};

function variantClass(variant: DotButtonVariant): string | null {
  return variant === "default" ? null : `dotterel-button--${variant}`;
}

function DotButtonImplementation(
  {
    children,
    variant = "default",
    status = "idle",
    ripple,
    className,
    disabled,
    onClick,
    onPointerDown,
    type = "button",
    "aria-busy": ariaBusy,
    ...buttonProps
  }: DotButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { layer, start } = useDotRipple(ripple);
  const classes = classNames("dotterel-button", variantClass(variant), className);

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={classes}
      type={type}
      disabled={disabled}
      aria-busy={ariaBusy ?? status === "busy"}
      data-status={status}
      onPointerDown={(event) => {
        onPointerDown?.(event);

        if (!event.defaultPrevented && !disabled) {
          start(event.clientX, event.clientY);
        }
      }}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && !disabled && event.detail === 0) {
          start(null, null);
        }
      }}
    >
      {layer}
      <span className="dotterel-button__label">{children}</span>
    </button>
  );
}

export const DotButton = forwardRef(DotButtonImplementation);
DotButton.displayName = "DotButton";

function DotLinkImplementation(
  {
    children,
    variant = "default",
    status = "idle",
    ripple,
    className,
    onClick,
    onPointerDown,
    "aria-busy": ariaBusy,
    "aria-disabled": ariaDisabled,
    ...anchorProps
  }: DotLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const { layer, start } = useDotRipple(ripple);
  const classes = classNames("dotterel-button", variantClass(variant), className);
  const disabled = ariaDisabled === true || ariaDisabled === "true";

  return (
    <a
      {...anchorProps}
      ref={ref}
      className={classes}
      aria-busy={ariaBusy ?? status === "busy"}
      aria-disabled={ariaDisabled}
      data-status={status}
      onPointerDown={(event) => {
        onPointerDown?.(event);

        if (!event.defaultPrevented && !disabled) {
          start(event.clientX, event.clientY);
        }
      }}
      onClick={(event) => {
        onClick?.(event);

        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!event.defaultPrevented && event.detail === 0) {
          start(null, null);
        }
      }}
    >
      {layer}
      <span className="dotterel-button__label">{children}</span>
    </a>
  );
}

export const DotLink = forwardRef(DotLinkImplementation);
DotLink.displayName = "DotLink";

export function DotLinkAdapter({
  children,
  variant = "default",
  status = "idle",
  ripple,
  className,
}: DotLinkAdapterProps) {
  const child = Children.only(children);
  const { layer, start } = useDotRipple(ripple);
  const classes = classNames(
    "dotterel-button",
    variantClass(variant),
    child.props.className,
    className,
  );
  const disabled =
    child.props["aria-disabled"] === true ||
    child.props["aria-disabled"] === "true";

  return cloneElement(
    child,
    {
      className: classes,
      "aria-busy": child.props["aria-busy"] ?? status === "busy",
      "data-status": status,
      onPointerDown: (event) => {
        child.props.onPointerDown?.(event);

        if (!event.defaultPrevented && !disabled) {
          start(event.clientX, event.clientY);
        }
      },
      onClick: (event) => {
        child.props.onClick?.(event);

        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!event.defaultPrevented && event.detail === 0) {
          start(null, null);
        }
      },
    },
    layer,
    <span className="dotterel-button__label">{child.props.children}</span>,
  );
}

type Wave = {
  readonly key: number;
  readonly x: number;
  readonly y: number;
  readonly size: number;
};

function useDotRipple(options: DotRippleOptions | "none" | undefined): {
  readonly layer: ReactNode;
  readonly start: (clientX: number | null, clientY: number | null) => void;
} {
  const layerRef = useRef<HTMLSpanElement | null>(null);
  const keyRef = useRef(0);
  const [wave, setWave] = useState<Wave | null>(null);
  const [cover, setCover] = useState(0);
  const enabled = options !== "none";
  const resolvedOptions = options === undefined || options === "none" ? undefined : options;
  const shape = resolvedOptions?.shape ?? DEFAULT_DOT_SHAPE;
  const size = resolvedOptions?.size ?? DEFAULT_RIPPLE_DOT_SIZE;
  const duration = resolveRippleDuration(resolvedOptions?.duration);
  const opacity = resolveRippleOpacity(resolvedOptions?.opacity);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const layer = layerRef.current;

    if (layer === null) {
      return;
    }

    const measure = () => {
      const rect = layer.getBoundingClientRect();
      setCover(coverDiameter(rect.width, rect.height));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(layer);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (wave === null) {
      return;
    }

    const timerId = window.setTimeout(() => setWave(null), duration + 60);
    return () => window.clearTimeout(timerId);
  }, [duration, wave]);

  const start = useCallback(
    (clientX: number | null, clientY: number | null) => {
      if (!enabled) {
        return;
      }

      const layer = layerRef.current;

      if (layer === null) {
        return;
      }

      const rect = layer.getBoundingClientRect();
      const origin =
        clientX === null || clientY === null
          ? rippleOrigin(rect.width, rect.height, Number.NaN, Number.NaN)
          : rippleOrigin(rect.width, rect.height, clientX - rect.left, clientY - rect.top);

      keyRef.current += 1;
      setWave({
        key: keyRef.current,
        x: origin.x,
        y: origin.y,
        size: rippleDiameter(rect.width, rect.height, origin),
      });
    },
    [enabled],
  );

  if (!enabled) {
    return { layer: null, start };
  }

  const layer = (
    <span
      ref={layerRef}
      className="dotterel-button__ripple"
      aria-hidden="true"
      style={
        {
          "--dotterel-ripple-mask": dotTileMask(shape, size),
          "--dotterel-ripple-pitch": `${ripplePitch(size)}px`,
          "--dotterel-ripple-cover": `${cover}px`,
        } as CSSProperties
      }
    >
      <span className="dotterel-button__hover" />
      {wave === null ? null : (
        <span
          key={wave.key}
          className="dotterel-button__wave"
          style={
            {
              "--dotterel-ripple-x": `${wave.x}px`,
              "--dotterel-ripple-y": `${wave.y}px`,
              "--dotterel-ripple-size": `${wave.size}px`,
              "--dotterel-ripple-duration": `${duration}ms`,
              "--dotterel-ripple-opacity": opacity,
            } as CSSProperties
          }
        />
      )}
    </span>
  );

  return { layer, start };
}
