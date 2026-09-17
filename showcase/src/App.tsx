import { useCallback, useState } from "react";

import { DotLink } from "dotterel-ui/button";
import { ICON_NAMES, Icon } from "dotterel-ui/icon";
import { DotText } from "dotterel-ui/text";

import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { ButtonsSection } from "./sections/ButtonsSection";
import { CountSection } from "./sections/CountSection";
import { EffectsSection } from "./sections/EffectsSection";
import { IconsSection } from "./sections/IconsSection";
import { ProgressSection } from "./sections/ProgressSection";
import { TextSection } from "./sections/TextSection";
import { TokensSection } from "./sections/TokensSection";
import { applyTheme, readStoredTheme, type ThemeChoice } from "./theme";

const VERSION = __DOTTEREL_VERSION__;

const SECTIONS = [
  { id: "icons", label: "アイコン" },
  { id: "buttons", label: "ボタン" },
  { id: "count", label: "数値" },
  { id: "progress", label: "進捗" },
  { id: "effects", label: "背景効果" },
  { id: "text", label: "テキスト" },
  { id: "tokens", label: "テーマ変数" },
] as const;

export function App() {
  const [theme, setTheme] = useState<ThemeChoice>(readStoredTheme);

  // 先に DOM へ反映してから再描画する。テーマ変数の現在値を同じ描画で読めるようにする
  const changeTheme = useCallback((choice: ThemeChoice) => {
    applyTheme(choice);
    setTheme(choice);
  }, []);

  return (
    <div className="page">
      <a className="skip-link" href="#icons">
        本文へスキップ
      </a>

      <header className="masthead">
        <div className="masthead__inner">
          <div className="masthead__identity">
            <DotText as="p" className="masthead__eyebrow">
              dotterel ui
            </DotText>
            <h1 className="masthead__title">ドットで作るUIカタログ</h1>
            <p className="masthead__lede">
              登録済みアイコン {ICON_NAMES.length} 種と、公開しているコンポーネントを実物で確かめられます。
              表示中のバージョンは <code>{VERSION}</code> です。
            </p>
          </div>

          <div className="masthead__controls">
            <ThemeSwitcher value={theme} onChange={changeTheme} />
            <DotLink
              href="https://github.com/goto-kamoshirenai/dotterel-ui"
              target="_blank"
              rel="noreferrer"
            >
              <span>リポジトリ</span>
              <Icon name="external-link" animation="hover" />
            </DotLink>
          </div>
        </div>

        <nav className="masthead__nav" aria-label="セクション">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="main">
        <IconsSection />
        <ButtonsSection />
        <CountSection />
        <ProgressSection />
        <EffectsSection />
        <TextSection />
        <TokensSection />
      </main>

      <footer className="footer">
        <p>
          dotterel-ui {VERSION} ・ MIT License ・{" "}
          <a href="https://www.npmjs.com/package/dotterel-ui">npm</a>
        </p>
      </footer>
    </div>
  );
}
