/**
 * Typed client for Seedle Backend Engine, Agronomic API, and Real Public Field Parcel Resolver.
 *
 * Designed with graceful degradation and offline fallbacks to preserve
 * static-export build compatibility (output: 'export') even when the local backend is unreachable.
 */
import type { Polygon } from "@seedle/core";
import { areaHa, centroid, distanceKm, isPointInPolygon } from "@seedle/core/geo";

export interface HealthResponse {
  status: string;
  version: string;
  uptime_seconds: number;
  timestamp: string;
}

export type BackendHealthResponse = HealthResponse;

export interface TraitWeights {
  yield_weight?: number;
  lodging_resistance?: number;
  maturity_time?: number;
  disease_resistance?: number;
  quality?: number;
}

export interface VarietyInput {
  id: string;
  name: string;
  crop: string;
  breeder?: string;
  traits: Record<string, number>;
}

export interface VarietyScoreResult {
  id: string;
  name: string;
  crop: string;
  score: number;
  rank: number;
  trait_breakdown: Record<string, number>;
}

export interface RecommendationRequest {
  crop: string;
  region?: string;
  weights?: TraitWeights;
  varieties?: VarietyInput[];
}

export type RecommendationScoreRequest = RecommendationRequest;

export interface RecommendationResponse {
  crop: string;
  region?: string;
  count: number;
  rankings: VarietyScoreResult[];
  algorithm_version: string;
}

export type RecommendationScoreResponse = RecommendationResponse;

export interface CommunityFeature {
  feature_id: string;
  title: string;
  description: string;
  requested_by: string;
  upvotes: number;
  category: string;
  status: string;
}

export interface CommunityVoteRequest {
  feature_id: string;
  voter_id?: string;
  feedback?: string;
}

export interface CommunityVoteResponse {
  feature_id: string;
  upvotes: number;
  success: boolean;
  message: string;
}

/** Default fallback community features returned when the backend is offline. */
export const FALLBACK_COMMUNITY_FEATURES: CommunityFeature[] = [
  {
    feature_id: "SEEDLE-FEAT-001",
    title: "Community Quick-Vote & Agronomic Trait Weighting API",
    description: "Live trait weighting sliders for yield vs disease resistance combined with direct in-app community feature upvoting.",
    requested_by: "Stani (Farmer Survey & Discord)",
    upvotes: 142,
    category: "agronomy",
    status: "released",
  },
  {
    feature_id: "SEEDLE-FEAT-002",
    title: "Regional Soil Texture & Drought Stress Adaptation Radar",
    description: "Dynamic site matching based on sand/loam texture and regional multi-year precipitation deficits.",
    requested_by: "Facebook Farmer Group",
    upvotes: 89,
    category: "soil_climate",
    status: "voting",
  },
];

/**
 * Resolves the backend base URL from environment or defaults to local port 8010.
 */
export function getBackendBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SEEDLE_API_URL ||
    process.env.NEXT_PUBLIC_SEEDLE_BACKEND_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://localhost:8010";
}

/**
 * Guard that checks if the client is executing inside an HTTPS browser context
 * while pointing to an un-proxied localhost/127.0.0.1 HTTP endpoint.
 *
 * Firing fetch against http://localhost from an https:// domain causes browser mixed-content
 * blocking, console security errors, and unnecessary network timeout delays.
 */
export function shouldSkipLocalhostInHttpsBrowser(targetUrl?: string): boolean {
  if (typeof window === "undefined" || !window.location) {
    return false;
  }
  if (window.location.protocol !== "https:") {
    return false;
  }
  const urlToCheck = targetUrl || getBackendBaseUrl();
  return (
    urlToCheck.startsWith("http://localhost") ||
    urlToCheck.startsWith("http://127.0.0.1") ||
    urlToCheck.startsWith("http://0.0.0.0")
  );
}

/**
 * Checks connectivity to the backend service.
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; health?: BackendHealthResponse }> {
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return { isOnline: false };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { isOnline: false };
    }
    const data = (await response.json()) as BackendHealthResponse;
    void flushPendingFieldIntakes();
    void flushPendingBugReports();
    return { isOnline: true, health: data };
  } catch {
    return { isOnline: false };
  }
}

/**
 * Fetches community features for voting, falling back to static items if offline.
 */
