import { DotField } from "dotterel-ui/effects";

import { DemoFrame } from "../components/DemoFrame";

export function EffectsSection() {
  return (
    <section id="effects" className="section" aria-labelledby="effects-heading">
      <header className="section__head">
        <h2 id="effects-heading" className="section__title">
          背景効果
        </h2>
        <p className="section__lead">
          <code>DotField</code> は既定で画面全体に敷きます。ここでは枠内で比べるため{" "}
          <code>placement="absolute"</code> にしています。<code>prefers-reduced-motion</code> では止まります。
        </p>
      </header>

      <div className="demo-grid">
        <DemoFrame
          title="密度"
          description="density はドットの間隔の目安です。小さいほど詰まります。"
          code={`<DotField placement="absolute" density={18} />
<DotField placement="absolute" density={40} />`}
          stageClassName="demo__stage--field"
        >
          <div className="field-pair">
            <div className="field-box">
              <DotField placement="absolute" density={18} />
              <span className="field-box__label">density 18</span>
            </div>
            <div className="field-box">
              <DotField placement="absolute" density={40} />
              <span className="field-box__label">density 40</span>
            </div>
          </div>
        </DemoFrame>

        <DemoFrame
          title="速度と動き"
          description="motion='static' は完全に止めます。速度は speed で決めます。"
          code={`<DotField placement="absolute" speed={0.4} />
<DotField placement="absolute" motion="static" />`}
          stageClassName="demo__stage--field"
        >
          <div className="field-pair">
            <div className="field-box">
              <DotField placement="absolute" speed={0.4} />
              <span className="field-box__label">speed 0.4</span>
            </div>
            <div className="field-box">
              <DotField placement="absolute" motion="static" />
              <span className="field-box__label">motion static</span>
            </div>
          </div>
        </DemoFrame>

        <DemoFrame
          title="ドットの形と色"
          description="color を省略すると --dotterel-field-color を使います。"
          code={`<DotField placement="absolute" shape="circle" dotSize={3} gap={10} />
<DotField placement="absolute" shape="diamond" color="rgba(120, 90, 200, 0.35)" />`}
          stageClassName="demo__stage--field"
        >
          <div className="field-pair">
            <div className="field-box">
              <DotField placement="absolute" shape="circle" dotSize={3} gap={10} />
              <span className="field-box__label">circle</span>
            </div>
            <div className="field-box">
              <DotField
                placement="absolute"
                shape="diamond"
                color="rgba(120, 90, 200, 0.35)"
              />
              <span className="field-box__label">diamond</span>
            </div>
          </div>
        </DemoFrame>
      </div>
    </section>
  );
}
