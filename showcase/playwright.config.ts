import { defineConfig, devices } from "@playwright/test";

/**
 * GitHub Pages と同じ base path で配信して確かめる。
 * アニメーションは reduced motion で止め、スクリーンショットを安定させる。
 */
const BASE_PATH = "/dotterel-ui/";
const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  // 基準画像はフォント描画が OS ごとに違うため、実行環境ごとに分けて置く
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    contextOptions: { reducedMotion: "reduce" },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { SHOWCASE_BASE: BASE_PATH },
  },
});
