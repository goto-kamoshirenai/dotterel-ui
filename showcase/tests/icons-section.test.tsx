import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ICON_NAMES } from "dotterel-ui/icon";

import { ICON_METADATA } from "../src/catalog/icon-metadata";
import { iconSnippet } from "../src/components/IconCard";
import { IconsSection } from "../src/sections/IconsSection";

function cardNames(): string[] {
  return screen
    .getAllByRole("listitem")
    .map((item) => item.querySelector(".icon-card__name")?.textContent ?? "");
}

describe("IconsSection", () => {
  it("ICON_NAMES の全アイコンをカードとして並べる", () => {
    render(<IconsSection />);

    const names = cardNames();

    expect(names).toHaveLength(ICON_NAMES.length);
    expect(new Set(names)).toEqual(new Set(ICON_NAMES));
  });

  it("メタデータは全アイコン分そろっている", () => {
    for (const name of ICON_NAMES) {
      expect(ICON_METADATA[name], `${name} のメタデータ`).toBeDefined();
      expect(ICON_METADATA[name].keywords.length).toBeGreaterThan(0);
    }

    expect(Object.keys(ICON_METADATA)).toHaveLength(ICON_NAMES.length);
  });

  it("アイコン名で絞り込める", async () => {
    const user = userEvent.setup();
    render(<IconsSection />);

    await user.type(screen.getByRole("searchbox", { name: "検索" }), "bookmark");

    expect(cardNames()).toEqual(["bookmark", "bookmark-filled"]);
  });

  it("日本語のキーワードで絞り込める", async () => {
    const user = userEvent.setup();
    render(<IconsSection />);

    await user.type(screen.getByRole("searchbox", { name: "検索" }), "出版社");

    expect(cardNames()).toEqual(["building"]);
  });

  it("一致しないときは空の案内を出す", async () => {
    const user = userEvent.setup();
    render(<IconsSection />);

    await user.type(screen.getByRole("searchbox", { name: "検索" }), "該当しない語");

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText(/一致しませんでした/)).toBeInTheDocument();
  });

  it("サイズと形の切り替えが全カードへ反映される", async () => {
    const user = userEvent.setup();
    const { container } = render(<IconsSection />);

    await user.click(screen.getByRole("radio", { name: "lg" }));
    await user.click(screen.getByRole("radio", { name: "circle" }));

    const stages = container.querySelectorAll(".icon-card__stage svg");

    expect(stages).toHaveLength(ICON_NAMES.length);
    for (const stage of stages) {
      // lg は dot 3 / gap 3 なので 5 セルで 27
      expect(stage.getAttribute("width")).toBe("27");
      expect(stage.querySelector("circle")).not.toBeNull();
    }
  });

  it("コピーするコードは公開 API の JSX になる", () => {
    expect(iconSnippet("book", { size: "md", shape: "square", animation: "none" })).toBe(
      '<Icon name="book" />',
    );
    expect(iconSnippet("trash", { size: "lg", shape: "circle", animation: "hover" })).toBe(
      '<Icon name="trash" size="lg" shape="circle" animation="hover" />',
    );
  });

  it("アイコンだけの操作にはアクセシブルネームがある", () => {
    render(<IconsSection />);

    const card = screen.getAllByRole("listitem")[0];
    expect(card).toBeDefined();
    expect(
      within(card as HTMLElement).getByRole("button", { name: /の JSX をコピー/ }),
    ).toBeInTheDocument();
  });
});
