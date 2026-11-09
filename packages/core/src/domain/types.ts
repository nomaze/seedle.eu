/**
 * Domain model of seedle (working title Sortenkompass).
 *
 * All types are business-centric and decoupled from data sources
 * (demo fixtures, official variety trials / LSV, NoMaze Prediction API).
 * The web application and clients communicate exclusively in these terms.
 *
 * Domain terminology is documented in docs/GLOSSAR.md.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Crop and Intended Usage
// ---------------------------------------------------------------------------

/** Crop type. Currently supports corn/maize; additional crops will be added. */
export const CropSchema = z.enum(["mais"]);
export type Crop = z.infer<typeof CropSchema>;

/** Intended usage. Ranking algorithms apply distinct metrics depending on usage. */
export const UsageSchema = z.enum(["koernermais", "silomais"]);
export type Usage = z.infer<typeof UsageSchema>;

export const USAGE_LABEL: Record<Usage, string> = {
  koernermais: "Körnermais",
  silomais: "Silomais",
};

// ---------------------------------------------------------------------------
// Geography and Environment
// ---------------------------------------------------------------------------

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

/** GeoJSON Polygon (WGS84, [lon, lat]). First and last points are identical. */
export const PolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
});
export type Polygon = z.infer<typeof PolygonSchema>;

export const SoilTypeSchema = z.enum([
  "Sand",
  "lehmiger Sand",
  "sandiger Lehm",
  "Lehm",
  "toniger Lehm",
  "Löss",
]);
export type SoilType = z.infer<typeof SoilTypeSchema>;

/**
 * Environmental profile of a location (field or trial site).
 * Represents the 'E' in GxE interactions: site factors independent of variety.
 */
export interface SiteEnvironment {
  /** Soil quality index 1-100 (Ackerzahl). */
  ackerzahl: number;
  bodenart: SoilType;
  /** Mean annual precipitation in mm. */
  niederschlagJahrMm: number;
  /** Mean growing season precipitation (April-September) in mm. */
  niederschlagVegetationMm: number;
  /** Mean annual temperature in degrees Celsius. */
  temperaturC: number;
  /** Growing degree days May-September (base 6 deg C); determines maturity suitability. */
  waermesumme: number;
  hoeheM: number;
  /** Regional description (e.g., "Magdeburg region"). */
  region: string;
}

// ---------------------------------------------------------------------------
// Breeders and Varieties
// ---------------------------------------------------------------------------

export interface Breeder {
  id: string;
  name: string;
  /** Logo path under /public. */
  logo: string;
  /** Partners displayed in partner ribbon; does not influence variety ranking. */
  isPartner: boolean;
}

/** Trait rating score 1-9 as standardized by official variety trials. */
export type Note19 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface VarietyTraits {
  /** Lodging resistance: 9 = highly resistant. */
  standfestigkeit: Note19;
  /** Early vigor: 9 = very rapid juvenile development. */
  jugendentwicklung: Note19;
  /** Drought tolerance: 9 = highly tolerant. */
  trockentoleranz: Note19;
  /** Cold tolerance during juvenile stages: 9 = highly tolerant. */
  kaeltetoleranz: Note19;
  /** Susceptibility to stalk rot: 1 = very low susceptibility. */
  staengelfaeule: Note19;
  /** Susceptibility to leaf blight (Turcicum): 1 = very low susceptibility. */
  blattkrankheiten: Note19;
}

export interface Variety {
  id: string;
  name: string;
  breederId: string;
  crop: Crop;
  usages: Usage[];
  /** FAO maturity rating number. Lower = early, higher = late. */
  reifezahl: number;
  /** Year of official registration or first trial entry. */
  zulassungsjahr: number;
  traits: VarietyTraits;
  /** Breeder summary description. */
  kurzbeschreibung: string;
}

// ---------------------------------------------------------------------------
// Climate Scenarios
// ---------------------------------------------------------------------------

export const ScenarioIdSchema = z.enum(["trocken-heiss", "normal", "feucht-kuehl"]);
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;

export interface ClimateScenario {
  id: ScenarioId;
  label: string;
  beschreibung: string;
  /** Probability for the target season at this site (sum of scenarios = 1.0). */
  wahrscheinlichkeit: number;
  /** Relative change in vegetation precipitation (e.g., -0.35). */
  niederschlagFaktor: number;
  /** Delta heat sum in growing degree days. */
  waermesummeDelta: number;
}

