import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { IconApiDemos } from "../src/components/IconApiDemos";

describe("IconApiDemos", () => {
  it("文字が隣にあるアイコンは読み上げ対象にしない", () => {
    const { container } = render(<IconApiDemos />);

    const deleteButton = screen.getByRole("button", { name: "削除" });
    const decorative = deleteButton.querySelector("svg");

    expect(decorative).not.toBeNull();
    expect(decorative?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".subsection")).not.toBeNull();
  });

  it("アイコンだけの表示には名前が付く", () => {
    render(<IconApiDemos />);

    expect(screen.getByRole("button", { name: "お気に入りへ追加" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "お気に入り" })).toBeInTheDocument();
  });

  it("DotIcon は渡した行列どおりに点灯する", () => {
    render(<IconApiDemos />);

    // "..#..", "..#..", "#####", "..#..", "..#.." は 5 + 4 = 9 個
    const spark = screen.getByRole("img", { name: "強調" });

    expect(spark.querySelectorAll("polygon")).toHaveLength(9);
  });

  it("createDotIcon の部品は Icon と同じ props を受ける", () => {
    const { container } = render(<IconApiDemos />);

    const leaves = Array.from(container.querySelectorAll(".demo")).at(-1);
    const [plain, styled] = Array.from(leaves?.querySelectorAll(".demo__stage svg") ?? []);

    expect(plain?.getAttribute("width")).toBe("18");
    expect(styled?.getAttribute("width")).toBe("27");
    expect(styled?.querySelector("circle")).not.toBeNull();
  });

  it("コード例は公開 API だけを使う", () => {
    const { container } = render(<IconApiDemos />);

    const code = Array.from(container.querySelectorAll(".demo__code code"))
      .map((node) => node.textContent ?? "")
      .join("\n");

    expect(code).toContain("createDotIcon");
    expect(code).toContain("<DotIcon rows={SPARK_ROWS}");
    expect(code).not.toContain("../src/");
    expect(code).not.toContain("definitions");
  });
});
