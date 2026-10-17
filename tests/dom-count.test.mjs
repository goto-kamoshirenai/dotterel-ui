import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { test } from "node:test";
import { installDom } from "./helpers/dom-environment.mjs";

// react-dom/client は読み込んだ時点で DOM の有無を見るので、先に環境を用意する
const environment = installDom();
const { document, flushFrame } = environment;
const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { renderToStaticMarkup } = await import("react-dom/server");
const { DotCount } = await import("dotterel-ui/count");
const { createCountRunner, mountDotCount, resolveCountSettings } = await import(
  "dotterel-ui/dom"
);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function recordingRunner(options) {
  const log = { values: [], statuses: [], started: 0, completed: 0 };
  const runner = createCountRunner(
    resolveCountSettings({
      ...options,
      onStart: () => {
        log.started += 1;
      },
      onComplete: () => {
        log.completed += 1;
      },
    }),
    {
      onValue: (value) => log.values.push(value),
      onStatus: (status) => log.statuses.push(status),
    },
  );
  return { runner, log, value: () => log.values.at(-1) };
}

function fromMarkup(markup) {
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  return container.firstElementChild;
}

test("the runner counts frame by frame and settles on the target", () => {
  const { runner, log, value } = recordingRunner({
    to: 100,
    duration: 1000,
    easing: "linear",
    motion: "always",
  });

  assert.equal(runner.status(), "idle");
  runner.start();
  assert.equal(runner.status(), "counting");
  assert.equal(log.started, 1);
  assert.equal(value(), 0);

  flushFrame(1000);
  assert.equal(value(), 0);
  flushFrame(1500);
  assert.equal(value(), 50);
  flushFrame(2000);
  assert.equal(value(), 100);
  assert.equal(runner.status(), "completed");
  assert.equal(log.completed, 1);
  assert.equal(environment.pendingFrames(), 0);
});

test("the runner waits for the delay before the first frame", async () => {
  const { runner, value } = recordingRunner({
    to: 10,
    duration: 100,
    delay: 30,
    easing: "linear",
    motion: "always",
  });

  runner.start();
  assert.equal(runner.status(), "counting");
  assert.equal(environment.pendingFrames(), 0);

  await wait(60);
  assert.equal(environment.pendingFrames(), 1);
  flushFrame(1000);
  flushFrame(1100);
  assert.equal(value(), 10);
  assert.equal(runner.status(), "completed");
});

test("pause stops the clock, resume continues and reset returns to the origin", () => {
  const { runner, log, value } = recordingRunner({
    from: 0,
    to: 100,
    duration: 1000,
    easing: "linear",
    motion: "always",
  });

  runner.start();
  flushFrame(1000);
  flushFrame(1400);
  assert.equal(value(), 40);

  runner.pause();
  assert.equal(runner.status(), "paused");
  assert.equal(environment.pendingFrames(), 0);
  // 一時停止していない状態での resume、数えていない状態での pause は何もしない
  runner.pause();
  assert.equal(runner.status(), "paused");

  runner.resume();
  assert.equal(runner.status(), "counting");
  // 止めていたあいだの時間は数えない
  flushFrame(9000);
  assert.equal(value(), 40);
  flushFrame(9300);
  assert.equal(value(), 70);

  runner.reset();
  assert.equal(runner.status(), "idle");
  assert.equal(value(), 0);
  assert.equal(environment.pendingFrames(), 0);
  runner.resume();
  assert.equal(runner.status(), "idle");
  assert.equal(log.completed, 0);
});

test("motion none and reduced motion jump straight to the target", () => {
  const none = recordingRunner({ to: 42, duration: 1000, motion: "none" });
  none.runner.start();
  assert.equal(none.value(), 42);
  assert.equal(none.runner.status(), "completed");
  assert.equal(none.log.completed, 1);
  assert.equal(environment.pendingFrames(), 0);

  environment.setMedia(REDUCED_MOTION, true);

  const auto = recordingRunner({ to: 7, duration: 1000 });
  auto.runner.start();
  assert.equal(auto.value(), 7);
  assert.equal(auto.runner.status(), "completed");

  // always は動きを減らす設定でも数える
  const always = recordingRunner({ to: 7, duration: 1000, motion: "always" });
  always.runner.start();
  assert.equal(always.runner.status(), "counting");
  always.runner.reset();

  environment.setMedia(REDUCED_MOTION, false);
});

