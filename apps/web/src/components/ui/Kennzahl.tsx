import type { ReactNode } from "react";

/**
 * A figure with its unit and a label underneath (design system "Kennzahl").
 * `xl` is the one answer of a page (max. one per view), `l` sits in a Kennzahlen-Leiste, `m` in summaries.
 */
const WERT_CLASS = {
  xl: "text-figure-xl",
  l: "text-figure-l",
  m: "text-figure-m",
} as const;

export function Kennzahl({
  wert,
  einheit,
  label,
  groesse = "l",
  className = "",
  wertClassName = "",
}: {
  wert: ReactNode;
  einheit?: ReactNode;
  label?: ReactNode;
  groesse?: keyof typeof WERT_CLASS;
  className?: string;
  wertClassName?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span className={`${WERT_CLASS[groesse]} tabular-nums text-fg ${wertClassName}`}>
        {wert}
        {einheit ? <span className="ml-[0.08em] text-[0.45em] font-bold tracking-normal">{einheit}</span> : null}
      </span>
      {label ? <span className="mt-1.5 text-small text-fg-muted">{label}</span> : null}
    </div>
  );
}

/** Row of 2–4 Kennzahlen: rule on top, dividers between, divider below. */
export function KennzahlLeiste({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 border-t border-rule border-b border-divider sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none [&>*]:py-4 [&>*]:pr-4 sm:[&>*+*]:border-l sm:[&>*+*]:border-divider sm:[&>*+*]:pl-6 ${className}`}
    >
      {children}
    </div>
  );
}
