import type { ReactNode } from "react";
import { StatusMarker } from "./StatusMarker";

/**
 * Label (design system "Label", formerly a chip): a short classification set as plain small
 * text next to what it describes — no pill, no border, no fill. Following GOV.UK's tag guidance,
 * classifications are rare; most information belongs in the sentence or the table itself.
 */
const tones = {
  leaf: "text-link",
  sand: "text-fg-muted",
  bee: "text-bee-text",
  poppy: "text-status-urgent-text",
  neutral: "text-fg-muted",
  "status-ok": "text-status-ok-text",
  "status-action": "text-status-action-text",
  "status-problem": "text-status-problem-text",
  "status-urgent": "text-status-urgent-text",
};

export function Badge({
  children,
  tone = "neutral",
  title,
  "data-testid": dataTestId,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  title?: string;
  "data-testid"?: string;
}) {
  return (
    <span
      title={title}
      data-testid={dataTestId}
      className={`inline-flex items-center gap-1 text-caption font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Notice shown when synthetic demo datasets are active. */
export function DemoBadge() {
  return (
    <Badge tone="bee" title="Versuchs-, Wetter- und Modelldaten sind derzeit Beispieldaten. Echte LSV-Daten und NoMaze-Predictions folgen.">
      Demodaten
    </Badge>
  );
}

/** Field status as shape plus word in the "Feldfarben" (see StatusMarker). */
export function FieldStatusBadge({
  status = "status-ok",
  className = "",
}: {
  status?: "status-ok" | "status-action" | "status-problem" | "status-urgent";
  className?: string;
}) {
  return <StatusMarker status={status} className={className} />;
}
