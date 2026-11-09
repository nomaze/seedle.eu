/**
 * Core agronomic services: recommendation and explanation pipelines for a field.
 *
 * These functions connect domain providers (data, prediction models) with core
 * deterministic logic (ranking, environmental similarity).
 */
import type {
  Belastbarkeit,
  Explanation,
  GeoPoint,
  Recommendation,
  ScenarioId,
  SimilarSite,
  SiteEnvironment,
  TrialResult,
  TrialType,
  Usage,
  Variety,
  YearComparison,
} from "../domain/types";
import { distanceKm } from "../engine/geo";
import { rankVarieties } from "../engine/ranking";
import { commonalities, environmentSimilarity } from "../engine/similarity";
import type { Providers } from "../providers/interfaces";

export interface FieldContext {
  id: string;
  point: GeoPoint;
  env: SiteEnvironment;
}

export async function recommend(
  providers: Providers,
  field: FieldContext,
  usage: Usage,
  saison: number,
  sortierung: ScenarioId | "gewichtet" = "gewichtet",
): Promise<Recommendation> {
  const varieties = providers.catalog.varieties().filter((v) => v.usages.includes(usage));
  const scenarios = providers.climate.scenariosFor(field.env, saison);
  const predictions = await providers.prediction.predict({
    env: field.env,
    usage,
    varietyIds: varieties.map((v) => v.id),
    scenarios,
  });
  const preise = providers.prices.prices(saison);
  const sorten = rankVarieties({
    varieties,
    breeders: providers.catalog.breeders(),
    predictions,
    scenarios,
    preise,
    usage,
    sortierung,
  });
  return { fieldId: field.id, saison, usage, scenarios, sortierung, sorten, preise, demodaten: providers.demodaten };
}

// ---------------------------------------------------------------------------

const MIN_AEHNLICHKEIT = 0.45;
const MAX_STANDORTE = 8;
const MIN_STANDORTE = 4;

export function similarSites(providers: Providers, field: FieldContext, usage: Usage): SimilarSite[] {
  const results = providers.trials.results({ usage });
  const countBySite = new Map<string, number>();
  for (const r of results) countBySite.set(r.siteId, (countBySite.get(r.siteId) ?? 0) + 1);

  const ranked = providers.trials
    .sites()
    .filter((s) => (countBySite.get(s.id) ?? 0) > 0)
    .map((site) => ({
      site,
      aehnlichkeit: environmentSimilarity(field.env, site.env),
      distanzKm: Math.round(distanceKm(field.point, site.point)),
      gemeinsamkeiten: commonalities(field.env, site.env),
      anzahlErgebnisse: countBySite.get(site.id) ?? 0,
    }))
    .sort((a, b) => b.aehnlichkeit - a.aehnlichkeit);

  const passend = ranked.filter((s) => s.aehnlichkeit >= MIN_AEHNLICHKEIT);
  return (passend.length >= MIN_STANDORTE ? passend : ranked.slice(0, MIN_STANDORTE)).slice(0, MAX_STANDORTE);
}

export interface ExplainInput {
  field: FieldContext;
  varietyId: string;
  usage: Usage;
  /** Variety previously cultivated on this field, if known. */
  bisherigeSorteId?: string;
  saison: number;
}

