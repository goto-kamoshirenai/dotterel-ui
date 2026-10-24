"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useDotRipple } from "../button/dot-button.js";
import { classNames } from "../internal/class-names.js";

export type DotSelectOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
};

export type DotSelectProps = {
  readonly options: readonly DotSelectOption[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly name?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly className?: string;
};

type OptionRowProps = {
  readonly option: DotSelectOption;
  readonly id: string;
  readonly selected: boolean;
  readonly active: boolean;
  readonly onPointerMove: () => void;
  readonly onClick: () => void;
};

function OptionRow({ option, id, selected, active, onPointerMove, onClick }: OptionRowProps) {
  const { layer } = useDotRipple({ size: "lg" });

  return (
    <div
      id={id}
      className="dotterel-select__option dotterel-ripple-host"
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      data-active={active}
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      {layer}
      <span className="dotterel-ripple-label">{option.label}</span>
    </div>
  );
}

export function DotSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "選択してください",
  name,
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
}: DotSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { layer, rows, hasCells } = useDotRipple({ size: "lg" });
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  const firstEnabled = options.findIndex((option) => !option.disabled);
  const lastEnabled = options.reduce((last, option, index) => option.disabled ? last : index, -1);

  function show() {
    if (disabled || firstEnabled < 0) return;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled);
    setOpen(true);
  }

  function move(direction: 1 | -1) {
    if (!open) {
      show();
      return;
    }
    for (let step = 1; step <= options.length; step++) {
      const index = (activeIndex + direction * step + options.length * 2) % options.length;
      if (!options[index]?.disabled) {
        setActiveIndex(index);
        return;
      }
    }
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={classNames("dotterel-select", className)} data-open={open}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        ref={triggerRef}
        type="button"
        className="dotterel-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            move(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Home" && open) {
            event.preventDefault();
            setActiveIndex(firstEnabled);
          } else if (event.key === "End" && open) {
            event.preventDefault();
            setActiveIndex(lastEnabled);
          } else if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            choose(activeIndex);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "Tab") {
            setOpen(false);
          }
        }}
      >
        <span className="dotterel-select__value" data-placeholder={!selected}>{selected?.label ?? placeholder}</span>
        <span className="dotterel-select__chevron" aria-hidden="true" />
      </button>
      <div
        id={`${id}-listbox`}
        className="dotterel-select__panel"
        role="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-hidden={!open}
        style={{ "--dotterel-select-reveal-ms": `${hasCells ? rows * 32 + 180 : 0}ms` } as CSSProperties}
      >
        <div className="dotterel-select__reveal" aria-hidden="true">{layer}</div>
        <div className="dotterel-select__surface">
          <div className="dotterel-select__options">
            {options.map((option, index) => (
              <OptionRow
                key={option.value}
                option={option}
                id={`${id}-option-${index}`}
                selected={selectedValue === option.value}
                active={open && activeIndex === index}
                onPointerMove={() => {
                  if (!option.disabled && open) setActiveIndex(index);
                }}
                onClick={() => choose(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
