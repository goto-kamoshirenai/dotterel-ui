import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("all documented JavaScript export paths resolve", async () => {
  const [root, button, core, effects, icon, progress] = await Promise.all([
    import("dotterel-ui"),
    import("dotterel-ui/button"),
    import("dotterel-ui/core"),
    import("dotterel-ui/effects"),
    import("dotterel-ui/icon"),
    import("dotterel-ui/progress"),
  ]);

  assert.equal(root.DotButton, button.DotButton);
  assert.equal(root.ratioOf, core.ratioOf);
  assert.equal(root.DotField, effects.DotField);
  assert.equal(root.Icon, icon.Icon);
  assert.equal(root.DotProgress, progress.DotProgress);
});

test("package metadata keeps React external and exposes the stylesheet", async () => {
  const metadata = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.equal(metadata.dependencies, undefined);
  assert.equal(metadata.peerDependencies.react, ">=18.2.0 <20");
  assert.equal(metadata.exports["./styles.css"], "./dist/styles.css");
  assert.deepEqual(metadata.sideEffects, ["./dist/styles.css"]);
});
