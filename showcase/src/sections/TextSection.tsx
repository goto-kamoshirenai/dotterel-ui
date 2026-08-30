import { DotText } from "dotterel-ui/text";

import { DemoFrame } from "../components/DemoFrame";

export function TextSection() {
  return (
    <section id="text" className="section" aria-labelledby="text-heading">
      <header className="section__head">
        <h2 id="text-heading" className="section__title">
          表示用テキスト
        </h2>
        <p className="section__lead">
          同梱フォント <strong>Dotterel Dots</strong> は大文字、数字、基本記号だけを持ちます。収録外の文字は{" "}
          <code>--dotterel-font-family-dot</code> の後続フォントが受けます。
        </p>
      </header>

      <div className="demo-grid">
        <DemoFrame
          title="見出しに使う"
          description="既定で大文字化します。as で要素を選べます。"
          code={`<DotText as="h3">dotterel ui</DotText>`}
        >
          <DotText as="h3" className="metric">
            dotterel ui
          </DotText>
        </DemoFrame>

        <DemoFrame
          title="大文字化しない"
          description="transform='none' で入力どおりに出します。"
          code={`<DotText transform="none">Dotterel UI 2026</DotText>`}
        >
          <p className="metric">
            <DotText transform="none">Dotterel UI 2026</DotText>
          </p>
        </DemoFrame>

        <DemoFrame
          title="桁を揃える"
          description="tabular で等幅数字にします。表や指標で桁がぶれません。"
          code={`<DotText tabular>1,204,860</DotText>
<DotText tabular>0,000,000</DotText>`}
        >
          <div className="stack">
            <DotText tabular className="metric">
              1,204,860
            </DotText>
            <DotText tabular className="metric">
              0,000,000
            </DotText>
          </div>
        </DemoFrame>

        <DemoFrame
          title="収録外の文字"
          description="日本語や小文字はフォールバック側の書体で表示されます。"
          code={`<DotText transform="none">建築 ARCHITECTURE 2026</DotText>`}
        >
          <p className="metric">
            <DotText transform="none">建築 ARCHITECTURE 2026</DotText>
          </p>
        </DemoFrame>

        <DemoFrame
          title="React を使わない場合"
          description="クラスだけでも同じ見た目になります。"
          code={`<span class="dotterel-text dotterel-text--uppercase">catalog</span>`}
        >
          <p className="metric">
            <span className="dotterel-text dotterel-text--uppercase">catalog</span>
          </p>
        </DemoFrame>
      </div>
    </section>
  );
}
