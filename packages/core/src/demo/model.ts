/**
 * DEMO MODEL: calculates crop yields from environment, weather, and variety genetics.
 *
 * Serves as a prototype placeholder for the NoMaze GxE Prediction API.
 * Captures core agronomic mechanisms:
 * - Drought stress reduces yield; drought-tolerant varieties mitigate losses.
 * - Late maturity varieties leverage heat sums but underperform in cool microclimates.
 * - Cold-tolerant varieties outperform during early juvenile vegetative stages.
 * - Late maturity varieties exhibit higher grain moisture at harvest (drying costs).
 */
import type { GeoPoint, SiteEnvironment, Usage, Variety } from "../domain/types";
import { noise } from "../engine/random";
import { DEMO_GENETICS } from "./catalog";

/** Seasonal weather for an agricultural site relative to long-term climate normals. */
export interface SeasonWeather {
  niederschlagVegetationMm: number;
  waermesumme: number;
}

export interface ModelOutput {
  kornertragDtHa: number;
  kornfeuchteProzent: number;
  trockenmasseDtHa: number;
  staerkeProzent: number;
  /** Drought stress indicator 0-0.7. */
  stress: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Core demo simulation logic. Seed key ensures deterministic noise reproducibility. */
export function simulate(
  env: SiteEnvironment,
  weather: SeasonWeather,
  variety: Variety,
  key: string,
  rauschen = 0,
): ModelOutput {
  const gen = DEMO_GENETICS[variety.id] ?? { g: 0, gSilo: 0, dS: 0, cS: 0, fBias: 0, starch: 0 };

  const potential = 92 + 0.42 * (env.ackerzahl - 55);

  // Water balance: supply (precipitation + soil retention) vs demand (scales with heat)
  const angebot = weather.niederschlagVegetationMm + 1.2 * env.ackerzahl;
  const bedarf = 330 + 0.25 * (weather.waermesumme - 1500);
  const w = angebot / bedarf;
  const stress = clamp(1 - w, 0, 0.7);
  const trockenFaktor = 1 - stress * (0.75 + 0.35 * gen.dS);
  const nassFaktor = 1 - clamp(w - 1.6, 0, 1) * 0.08;

  // Temperature sum vs FAO maturity rating
  const h = (weather.waermesumme - 1500) / 250;
  const m = (variety.reifezahl - 240) / 30;
  const reifePassung = 7 * m * h - 4 * Math.max(0, m - h - 0.3) ** 2 - 2 * Math.max(0, h - m - 1.2);
  const kaelte = 4 * gen.cS * Math.min(h, 0);

  const basis = potential * trockenFaktor * nassFaktor + reifePassung + kaelte;
  const r = (suffix: string, sd: number) => (rauschen > 0 ? noise(`${key}:${suffix}`, sd * rauschen) : 0);

  const kornertrag = basis + gen.g + r("korn", 4.5);
  const kornfeuchte = 29 + 3.5 * (m - h) + gen.fBias + r("feuchte", 1.2);
  const trockenmasse = 1.55 * basis + 25 + gen.gSilo + r("tm", 7);
  const staerke = 33 + 1.8 * h - 1.2 * Math.max(0, m - h) + gen.starch - 5 * stress + r("staerke", 0.8);

  return {
    kornertragDtHa: round1(clamp(kornertrag, 35, 170)),
    kornfeuchteProzent: round1(clamp(kornfeuchte, 17, 38)),
    trockenmasseDtHa: round1(clamp(trockenmasse, 80, 260)),
    staerkeProzent: round1(clamp(staerke, 22, 40)),
    stress,
  };
}

export function valueFor(out: ModelOutput, usage: Usage): number {
  return usage === "koernermais" ? out.kornertragDtHa : out.trockenmasseDtHa;
}

// ---------------------------------------------------------------------------
// Historical Years (Demo): Meteorological patterns and regional divergence
// ---------------------------------------------------------------------------

interface YearPattern {
  jahrestyp: string;
  niederschlagFaktor: number;
  waermesummeDelta: number;
}

export const DEMO_YEARS: Record<number, YearPattern> = {
  2021: { jahrestyp: "feucht-kühl", niederschlagFaktor: 0.18, waermesummeDelta: -90 },
  2022: { jahrestyp: "trocken-heiß", niederschlagFaktor: -0.38, waermesummeDelta: 190 },
  2023: { jahrestyp: "wechselhaft, warm", niederschlagFaktor: 0.05, waermesummeDelta: 80 },
  2024: { jahrestyp: "nass", niederschlagFaktor: 0.22, waermesummeDelta: 40 },
  2025: { jahrestyp: "trockenes Frühjahr, warm", niederschlagFaktor: -0.2, waermesummeDelta: 110 },
};

export const DEMO_HISTORY_YEARS = [2021, 2022, 2023, 2024, 2025];

/** Weather conditions for a historical season at a given geographic point with regional deviation. */
export function pastSeasonWeather(env: SiteEnvironment, point: GeoPoint, jahr: number): SeasonWeather {
  const pattern = DEMO_YEARS[jahr] ?? { niederschlagFaktor: 0, waermesummeDelta: 0, jahrestyp: "" };
  // Regional variation: indexed by ~50km grid so neighbouring parcels experience correlated weather
  const cell = `${Math.round(point.lat * 2)}:${Math.round(point.lon * 2)}`;
  const regenAbw = noise(`jahr:${jahr}:${cell}:regen`, 0.08);
  const waermeAbw = noise(`jahr:${jahr}:${cell}:waerme`, 40);
  return {
    niederschlagVegetationMm: env.niederschlagVegetationMm * (1 + pattern.niederschlagFaktor + regenAbw),
    waermesumme: env.waermesumme + pattern.waermesummeDelta + waermeAbw,
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
