import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Standard page header: back navigation link top-left,
 * contextual eyebrow, title, optional summary lead, and aside action slot.
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
    <header className="mb-6 sm:mb-8">
      <div className="h-9">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-white/80 pl-2 pr-4 text-sm font-medium text-ink ring-1 ring-line backdrop-blur-sm transition hover:bg-white hover:ring-leaf-300"
          >
            <ChevronLeft className="size-4 text-leaf-700" aria-hidden />
            {back.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <div className="mb-1.5 text-sm font-medium text-leaf-700">{eyebrow}</div> : null}
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h1>
        </div>
        {aside}
      </div>
      {lead ? <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{lead}</p> : null}
    </header>
  );
}
