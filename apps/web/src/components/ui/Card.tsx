import type { ComponentProps, ReactNode } from "react";

/** Card container surface with subtle translucency and backdrop blur. */
export function Card({ children, className = "", ...props }: ComponentProps<"section">) {
  return (
    <section className={`rounded-card bg-white/88 p-5 shadow-soft ring-1 ring-line backdrop-blur-sm sm:p-6 ${className}`} {...props}>
      {children}
    </section>
  );
}

/** Section heading component with optional trailing hint. */
export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-ink">{children}</h2>
      {hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </div>
  );
}
