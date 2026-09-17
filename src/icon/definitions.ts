import {
  DEFAULT_DOT_DENSITY,
  dotGeometry,
  ringIndex,
  type DotDensity,
  type DotGeometry,
  type DotSize,
} from "../core/dots.js";

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
  "database-detailed": {
    rows: [
      ".........",
      ".#######.",
      "#.......#",
      ".#######.",
      "#.......#",
      ".#######.",
      "#.......#",
      ".#######.",
      ".........",
    ],
  },
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

/**
 * 登録済みアイコンが使うグリッド。5×5を基準にして、5×5では潰れてしまう
 * 造形だけ9×9を使う。9×9のアイコン名には `-detailed` を付ける。
 */
export const ICON_GRIDS: readonly number[] = [5, 9];

/**
 * 描画枠の基準セル数。どのグリッドのアイコンも、同じ `size` と `density`
 * なら5×5と同じ一辺で描く。細かいグリッドはその枠へ収まるよう縮む。
 */
export const ICON_SLOT_CELLS = 5;

/** 行列の一辺のセル数。行と列が違う場合は大きいほうに合わせる */
export function iconCells(rows: readonly string[]): number {
  return Math.max(rows.length, ...rows.map((row) => row.length), 0);
}

/** 行列自身のグリッド寸法。ドットの位置と `viewBox` に使う */
export function iconGeometry(
  rows: readonly string[],
  size: DotSize,
  density: DotDensity = DEFAULT_DOT_DENSITY,
): DotGeometry {
  return dotGeometry(iconCells(rows), size, density);
}

/** 描画する一辺の長さ。グリッドの細かさに関わらず同じ大きさになる */
export function iconSlotSpan(
  size: DotSize,
  density: DotDensity = DEFAULT_DOT_DENSITY,
): number {
  return dotGeometry(ICON_SLOT_CELLS, size, density).span;
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
