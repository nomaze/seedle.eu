/**
 * Cartographic base styles (open license).
 * Base layers powered exclusively by OpenFreeMap (OpenStreetMap data, ODbL).
 */
export const KARTE = "https://tiles.openfreemap.org/styles/liberty";

export const LUFTBILD = KARTE;

export const DEUTSCHLAND = { center: [10.45, 51.15] as [number, number], zoom: 5.2 };

/**
 * Resolves theme color from globals.css. MapLibre cannot parse CSS variables directly;
 * this bridges active brand themes into map paint specifications.
 */
export function themaFarbe(name: string, ersatz: string): string {
  if (typeof document === "undefined") return ersatz;
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim() || ersatz;
}

/** Field styling on map canvas: fill in leaf-300, outline in bee (visible on satellite imagery). */
export function feldFarbe() {
  return { fill: themaFarbe("leaf-300", "#a8d8a0"), line: themaFarbe("bee", "#c9945f") };
}

/**
 * Map status indicators for agricultural fields:
 * status-ok: green
 * status-action: blue
 * status-problem: amber/yellow
 * status-urgent: red
 */
export function statusKartenFarbe(status?: string): { fill: string; line: string } {
  switch (status) {
    case "status-action":
      return {
        fill: themaFarbe("status-action", "#1d4ed8"),
        line: themaFarbe("status-action-border", "#1e40af"),
      };
    case "status-problem":
      return {
        fill: themaFarbe("status-problem", "#b45309"),
        line: themaFarbe("status-problem-border", "#78350f"),
      };
    case "status-urgent":
      return {
        fill: themaFarbe("status-urgent", "#b91c1c"),
        line: themaFarbe("status-urgent-border", "#7f1d1d"),
      };
    case "status-ok":
    default:
      return {
        fill: themaFarbe("status-ok", "#15803d"),
        line: themaFarbe("status-ok-border", "#14532d"),
      };
  }
}
