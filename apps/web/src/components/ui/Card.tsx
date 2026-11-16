import type { ComponentProps, ReactNode } from "react";

/**
 * Flat page section (design system "Abschnitt"): a divider on top and section spacing,
 * no background, no radius, no shadow. The name stays `Card` so existing pages keep working.
 */
export function Card({ children, className = "", ...props }: ComponentProps<"section">) {
  return (
    <section className={`border-t border-divider pt-6 ${className}`} {...props}>
      {children}
    </section>
  );
}

/** Section heading (text-heading), optional hint or quiet action on the right. */
export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-heading text-fg">{children}</h2>
      {hint ? <span className="text-small text-fg-muted">{hint}</span> : null}
    </div>
  );
}
