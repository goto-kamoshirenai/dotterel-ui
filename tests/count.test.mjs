import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COUNT_EASINGS,
  COUNT_EASING_FUNCTIONS,
  DEFAULT_COUNT_DURATION,
  DEFAULT_COUNT_EASING,
  DEFAULT_COUNT_FORMAT,
  countProgress,
  countValue,
  easingFunction,
  formatCount,
  resolveCountFormat,
  roundTo,
} from "../dist/core/index.js";

test("the easing vocabulary is stable and normalized", () => {
  assert.deepEqual([...COUNT_EASINGS], ["linear", "ease-in", "ease-out", "ease-in-out"]);
  assert.equal(DEFAULT_COUNT_EASING, "ease-out");
  assert.ok(Number.isInteger(DEFAULT_COUNT_DURATION) && DEFAULT_COUNT_DURATION > 0);

  for (const easing of COUNT_EASINGS) {
    const curve = COUNT_EASING_FUNCTIONS[easing];

    assert.equal(curve(0), 0, `${easing} must start at 0`);
    assert.equal(curve(1), 1, `${easing} must end at 1`);

    let previous = -1;

    for (let step = 0; step <= 10; step += 1) {
      const current = curve(step / 10);

      assert.ok(current >= previous, `${easing} must not move backwards`);
      previous = current;
    }
  }

  assert.ok(COUNT_EASING_FUNCTIONS["ease-out"](0.5) > 0.5);
  assert.ok(COUNT_EASING_FUNCTIONS["ease-in"](0.5) < 0.5);
  assert.equal(COUNT_EASING_FUNCTIONS.linear(0.25), 0.25);
});

test("easing selection accepts names and custom functions", () => {
  assert.equal(easingFunction("linear"), COUNT_EASING_FUNCTIONS.linear);
  assert.equal(easingFunction(), COUNT_EASING_FUNCTIONS[DEFAULT_COUNT_EASING]);

  const custom = (progress) => progress ** 2;

  assert.equal(easingFunction(custom), custom);
});

test("progress is clamped and treats a zero duration as finished", () => {
  assert.equal(countProgress(0, 1000), 0);
  assert.equal(countProgress(-50, 1000), 0);
  assert.equal(countProgress(500, 1000), 0.5);
  assert.equal(countProgress(4000, 1000), 1);
  assert.equal(countProgress(10, 0), 1);
  assert.equal(countProgress(10, Number.NaN), 1);
  assert.equal(countProgress(Number.NaN, 1000), 0);
});

test("counting interpolates upwards and downwards without overshooting", () => {
  assert.equal(countValue(0, 100, 0), 0);
  assert.equal(countValue(0, 100, 1), 100);
  assert.equal(countValue(0, 100, 0.5, "linear"), 50);
  assert.equal(countValue(100, 0, 0.5, "linear"), 50);
  assert.equal(countValue(100, 0, 1), 0);
  assert.equal(countValue(-20, 20, 0.5, "linear"), 0);
  assert.equal(countValue(0, 100, 2), 100);
  assert.equal(countValue(0, 100, -1), 0);
  assert.equal(countValue(0, 100, 0.5, (progress) => progress ** 2), 25);
  assert.equal(countValue(Number.NaN, 100, 0), 0);
  assert.equal(countValue(7, Number.NaN, 1), 7);

  let previous = Number.NEGATIVE_INFINITY;

  for (let step = 0; step <= 20; step += 1) {
    const current = countValue(0, 250, step / 20);

    assert.ok(current >= previous && current <= 250);
    previous = current;
  }
});

test("formatting groups digits, keeps decimals, and wraps affixes", () => {
  assert.deepEqual(resolveCountFormat(), DEFAULT_COUNT_FORMAT);
  assert.equal(formatCount(0), "0");
  assert.equal(formatCount(999), "999");
  assert.equal(formatCount(1000), "1,000");
  assert.equal(formatCount(1234567), "1,234,567");
  assert.equal(formatCount(1234567, { separator: "" }), "1234567");
  assert.equal(formatCount(1234567, { separator: " " }), "1 234 567");
  assert.equal(formatCount(1234.567, { decimals: 2 }), "1,234.57");
  assert.equal(formatCount(-1234.567, { decimals: 2 }), "-1,234.57");
  assert.equal(formatCount(-0.004, { decimals: 2 }), "0.00");
  assert.equal(formatCount(0.5, { decimals: 1, prefix: "$" }), "$0.5");
  assert.equal(formatCount(-5, { prefix: "$" }), "-$5");
  assert.equal(formatCount(42, { suffix: "%" }), "42%");
  assert.equal(formatCount(1234.5, { decimals: 1, separator: ".", decimal: "," }), "1.234,5");
  assert.equal(formatCount(1.2345, { decimals: -3 }), "1");
  assert.equal(formatCount(Number.NaN), "0");
  assert.equal(formatCount(Number.POSITIVE_INFINITY), "0");
});

test("rounding stays finite and honours the requested precision", () => {
  assert.equal(roundTo(1.2345, 2), 1.23);
  assert.equal(roundTo(1.9), 2);
  assert.equal(roundTo(-1.55, 1), -1.6);
  assert.equal(roundTo(Number.NaN, 2), 0);
});
