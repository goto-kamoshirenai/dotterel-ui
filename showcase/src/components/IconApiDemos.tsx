import { DotIcon, Icon, createDotIcon } from "dotterel-ui/icon";
import { DotButton } from "dotterel-ui/button";

import { DemoFrame } from "./DemoFrame";

/** 登録簿へ入れるほどではない形。行列をそのまま DotIcon へ渡す */
const SPARK_ROWS = ["..#..", "..#..", "#####", "..#..", "..#.."] as const;

/** 同じ形を何度も使う場合は部品にしておく。rows を呼び出し側から隠せる */
const LeafIcon = createDotIcon(
  ["...##", "..###", ".####", "##.#.", "...#."],
  "LeafIcon",
);

/**
 * 登録済みアイコンの一覧では見えない使い分けを示す。
 * 意味の有無、登録簿に無い形、自作アイコンの部品化の 3 つを扱う。
 */
export function IconApiDemos() {
  return (
    <div className="subsection">
      <h3 className="subsection__title">使い分けと拡張</h3>
      <p className="subsection__lead">
        アイコンに意味があるかどうかで <code>label</code> の要否が変わります。登録簿に無い形は{" "}
        <code>DotIcon</code> と <code>createDotIcon</code> で足せます。
      </p>

      <div className="demo-grid">
        <DemoFrame
          title="文字が隣にあるときは装飾"
          description="同じ意味を文字が伝えているので、アイコンは読み上げません。label は付けません。"
          code={`<DotButton type="button" variant="danger">
  <Icon name="trash" animation="hover" />
  <span>削除</span>
</DotButton>`}
        >
          <DotButton type="button" variant="danger">
            <Icon name="trash" animation="hover" />
            <span>削除</span>
          </DotButton>
        </DemoFrame>

        <DemoFrame
          title="アイコンだけのときは名前を持たせる"
          description="label を渡すと img ロールと名前が付きます。操作側の aria-label と役割が重ならないようにします。"
          code={`<DotButton type="button" variant="quiet" aria-label="お気に入りへ追加">
  <Icon name="star" animation="hover" />
</DotButton>

<Icon name="star" label="お気に入り" />`}
        >
          <div className="row">
            <DotButton type="button" variant="quiet" aria-label="お気に入りへ追加">
              <Icon name="star" animation="hover" />
            </DotButton>
            <Icon name="star" label="お気に入り" />
          </div>
        </DemoFrame>

        <DemoFrame
          title="登録簿に無い形を描く"
          description="行列を直接渡します。# が点灯、それ以外は消灯です。size や shape は Icon と同じです。"
          code={`const SPARK_ROWS = ["..#..", "..#..", "#####", "..#..", "..#.."];

<DotIcon rows={SPARK_ROWS} size="lg" />
<DotIcon rows={SPARK_ROWS} size="lg" shape="diamond" label="強調" />`}
        >
          <div className="row">
            <DotIcon rows={SPARK_ROWS} size="lg" />
            <DotIcon rows={SPARK_ROWS} size="lg" shape="diamond" label="強調" />
          </div>
        </DemoFrame>

        <DemoFrame
          title="自作アイコンを部品にする"
          description="createDotIcon は rows を閉じ込めた component を返します。使う側は Icon と同じ props を渡せます。"
          code={`const LeafIcon = createDotIcon(
  ["...##", "..###", ".####", "##.#.", "...#."],
  "LeafIcon",
);

<LeafIcon />
<LeafIcon size="lg" shape="circle" animation="always" />`}
        >
          <div className="row">
            <LeafIcon />
            <LeafIcon size="lg" shape="circle" animation="always" />
          </div>
        </DemoFrame>
      </div>
    </div>
  );
}
