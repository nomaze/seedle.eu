/**
 * Interfaces for external domain data providers and integration adapters.
 *
 * Current implementation uses demo fixtures (src/demo). In production,
 * each interface connects to operational data sources without altering core domain logic:
 *
 * | Interface                | Demo Fixture | Production Target                      |
 * |--------------------------|--------------|----------------------------------------|
 * | CatalogProvider          | Demo catalog | Official trial registers & breeders    |
 * | EnvironmentProvider      | Interpolation| High-resolution soil/climate APIs (DWD)|
 * | ClimateScenarioProvider  | Fixed tables | Seasonal probabilistic ensembles       |
 * | PredictionProvider       | Demo model   | NoMaze GxE Prediction API              |
 * | TrialDataProvider        | Demo trials  | Official federal & EU trial registries |
 * | PriceProvider            | Demo prices  | Market quotes and breeder price lists  |
 * | WeatherProvider          | Demo weather | DWD MOSMIX / operational weather APIs  |
 * | PhotoAnalysisProvider    | Demo finding | Agronomic vision inference model       |
 * | BenchmarkProvider        | Demo values  | Anonymized peer cohort benchmarks      |
 */
import type {
  BenchmarkResult,
  Breeder,
  ClimateScenario,
  GeoPoint,
  PhenotypePrediction,
  PhotoFinding,
  PriceSheet,
  SiteEnvironment,
  TrialResult,
  TrialSite,
  Usage,
  Variety,
  WeatherDay,
} from "../domain/types";

export interface CatalogProvider {
  breeders(): Breeder[];
  varieties(): Variety[];
  /** Variety serving as regional standard when previous variety is unknown. */
  regionalStandard(env: SiteEnvironment, usage: Usage): Variety;
}

export interface EnvironmentProvider {
  /** Environmental profile at target geographic coordinates. */
  environmentAt(point: GeoPoint): SiteEnvironment;
}

export interface ClimateScenarioProvider {
  scenariosFor(env: SiteEnvironment, saison: number): ClimateScenario[];
}

export interface PredictionRequest {
  env: SiteEnvironment;
  usage: Usage;
  varietyIds: string[];
  scenarios: ClimateScenario[];
}

export interface HindcastRequest {
  env: SiteEnvironment;
  point: GeoPoint;
  usage: Usage;
  varietyIds: string[];
  jahre: number[];
}

export interface HindcastValue {
  varietyId: string;
  jahr: number;
  /** dt/ha grain or dt DM/ha silage. */
  wert: number;
}

export interface PredictionProvider {
  /** Variety phenotype predictions across climate scenarios for upcoming season. */
  predict(req: PredictionRequest): Promise<PhenotypePrediction[]>;
  /** Historical hindcast simulation under historical weather on target field. */
  hindcast(req: HindcastRequest): Promise<HindcastValue[]>;
  /** Textual characterization of a historical season. */
  jahrestyp(jahr: number): string;
}

export interface TrialDataProvider {
  sites(): TrialSite[];
  results(filter: { siteIds?: string[]; varietyIds?: string[]; usage?: Usage; jahre?: number[] }): TrialResult[];
}

export interface PriceProvider {
  prices(saison: number): PriceSheet;
}

export interface WeatherProvider {
  /** Weather forecast starting at `ab` (ISO date) for `tage` days. */
  forecast(point: GeoPoint, ab: string, tage: number): WeatherDay[];
}

export interface PhotoAnalysisProvider {
  analyze(input: { bytes: Uint8Array; bbchErwartet: number; mimeType: string }): Promise<PhotoFinding>;
}

export interface BenchmarkProvider {
  benchmark(input: { fieldId: string; env: SiteEnvironment; eintraege: number }): BenchmarkResult;
}

/** Complete bundle of domain providers. Initialized once by the application runtime. */
export interface Providers {
  catalog: CatalogProvider;
  environment: EnvironmentProvider;
  climate: ClimateScenarioProvider;
  prediction: PredictionProvider;
  trials: TrialDataProvider;
  prices: PriceProvider;
  weather: WeatherProvider;
  photos: PhotoAnalysisProvider;
  benchmark: BenchmarkProvider;
  /** true when synthetic or demo data is active in any provider. */
  demodaten: boolean;
}
