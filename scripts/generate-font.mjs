import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fontEditorCore from "fonteditor-core";
import opentype from "opentype.js";

const { createFont, woff2 } = fontEditorCore;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fontDirectory = resolve(projectRoot, "src", "fonts");
const specimenDirectory = resolve(projectRoot, "specimens");

const FONT_SUBFAMILY = "Regular";
const FONT_VERSION = "Version 1.000";
const COPYRIGHT = "Copyright (c) 2026 dotterel-ui contributors";
const LICENSE = "Licensed under the MIT License.";
const LICENSE_URL = "https://opensource.org/license/mit";
const BUILD_TIMESTAMP = Date.UTC(2026, 6, 28);
const BUILD_TIMESTAMP_SECONDS = Math.floor(BUILD_TIMESTAMP / 1000);

const UNITS_PER_EM = 1000;
const ASCENDER = 1000;
const DESCENDER = -250;
const CAP_HEIGHT = 900;

/**
 * 字面はどちらも5行グリッドで、大文字の高さ (CAP_HEIGHT) いっぱいに収まる。
 * 密度は `dot / pitch` で決まる。regular は 0.5 でアイコンの `comfortable`、
 * compact は約 0.74 で `compact` と同じ詰め方になる。
 *
 * 4 * pitch + dot === CAP_HEIGHT を保つと、どちらの書体も同じ位置に
 * ベースラインと大文字の上端が来る。字間 (sideBearing) は字の中の隙間と
 * 同じ値にし、空白の幅は pitch 2つぶんにする。
 */
const VARIANTS = [
  {
    key: "regular",
    family: "Dotterel Dots",
    postScriptName: "DotterelDots-Regular",
    fileStem: "dotterel-dots",
    dot: 100,
    pitch: 200,
    description: "A square-dot display font designed for dotterel-ui.",
  },
  {
    key: "compact",
    family: "Dotterel Dots Compact",
    postScriptName: "DotterelDotsCompact-Regular",
    fileStem: "dotterel-dots-compact",
    dot: 140,
    pitch: 190,
    description:
      "A tightly spaced square-dot display font designed for dotterel-ui.",
  },
].map((variant) => ({
  ...variant,
  fullName: `${variant.family} ${FONT_SUBFAMILY}`,
  gap: variant.pitch - variant.dot,
  sideBearing: variant.pitch - variant.dot,
  spaceAdvance: variant.pitch * 2,
}));

function assertVariantMetrics() {
  for (const variant of VARIANTS) {
    if (variant.pitch * 4 + variant.dot !== CAP_HEIGHT) {
      throw new Error(
        `Variant "${variant.key}" does not fill the cap height exactly.`,
      );
    }
    if (variant.gap <= 0) {
      throw new Error(`Variant "${variant.key}" leaves no gap between dots.`);
    }
  }
}

