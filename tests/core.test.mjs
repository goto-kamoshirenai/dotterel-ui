import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_DOT_DENSITY,
  DEFAULT_DOT_SHAPE,
  DEFAULT_PROGRESS_DOT_COUNT,
  DEFAULT_RIPPLE_DOT_SIZE,
  DEFAULT_RIPPLE_DURATION,
  DEFAULT_RIPPLE_JITTER,
  MAX_RIPPLE_CELLS,
  DOT_DENSITIES,
  DOT_DENSITY_METRICS,
  DOT_METRICS,
  DOT_SHAPES,
  DOT_SIZES,
  PROGRESS_DOT_COUNTS,
  RIPPLE_CELL_SIZES,
  RIPPLE_DOT_SIZES,
  cellJitter,
  diamondPoints,
  dotGeometry,
  dotUnitCount,
  filledDots,
  formatPercent,
  percentOf,
  pressOrigin,
  ratioOf,
  resolveRippleDuration,
  ringFrom,
  ringIndex,
  rippleGrid,
  sweepDuration,
} from "../dist/core/index.js";
import {
  DEFAULT_ICON_ANIMATION,
  ICONS,
  ICON_ANIMATION_TRIGGERS,
  ICON_GRIDS,
  ICON_NAMES,
  ICON_SLOT_CELLS,
  defineDotIcon,
  iconCells,
  iconGeometry,
  iconSlotSpan,
  litCells,
  resolveIconAnimation,
} from "../dist/icon/index.js";

test("dot vocabulary has stable shapes, sizes, and integer geometry", () => {
  assert.equal(DEFAULT_DOT_SHAPE, "square");
  assert.deepEqual([...DOT_SHAPES], ["square", "circle", "diamond"]);
  assert.deepEqual([...DOT_SIZES], ["sm", "md", "lg"]);
  assert.deepEqual([...DOT_DENSITIES], ["comfortable", "compact"]);
  assert.equal(DEFAULT_DOT_DENSITY, "comfortable");
  assert.deepEqual(DOT_METRICS, DOT_DENSITY_METRICS.comfortable);

  for (const density of DOT_DENSITIES) {
    for (const size of DOT_SIZES) {
      const { dot, gap } = DOT_DENSITY_METRICS[density][size];
      const geometry = dotGeometry(5, size, density);

      assert.ok(Number.isInteger(dot) && dot > 0);
      assert.ok(Number.isInteger(gap) && gap >= 0);
      assert.equal(geometry.dot, dot);
      assert.equal(geometry.gap, gap);
      assert.equal(geometry.pitch, dot + gap);
      assert.equal(geometry.span, dot * 5 + gap * 4);
      assert.ok(Number.isInteger(geometry.span));
    }
  }

  assert.equal(dotGeometry(0, "md").span, 0);
  assert.equal(dotGeometry(-10, "md").span, 0);
  assert.deepEqual(dotGeometry(5, "md"), dotGeometry(5, "md", DEFAULT_DOT_DENSITY));
});

test("compact density narrows the gap without shrinking the icon", () => {
  for (const size of DOT_SIZES) {
    const comfortable = DOT_DENSITY_METRICS.comfortable[size];
    const compact = DOT_DENSITY_METRICS.compact[size];

    // 隙間はドット1個ぶんより狭い。sm は 0 まで詰める
    assert.ok(compact.gap < comfortable.gap, `${size} narrows the gap`);
    assert.ok(compact.gap * 2 <= compact.dot, `${size} keeps the gap under half a dot`);

    // 隙間を削ったぶんドットが太るので、5セルの外形はほぼ変わらない
    const difference = Math.abs(
      dotGeometry(5, size, "compact").span - dotGeometry(5, size, "comfortable").span,
    );
    assert.ok(difference <= 2, `${size} keeps the same footprint`);
  }

  assert.equal(DOT_DENSITY_METRICS.compact.sm.gap, 0);
});

