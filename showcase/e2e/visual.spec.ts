import { expect, test } from "@playwright/test";

/**
 * 画像比較は 4 箇所だけに絞る。全ページを比べると、アイコンを 1 つ足しただけで
 * 無関係な差分が大きくなり、確認の役に立たなくなる。
 *
 * 基準画像はフォント描画が OS ごとに違うため、実行環境ごとに持つ。
 * 基準画像が無い環境で失敗しないよう、SHOWCASE_VISUAL=1 のときだけ動かす。
 */
const TARGETS = [
  { name: "icons", selector: "#icons .icon-grid" },
  { name: "buttons", selector: "#buttons .demo-grid" },
  { name: "progress", selector: "#progress .demo-grid" },
  { name: "effects", selector: "#effects .demo-grid" },
] as const;

test.describe("見た目の固定", () => {
  test.skip(
    process.env.SHOWCASE_VISUAL !== "1",
    "基準画像を持つ環境でだけ実行する (SHOWCASE_VISUAL=1)",
  );

  for (const target of TARGETS) {
    test(`${target.name} が変わっていない`, async ({ page }) => {
      await page.goto("./");

      const region = page.locator(target.selector);
      await expect(region).toBeVisible();
      await expect(region).toHaveScreenshot(`${target.name}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
