import type { ReactNode } from "react";

const tones = {
  leaf: "bg-leaf-50 text-leaf-800 ring-leaf-200",
  sand: "bg-sand-100 text-ink ring-sand-300",
  bee: "bg-bee-soft text-bee-text ring-bee/40",
  poppy: "bg-poppy-soft text-[#9a2e1b] ring-[#f4c3b6]",
  neutral: "bg-white text-muted ring-line",
  "status-ok": "bg-status-ok-soft text-status-ok-text ring-status-ok-border",
  "status-action": "bg-status-action-soft text-status-action-text ring-status-action-border",
  "status-problem": "bg-status-problem-soft text-status-problem-text ring-status-problem-border",
  "status-urgent": "bg-status-urgent-soft text-status-urgent-text ring-status-urgent-border",
};

export function Badge({ children, tone = "neutral", title }: { children: ReactNode; tone?: keyof typeof tones; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Display badge rendered when synthetic demo datasets are active. */
export function DemoBadge() {
  return (
    <Badge tone="bee" title="Versuchs-, Wetter- und Modelldaten sind derzeit Beispieldaten. Echte LSV-Daten und NoMaze-Predictions folgen.">
      Demodaten
    </Badge>
  );
}

export function FieldStatusBadge({
  status = "status-ok",
  className = "",
}: {
  status?: "status-ok" | "status-action" | "status-problem" | "status-urgent";
  className?: string;
}) {
  switch (status) {
    case "status-ok":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 bg-status-ok-soft text-status-ok-text ring-status-ok-border ${className}`}
        >
          <span className="size-1.5 rounded-full bg-status-ok shrink-0" aria-hidden="true" />
          Alles im Plan
        </span>
      );
    case "status-action":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 bg-status-action-soft text-status-action-text ring-status-action-border ${className}`}
        >
          <span className="size-1.5 rounded-full bg-status-action shrink-0" aria-hidden="true" />
          Aktion nötig
        </span>
      );
    case "status-problem":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 bg-status-problem-soft text-status-problem-text ring-status-problem-border ${className}`}
        >
          <span className="size-1.5 rounded-full bg-status-problem shrink-0" aria-hidden="true" />
          Problem erkannt
        </span>
      );
    case "status-urgent":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 bg-status-urgent-soft text-status-urgent-text ring-status-urgent-border ${className}`}
        >
          <span className="size-1.5 rounded-full bg-status-urgent shrink-0" aria-hidden="true" />
          Sofort handeln
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 bg-status-ok-soft text-status-ok-text ring-status-ok-border ${className}`}
        >
          <span className="size-1.5 rounded-full bg-status-ok shrink-0" aria-hidden="true" />
          Alles im Plan
        </span>
      );
  }
}
