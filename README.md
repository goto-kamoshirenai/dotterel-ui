# dotterel-ui

ドットを基本単位にした、軽量な React UI ライブラリです。ドットSVGアイコン、リップル付きボタン、進捗表示、Canvas背景エフェクトを提供します。

- React 18 / 19 対応
- TypeScript の型定義を同梱
- ランタイム依存は React のみ
- CSS変数で色、角、余白、モーションを変更可能
- SSR対応
- `prefers-reduced-motion` と強制カラーモードに対応
- 機能別のサブパスimportに対応

## インストール

```bash
pnpm add dotterel-ui
```

アプリのエントリーポイントでスタイルを一度読み込みます。

```tsx
import "dotterel-ui/styles.css";
```

## 基本的な使い方

```tsx
import {
  DotButton,
  DotField,
  DotProgressValue,
  Icon,
} from "dotterel-ui";

export function Dashboard() {
  return (
    <main>
      <DotField density={0.7} speed={0.8} />

      <DotButton variant="primary">
        <Icon name="check" animation="hover" />
        保存
      </DotButton>

      <DotProgressValue
        value={42}
        max={115}
        label="学習の進捗"
        shape="square"
      />
    </main>
  );
}
```

## アイコン

登録済みアイコンは `Icon` で描画します。色は `currentColor` を継承します。

```tsx
<Icon name="crown" />
<Icon name="check" label="完了" shape="circle" size="lg" />
<Icon name="star" animation="mount" />
<Icon
  name="alert"
  animation={{ trigger: "hover", repeat: 2, duration: 400, spread: 40 }}
/>
```

`label` を省略したアイコンは装飾として `aria-hidden` になります。アイコンだけで意味を伝える場合は、必ず `label` を指定してください。

独自アイコンは `#` と `.` の行列で作れます。

```tsx
import { createDotIcon } from "dotterel-ui/icon";

const SparkleIcon = createDotIcon(
  [".#.#.", "..#..", "#####", "..#..", ".#.#."],
  "SparkleIcon",
);

<SparkleIcon label="新着" shape="diamond" />;
```

登録済みの名前は `ICON_NAMES`、定義は `ICONS` から取得できます。

## ボタンとリンク

ボタンとリンクを別コンポーネントにし、HTMLの役割を明確にしています。

```tsx
<DotButton variant="primary" onClick={save}>
  保存
</DotButton>

<DotButton status="busy" disabled>
  保存中
</DotButton>

<DotLink href="/guide" variant="quiet">
  ガイドを読む
</DotLink>
```

リップルは形、粒度、速度、濃さを変更できます。`ripple="none"` で無効化できます。

```tsx
<DotButton
  ripple={{
    shape: "circle",
    size: "sm",
    duration: 800,
    opacity: 0.35,
  }}
>
  ゆっくり広がる
</DotButton>
```

Next.jsやReact Routerのリンクを使う場合は `DotLinkAdapter` で既存のリンク要素を包みます。リンク先、prefetch、クライアント遷移などの機能は元のリンクコンポーネントが保持します。

```tsx
import Link from "next/link";
import { DotLinkAdapter } from "dotterel-ui/button";

<DotLinkAdapter variant="primary">
  <Link href="/dashboard">ダッシュボード</Link>
</DotLinkAdapter>;
```

## 進捗表示

用途を明示できるよう、数値、ドット、両方を別コンポーネントにしています。

```tsx
<Percent value={42} max={115} />

<DotProgress
  value={42}
  max={115}
  count={20}
  label="コース進捗"
  shape="circle"
/>

<DotProgressValue
  value={42}
  max={115}
  label="コース進捗"
  size="dynamic"
  width={240}
/>
```

進捗が始まっているのに `0%`、完了前なのに `100%` と表示されないよう、途中値は `1%` から `99%` に収めます。

## 背景エフェクト

`DotField` は依存ライブラリのない2D Canvasエフェクトです。既定では画面全体に固定され、操作やアクセシビリティツリーへ干渉しません。