// ---------------------------------------------------------------------------
// Phenotype Prediction
// ---------------------------------------------------------------------------

export interface PhenotypePrediction {
  varietyId: string;
  scenarioId: ScenarioId;
  usage: Usage;
  /** Grain corn: yield in decitonnes/ha at 14% moisture. */
  kornertragDtHa?: number;
  /** Grain corn: expected grain moisture at harvest in %. */
  kornfeuchteProzent?: number;
  /** Silage corn: dry matter yield in dt DM/ha. */
  trockenmasseDtHa?: number;
  /** Silage corn: starch content in % of DM. */
  staerkeProzent?: number;
  /** Relative standard error of prediction (0.06 = +/- 6%). */
  unsicherheit: number;
}

// ---------------------------------------------------------------------------
// Price Model
// ---------------------------------------------------------------------------

export interface PriceSheet {
  saison: number;
  /** Seed price per unit (50,000 kernels) in EUR per variety. */
  saatgutEurJeEinheit: Record<string, number>;
  /** Sowing density in units per ha per usage. */
  einheitenJeHa: Record<Usage, number>;
  /** Producer price for grain corn in EUR/dt (14% moisture). */
  kornpreisEurDt: number;
  /** Drying cost in EUR per dt harvested grain per percentage point moisture over 14%. */
  trocknungEurJeDtUndProzent: number;
  /** Silage corn value in EUR per dt DM at 32% starch content. */
  silomaisEurDtTm: number;
  /** Surcharge or deduction in EUR per dt DM per percentage point starch deviation from 32%. */
  staerkeZuschlagEurDtTm: number;
  /** Source documentation for prices. */
  quellen: string[];
}

// ---------------------------------------------------------------------------
// Business Case and Ranking
// ---------------------------------------------------------------------------

export interface BusinessCase {
  scenarioId: ScenarioId;
  /** Gross revenue in EUR/ha. */
  erloesEurHa: number;
  saatgutEurHa: number;
  /** Grain corn drying costs. */
  trocknungEurHa: number;
  /** Net margin: revenue minus seed costs minus drying costs in EUR/ha. */
  wertEurHa: number;
}

export interface RankedVariety {
  rang: number;
  variety: Variety;
  breeder: Breeder;
  /** Probability-weighted expected margin across all climate scenarios in EUR/ha. */
  erwarteterWertEurHa: number;
  /** Net margin in the worst-case scenario. */
  schlechtesterWertEurHa: number;
  /** Net margin in the best-case scenario. */
  besterWertEurHa: number;
  /** Gap to top-ranked variety in EUR/ha (0 at rank 1). */
  abstandZurBestenEurHa: number;
  /** Rank per scenario showing cross-scenario stability. */
  rangJeSzenario: Record<ScenarioId, number>;
  businessCases: BusinessCase[];
  predictions: PhenotypePrediction[];
  /** Stable flag indicates lower variance across scenarios than list average. */
  stabil: boolean;
}

export interface Recommendation {
  fieldId: string;
  saison: number;
  usage: Usage;
  scenarios: ClimateScenario[];
  /** Applied sorting scenario ("gewichtet" indicates expected value across scenarios). */
  sortierung: ScenarioId | "gewichtet";
  sorten: RankedVariety[];
  preise: PriceSheet;
  /** true when synthetic or demo data is active. */
  demodaten: boolean;
}

// ---------------------------------------------------------------------------
// Trial Data and Explanations
// ---------------------------------------------------------------------------

/** Trial types: LSV = state trial, BSV = federal trial, EU = EU trial. */
export const TrialTypeSchema = z.enum(["LSV", "BSV", "EU"]);
export type TrialType = z.infer<typeof TrialTypeSchema>;

export const TRIAL_TYPE_LABEL: Record<TrialType, string> = {
  LSV: "Landessortenversuch",
  BSV: "Bundessortenversuch",
  EU: "EU-Sortenversuch",
};

export interface TrialSite {
  id: string;
  name: string;
  /** Federal state or administrative region. */
  gebiet: string;
  point: GeoPoint;
  trialType: TrialType;
  env: SiteEnvironment;
}

