import type { ReactNode } from "react";

import { CopyCodeButton } from "./CopyCodeButton";

type DemoFrameProps = {
  readonly title: string;
  readonly description?: string;
  readonly code: string;
  readonly children: ReactNode;
  /** 背景効果のように、実物へ高さを与えたいデモで使う */
  readonly stageClassName?: string;
};

/**
 * 実物とコードを並べる枠。
 * 中の見た目へ余計なスタイルを継承させないため、装飾は枠側だけに閉じる。
 */
export function DemoFrame({
  title,
  description,
  code,
  children,
  stageClassName,
}: DemoFrameProps) {
  return (
    <article className="demo">
      <div className="demo__head">
        <h3 className="demo__title">{title}</h3>
        {description ? <p className="demo__description">{description}</p> : null}
      </div>
      <div className={stageClassName ? `demo__stage ${stageClassName}` : "demo__stage"}>
        {children}
      </div>
      <div className="demo__code">
        <pre>
          <code>{code}</code>
        </pre>
        <CopyCodeButton code={code} label={`${title} のコードをコピー`} />
      </div>
    </article>
  );
}
