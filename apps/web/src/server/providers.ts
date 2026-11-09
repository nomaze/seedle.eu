import "server-only";

import {
  createDemoProviders,
  FreisingDwdWeatherProvider,
  type Providers,
} from "@seedle/core";

/**
 * Central registry binding domain providers to backend services and external APIs.
 * Weather: Empirical historical DWD meteorological data from Station Freising / Weihenstephan (01424).
 * In production, PredictionProvider connects to the NoMaze Prediction API (docs/ERWEITERUNGEN.md).
 */
const globalForProviders = globalThis as unknown as { __skProviders?: Providers };

export function providers(): Providers {
  if (!globalForProviders.__skProviders) {
    const base = createDemoProviders();
    globalForProviders.__skProviders = {
      ...base,
      weather: new FreisingDwdWeatherProvider(),
    };
  }
  return globalForProviders.__skProviders;
}

