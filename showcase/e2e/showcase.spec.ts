import { expect, test } from "@playwright/test";

const SECTION_HEADINGS = [
  "アイコン",
  "ボタンとリンク",
  "数値",
  "進捗",
  "背景効果",
  "表示用テキスト",
  "テーマ変数",
];

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("主要セクションへ到達できる", async ({ page }) => {
  for (const heading of SECTION_HEADINGS) {
    await expect(page.getByRole("heading", { name: heading, level: 2 })).toBeAttached();
  }

  await page.getByRole("link", { name: "テーマ変数" }).click();
  await expect(page.getByRole("heading", { name: "テーマ変数", level: 2 })).toBeInViewport();
});

test("base path 配下で CSS・フォント・JS が読み込める", async ({ page }) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("./", { waitUntil: "networkidle" });

  expect(failures).toEqual([]);

  // dotterel のトークンが読み込めていれば :root に値が入る
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--dotterel-color-accent").trim(),
  );
  expect(accent).not.toBe("");

  await expect(page.locator(".dotterel-icon").first()).toBeVisible();

  // 同梱フォントが base path 配下から読めている
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('16px "Dotterel Dots"')))
    .toBe(true);
});

test("全アイコンを並べてもレイアウトが横へあふれない", async ({ page }) => {
  const cards = page.locator(".icon-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(50);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("キーボードだけで検索、テーマ変更、コピーを操作できる", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  const search = page.getByRole("searchbox", { name: "検索" });
  await search.focus();
  await page.keyboard.type("trash");
  await expect(page.locator(".icon-card")).toHaveCount(1);

  const copy = page.getByRole("button", { name: "trash の JSX をコピー" });
  await copy.focus();
  await expect(copy).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("コピーしました").first()).toBeVisible();

  const dark = page.getByRole("radio", { name: /ダーク/ });
  await dark.focus();
  await page.keyboard.press("Space");

  await expect(page.locator("html")).toHaveAttribute("data-dotterel-theme", "dark");
});

test("アイコンだけのボタンに読み上げ名がある", async ({ page }) => {
  const iconOnly = page.getByRole("button", { name: "この行を削除" });
  await expect(iconOnly).toBeVisible();
  await expect(iconOnly).toHaveAccessibleName("この行を削除");
});

test("プルダウンがドットで開き、キーボードで選べる", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const select = page.getByRole("combobox", { name: "表示密度" });
  const panel = page.locator(".dotterel-select__panel");
  await select.click();
  await expect(panel).toBeVisible();
  const revealCells = panel.locator(".dotterel-select__reveal .dotterel-ripple__cell");
  await expect(revealCells.first()).toBeAttached();
  await expect(panel.locator(".dotterel-select__surface")).toHaveCSS("animation-name", "dotterel-select-surface");
  const firstDelay = await revealCells.first().evaluate((cell) => parseFloat(getComputedStyle(cell).animationDelay));
  const lastDelay = await revealCells.last().evaluate((cell) => parseFloat(getComputedStyle(cell).animationDelay));
  expect(lastDelay).toBeGreaterThan(firstDelay);
  const timing = await panel.evaluate((element) => {
    const cells = [...element.querySelectorAll(".dotterel-select__reveal .dotterel-ripple__cell")];
    const lastDot = Math.max(...cells.map((cell) => {
      const style = getComputedStyle(cell);
      return parseFloat(style.animationDelay) + parseFloat(style.animationDuration);
    }));
    const surface = element.querySelector(".dotterel-select__surface")!;
    return {
      lastDot,
      surfaceStart: parseFloat(getComputedStyle(surface).animationDelay),
      overflows: surface.scrollWidth > surface.clientWidth || surface.scrollHeight > surface.clientHeight,
    };
  });
  expect(timing.surfaceStart).toBeGreaterThan(timing.lastDot);
  expect(timing.overflows).toBe(false);
  const midFade = await panel.evaluate((element) => {
    const reveal = element.querySelector(".dotterel-select__reveal")!;
    const surface = element.querySelector(".dotterel-select__surface")!;
    const middle = parseFloat(getComputedStyle(surface).animationDelay) * 1000 + 110;
    const animations = [...reveal.getAnimations(), ...surface.getAnimations()];
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = middle;
    }
    const state = {
      revealOpacity: getComputedStyle(reveal).opacity,
      dotBackground: getComputedStyle(reveal.querySelector(".dotterel-ripple__cell")!).backgroundColor,
      surfaceOpacity: parseFloat(getComputedStyle(surface).opacity),
      surfaceBackground: getComputedStyle(surface).backgroundColor,
    };
    for (const animation of animations) animation.finish();
    return state;
  });
  expect(midFade.revealOpacity).toBe("1");
  expect(midFade.surfaceOpacity).toBeGreaterThan(0);
  expect(midFade.surfaceOpacity).toBeLessThan(1);
  expect(midFade.dotBackground).toBe(midFade.surfaceBackground);
  await expect(revealCells.first()).toHaveCSS("opacity", "1");
  await expect(revealCells.last()).toHaveCSS("opacity", "1");
  const reveal = panel.locator(".dotterel-select__reveal");
  await expect(reveal).toHaveCSS("visibility", "hidden");
  await expect(reveal).toHaveCSS("opacity", "0");
  const option = page.getByRole("option", { name: "コンパクト" });
  await option.hover();
  await expect(option.locator(".dotterel-ripple__cell").first()).toHaveCSS("opacity", "1");
  await expect(reveal).toHaveCSS("visibility", "hidden");
  await expect(reveal).toHaveCSS("opacity", "0");
  await page.keyboard.press("Enter");
  await expect(select).toContainText("コンパクト");
  await expect(panel).toBeHidden();
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme} でアイコン一覧が判別できる`, async ({ page }) => {
    // ラジオ自体は視覚的に隠しているので、実際の操作と同じくラベルを押す
    await page
      .locator(".switcher__option", { hasText: theme === "light" ? "ライト" : "ダーク" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-dotterel-theme", theme);

    const stage = page.locator(".icon-card__stage").first();
    await expect(stage).toBeVisible();

    const contrast = await stage.evaluate((element) => {
      const iconColor = getComputedStyle(element).color;
      const surface = getComputedStyle(document.body).backgroundColor;
      return { iconColor, surface };
    });

    expect(contrast.iconColor).not.toBe(contrast.surface);
  });
}
