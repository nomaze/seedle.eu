import type { FieldStatus } from "@seedle/core";

/**
 * Field status as shape plus word, in the four "Feldfarben" (design system):
 * Blatt ● ok, Erde ○ action, Raps ▲ problem, Mohn ■ urgent.
 * The shape keeps the status readable without colour vision.
 */
export type StatusName = FieldStatus;

export const STATUS_LABEL: Record<StatusName, string> = {
  "status-ok": "Alles im Plan",
  "status-action": "Aktion nötig",
  "status-problem": "Problem erkannt",
  "status-urgent": "Sofort handeln",
};

const TEXT_CLASS: Record<StatusName, string> = {
  "status-ok": "text-status-ok-text",
  "status-action": "text-status-action-text",
  "status-problem": "text-status-problem-text",
  "status-urgent": "text-status-urgent-text",
};

/** Sort order: urgent first, ok last. */
export const STATUS_PRIO: Record<StatusName, number> = {
  "status-urgent": 1,
  "status-problem": 2,
  "status-action": 3,
  "status-ok": 4,
};

/** The bare shape. `onDark` switches to the marker colours for ink backgrounds (map labels). */
export function StatusShape({
  status = "status-ok",
  size = 12,
  onDark = false,
}: {
  status?: StatusName;
  size?: number;
  onDark?: boolean;
}) {
  const common = { width: size, height: size, viewBox: "0 0 12 12", "aria-hidden": true as const, className: "shrink-0" };
  switch (status) {
    case "status-action":
      return (
        <svg {...common}>
          <circle
            cx="6"
            cy="6"
            r="4.25"
            fill="none"
            stroke={onDark ? "var(--color-bee)" : "var(--color-status-action)"}
            strokeWidth="1.75"
          />
        </svg>
      );
    case "status-problem":
      return (
        <svg {...common}>
          <path
            d="M6 1.2 11 10.5H1Z"
            fill="var(--color-status-problem)"
            stroke={onDark ? "none" : "var(--color-status-problem-text)"}
            strokeWidth="1"
          />
        </svg>
      );
    case "status-urgent":
      return (
        <svg {...common}>
          <rect x="1.5" y="1.5" width="9" height="9" fill={onDark ? "var(--color-poppy)" : "var(--color-status-urgent)"} />
        </svg>
      );
    case "status-ok":
    default:
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="5" fill={onDark ? "var(--color-leaf-300)" : "var(--color-status-ok)"} />
        </svg>
      );
  }
}

/** Shape plus word. Never wrap it in a coloured box; only urgent rows get a tint (status-urgent-soft). */
export function StatusMarker({
  status = "status-ok",
  label,
  className = "",
}: {
  status?: StatusName;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-small font-semibold ${TEXT_CLASS[status]} ${className}`}>
      <StatusShape status={status} />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
