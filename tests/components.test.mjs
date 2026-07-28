import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DotButton,
  DotField,
  DotIcon,
  DotLink,
  DotLinkAdapter,
  DotProgress,
  DotProgressValue,
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
  assert.match(css, /\.dotterel-field/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /(^|\n)\s*\.btn(?:\s|[{,:])/);
});
