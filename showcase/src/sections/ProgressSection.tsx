import { useId, useState } from "react";

import { DotProgress, DotProgressValue, Percent } from "dotterel-ui/progress";

import { DemoFrame } from "../components/DemoFrame";

function LiveProgress() {
  const sliderId = useId();
  const [value, setValue] = useState(37);

  return (
    <div className="stack">
      <DotProgressValue value={value} max={100} label="読み込み" />
      <label htmlFor={sliderId} className="controls__label">
        値: {value}
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
    </div>
  );
}

export function ProgressSection() {
  return (
    <section id="progress" className="section" aria-labelledby="progress-heading">
      <header className="section__head">
        <h2 id="progress-heading" className="section__title">
          進捗
        </h2>
        <p className="section__lead">
          <code>DotProgress</code> は <code>role="progressbar"</code> として値を持ちます。数値だけを出すときは{" "}
          <code>Percent</code> を使います。
        </p>
      </header>

      <div className="demo-grid">
        <DemoFrame
          title="値の推移"
          description="0、途中、完了。max を変えると分母も変わります。"
          code={`<DotProgress value={0} max={100} label="読み込み" />
<DotProgress value={45} max={100} label="読み込み" />
<DotProgress value={100} max={100} label="読み込み" />`}
        >
          <div className="stack">
            <DotProgress value={0} max={100} label="読み込み" />
            <DotProgress value={45} max={100} label="読み込み" />
            <DotProgress value={100} max={100} label="読み込み" />
          </div>
        </DemoFrame>

        <DemoFrame
          title="数値つき"
          description="DotProgressValue はドットと数値を並べます。Percent は数値だけです。"
          code={`<DotProgressValue value={62} max={100} label="同期" />
<Percent value={62} max={100} />`}
        >
          <div className="stack">
            <DotProgressValue value={62} max={100} label="同期" />
            <p className="metric">
              <Percent value={62} max={100} />
            </p>
          </div>
        </DemoFrame>

        <DemoFrame
          title="ドットの数と形"
          description="count でドット数、shape で形を変えます。"
          code={`<DotProgress value={5} max={10} count={10} label="章" />
<DotProgress value={5} max={10} shape="circle" label="章" />
<DotProgress value={5} max={10} shape="diamond" label="章" />`}
        >
          <div className="stack">
            <DotProgress value={5} max={10} count={10} label="章" />
            <DotProgress value={5} max={10} shape="circle" label="章" />
            <DotProgress value={5} max={10} shape="diamond" label="章" />
          </div>
        </DemoFrame>

        <DemoFrame
          title="サイズと幅"
          description="size='dynamic' は width に合わせてドット数を決めます。"
          code={`<DotProgress value={40} max={100} size="sm" label="小" />
<DotProgress value={40} max={100} size="lg" label="大" />
<DotProgress value={40} max={100} size="dynamic" width="100%" label="幅いっぱい" />`}
        >
          <div className="stack">
            <DotProgress value={40} max={100} size="sm" label="小" />
            <DotProgress value={40} max={100} size="lg" label="大" />
            <DotProgress value={40} max={100} size="dynamic" width="100%" label="幅いっぱい" />
          </div>
        </DemoFrame>

        <DemoFrame
          title="動かして確かめる"
          description="値を変えたときの見え方と読み上げ値を確認できます。"
          code={`<DotProgressValue value={value} max={100} label="読み込み" />`}
        >
          <LiveProgress />
        </DemoFrame>
      </div>
    </section>
  );
}
