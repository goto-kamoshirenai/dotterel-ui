import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
} from "react";
import {
  DEFAULT_DOT_SHAPE,
  diamondPoints,
  type DotShape,
  type DotSize,
} from "../core/dots.js";
import { classNames } from "../internal/class-names.js";
import {
  ICONS,
  defineDotIcon,
  iconGeometry,
  litCells,
  resolveIconAnimation,
  type IconAnimation,
  type IconAnimationTrigger,
  type IconName,
} from "./definitions.js";

type NativeSvgProps = Omit<
  ComponentPropsWithoutRef<"svg">,
  "aria-hidden" | "aria-label" | "children" | "height" | "role" | "viewBox" | "width"
>;

export type DotIconProps = NativeSvgProps & {
  readonly rows: readonly string[];
  readonly label?: string;
  readonly size?: DotSize;
  readonly shape?: DotShape;
  readonly animation?: IconAnimationTrigger | IconAnimation;
};

export type IconProps = Omit<DotIconProps, "rows"> & {
  readonly name: IconName;
};

function DotIconImplementation(
  {
    rows,
    label,
    size = "md",
    shape = DEFAULT_DOT_SHAPE,
    animation,
    className,
    style,
    ...svgProps
  }: DotIconProps,
  ref: ForwardedRef<SVGSVGElement>,
) {
  const geometry = iconGeometry(rows, size);
  const motion = animation === undefined ? null : resolveIconAnimation(animation);
  const classes = classNames(
    "dotterel-icon",
    motion === null ? null : `dotterel-icon--${motion.trigger}`,
    className,
  );
  const motionStyle =
    motion === null
      ? style
      : ({
          ...style,
          "--dotterel-icon-duration": `${motion.duration}ms`,
          "--dotterel-icon-iterations": motion.iterations,
        } as CSSProperties);

  return (
    <svg
      {...svgProps}
      ref={ref}
      className={classes}
      style={motionStyle}
      width={geometry.span}
      height={geometry.span}
      viewBox={`0 0 ${geometry.span} ${geometry.span}`}
      focusable="false"
      {...(label === undefined
        ? ({ "aria-hidden": true } as const)
        : ({ role: "img", "aria-label": label } as const))}
    >
      {litCells(rows, geometry).map((cell) => {
        const key = `${cell.x}-${cell.y}`;
        const half = geometry.dot / 2;
        const dotStyle =
          motion === null
            ? undefined
            : ({
                "--dotterel-dot-delay": `${cell.ring * motion.spread}ms`,
              } as CSSProperties);

        if (shape === "circle") {
          return (
            <circle
              key={key}
              className="dotterel-icon__dot"
              style={dotStyle}
              cx={cell.x + half}
              cy={cell.y + half}
              r={half}
            />
          );
        }

        if (shape === "diamond") {
          return (
            <polygon
              key={key}
              className="dotterel-icon__dot"
              style={dotStyle}
              points={diamondPoints(cell.x, cell.y, geometry.dot)}
            />
          );
        }

        return (
          <rect
            key={key}
            className="dotterel-icon__dot"
            style={dotStyle}
            x={cell.x}
            y={cell.y}
            width={geometry.dot}
            height={geometry.dot}
          />
        );
      })}
    </svg>
  );
}

export const DotIcon = forwardRef(DotIconImplementation);
DotIcon.displayName = "DotIcon";

function IconImplementation(
  { name, ...props }: IconProps,
  ref: ForwardedRef<SVGSVGElement>,
) {
  return <DotIcon {...props} ref={ref} rows={ICONS[name].rows} />;
}

export const Icon = forwardRef(IconImplementation);
Icon.displayName = "Icon";

export function createDotIcon(
  rows: readonly string[],
  displayName = "CreatedDotIcon",
) {
  const definition = defineDotIcon(rows);
  const CreatedDotIcon = forwardRef<
    SVGSVGElement,
    Omit<DotIconProps, "rows">
  >((props, ref) => <DotIcon {...props} ref={ref} rows={definition.rows} />);

  CreatedDotIcon.displayName = displayName;
  return CreatedDotIcon;
}
