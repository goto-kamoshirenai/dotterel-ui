# Changelog

このプロジェクトの主な変更を記録します。バージョン番号は [Semantic Versioning](https://semver.org/) に従います。

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
