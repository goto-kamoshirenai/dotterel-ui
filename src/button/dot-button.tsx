"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
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
  DEFAULT_RIPPLE_CELL_DURATION,
  DEFAULT_RIPPLE_DOT_SIZE,
  DEFAULT_RIPPLE_STEP,
  pressOrigin,
  resolveRippleDuration,
  rippleGrid,
  sweepDuration,
  type RippleDotSize,
  type RippleGrid,
} from "../core/ripple.js";
import { classNames } from "../internal/class-names.js";

export type DotButtonVariant = "default" | "primary" | "quiet" | "danger";

export type DotButtonStatus = "idle" | "busy";

export type DotRippleOptions = {
  /** マスの形。既定は四角。余白が無いので、四角のときだけ面がすき間なく塗り替わる */
  readonly shape?: DotShape;
  /** マス1つの辺の大きさ */
  readonly size?: RippleDotSize;
  /** 押したときに1マスが明滅する時間 (ms) */
  readonly duration?: number;
  /**
   * この条件に合うときだけマスを作る (合わないあいだは何も描かない)。
   * 画面幅で演出の有無が変わる場所で、余分な要素を作らないために使う。
   */
  readonly media?: string;
};

export type DotRipple = {
  /** ホストの最初の子として置く演出レイヤー。`ripple="none"` のときは null */
  readonly layer: ReactNode;
  /** 押した位置から明滅させる。座標が無いとき (キーボード) は中心から */
  readonly press: (clientX: number | null, clientY: number | null) => void;
  /** マスを作れたか (作れない大きさでは演出の代わりに面をそのまま出す) */
  readonly hasCells: boolean;
  /** 横へ1列ずつ流しきる時間 (ms)。隠す・見せるの切り替えをこれに合わせる */
  readonly sweepMs: number;
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

function buttonClasses(variant: DotButtonVariant, ...extra: (string | undefined)[]): string {
  return classNames("dotterel-button", "dotterel-ripple-host", variantClass(variant), ...extra);
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
  const { layer, press } = useDotRipple(ripple);

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={buttonClasses(variant, className)}
      type={type}
      disabled={disabled}
      aria-busy={ariaBusy ?? status === "busy"}
      data-status={status}
      onPointerDown={(event) => {
        onPointerDown?.(event);

        if (!event.defaultPrevented && !disabled) {
          press(event.clientX, event.clientY);
        }
      }}
      onClick={(event) => {
        onClick?.(event);

        // キーボードでの実行はポインタ座標が無い (detail=0)。中心から広げる
        if (!event.defaultPrevented && !disabled && event.detail === 0) {
          press(null, null);
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
  const { layer, press } = useDotRipple(ripple);
  const disabled = ariaDisabled === true || ariaDisabled === "true";

  return (
    <a
      {...anchorProps}
      ref={ref}
      className={buttonClasses(variant, className)}
      aria-busy={ariaBusy ?? status === "busy"}
      aria-disabled={ariaDisabled}
      data-status={status}
      onPointerDown={(event) => {
        onPointerDown?.(event);

        if (!event.defaultPrevented && !disabled) {
          press(event.clientX, event.clientY);
        }
      }}
      onClick={(event) => {
        onClick?.(event);

        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!event.defaultPrevented && event.detail === 0) {
          press(null, null);
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
  const { layer, press } = useDotRipple(ripple);
  const disabled =
    child.props["aria-disabled"] === true ||
    child.props["aria-disabled"] === "true";

  return cloneElement(
    child,
    {
      className: buttonClasses(variant, child.props.className, className),
      "aria-busy": child.props["aria-busy"] ?? status === "busy",
      "data-status": status,
      onPointerDown: (event) => {
        child.props.onPointerDown?.(event);

        if (!event.defaultPrevented && !disabled) {
          press(event.clientX, event.clientY);
        }
      },
      onClick: (event) => {
        child.props.onClick?.(event);

        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!event.defaultPrevented && event.detail === 0) {
          press(null, null);
        }
      },
    },
    layer,
    <span className="dotterel-button__label">{child.props.children}</span>,
  );
}

/**
 * メディアクエリの一致を外部ストアとして読む。`media` が無ければ常に一致。
 * サーバ側では条件付きのときだけ不一致にし、マスを描かない。
 */
function useMediaMatches(media: string | undefined): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (media === undefined) {
        return () => {};
      }

      const query = window.matchMedia(media);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    [media],
  );
  const getSnapshot = useCallback(
    () => media === undefined || window.matchMedia(media).matches,
    [media],
  );
  const getServerSnapshot = useCallback(() => media === undefined, [media]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function sameGrid(a: RippleGrid | null, b: RippleGrid): boolean {
  return a !== null && a.columns === b.columns && a.rows === b.rows && a.cell === b.cell;
}

/**
 * ドットのリップル。面をマス目で覆い、1マスずつ塗り替える。
 *
 * - ホバー: 中心から外へ、ベース色をホバー色で塗り替える (離脱時は逆順)
 * - 押したとき: 押したマスから外へ、1マスずつ明滅する
 * - 点く順番にばらつきを混ぜるので、余白が無くてもドットが立って見える
 *
 * `DotButton` はこれを内蔵している。ナビゲーションの項目やサイドシートなど、
 * ボタン以外の面へ同じ演出を載せるときは、ホストへ `dotterel-ripple-host` を付け、
 * `layer` を最初の子として置き、本文は `dotterel-ripple-label` で包んでマスの上へ出す。
 * 色は `--dotterel-ripple-fill` (ホバー色) をホストで決める。
 *
 *   const { layer, press } = useDotRipple();
 *   <a className="nav-link dotterel-ripple-host"
 *      onPointerDown={(e) => press(e.clientX, e.clientY)}
 *      onClick={(e) => { if (e.detail === 0) press(null, null); }}>
 *     {layer}
 *     <span className="dotterel-ripple-label">参考書</span>
 *   </a>
 *
 * マスの数は実寸から決まるので、描くのはマウント後 (サーバ側では空)。
 * 押した起点はCSS変数で渡し、マスは作り直さない (押すたびに数百要素を触らない)。
 */
export function useDotRipple(options?: DotRippleOptions | "none"): DotRipple {
  const layerRef = useRef<HTMLSpanElement | null>(null);
  // 描くための状態と、押したときに読むための参照を分ける。
  // 参照は計測のたびに効果の中で更新し、描画中には触らない
  const [grid, setGrid] = useState<RippleGrid | null>(null);
  const gridRef = useRef<RippleGrid | null>(null);

  const enabled = options !== "none";
  const resolved = options === undefined || options === "none" ? undefined : options;
  const shape = resolved?.shape ?? DEFAULT_DOT_SHAPE;
  const size = resolved?.size ?? DEFAULT_RIPPLE_DOT_SIZE;
  const duration = resolveRippleDuration(resolved?.duration);
  const mediaMatches = useMediaMatches(resolved?.media);

  // ラベルの折り返しや画面幅で寸法が変わる。マスの数もそれへ追従させる。
  // 計測は ResizeObserver (observe 直後にも1回呼ばれる) か、無い環境では
  // 次のフレームで行い、描画中に状態を書き換えない
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const layer = layerRef.current;
    const host = layer?.parentElement ?? null;

    if (layer === null || host === null) {
      return;
    }

    if (!mediaMatches) {
      gridRef.current = null;
      return;
    }

    const measure = () => {
      const rect = host.getBoundingClientRect();
      const next = rippleGrid(rect.width, rect.height, size);

      // 数が変わらないなら作り直さない (1pxの揺れで数百要素を捨てない)
      if (sameGrid(gridRef.current, next)) {
        return;
      }

      gridRef.current = next;
      setGrid(next);
    };

    if (typeof ResizeObserver === "undefined") {
      const schedule =
        typeof window.requestAnimationFrame === "function"
          ? { set: window.requestAnimationFrame, clear: window.cancelAnimationFrame }
          : { set: (callback: () => void) => window.setTimeout(callback, 0), clear: window.clearTimeout };
      const handle = schedule.set(measure);
      window.addEventListener("resize", measure);
      return () => {
        schedule.clear(handle);
        window.removeEventListener("resize", measure);
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [enabled, size, mediaMatches]);

  const press = useCallback((clientX: number | null, clientY: number | null) => {
    const layer = layerRef.current;
    const current = gridRef.current;

    if (layer === null || current === null || current.cells.length === 0) {
      return;
    }

    const rect = layer.getBoundingClientRect();
    const origin =
      clientX === null || clientY === null
        ? pressOrigin(current, Number.NaN, Number.NaN)
        : pressOrigin(current, clientX - rect.left, clientY - rect.top);

    layer.style.setProperty("--dotterel-ripple-press-x", String(origin.x));
    layer.style.setProperty("--dotterel-ripple-press-y", String(origin.y));
    // 属性を付け直すだけでは再生し直されない。一度外して配置を確定させる
    layer.removeAttribute("data-press");
    void layer.offsetWidth;
    layer.setAttribute("data-press", "");
  }, []);

  // 条件に合わないあいだは、前に測ったマスがあっても描かない
  const activeGrid = mediaMatches ? grid : null;
  const hasCells = (activeGrid?.cells.length ?? 0) > 0;
  const sweepMs = sweepDuration(activeGrid?.columns ?? 1);

  if (!enabled) {
    return { layer: null, press, hasCells: false, sweepMs };
  }

  const layer = (
    <span
      ref={layerRef}
      className={`dotterel-ripple dotterel-ripple--${shape}`}
      aria-hidden="true"
      style={
        {
          "--dotterel-ripple-columns": activeGrid?.columns ?? 0,
          "--dotterel-ripple-cell": `${activeGrid?.cell ?? 0}px`,
          "--dotterel-ripple-ring-span": activeGrid?.ringSpan ?? 0,
          "--dotterel-ripple-step": `${DEFAULT_RIPPLE_STEP}ms`,
          "--dotterel-ripple-cell-duration": `${DEFAULT_RIPPLE_CELL_DURATION}ms`,
          "--dotterel-ripple-press-duration": `${duration}ms`,
        } as CSSProperties
      }
    >
      {activeGrid?.cells.map((cell) => (
        <span
          key={`${cell.x}-${cell.y}`}
          className="dotterel-ripple__cell"
          style={
            {
              "--dotterel-ripple-ring": cell.ring,
              "--dotterel-ripple-jitter": `${cell.jitter}ms`,
              "--dotterel-ripple-cx": cell.x,
              "--dotterel-ripple-cy": cell.y,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );

  return { layer, press, hasCells, sweepMs };
}