export async function explain(providers: Providers, input: ExplainInput): Promise<Explanation> {
  const { field, usage } = input;
  const all = providers.catalog.varieties();
  const byId = new Map(all.map((v) => [v.id, v]));
  const variety = byId.get(input.varietyId);
  if (!variety) throw new Error(`Unbekannte Sorte: ${input.varietyId}`);
  const breeder = providers.catalog.breeders().find((b) => b.id === variety.breederId)!;

  // Comparison benchmark: previous farmer variety if present, otherwise regional standard
  const bisherige = input.bisherigeSorteId ? byId.get(input.bisherigeSorteId) : undefined;
  let vergleich: Explanation["vergleich"];
  if (bisherige && bisherige.id !== variety.id && bisherige.usages.includes(usage)) {
    vergleich = { variety: bisherige, label: bisherige.name, quelle: "bisherige-sorte" };
  } else {
    const std = providers.catalog.regionalStandard(field.env, usage);
    const standard = std.id === variety.id ? all.find((v) => v.id !== variety.id && v.usages.includes(usage))! : std;
    vergleich = { variety: standard, label: `${standard.name} (regionaler Standard)`, quelle: "regionaler-standard" };
  }
  const cmp = vergleich.variety!;

  // Multi-year hindcast calculation for target field
  const jahre = [2021, 2022, 2023, 2024, 2025];
  const hindcast = await providers.prediction.hindcast({
    env: field.env,
    point: field.point,
    usage,
    varietyIds: [variety.id, cmp.id],
    jahre,
  });
  const hc = (vid: string, jahr: number) => hindcast.find((h) => h.varietyId === vid && h.jahr === jahr)?.wert ?? 0;

  // Evidence: trials conducted at environmentally similar locations
  const sites = similarSites(providers, field, usage);
  const weightBySite = new Map(sites.map((s) => [s.site.id, s.aehnlichkeit]));
  const results = providers.trials.results({
    siteIds: sites.map((s) => s.site.id),
    varietyIds: [variety.id, cmp.id],
    usage,
  });
  const value = (r: TrialResult) => (usage === "koernermais" ? r.kornertragDtHa : r.trockenmasseDtHa) ?? 0;

  const einheit = "% Relativ-Index";
  const rawCmpMean = Math.max(
    1,
    jahre.reduce((sum, j) => sum + hc(cmp.id, j), 0) / Math.max(jahre.length, 1),
  );
  const toRelIndex = (val: number) => round1((val / rawCmpMean) * 100);

  const rawDiffs = jahre.map((j) => hc(variety.id, j) - hc(cmp.id, j));
  const rawMeanDiff = rawDiffs.reduce((s, d) => s + d, 0) / Math.max(rawDiffs.length, 1);

  const vergleiche: YearComparison[] = jahre.map((jahr) => {
    const paare = sites
      .map((s) => {
        const a = results.find((r) => r.siteId === s.site.id && r.jahr === jahr && r.varietyId === variety.id);
        const b = results.find((r) => r.siteId === s.site.id && r.jahr === jahr && r.varietyId === cmp.id);
        return a && b ? { a: value(a), b: value(b), w: weightBySite.get(s.site.id)! } : null;
      })
      .filter((p): p is { a: number; b: number; w: number } => p !== null);
    const wsum = paare.reduce((s, p) => s + p.w, 0);
    return {
      jahr,
      jahrestyp: providers.prediction.jahrestyp(jahr),
      empfohlenModell: toRelIndex(hc(variety.id, jahr)),
      vergleichModell: toRelIndex(hc(cmp.id, jahr)),
      empfohlenVersuch: wsum > 0 ? toRelIndex(paare.reduce((s, p) => s + p.a * p.w, 0) / wsum) : undefined,
      vergleichVersuch: wsum > 0 ? toRelIndex(paare.reduce((s, p) => s + p.b * p.w, 0) / wsum) : undefined,
      anzahlVersuche: paare.length,
      einheit,
    };
  });

  const diffs = vergleiche.map((j) => j.empfohlenModell - j.vergleichModell);
  const jahreVorne = diffs.filter((d) => d > 0).length;
  const mittlererVorsprung = round1(diffs.reduce((s, d) => s + d, 0) / diffs.length);
  const preise = providers.prices.prices(input.saison);
  const preisJeEinheit = usage === "koernermais" ? preise.kornpreisEurDt : preise.silomaisEurDtTm;
  const mittlererVorsprungEurHa = Math.round(rawMeanDiff * preisJeEinheit);

  // Empirical trial database for the recommended variety
  const eigene = providers.trials.results({ siteIds: sites.map((s) => s.site.id), varietyIds: [variety.id], usage });
  const typBySite = new Map(sites.map((s) => [s.site.id, s.site.trialType]));
  const datenbasis = (["LSV", "BSV", "EU"] as TrialType[])
    .map((typ) => {
      const rs = eigene.filter((r) => typBySite.get(r.siteId) === typ);
      return { typ, anzahlErgebnisse: rs.length, anzahlStandorte: new Set(rs.map((r) => r.siteId)).size };
    })
    .filter((d) => d.anzahlErgebnisse > 0);

  const gepaarteVersuche = vergleiche.reduce((s, j) => s + j.anzahlVersuche, 0);
  const versuchsJahreVorne = vergleiche.filter(
    (j) => j.empfohlenVersuch !== undefined && j.vergleichVersuch !== undefined && j.empfohlenVersuch > j.vergleichVersuch,
  ).length;
  const versuchsJahre = vergleiche.filter((j) => j.anzahlVersuche > 0).length;

  const gruende = reasons({
    variety,
    cmp,
    env: field.env,
    usage,
    vergleiche,
    mittlererVorsprung,
    versuchsJahreVorne,
    versuchsJahre,
    einheit,
  });

  const { belastbarkeit, belastbarkeitText } = credibility(gepaarteVersuche, jahreVorne / jahre.length, variety);

  return {
    fieldId: field.id,
    variety,
    breeder,
    vergleich,
    usage,
    jahre: vergleiche,
    jahreVorne,
    mittlererVorsprung,
    mittlererVorsprungEurHa,
    aehnlicheStandorte: sites,
    datenbasis,
    gruende,
    belastbarkeit,
    belastbarkeitText,
    demodaten: providers.demodaten,
  };
}

