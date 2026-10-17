import {
  DOT_FIELD_CANVAS_CLASS,
  DOT_FIELD_CLASS,
  DOT_FIELD_COLOR_PROPERTY,
  DOT_FIELD_DEFAULTS,
  startDotField,
  type DotFieldCanvasOptions,
  type DotFieldPlacement,
} from "../internal/field-canvas.js";

export type {
  DotFieldCanvasOptions,
  DotFieldMotion,
  DotFieldPlacement,
} from "../internal/field-canvas.js";

export type MountDotFieldOptions = DotFieldCanvasOptions & {
  /** ドットの色。`--dotterel-field-color` へ入れる */
  readonly color?: string;
  /** 敷き方。`DotField` の `placement` と同じ */
  readonly placement?: DotFieldPlacement;
  /** 新しく組む場合に、外側の要素へ足すクラス */
  readonly className?: string;
};

export type DotFieldHandle = {
  /** `.dotterel-field` の要素 */
  readonly element: HTMLElement;
  /** 描画と見張りを止める。差し込んだ要素は取り除く */
  readonly destroy: () => void;
};

function findField(target: HTMLElement): HTMLElement | null {
  if (target.classList.contains(DOT_FIELD_CLASS)) {
    return target;
  }

  return target.querySelector<HTMLElement>(`:scope > .${DOT_FIELD_CLASS}`);
}

/**
 * React を使わずに、ドットの場 (DotField) を置いて動かす。
 *
 * `target` 自身か、その直下に `.dotterel-field` があれば (Astro などで `DotField` を
 * 静的に描いた場合) それを使い回す。無ければ `DotField` と同じ要素
 * (`aria-hidden` の `div.dotterel-field` と `canvas.dotterel-field__canvas`) を
 * `target` の末尾へ足す。描画は `DotField` と同じ処理 (端末の画素へ整数で合わせる、
 * 動きを減らす設定で止める) を使う。
 *
 *   import { mountDotField } from "dotterel-ui/dom";
 *   mountDotField(document.body, { density: 0.7, speed: 0.8 });
 */
export function mountDotField(
  target: HTMLElement,
  options: MountDotFieldOptions = {},
): DotFieldHandle {
  const document = target.ownerDocument;
  const existing = findField(target);
  const field = existing ?? document.createElement("div");

  if (existing === null) {
    field.className = DOT_FIELD_CLASS;

    if (options.className !== undefined) {
      field.classList.add(...options.className.split(/\s+/).filter((name) => name !== ""));
    }

    field.setAttribute("data-placement", options.placement ?? DOT_FIELD_DEFAULTS.placement);
    field.setAttribute("aria-hidden", "true");
  } else if (options.placement !== undefined) {
    field.setAttribute("data-placement", options.placement);
  }

  if (options.color !== undefined) {
    field.style.setProperty(DOT_FIELD_COLOR_PROPERTY, options.color);
  }

  const existingCanvas = field.querySelector<HTMLCanvasElement>(
    `:scope > canvas.${DOT_FIELD_CANVAS_CLASS}`,
  );
  const canvas = existingCanvas ?? document.createElement("canvas");

  if (existingCanvas === null) {
    canvas.className = DOT_FIELD_CANVAS_CLASS;
    field.append(canvas);
  }

  if (existing === null) {
    target.append(field);
  }

  const stop = startDotField(canvas, options);
  let destroyed = false;

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    stop();

    if (existing === null) {
      field.remove();
    } else if (existingCanvas === null) {
      canvas.remove();
    }
  };

  return { element: field, destroy };
}
