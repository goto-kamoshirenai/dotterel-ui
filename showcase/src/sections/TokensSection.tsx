import { DotButton } from "dotterel-ui/button";
import { DotProgress } from "dotterel-ui/progress";
import { Icon } from "dotterel-ui/icon";

import { DemoFrame } from "../components/DemoFrame";

type TokenGroup = {
  readonly title: string;
  readonly tokens: readonly string[];
};

const TOKEN_GROUPS: readonly TokenGroup[] = [
  {
    title: "色",
    tokens: [
      "--dotterel-color-surface",
      "--dotterel-color-surface-hover",
      "--dotterel-color-text",
      "--dotterel-color-text-muted",
      "--dotterel-color-border",
      "--dotterel-color-border-subtle",
      "--dotterel-color-accent",
      "--dotterel-color-accent-emphasis",
      "--dotterel-color-accent-surface",
      "--dotterel-color-on-accent",
      "--dotterel-color-focus-ring",
      "--dotterel-color-danger",
      "--dotterel-color-danger-border",
      "--dotterel-color-danger-surface",
      "--dotterel-field-color",
    ],
  },
  {
    title: "余白と枠",
    tokens: [
      "--dotterel-space-1",
      "--dotterel-space-2",
      "--dotterel-space-3",
      "--dotterel-space-4",
      "--dotterel-radius",
      "--dotterel-radius-full",
      "--dotterel-border-width",
    ],
  },
  {
    title: "文字",
    tokens: ["--dotterel-font-family", "--dotterel-font-family-dot", "--dotterel-font-weight"],
  },
  {
    title: "モーション",
    tokens: ["--dotterel-motion-fast", "--dotterel-motion-base", "--dotterel-motion-easing"],
  },
];

const COLOR_TOKENS = new Set(TOKEN_GROUPS[0]?.tokens ?? []);

const OVERRIDE_CODE = `.brand {
  --dotterel-color-accent: #7c3aed;
  --dotterel-color-accent-emphasis: #5b21b6;
  --dotterel-color-on-accent: #f5f3ff;
  --dotterel-radius: 8px;
  --dotterel-border-width: 3px;
}`;

function readTokenValues(): Readonly<Record<string, string>> {
  const computed = getComputedStyle(document.documentElement);
  const values: Record<string, string> = {};

  for (const group of TOKEN_GROUPS) {
    for (const token of group.tokens) {
      values[token] = computed.getPropertyValue(token).trim();
    }
  }

  return values;
}

export function TokensSection() {
  // テーマは操作の時点で DOM へ当たっている。描画のたびに読めば常に現在値になる
  const values = readTokenValues();

  return (
    <section id="tokens" className="section" aria-labelledby="tokens-heading">
      <header className="section__head">
        <h2 id="tokens-heading" className="section__title">
          テーマ変数
        </h2>
        <p className="section__lead">
          <code>dotterel-ui/styles.css</code> が公開する CSS 変数です。アプリ側の <code>:root</code>{" "}
          や任意の要素で上書きすると、その中のコンポーネントだけ配色を変えられます。
        </p>
      </header>

      <div className="demo-grid">
        <DemoFrame
          title="一部だけ上書きする"
          description="変数は継承するので、囲った範囲にだけ効きます。"
          code={OVERRIDE_CODE}
        >
          <div className="token-override">
            <div className="row">
              <DotButton type="button" variant="primary">
                <Icon name="star" animation="hover" />
                <span>上書きした配色</span>
              </DotButton>
              <DotProgress value={70} max={100} label="進捗" />
            </div>
          </div>
        </DemoFrame>
      </div>

      {TOKEN_GROUPS.map((group) => (
        <div key={group.title} className="token-group">
          <h3 className="token-group__title">{group.title}</h3>
          <div className="table-scroll">
            <table className="token-table">
              <thead>
                <tr>
                  <th scope="col">変数</th>
                  <th scope="col">現在値</th>
                </tr>
              </thead>
              <tbody>
                {group.tokens.map((token) => (
                  <tr key={token}>
                    <th scope="row">
                      <code>{token}</code>
                    </th>
                    <td>
                      <span className="token-value">
                        {COLOR_TOKENS.has(token) ? (
                          <span
                            className="token-swatch"
                            style={{ background: `var(${token})` }}
                            aria-hidden="true"
                          />
                        ) : null}
                        <code>{values[token] || "—"}</code>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
