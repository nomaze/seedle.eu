import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Standard page header: back link, meta line, title (text-title), optional lead and aside.
 * Spans the full width; the lead keeps to the reading measure.
 */
export function PageHeader({
  back,
  eyebrow,
  title,
  lead,
  aside,
}: {
  back?: { href: string; label: string };
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-10">
      {back ? (
        <Link
          href={back.href}
          className="-ml-1 inline-flex min-h-touch items-center gap-1 rounded-control px-1 text-small text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      ) : null}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          {eyebrow ? <div className="mb-2 text-body text-fg-muted">{eyebrow}</div> : null}
          <h1 className="text-title text-fg">{title}</h1>
        </div>
        {aside ? <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{aside}</div> : null}
      </div>
      {lead ? <p className="mt-4 max-w-measure text-lead text-fg-muted">{lead}</p> : null}
    </header>
  );
}
