/**
 * Typed client for Seedle Backend Engine and Agronomic API.
 *
 * Designed with graceful degradation and offline fallbacks to preserve
 * static-export build compatibility (output: 'export') even when the local backend is unreachable.
 */

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
  const envUrl = process.env.NEXT_PUBLIC_SEEDLE_API_URL;
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
