/**
 * DEMO FIXTURES: Concrete implementation of domain interfaces from providers/interfaces.ts.
 *
 * Each demo provider serves as a lightweight stand-in for production service adapters.
 */
import type {
  BenchmarkResult,
  ClimateScenario,
  PhenotypePrediction,
  PhotoFinding,
  PriceSheet,
  SiteEnvironment,
  TrialResult,
  Usage,
  WeatherDay,
} from "../domain/types";
import { benchmarkStatement } from "../engine/benchmark";
import { distanceKm } from "../engine/geo";
import { hashString, noise, rng } from "../engine/random";
import type {
  BenchmarkProvider,
  CatalogProvider,
  ClimateScenarioProvider,
  EnvironmentProvider,
  HindcastValue,
  PhotoAnalysisProvider,
  PredictionProvider,
  PriceProvider,
  Providers,
  TrialDataProvider,
  WeatherProvider,
} from "../providers/interfaces";
import {
  DEMO_BREEDERS,
  DEMO_SEED_PRICES,
  DEMO_STANDARD_VARIETY_IDS,
  DEMO_VARIETIES,
} from "./catalog";
import { DEMO_HISTORY_YEARS, DEMO_YEARS, pastSeasonWeather, simulate, valueFor } from "./model";
import { DEMO_SITES, vegetationsAnteil, waermesummeAus } from "./sites";

const varietyById = new Map(DEMO_VARIETIES.map((v) => [v.id, v]));

/** Calculates optimal FAO maturity rating corresponding to a site heat sum. */
export function idealReifezahl(env: SiteEnvironment): number {
  return 240 + 30 * ((env.waermesumme - 1500) / 250);
}

// ---------------------------------------------------------------------------

const catalog: CatalogProvider = {
  breeders: () => DEMO_BREEDERS,
  varieties: () => DEMO_VARIETIES,
  regionalStandard(env, usage) {
    const ideal = idealReifezahl(env);
    const candidates = DEMO_STANDARD_VARIETY_IDS.map((id) => varietyById.get(id)!).filter((v) =>
      v.usages.includes(usage),
    );
    return candidates.sort((a, b) => Math.abs(a.reifezahl - ideal) - Math.abs(b.reifezahl - ideal))[0]!;
  },
};

// ---------------------------------------------------------------------------

const FALLBACK_SITE_ENV: SiteEnvironment = {
  ackerzahl: 55,
  bodenart: "sandiger Lehm",
  niederschlagJahrMm: 720,
  niederschlagVegetationMm: 380,
  temperaturC: 9.8,
  waermesumme: 1550,
  hoeheM: 220,
  region: "Deutschland",
};

