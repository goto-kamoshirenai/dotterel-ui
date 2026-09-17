import type { ReactNode } from "react";

import { DotButton, DotLink, DotLinkAdapter } from "dotterel-ui/button";
import { Icon } from "dotterel-ui/icon";

import { DemoFrame } from "../components/DemoFrame";

/** Next.js の <Link> のように、独自のリンク実装へ見た目を被せる例 */
function RouterLink({
  href,
  children,
  ...rest
}: {
  readonly href: string;
  readonly children?: ReactNode;
  readonly className?: string;
}) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export function ButtonsSection() {
  return (
    <section id="buttons" className="section" aria-labelledby="buttons-heading">
      <header className="section__head">
        <h2 id="buttons-heading" className="section__title">
          ボタンとリンク
        </h2>
        <p className="section__lead">
          押す操作は <code>DotButton</code>、移動は <code>DotLink</code> に分けています。既存のリンク実装へ被せるときは{" "}
          <code>DotLinkAdapter</code> を使います。
        </p>
      </header>

      <div className="demo-grid">
        <DemoFrame
          title="見た目の種類"
          description="variant で役割を表します。danger は取り消せない操作にだけ使ってください。"
          code={`<DotButton>保存</DotButton>
<DotButton variant="primary">公開する</DotButton>
<DotButton variant="quiet">あとで</DotButton>
<DotButton variant="danger">削除</DotButton>`}
        >
          <div className="row">
            <DotButton type="button">保存</DotButton>
            <DotButton type="button" variant="primary">
              公開する
            </DotButton>
            <DotButton type="button" variant="quiet">
              あとで
            </DotButton>
            <DotButton type="button" variant="danger">
              削除
            </DotButton>
          </div>
        </DemoFrame>

        <DemoFrame
          title="状態"
          description="disabled は押せないこと、status='busy' は処理中であることを伝えます。"
          code={`<DotButton disabled>保存</DotButton>
<DotButton status="busy" variant="primary">送信中</DotButton>`}
        >
          <div className="row">
            <DotButton type="button" disabled>
              保存
            </DotButton>
            <DotButton type="button" status="busy" variant="primary">
              送信中
            </DotButton>
          </div>
        </DemoFrame>

        <DemoFrame
          title="アイコン付き"
          description="アイコンだけのボタンには必ず aria-label を付けます。"
          code={`<DotButton variant="primary">
  <Icon name="save" animation="hover" />
  <span>保存する</span>
</DotButton>

<DotButton variant="quiet" aria-label="この行を削除">
  <Icon name="trash" animation="hover" />
</DotButton>`}
        >
          <div className="row">
            <DotButton type="button" variant="primary">
              <Icon name="save" animation="hover" />
              <span>保存する</span>
            </DotButton>
            <DotButton type="button" variant="quiet" aria-label="この行を削除">
              <Icon name="trash" animation="hover" />
            </DotButton>
          </div>
        </DemoFrame>

        <DemoFrame
          title="リップルの調整"
          description="押した位置からドットが広がります。ripple='none' で止められます。"
          code={`<DotButton ripple={{ shape: "circle", size: "lg", duration: 700 }}>
  円のリップル
</DotButton>
<DotButton ripple="none">リップルなし</DotButton>`}
        >
          <div className="row">
            <DotButton type="button" ripple={{ shape: "circle", size: "lg", duration: 700 }}>
              円のリップル
            </DotButton>
            <DotButton type="button" ripple="none">
              リップルなし
            </DotButton>
          </div>
        </DemoFrame>

        <DemoFrame
          title="リンク"
          description="移動には <a> を使います。外部リンクであることはアイコンと文言で示します。"
          code={`<DotLink href="https://github.com/goto-kamoshirenai/dotterel-ui">
  <span>リポジトリ</span>
  <Icon name="external-link" animation="hover" />
</DotLink>`}
        >
          <div className="row">
            <DotLink
              href="https://github.com/goto-kamoshirenai/dotterel-ui"
              target="_blank"
              rel="noreferrer"
            >
              <span>リポジトリ</span>
              <Icon name="external-link" animation="hover" />
            </DotLink>
          </div>
        </DemoFrame>

        <DemoFrame
          title="既存のリンク実装へ被せる"
          description="Next.js の <Link> など、自前のリンクコンポーネントへ見た目だけを渡します。"
          code={`<DotLinkAdapter variant="primary">
  <NextLink href="/books">書籍一覧へ</NextLink>
</DotLinkAdapter>`}
        >
          <div className="row">
            <DotLinkAdapter variant="primary">
              <RouterLink href="#icons">アイコン一覧へ</RouterLink>
            </DotLinkAdapter>
          </div>
        </DemoFrame>
      </div>
    </section>
  );
}
