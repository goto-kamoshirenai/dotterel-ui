import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** ライブラリ本体のソースを指す。dist を経由しないので再ビルドなしで確認できる */
const librarySource = (path: string) =>
  fileURLToPath(new URL(`../src/${path}`, import.meta.url));

/** 表示するバージョンはライブラリ本体の package.json を正本にする */
const libraryVersion: string = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;

/**
 * showcase は npm 利用者と同じ公開名で import する。
 * ここの alias は開発速度のためだけに使い、内部ファイルへは決して向けない。
 */
export default defineConfig({
  base: process.env.SHOWCASE_BASE ?? "/",
  define: {
    __DOTTEREL_VERSION__: JSON.stringify(libraryVersion),
  },
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^dotterel-ui\/styles\.css$/, replacement: librarySource("styles.css") },
      { find: /^dotterel-ui\/fonts\/(.+)$/, replacement: librarySource("fonts/$1") },
      {
        find: /^dotterel-ui\/(button|core|count|effects|icon|progress|text)$/,
        replacement: librarySource("$1/index.ts"),
      },
      { find: /^dotterel-ui$/, replacement: librarySource("index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: true,
  },
});
