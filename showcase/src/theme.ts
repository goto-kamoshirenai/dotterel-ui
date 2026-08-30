export const THEME_CHOICES = ["system", "light", "dark"] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const THEME_STORAGE_KEY = "dotterel-showcase-theme";

export const THEME_LABELS: Readonly<Record<ThemeChoice, string>> = {
  system: "OS設定",
  light: "ライト",
  dark: "ダーク",
};

function isThemeChoice(value: string | null): value is ThemeChoice {
  return value !== null && (THEME_CHOICES as readonly string[]).includes(value);
}

/** index.html の初期化スクリプトが当てた値を読み戻す */
export function readStoredTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;

  if (choice === "system") {
    root.removeAttribute("data-dotterel-theme");
  } else {
    root.setAttribute("data-dotterel-theme", choice);
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // プライベートウィンドウなどで保存できなくても表示は続ける
  }
}
