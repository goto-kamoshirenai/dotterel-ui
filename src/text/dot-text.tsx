import {
  createElement,
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
} from "react";
import { DEFAULT_DOT_DENSITY, type DotDensity } from "../core/dots.js";
import { classNames } from "../internal/class-names.js";

export const DOT_TEXT_TAGS = [
  "span",
  "div",
  "p",
  "strong",
  "em",
  "code",
  "time",
  "label",
  "figcaption",
  "dt",
  "dd",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
] as const;

export type DotTextTag = (typeof DOT_TEXT_TAGS)[number];

export type DotTextTransform = "uppercase" | "none";

export type DotTextProps = ComponentPropsWithoutRef<"span"> & {
  readonly as?: DotTextTag;
  /** ドットの詰め方。`compact` は隙間を詰めた同じ字形の書体へ切り替える */
  readonly density?: DotDensity;
  readonly transform?: DotTextTransform;
  readonly tabular?: boolean;
};

function DotTextImplementation(
  {
    as = "span",
    density = DEFAULT_DOT_DENSITY,
    transform = "uppercase",
    tabular = false,
    className,
    ...textProps
  }: DotTextProps,
  ref: ForwardedRef<HTMLSpanElement>,
): ReactElement {
  return createElement(as, {
    ...textProps,
    ref,
    className: classNames(
      "dotterel-text",
      density === "compact" && "dotterel-text--compact",
      transform === "uppercase" && "dotterel-text--uppercase",
      tabular && "dotterel-text--tabular",
      className,
    ),
  });
}

export const DotText = forwardRef(DotTextImplementation);
DotText.displayName = "DotText";
