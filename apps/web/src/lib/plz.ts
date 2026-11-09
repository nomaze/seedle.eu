/**
 * Postal code recognition and geocoding services for trial data (/daten).
 *
 * Provides instant 0ms offline matching via 2-digit routing prefix table
 * and centers the MapLibre Germany map view.
 * For complete 5-digit postal codes, asynchronously queries OpenStreetMap/Nominatim
 * for exact centroid coordinates and municipality names.
 */

import {
  lookupPlzOffline,
  PLZ_ZONE_MAP,
  type PlzMatch,
  type PlzZoneInfo,
} from "@seedle/core";

export { lookupPlzOffline, PLZ_ZONE_MAP };
export type { PlzMatch, PlzZoneInfo };

/**
 * Fine-grained geocoding via OpenStreetMap / Nominatim for 5-digit postal codes.
 * Enhances city names and refines map center positioning.
 */
export async function lookupPlzNominatim(
  plz: string,
  signal?: AbortSignal,
): Promise<PlzMatch | null> {
  const digits = plz.replace(/\D/g, "").slice(0, 5);
  if (digits.length !== 5) return null;

  const offline = lookupPlzOffline(digits);
  if (!offline) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
      digits,
    )}&country=germany&format=jsonv2&accept-language=de&limit=1`;

    const res = await fetch(url, { signal });
    if (!res.ok) return offline;

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
      };
    }>;

    if (!data || data.length === 0 || !data[0]) {
      return offline;
    }

    const item = data[0];
    const parsedLat = Number(item.lat);
    const parsedLon = Number(item.lon);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      return offline;
    }

    // Extract municipality from display name or address payload
    const address = item.address;
    const resolvedCity =
      address?.city ||
      address?.town ||
      address?.village ||
      address?.municipality ||
      item.display_name.split(",")[0]?.trim() ||
      offline.city;

    return {
      plz: digits,
      regionCode: offline.regionCode,
      regionName: offline.regionName,
      bundesland: offline.bundesland,
      city: resolvedCity,
      lat: parsedLat,
      lon: parsedLon,
      isExactGeocoded: true,
    };
  } catch {
    // Gracefully fall back to offline match on network errors or offline execution
    return offline;
  }
}

/** Quick-select sample postal codes for demo exploration. */
export const POPULAR_PLZ_EXAMPLES = [
  { plz: "48149", name: "Münster", region: "NRW" },
  { plz: "84036", name: "Landshut", region: "BY" },
  { plz: "30159", name: "Hannover", region: "NI" },
  { plz: "39104", name: "Magdeburger Börde", region: "A19" },
  { plz: "70173", name: "Stuttgart", region: "BW" },
  { plz: "24103", name: "Kiel", region: "SH" },
  { plz: "34117", name: "Kassel", region: "HE" },
  { plz: "54290", name: "Trier", region: "RP" },
  { plz: "04109", name: "Leipzig / Löß", region: "A19" },
];
