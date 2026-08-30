import { DotButton } from "dotterel-ui/button";
import { DotCount, useDotCount } from "dotterel-ui/count";
import { Icon } from "dotterel-ui/icon";

import { DemoFrame } from "../components/DemoFrame";

/** 自分で開始・停止を持ちたいときの useDotCount の例 */
function ManualCounter() {
  const counter = useDotCount({
    to: 4820,
    duration: 2400,
    easing: "ease-out",
    suffix: " 冊",
    autoStart: false,
  });

  return (
    <div className="stack">
      <p className="metric">{counter.text}</p>
      <div className="row">
        <DotButton type="button" onClick={counter.start} disabled={counter.status === "counting"}>
          <Icon name="play" animation="hover" />
          <span>開始</span>
        </DotButton>
        <DotButton type="button" variant="quiet" onClick={counter.pause}>
          <Icon name="pause" animation="hover" />
          <span>一時停止</span>
        </DotButton>
        <DotButton type="button" variant="quiet" onClick={counter.resume}>
          <Icon name="play" animation="hover" />
          <span>再開</span>
        </DotButton>
        <DotButton type="button" variant="quiet" onClick={counter.reset}>
          <Icon name="undo" animation="hover" />
          <span>リセット</span>
        </DotButton>
      </div>
      <p className="note">status: {counter.status}</p>
    </div>
  );
}

export function CountSection() {
  return (
    <section id="count" className="section" aria-labelledby="count-heading">
      <header className="section__head">
        <h2 id="count-heading" className="section__title">
          数値
        </h2>
        <p className="section__lead">
          <code>DotCount</code> は最終値を読み上げ用に持ち、途中の値は <code>aria-hidden</code> です。
          <code>prefers-reduced-motion</code> では動かず、いきなり最終値になります。
        </p>
      </header>

      <div className="demo-grid">
        <DemoFrame
          title="カウントアップ"
          description="既定は mount で開始します。3桁区切りは自動です。"
          code={`<DotCount to={12480} suffix=" 冊" />`}
        >
          <p className="metric">
            <DotCount to={12480} suffix=" 冊" />
          </p>
        </DemoFrame>

        <DemoFrame
          title="カウントダウンと小数"
          description="from を指定すると減ります。decimals で小数桁を決めます。"
          code={`<DotCount from={100} to={42.5} decimals={1} suffix=" %" />`}
        >
          <p className="metric">
            <DotCount from={100} to={42.5} decimals={1} suffix=" %" />
          </p>
        </DemoFrame>

        <DemoFrame
          title="接頭辞・接尾辞と区切り"
          description="通貨のような表記も format 系のプロパティだけで作れます。"
          code={`<DotCount to={1832400} prefix="¥" separator="," easing="ease-in-out" />`}
        >
          <p className="metric">
            <DotCount to={1832400} prefix="¥" separator="," easing="ease-in-out" />
          </p>
        </DemoFrame>

        <DemoFrame
          title="画面に入ってから開始"
          description="長いページでは startOn='view' にすると、見えたときに動き始めます。"
          code={`<DotCount to={860} startOn="view" viewThreshold={0.5} delay={200} suffix=" 件" />`}
        >
          <p className="metric">
            <DotCount to={860} startOn="view" viewThreshold={0.5} delay={200} suffix=" 件" />
          </p>
        </DemoFrame>

        <DemoFrame
          title="同梱フォントで見せる"
          description="font='dot' が既定です。周りの書体へ合わせたいときは font='inherit' にします。"
          code={`<DotCount to={2048} font="dot" />
<DotCount to={2048} font="inherit" />`}
        >
          <div className="row">
            <p className="metric">
              <DotCount to={2048} font="dot" />
            </p>
            <p className="metric">
              <DotCount to={2048} font="inherit" />
            </p>
          </div>
        </DemoFrame>

        <DemoFrame
          title="自分で操作する"
          description="useDotCount は値と操作だけを返します。表示は好きな要素で作れます。"
          code={`const counter = useDotCount({
  to: 4820,
  duration: 2400,
  easing: "ease-out",
  suffix: " 冊",
  autoStart: false,
});

<p>{counter.text}</p>
<button onClick={counter.start}>開始</button>`}
        >
          <ManualCounter />
        </DemoFrame>
      </div>
    </section>
  );
}
