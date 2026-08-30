import { useDeferredValue, useId, useMemo, useState } from "react";

import { DotButton } from "dotterel-ui/button";
import { DOT_SHAPES, DOT_SIZES, type DotShape, type DotSize } from "dotterel-ui/core";
import { ICON_NAMES, Icon, type IconAnimationTrigger, type IconName } from "dotterel-ui/icon";

import { CATEGORY_LABELS, ICON_METADATA } from "../catalog/icon-metadata";
import { IconCard, type IconDisplay } from "../components/IconCard";

const ANIMATIONS: readonly (IconAnimationTrigger | "none")[] = [
  "none",
  "mount",
  "hover",
  "always",
];

const ANIMATION_LABELS: Readonly<Record<IconAnimationTrigger | "none", string>> = {
  none: "なし",
  mount: "mount",
  hover: "hover",
  always: "always",
};

/** 名前・カテゴリ名・キーワードを一本の検索対象にする */
function haystack(name: IconName): string {
  const metadata = ICON_METADATA[name];
  return [name, CATEGORY_LABELS[metadata.category], ...metadata.keywords].join(" ").toLowerCase();
}

const SEARCH_INDEX = new Map<IconName, string>(
  ICON_NAMES.map((name) => [name, haystack(name)]),
);

export function IconsSection() {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<DotSize>("md");
  const [shape, setShape] = useState<DotShape>("square");
  const [animation, setAnimation] = useState<IconAnimationTrigger | "none">("hover");
  const [replayKey, setReplayKey] = useState(0);

  const deferredQuery = useDeferredValue(query);

  const matches = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return ICON_NAMES;
    return ICON_NAMES.filter((name) => SEARCH_INDEX.get(name)?.includes(needle));
  }, [deferredQuery]);

  const display: IconDisplay = { size, shape, animation };

  return (
    <section id="icons" className="section" aria-labelledby="icons-heading">
      <header className="section__head">
        <h2 id="icons-heading" className="section__title">
          アイコン
        </h2>
        <p className="section__lead">
          登録簿は <code>ICON_NAMES</code> から読み出しています。アイコンを追加すると、この一覧にも自動で並びます。
        </p>
      </header>

      <div className="controls">
        <div className="controls__search">
          <label htmlFor={searchId} className="controls__label">
            検索
          </label>
          <div className="controls__field">
            <Icon name="search" size="sm" />
            <input
              id={searchId}
              type="search"
              value={query}
              placeholder="名前・用途・キーワード（例: 削除、bookmark）"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <fieldset className="switcher">
          <legend className="switcher__legend">サイズ</legend>
          <div className="switcher__options">
            {DOT_SIZES.map((option) => (
              <label key={option} className="switcher__option">
                <input
                  type="radio"
                  name="icon-size"
                  value={option}
                  checked={size === option}
                  onChange={() => setSize(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="switcher">
          <legend className="switcher__legend">ドットの形</legend>
          <div className="switcher__options">
            {DOT_SHAPES.map((option) => (
              <label key={option} className="switcher__option">
                <input
                  type="radio"
                  name="icon-shape"
                  value={option}
                  checked={shape === option}
                  onChange={() => setShape(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="switcher">
          <legend className="switcher__legend">アニメーション</legend>
          <div className="switcher__options">
            {ANIMATIONS.map((option) => (
              <label key={option} className="switcher__option">
                <input
                  type="radio"
                  name="icon-animation"
                  value={option}
                  checked={animation === option}
                  onChange={() => setAnimation(option)}
                />
                <span>{ANIMATION_LABELS[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <DotButton
          type="button"
          variant="quiet"
          onClick={() => setReplayKey((current) => current + 1)}
        >
          <Icon name="play" animation="hover" />
          <span>もう一度再生</span>
        </DotButton>
      </div>

      <p className="section__tally" role="status">
        {matches.length} / {ICON_NAMES.length} 種を表示中
      </p>

      {matches.length === 0 ? (
        <p className="empty">名前にもキーワードにも一致しませんでした。別の語で試してください。</p>
      ) : (
        <ul className="icon-grid">
          {matches.map((name) => (
            <IconCard key={name} name={name} display={display} replayKey={replayKey} />
          ))}
        </ul>
      )}
    </section>
  );
}