test("mountDotCount builds the same markup DotCount renders", () => {
  const cases = [
    { to: 12345, label: "Total downloads" },
    { from: 100, to: 0, decimals: 1, suffix: "%", font: "inherit" },
    { to: 120, density: "compact", prefix: "$" },
  ];

  for (const options of cases) {
    const expected = fromMarkup(renderToStaticMarkup(createElement(DotCount, options)));
    const element = document.createElement("span");
    document.body.append(element);
    const handle = mountDotCount(element, { ...options, startOn: "manual" });

    assert.equal(element.outerHTML, expected.outerHTML);
    handle.destroy();
  }
});

test("mountDotCount reuses statically rendered markup and keeps its label", () => {
  const host = fromMarkup(
    renderToStaticMarkup(createElement(DotCount, { to: 12345, label: "Total" })),
  );
  const valuePart = host.querySelector(".dotterel-count__value");
  const completed = [];
  const handle = mountDotCount(host, {
    to: 12345,
    duration: 1000,
    motion: "always",
    onComplete: () => completed.push(true),
  });

  assert.equal(host.querySelectorAll(".dotterel-count__value").length, 1);
  assert.equal(host.querySelector(".dotterel-count__target").textContent, "Total 12,345");

  // 既定 (startOn="mount") は次のフレームで始める
  assert.equal(handle.status(), "idle");
  flushFrame(1000);
  assert.equal(handle.status(), "counting");
  assert.equal(host.getAttribute("data-status"), "counting");
  flushFrame(1001);
  flushFrame(2001);
  assert.equal(handle.status(), "completed");
  assert.equal(host.getAttribute("data-status"), "completed");
  assert.equal(valuePart.textContent, "12,345");
  assert.equal(host.querySelector(".dotterel-count__value"), valuePart);
  assert.deepEqual(completed, [true]);
  handle.destroy();
});

test("mountDotCount can wait until the element is in view", () => {
  const element = document.createElement("span");
  document.body.append(element);
  const handle = mountDotCount(element, { to: 5, motion: "none", startOn: "view" });

  assert.equal(environment.pendingFrames(), 0);
  assert.equal(handle.status(), "idle");
  environment.intersectAll();
  assert.equal(handle.status(), "completed");
  assert.equal(element.querySelector(".dotterel-count__value").textContent, "5");
  handle.destroy();
});

test("autoStart false waits for start, and destroy stops everything", () => {
  const element = document.createElement("span");
  document.body.append(element);
  const handle = mountDotCount(element, {
    to: 100,
    duration: 1000,
    motion: "always",
    autoStart: false,
  });

  assert.equal(environment.pendingFrames(), 0);
  handle.start();
  assert.equal(handle.status(), "counting");
  assert.equal(environment.pendingFrames(), 1);

  handle.destroy();
  assert.equal(environment.pendingFrames(), 0);
  handle.start();
  assert.equal(environment.pendingFrames(), 0);
  assert.equal(element.querySelector(".dotterel-count__value").textContent, "0");
});

test("useDotCount on the shared runner ends with the same markup as mountDotCount", async () => {
  const options = { to: 2048, duration: 1000, motion: "always", suffix: " PT" };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(createElement(DotCount, options));
  });

  const element = document.createElement("span");
  document.body.append(element);
  const handle = mountDotCount(element, options);

  for (const time of [1000, 1001, 1500, 2001]) {
    await act(async () => flushFrame(time));
  }

  const rendered = container.firstElementChild;
  assert.equal(rendered.getAttribute("data-status"), "completed");
  assert.equal(rendered.querySelector(".dotterel-count__value").textContent, "2,048 PT");
  assert.equal(element.outerHTML, rendered.outerHTML);

  handle.destroy();
  await act(async () => root.unmount());
});
