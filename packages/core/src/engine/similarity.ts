/**
 * Environmental similarity engine for agricultural sites.
 *
 * Trial locations serve as empirical evidence when their environmental parameters
 * (soil quality, precipitation, growing degree days) closely match the target field.
 */
import type { SiteEnvironment } from "../domain/types";

interface Feature {
  key: "ackerzahl" | "niederschlagVegetationMm" | "waermesumme" | "hoeheM";
  /** Characteristic scaling factor for significant environmental divergence. */
  skala: number;
  gewicht: number;
  label: (a: number, b: number) => string;
}

const FEATURES: Feature[] = [
  {
    key: "ackerzahl",
    skala: 18,
    gewicht: 1,
    label: (a, b) => `ähnliche Bodengüte (Ackerzahl ${Math.round(a)} und ${Math.round(b)})`,
  },
  {
    key: "niederschlagVegetationMm",
    skala: 70,
    gewicht: 1.2,
    label: (a, b) => `ähnlich viel Sommerregen (${Math.round(a)} und ${Math.round(b)} mm)`,
  },
  {
    key: "waermesumme",
    skala: 140,
    gewicht: 1.3,
    label: () => "ähnliche Wärmesumme, also passende Reifezahlen",
  },
  {
    key: "hoeheM",
    skala: 260,
    gewicht: 0.4,
    label: (a, b) => `ähnliche Höhenlage (${Math.round(a)} und ${Math.round(b)} m)`,
  },
];

/** Environmental similarity index scaled 0-1 (1 = identical environment). */
export function environmentSimilarity(a: SiteEnvironment, b: SiteEnvironment): number {
  let d2 = 0;
  let wsum = 0;
  for (const f of FEATURES) {
    const z = (a[f.key] - b[f.key]) / f.skala;
    d2 += f.gewicht * z * z;
    wsum += f.gewicht;
  }
  if (a.bodenart !== b.bodenart) d2 += 0.35;
  return Math.exp(-d2 / (wsum / 2));
}

/** Extracts shared environmental features for explanation cards. */
export function commonalities(field: SiteEnvironment, site: SiteEnvironment): string[] {
  const out: string[] = [];
  if (field.bodenart === site.bodenart) out.push(`gleiche Bodenart (${site.bodenart})`);
  for (const f of FEATURES) {
    if (Math.abs(field[f.key] - site[f.key]) <= f.skala * 0.45) {
      out.push(f.label(field[f.key], site[f.key]));
    }
  }
  return out.slice(0, 3);
}