// ---------------------------------------------------------------------------

function reasons(p: {
  variety: Variety;
  cmp: Variety;
  env: SiteEnvironment;
  usage: Usage;
  vergleiche: YearComparison[];
  mittlererVorsprung: number;
  versuchsJahreVorne: number;
  versuchsJahre: number;
  einheit: string;
}): string[] {
  const out: string[] = [];
  const { variety, cmp, env } = p;
  const ideal = 240 + 30 * ((env.waermesumme - 1500) / 250);

  if (Math.abs(variety.reifezahl - ideal) <= 20) {
    out.push(
      `Die Reifezahl ${variety.reifezahl} passt zur Wärme an deinem Standort (rund ${env.waermesumme} Gradtage im Sommer).`,
    );
  } else if (variety.reifezahl < ideal) {
    out.push(`Mit Reifezahl ${variety.reifezahl} ist sie früh genug, um sicher abzureifen, auch in einem kühlen Herbst.`);
  }

  const trockenJahr = p.vergleiche.find((j) => j.jahrestyp.startsWith("trocken"));
  if (trockenJahr && variety.traits.trockentoleranz >= 7) {
    const d = round1(trockenJahr.empfohlenModell - trockenJahr.vergleichModell);
    if (d > p.mittlererVorsprung && d > 0) {
      out.push(
        `Trockentoleranz (Note ${variety.traits.trockentoleranz}): Im trockenen Jahr ${trockenJahr.jahr} lag sie auf deinem Feld um +${fmt(d)} % (Relativ-Index) vor der Vergleichssorte, noch deutlicher als in normalen Jahren.`,
      );
    }
  }

  if (variety.traits.kaeltetoleranz >= 8 && env.waermesumme < 1500) {
    out.push(`Kältetoleranz (Note ${variety.traits.kaeltetoleranz}): Sie kommt in deiner kühleren Lage gut aus dem Start.`);
  }

  if (variety.traits.standfestigkeit >= 8 && variety.traits.standfestigkeit > cmp.traits.standfestigkeit) {
    out.push(`Sehr standfest (Note ${variety.traits.standfestigkeit}): mehr Sicherheit bei Sturm vor der Ernte.`);
  }

  if (p.usage === "koernermais" && variety.reifezahl < cmp.reifezahl) {
    out.push("Sie gibt das Wasser früher ab als deine Vergleichssorte. Das spart Trocknungskosten.");
  }

  const beleg =
    p.versuchsJahre > 0
      ? `In ${p.versuchsJahreVorne} von ${p.versuchsJahre} Versuchsjahren lag sie an Standorten wie deinem vor ${cmp.name}.`
      : null;
  // Official trial evidence is always included directly after the primary agronomic reason
  return beleg ? [...out.slice(0, 1), beleg, ...out.slice(1, 3)] : out.slice(0, 4);
}

function credibility(
  gepaarteVersuche: number,
  anteilJahreVorne: number,
  variety: Variety,
): { belastbarkeit: Belastbarkeit; belastbarkeitText: string } {
  if (variety.zulassungsjahr >= 2024 || gepaarteVersuche < 6) {
    return {
      belastbarkeit: "im-aufbau",
      belastbarkeitText: `Die Sorte ist seit ${variety.zulassungsjahr} in Versuchen. Das Modell rechnet sie schon, die Versuchsdaten wachsen mit jeder Saison.`,
    };
  }
  if (gepaarteVersuche >= 15 && anteilJahreVorne >= 0.8) {
    return {
      belastbarkeit: "hoch",
      belastbarkeitText: `${gepaarteVersuche} direkte Vergleiche an ähnlichen Standorten zeigen dasselbe Bild wie das Modell.`,
    };
  }
  return {
    belastbarkeit: "mittel",
    belastbarkeitText: `${gepaarteVersuche} direkte Vergleiche stützen die Empfehlung; mit jeder Saison wird das Bild schärfer.`,
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const fmt = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1 });