const environment: EnvironmentProvider = {
  /** Inverse-distance weighted interpolation of the nearest trial locations with local noise. */
  environmentAt(point) {
    if (
      !point ||
      typeof point.lat !== "number" ||
      typeof point.lon !== "number" ||
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lon) ||
      point.lat < -90 ||
      point.lat > 90 ||
      point.lon < -180 ||
      point.lon > 180
    ) {
      return FALLBACK_SITE_ENV;
    }

    try {
      const nearest = DEMO_SITES.map((s) => ({ s, d: Math.max(distanceKm(point, s.point), 1) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 4);

      if (!nearest.length || !nearest[0]?.s?.env) {
        return FALLBACK_SITE_ENV;
      }

      const weights = nearest.map((n) => 1 / n.d ** 2);
      const wsum = weights.reduce((a, b) => a + b, 0);
      if (!Number.isFinite(wsum) || wsum <= 0) {
        return nearest[0].s.env;
      }

      const avg = (pick: (e: SiteEnvironment) => number) =>
        nearest.reduce((sum, n, i) => sum + pick(n.s.env) * weights[i]!, 0) / wsum;

      const key = `env:${point.lat.toFixed(3)}:${point.lon.toFixed(3)}`;
      const ackerzahlRaw = avg((e) => e.ackerzahl) + noise(`${key}:az`, 5);
      const ackerzahl = Math.round(Math.min(98, Math.max(18, Number.isFinite(ackerzahlRaw) ? ackerzahlRaw : 55)));
      const niederschlagJahrMmRaw = avg((e) => e.niederschlagJahrMm) * (1 + noise(`${key}:n`, 0.03));
      const niederschlagJahrMm = Math.round(Number.isFinite(niederschlagJahrMmRaw) ? niederschlagJahrMmRaw : 720);
      const temperaturCRaw = avg((e) => e.temperaturC);
      const temperaturC = Math.round((Number.isFinite(temperaturCRaw) ? temperaturCRaw : 9.8) * 10) / 10;
      const closest = nearest[0]!.s;

      const vegAnteil = vegetationsAnteil(point.lat, point.lon);
      const niederschlagVegetationMm = Math.round(
        niederschlagJahrMm * (Number.isFinite(vegAnteil) ? vegAnteil : 0.5)
      );

      const hoeheMRaw = avg((e) => e.hoeheM);
      const hoeheM = Math.round(Number.isFinite(hoeheMRaw) ? hoeheMRaw : 220);

      return {
        ackerzahl,
        bodenart: closest.env.bodenart || "sandiger Lehm",
        niederschlagJahrMm,
        niederschlagVegetationMm,
        temperaturC,
        waermesumme: waermesummeAus(temperaturC, point.lon),
        hoeheM,
        region: closest.env.region || "Deutschland",
      };
    } catch (err) {
      console.warn("[environmentAt] Error interpolating environment, returning fallback:", err);
      return FALLBACK_SITE_ENV;
    }
  },
};

// ---------------------------------------------------------------------------

const climate: ClimateScenarioProvider = {
  scenariosFor(env, saison) {
    let p = { trocken: 0.3, normal: 0.5, feucht: 0.2 };
    if (env.niederschlagVegetationMm < 300) p = { trocken: 0.36, normal: 0.47, feucht: 0.17 };
    if (env.niederschlagVegetationMm > 450) p = { trocken: 0.24, normal: 0.5, feucht: 0.26 };
    const scenarios: ClimateScenario[] = [
      {
        id: "trocken-heiss",
        label: "Trocken und heiß",
        beschreibung: `Ein Sommer ${saison} wie 2022: gut ein Drittel weniger Regen, deutlich mehr Wärme.`,
        wahrscheinlichkeit: p.trocken,
        niederschlagFaktor: -0.35,
        waermesummeDelta: 180,
      },
      {
        id: "normal",
        label: "Normal",
        beschreibung: "Regen wie im langjährigen Mittel, etwas wärmer als früher.",
        wahrscheinlichkeit: p.normal,
        niederschlagFaktor: 0,
        waermesummeDelta: 60,
      },
      {
        id: "feucht-kuehl",
        label: "Feucht und kühl",
        beschreibung: "Ein Viertel mehr Regen und ein kühler Sommer, wie 2021.",
        wahrscheinlichkeit: p.feucht,
        niederschlagFaktor: 0.25,
        waermesummeDelta: -120,
      },
    ];
    return scenarios;
  },
};

// ---------------------------------------------------------------------------

const prediction: PredictionProvider = {
  async predict({ env, usage, varietyIds, scenarios }) {
    const out: PhenotypePrediction[] = [];
    for (const id of varietyIds) {
      const variety = varietyById.get(id);
      if (!variety || !variety.usages.includes(usage)) continue;
      for (const s of scenarios) {
        const res = simulate(
          env,
          {
            niederschlagVegetationMm: env.niederschlagVegetationMm * (1 + s.niederschlagFaktor),
            waermesumme: env.waermesumme + s.waermesummeDelta,
          },
          variety,
          `pred:${id}:${s.id}`,
        );
        const base = { varietyId: id, scenarioId: s.id, usage, unsicherheit: variety.zulassungsjahr >= 2024 ? 0.08 : 0.05 };
        out.push(
          usage === "koernermais"
            ? { ...base, kornertragDtHa: res.kornertragDtHa, kornfeuchteProzent: res.kornfeuchteProzent }
            : { ...base, trockenmasseDtHa: res.trockenmasseDtHa, staerkeProzent: res.staerkeProzent },
        );
      }
    }
    return out;
  },

  async hindcast({ env, point, usage, varietyIds, jahre }) {
    const out: HindcastValue[] = [];
    for (const jahr of jahre) {
      const weather = pastSeasonWeather(env, point, jahr);
      for (const id of varietyIds) {
        const variety = varietyById.get(id);
        if (!variety) continue;
        out.push({ varietyId: id, jahr, wert: valueFor(simulate(env, weather, variety, `hc:${id}:${jahr}`), usage) });
      }
    }
    return out;
  },

  jahrestyp: (jahr) => DEMO_YEARS[jahr]?.jahrestyp ?? "",
};

// ---------------------------------------------------------------------------

let trialCache: TrialResult[] | null = null;

/** Lazily constructs complete synthetic trial dataset for years 2021-2025. */
function allTrialResults(): TrialResult[] {
  if (trialCache) return trialCache;
  const results: TrialResult[] = [];
  for (const site of DEMO_SITES) {
    const ideal = idealReifezahl(site.env);
    const usages: Usage[] = site.env.waermesumme >= 1350 ? ["koernermais", "silomais"] : ["silomais"];
    for (const jahr of DEMO_HISTORY_YEARS) {
      const weather = pastSeasonWeather(site.env, site.point, jahr);
      for (const usage of usages) {
        for (const v of DEMO_VARIETIES) {
          if (!v.usages.includes(usage) || v.zulassungsjahr > jahr) continue;
          if (Math.abs(v.reifezahl - ideal) > 50) continue;
          if (rng(`teilnahme:${site.id}:${jahr}:${v.id}:${usage}`)() < 0.15) continue;
          const res = simulate(site.env, weather, v, `trial:${site.id}:${jahr}:${v.id}:${usage}`, 1);
          results.push(
            usage === "koernermais"
              ? { siteId: site.id, jahr, varietyId: v.id, usage, kornertragDtHa: res.kornertragDtHa, kornfeuchteProzent: res.kornfeuchteProzent }
              : { siteId: site.id, jahr, varietyId: v.id, usage, trockenmasseDtHa: res.trockenmasseDtHa, staerkeProzent: res.staerkeProzent },
          );
        }
      }
    }
  }
  trialCache = results;
  return results;
}

const trials: TrialDataProvider = {
  sites: () => DEMO_SITES,
  results({ siteIds, varietyIds, usage, jahre }) {
    const siteSet = siteIds ? new Set(siteIds) : null;
    const varietySet = varietyIds ? new Set(varietyIds) : null;
    const jahrSet = jahre ? new Set(jahre) : null;
    return allTrialResults().filter(
      (r) =>
        (!siteSet || siteSet.has(r.siteId)) &&
        (!varietySet || varietySet.has(r.varietyId)) &&
        (!usage || r.usage === usage) &&
        (!jahrSet || jahrSet.has(r.jahr)),
    );
  },
};

// ---------------------------------------------------------------------------

const prices: PriceProvider = {
  prices(saison): PriceSheet {
    return {
      saison,
      saatgutEurJeEinheit: DEMO_SEED_PRICES,
      einheitenJeHa: { koernermais: 1.8, silomais: 2.0 },
      kornpreisEurDt: 20.5,
      trocknungEurJeDtUndProzent: 0.2,
      silomaisEurDtTm: 12,
      staerkeZuschlagEurDtTm: 0.15,
      quellen: [
        "Saatgutpreise: Angaben der Züchter (Demodaten)",
        "Körnermais: 20,50 €/dt bei 14 % Feuchte (Annahme)",
        "Trocknung: 0,20 € je dt und Prozentpunkt über 14 % (Annahme)",
        "Silomais: 12 € je dt Trockenmasse bei 32 % Stärke (Annahme)",
      ],
    };
  },
};

// ---------------------------------------------------------------------------

const weather: WeatherProvider = {
  forecast(point, ab, tage) {
    const start = new Date(`${ab}T12:00:00Z`);
    const cell = `${Math.round(point.lat * 4)}:${Math.round(point.lon * 4)}`;
    const days: WeatherDay[] = [];
    for (let i = 0; i < tage; i++) {
      const d = new Date(start.getTime() + i * 86_400_000);
      const iso = d.toISOString().slice(0, 10);
      const doy = Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000);
      const saison = Math.sin(((doy - 105) / 365) * 2 * Math.PI);
      const random = rng(`wetter:${cell}:${iso}`);
      // Demo: warm, dry week pattern ensuring agronomic hints are visible in UI
      const tMax = 15 + 12 * saison + (random() - 0.3) * 6 + (point.lat < 50 ? 1.5 : 0);
      const regnet = random() < 0.25;
      const niederschlag = regnet ? Math.round(random() * 9 * 10) / 10 : 0;
      days.push({
        datum: iso,
        tMaxC: Math.round(tMax),
        tMinC: Math.round(tMax - 9 - random() * 3),
        niederschlagMm: niederschlag,
        lage: niederschlag > 5 ? (tMax > 27 ? "gewitter" : "regen") : niederschlag > 0 ? "wolkig" : tMax > 24 ? "sonnig" : "heiter",
      });
    }
    return days;
  },
};

