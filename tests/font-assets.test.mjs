import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import opentype from "opentype.js";

const FONT_DIRECTORY = new URL("../dist/fonts/", import.meta.url);
const EXPECTED_CHARACTERS =
  ' !"%\'()+,-./0123456789:;=?ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]_|';

const VARIANTS = [
  { stem: "dotterel-dots", family: "Dotterel Dots" },
  { stem: "dotterel-dots-compact", family: "Dotterel Dots Compact" },
];

test("the generated font files are copied into the package", async () => {
  for (const { stem } of VARIANTS) {
    const [trueType, openType, woff2] = await Promise.all([
      readFile(new URL(`${stem}.ttf`, FONT_DIRECTORY)),
      readFile(new URL(`${stem}.otf`, FONT_DIRECTORY)),
      readFile(new URL(`${stem}.woff2`, FONT_DIRECTORY)),
    ]);

    assert.deepEqual([...trueType.subarray(0, 4)], [0x00, 0x01, 0x00, 0x00], stem);
    assert.equal(openType.subarray(0, 4).toString("ascii"), "OTTO", stem);
    assert.equal(woff2.subarray(0, 4).toString("ascii"), "wOF2", stem);
  }
});

function parseFont(buffer) {
  return opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
}

test("the installable fonts map the intended uppercase-only character set", async () => {
  for (const { stem, family } of VARIANTS) {
    const buffers = await Promise.all([
      readFile(new URL(`${stem}.ttf`, FONT_DIRECTORY)),
      readFile(new URL(`${stem}.otf`, FONT_DIRECTORY)),
    ]);

    for (const buffer of buffers) {
      const font = parseFont(buffer);

      assert.equal(font.getEnglishName("fontFamily"), family);
      for (const character of EXPECTED_CHARACTERS) {
        assert.notEqual(
          font.charToGlyphIndex(character),
          0,
          `Expected a glyph for ${JSON.stringify(character)} in ${family}`,
        );
      }
      assert.equal(font.charToGlyphIndex("a"), 0);
      assert.equal(font.charToGlyphIndex("@"), 0);
    }
  }
});

test("the compact variant packs the same grid with a narrower gap", async () => {
  const [regular, compact] = await Promise.all([
    readFile(new URL("dotterel-dots.ttf", FONT_DIRECTORY)).then(parseFont),
    readFile(new URL("dotterel-dots-compact.ttf", FONT_DIRECTORY)).then(parseFont),
  ]);

  /**
   * ピリオドは1マスだけ塗るので、その外形がドット1つの大きさになる。
   * ゼロは3列なので、外形の幅はドット1つ + ピッチ2つぶん。ここから
   * ピッチと隙間を逆算できる。
   */
  const metricsOf = (font) => {
    const inkWidth = (character) => {
      const box = font.charToGlyph(character).path.getBoundingBox();
      return box.x2 - box.x1;
    };
    const dot = inkWidth(".");
    const pitch = (inkWidth("0") - dot) / 2;

    return { dot, pitch, gap: pitch - dot, advance: font.charToGlyph("0").advanceWidth };
  };

  const regularMetrics = metricsOf(regular);
  const compactMetrics = metricsOf(compact);

  assert.deepEqual(regularMetrics, { dot: 100, pitch: 200, gap: 100, advance: 700 });
  assert.deepEqual(compactMetrics, { dot: 140, pitch: 190, gap: 50, advance: 620 });

  // ドットは太く、隙間と字幅は狭い。行の高さは変えない
  assert.ok(compactMetrics.dot > regularMetrics.dot);
  assert.ok(compactMetrics.gap < regularMetrics.gap);
  assert.ok(compactMetrics.advance < regularMetrics.advance);

  for (const font of [regular, compact]) {
    const box = font.charToGlyph("0").path.getBoundingBox();
    assert.equal(box.y1, 0, "ベースラインに乗る");
    assert.equal(box.y2, 900, "大文字の高さいっぱいに収まる");
  }
});

test("the package exposes the font files through its export map", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.equal(manifest.exports["./fonts/*"], "./dist/fonts/*");
  assert.ok(
    manifest.files.includes("dist"),
    "The published files must contain the built fonts.",
  );
});

test("the stylesheet loads the webfont before its fallbacks", async () => {
  const css = await readFile(new URL("../dist/styles.css", import.meta.url), "utf8");

  assert.match(css, /@font-face\s*{/);
  assert.match(css, /font-family: "Dotterel Dots"/);
  assert.match(css, /font-family: "Dotterel Dots Compact"/);
  assert.match(css, /url\("\.\/fonts\/dotterel-dots\.woff2"\)/);
  assert.match(css, /url\("\.\/fonts\/dotterel-dots-compact\.woff2"\)/);
  assert.match(
    css,
    /--dotterel-font-family-dot:\s*"Dotterel Dots", ui-monospace/,
  );
  assert.match(
    css,
    /--dotterel-font-family-dot-compact:\s*"Dotterel Dots Compact", ui-monospace/,
  );
});

test("the dot font is reachable through a single utility class", async () => {
  const css = await readFile(new URL("../dist/styles.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.dotterel-text\s*{\s*font-family: var\(--dotterel-font-family-dot\);\s*font-synthesis: none;/,
  );
  assert.match(
    css,
    /\.dotterel-text--compact\s*{\s*font-family: var\(--dotterel-font-family-dot-compact\);/,
  );
  assert.match(css, /\.dotterel-text--uppercase\s*{\s*text-transform: uppercase;/);
  assert.match(css, /\.dotterel-text--tabular\s*{\s*font-variant-numeric: tabular-nums;/);
});
