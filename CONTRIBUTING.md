# Contributing

IssueやPull Requestを歓迎します。

## セットアップ

```bash
pnpm install
pnpm check
```

Node.js 18以上と、`package.json` に記載したpnpmを使用してください。

## 実装方針

- ドットを装飾ではなく、アイコン、状態、動きに共通する基本単位として扱う
- React以外のランタイム依存を増やさない
- 意味をHTMLとARIAで成立させ、Canvasやアニメーションだけに依存しない
- `prefers-reduced-motion` とキーボード操作を保つ
- 公開APIを追加・変更した場合はREADME、型、テストを同時に更新する
- 既存のCSS変数と `dotterel-` 接頭辞を維持する

## リリース

1. バージョンと `CHANGELOG.md` を更新する
2. `pnpm check` を通す
3. バージョンと一致するGitHub Releaseを公開する

GitHub Actionsからnpmへ公開する場合は、リポジトリに `NPM_TOKEN` secretが必要です。
