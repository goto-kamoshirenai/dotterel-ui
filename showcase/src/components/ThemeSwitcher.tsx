import { Icon } from "dotterel-ui/icon";

import { THEME_CHOICES, THEME_LABELS, type ThemeChoice } from "../theme";

const THEME_ICONS: Readonly<Record<ThemeChoice, "settings" | "theme-light" | "theme-dark">> = {
  system: "settings",
  light: "theme-light",
  dark: "theme-dark",
};

type ThemeSwitcherProps = {
  readonly value: ThemeChoice;
  readonly onChange: (choice: ThemeChoice) => void;
};

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
  return (
    <fieldset className="switcher">
      <legend className="switcher__legend">テーマ</legend>
      <div className="switcher__options">
        {THEME_CHOICES.map((choice) => (
          <label key={choice} className="switcher__option">
            <input
              type="radio"
              name="showcase-theme"
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
            />
            <Icon name={THEME_ICONS[choice]} size="sm" animation="hover" />
            <span>{THEME_LABELS[choice]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
