import "@testing-library/jest-dom/vitest";

import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom には無いブラウザ API を、テストが依存する最小限だけ用意する
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof window.IntersectionObserver;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof window.ResizeObserver;
}

// DotField は canvas を使う。jsdom には実装が無いので黙って何もしない文脈を返す
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as
  typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-dotterel-theme");
  vi.restoreAllMocks();
});