test("rings and diamond points are deterministic", () => {
  assert.equal(ringIndex(2, 2, 5, 5), 0);
  assert.equal(ringIndex(2, 1, 5, 5), 1);
  assert.equal(ringIndex(0, 0, 5, 5), ringIndex(4, 4, 5, 5));
  assert.equal(diamondPoints(0, 0, 2), "1,0 2,1 1,2 0,1");
  assert.equal(diamondPoints(4, 8, 2), "5,8 6,9 5,10 4,9");
});

test("built-in icon definitions are valid and unique", () => {
  assert.ok(ICON_NAMES.length >= 54);
  const seen = new Set();

  for (const name of ICON_NAMES) {
    const { rows } = ICONS[name];
    const fingerprint = rows.join("/");

    const cells = rows.length;

    assert.ok(ICON_GRIDS.includes(cells), `${name} uses a registered grid`);
    assert.ok(rows.some((row) => row.includes("#")), `${name} has a lit dot`);
    assert.equal(
      cells === 9,
      name.endsWith("-detailed"),
      `${name} marks a 9x9 grid with -detailed`,
    );

    for (const row of rows) {
      assert.equal(row.length, cells, `${name} column count`);
      assert.match(row, /^[#.]+$/);
    }

    assert.ok(!seen.has(fingerprint), `${name} is unique`);
    seen.add(fingerprint);
  }
});

test("general UI icon names are registered in kebab-case", () => {
  const required = [
    "book",
    "document",
    "quote",
    "bookmark",
    "bookmark-filled",
    "tag",
    "building",
    "desktop",
    "database",
    "network",
    "link",
    "external-link",
    "image-off",
    "message",
    "grid",
    "list",
    "checklist",
    "filter",
    "sort",
    "swap-vertical",
    "merge",
    "edit",
    "copy",
    "save",
    "trash",
    "undo",
    "stop",
    "login",
    "logout",
    "more-vertical",
  ];

  assert.equal(new Set(required).size, required.length);

  for (const name of required) {
    assert.ok(ICON_NAMES.includes(name), `${name} is registered`);
    assert.ok(ICONS[name], `${name} has a definition`);
  }

  for (const name of ICON_NAMES) {
    assert.match(name, /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, `${name} is kebab-case`);
  }
});

test("meanings handled by substitution stay out of the registry", () => {
  const substituted = [
    "checkbox",
    "collection",
    "dashboard",
    "search-off",
    "select-all",
    "reset",
    "book-alert",
    "magazine",
    "category",
    "globe",
    "users",
    "translate",
  ];

  for (const name of substituted) {
    assert.ok(!ICON_NAMES.includes(name), `${name} is expressed by other icons`);
  }
});

test("custom icon definitions reject malformed matrices", () => {
  const definition = defineDotIcon([".#.", "###", ".#."]);
  assert.deepEqual(definition.rows, [".#.", "###", ".#."]);
  assert.ok(Object.isFrozen(definition));
  assert.ok(Object.isFrozen(definition.rows));

  assert.throws(() => defineDotIcon([]), /at least one row/);
  assert.throws(() => defineDotIcon(["...", ".."]), /rectangle/);
  assert.throws(() => defineDotIcon([".x."]), /using only/);
  assert.throws(() => defineDotIcon(["..."]), /using only/);
});

test("lit cells follow dot pitch and carry a ring index", () => {
  const rows = ["..#..", ".....", "#.#.#", ".....", "..#.."];
  const geometry = iconGeometry(rows, "md");
  const cells = litCells(rows, geometry);

  assert.equal(geometry.span, 18);
  assert.deepEqual(
    cells.map(({ x, y }) => ({ x, y })),
    [
      { x: 8, y: 0 },
      { x: 0, y: 8 },
      { x: 8, y: 8 },
      { x: 16, y: 8 },
      { x: 8, y: 16 },
    ],
  );
  assert.deepEqual(
    cells.map(({ ring }) => ring),
    [2, 2, 0, 2, 2],
  );
});

test("every grid draws into the same slot", () => {
  const fine = ICONS["database-detailed"].rows;

  assert.equal(ICON_SLOT_CELLS, 5);
  assert.equal(iconCells(fine), 9);
  assert.equal(iconCells(["..#..", "#...#"]), 5);

  for (const density of DOT_DENSITIES) {
    for (const size of DOT_SIZES) {
      const slot = iconSlotSpan(size, density);

      // 5×5 は等倍で描く。9×9 は自分のグリッドで測ってから同じ枠へ収める
      assert.equal(slot, iconGeometry(ICONS.database.rows, size, density).span);
      assert.ok(iconGeometry(fine, size, density).span > slot);
    }
  }

  assert.equal(iconSlotSpan("md"), iconSlotSpan("md", DEFAULT_DOT_DENSITY));
});

test("icon animation shorthands and invalid numbers resolve safely", () => {
  assert.deepEqual([...ICON_ANIMATION_TRIGGERS], ["mount", "hover", "always"]);

  const shorthand = resolveIconAnimation("hover");
  assert.equal(shorthand.trigger, "hover");
  assert.equal(shorthand.duration, DEFAULT_ICON_ANIMATION.duration);
  assert.equal(shorthand.spread, DEFAULT_ICON_ANIMATION.spread);
  assert.equal(shorthand.iterations, DEFAULT_ICON_ANIMATION.repeat);

  assert.deepEqual(resolveIconAnimation({ trigger: "mount", repeat: 3, duration: 400, spread: 0 }), {
    trigger: "mount",
    iterations: 3,
    duration: 400,
    spread: 0,
  });
  assert.equal(resolveIconAnimation({ trigger: "always", repeat: 2 }).iterations, "infinite");
  assert.equal(resolveIconAnimation({ repeat: Number.NaN }).iterations, 1);
  assert.equal(resolveIconAnimation({ duration: Number.NaN }).duration, 600);
  assert.equal(resolveIconAnimation({ spread: -10 }).spread, 0);
});

test("progress calculations preserve meaningful endpoints", () => {
  assert.deepEqual([...PROGRESS_DOT_COUNTS], [10, 20]);
  assert.equal(DEFAULT_PROGRESS_DOT_COUNT, 10);
  assert.equal(ratioOf(1, 2), 0.5);
  assert.equal(ratioOf(3, 2), 1);
  assert.equal(ratioOf(-1, 2), 0);
  assert.equal(ratioOf(Number.NaN, 2), 0);
  assert.equal(ratioOf(1, Number.POSITIVE_INFINITY), 0);

  assert.equal(percentOf(0, 100), 0);
  assert.equal(percentOf(100, 100), 100);
  assert.equal(percentOf(4, 1000), 1);
  assert.equal(percentOf(996, 1000), 99);
  assert.equal(formatPercent(45, 100), "45%");

  assert.equal(filledDots(0, 100), 0);
  assert.equal(filledDots(100, 100), 10);
  assert.equal(filledDots(1, 1000), 1);
  assert.equal(filledDots(999, 1000), 9);
  assert.equal(filledDots(50, 100, 7), 4);
  assert.equal(filledDots(50, 100, 1), 0);
  assert.equal(filledDots(100, 100, 1), 1);

  assert.equal(dotUnitCount(10), 19);
  assert.equal(dotUnitCount(20), 39);
  assert.equal(dotUnitCount(0), 1);
});

test("ripple grid covers its host edge to edge without gaps", () => {
  const grid = rippleGrid(247, 44, "md");
  const cell = RIPPLE_CELL_SIZES.md;

  // 端数は外へはみ出させる (内側へ縮めると縁に下地の帯が残る)
  assert.equal(grid.cell, cell);
  assert.equal(grid.columns, Math.ceil(247 / cell));
  assert.equal(grid.rows, Math.ceil(44 / cell));
  assert.ok(grid.columns * cell >= 247 && grid.rows * cell >= 44);
  assert.equal(grid.cells.length, grid.columns * grid.rows);

  // マスは整数の正方形。刻み = 辺 (余白なし)
  for (const size of RIPPLE_DOT_SIZES) {
    const side = RIPPLE_CELL_SIZES[size];
    assert.ok(Number.isInteger(side) && side > 0, `${size} cell side`);
  }
  const sides = RIPPLE_DOT_SIZES.map((size) => RIPPLE_CELL_SIZES[size]);
  assert.deepEqual(sides, [...sides].sort((a, b) => a - b));
  assert.ok(RIPPLE_DOT_SIZES.includes(DEFAULT_RIPPLE_DOT_SIZE));

  // 寸法が取れないときと、大きすぎるときはマスを作らない
  for (const [w, h] of [[0, 44], [247, 0], [Number.NaN, 44], [-10, 44]]) {
    assert.deepEqual(rippleGrid(w, h, "md").cells, [], `${w}x${h}`);
  }
  assert.deepEqual(rippleGrid(4000, 4000, "sm").cells, []);
  assert.ok(Math.ceil(4000 / RIPPLE_CELL_SIZES.sm) ** 2 > MAX_RIPPLE_CELLS);
});

test("ripple rings grow from the center and jitter is deterministic", () => {
  const grid = rippleGrid(50, 50, "sm"); // 8pxマスで 7x7、中心は (3,3)
  const ringAt = (x, y) => grid.cells.find((cell) => cell.x === x && cell.y === y)?.ring;

  assert.equal(grid.columns, 7);
  assert.equal(ringAt(3, 3), 0);
  assert.equal(ringAt(3, 2), 1);
  assert.equal(ringAt(0, 0), ringAt(6, 6));
  assert.equal(grid.ringSpan, ringFrom(0, 0, 3, 3));
  for (const cell of grid.cells) {
    assert.ok(cell.ring <= grid.ringSpan + 1e-9);
  }

  // 同じ位置なら常に同じ値 (SSRとクライアントで揺れない)、幅の中に収まる
  assert.equal(cellJitter(3, 4, 110), cellJitter(3, 4, 110));
  for (let x = 0; x < 12; x += 1) {
    for (let y = 0; y < 6; y += 1) {
      const value = cellJitter(x, y, 110);
      assert.ok(Number.isInteger(value) && value >= 0 && value <= 110, `${x},${y}`);
    }
  }
  // 行や列で同じ模様が繰り返さない
  assert.notEqual(cellJitter(0, 1, 110), cellJitter(1, 0, 110));
  const row = Array.from({ length: 12 }, (_, x) => cellJitter(x, 0, 110));
  assert.ok(new Set(row).size >= 8);
  assert.equal(cellJitter(3, 4, 0), 0);
  assert.equal(cellJitter(3, 4, Number.NaN), 0);
  assert.ok(DEFAULT_RIPPLE_JITTER > 0, "既定でばらつきが無いと縁が円に見える");
});

test("press origin, sweep time, and duration fall back safely", () => {
  const grid = rippleGrid(50, 50, "sm"); // 8pxマスで 7x7

  // マスの中心を基準にするので、左上の角は0番のマス
  assert.deepEqual(pressOrigin(grid, 4, 4), { x: 0, y: 0 });
  assert.deepEqual(pressOrigin(grid, 28, 28), { x: 3, y: 3 });
  // はみ出した先は端のマスへ寄せ、座標なし (キーボード) は中心へ
  assert.deepEqual(pressOrigin(grid, 999, -999), { x: 6, y: 0 });
  assert.deepEqual(pressOrigin(grid, Number.NaN, Number.NaN), { x: 3, y: 3 });

  // 1列ずつ遅らせ、最後の列が切り替わりきるまで (ばらつきの幅も足す)
  assert.equal(sweepDuration(16, 22, 55, 120), 15 * 22 + 55 + 120);
  assert.equal(sweepDuration(0, 22, 55, 120), 175);
  assert.equal(sweepDuration(Number.NaN, 22, 55, 120), 175);
  assert.ok(sweepDuration(20) > sweepDuration(10));

  assert.equal(resolveRippleDuration(), DEFAULT_RIPPLE_DURATION);
  assert.equal(resolveRippleDuration(400.9), 400);
  assert.equal(resolveRippleDuration(0), DEFAULT_RIPPLE_DURATION);
  assert.equal(resolveRippleDuration(Number.POSITIVE_INFINITY), DEFAULT_RIPPLE_DURATION);
});
