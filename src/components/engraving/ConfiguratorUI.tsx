"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/format";

// The cfg-* class names are styling hooks: each atelier re-cuts the configurator in src/app/branch-systems.css.

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** Numbered configurator step: a fieldset labelled by its visible heading, so its options are announced as a group. */
export function Step({
  id,
  index,
  title,
  aside,
  description,
  error,
  children,
}: {
  id: string;
  index: number;
  title: string;
  aside?: ReactNode;
  description?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <fieldset
      id={id}
      aria-labelledby={`${id}-title`}
      className="cfg-step grid min-w-0 scroll-mt-24 gap-5 border-t border-line pt-8"
    >
      <div className="cfg-step-head flex items-baseline justify-between gap-4">
        <div className="cfg-step-label flex items-baseline gap-4">
          <span aria-hidden="true" data-roman={ROMAN[index - 1]} className="cfg-step-index font-mono text-xs text-metal-text">
            {String(index).padStart(2, "0")}
          </span>
          <h2 id={`${id}-title`} className="cfg-step-title display text-2xl">
            {title}
          </h2>
        </div>
        {aside && <div className="cfg-step-aside shrink-0 text-sm text-muted">{aside}</div>}
      </div>
      {description && <div className="-mt-2 text-sm text-muted">{description}</div>}
      {children}
      {error && (
        <p role="alert" className="text-sm font-medium text-metal-text">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export const optionClass =
  "cfg-option relative flex cursor-pointer items-center gap-3 rounded-branch border border-line bg-bg px-4 py-3 text-left transition-colors hover:border-line-strong has-checked:border-ink has-checked:bg-surface has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:opacity-50";

/** Radio rendered as a selectable card. */
export function OptionCard({
  name,
  value,
  checked,
  onChange,
  disabled,
  children,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn(optionClass, className)}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/** Accessible on/off switch with a label and an optional price tag. */
export function Toggle({
  checked,
  onChange,
  label,
  detail,
  price,
  icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  detail?: ReactNode;
  price?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "cfg-toggle flex w-full items-center gap-4 rounded-branch border px-4 py-4 text-left transition-colors",
        checked ? "border-ink bg-surface" : "border-line bg-bg hover:border-line-strong",
      )}
    >
      {icon && <span className="shrink-0 text-metal">{icon}</span>}
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="font-medium">{label}</span>
        {detail && <span className="text-sm text-muted">{detail}</span>}
        {price && <span className="text-sm font-medium text-metal-text">{price}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "cfg-switch relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-accent bg-accent" : "border-line-strong bg-surface",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all",
            checked ? "left-[1.4rem] bg-accent-ink" : "left-1 bg-muted",
          )}
        />
      </span>
    </button>
  );
}
