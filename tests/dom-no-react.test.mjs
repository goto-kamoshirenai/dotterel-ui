import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** import / export ... from / import() の読み込み先を拾う。コメント内の使用例は除く */
function specifiersOf(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;
  return [...code.matchAll(pattern)].map((match) => match[1]);
}

/** 入口から相対の読み込みをたどり、読んだファイルと外部の読み込み先を集める */
async function walk(entry) {
  const visited = new Set();
  const external = new Set();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.shift();

    if (visited.has(file)) {
      continue;
    }

    visited.add(file);

    for (const specifier of specifiersOf(await readFile(file, "utf8"))) {
      if (specifier.startsWith(".")) {
        // 型定義からは、同じ名前の .d.ts をたどる
        const target = file.endsWith(".d.ts") ? specifier.replace(/\.js$/, ".d.ts") : specifier;
        queue.push(resolve(dirname(file), target));
      } else {
        external.add(specifier);
      }
    }
  }

  return { visited, external };
}

test("the built dotterel-ui/dom entry never reaches react, in code or in types", async () => {
  for (const entry of ["dist/dom/index.js", "dist/dom/index.d.ts"]) {
    const { visited, external } = await walk(resolve(projectRoot, entry));

    assert.ok(visited.size > 1, `${entry} imports its modules`);
    assert.deepEqual([...external], [], `${entry} has no external imports`);

    for (const file of visited) {
      assert.doesNotMatch(file, /\.tsx$|[\\/](button|count|effects|icon|progress|text)[\\/]/);
    }
  }
});

test("no source file of the DOM entry or the shared cores imports react", async () => {
  const directories = ["src/dom", "src/internal", "src/core"];

  for (const directory of directories) {
    const names = await readdir(resolve(projectRoot, directory));

    for (const name of names) {
      const source = await readFile(resolve(projectRoot, directory, name), "utf8");

      assert.ok(!name.endsWith(".tsx"), `${directory}/${name} must not be JSX`);
      for (const specifier of specifiersOf(source)) {
        assert.doesNotMatch(specifier, /^react(?:-dom)?(?:\/|$)/, `${directory}/${name}`);
      }
    }
  }
});
