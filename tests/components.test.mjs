import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DotButton,
  DotCount,
  DotField,
  DotIcon,
  DotLink,
  DotLinkAdapter,
  DotProgress,
  DotProgressValue,
  DotText,
  Icon,
  Percent,
} from "../dist/index.js";

test("named icons render accessible SVG when labeled", () => {
  const html = renderToStaticMarkup(
    createElement(Icon, {
      name: "check",
      label: "Complete",
      shape: "circle",
      animation: { trigger: "mount", duration: 400, spread: 20 },
    }),
  );

  assert.match(html, /^<svg/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="Complete"/);
  assert.match(html, /dotterel-icon--mount/);
  assert.match(html, /<circle/);
  assert.match(html, /--dotterel-icon-duration:400ms/);
});

test("unlabeled and custom icons are decorative", () => {
  const named = renderToStaticMarkup(createElement(Icon, { name: "star" }));
  const custom = renderToStaticMarkup(
    createElement(DotIcon, {
      rows: [".#.", "###", ".#."],
      shape: "diamond",
    }),
  );

  assert.match(named, /aria-hidden="true"/);
  assert.doesNotMatch(named, /role="img"/);
  assert.match(custom, /<polygon/);
});

test("button and link variants render without framework-specific markup", () => {
  const button = renderToStaticMarkup(
    createElement(
      DotButton,
      {
        variant: "primary",
        status: "busy",
        ripple: { shape: "diamond", duration: 700 },
      },
      "Save",
    ),
  );
  const link = renderToStaticMarkup(
    createElement(DotLink, { href: "/guide", variant: "quiet", ripple: "none" }, "Guide"),
  );
  const adaptedLink = renderToStaticMarkup(
    createElement(
      DotLinkAdapter,
      { variant: "primary" },
      createElement("a", { href: "/router-guide", className: "router-link" }, "Router guide"),
    ),
  );

  assert.match(button, /^<button/);
  assert.match(button, /type="button"/);
  assert.match(button, /aria-busy="true"/);
  assert.match(button, /data-status="busy"/);
  assert.match(button, /dotterel-button__ripple/);
  assert.match(button, /dotterel-button__label/);

  assert.match(link, /^<a/);
  assert.match(link, /href="\/guide"/);
  assert.doesNotMatch(link, /dotterel-button__ripple/);
  assert.match(adaptedLink, /href="\/router-guide"/);
  assert.match(adaptedLink, /dotterel-button--primary/);
  assert.match(adaptedLink, /router-link/);
  assert.match(adaptedLink, /dotterel-button__ripple/);
});

test("progress components expose progressbar semantics and stable endpoints", () => {
  const progress = renderToStaticMarkup(
    createElement(DotProgress, {
      value: 42,
      max: 115,
      count: 10,
      label: "Course progress",
      shape: "circle",
    }),
  );
  const composite = renderToStaticMarkup(
    createElement(DotProgressValue, {
      value: 42,
      max: 115,
      label: "Course progress",
    }),
  );
  const percent = renderToStaticMarkup(createElement(Percent, { value: 42, max: 115 }));

  assert.match(progress, /role="progressbar"/);
  assert.match(progress, /aria-label="Course progress"/);
  assert.match(progress, /aria-valuenow="42"/);
  assert.equal((progress.match(/dotterel-progress__dot/g) ?? []).length, 14);
  assert.match(composite, /dotterel-progress-value/);
  assert.equal(percent, '<span class="dotterel-percent">37%</span>');
});

test("counters render their starting value and announce the target once", () => {
  const countUp = renderToStaticMarkup(
    createElement(DotCount, {
      to: 12345,
      duration: 1200,
      label: "Total downloads",
    }),
  );
  const countDown = renderToStaticMarkup(
    createElement(DotCount, {
      from: 100,
      to: 0,
      decimals: 1,
      suffix: "%",
      startOn: "view",
      font: "inherit",
    }),
  );

  assert.match(countUp, /^<span class="dotterel-count dotterel-text dotterel-text--tabular"/);
  assert.match(countUp, /data-status="idle"/);
  assert.match(countUp, /<span class="dotterel-count__value" aria-hidden="true">0<\/span>/);
  assert.match(
    countUp,
    /<span class="dotterel-count__target">Total downloads 12,345<\/span>/,
  );

  assert.match(countDown, /^<span class="dotterel-count"/);
  assert.doesNotMatch(countDown, /dotterel-text/);
  assert.match(countDown, /aria-hidden="true">100\.0%<\/span>/);
  assert.match(countDown, /<span class="dotterel-count__target">0\.0%<\/span>/);
});

test("dot text applies the bundled display font to any element", () => {
  const heading = renderToStaticMarkup(
    createElement(DotText, { as: "h2", tabular: true }, "score 1200"),
  );
  const inline = renderToStaticMarkup(
    createElement(DotText, { transform: "none", className: "note" }, "Mixed Case"),
  );

  assert.match(heading, /^<h2 class="dotterel-text dotterel-text--uppercase dotterel-text--tabular">/);
  assert.match(heading, /score 1200<\/h2>$/);
  assert.equal(inline, '<span class="dotterel-text note">Mixed Case</span>');
});

test("dot field is a decorative SSR-safe canvas layer", () => {
  const html = renderToStaticMarkup(
    createElement(DotField, {
      placement: "absolute",
      motion: "static",
      color: "rebeccapurple",
    }),
  );

  assert.match(html, /class="dotterel-field"/);
  assert.match(html, /data-placement="absolute"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /--dotterel-field-color:rebeccapurple/);
  assert.match(html, /<canvas class="dotterel-field__canvas"><\/canvas>/);
});

test("the distributed stylesheet contains namespaced tokens and reduced-motion rules", async () => {
  const css = await readFile(new URL("../dist/styles.css", import.meta.url), "utf8");

  assert.match(css, /--dotterel-color-accent:/);
  assert.match(css, /\.dotterel-button/);
  assert.match(css, /\.dotterel-progress/);
  assert.match(css, /\.dotterel-count__target/);
  assert.match(css, /\.dotterel-field/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /(^|\n)\s*\.btn(?:\s|[{,:])/);
});

test("hover icons follow the icon, an explicit host, and interactive ancestors", async () => {
  const css = await readFile(new URL("../dist/styles.css", import.meta.url), "utf8");
  const rule = css.slice(css.indexOf(".dotterel-icon--hover:hover"));
  const selector = rule.slice(0, rule.indexOf("{"));

  assert.match(selector, /\.dotterel-icon--hover:hover \.dotterel-icon__dot/);
  assert.match(selector, /\.dotterel-icon-host:hover \.dotterel-icon--hover/);
  assert.match(selector, /:not\(:disabled, \[aria-disabled="true"\]\)/);

  for (const host of ["button", "a\\[href\\]", "summary", 'role="button"', 'role="tab"']) {
    assert.match(selector, new RegExp(host), `${host} is an icon host`);
  }
});
