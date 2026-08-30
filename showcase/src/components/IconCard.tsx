import { ICONS, Icon, type IconAnimationTrigger, type IconName } from "dotterel-ui/icon";
import type { DotShape, DotSize } from "dotterel-ui/core";

import { CATEGORY_LABELS, ICON_METADATA } from "../catalog/icon-metadata";
import { CopyCodeButton } from "./CopyCodeButton";

export type IconDisplay = {
  readonly size: DotSize;
  readonly shape: DotShape;
  readonly animation: IconAnimationTrigger | "none";
};

type IconCardProps = {
  readonly name: IconName;
  readonly display: IconDisplay;
  /** アニメーションを撒き直すためのキー。変わると再マウントする */
  readonly replayKey: number;
};

export function iconSnippet(name: IconName, display: IconDisplay): string {
  const props = [`name="${name}"`];

  if (display.size !== "md") props.push(`size="${display.size}"`);
  if (display.shape !== "square") props.push(`shape="${display.shape}"`);
  if (display.animation !== "none") props.push(`animation="${display.animation}"`);

  return `<Icon ${props.join(" ")} />`;
}

export function IconCard({ name, display, replayKey }: IconCardProps) {
  const metadata = ICON_METADATA[name];
  const rows = ICONS[name].rows;
  const matrix = `${rows.length}×${rows[0]?.length ?? 0}`;
  const animation = display.animation === "none" ? undefined : display.animation;

  return (
    <li className="icon-card">
      <div className="icon-card__stage">
        <Icon
          key={`${replayKey}-${display.animation}`}
          name={name}
          size={display.size}
          shape={display.shape}
          {...(animation ? { animation } : {})}
        />
      </div>
      <p className="icon-card__name">{name}</p>
      <p className="icon-card__meta">
        {CATEGORY_LABELS[metadata.category]} ・ {matrix}
      </p>
      <div className="icon-card__variants">
        <span className="icon-card__variant">
          <Icon name={name} size="sm" shape={display.shape} />
          <span className="icon-card__caption">装飾</span>
        </span>
        <span className="icon-card__variant">
          <Icon name={name} size="sm" shape={display.shape} label={name} />
          <span className="icon-card__caption">label あり</span>
        </span>
      </div>
      <code className="icon-card__snippet">{iconSnippet(name, display)}</code>
      <CopyCodeButton code={iconSnippet(name, display)} label={`${name} の JSX をコピー`} />
    </li>
  );
}