export interface TrialResult {
  siteId: string;
  jahr: number;
  varietyId: string;
  usage: Usage;
  kornertragDtHa?: number;
  kornfeuchteProzent?: number;
  trockenmasseDtHa?: number;
  staerkeProzent?: number;
}

export interface SimilarSite {
  site: TrialSite;
  /** Environmental similarity index to target field, scaled 0-1. */
  aehnlichkeit: number;
  distanzKm: number;
  /** Shared environmental traits in plain text. */
  gemeinsamkeiten: string[];
  anzahlErgebnisse: number;
}

export interface YearComparison {
  jahr: number;
  /** Seasonal characterization (e.g., "trocken-heiss"). */
  jahrestyp: string;
  /** Model calculation for target field under historic year weather conditions. */
  empfohlenModell: number;
  vergleichModell: number;
  /** Mean trial result across similar sites testing both varieties. */
  empfohlenVersuch?: number;
  vergleichVersuch?: number;
  anzahlVersuche: number;
  /** Metric unit: "dt/ha" or "dt TM/ha". */
  einheit: string;
}

export type Belastbarkeit = "hoch" | "mittel" | "im-aufbau";

export interface Explanation {
  fieldId: string;
  variety: Variety;
  breeder: Breeder;
  /** Reference variety: either farmer's previous variety or regional standard benchmark. */
  vergleich: { variety?: Variety; label: string; quelle: "bisherige-sorte" | "regionaler-standard" };
  usage: Usage;
  jahre: YearComparison[];
  /** Count of evaluated years where recommended variety outperformed the benchmark. */
  jahreVorne: number;
  mittlererVorsprung: number;
  mittlererVorsprungEurHa: number;
  aehnlicheStandorte: SimilarSite[];
  datenbasis: { typ: TrialType; anzahlErgebnisse: number; anzahlStandorte: number }[];
  /** Justifications supported by phenotypic traits or trial empirical results. */
  gruende: string[];
  belastbarkeit: Belastbarkeit;
  belastbarkeitText: string;
  demodaten: boolean;
}

// ---------------------------------------------------------------------------
// In-Season: Weather, Phenology, Field Insights
// ---------------------------------------------------------------------------

export interface WeatherDay {
  datum: string; // ISO yyyy-mm-dd
  tMinC: number;
  tMaxC: number;
  niederschlagMm: number;
  /** Weather condition descriptor. */
  lage: "sonnig" | "heiter" | "wolkig" | "regen" | "gewitter";
}

export interface GrowthStage {
  bbch: number;
  name: string;
  /** Growth progress from sowing to harvest readiness, scaled 0-1. */
  fortschritt: number;
  tageSeitAussaat: number;
}

export type HintKind = "wasser" | "krankheit" | "schaedling" | "wachstum" | "foto";

export interface FieldHint {
  id: string;
  art: HintKind;
  titel: string;
  text: string;
  /** Recommended actionable step. */
  naechsterSchritt: string;
  /** Plant protection topics mandate certified human consultation. */
  menschFragen: boolean;
  dringlichkeit: "heute" | "diese-woche" | "im-blick";
}

export interface PhotoFinding {
  titel: string;
  text: string;
  /** Summary recommendation sentence. */
  empfehlung: string;
  sicherheit: number; // 0-1
  kategorie: "gesund" | "beobachten" | "handeln";
  bbchGeschaetzt?: number;
  demo: boolean;
}

export interface BenchmarkResult {
  /** Percentile of comparable farms trailing behind target performance (0-100). */
  perzentil: number;
  anzahlVergleichsbetriebe: number;
  /** Positive framing text for peer comparison. */
  aussage: string;
  /** Key leverage recommendation for agronomic improvement. */
  hebel: string;
}

// ---------------------------------------------------------------------------
// Knowledge Re-exports from @seedle/contracts
// ---------------------------------------------------------------------------

export {
  KnowledgeTopicSchema,
  type KnowledgeTopic,
  KNOWLEDGE_TOPIC_LABEL,
  KnowledgeFactSchema,
  type KnowledgeFact,
  FieldStatusSchema,
  type FieldStatus,
  FieldYearStatusSchema,
  type FieldYearStatus,
  FarmSchema,
  type Farm,
  FieldYearSchema,
  type FieldYear,
  FarmFieldSummarySchema,
  type FarmFieldSummary,
  FarmContextSchema,
  type FarmContext,
} from "@seedle/contracts";
