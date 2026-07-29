import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import opentype from "opentype.js";

const FONT_DIRECTORY = new URL("../dist/fonts/", import.meta.url);
const EXPECTED_CHARACTERS =
  ' !"%\'()+,-./0123456789:;=?ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]_|';

test("the generated font files are copied into the package", async () => {
  const [trueType, openType, woff2] = await Promise.all([
    readFile(new URL("dotterel-dots.ttf", FONT_DIRECTORY)),
    readFile(new URL("dotterel-dots.otf", FONT_DIRECTORY)),
    readFile(new URL("dotterel-dots.woff2", FONT_DIRECTORY)),
  ]);

  assert.deepEqual([...trueType.subarray(0, 4)], [0x00, 0x01, 0x00, 0x00]);
  assert.equal(openType.subarray(0, 4).toString("ascii"), "OTTO");
  assert.equal(woff2.subarray(0, 4).toString("ascii"), "wOF2");
});

test("the installable fonts map the intended uppercase-only character set", async () => {
  const buffers = await Promise.all([
    readFile(new URL("dotterel-dots.ttf", FONT_DIRECTORY)),
    readFile(new URL("dotterel-dots.otf", FONT_DIRECTORY)),
  ]);

  for (const buffer of buffers) {
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    const font = opentype.parse(arrayBuffer);

    assert.equal(font.getEnglishName("fontFamily"), "Dotterel Dots");
    for (const character of EXPECTED_CHARACTERS) {
      assert.notEqual(
        font.charToGlyphIndex(character),
        0,
        `Expected a glyph for ${JSON.stringify(character)}`,
      );
    }
    assert.equal(font.charToGlyphIndex("a"), 0);
    assert.equal(font.charToGlyphIndex("@"), 0);
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
  assert.match(css, /url\("\.\/fonts\/dotterel-dots\.woff2"\)/);
  assert.match(
    css,
    /--dotterel-font-family-dot:\s*"Dotterel Dots", ui-monospace/,
  );
});

test("the dot font is reachable through a single utility class", async () => {
  const css = await readFile(new URL("../dist/styles.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.dotterel-text\s*{\s*font-family: var\(--dotterel-font-family-dot\);\s*font-synthesis: none;/,
  );
  assert.match(css, /\.dotterel-text--uppercase\s*{\s*text-transform: uppercase;/);
  assert.match(css, /\.dotterel-text--tabular\s*{\s*font-variant-numeric: tabular-nums;/);
});
