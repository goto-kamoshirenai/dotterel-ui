import { useCallback, useEffect, useRef, useState } from "react";

import { DotButton } from "dotterel-ui/button";
import { Icon } from "dotterel-ui/icon";

const FEEDBACK_MS = 2000;

type CopyCodeButtonProps = {
  readonly code: string;
  readonly label?: string;
};

/** コード片をクリップボードへ写す。結果は文言とアイコンの両方で伝える */
export function CopyCodeButton({ code, label = "コードをコピー" }: CopyCodeButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);

    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }

    timer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
  }, [code]);

  return (
    <DotButton
      type="button"
      variant="quiet"
      onClick={copy}
      aria-label={label}
      className="showcase-copy"
    >
      <Icon
        name={state === "copied" ? "check" : state === "failed" ? "alert" : "copy"}
        animation="hover"
      />
      <span>
        {state === "copied" ? "コピーしました" : state === "failed" ? "コピーできません" : "コピー"}
      </span>
    </DotButton>
  );
}
