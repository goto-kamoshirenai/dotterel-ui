import assert from "node:assert/strict";
import { test } from "node:test";
import { installDom } from "./helpers/dom-environment.mjs";

// react-dom/client は読み込んだ時点で DOM の有無を見るので、先に環境を用意する
const environment = installDom();
const { document } = environment;
const { MouseEvent, PointerEvent } = environment.window;
const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { renderToStaticMarkup } = await import("react-dom/server");
const { DotButton, useDotRipple } = await import("dotterel-ui/button");
const { mountDotRipple } = await import("dotterel-ui/dom");

/** useDotRipple を React で実際にマウントし、計測後のホストを返す */
async function renderHook(options, width, height) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let controls = null;

  function Host() {
    const ripple = useDotRipple(options);
    controls = ripple;

    return createElement(
      "div",
      {
        className: "dotterel-ripple-host",
        ref: (node) => {
          if (node !== null) {
            environment.setSize(node, width, height);
          }
        },
      },
      ripple.layer,
    );
  }

  await act(async () => {
    root.render(createElement(Host));
  });

  return {
    host: container.firstElementChild,
    controls: () => controls,
    unmount: () => act(async () => root.unmount()),
  };
}

/** 要素の外形 (タグ、属性、CSS変数) を比べられる形にする。style の書き方の揺れは無視する */
function shapeOfElement(element) {
  return {
    tag: element.tagName,
    attributes: element
      .getAttributeNames()
      .filter((name) => name !== "style")
      .map((name) => [name, element.getAttribute(name)]),
    style: Array.from(element.style, (name) => [name, element.style.getPropertyValue(name)]),
    children: Array.from(element.children, shapeOfElement),
  };
}

function mountHost(width, height, tag = "div") {
  const host = document.createElement(tag);
  host.className = "dotterel-ripple-host";
  host.append(document.createElement("span"));
  environment.setSize(host, width, height);
  document.body.append(host);
  return host;
}

test("the DOM ripple renders exactly what useDotRipple renders for the same grid", async () => {
  for (const options of [
    undefined,
    { shape: "diamond", size: "sm", duration: 700 },
    { shape: "circle", size: "xl" },
  ]) {
    const rendered = await renderHook(options, 95, 38);
    const host = mountHost(95, 38);
    const handle = mountDotRipple(host, options);
    const hookLayer = rendered.host.firstElementChild;

    assert.ok(hookLayer.children.length > 0, "the hook measured and drew cells");
    assert.equal(handle.layer.outerHTML, hookLayer.outerHTML);
    assert.equal(host.firstElementChild, handle.layer, "the layer is the first child");
    assert.equal(handle.hasCells(), rendered.controls().hasCells);
    assert.equal(handle.sweepMs(), rendered.controls().sweepMs);

    // 寸法が変わってマス目が変わっても、同じ出力を保つ
    environment.setSize(rendered.host, 180, 52);
    environment.setSize(host, 180, 52);
    await act(async () => environment.resizeAll());

    assert.equal(handle.layer.outerHTML, rendered.host.firstElementChild.outerHTML);
    assert.equal(handle.sweepMs(), rendered.controls().sweepMs);

    // 押したときも、フックと同じ変数と属性を載せる
    rendered.controls().press(37, 21);
    handle.press(37, 21);
    assert.ok(handle.layer.hasAttribute("data-press"));
    assert.equal(handle.layer.outerHTML, rendered.host.firstElementChild.outerHTML);

    handle.destroy();
    host.remove();
    await rendered.unmount();
  }
});

test("the empty layer matches the server-rendered layer of DotButton", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(DotButton, { ripple: { shape: "circle", duration: 320 } }, "Save"),
  );
  const staticLayer = container.querySelector(".dotterel-ripple");
  const host = document.createElement("div");
  host.append(document.createElement("span"));
  document.body.append(host);

  // 寸法が 0 の間はマスを作らない。サーバ側で描いたものと同じ空のレイヤーになる
  const handle = mountDotRipple(host, { shape: "circle", duration: 320 });

  assert.deepEqual(shapeOfElement(handle.layer), shapeOfElement(staticLayer));
  handle.destroy();
  host.remove();
});