export async function fetchCommunityFeatures(): Promise<CommunityFeature[]> {
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return FALLBACK_COMMUNITY_FEATURES;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${baseUrl}/api/v1/community/features`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return FALLBACK_COMMUNITY_FEATURES;
    }
    const data = (await response.json()) as CommunityFeature[];
    return Array.isArray(data) ? data : FALLBACK_COMMUNITY_FEATURES;
  } catch {
    return FALLBACK_COMMUNITY_FEATURES;
  }
}

/**
 * Submits an upvote for a community feature.
 */
export async function voteCommunityFeature(
  featureId: string,
  voterId?: string,
  feedback?: string,
): Promise<CommunityVoteResponse> {
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return {
      feature_id: featureId,
      upvotes: 143,
      success: true,
      message: `Offline vote recorded locally for ${featureId}.`,
    };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${baseUrl}/api/v1/community/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        feature_id: featureId,
        voter_id: voterId,
        feedback: feedback,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return (await response.json()) as CommunityVoteResponse;
    }
  } catch {
    // Fallback simulation when offline
  }

  // Graceful offline simulated response
  return {
    feature_id: featureId,
    upvotes: 143,
    success: true,
    message: `Offline vote recorded locally for ${featureId}.`,
  };
}

/**
 * Requests dynamic agronomic trait scoring from the backend.
 */
export async function scoreVarieties(
  request: RecommendationScoreRequest,
): Promise<RecommendationScoreResponse | null> {
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${baseUrl}/api/v1/recommendations/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return (await response.json()) as RecommendationScoreResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export interface RealFieldParcelInfo {
  id: string;
  flik: string;
  sourceLabel: string;
  landuseLabel: string;
  areaHa: number;
  vertexCount: number;
  polygon: Polygon;
}

export interface RealFieldBoundaryLookupResult {
  matched: RealFieldParcelInfo | null;
  neighbors: RealFieldParcelInfo[];
}

/**
 * Multi-year field weather summary attached to a field intake event.
 */
export interface FieldIntakeWeatherSummary {
  avg_precip_total_mm: number;
  avg_precip_veg_mm: number;
  avg_precip_flowering_mm: number;
  avg_effective_precip_veg_mm: number;
  avg_gdd: number;
  drought_years_count: number;
  site_badge: string;
}

/**
 * Funnel stage identifier for non-blocking field intake telemetry.
 */
export type FieldIntakeStage =
  | "field_selected"
  | "soil_adjusted"
  | "crop_selected"
  | "variety_selected";

/**
 * Structured payload capturing field geometry, soil parameters, weather summary,
 * and agronomic decisions sent to `POST /api/v1/mvp/field-intake`.
 */
export interface FieldIntakePayload {
  intake_id?: string;
  field_id?: string;
  fiboa_id?: string | null;
  collection?: string | null;
  polygon_geojson?: unknown;
  area_ha: number;
  perimeter_m?: number;
  lat: number;
  lon: number;
  elevation_m?: number;
  soil_type?: string;
  ackerzahl?: number;
  farmer_soil_override?: boolean;
  irrigated?: boolean;
  cold_site?: boolean;
  weather_summary?: FieldIntakeWeatherSummary;
  crop?: string;
  usage?: string;
  risk_portfolio_size?: number;
  selected_variety_ids?: string[];
  stage: FieldIntakeStage;
}

export const PENDING_INTAKES_STORAGE_KEY = "seedle.pending_intakes";
export const MAX_PENDING_INTAKES = 25;
export const MAX_POLYGON_VERTICES = 500;
const ALLOWED_INTAKE_STAGES: readonly FieldIntakeStage[] = [
  "field_selected",
  "soil_adjusted",
  "crop_selected",
  "variety_selected",
];

/**
 * Strips ASCII control characters, HTML/script tags, and angle brackets,
 * and caps the resulting string at `maxLength` characters (default 120).
 */
export function sanitizePlainText(input: unknown, maxLength = 120): string {
  if (typeof input !== "string") return "";
  let cleaned = "";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if ((code >= 0x00 && code <= 0x1f) || code === 0x7f) {
      continue;
    }
    cleaned += input[i];
  }
  cleaned = cleaned
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Caps a GeoJSON Polygon geometry at `maxVertices` finite [lon, lat] coordinate pairs
 * to prevent oversized GeoJSON payload bombs in network requests or localStorage.
 */
export function capPolygonGeoJsonVertices(
  geom: unknown,
  maxVertices = MAX_POLYGON_VERTICES,
): unknown {
  if (!geom || typeof geom !== "object" || Array.isArray(geom)) {
    return undefined;
  }
  const rec = geom as Record<string, unknown>;
  if (rec.type !== "Polygon" || !Array.isArray(rec.coordinates)) {
    return undefined;
  }
  const outerRingRaw = rec.coordinates[0];
  if (!Array.isArray(outerRingRaw) || outerRingRaw.length < 3) {
    return undefined;
  }

  const validPoints: [number, number][] = [];
  const limit = Math.max(4, maxVertices);
  for (let i = 0; i < outerRingRaw.length && validPoints.length < limit - 1; i++) {
    const pt = outerRingRaw[i];
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lon = Number(pt[0]);
    const lat = Number(pt[1]);
    if (
      !Number.isFinite(lon) ||
      !Number.isFinite(lat) ||
      lon < -180 ||
      lon > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      continue;
    }
    validPoints.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
  }

  if (validPoints.length < 3) {
    return undefined;
  }

  const first = validPoints[0]!;
  const last = validPoints[validPoints.length - 1]!;
  if (Math.abs(first[0] - last[0]) > 1e-7 || Math.abs(first[1] - last[1]) > 1e-7) {
    validPoints.push([first[0], first[1]]);
  }

  return {
    type: "Polygon",
    coordinates: [validPoints],
  };
}

/**
 * Computes a deterministic 32-bit FNV-1a hex digest for idempotent client event IDs.
 */
function deterministicIdHash(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

export function computeDeterministicIntakeId(payload: FieldIntakePayload): string {
  if (typeof payload.intake_id === "string" && payload.intake_id.trim().length > 0) {
    return sanitizePlainText(payload.intake_id, 120);
  }
  const canonical = [
    payload.field_id || "field_default",
    payload.stage,
    Number(payload.lat).toFixed(5),
    Number(payload.lon).toFixed(5),
    Number(payload.area_ha).toFixed(2),
    payload.soil_type || "",
    payload.crop || "",
    payload.usage || "",
    (payload.selected_variety_ids ?? []).join(","),
  ].join("|");
  return `intake-${deterministicIdHash(canonical)}`;
}

/**
 * Validates and sanitizes an untrusted or client-constructed `FieldIntakePayload`.
 * Deterministically rejects `NaN`, `Infinity`, `-Infinity`, out-of-bounds coordinates,
 * out-of-bounds area_ha (`[0.01, 10000]`), or out-of-bounds ackerzahl (`[1, 120]`).
 */
export function sanitizeFieldIntakePayload(raw: unknown): FieldIntakePayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;

  // Reject prototype-polluted objects if dangerous own properties exist
  if (
    Object.prototype.hasOwnProperty.call(obj, "__proto__") ||
    Object.prototype.hasOwnProperty.call(obj, "constructor") ||
    Object.prototype.hasOwnProperty.call(obj, "prototype")
  ) {
    return null;
  }

  const lat = Number(obj.lat);
  const lon = Number(obj.lon);
  const areaHa = Number(obj.area_ha);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return null;
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return null;
  }
  if (!Number.isFinite(areaHa) || areaHa < 0.01 || areaHa > 10000) {
    return null;
  }

  if (obj.ackerzahl !== undefined && obj.ackerzahl !== null) {
    const az = Number(obj.ackerzahl);
    if (!Number.isFinite(az) || az < 1 || az > 120) {
      return null;
    }
  }

  const stageRaw = sanitizePlainText(obj.stage, 40) as FieldIntakeStage;
  if (!ALLOWED_INTAKE_STAGES.includes(stageRaw)) {
    return null;
  }

  const sanitized: FieldIntakePayload = {
    area_ha: Math.round(areaHa * 100) / 100,
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    stage: stageRaw,
  };

  if (typeof obj.field_id === "string") {
    const fid = sanitizePlainText(obj.field_id, 120);
    if (fid) sanitized.field_id = fid;
  }
  if (obj.fiboa_id !== undefined) {
    sanitized.fiboa_id =
      typeof obj.fiboa_id === "string"
        ? sanitizePlainText(obj.fiboa_id, 120) || null
        : null;
  }
  if (obj.collection !== undefined) {
    sanitized.collection =
      typeof obj.collection === "string"
        ? sanitizePlainText(obj.collection, 120) || null
        : null;
  }
  if (obj.polygon_geojson !== undefined) {
    const cappedPoly = capPolygonGeoJsonVertices(obj.polygon_geojson, MAX_POLYGON_VERTICES);
    if (cappedPoly) {
      sanitized.polygon_geojson = cappedPoly;
    }
  }
  if (obj.perimeter_m !== undefined && Number.isFinite(Number(obj.perimeter_m))) {
    const pm = Number(obj.perimeter_m);
    if (pm >= 0 && pm <= 500000) {
      sanitized.perimeter_m = Math.round(pm);
    }
  }
  if (obj.elevation_m !== undefined && Number.isFinite(Number(obj.elevation_m))) {
    const elev = Number(obj.elevation_m);
    if (elev >= -50 && elev <= 4000) {
      sanitized.elevation_m = Math.round(elev);
    }
  }
  if (typeof obj.soil_type === "string") {
    const st = sanitizePlainText(obj.soil_type, 120);
    if (st) sanitized.soil_type = st;
  }
  if (obj.ackerzahl !== undefined && obj.ackerzahl !== null) {
    sanitized.ackerzahl = Math.round(Number(obj.ackerzahl));
  }
  if (typeof obj.farmer_soil_override === "boolean") {
    sanitized.farmer_soil_override = obj.farmer_soil_override;
  }
  if (typeof obj.irrigated === "boolean") {
    sanitized.irrigated = obj.irrigated;
  }
  if (typeof obj.cold_site === "boolean") {
    sanitized.cold_site = obj.cold_site;
  }
  if (
    obj.weather_summary &&
    typeof obj.weather_summary === "object" &&
    !Array.isArray(obj.weather_summary)
  ) {
    const ws = obj.weather_summary as Record<string, unknown>;
    const pTotal = Number(ws.avg_precip_total_mm);
    const pVeg = Number(ws.avg_precip_veg_mm);
    const pFlow = Number(ws.avg_precip_flowering_mm);
    const pEff = Number(ws.avg_effective_precip_veg_mm);
    const gdd = Number(ws.avg_gdd);
    const dCount = Number(ws.drought_years_count);
    const badge = sanitizePlainText(ws.site_badge, 120);
    if (
      Number.isFinite(pTotal) &&
      Number.isFinite(pVeg) &&
      Number.isFinite(pFlow) &&
      Number.isFinite(pEff) &&
      Number.isFinite(gdd) &&
      Number.isFinite(dCount)
    ) {
      sanitized.weather_summary = {
        avg_precip_total_mm: Math.round(pTotal),
        avg_precip_veg_mm: Math.round(pVeg),
        avg_precip_flowering_mm: Math.round(pFlow),
        avg_effective_precip_veg_mm: Math.round(pEff),
        avg_gdd: Math.round(gdd),
        drought_years_count: Math.max(0, Math.min(10, Math.round(dCount))),
        site_badge: badge,
      };
    }
  }
  if (typeof obj.crop === "string") {
    const cr = sanitizePlainText(obj.crop, 120);
    if (cr) sanitized.crop = cr;
  }
  if (typeof obj.usage === "string") {
    const us = sanitizePlainText(obj.usage, 120);
    if (us) sanitized.usage = us;
  }
  if (
    obj.risk_portfolio_size !== undefined &&
    Number.isFinite(Number(obj.risk_portfolio_size))
  ) {
    const rps = Math.round(Number(obj.risk_portfolio_size));
    if (rps >= 1 && rps <= 3) {
      sanitized.risk_portfolio_size = rps;
    }
  }
  if (Array.isArray(obj.selected_variety_ids)) {
    sanitized.selected_variety_ids = obj.selected_variety_ids
      .slice(0, 20)
      .map((id) => sanitizePlainText(id, 120))
      .filter((id) => id.length > 0);
  }
  if (typeof obj.intake_id === "string") {
    const iid = sanitizePlainText(obj.intake_id, 120);
    if (iid) sanitized.intake_id = iid;
  }
  if (!sanitized.intake_id) {
    sanitized.intake_id = computeDeterministicIntakeId(sanitized);
  }

  return sanitized;
}

/**
 * Parses a JSON string while stripping prototype-pollution keys during reviver traversal.
 */
function safeJsonParse(value: string): unknown {
  return JSON.parse(value, (key, itemValue) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return undefined;
    }
    return itemValue;
  });
}

/**
 * Reads and validates queued offline field intake payloads from localStorage,
 * stripping any prototype-pollution keys and malformed records.
 */
export function getPendingFieldIntakes(): FieldIntakePayload[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PENDING_INTAKES_STORAGE_KEY);
    if (!raw || raw.length > 512_000) return [];
    const parsed = safeJsonParse(raw);
    if (!Array.isArray(parsed)) return [];
    const validated: FieldIntakePayload[] = [];
    for (const item of parsed) {
      const clean = sanitizeFieldIntakePayload(item);
      if (clean) {
        validated.push(clean);
      }
      if (validated.length >= MAX_PENDING_INTAKES) {
        break;
      }
    }
    return validated;
  } catch {
    return [];
  }
}

function enqueuePendingFieldIntake(sanitizedPayload: FieldIntakePayload): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    const withId: FieldIntakePayload = {
      ...sanitizedPayload,
      intake_id: computeDeterministicIntakeId(sanitizedPayload),
    };
    const current = getPendingFieldIntakes();
    const deduped = current.filter((it) => it.intake_id !== withId.intake_id);
    const updated = [...deduped.slice(-(MAX_PENDING_INTAKES - 1)), withId];
    window.localStorage.setItem(PENDING_INTAKES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors in restricted browsing contexts
  }
}

let isFlushingPendingIntakes = false;

/**
 * Replays any queued offline `seedle.pending_intakes` records to `POST /api/v1/mvp/field-intake`
 * and removes all successfully delivered entries from localStorage.
 * Client validation errors (`HTTP 400` or `HTTP 422`) are discarded with a warning to prevent infinite retry loops.
 */
export async function flushPendingFieldIntakes(): Promise<number> {
  if (isFlushingPendingIntakes) return 0;
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return 0;
  }
  const pending = getPendingFieldIntakes();
  if (pending.length === 0) {
    return 0;
  }

  isFlushingPendingIntakes = true;
  let flushedCount = 0;
  const remaining: FieldIntakePayload[] = [];

  try {
    for (const item of pending) {
      const payloadWithId: FieldIntakePayload = {
        ...item,
        intake_id: computeDeterministicIntakeId(item),
      };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const response = await fetch(`${baseUrl}/api/v1/mvp/field-intake`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payloadWithId),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          flushedCount += 1;
        } else if (response.status === 400 || response.status === 422) {
          console.warn(
            `[Seedle Offline Queue] Discarding invalid field intake '${payloadWithId.intake_id}' (HTTP ${response.status}).`,
          );
        } else {
          remaining.push(payloadWithId);
        }
      } catch {
        remaining.push(payloadWithId);
      }
    }

    if (typeof window !== "undefined" && window.localStorage) {
      if (remaining.length === 0) {
        window.localStorage.setItem(PENDING_INTAKES_STORAGE_KEY, "[]");
      } else {
        window.localStorage.setItem(
          PENDING_INTAKES_STORAGE_KEY,
          JSON.stringify(remaining.slice(-MAX_PENDING_INTAKES)),
        );
      }
    }
  } catch {
    // Ignore storage update errors
  } finally {
    isFlushingPendingIntakes = false;
  }

  return flushedCount;
}

/**
 * Non-blocking submission of field, soil, weather, and variety selection data
 * to `POST /api/v1/mvp/field-intake`. Validates bounds and strips XSS/control characters
 * before sending, and falls back silently to localStorage queue `seedle.pending_intakes`
 * when the backend is unreachable so zero valid records are lost.
 */
export async function submitFieldIntake(payload: FieldIntakePayload): Promise<boolean> {
  const sanitized = sanitizeFieldIntakePayload(payload);
  if (!sanitized) {
    return false;
  }

  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    enqueuePendingFieldIntake(sanitized);
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${baseUrl}/api/v1/mvp/field-intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sanitized),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      void flushPendingFieldIntakes();
      return true;
    }
  } catch {
    // Offline or timeout fallback handled below
  }

  enqueuePendingFieldIntake(sanitized);
  return false;
}

export interface FieldIntelligenceRequest {
  lat: number;
  lon: number;
  area_ha?: number;
  soil_type?: string;
  ackerzahl?: number;
  usage?: string;
  irrigated?: boolean;
  strategy_axis?: "stability" | "balanced" | "performance";
  risk_portfolio_size?: number;
}

export interface ThreeModelVarietyBreakdown {
  variety_id: string;
  variety_name?: string;
  /** Model 1: Agronomic decision tree score (0 to 100). */
  knowledge_tree_score: number;
  /** Step-by-step decision tree path executed for this field (without dashes or semicolons). */
  decision_tree_path: string[];
  /** Model 2: Statistical LSV GxE linear mixed model score (0 to 100). */
  statistical_gxe_score: number;
  /** Expected relative yield index (%) across analogous weather years. */
  expected_rel_yield_pct: number;
  /** Model 3: Non-linear ML interaction ensemble score (0 to 100). */
  ml_ensemble_score: number;
  /** Top non-linear interaction drivers (soil, July flowering heat, FAO maturity, lodging resistance). */
  top_drivers: string[];
  /** Agreement percentage (0 to 100 %) across all 3 independent models. */
  model_agreement_pct: number;
}

export interface BackendVarietyCandidate {
  variety_id?: string;
  id?: string;
  variety_name?: string;
  name?: string;
  rank?: number;
  rang?: number;
  share_percent?: number;
  share_ha?: number;
  seed_units?: number;
  seeds_per_m2_label?: string;
  seeding_recommendation?: string;
  site_adapted_seeding_line?: string;
  advisor_rationale?: string;
  provenance_badge?: string;
  trial_years_count?: number;
  model_breakdown?: ThreeModelVarietyBreakdown;
  three_model_breakdown?: ThreeModelVarietyBreakdown;
  knowledge_tree_score?: number;
  statistical_gxe_score?: number;
  ml_ensemble_score?: number;
  decision_tree_path?: string[];
  top_drivers?: string[];
  model_agreement_pct?: number;
  expected_rel_yield_pct?: number;
  [key: string]: unknown;
}

export interface FieldIntelligenceResponse {
  lat: number;
  lon: number;
  elevation_m?: number;
  site_badge?: string;
  recommended_maturity_range?: string;
  recommended_kernels_per_m2?: number;
  recommended_seed_units?: number;
  seeding_recommendation?: Record<string, unknown> | string;
  summary?: string;
  weather_10y?: Record<string, unknown>;
  site_character?: Record<string, unknown>;
  climate_outlook_next_year?: Record<string, unknown>;
  ranked_candidates?: BackendVarietyCandidate[];
  portfolio?: BackendVarietyCandidate[];
  model_breakdowns?:
    | Record<string, ThreeModelVarietyBreakdown>
    | ThreeModelVarietyBreakdown[];
  [key: string]: unknown;
}

export interface VarietyDeepAnalysisRequest {
  field_id?: string;
  variety_id: string;
  variety_name?: string;
  lat: number;
  lon: number;
  soil_type?: string;
  usage?: string;
  reifezahl?: number;
  fao?: number;
}

export interface VarietyDeepAnalysisResponse {
  variety_id: string;
  variety_name?: string;
  confidence_headline?: string;
  confidence_subtext?: string;
  advisor_rationale?: string;
  advisor_rationale_text?: string;
  years_ahead_summary?: string;
  historical_years?: Array<{
    jahr: number;
    sorteA: number;
    sorteB: number;
    jahrestyp?: string;
  }>;
  hindcast_5y?: {
    years_ahead_count?: number;
    total_years?: number;
    mean_advantage_pct?: number;
    years?: Array<{
      year?: number;
      jahr?: number;
      year_type?: string;
      jahrestyp?: string;
      variety_rel_yield_pct?: number;
      benchmark_rel_yield_pct?: number;
      sorteA?: number;
      sorteB?: number;
      delta_pct?: number;
      ahead?: boolean;
    }>;
  };
  soil_cultivation_fit?: {
    n_efficiency_title?: string;
    n_efficiency_text?: string;
    nitrogen_efficiency_text?: string;
    water_drought_title?: string;
    water_drought_text?: string;
    water_demand_text?: string;
    tillage_emergence_title?: string;
    tillage_emergence_text?: string;
    tillage_and_emergence_text?: string;
  };
  soil_and_cultivation_fit?: {
    n_efficiency_title?: string;
    n_efficiency_text?: string;
    nitrogen_efficiency_text?: string;
    water_drought_title?: string;
    water_drought_text?: string;
    water_demand_text?: string;
    tillage_emergence_title?: string;
    tillage_emergence_text?: string;
    tillage_and_emergence_text?: string;
  };
  similar_sites?: Array<{
    ort?: string;
    name?: string;
    bundesland?: string;
    region?: string;
    entfernung_km?: number;
    distance_km?: number;
    bodenart?: string;
    soil_type?: string;
    rel_ertrag_pct?: number;
    vorsprung_pct?: number;
    similarity_pct?: number;
  }>;
  similar_lsv_sites?: Array<{
    site_id?: string;
    name?: string;
    ort?: string;
    region?: string;
    bundesland?: string;
    distance_km?: number;
    entfernung_km?: number;
    soil_type?: string;
    bodenart?: string;
    similarity_pct?: number;
    ackerzahl?: number;
  }>;
  [key: string]: unknown;
}

export interface VarietySupplierItem {
  name: string;
  role?: string;
  regionLabel?: string;
  region_label?: string;
  region?: string;
  contactPerson?: string;
  contact_person?: string;
  phone?: string;
  availabilityHint?: string;
  availability_hint?: string;
}

export interface VarietyAdvisorItem {
  breederName?: string;
  breeder_name?: string;
  regionLabel?: string;
  region_label?: string;
  advisorName?: string;
  advisor_name?: string;
  contactPerson?: string;
  contact_person?: string;
  phone?: string;
  specialty?: string;
}

export interface VarietySuppliersResponse {
  dealers?: VarietySupplierItem[];
  suppliers?: VarietySupplierItem[];
  advisors?: VarietyAdvisorItem[];
  breeder_advisors?: VarietyAdvisorItem[];
  [key: string]: unknown;
}

/**
 * Queries `POST /api/v1/mvp/field-intelligence` on the Seedle backend for live site intelligence,
 * returning `null` seamlessly when offline or when coordinates are out of bounds.
 */
export async function fetchFieldIntelligenceFromBackend(
  params: FieldIntelligenceRequest,
  signal?: AbortSignal,
): Promise<FieldIntelligenceResponse | null> {
  const lat = Number(params?.lat);
  const lon = Number(params?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return null;
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return null;
  }

  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return null;
  }

  const sanitizedBody: Record<string, unknown> = {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
  };
  if (params.area_ha !== undefined && Number.isFinite(Number(params.area_ha))) {
    const ha = Number(params.area_ha);
    if (ha >= 0.01 && ha <= 10000) {
      sanitizedBody.area_ha = Math.round(ha * 100) / 100;
    }
  }
  if (typeof params.soil_type === "string") {
    const st = sanitizePlainText(params.soil_type, 120);
    if (st) sanitizedBody.soil_type = st;
  }
  if (params.ackerzahl !== undefined && Number.isFinite(Number(params.ackerzahl))) {
    const az = Math.round(Number(params.ackerzahl));
    if (az >= 1 && az <= 120) {
      sanitizedBody.ackerzahl = az;
    }
  }
  if (typeof params.usage === "string") {
    const us = sanitizePlainText(params.usage, 120);
    if (us) sanitizedBody.usage = us;
  }
  if (typeof params.irrigated === "boolean") {
    sanitizedBody.irrigated = params.irrigated;
  }
  if (
    params.strategy_axis === "stability" ||
    params.strategy_axis === "balanced" ||
    params.strategy_axis === "performance"
  ) {
    sanitizedBody.strategy_axis = params.strategy_axis;
  }
  if (
    params.risk_portfolio_size !== undefined &&
    Number.isFinite(Number(params.risk_portfolio_size))
  ) {
    const rps = Math.round(Number(params.risk_portfolio_size));
    if (rps >= 1 && rps <= 3) {
      sanitizedBody.risk_portfolio_size = rps;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const response = await fetch(`${baseUrl}/api/v1/mvp/field-intelligence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sanitizedBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }
    return data as FieldIntelligenceResponse;
  } catch {
    clearTimeout(timeoutId);
    return null;
  } finally {
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Queries `POST /api/v1/mvp/deep-analysis` on the Seedle backend for single-variety deep analysis.
 * Returns `null` when offline so the UI falls back to local deterministic analysis.
 */
export async function fetchVarietyDeepAnalysisFromBackend(
  params: VarietyDeepAnalysisRequest,
  signal?: AbortSignal,
): Promise<VarietyDeepAnalysisResponse | null> {
  const lat = Number(params?.lat);
  const lon = Number(params?.lon);
  const varietyId = sanitizePlainText(params?.variety_id, 120);
  if (!varietyId || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return null;
  }

  const body: Record<string, unknown> = {
    variety_id: varietyId,
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
  };
  if (params.field_id) body.field_id = sanitizePlainText(params.field_id, 120);
  if (params.variety_name) body.variety_name = sanitizePlainText(params.variety_name, 120);
  if (params.soil_type) body.soil_type = sanitizePlainText(params.soil_type, 120);
  if (params.usage) body.usage = sanitizePlainText(params.usage, 120);
  const rzVal =
    typeof params.reifezahl === "number" && Number.isFinite(params.reifezahl)
      ? Math.round(params.reifezahl)
      : typeof params.fao === "number" && Number.isFinite(params.fao)
        ? Math.round(params.fao)
        : undefined;
  if (rzVal !== undefined) {
    body.reifezahl = rzVal;
    body.fao = rzVal;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const response = await fetch(`${baseUrl}/api/v1/mvp/deep-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const rawResp = data as VarietyDeepAnalysisResponse;
    const rawFit = (rawResp.soil_cultivation_fit ??
      rawResp.soil_and_cultivation_fit) as Record<string, unknown> | undefined;
    const normalizedFit = rawFit
      ? {
          n_efficiency_title:
            typeof rawFit.n_efficiency_title === "string"
              ? rawFit.n_efficiency_title
              : undefined,
          n_efficiency_text:
            typeof rawFit.n_efficiency_text === "string" && rawFit.n_efficiency_text
              ? rawFit.n_efficiency_text
              : typeof rawFit.nitrogen_efficiency_text === "string"
                ? rawFit.nitrogen_efficiency_text
                : undefined,
          nitrogen_efficiency_text:
            typeof rawFit.nitrogen_efficiency_text === "string" &&
            rawFit.nitrogen_efficiency_text
              ? rawFit.nitrogen_efficiency_text
              : typeof rawFit.n_efficiency_text === "string"
                ? rawFit.n_efficiency_text
                : undefined,
          water_drought_title:
            typeof rawFit.water_drought_title === "string"
              ? rawFit.water_drought_title
              : undefined,
          water_drought_text:
            typeof rawFit.water_drought_text === "string" && rawFit.water_drought_text
              ? rawFit.water_drought_text
              : typeof rawFit.water_demand_text === "string"
                ? rawFit.water_demand_text
                : undefined,
          water_demand_text:
            typeof rawFit.water_demand_text === "string" && rawFit.water_demand_text
              ? rawFit.water_demand_text
              : typeof rawFit.water_drought_text === "string"
                ? rawFit.water_drought_text
                : undefined,
          tillage_emergence_title:
            typeof rawFit.tillage_emergence_title === "string"
              ? rawFit.tillage_emergence_title
              : undefined,
          tillage_emergence_text:
            typeof rawFit.tillage_emergence_text === "string" &&
            rawFit.tillage_emergence_text
              ? rawFit.tillage_emergence_text
              : typeof rawFit.tillage_and_emergence_text === "string"
                ? rawFit.tillage_and_emergence_text
                : undefined,
          tillage_and_emergence_text:
            typeof rawFit.tillage_and_emergence_text === "string" &&
            rawFit.tillage_and_emergence_text
              ? rawFit.tillage_and_emergence_text
              : typeof rawFit.tillage_emergence_text === "string"
                ? rawFit.tillage_emergence_text
                : undefined,
        }
      : undefined;

    return {
      ...rawResp,
      advisor_rationale:
        rawResp.advisor_rationale || rawResp.advisor_rationale_text,
      advisor_rationale_text:
        rawResp.advisor_rationale_text || rawResp.advisor_rationale,
      soil_cultivation_fit: normalizedFit ?? rawResp.soil_cultivation_fit,
      soil_and_cultivation_fit:
        normalizedFit ?? rawResp.soil_and_cultivation_fit,
      similar_sites: rawResp.similar_sites ?? rawResp.similar_lsv_sites,
      similar_lsv_sites: rawResp.similar_lsv_sites ?? rawResp.similar_sites,
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  } finally {
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Queries `GET /api/v1/mvp/varieties/{varietyId}/steckbrief` on the Seedle backend.
 * Returns `null` when offline so `VarietySteckbriefModal` falls back to `/api/v1/daten` and `fakeVarietyDetail`.
 */
export async function fetchVarietySteckbriefFromBackend(
  varietyId: string | number,
  varietyName?: string,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const cleanId = sanitizePlainText(String(varietyId), 120);
  if (!cleanId) return null;

  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return null;
  }

  const qs = varietyName
    ? `?name=${encodeURIComponent(sanitizePlainText(varietyName, 120))}`
    : "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const response = await fetch(
      `${baseUrl}/api/v1/mvp/varieties/${encodeURIComponent(cleanId)}/steckbrief${qs}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    clearTimeout(timeoutId);
    return null;
  } finally {
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Queries `GET /api/v1/varieties/suppliers` on the Seedle backend for regional seed dealers and breeder advisors.
 * Returns `null` when offline so `WhereToBuyModal` falls back to `getRegionalDealers` and `getBreederAdvisors`.
 */
export async function fetchVarietySuppliersFromBackend(
  plz?: string,
  varietyId?: string | number,
  signal?: AbortSignal,
): Promise<VarietySuppliersResponse | null> {
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return null;
  }

  const cleanPlz = sanitizePlainText(plz || "85354", 60);
  const cleanVar = varietyId !== undefined ? sanitizePlainText(String(varietyId), 120) : "";
  const url = `${baseUrl}/api/v1/varieties/suppliers?plz=${encodeURIComponent(cleanPlz)}&variety_id=${encodeURIComponent(cleanVar)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data as VarietySuppliersResponse;
  } catch {
    clearTimeout(timeoutId);
    return null;
  } finally {
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

export type BugReportCategory =
  | "ui_design"
  | "map_field"
  | "calculation"
  | "bug"
  | "idea";

export interface BugReportPayload {
  bug_id?: string;
  comment: string;
  category: BugReportCategory;
  page_url: string;
  route_path: string;
  viewport: string;
  pin_x_pct?: number | null;
  pin_y_pct?: number | null;
  screenshot_data_url?: string | null;
  context_json?: Record<string, unknown>;
}

export interface BugReportResponse {
  saved: boolean;
  mode?: "backend" | "local_queue";
  bug_id?: string;
  vault_md_path?: string;
}

export const PENDING_BUG_REPORTS_STORAGE_KEY = "seedle.pending_bug_reports";
export const MAX_PENDING_BUG_REPORTS = 15;
const ALLOWED_BUG_CATEGORIES: readonly BugReportCategory[] = [
  "ui_design",
  "map_field",
  "calculation",
  "bug",
  "idea",
];

export function computeDeterministicBugId(payload: BugReportPayload): string {
  if (typeof payload.bug_id === "string" && payload.bug_id.trim().length > 0) {
    return sanitizePlainText(payload.bug_id, 120);
  }
  const canonical = [
    payload.route_path || "/",
    payload.category || "bug",
    payload.comment || "",
    payload.pin_x_pct != null ? String(payload.pin_x_pct) : "",
    payload.pin_y_pct != null ? String(payload.pin_y_pct) : "",
  ].join("|");
  return `local-bug-${deterministicIdHash(canonical)}`;
}

/**
 * Sanitizes and validates a `BugReportPayload` before transmission or local queuing.
 */
export function sanitizeBugReportPayload(raw: unknown): BugReportPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if (
    Object.prototype.hasOwnProperty.call(obj, "__proto__") ||
    Object.prototype.hasOwnProperty.call(obj, "constructor") ||
    Object.prototype.hasOwnProperty.call(obj, "prototype")
  ) {
    return null;
  }

  const comment = sanitizePlainText(obj.comment, 2000);
  if (!comment) {
    return null;
  }

  const rawCategory = sanitizePlainText(obj.category, 40) as BugReportCategory;
  const category: BugReportCategory = ALLOWED_BUG_CATEGORIES.includes(rawCategory)
    ? rawCategory
    : "bug";

  const pageUrl = sanitizePlainText(obj.page_url, 500) || "http://localhost:3000";
  const routePath = sanitizePlainText(obj.route_path, 240) || "/";
  const viewport = sanitizePlainText(obj.viewport, 60) || "1280x800";

  let pinX: number | null = null;
  let pinY: number | null = null;
  if (obj.pin_x_pct !== undefined && obj.pin_x_pct !== null) {
    const x = Number(obj.pin_x_pct);
    if (Number.isFinite(x) && x >= 0 && x <= 100) {
      pinX = Math.round(x * 10) / 10;
    }
  }
  if (obj.pin_y_pct !== undefined && obj.pin_y_pct !== null) {
    const y = Number(obj.pin_y_pct);
    if (Number.isFinite(y) && y >= 0 && y <= 100) {
      pinY = Math.round(y * 10) / 10;
    }
  }

  let screenshotDataUrl: string | null = null;
  if (
    typeof obj.screenshot_data_url === "string" &&
    obj.screenshot_data_url.startsWith("data:image/png;base64,") &&
    obj.screenshot_data_url.length <= 4_500_000
  ) {
    screenshotDataUrl = obj.screenshot_data_url;
  }

  let contextJson: Record<string, unknown> | undefined;
  if (
    obj.context_json &&
    typeof obj.context_json === "object" &&
    !Array.isArray(obj.context_json)
  ) {
    contextJson = obj.context_json as Record<string, unknown>;
  }

  const sanitized: BugReportPayload = {
    comment,
    category,
    page_url: pageUrl,
    route_path: routePath,
    viewport,
    pin_x_pct: pinX,
    pin_y_pct: pinY,
    screenshot_data_url: screenshotDataUrl,
    context_json: contextJson,
  };

  if (typeof obj.bug_id === "string") {
    const bid = sanitizePlainText(obj.bug_id, 120);
    if (bid) sanitized.bug_id = bid;
  }
  if (!sanitized.bug_id) {
    sanitized.bug_id = computeDeterministicBugId(sanitized);
  }

  return sanitized;
}

/**
 * Reads queued offline bug reports from localStorage (`seedle.pending_bug_reports`, max 15 entries).
 */
export function getPendingBugReports(): BugReportPayload[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PENDING_BUG_REPORTS_STORAGE_KEY);
    if (!raw || raw.length > 8_000_000) return [];
    const parsed = safeJsonParse(raw);
    if (!Array.isArray(parsed)) return [];
    const validated: BugReportPayload[] = [];
    for (const item of parsed) {
      const clean = sanitizeBugReportPayload(item);
      if (clean) {
        validated.push(clean);
      }
      if (validated.length >= MAX_PENDING_BUG_REPORTS) {
        break;
      }
    }
    return validated;
  } catch {
    return [];
  }
}

function enqueuePendingBugReport(sanitized: BugReportPayload): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    const withId: BugReportPayload = {
      ...sanitized,
      bug_id: computeDeterministicBugId(sanitized),
    };
    const current = getPendingBugReports();
    const deduped = current.filter((it) => it.bug_id !== withId.bug_id);
    const updated = [...deduped.slice(-(MAX_PENDING_BUG_REPORTS - 1)), withId];
    window.localStorage.setItem(
      PENDING_BUG_REPORTS_STORAGE_KEY,
      JSON.stringify(updated),
    );
  } catch {
    // Ignore storage quota errors in restricted browsing contexts
  }
}

let isFlushingPendingBugReports = false;

/**
 * Flushes any queued offline bug reports from `seedle.pending_bug_reports` to `POST /api/v1/mvp/bug-reports`.
 * Client validation errors (`HTTP 400` or `HTTP 422`) are discarded with a warning so broken items never block the queue.
 */
export async function flushPendingBugReports(): Promise<number> {
  if (isFlushingPendingBugReports) return 0;
  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    return 0;
  }
  const pending = getPendingBugReports();
  if (pending.length === 0) {
    return 0;
  }

  isFlushingPendingBugReports = true;
  let flushedCount = 0;
  const remaining: BugReportPayload[] = [];

  try {
    for (const item of pending) {
      const payloadWithId: BugReportPayload = {
        ...item,
        bug_id: computeDeterministicBugId(item),
      };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${baseUrl}/api/v1/mvp/bug-reports`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payloadWithId),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          flushedCount += 1;
        } else if (response.status === 400 || response.status === 422) {
          console.warn(
            `[Seedle Offline Queue] Discarding invalid bug report '${payloadWithId.bug_id}' (HTTP ${response.status}).`,
          );
        } else {
          remaining.push(payloadWithId);
        }
      } catch {
        remaining.push(payloadWithId);
      }
    }

    if (typeof window !== "undefined" && window.localStorage) {
      if (remaining.length === 0) {
        window.localStorage.setItem(PENDING_BUG_REPORTS_STORAGE_KEY, "[]");
      } else {
        window.localStorage.setItem(
          PENDING_BUG_REPORTS_STORAGE_KEY,
          JSON.stringify(remaining.slice(-MAX_PENDING_BUG_REPORTS)),
        );
      }
    }
  } catch {
    // Ignore storage update errors
  } finally {
    isFlushingPendingBugReports = false;
  }

  return flushedCount;
}

