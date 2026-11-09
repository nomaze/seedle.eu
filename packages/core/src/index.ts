/**
 * @seedle/core - domain logic engine.
 *
 * Entry point for application and APIs: `createDemoProviders()` supplies domain providers;
 * `recommend()` and `explain()` handle core agronomic use cases.
 */
export * from "./domain/types";
export * from "./providers/interfaces";
export { rankVarieties } from "./engine/ranking";
export { businessCase, KORNFEUCHTE_BASIS, STAERKE_BASIS } from "./engine/economics";
export { environmentSimilarity, commonalities } from "./engine/similarity";
export { autoFieldPolygon, areaHa, centroid, distanceKm } from "./engine/geo";
export { growthStage, hintsForToday, photoTask, daysBetween } from "./engine/season";
export { benchmarkStatement } from "./engine/benchmark";
export { hashString, rng } from "./engine/random";
export { recommend, explain, similarSites } from "./services/recommend";
export type { FieldContext, ExplainInput } from "./services/recommend";
export { createDemoProviders, idealReifezahl } from "./demo/providers";
export { lookupPlzOffline, PLZ_ZONE_MAP } from "./engine/plz";
export type { PlzMatch, PlzZoneInfo } from "./engine/plz";
export {
  FreisingDwdWeatherProvider,
  DwdHistoricalWeatherProvider,
  createFreisingDwdWeatherProvider,
  recordToWeatherDay,
  parseDwdCsv,
} from "./providers/dwd";
export type { DwdDayRecord } from "./providers/dwd";
export { FREISING_2025_RECORDS } from "./providers/freising-2025-data";