const glyphs = [
  { name: ".notdef", rows: ["###", "#.#", "#.#", "#.#", "###"] },
  { char: " ", name: "space", rows: [] },
  { char: "!", name: "exclam", rows: ["#", "#", "#", ".", "#"] },
  { char: '"', name: "quotedbl", rows: ["#.#", "#.#", "...", "...", "..."] },
  { char: "%", name: "percent", rows: ["##..#", "##.#.", "..#..", ".#.##", "#..##"] },
  { char: "'", name: "quotesingle", rows: ["#", "#", ".", ".", "."] },
  { char: "(", name: "parenleft", rows: [".#.", "#..", "#..", "#..", ".#."] },
  { char: ")", name: "parenright", rows: [".#.", "..#", "..#", "..#", ".#."] },
  { char: "+", name: "plus", rows: ["...", ".#.", "###", ".#.", "..."] },
  { char: ",", name: "comma", rows: ["..", "..", "..", "..", ".#", "#."] },
  { char: "-", name: "hyphen", rows: ["...", "...", "###", "...", "..."] },
  { char: ".", name: "period", rows: [".", ".", ".", ".", "#"] },
  { char: "/", name: "slash", rows: ["....#", "...#.", "..#..", ".#...", "#...."] },
  { char: "0", name: "zero", rows: ["###", "#.#", "#.#", "#.#", "###"] },
  { char: "1", name: "one", rows: [".#.", "##.", ".#.", ".#.", "###"] },
  { char: "2", name: "two", rows: ["###", "..#", "###", "#..", "###"] },
  { char: "3", name: "three", rows: ["###", "..#", "###", "..#", "###"] },
  { char: "4", name: "four", rows: ["#.#", "#.#", "###", "..#", "..#"] },
  { char: "5", name: "five", rows: ["###", "#..", "###", "..#", "###"] },
  { char: "6", name: "six", rows: ["###", "#..", "###", "#.#", "###"] },
  { char: "7", name: "seven", rows: ["###", "..#", ".#.", ".#.", ".#."] },
  { char: "8", name: "eight", rows: ["###", "#.#", "###", "#.#", "###"] },
  { char: "9", name: "nine", rows: ["###", "#.#", "###", "..#", "###"] },
  { char: ":", name: "colon", rows: [".", "#", ".", "#", "."] },
  { char: ";", name: "semicolon", rows: ["..", ".#", "..", ".#", "#."] },
  { char: "=", name: "equal", rows: ["...", "###", "...", "###", "..."] },
  { char: "?", name: "question", rows: [".##.", "#..#", "..#.", "....", "..#."] },
  { char: "A", name: "A", rows: [".##.", "#..#", "####", "#..#", "#..#"] },
  { char: "B", name: "B", rows: ["###.", "#..#", "###.", "#..#", "###."] },
  { char: "C", name: "C", rows: [".###", "#...", "#...", "#...", ".###"] },
  { char: "D", name: "D", rows: ["###.", "#..#", "#..#", "#..#", "###."] },
  { char: "E", name: "E", rows: ["###", "#..", "###", "#..", "###"] },
  { char: "F", name: "F", rows: ["###", "#..", "###", "#..", "#.."] },
  { char: "G", name: "G", rows: [".###", "#...", "#.##", "#..#", ".###"] },
  { char: "H", name: "H", rows: ["#..#", "#..#", "####", "#..#", "#..#"] },
  { char: "I", name: "I", rows: ["###", ".#.", ".#.", ".#.", "###"] },
  { char: "J", name: "J", rows: ["..#", "..#", "..#", "#.#", ".#."] },
  { char: "K", name: "K", rows: ["#..#", "#.#.", "##..", "#.#.", "#..#"] },
  { char: "L", name: "L", rows: ["#..", "#..", "#..", "#..", "###"] },
  { char: "M", name: "M", rows: ["#...#", "##.##", "#.#.#", "#...#", "#...#"] },
  { char: "N", name: "N", rows: ["#...#", "##..#", "#.#.#", "#..##", "#...#"] },
  { char: "O", name: "O", rows: [".##.", "#..#", "#..#", "#..#", ".##."] },
  { char: "P", name: "P", rows: ["###.", "#..#", "###.", "#...", "#..."] },
  { char: "Q", name: "Q", rows: [".##.", "#..#", "#..#", "#.##", ".###"] },
  { char: "R", name: "R", rows: ["###.", "#..#", "###.", "#..#", "#..#"] },
  { char: "S", name: "S", rows: [".##", "#..", ".#.", "..#", "##."] },
  { char: "T", name: "T", rows: ["#####", "..#..", "..#..", "..#..", "..#.."] },
  { char: "U", name: "U", rows: ["#..#", "#..#", "#..#", "#..#", ".##."] },
  { char: "V", name: "V", rows: ["#...#", "#...#", "#...#", ".#.#.", "..#.."] },
  { char: "W", name: "W", rows: ["#...#", "#...#", "#.#.#", "##.##", "#...#"] },
  { char: "X", name: "X", rows: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"] },
  { char: "Y", name: "Y", rows: ["#...#", ".#.#.", "..#..", "..#..", "..#.."] },
  { char: "Z", name: "Z", rows: ["####", "...#", "..#.", ".#..", "####"] },
  { char: "[", name: "bracketleft", rows: ["##", "#.", "#.", "#.", "##"] },
  { char: "\\", name: "backslash", rows: ["#....", ".#...", "..#..", "...#.", "....#"] },
  { char: "]", name: "bracketright", rows: ["##", ".#", ".#", ".#", "##"] },
  { char: "_", name: "underscore", rows: ["...", "...", "...", "...", "...", "###"] },
  { char: "|", name: "bar", rows: ["#", "#", "#", "#", "#"] },
];

const referenceGlyphs = new Map([
  ["0", ["###", "#.#", "#.#", "#.#", "###"]],
  ["2", ["###", "..#", "###", "#..", "###"]],
  ["H", ["#..#", "#..#", "####", "#..#", "#..#"]],
  ["O", [".##.", "#..#", "#..#", "#..#", ".##."]],
  ["R", ["###.", "#..#", "###.", "#..#", "#..#"]],
  ["S", [".##", "#..", ".#.", "..#", "##."]],
]);

function validateGlyphs() {
  assertVariantMetrics();
  const encoded = new Set();

  for (const glyph of glyphs) {
    if (glyph.char !== undefined) {
      if ([...glyph.char].length !== 1) {
        throw new TypeError(`Glyph "${glyph.name}" must encode exactly one character.`);
      }
      if (encoded.has(glyph.char)) {
        throw new TypeError(`Duplicate glyph for "${glyph.char}".`);
      }
      encoded.add(glyph.char);
    }

    const columns = glyph.rows[0]?.length ?? 0;
    if (
      glyph.rows.some((row) => row.length !== columns || !/^[#.]+$/.test(row)) ||
      (glyph.rows.length > 0 && !glyph.rows.some((row) => row.includes("#")))
    ) {
      throw new TypeError(`Glyph "${glyph.name}" has an invalid dot grid.`);
    }
  }

  for (const [character, expectedRows] of referenceGlyphs) {
    const actual = glyphs.find((glyph) => glyph.char === character);
    if (JSON.stringify(actual?.rows) !== JSON.stringify(expectedRows)) {
      throw new Error(`Reference glyph "${character}" no longer matches its source SVG.`);
    }
  }
}

function boundsFor(glyph, variant) {
  const points = [];

  glyph.rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === "#") {
        const x = variant.sideBearing + columnIndex * variant.pitch;
        const y = CAP_HEIGHT - variant.dot - rowIndex * variant.pitch;
        points.push([x, y], [x + variant.dot, y + variant.dot]);
      }
    });
  });

  if (points.length === 0) {
    return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
  }

  return {
    xMin: Math.min(...points.map(([x]) => x)),
    yMin: Math.min(...points.map(([, y]) => y)),
    xMax: Math.max(...points.map(([x]) => x)),
    yMax: Math.max(...points.map(([, y]) => y)),
  };
}

