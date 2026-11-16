import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Option tile (design system "Auswahl", GOV.UK-like): a rectangular answer with a control
 * outline. Selected = action ring on the highlight surface. No pills, no shadows, no gradients.
 */
export function optionClass(active: boolean, extra = "") {
  return `rounded-control text-left ${
    active
      ? "bg-highlight ring-2 ring-inset ring-action"
      : "bg-surface ring-1 ring-inset ring-control"
  } ${extra}`;
}

/** One segment of a segmented switch: rectangular buttons side by side, active = selected fill. */
export function segmentClass(active: boolean, extra = "") {
  return `inline-flex min-h-touch items-center justify-center gap-1.5 rounded-control px-3.5 text-small font-semibold ring-1 ring-inset ${
    active
      ? "bg-selected text-on-selected ring-selected"
      : "bg-surface text-fg ring-control"
  } ${extra}`;
}

/** Checkbox look for multi-select option tiles (square box, tick when selected). */
export function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center rounded-[3px] border-2 ${
        checked ? "border-action bg-action text-fg-inverse" : "border-control bg-surface"
      }`}
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </span>
  );
}

/** Radio look for single-select option tiles (circle, filled dot when selected). */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-surface ${
        checked ? "border-action" : "border-control"
      }`}
    >
      {checked ? <span className="size-2.5 rounded-full bg-action" /> : null}
    </span>
  );
}

const row =
  "group flex w-full min-h-touch items-center gap-4 p-4 sm:p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function Inner({ icon, title, text, extra }: { icon: ReactNode; title: ReactNode; text?: ReactNode; extra?: ReactNode }) {
  return (
    <>
      <span className="shrink-0 text-link">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-subheading text-fg">{title}</span>
        {text ? <span className="mt-1 block text-small text-fg-muted">{text}</span> : null}
      </span>
      {extra}
      <ChevronRight className="size-5 shrink-0 text-link" aria-hidden />
    </>
  );
}

/**
 * Interactive selection row element. Views stack a limited number
 * to present focused, singular decision points per page.
 */
export function ChoiceLink(props: {
  href: string;
  icon: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  extra?: ReactNode;
  onClick?: () => void;
  role?: string;
  "aria-checked"?: boolean;
  "data-testid"?: string;
}) {
  return (
    <Link
      href={props.href}
      onClick={props.onClick}
      role={props.role}
      aria-checked={props["aria-checked"]}
      data-testid={props["data-testid"]}
      className={optionClass(Boolean(props["aria-checked"]), row)}
    >
      <Inner {...props} />
    </Link>
  );
}

/** Interactive selection row configured as a form submit button. */
export function ChoiceButton(props: { name: string; value: string; icon: ReactNode; title: ReactNode; text?: ReactNode; extra?: ReactNode }) {
  return (
    <button type="submit" name={props.name} value={props.value} className={optionClass(false, row)}>
      <Inner {...props} />
    </button>
  );
}
