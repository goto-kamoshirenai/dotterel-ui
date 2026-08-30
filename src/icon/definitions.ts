import { dotGeometry, ringIndex, type DotGeometry, type DotSize } from "../core/dots.js";

export type DotIconDefinition = {
  readonly rows: readonly string[];
};

const DEFINITIONS = {
  check: { rows: [".....", "....#", "...#.", "#.#..", ".#..."] },
  cross: { rows: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"] },
  circle: { rows: [".###.", "#...#", "#...#", "#...#", ".###."] },
  dot: { rows: [".....", ".....", "..#..", ".....", "....."] },
  plus: { rows: [".....", "..#..", ".###.", "..#..", "....."] },
  minus: { rows: [".....", ".....", ".###.", ".....", "....."] },
  alert: { rows: ["..#..", "..#..", "..#..", ".....", "..#.."] },
  crown: { rows: [".....", "#.#.#", "#####", "#####", "....."] },
  star: { rows: ["..#..", "#.#.#", ".###.", "#.#.#", "..#.."] },
  "arrow-left": { rows: ["..#..", ".#...", "#####", ".#...", "..#.."] },
  "arrow-right": { rows: ["..#..", "...#.", "#####", "...#.", "..#.."] },
  "chevron-down": { rows: [".....", "#...#", ".#.#.", "..#..", "....."] },
  "chevron-up": { rows: [".....", "..#..", ".#.#.", "#...#", "....."] },
  "swap-vertical": { rows: [".#.#.", "##.#.", ".#.#.", ".#.##", ".#.#."] },
  merge: { rows: ["#...#", ".#.#.", "..#..", "..#..", "..#.."] },
  play: { rows: [".#...", ".##..", ".#.#.", ".##..", ".#..."] },
  pause: { rows: [".....", ".#.#.", ".#.#.", ".#.#.", "....."] },
  stop: { rows: [".....", ".###.", ".###.", ".###.", "....."] },
  timer: { rows: [".###.", "#..##", "#.###", "#...#", ".###."] },
  menu: { rows: [".....", "#####", ".....", "#####", "....."] },
  "more-vertical": { rows: ["..#..", ".....", "..#..", ".....", "..#.."] },
  grid: { rows: ["##.##", "##.##", ".....", "##.##", "##.##"] },
  list: { rows: ["#.###", ".....", "#.###", ".....", "#.###"] },
  "theme-light": { rows: ["..##.", ".##..", ".##..", ".##..", "..##."] },
  "theme-dark": { rows: [".###.", "##.##", "#...#", "##.##", ".###."] },
  search: { rows: [".###.", "#...#", "#...#", ".###.", "....#"] },
  filter: { rows: ["#####", ".###.", "..#..", "..#..", "..#.."] },
  sort: { rows: ["#####", ".#...", ".#...", "###..", ".#..."] },
  checklist: { rows: ["##...", "....#", "###.#", "...#.", "##..."] },
  edit: { rows: ["...#.", "..##.", ".##..", ".#...", "#...."] },
  copy: { rows: ["..###", "#####", "#.###", "#..#.", "####."] },
  save: { rows: ["..#..", "..#..", "#.#.#", ".###.", "#####"] },
  trash: { rows: [".###.", "#####", ".#.#.", ".#.#.", ".###."] },
  undo: { rows: [".....", ".#...", "#####", ".#..#", "....#"] },
  book: { rows: ["##.##", "#.#.#", "#.#.#", "#.#.#", "##.##"] },
  document: { rows: [".###.", ".#.##", ".#..#", ".#..#", ".####"] },
  quote: { rows: [".....", "##.##", "##.##", ".#..#", "....."] },
  bookmark: { rows: [".####", ".#..#", ".#..#", ".####", ".#..#"] },
  "bookmark-filled": { rows: [".####", ".####", ".####", ".####", ".#..#"] },
  tag: { rows: [".....", ".####", "#...#", ".####", "....."] },
  home: { rows: ["..#..", ".#.#.", "#...#", "#...#", "#####"] },
  building: { rows: [".####", ".#..#", ".####", ".#..#", ".####"] },
  desktop: { rows: ["#####", "#...#", "#####", "..#..", ".###."] },
  database: { rows: [".###.", "#...#", ".###.", "#...#", ".###."] },
  network: { rows: ["##.##", ".#.#.", "..#..", ".#.#.", "##.##"] },
  link: { rows: ["...##", "..#.#", ".###.", "#.#..", "##..."] },
  "external-link": { rows: ["..###", "...##", "###.#", "#.#..", "###.."] },
  "image-off": { rows: ["#####", "##.##", "#.#.#", "##.##", "#####"] },
  user: { rows: [".###.", ".#.#.", ".###.", ".#.#.", "#####"] },
  message: { rows: [".####", ".#..#", ".#..#", ".####", "##..."] },
  login: { rows: ["...##", "..#.#", "###.#", "..#.#", "...##"] },
  logout: { rows: ["##...", "#..#.", "#.###", "#..#.", "##..."] },
  settings: { rows: ["..#..", ".#...", "..#.#", ".#.#.", "#...."] },
} as const satisfies Readonly<Record<string, DotIconDefinition>>;

export type IconName = keyof typeof DEFINITIONS;

export const ICONS: Readonly<Record<IconName, DotIconDefinition>> = DEFINITIONS;

export const ICON_NAMES = Object.keys(DEFINITIONS) as readonly IconName[];

export function defineDotIcon(rows: readonly string[]): DotIconDefinition {
  if (rows.length === 0) {
    throw new TypeError("A dot icon needs at least one row.");
  }

  const columns = rows[0]?.length ?? 0;

  if (
    columns === 0 ||
    rows.some((row) => row.length !== columns || !/^[#.]+$/.test(row)) ||
    !rows.some((row) => row.includes("#"))
  ) {
    throw new TypeError("Dot icon rows must form a non-empty rectangle using only '#' and '.'.");
  }

  return Object.freeze({
    rows: Object.freeze([...rows]),
  });
}

export function iconGeometry(rows: readonly string[], size: DotSize): DotGeometry {
  const cells = Math.max(rows.length, ...rows.map((row) => row.length), 0);
  return dotGeometry(cells, size);
}

export type LitCell = {
  readonly x: number;
  readonly y: number;
  readonly ring: number;
};

export function litCells(
  rows: readonly string[],
  geometry: DotGeometry,
): readonly LitCell[] {
  const columns = Math.max(...rows.map((row) => row.length), 0);
  const cells: LitCell[] = [];

  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== "#") {
        return;
      }

      cells.push({
        x: x * geometry.pitch,
        y: y * geometry.pitch,
        ring: ringIndex(x, y, columns, rows.length),
      });
    });
  });

  return cells;
}

