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
      ? "sm:inset-y-3 sm:right-3 sm:left-auto sm:top-3 sm:h-auto sm:w-[420px] sm:rounded-3xl"
      : "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[86vh] sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" />
      <div
        ref={panel}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 flex h-[88dvh] animate-rise flex-col rounded-t-3xl bg-sand-50 shadow-lift outline-none ${desktop}`}
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-ink">{titel}</div>
            {untertitel ? <div className="text-xs text-muted">{untertitel}</div> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen" className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="border-t border-line bg-white/80 p-3">{footer}</div> : null}
      </div>
    </div>
  );
}
