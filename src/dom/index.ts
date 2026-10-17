/**
 * React を使わない入口。静的に描いた HTML (Astro など) へ、あとから動きを付ける。
 *
 * React 版のフックとコンポーネントも同じ中身 (src/internal) を使うので、
 * 出力されるクラス名、CSS変数、動き方は React 版と変わらない。
 * このディレクトリから react を読み込んではいけない (テストで確かめる)。
 */
export {
  mountDotRipple,
  type DotRippleHandle,
  type DotRippleOptions,
  type DotRippleState,
  type MountDotRippleOptions,
} from "./ripple.js";
export {
  createCountRunner,
  mountDotCount,
  resolveCountSettings,
  type CountRunner,
  type CountRunnerCallbacks,
  type CountSettings,
  type DotCountHandle,
  type DotCountMotion,
  type DotCountOptions,
  type DotCountStatus,
  type MountDotCountOptions,
  type MountDotCountTrigger,
} from "./count.js";
export {
  mountDotField,
  type DotFieldCanvasOptions,
  type DotFieldHandle,
  type DotFieldMotion,
  type DotFieldPlacement,
  type MountDotFieldOptions,
} from "./field.js";
