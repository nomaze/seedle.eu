import type { Map as MlMap, StyleSpecification } from "maplibre-gl";

/**
 * Cartographic base styles (open license).
 * `KARTE` uses OpenFreeMap vector tiles (OpenStreetMap data, ODbL).
 * `LUFTBILD` provides high-resolution satellite / aerial orthoimagery (Esri World Imagery)
 * with a dark field-green background canvas (`#1a261d`) and automatic fallback to `KARTE`
 * via `attachMapErrorShield` when aerial tiles are blocked or offline.
 */
export const KARTE = "https://tiles.openfreemap.org/styles/liberty";

export const FIBOA_PMTILES_URL =
  "pmtiles://https://data.source.coop/ftw/harmonized-field-data/harmonized-field-data.pmtiles";

export const LUFTBILD: StyleSpecification = {
  version: 8,
  sources: {
    "esri-world-imagery": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        "Luftbild: © Esri, Maxar, Earthstar Geographics · Feldgrenzen: © Geobasisdaten / InVeKoS der Länder (dl-de/by-2-0, CC-BY 4.0) via fiboa",
    },
  },
  layers: [
    {
      id: "luftbild-background",
      type: "background",
      paint: {
        "background-color": "#1a261d",
      },
    },
    {
      id: "esri-world-imagery-layer",
      type: "raster",
      source: "esri-world-imagery",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const DEUTSCHLAND = { center: [10.45, 51.15] as [number, number], zoom: 5.2 };

/**
 * Attaches an error and missing-sprite shield to a MapLibre `Map` instance:
 * 1. Intercepts tile/source network errors (`AJAXError`, `Failed to fetch`, status `0` / `404`)
 *    so MapLibre does not emit unhandled `console.error` calls that flood the Next.js Dev Overlay.
 * 2. Invokes `onAerialBlocked` (or falls back to `KARTE`) once if Esri aerial tiles cannot be fetched.
 * 3. Supplies a transparent 1x1 pixel placeholder image on `styleimagemissing` (`office`, `bollard`,
 *    `gate`, `recycling`, `athletics`, `lift_gate`, etc.) to prevent sprite warnings.
 */
export function attachMapErrorShield(
  map: MlMap,
  onAerialBlocked?: () => void,
): void {
  let aerialFallbackTriggered = false;

  map.on("error", (ev: unknown) => {
    const errObj = ev as {
      sourceId?: string;
      error?: { message?: string; status?: number };
    } | null;
    const msg = String(errObj?.error?.message ?? "");
    const srcId = String(errObj?.sourceId ?? "");

    const isAerialFailure =
      srcId === "esri-world-imagery" ||
      msg.includes("arcgisonline.com") ||
      msg.includes("World_Imagery");

    if (
      isAerialFailure &&
      !aerialFallbackTriggered &&
      (msg.includes("Failed to fetch") || msg.includes("AJAXError") || errObj?.error?.status === 0)
    ) {
      aerialFallbackTriggered = true;
      if (onAerialBlocked) {
        onAerialBlocked();
      }
    }
  });

  map.on("styleimagemissing", (ev: { id: string }) => {
    const id = ev?.id;
    if (!id) return;
    try {
      if (!map.hasImage(id)) {
        map.addImage(id, {
          width: 1,
          height: 1,
          data: new Uint8Array([0, 0, 0, 0]),
        });
      }
    } catch {
      // Ignore if image was registered concurrently
    }
  });
}

/**
 * Resolves theme color from globals.css. MapLibre cannot parse CSS variables directly;
 * this bridges active brand themes into map paint specifications.
 */
export function themaFarbe(name: string, ersatz: string): string {
  if (typeof document === "undefined") return ersatz;
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim() || ersatz;
}

/**
 * Field styling on map canvas:
 * Selected field uses strong terracotta/coral accent (`#e05a47` / `#c9945f`) so it stands out
 * clearly against the subtle white hover indicator.
 */
export function feldFarbe() {
  return { fill: themaFarbe("poppy", "#e05a47"), line: themaFarbe("bee", "#c9945f") };
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