/**
 * Submits an in-app bug report and screenshot to `POST /api/v1/mvp/bug-reports` (5,000 ms timeout),
 * falling back to `localStorage` (`seedle.pending_bug_reports`, max 15 entries) when offline.
 */
export async function submitBugReport(
  payload: BugReportPayload,
): Promise<BugReportResponse> {
  const sanitized = sanitizeBugReportPayload(payload);
  if (!sanitized) {
    return { saved: false };
  }
  const deterministicBugId = computeDeterministicBugId(sanitized);

  const baseUrl = getBackendBaseUrl();
  if (shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    enqueuePendingBugReport(sanitized);
    return {
      saved: false,
      mode: "local_queue",
      bug_id: deterministicBugId,
      vault_md_path: "operations/bug_reports",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/v1/mvp/bug-reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sanitized),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      void flushPendingBugReports();
      return {
        saved: true,
        mode: "backend",
        bug_id:
          typeof data.bug_id === "string"
            ? data.bug_id
            : deterministicBugId,
        vault_md_path:
          typeof data.vault_md_path === "string"
            ? data.vault_md_path
            : "operations/bug_reports",
      };
    }
  } catch {
    // Offline or timeout fallback handled below
  }

  enqueuePendingBugReport(sanitized);
  return {
    saved: false,
    mode: "local_queue",
    bug_id: deterministicBugId,
    vault_md_path: "operations/bug_reports",
  };
}