function advanceWidthFor(glyph, variant) {
  if (glyph.rows.length === 0) {
    return variant.spaceAdvance;
  }

  const columns = glyph.rows[0]?.length ?? 1;
  return (
    variant.sideBearing * 2 + variant.dot + Math.max(0, columns - 1) * variant.pitch
  );
}

function ttfGlyphFor(glyph, variant) {
  const bounds = boundsFor(glyph, variant);
  const contours = [];

  glyph.rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell !== "#") {
        return;
      }

      const x = variant.sideBearing + columnIndex * variant.pitch;
      const y = CAP_HEIGHT - variant.dot - rowIndex * variant.pitch;
      contours.push([
        { x, y, onCurve: true },
        { x, y: y + variant.dot, onCurve: true },
        { x: x + variant.dot, y: y + variant.dot, onCurve: true },
        { x: x + variant.dot, y, onCurve: true },
      ]);
    });
  });

  return {
    contours,
    ...bounds,
    advanceWidth: advanceWidthFor(glyph, variant),
    leftSideBearing: glyph.rows.length === 0 ? 0 : variant.sideBearing,
    name: glyph.name,
    unicode: glyph.char === undefined ? [] : [glyph.char.codePointAt(0)],
  };
}

function buildTrueTypeFont(variant) {
  const font = createFont();
  font.readEmpty();
  const data = font.get();
  const ttfGlyphs = glyphs.map((glyph) => ttfGlyphFor(glyph, variant));
  const encodedGlyphs = ttfGlyphs.filter((glyph) => glyph.unicode.length > 0);
  const averageWidth = Math.round(
    encodedGlyphs.reduce((sum, glyph) => sum + glyph.advanceWidth, 0) /
      encodedGlyphs.length,
  );

  data.head.unitsPerEm = UNITS_PER_EM;
  data.head.created = BUILD_TIMESTAMP;
  data.head.modified = BUILD_TIMESTAMP;
  data.head.xMin = 0;
  data.head.yMin = DESCENDER;
  data.head.xMax = Math.max(...ttfGlyphs.map((glyph) => glyph.xMax));
  data.head.yMax = CAP_HEIGHT;
  data.head.lowestRecPPEM = 8;
  data.glyf = ttfGlyphs;
  data.cmap = Object.fromEntries(
    ttfGlyphs.flatMap((glyph, index) =>
      glyph.unicode.map((unicode) => [unicode, index]),
    ),
  );
  data.name = {
    fontFamily: variant.family,
    fontSubFamily: FONT_SUBFAMILY,
    uniqueSubFamily: `1.000;DOTR;${variant.postScriptName}`,
    version: FONT_VERSION,
    postScriptName: variant.postScriptName,
    fullName: variant.fullName,
    copyright: COPYRIGHT,
    description: variant.description,
    license: LICENSE,
    licenseURL: LICENSE_URL,
  };
  data.hhea.ascent = ASCENDER;
  data.hhea.descent = DESCENDER;
  data.hhea.lineGap = 0;
  data.hhea.advanceWidthMax = Math.max(
    ...ttfGlyphs.map((glyph) => glyph.advanceWidth),
  );
  data.hhea.minLeftSideBearing = 0;
  data.hhea.minRightSideBearing = variant.sideBearing;
  data.hhea.xMaxExtent = Math.max(...ttfGlyphs.map((glyph) => glyph.xMax));
  data.hhea.numOfLongHorMetrics = ttfGlyphs.length;
  data.post.italicAngle = 0;
  data.post.underlinePosition = -175;
  data.post.underlineThickness = variant.dot;
  data.post.isFixedPitch = 0;
  data.maxp.numGlyphs = ttfGlyphs.length;
  data["OS/2"].xAvgCharWidth = averageWidth;
  data["OS/2"].usWeightClass = 400;
  data["OS/2"].usWidthClass = 5;
  data["OS/2"].fsType = 0;
  data["OS/2"].achVendID = "DOTR";
  data["OS/2"].fsSelection = 64;
  data["OS/2"].usFirstCharIndex = 32;
  data["OS/2"].usLastCharIndex = 124;
  data["OS/2"].sTypoAscender = ASCENDER;
  data["OS/2"].sTypoDescender = DESCENDER;
  data["OS/2"].sTypoLineGap = 0;
  data["OS/2"].usWinAscent = ASCENDER;
  data["OS/2"].usWinDescent = Math.abs(DESCENDER);
  data["OS/2"].sxHeight = 0;
  data["OS/2"].sCapHeight = CAP_HEIGHT;
  data["OS/2"].usDefaultChar = 0;
  data["OS/2"].usBreakChar = 32;
  data["OS/2"].usMaxContext = 1;

  font.set(data);
  return font;
}