```tsx
<DotField
  shape="diamond"
  dotSize={2}
  gap={7}
  density={0.75}
  speed={0.6}
  color="oklch(65% 0.12 205 / 0.22)"
/>
```

`motion` は次の値を取ります。

- `"auto"`: OSのモーション設定に従う（既定）
- `"always"`: 常にアニメーションする
- `"static"`: 静止画を1枚描画する

親要素の中だけに配置する場合は、親へ `position: relative` を指定し、`placement="absolute"` を使います。

## テーマとカスタマイズ

すべての標準スタイルは `dotterel-` 接頭辞付きのCSS変数を参照します。

```css
:root {
  --dotterel-color-accent: oklch(58% 0.16 145);
  --dotterel-color-accent-emphasis: oklch(48% 0.14 145);
  --dotterel-color-on-accent: white;
  --dotterel-radius: 10px;
  --dotterel-font-family-dot: "DotGothic16", monospace;
  --dotterel-motion-base: 320ms;
}
```

OS設定に応じたダークテーマが標準で有効です。明示的に切り替える場合は、ルート要素へ属性を指定します。

```html
<html data-dotterel-theme="dark">
```

```html
<html data-dotterel-theme="light">
```

標準CSSは `@layer dotterel.tokens, dotterel.components` 内にあるため、利用側の通常のCSSから上書きできます。

## 軽量なimport

ルートからまとめて読み込むほか、機能別に直接importできます。

```tsx
import { DotButton } from "dotterel-ui/button";
import { ratioOf } from "dotterel-ui/core";
import { DotField } from "dotterel-ui/effects";
import { Icon } from "dotterel-ui/icon";
import { DotProgress } from "dotterel-ui/progress";
```

`dotterel-ui/core` は React に依存しません。

## 開発

```bash
pnpm install
pnpm check
```

`pnpm check` はLint、型検査、ESMビルド、15件以上のテスト、公開パッケージ内容の検査を実行します。

リリース時は `package.json` と `CHANGELOG.md` のバージョンを更新してGitHub Releaseを公開します。

npmへの公開はアクセストークンで行います。リポジトリの環境 `npm` へ、公開権限のある `NPM_TOKEN` を登録してください。

トークンを使わず trusted publishing (OIDC) にする場合は、次の3点をすべて揃える必要があります。1つでも欠けると、未認証の公開として扱われ `npm error 404 Not Found - PUT` で失敗します (npmは権限不足を404で返します)。

1. npmjs.com の `dotterel-ui` → Settings → Trusted publisher で、GitHub Actions・Repository `goto-kamoshirenai/dotterel-ui`・Workflow `publish.yml`・Environment `npm` を登録する
2. `publish.yml` から `registry-url` と `NODE_AUTH_TOKEN` を外す (`.npmrc` に認証設定が残っているとOIDCの交換が行われない)
3. npm 11.5.1 以降で実行する (`npm install --global npm@latest`)

## Dotterel Dots フォント

アイコンと同じ正方形ドットで設計した、大文字・数字・基本記号用の表示フォントを同梱しています。`styles.css` を読み込むと `Dotterel Dots` が登録され、進捗率などのドット表示へ自動的に使用されます。

```css
.status {
  font-family: "Dotterel Dots", monospace;
  font-synthesis: none;
}
```

収録文字は `A-Z`、`0-9`、空白、`! "%'()+,-./:;=?[\]_|` です。小文字や未収録記号はフォールバックフォントで表示されます。

フォントの実体はサブパスから参照できます。自分で `@font-face` を書く場合や、Next.jsの `next/font/local` で読み込む場合に使います。

```tsx
import localFont from "next/font/local";

const dotterelDots = localFont({
  src: "../node_modules/dotterel-ui/fonts/dotterel-dots.woff2",
  variable: "--font-dotterel-dots",
});
```

配布形式は WOFF2、OTF、TTF です。グリフを変更した場合は、次のコマンドで3形式と見本SVGを再生成できます。

```bash
pnpm font:generate
```

## ライセンス

[MIT](./LICENSE)
