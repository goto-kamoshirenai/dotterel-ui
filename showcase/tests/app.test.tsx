import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "../src/App";
import { THEME_STORAGE_KEY, applyTheme, readStoredTheme } from "../src/theme";

describe("テーマ切り替え", () => {
  it("選択した値が data-dotterel-theme と localStorage へ入る", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("radio", { name: /ダーク/ }));

    expect(document.documentElement.getAttribute("data-dotterel-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("OS設定では属性を外す", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("radio", { name: /ライト/ }));
    expect(document.documentElement.getAttribute("data-dotterel-theme")).toBe("light");

    await user.click(screen.getByRole("radio", { name: /OS設定/ }));
    expect(document.documentElement.hasAttribute("data-dotterel-theme")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("保存済みの値を読み戻す", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");

    localStorage.setItem(THEME_STORAGE_KEY, "unknown");
    expect(readStoredTheme()).toBe("system");
  });

  it("localStorage が使えなくても表示は続く", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };

    try {
      expect(() => applyTheme("dark")).not.toThrow();
      expect(document.documentElement.getAttribute("data-dotterel-theme")).toBe("dark");
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});

describe("ページ構成", () => {
  it("公開しているすべてのセクションに見出しがある", () => {
    render(<App />);

    for (const label of [
      "アイコン",
      "ボタンとリンク",
      "数値",
      "進捗",
      "背景効果",
      "表示用テキスト",
      "テーマ変数",
    ]) {
      expect(screen.getByRole("heading", { name: label, level: 2 })).toBeInTheDocument();
    }
  });

  it("表示中のライブラリバージョンを載せる", () => {
    render(<App />);

    expect(screen.getAllByText(/\d+\.\d+\.\d+/).length).toBeGreaterThan(0);
  });
});