function openTypePathFor(glyph, variant) {
  const path = new opentype.Path();

  glyph.rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell !== "#") {
        return;
      }

      const x = variant.sideBearing + columnIndex * variant.pitch;
      const y = CAP_HEIGHT - variant.dot - rowIndex * variant.pitch;
      path.moveTo(x, y);
      path.lineTo(x, y + variant.dot);
      path.lineTo(x + variant.dot, y + variant.dot);
      path.lineTo(x + variant.dot, y);
      path.close();
    });
  });

  return path;
}

function buildOpenTypeFont(variant) {
  const openTypeGlyphs = glyphs.map(
    (glyph) =>
      new opentype.Glyph({
        name: glyph.name,
        unicode: glyph.char?.codePointAt(0),
        advanceWidth: advanceWidthFor(glyph, variant),
        path: openTypePathFor(glyph, variant),
      }),
  );

  return new opentype.Font({
    familyName: variant.family,
    styleName: FONT_SUBFAMILY,
    fullName: variant.fullName,
    postScriptName: variant.postScriptName,
    version: FONT_VERSION,
    manufacturer: "dotterel-ui contributors",
    designer: "dotterel-ui contributors",
    description: variant.description,
    copyright: COPYRIGHT,
    license: LICENSE,
    licenseURL: LICENSE_URL,
    createdTimestamp: BUILD_TIMESTAMP_SECONDS,
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs: openTypeGlyphs,
  });
}

function serializeOpenTypeFont(font) {
  const NativeDate = globalThis.Date;

  globalThis.Date = class extends NativeDate {
    constructor(...arguments_) {
      super(...(arguments_.length === 0 ? [BUILD_TIMESTAMP] : arguments_));
    }

    static now() {
      return BUILD_TIMESTAMP;
    }
  };

  try {
    return Buffer.from(font.toArrayBuffer());
  } finally {
    globalThis.Date = NativeDate;
  }
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgDotText(variant, text, x, y, scale, color = "#181818") {
  let cursor = x;
  const rectangles = [];

  for (const character of text) {
    const glyph = glyphs.find((candidate) => candidate.char === character);
    if (!glyph) {
      cursor += variant.spaceAdvance * scale;
      continue;
    }

    glyph.rows.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        if (cell === "#") {
          rectangles.push(
            `<rect x="${cursor + (variant.sideBearing + columnIndex * variant.pitch) * scale}" ` +
              `y="${y + rowIndex * variant.pitch * scale}" width="${variant.dot * scale}" ` +
              `height="${variant.dot * scale}" fill="${color}"/>`,
          );
        }
      });
    });

    cursor += advanceWidthFor(glyph, variant) * scale;
  }

  return rectangles.join("");
}