export type IconAnimationTrigger = "mount" | "hover" | "always";

export const ICON_ANIMATION_TRIGGERS: readonly IconAnimationTrigger[] = [
  "mount",
  "hover",
  "always",
];

export type IconAnimation = {
  readonly trigger?: IconAnimationTrigger;
  readonly repeat?: number;
  readonly duration?: number;
  readonly spread?: number;
};

export const DEFAULT_ICON_ANIMATION = {
  trigger: "mount",
  repeat: 1,
  duration: 600,
  spread: 80,
} as const satisfies Required<IconAnimation>;

export type ResolvedIconAnimation = {
  readonly trigger: IconAnimationTrigger;
  readonly iterations: number | "infinite";
  readonly duration: number;
  readonly spread: number;
};

function finiteOr(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : value;
}

export function resolveIconAnimation(
  animation: IconAnimationTrigger | IconAnimation,
): ResolvedIconAnimation {
  const given: IconAnimation = typeof animation === "string" ? { trigger: animation } : animation;
  const trigger = given.trigger ?? DEFAULT_ICON_ANIMATION.trigger;
  const repeat = Math.max(
    1,
    Math.trunc(finiteOr(given.repeat, DEFAULT_ICON_ANIMATION.repeat)),
  );

  return {
    trigger,
    iterations: trigger === "always" ? "infinite" : repeat,
    duration: Math.max(1, finiteOr(given.duration, DEFAULT_ICON_ANIMATION.duration)),
    spread: Math.max(0, finiteOr(given.spread, DEFAULT_ICON_ANIMATION.spread)),
  };
}
