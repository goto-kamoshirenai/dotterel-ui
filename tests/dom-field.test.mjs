import assert from "node:assert/strict";
import { test } from "node:test";
import { installDom } from "./helpers/dom-environment.mjs";

const environment = installDom();
const { document, flushFrame, window } = environment;
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { DotField } = await import("dotterel-ui/effects");
const { mountDotField } = await import("dotterel-ui/dom");

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// jsdom は Canvas を描けないので、描いた矩形だけを記録する文脈を渡す
const drawn = [];
window.HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    fillStyle: "",
    setTransform() {},
    clearRect() {},
    fillRect(x, y, width, height) {
      drawn.push([x, y, width, height]);
    },
    beginPath() {},
    arc() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {},
  };
};
Object.defineProperty(window.HTMLCanvasElement.prototype, "clientWidth", {
  configurable: true,
  get: () => 120,
});
Object.defineProperty(window.HTMLCanvasElement.prototype, "clientHeight", {
  configurable: true,
  get: () => 60,
});

function fromMarkup(markup) {
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  return container;
}

test("mountDotField builds the same markup DotField renders", () => {
  const props = { placement: "absolute", motion: "static", color: "rebeccapurple" };
  const expected = fromMarkup(renderToStaticMarkup(createElement(DotField, props)));
  const target = document.createElement("div");
  document.body.append(target);

  const handle = mountDotField(target, props);

  assert.equal(target.firstElementChild, handle.element);
  assert.equal(handle.element.className, "dotterel-field");
  assert.equal(handle.element.getAttribute("data-placement"), "absolute");
  assert.equal(handle.element.getAttribute("aria-hidden"), "true");
  assert.equal(handle.element.style.getPropertyValue("--dotterel-field-color"), "rebeccapurple");
  assert.deepEqual(
    handle.element.getAttributeNames(),
    expected.firstElementChild.getAttributeNames(),
  );
  // Canvas は描いた時点で寸法の属性が付く。クラスと数だけを比べる
  assert.equal(handle.element.children.length, 1);
  assert.equal(
    handle.element.firstElementChild.outerHTML.replace(/ width="\d+" height="\d+"/, ""),
    expected.firstElementChild.innerHTML,
  );

  handle.destroy();
  assert.equal(target.children.length, 0);
});

test("a static field draws once on whole device pixels", () => {
  drawn.length = 0;
  const target = document.createElement("div");
  document.body.append(target);
  const handle = mountDotField(target, { motion: "static", density: 1 });
  const canvas = handle.element.querySelector("canvas");

  assert.equal(canvas.width, 120);
  assert.equal(canvas.height, 60);
  assert.ok(drawn.length > 0);
  assert.equal(environment.pendingFrames(), 0);

  for (const values of drawn) {
    assert.ok(values.every(Number.isInteger), `${values} are whole pixels`);
    assert.equal(values[2], 2);
    assert.equal(values[3], 2);
  }

  handle.destroy();
});

test("an animated field runs on frames, honours reduced motion and stops on destroy", () => {
  const target = document.createElement("div");
  document.body.append(target);
  const animated = mountDotField(target, { motion: "auto" });

  assert.equal(environment.pendingFrames(), 1);
  drawn.length = 0;
  flushFrame(1000);
  assert.ok(drawn.length > 0);
  assert.equal(environment.pendingFrames(), 1);

  animated.destroy();
  assert.equal(environment.pendingFrames(), 0);
  assert.equal(target.children.length, 0);

  // 動きを減らす設定では、auto は1枚だけ描いて止まる
  environment.setMedia(REDUCED_MOTION, true);
  const reduced = mountDotField(target, { motion: "auto" });
  assert.equal(environment.pendingFrames(), 0);
  reduced.destroy();
  environment.setMedia(REDUCED_MOTION, false);
});

test("a statically rendered field is reused and kept on destroy", () => {
  const container = fromMarkup(
    renderToStaticMarkup(createElement(DotField, { placement: "absolute", motion: "static" })),
  );
  const field = container.firstElementChild;
  const canvas = field.querySelector("canvas");

  const handle = mountDotField(field, { motion: "static" });

  assert.equal(handle.element, field);
  assert.equal(field.querySelectorAll("canvas").length, 1);
  assert.equal(field.querySelector("canvas"), canvas);
  assert.equal(canvas.width, 120);

  handle.destroy();
  assert.equal(container.firstElementChild, field);
  assert.equal(field.querySelector("canvas"), canvas);
});
