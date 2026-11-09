/**
 * Deterministic variety ranking engine.
 *
 * NEUTRALITY GUARANTEE: Sorting is strictly governed by net economic margin (EUR/ha)
 * derived from phenotypic yield predictions and transparent cost calculations.
 * Breeder identities, commercial agreements, or paid placements never influence rank.
 * See docs/adr/0004-neutrales-ranking.md.
 */
import type {
  Breeder,
  ClimateScenario,
  PhenotypePrediction,
  PriceSheet,
  RankedVariety,
  ScenarioId,
  Usage,
  Variety,
} from "../domain/types";
import { businessCase } from "./economics";

export interface RankingInput {
  varieties: Variety[];
  breeders: Breeder[];
  predictions: PhenotypePrediction[];
  scenarios: ClimateScenario[];
  preise: PriceSheet;
  usage: Usage;
  /** Sorting scenario strategy; defaults to weighted expected value across all scenarios. */
  sortierung?: ScenarioId | "gewichtet";
}

export function rankVarieties(input: RankingInput): RankedVariety[] {
  const { varieties, breeders, predictions, scenarios, preise, usage } = input;
  const sortierung = input.sortierung ?? "gewichtet";
  const breederById = new Map(breeders.map((b) => [b.id, b]));

  const rows = varieties
    .filter((v) => v.usages.includes(usage))
    .map((variety) => {
      const preds = predictions.filter((p) => p.varietyId === variety.id && p.usage === usage);
      const cases = preds.map((p) => businessCase(p, usage, preise));
      const wertJeSzenario = new Map(cases.map((c) => [c.scenarioId, c.wertEurHa]));
      const erwartet = scenarios.reduce(
        (sum, s) => sum + s.wahrscheinlichkeit * (wertJeSzenario.get(s.id) ?? 0),
        0,
      );
      const werte = cases.map((c) => c.wertEurHa);
      return {
        variety,
        breeder: breederById.get(variety.breederId)!,
        predictions: preds,
        businessCases: cases,
        wertJeSzenario,
        erwarteterWertEurHa: Math.round(erwartet),
        schlechtesterWertEurHa: Math.min(...werte),
        besterWertEurHa: Math.max(...werte),
      };
    })
    .filter((r) => r.businessCases.length === scenarios.length);

  // Computes relative rank within each climate scenario
  const rangJeSzenario = new Map<string, Record<ScenarioId, number>>();
  for (const s of scenarios) {
    const sorted = [...rows].sort((a, b) => compare(a.wertJeSzenario.get(s.id)!, b.wertJeSzenario.get(s.id)!, a, b));
    sorted.forEach((r, i) => {
      const entry = rangJeSzenario.get(r.variety.id) ?? ({} as Record<ScenarioId, number>);
      entry[s.id] = i + 1;
      rangJeSzenario.set(r.variety.id, entry);
    });
  }

  const key = (r: (typeof rows)[number]) =>
    sortierung === "gewichtet" ? r.erwarteterWertEurHa : r.wertJeSzenario.get(sortierung)!;
  const sorted = [...rows].sort((a, b) => compare(key(a), key(b), a, b));

  const spreads = sorted.map((r) => r.besterWertEurHa - r.schlechtesterWertEurHa);
  const mittlereSpanne = spreads.reduce((s, x) => s + x, 0) / Math.max(spreads.length, 1);
  const bester = sorted[0] ? key(sorted[0]) : 0;

  return sorted.map((r, i) => ({
    rang: i + 1,
    variety: r.variety,
    breeder: r.breeder,
    erwarteterWertEurHa: r.erwarteterWertEurHa,
    schlechtesterWertEurHa: r.schlechtesterWertEurHa,
    besterWertEurHa: r.besterWertEurHa,
    abstandZurBestenEurHa: Math.round(bester - key(r)),
    rangJeSzenario: rangJeSzenario.get(r.variety.id)!,
    businessCases: r.businessCases,
    predictions: r.predictions,
    stabil: r.besterWertEurHa - r.schlechtesterWertEurHa < mittlereSpanne,
  }));
}

/**
 * Compares varieties descending by margin. Ties break first by worst-case scenario
 * (favoring robustness), and secondly by alphabetical name.
 */
function compare(
  wertA: number,
  wertB: number,
  a: { schlechtesterWertEurHa: number; variety: Variety },
  b: { schlechtesterWertEurHa: number; variety: Variety },
): number {
  if (wertB !== wertA) return wertB - wertA;
  if (b.schlechtesterWertEurHa !== a.schlechtesterWertEurHa) {
    return b.schlechtesterWertEurHa - a.schlechtesterWertEurHa;
  }
  return a.variety.name.localeCompare(b.variety.name, "de");
}
