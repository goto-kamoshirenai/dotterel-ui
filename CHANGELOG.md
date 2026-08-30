# Changelog

このプロジェクトの主な変更を記録します。バージョン番号は [Semantic Versioning](https://semver.org/) に従います。

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