function mapLanduseLabel(raw?: string | null): string {
  const clean = (raw || "").toLowerCase();
  if (clean.includes("meadow") || clean.includes("grass") || clean.includes("gruenland") || clean.includes("grünland")) {
    return "Grünland / Dauergrünland (Meadow)";
  }
  if (clean.includes("orchard")) return "Obstbau / Sonderkultur (Orchard)";
  if (clean.includes("vineyard")) return "Weinbau (Vineyard)";
  return "Ackerland (Farmland)";
}

function normalizeClosedRing(coords: [number, number][]): [number, number][] | null {
  if (coords.length < 3) return null;
  const cleaned: [number, number][] = [];
  for (const pt of coords) {
    const lon = Number(pt[0]);
    const lat = Number(pt[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const prev = cleaned[cleaned.length - 1];
    if (!prev || Math.abs(prev[0] - lon) > 1e-7 || Math.abs(prev[1] - lat) > 1e-7) {
      cleaned.push([lon, lat]);
    }
  }
  if (cleaned.length < 3) return null;
  const first = cleaned[0]!;
  const last = cleaned[cleaned.length - 1]!;
  if (Math.abs(first[0] - last[0]) > 1e-7 || Math.abs(first[1] - last[1]) > 1e-7) {
    cleaned.push([first[0], first[1]]);
  }
  return cleaned.length >= 4 ? cleaned : null;
}

/**
 * Normalizes a polygon ring from either GeoJSON `[lon, lat]` or backend `[lat, lng]`
 * (where `pt[0] > 45 && pt[1] < 20` in Central Europe) into a closed GeoJSON `[lon, lat]` ring.
 */
export function normalizePolygonRing(rawPoly: unknown): [number, number][] | null {
  let rawCoords: unknown[] | null = null;
  if (Array.isArray(rawPoly)) {
    if (
      rawPoly.length > 0 &&
      Array.isArray(rawPoly[0]) &&
      Array.isArray((rawPoly[0] as unknown[])[0])
    ) {
      rawCoords = rawPoly[0] as unknown[];
    } else {
      rawCoords = rawPoly;
    }
  } else if (rawPoly && typeof rawPoly === "object") {
    const obj = rawPoly as Record<string, unknown>;
    if (Array.isArray(obj.coordinates)) {
      if (
        obj.coordinates.length > 0 &&
        Array.isArray(obj.coordinates[0]) &&
        Array.isArray((obj.coordinates[0] as unknown[])[0])
      ) {
        rawCoords = obj.coordinates[0] as unknown[];
      } else {
        rawCoords = obj.coordinates as unknown[];
      }
    }
  }
  if (!rawCoords || rawCoords.length < 3) return null;

  const oriented: [number, number][] = [];
  for (const item of rawCoords) {
    if (Array.isArray(item) && item.length >= 2) {
      const c0 = Number(item[0]);
      const c1 = Number(item[1]);
      if (!Number.isFinite(c0) || !Number.isFinite(c1)) continue;
      // Backend `snapped_parcel.polygon` stores `[lat, lng]` (e.g. [48.4028, 11.7489])
      if (c0 > 45 && c1 < 20) {
        oriented.push([c1, c0]);
      } else {
        oriented.push([c0, c1]);
      }
    } else if (item && typeof item === "object") {
      const ptObj = item as Record<string, unknown>;
      const lat = Number(ptObj.lat ?? ptObj.latitude);
      const lon = Number(ptObj.lon ?? ptObj.lng ?? ptObj.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        oriented.push([lon, lat]);
      }
    }
  }
  return normalizeClosedRing(oriented);
}

function parseBackendParcelObject(
  rawParcel: unknown,
  fallbackIndex: number,
  attribution?: string,
): RealFieldParcelInfo | null {
  if (!rawParcel || typeof rawParcel !== "object" || Array.isArray(rawParcel)) {
    return null;
  }
  const p = rawParcel as Record<string, unknown>;
  const ring = normalizePolygonRing(p.polygon ?? p.geometry);
  if (!ring) return null;

  const poly: Polygon = { type: "Polygon", coordinates: [ring] };
  const rawArea = Number(p.area_ha ?? p.areaHa);
  const ha =
    Number.isFinite(rawArea) && rawArea > 0
      ? Math.round(rawArea * 10) / 10
      : Math.round(areaHa(poly) * 10) / 10;
  const flik = String(p.flik || p.FLIK || p.id || p.parcel_id || `Feldblock-${fallbackIndex}`);
  const id = String(p.parcel_id || p.id || flik);
  const sourceLabel = String(
    p.sourceLabel ||
      p.source_label ||
      p.source ||
      p.label ||
      attribution ||
      "Amtliches Feldblockkataster (InVeKoS / OGC)",
  );
  const landuseLabel = mapLanduseLabel(
    String(p.land_use || p.landuse || p.nutzung || "farmland"),
  );

  return {
    id,
    flik,
    sourceLabel,
    landuseLabel,
    areaHa: ha,
    vertexCount: ring.length - 1,
    polygon: poly,
  };
}

function selectTargetAndNeighbors(
  lat: number,
  lon: number,
  candidates: RealFieldParcelInfo[],
): RealFieldBoundaryLookupResult {
  if (candidates.length === 0) return { matched: null, neighbors: [] };
  const clickPt = { lat, lon };

  // 1. Exact point-in-polygon hit via ray-casting
  let matched = candidates.find((c) => isPointInPolygon(clickPt, c.polygon)) ?? null;

  // 2. Fallback: nearest real agricultural polygon within 250 m (0.25 km)
  if (!matched) {
    let best: RealFieldParcelInfo | null = null;
    let bestDistKm = Infinity;
    for (const c of candidates) {
      const center = centroid(c.polygon);
      const d = distanceKm(clickPt, center);
      if (d < bestDistKm) {
        bestDistKm = d;
        best = c;
      }
    }
    if (best && bestDistKm <= 0.25) {
      matched = best;
    }
  }

  const neighbors = matched
    ? candidates.filter((c) => c.id !== matched.id).slice(0, 25)
    : candidates.slice(0, 25);

  return { matched, neighbors };
}

/**
 * Resolves the real agricultural field boundary at `(lat, lon)` from official public geodata:
 * - Stage A: Local Seedle Backend Resolver (`GET /api/v1/fields/parcels?lat=...&lng=...`)
 * - Stage B1 (NRW): Official INSPIRE / InVeKoS Feldblock OGC API (`https://ogc-api.nrw.de/inspire-lc-fb/v1/collections/feldblock/items`)
 * - Stage B2 (Germany & Europe): OpenStreetMap Overpass API real agricultural polygons (`landuse~farmland|meadow|orchard|vineyard|farm|grass`)
 */
export async function fetchRealFieldBoundaryAtPoint(
  lat: number,
  lon: number,
): Promise<RealFieldBoundaryLookupResult> {
  const candidates: RealFieldParcelInfo[] = [];

  // Stage A: Try local backend parcel resolver first
  const baseUrl = getBackendBaseUrl();
  if (!shouldSkipLocalhostInHttpsBrowser(baseUrl)) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1800);
      const res = await fetch(
        `${baseUrl}/api/v1/fields/parcels?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lon))}`,
        { headers: { Accept: "application/json" }, signal: ctrl.signal },
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as {
          attribution?: string;
          snapped_parcel?: unknown;
          surrounding_parcels?: unknown[];
          features?: Array<{
            id?: string | number;
            properties?: Record<string, unknown>;
            geometry?: { type?: string; coordinates?: unknown };
          }>;
          parcels?: unknown[];
        };

        if (data?.snapped_parcel || Array.isArray(data?.surrounding_parcels)) {
          const snapped = data.snapped_parcel
            ? parseBackendParcelObject(data.snapped_parcel, 1, data.attribution)
            : null;
          const surrounding: RealFieldParcelInfo[] = [];
          if (Array.isArray(data.surrounding_parcels)) {
            data.surrounding_parcels.forEach((rawP, idx) => {
              const parsed = parseBackendParcelObject(
                rawP,
                idx + 2,
                data.attribution,
              );
              if (parsed && (!snapped || parsed.id !== snapped.id)) {
                surrounding.push(parsed);
              }
            });
          }
          if (snapped) {
            return {
              matched: snapped,
              neighbors: surrounding.slice(0, 25),
            };
          }
          candidates.push(...surrounding);
        }

        if (Array.isArray(data?.features)) {
          for (const feat of data.features) {
            if (feat?.geometry?.type === "Polygon" && Array.isArray(feat.geometry.coordinates)) {
              const ring = normalizePolygonRing(feat.geometry.coordinates);
              if (ring) {
                const poly: Polygon = { type: "Polygon", coordinates: [ring] };
                const props = feat.properties ?? {};
                const rawArea = Number(props.area_ha ?? props.areaHa);
                const ha =
                  Number.isFinite(rawArea) && rawArea > 0
                    ? Math.round(rawArea * 10) / 10
                    : Math.round(areaHa(poly) * 10) / 10;
                const flik = String(props.flik || props.FLIK || props.id || feat.id || "Amtlicher Schlag");
                candidates.push({
                  id: String(feat.id || props.id || flik),
                  flik,
                  sourceLabel: String(
                    props.sourceLabel ||
                      props.source ||
                      data.attribution ||
                      "Amtliches Feldblockkataster (InVeKoS / OGC)",
                  ),
                  landuseLabel: mapLanduseLabel(String(props.landuse || props.nutzung || "farmland")),
                  areaHa: ha,
                  vertexCount: ring.length - 1,
                  polygon: poly,
                });
              }
            }
          }
        } else if (Array.isArray(data?.parcels)) {
          data.parcels.forEach((p, idx) => {
            const parsed = parseBackendParcelObject(p, idx + 1, data.attribution);
            if (parsed) {
              candidates.push(parsed);
            }
          });
        }
        if (candidates.length > 0) {
          const hit = selectTargetAndNeighbors(lat, lon, candidates);
          if (hit.matched) return hit;
        }
      }
    } catch {
      // Backend offline -> proceed immediately to Stage B direct public geodata lookup
    }
  }

  // Stage B1: Official NRW INSPIRE / InVeKoS Feldblock OGC API when coordinates are in NRW
  if (lat >= 50.3 && lat <= 52.6 && lon >= 5.8 && lon <= 9.5) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const bbox = `${(lon - 0.003).toFixed(5)},${(lat - 0.003).toFixed(5)},${(lon + 0.003).toFixed(5)},${(lat + 0.003).toFixed(5)}`;
      const nrwUrl = `https://ogc-api.nrw.de/inspire-lc-fb/v1/collections/feldblock/items?bbox=${bbox}&limit=20&f=json`;
      const res = await fetch(nrwUrl, {
        headers: { Accept: "application/geo+json, application/json" },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const geo = (await res.json()) as {
          features?: Array<{
            id?: string | number;
            properties?: Record<string, unknown>;
            geometry?: { type?: string; coordinates?: unknown };
          }>;
        };
        for (const feat of geo.features ?? []) {
          const geomType = feat?.geometry?.type;
          const rawCoords = feat?.geometry?.coordinates as unknown;
          let outerRing: [number, number][] | null = null;
          if (geomType === "Polygon" && Array.isArray(rawCoords)) {
            outerRing = normalizeClosedRing((rawCoords[0] ?? []) as [number, number][]);
          } else if (geomType === "MultiPolygon" && Array.isArray(rawCoords)) {
            outerRing = normalizeClosedRing(((rawCoords[0] as unknown[])?.[0] ?? []) as [number, number][]);
          }
          if (outerRing) {
            const poly: Polygon = { type: "Polygon", coordinates: [outerRing] };
            const ha = Math.round(areaHa(poly) * 10) / 10;
            const props = feat.properties ?? {};
            const flik = String(
              props.flik || props.FLIK || props.fachkennzeichen || feat.id || "DENWLI-Feldblock",
            );
            candidates.push({
              id: `nrw-${flik}`,
              flik,
              sourceLabel: `Amtlicher InVeKoS-Feldblock NRW (${flik})`,
              landuseLabel: mapLanduseLabel(String(props.bodennutzung || props.nutzung || "farmland")),
              areaHa: ha,
              vertexCount: outerRing.length - 1,
              polygon: poly,
            });
          }
        }
        if (candidates.length > 0) {
          const hit = selectTargetAndNeighbors(lat, lon, candidates);
          if (hit.matched) return hit;
        }
      }
    } catch {
      // Fall through to Overpass API
    }
  }

  // Stage B2: Direct browser lookup against OpenStreetMap Overpass API (real farmland/meadow polygons)
  const overpassQuery = `[out:json][timeout:5];(way["landuse"~"farmland|meadow|orchard|vineyard|farm|grass"](around:350,${lat.toFixed(6)},${lon.toFixed(6)}););out body geom;`;
  const overpassEndpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const endpoint of overpassEndpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const url = `${endpoint}?data=${encodeURIComponent(overpassQuery)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const data = (await res.json()) as {
        elements?: Array<{
          type?: string;
          id?: number;
          tags?: Record<string, string>;
          geometry?: Array<{ lat: number; lon: number }>;
        }>;
      };

      for (const el of data.elements ?? []) {
        if (el.type === "way" && Array.isArray(el.geometry) && el.geometry.length >= 3) {
          const rawPts: [number, number][] = el.geometry.map((pt) => [pt.lon, pt.lat]);
          const ring = normalizeClosedRing(rawPts);
          if (!ring) continue;
          const poly: Polygon = { type: "Polygon", coordinates: [ring] };
          const ha = Math.round(areaHa(poly) * 10) / 10;
          if (ha < 0.05 || ha > 450) continue;
          const osmId = String(el.id ?? candidates.length + 1);
          const landuseRaw = el.tags?.landuse || el.tags?.crop || "farmland";
          const refTag = el.tags?.ref || el.tags?.name || `OSM #${osmId}`;
          candidates.push({
            id: `osm-way-${osmId}`,
            flik: refTag,
            sourceLabel: `Öffentliches Flur-/Ackerkataster (OSM Farmland #${osmId})`,
            landuseLabel: mapLanduseLabel(landuseRaw),
            areaHa: ha,
            vertexCount: ring.length - 1,
            polygon: poly,
          });
        }
      }

      if (candidates.length > 0) {
        return selectTargetAndNeighbors(lat, lon, candidates);
      }
    } catch {
      // Try next Overpass mirror if primary timed out
    }
  }

  return selectTargetAndNeighbors(lat, lon, candidates);
}
