import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DotSelect } from "dotterel-ui/select";

const options = [
  { value: "a", label: "標準" },
  { value: "b", label: "コンパクト" },
  { value: "c", label: "選択不可", disabled: true },
];

describe("DotSelect", () => {
  it("キーボードで候補を選び、値を通知する", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DotSelect aria-label="表示密度" options={options} onValueChange={onValueChange} name="density" />);

    const trigger = screen.getByRole("combobox", { name: "表示密度" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(trigger).toHaveTextContent("コンパクト");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(document.querySelector('input[name="density"]')).toHaveValue("b");
  });

  it("無効な候補を飛ばし、Escape で閉じる", async () => {
    const user = userEvent.setup();
    render(<DotSelect aria-label="表示密度" options={options} />);

    const trigger = screen.getByRole("combobox", { name: "表示密度" });
    await user.click(trigger);
    await user.keyboard("{End}");
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "コンパクト" }).id);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
