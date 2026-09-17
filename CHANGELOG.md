# Changelog

このプロジェクトの主な変更を記録します。バージョン番号は [Semantic Versioning](https://semver.org/) に従います。

## 0.6.0 - 2026-09-17

### Added

- ドットを詰めた同梱フォント `Dotterel Dots Compact` (WOFF2 / OTF / TTF)。
  字形は `Dotterel Dots` と同じ5行グリッドで、ドットを 100 から 140 へ太らせ、
  ピッチを 200 から 190 へ詰めた (隙間 100 → 50)。大文字の高さとベースラインは
  共通なので行の高さは変わらず、字幅だけ狭くなる
- `styles.css` からの `@font-face` 登録と、フォールバックまで含んだ
  `--dotterel-font-family-dot-compact`
- `DotText` と `DotCount` の `density`。`compact` で詰めた書体へ切り替える。
  Reactを使わない場合のための `.dotterel-text--compact` も同じ効果になる
- 詰めた書体の見本 `specimens/dotterel-dots-compact-specimen.svg`

### Changed

- `pnpm font:generate` が2書体ぶんを生成する。ドットとピッチは書体ごとの
  設定にまとめ、`4 * ピッチ + ドット === 大文字の高さ` を生成時に検査する。
  `Dotterel Dots` の生成物は変わらない

## 0.5.0 - 2026-09-17

### Added

- アイコンのドットの間隔を切り替える `density`。既定の `comfortable` は
  これまでと同じ見た目で、`compact` は隙間を最小限まで詰める
  (`sm` は0、`md` と `lg` は1)。隙間を削ったぶんドットが太るので、
  切り替えても5セルの外形はほぼ同じ大きさのままになる
- 密度の語彙 `DotDensity`、`DOT_DENSITIES`、`DEFAULT_DOT_DENSITY`、
  `DOT_DENSITY_METRICS`、`DotMetric`。`dotGeometry` は第3引数で密度を受け取る
- 9×9のドット行列に対応。5×5では潰れてしまう造形を表現できる。
  9×9のアイコン名には `-detailed` を付ける
- 9×9の登録済みアイコン `database-detailed`
- グリッドと描画枠を扱う `ICON_GRIDS`、`ICON_SLOT_CELLS`、`iconCells`、
  `iconSlotSpan`。`iconGeometry` は第3引数で密度を受け取る
- showcaseにドットの間隔の切り替えを追加

### Changed

- `DotIcon` は行列のグリッドを `viewBox` に、5×5ぶんの一辺を `width` と
  `height` に割り当てる。9×9などの細かいグリッドでも、同じ `size` なら
  5×5と同じ大きさで並ぶ。5×5のアイコンの描画結果は変わらない

## 0.4.1 - 2026-08-30

### Changed

- `animation="hover"` のアイコンが、囲んでいる `button`、`a[href]`、`summary`、
  `role="button"`、`role="link"`、`role="tab"`、`role="menuitem"` へのホバーでも動く。
  ボタンやリンクの中のアイコンへ `dotterel-icon-host` を付けて回る必要がなくなる。
  無効化された要素 (`:disabled`、`aria-disabled="true"`) では動かない
- 操作要素ではない要素をきっかけにする場合は、これまでどおり `dotterel-icon-host` を使う

## 0.4.0 - 2026-08-30

### Added

- 一般的なUI操作・状態を表す30種類の登録済みアイコン。
  書籍と文書 (`book`、`document`、`quote`、`bookmark`、`bookmark-filled`、`tag`)、
  場所と接続 (`building`、`desktop`、`database`、`network`、`link`、`external-link`、`image-off`)、
  人と連絡 (`message`、`login`、`logout`)、
  表示切替 (`grid`、`list`、`more-vertical`)、
  検索と絞り込み (`filter`、`sort`、`checklist`)、
  編集 (`edit`、`copy`、`save`、`trash`、`undo`)、
  移動と再生 (`swap-vertical`、`merge`、`stop`)
- 追加アイコン名の登録と、全アイコン名がkebab-caseであることを確認するテスト

### Changed

- `timer`、`play`、`home`、`user`、`settings`、`document` などの既存アイコンの
  ドット行列を調整し、追加分と字面を揃えた
- READMEに登録済みアイコンの一覧を分類付きで掲載

## 0.3.0 - 2026-07-29

### Added

- カウントアップ・カウントダウン表示の `DotCount` (小数、3桁区切り、接頭辞・接尾辞、
  イージング、遅延、画面内で開始する `startOn="view"` に対応)
- 開始・一時停止・再開・リセットを自分で制御する `useDotCount`
- 同梱フォント `Dotterel Dots` を1行で適用する `DotText` と、
  Reactを使わない場合のための `.dotterel-text` / `--uppercase` / `--tabular` クラス
- React非依存の補間・整形関数 `countValue`、`countProgress`、`formatCount`、
  `resolveCountFormat`、`easingFunction`、`roundTo`、`COUNT_EASING_FUNCTIONS`
- サブパス `dotterel-ui/count` と `dotterel-ui/text`

## 0.2.0 - 2026-07-29

### Added

- 大文字・数字・基本記号のための表示フォント `Dotterel Dots` (WOFF2 / OTF / TTF)
- `styles.css` からの `@font-face` 登録と `unicode-range` の指定
- フォントの実体を参照するためのサブパス `dotterel-ui/fonts/*`
- グリフと見本を再生成する `pnpm font:generate`

### Changed

- `--dotterel-font-family-dot` の既定値の先頭が `Dotterel Dots` になり、
  進捗率などのドット表示へ自動的に使われる。未収録の文字 (小文字・和文など) は
  これまでどおり後続のフォールバックが受ける

## 0.1.0 - 2026-07-28

### Added

- 23種類の登録済みドットアイコン
- 任意のドット行列からアイコンを作る `DotIcon` と `createDotIcon`
- mount、hover、alwaysのアイコンアニメーション
- リップルをカスタマイズできる `DotButton`、`DotLink`、`DotLinkAdapter`
- `Percent`、`DotProgress`、`DotProgressValue`
- 密度、速度、形、配置を変更できる `DotField`
- ライト、ダーク、自動テーマとCSS変数
- React非依存の `dotterel-ui/core`
- 機能別サブパス、TypeScript型定義、ESM配布
