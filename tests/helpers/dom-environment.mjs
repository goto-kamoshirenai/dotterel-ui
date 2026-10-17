import { JSDOM } from "jsdom";

/**
 * dotterel-ui/dom と React のフックを同じ条件で動かすための jsdom 環境。
 *
 * jsdom に無いもの (ResizeObserver、IntersectionObserver、matchMedia) は
 * テストから操作できる形で差し込み、requestAnimationFrame は手で進める。
 * ファイルごとに別のプロセスで動くので、グローバルへ直接載せる。
 */
export function installDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // フレームは手で進める。時刻は flush に渡した値を使う
  const frames = new Map();
  let nextFrame = 1;
  const requestAnimationFrame = (callback) => {
    const id = nextFrame;
    nextFrame += 1;
    frames.set(id, callback);
    return id;
  };
  const cancelAnimationFrame = (id) => {
    frames.delete(id);
  };
  const flushFrame = (time) => {
    const pending = [...frames.entries()];
    frames.clear();

    for (const [, callback] of pending) {
      callback(time);
    }
  };

  // 寸法の見張りは observe した時点で1回、resizeAll で再度呼ぶ
  const resizeObservers = new Set();
  function ResizeObserver(callback) {
    const targets = new Set();
    const observer = {
      observe(target) {
        targets.add(target);
        resizeObservers.add(observer);
        callback([], observer);
      },
      unobserve(target) {
        targets.delete(target);
      },
      disconnect() {
        targets.clear();
        resizeObservers.delete(observer);
      },
      notify() {
        if (targets.size > 0) {
          callback([], observer);
        }
      },
    };
    return observer;
  }
  const resizeAll = () => {
    for (const observer of [...resizeObservers]) {
      observer.notify();
    }
  };

  // 画面に入ったかどうかはテストから知らせる
  const intersectionObservers = new Set();
  function IntersectionObserver(callback, init) {
    const observer = {
      init,
      targets: new Set(),
      observe(target) {
        observer.targets.add(target);
        intersectionObservers.add(observer);
      },
      unobserve(target) {
        observer.targets.delete(target);
      },
      disconnect() {
        observer.targets.clear();
        intersectionObservers.delete(observer);
      },
      takeRecords() {
        return [];
      },
      enter() {
        callback(
          [...observer.targets].map((target) => ({ target, isIntersecting: true })),
          observer,
        );
      },
    };
    return observer;
  }
  const intersectAll = () => {
    for (const observer of [...intersectionObservers]) {
      observer.enter();
    }
  };

  // メディアクエリは条件ごとに一致を持ち、setMedia で切り替える
  const media = new Map();
  const mediaEntry = (query) => {
    if (!media.has(query)) {
      media.set(query, { matches: false, listeners: new Set() });
    }

    return media.get(query);
  };
  const matchMedia = (query) => {
    const entry = mediaEntry(query);
    return {
      media: query,
      get matches() {
        return entry.matches;
      },
      addEventListener(type, listener) {
        entry.listeners.add(listener);
      },
      removeEventListener(type, listener) {
        entry.listeners.delete(listener);
      },
      addListener(listener) {
        entry.listeners.add(listener);
      },
      removeListener(listener) {
        entry.listeners.delete(listener);
      },
    };
  };
  const setMedia = (query, matches) => {
    const entry = mediaEntry(query);
    entry.matches = matches;

    for (const listener of [...entry.listeners]) {
      listener({ matches, media: query });
    }
  };
  const mediaListeners = (query) => mediaEntry(query).listeners.size;

  window.requestAnimationFrame = requestAnimationFrame;
  window.cancelAnimationFrame = cancelAnimationFrame;
  window.matchMedia = matchMedia;
  window.ResizeObserver = ResizeObserver;
  window.IntersectionObserver = IntersectionObserver;
  // 遅延は Node のタイマーで動かす (グローバルの clearTimeout と組にするため)
  window.setTimeout = globalThis.setTimeout;
  window.clearTimeout = globalThis.clearTimeout;

  const globals = {
    window,
    document: window.document,
    requestAnimationFrame,
    cancelAnimationFrame,
    ResizeObserver,
    IntersectionObserver,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle.bind(window),
    Node: window.Node,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    HTMLCanvasElement: window.HTMLCanvasElement,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    PointerEvent: window.PointerEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  };

  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  /** 要素の寸法を決める (jsdom は配置を計算しないため) */
  const setSize = (element, width, height) => {
    element.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON() {},
    });
  };

  return {
    window,
    document: window.document,
    flushFrame,
    pendingFrames: () => frames.size,
    resizeAll,
    intersectAll,
    setMedia,
    mediaListeners,
    setSize,
  };
}