// ---------------------------------------------------------------------------

const PHOTO_FINDINGS: Omit<PhotoFinding, "bbchGeschaetzt" | "demo">[] = [
  {
    titel: "Gesunder, gleichmäßiger Bestand",
    text: "Die Blätter sind kräftig grün, die Pflanzen stehen gleichmäßig. Wir sehen keine Anzeichen von Krankheiten.",
    empfehlung: "Weiter so. Ein Foto pro Woche hält die Prognose aktuell.",
    sicherheit: 0.86,
    kategorie: "gesund",
  },
  {
    titel: "Leichte Aufhellungen an jungen Blättern",
    text: "Einzelne Blätter zeigen hellere Streifen. Das passt oft zu einem kurzfristigen Nährstoffengpass nach kühlen Nächten und wächst sich meist aus.",
    empfehlung: "In einer Woche nochmal fotografieren. Wird es mehr, schauen wir gemeinsam drauf.",
    sicherheit: 0.64,
    kategorie: "beobachten",
  },
  {
    titel: "Möglicher Befall mit Blattflecken (Turcicum)",
    text: "Wir sehen längliche, graubraune Flecken an unteren Blättern. Das kann eine Turcicum-Blattdürre sein; feucht-warmes Wetter begünstigt sie.",
    empfehlung: "Sprich mit dem NoMaze-Team, bevor du etwas unternimmst. Ein zweites Foto von oben hilft uns.",
    sicherheit: 0.58,
    kategorie: "handeln",
  },
  {
    titel: "Fraßspuren, typisch für den Maiszünsler",
    text: "Kleine Fraßlöcher und Bohrmehl in den Blattachseln deuten auf junge Maiszünsler-Raupen hin.",
    empfehlung: "Ruf das NoMaze-Team an. Wir stimmen mit dir ab, ob und wie gehandelt werden sollte.",
    sicherheit: 0.61,
    kategorie: "handeln",
  },
];

