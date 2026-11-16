"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Responsive modal sheet overlay: bottom drawer on mobile, side or centered modal on desktop.
 * Dismissable via Escape key and backdrop click.
 */
export function Sheet({
  offen,
  onClose,
  titel,
  untertitel,
  icon,
  lage = "seite",
  children,
  footer,
}: {
  offen: boolean;
  onClose: () => void;
  titel: ReactNode;
  untertitel?: ReactNode;
  icon?: ReactNode;
  lage?: "seite" | "mitte";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [offen, onClose]);

  if (!offen) return null;
  const desktop =
    lage === "seite"
      ? "sm:inset-y-3 sm:right-3 sm:left-auto sm:top-3 sm:h-auto sm:w-[420px] sm:rounded-panel"
      : "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[86vh] sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-scrim" />
      <div
        ref={panel}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 flex h-[88dvh] flex-col rounded-t-panel bg-surface shadow-lift outline-none motion-safe:animate-rise motion-safe:[animation-duration:180ms] ${desktop}`}
      >
        <div className="flex items-center gap-3 border-b border-divider py-3 pl-5 pr-3">
          {icon}
          <div className="min-w-0 flex-1">
            <div className="text-heading text-fg">{titel}</div>
            {untertitel ? <div className="mt-0.5 text-small text-fg-muted">{untertitel}</div> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen" className="flex size-touch shrink-0 items-center justify-center rounded-control text-link transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="border-t border-divider px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