test("statically rendered markup is reused instead of inserting a second layer", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(DotButton, { ripple: { shape: "diamond", duration: 700 } }, "Save"),
  );
  document.body.append(container);
  const host = container.firstElementChild;
  const staticLayer = host.firstElementChild;
  environment.setSize(host, 120, 40);

  const handle = mountDotRipple(host);

  assert.equal(handle.layer, staticLayer);
  assert.equal(host.querySelectorAll(".dotterel-ripple").length, 1);
  // 指定が無い形と明滅の時間は、静的に描いたレイヤーから読む
  assert.equal(staticLayer.className, "dotterel-ripple dotterel-ripple--diamond");
  assert.equal(staticLayer.style.getPropertyValue("--dotterel-ripple-press-duration"), "700ms");
  assert.equal(staticLayer.children.length, 12 * 4);
  assert.equal(staticLayer.style.getPropertyValue("--dotterel-ripple-columns"), "12");

  // 使い回したレイヤーは残し、静的に描いたときの空の状態へ戻す
  handle.destroy();
  assert.equal(host.firstElementChild, staticLayer);
  assert.equal(staticLayer.children.length, 0);
  assert.equal(staticLayer.style.getPropertyValue("--dotterel-ripple-columns"), "0");
  container.remove();
});

test("pressing sets the origin variables and restarts data-press", () => {
  const host = mountHost(100, 40, "button");
  const handle = mountDotRipple(host);
  const { layer } = handle;

  handle.press(25, 15);
  assert.equal(layer.style.getPropertyValue("--dotterel-ripple-press-x"), "2");
  assert.equal(layer.style.getPropertyValue("--dotterel-ripple-press-y"), "1");
  assert.equal(layer.getAttribute("data-press"), "");

  // ポインタで押すと、押した位置から
  layer.removeAttribute("data-press");
  host.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, clientX: 95, clientY: 35 }),
  );
  assert.equal(layer.style.getPropertyValue("--dotterel-ripple-press-x"), "9");
  assert.equal(layer.style.getPropertyValue("--dotterel-ripple-press-y"), "3");
  assert.ok(layer.hasAttribute("data-press"));

  // キーボードでの実行 (detail=0) は中心から。マウスのクリック (detail=1) では動かさない
  layer.removeAttribute("data-press");
  host.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  assert.equal(layer.hasAttribute("data-press"), false);
  host.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
  assert.equal(layer.style.getPropertyValue("--dotterel-ripple-press-x"), "4.5");
  assert.equal(layer.style.getPropertyValue("--dotterel-ripple-press-y"), "1.5");
  assert.ok(layer.hasAttribute("data-press"));

  // 既定の動作を止められた操作や、無効なホストでは動かさない
  layer.removeAttribute("data-press");
  const prevented = new PointerEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    clientX: 5,
    clientY: 5,
  });
  prevented.preventDefault();
  host.dispatchEvent(prevented);
  host.setAttribute("aria-disabled", "true");
  host.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
  host.removeAttribute("aria-disabled");
  host.disabled = true;
  host.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
  assert.equal(layer.hasAttribute("data-press"), false);

  handle.destroy();
  host.remove();
});

test("bindEvents: false leaves press handling to the caller", () => {
  const host = mountHost(100, 40);
  const handle = mountDotRipple(host, { bindEvents: false });

  host.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
  assert.equal(handle.layer.hasAttribute("data-press"), false);
  handle.press(null, null);
  assert.ok(handle.layer.hasAttribute("data-press"));

  handle.destroy();
  host.remove();
});

test("media and onChange report the same state the hook exposes", () => {
  const query = "(min-width: 48rem)";
  const host = mountHost(200, 60);
  const changes = [];
  const handle = mountDotRipple(host, {
    size: "xl",
    media: query,
    onChange: (state) => changes.push(state),
  });

  assert.equal(handle.hasCells(), false);
  assert.equal(handle.layer.children.length, 0);
  assert.deepEqual(changes, []);

  environment.setMedia(query, true);
  assert.equal(handle.hasCells(), true);
  assert.equal(handle.layer.children.length, 10 * 3);
  assert.deepEqual(changes.at(-1), { hasCells: true, sweepMs: 9 * 22 + 55 + 120 });

  environment.setMedia(query, false);
  assert.equal(handle.hasCells(), false);
  assert.equal(handle.layer.children.length, 0);
  assert.equal(handle.layer.style.getPropertyValue("--dotterel-ripple-columns"), "0");
  assert.deepEqual(changes.at(-1), { hasCells: false, sweepMs: 55 + 120 });

  handle.destroy();
  assert.equal(environment.mediaListeners(query), 0);
  host.remove();
});

test("destroy removes the inserted layer, listeners and observers", () => {
  const host = mountHost(100, 40);
  const handle = mountDotRipple(host);
  const { layer } = handle;

  assert.equal(layer.children.length, 40);
  handle.destroy();

  assert.equal(layer.isConnected, false);
  assert.equal(host.querySelector(".dotterel-ripple"), null);
  assert.equal(handle.hasCells(), false);

  // 見張りも押したときの処理も外れている
  environment.setSize(host, 300, 40);
  environment.resizeAll();
  assert.equal(layer.children.length, 0);
  host.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
  assert.equal(layer.hasAttribute("data-press"), false);

  // 2回呼んでも壊れない
  handle.destroy();
  host.remove();
});