const photos: PhotoAnalysisProvider = {
  async analyze({ bytes, bbchErwartet }) {
    const sample = Array.from(bytes.slice(0, 2048)).join(",") + `:${bytes.length}`;
    const h = hashString(sample);
    // Mostly healthy - matches empirical baseline distributions
    const index = h % 10 < 6 ? 0 : 1 + (h % 3);
    const finding = PHOTO_FINDINGS[index]!;
    return { ...finding, bbchGeschaetzt: bbchErwartet, demo: true };
  },
};

// ---------------------------------------------------------------------------

const benchmark: BenchmarkProvider = {
  benchmark({ fieldId, eintraege }): BenchmarkResult {
    const h = hashString(`bench:${fieldId}`);
    const perzentil = Math.max(4, Math.min(97, 28 + (h % 55) + Math.min(eintraege * 3, 15)));
    const anzahl = 40 + (h % 90);
    return benchmarkStatement(perzentil, anzahl, eintraege);
  },
};

// ---------------------------------------------------------------------------

export function createDemoProviders(): Providers {
  return { catalog, environment, climate, prediction, trials, prices, weather, photos, benchmark, demodaten: true };
}

export { DEMO_HISTORY_YEARS } from "./model";

/** Test hook to clear in-memory trial result caches between test runs. */
export function _resetDemoCaches(): void {
  trialCache = null;
}

