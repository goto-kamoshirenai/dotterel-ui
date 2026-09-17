/**
 * dotterel-ui のスタイルシートは npm 利用者と同じ公開名で読み込む。
 * TypeScript には値を持たないモジュールとして知らせる。
 */
declare module "dotterel-ui/styles.css";

/** vite の define から埋め込まれるライブラリのバージョン */
declare const __DOTTEREL_VERSION__: string;
