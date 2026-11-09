import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const row =
  "group flex w-full items-center gap-4 rounded-card bg-white/90 p-4 text-left shadow-soft ring-1 ring-line backdrop-blur-sm transition sm:p-5";
const active = "hover:-translate-y-0.5 hover:shadow-lift hover:ring-leaf-300 focus-visible:outline-2 focus-visible:outline-leaf-500";

function Inner({ icon, title, text, extra }: { icon: ReactNode; title: ReactNode; text?: ReactNode; extra?: ReactNode }) {
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-ink">{title}</span>
        {text ? <span className="mt-0.5 block text-sm text-muted">{text}</span> : null}
      </span>
      {extra}
      <ChevronRight className="size-5 shrink-0 text-leaf-600 transition group-hover:translate-x-0.5" aria-hidden />
    </>
  );
}

/**
 * Interactive selection row element. Views stack a limited number
 * to present focused, singular decision points per page.
 */
export function ChoiceLink(props: { href: string; icon: ReactNode; title: ReactNode; text?: ReactNode; extra?: ReactNode }) {
  return (
    <Link href={props.href} className={`${row} ${active}`}>
      <Inner {...props} />
    </Link>
  );
}

/** Interactive selection row configured as a form submit button. */
export function ChoiceButton(props: { name: string; value: string; icon: ReactNode; title: ReactNode; text?: ReactNode; extra?: ReactNode }) {
  return (
    <button type="submit" name={props.name} value={props.value} className={`${row} ${active}`}>
      <Inner {...props} />
    </button>
  );
}