/** 見本の見出しが枠からはみ出さないよう、指定幅に収まる倍率を出す */
function scaleToFit(variant, text, width) {
  const units = [...text].reduce((total, character) => {
    const glyph = glyphs.find((candidate) => candidate.char === character);
    return total + (glyph ? advanceWidthFor(glyph, variant) : variant.spaceAdvance);
  }, 0);

  return units === 0 ? 0 : width / units;
}

function buildSpecimenSvg(variant) {
  const title = variant.family.toUpperCase();
  const titleScale = Math.min(0.125, scaleToFit(variant, title, 1400));
  const symbolLine = `! " % ' ( ) + , - . / : ; = ? [ \\ ] _ |`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1180" viewBox="0 0 1600 1180">
  <rect width="1600" height="1180" fill="#f4f1e8"/>
  <rect x="56" y="56" width="1488" height="1068" fill="none" stroke="#181818" stroke-width="2"/>
  <text x="92" y="116" fill="#705f4b" font-family="Arial, sans-serif" font-size="22" letter-spacing="4">DOTTEREL-UI / ORIGINAL DISPLAY TYPEFACE</text>
  ${svgDotText(variant, title, 80, 158, titleScale)}
  <line x1="80" y1="300" x2="1520" y2="300" stroke="#181818" stroke-width="2"/>
  <text x="82" y="356" fill="#705f4b" font-family="Arial, sans-serif" font-size="20" letter-spacing="3">UPPERCASE / VARIABLE WIDTH / 5 ROW GRID / DOT ${variant.dot} GAP ${variant.gap}</text>
  ${svgDotText(variant, "ABCDEFGHIJKLM", 76, 396, 0.073)}
  ${svgDotText(variant, "NOPQRSTUVWXYZ", 76, 500, 0.073)}
  <text x="82" y="646" fill="#705f4b" font-family="Arial, sans-serif" font-size="20" letter-spacing="3">NUMERALS</text>
  ${svgDotText(variant, "0123456789", 76, 682, 0.095)}
  <text x="82" y="826" fill="#705f4b" font-family="Arial, sans-serif" font-size="20" letter-spacing="3">SYMBOLS</text>
  ${svgDotText(variant, symbolLine, 76, 858, 0.055)}
  <rect x="80" y="988" width="1440" height="92" fill="#181818"/>
  ${svgDotText(variant, "[STATUS] = 42%", 104, 1002, 0.065, "#f4f1e8")}
  <text x="1468" y="1100" text-anchor="end" fill="#705f4b" font-family="Arial, sans-serif" font-size="18">${xmlEscape(FONT_VERSION)}</text>
</svg>
`;
}

validateGlyphs();
await Promise.all([
  mkdir(fontDirectory, { recursive: true }),
  mkdir(specimenDirectory, { recursive: true }),
]);
await woff2.init();

for (const variant of VARIANTS) {
  const ttfBuffer = buildTrueTypeFont(variant).write({ type: "ttf", toBuffer: true });
  const woff2Buffer = Buffer.from(woff2.encode(ttfBuffer));
  const openTypeBuffer = serializeOpenTypeFont(buildOpenTypeFont(variant));

  await Promise.all([
    writeFile(resolve(fontDirectory, `${variant.fileStem}.ttf`), ttfBuffer),
    writeFile(resolve(fontDirectory, `${variant.fileStem}.woff2`), woff2Buffer),
    writeFile(resolve(fontDirectory, `${variant.fileStem}.otf`), openTypeBuffer),
    writeFile(
      resolve(specimenDirectory, `${variant.fileStem}-specimen.svg`),
      buildSpecimenSvg(variant),
      "utf8",
    ),
  ]);
}

console.log(
  `Generated ${glyphs.length - 1} encoded glyphs for ${VARIANTS.length} variants ` +
    `(${VARIANTS.map((variant) => variant.family).join(", ")}) ` +
    "in TTF, OTF, and WOFF2 formats.",
);
