import type { IconName } from "dotterel-ui/icon";

export const ICON_CATEGORIES = [
  "symbol",
  "navigation",
  "media",
  "layout",
  "search",
  "editing",
  "content",
  "place",
  "people",
] as const;

export type IconCategory = (typeof ICON_CATEGORIES)[number];

export const CATEGORY_LABELS: Readonly<Record<IconCategory, string>> = {
  symbol: "基本記号",
  navigation: "移動と並べ替え",
  media: "再生",
  layout: "表示切替",
  search: "検索と絞り込み",
  editing: "編集",
  content: "書籍と文書",
  place: "場所と接続",
  people: "人と連絡",
};

export type IconMetadata = {
  readonly category: IconCategory;
  /** 名前では見つからない語で引けるようにする。日本語と英語を混ぜてよい */
  readonly keywords: readonly string[];
};

/**
 * showcase 専用のカタログ情報。ランタイムの公開 API へは持ち込まない。
 * `Record<IconName, IconMetadata>` なので、アイコンを追加してここを忘れると
 * showcase の型検査が落ちる。これは意図した更新ゲート。
 */
export const ICON_METADATA = {
  check: { category: "symbol", keywords: ["チェック", "完了", "成功", "done", "success"] },
  cross: { category: "symbol", keywords: ["閉じる", "クリア", "中止", "close", "clear"] },
  circle: { category: "symbol", keywords: ["丸", "未選択", "状態", "outline"] },
  dot: { category: "symbol", keywords: ["点", "小さい印", "bullet"] },
  plus: { category: "symbol", keywords: ["追加", "新規", "リクエスト", "add", "new"] },
  minus: { category: "symbol", keywords: ["削除", "縮小", "remove"] },
  alert: { category: "symbol", keywords: ["注意", "警告", "エラー", "warning", "error"] },
  crown: { category: "symbol", keywords: ["王冠", "上位", "ランキング", "rank"] },
  star: { category: "symbol", keywords: ["星", "お気に入り", "AI", "favorite"] },
  "arrow-left": { category: "navigation", keywords: ["戻る", "前へ", "back", "prev"] },
  "arrow-right": { category: "navigation", keywords: ["進む", "次へ", "next"] },
  "chevron-down": { category: "navigation", keywords: ["展開", "開く", "expand", "more"] },
  "chevron-up": { category: "navigation", keywords: ["折りたたむ", "閉じる", "collapse"] },
  "swap-vertical": { category: "navigation", keywords: ["入れ替え", "翻訳", "swap", "translate"] },
  merge: { category: "navigation", keywords: ["統合", "マージ", "まとめる", "merge"] },
  play: { category: "media", keywords: ["再生", "開始", "実行", "run"] },
  pause: { category: "media", keywords: ["一時停止", "pause"] },
  stop: { category: "media", keywords: ["停止", "中断", "stop"] },
  timer: { category: "media", keywords: ["時間", "計測", "履歴", "time"] },
  menu: { category: "layout", keywords: ["メニュー", "ハンバーガー", "nav"] },
  "more-vertical": { category: "layout", keywords: ["サブメニュー", "その他", "kebab"] },
  grid: { category: "layout", keywords: ["グリッド", "ダッシュボード", "タイル", "dashboard"] },
  list: { category: "layout", keywords: ["一覧", "リスト", "シリーズ", "list"] },
  "theme-light": { category: "layout", keywords: ["ライト", "明るい", "太陽", "light"] },
  "theme-dark": { category: "layout", keywords: ["ダーク", "暗い", "月", "dark"] },
  search: { category: "search", keywords: ["検索", "探す", "虫眼鏡", "find"] },
  filter: { category: "search", keywords: ["絞り込み", "フィルター", "条件"] },
  sort: { category: "search", keywords: ["並べ替え", "順序", "ソート", "order"] },
  checklist: { category: "search", keywords: ["すべて選択", "確認", "一括", "select all"] },
  edit: { category: "editing", keywords: ["編集", "修正", "鉛筆", "pencil"] },
  copy: { category: "editing", keywords: ["コピー", "複製", "duplicate"] },
  save: { category: "editing", keywords: ["保存", "書き出し", "download"] },
  trash: { category: "editing", keywords: ["削除", "ごみ箱", "破棄", "delete"] },
  undo: { category: "editing", keywords: ["取り消し", "やり直し", "リセット", "reset"] },
  book: { category: "content", keywords: ["書籍", "本", "単行本", "book"] },
  document: { category: "content", keywords: ["文書", "資料", "雑誌", "page", "magazine"] },
  quote: { category: "content", keywords: ["引用", "抜粋", "quotation"] },
  bookmark: { category: "content", keywords: ["しおり", "マイリスト", "未登録"] },
  "bookmark-filled": { category: "content", keywords: ["しおり", "マイリスト", "登録済み"] },
  tag: { category: "content", keywords: ["タグ", "ジャンル", "分類", "label", "category"] },
  home: { category: "place", keywords: ["ホーム", "トップ", "家"] },
  building: { category: "place", keywords: ["出版社", "会社", "組織", "company"] },
  desktop: { category: "place", keywords: ["PC", "画面", "デスクトップ", "monitor"] },
  database: { category: "place", keywords: ["データベース", "蓄積", "db"] },
  network: { category: "place", keywords: ["ネットワーク", "引用関係", "オンライン", "graph"] },
  link: { category: "place", keywords: ["リンク", "接続", "アフィリエイト", "chain"] },
  "external-link": { category: "place", keywords: ["外部リンク", "別タブ", "external"] },
  "image-off": { category: "place", keywords: ["画像なし", "表示不可", "no image"] },
  user: { category: "people", keywords: ["ユーザー", "著者", "人", "person"] },
  message: { category: "people", keywords: ["メッセージ", "問い合わせ", "chat"] },
  login: { category: "people", keywords: ["ログイン", "サインイン", "sign in"] },
  logout: { category: "people", keywords: ["ログアウト", "サインアウト", "sign out"] },
  settings: { category: "people", keywords: ["設定", "調整", "config"] },
} as const satisfies Record<IconName, IconMetadata>;
