import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkBackendHealth,
  FALLBACK_COMMUNITY_FEATURES,
  fetchCommunityFeatures,
  getBackendBaseUrl,
  scoreVarieties,
  shouldSkipLocalhostInHttpsBrowser,
  type TraitWeights,
  voteCommunityFeature,
} from "../backendClient";

describe("backendClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SEEDLE_API_URL;
  });

  it("resolves default backend base URL", () => {
    delete process.env.NEXT_PUBLIC_SEEDLE_API_URL;
    expect(getBackendBaseUrl()).toBe("http://localhost:8010");

    process.env.NEXT_PUBLIC_SEEDLE_API_URL = "http://127.0.0.1:8010/";
    expect(getBackendBaseUrl()).toBe("http://127.0.0.1:8010");
  });

  it("supports typed TraitWeights with English field names", () => {
    const weights: TraitWeights = {
      yield_weight: 0.8,
      lodging_resistance: 0.7,
      maturity_time: 0.5,
      disease_resistance: 0.9,
      quality: 0.6,
    };
    expect(weights.yield_weight).toBe(0.8);
    expect(weights.disease_resistance).toBe(0.9);
  });

  describe("shouldSkipLocalhostInHttpsBrowser", () => {
    it("returns false in non-browser environment", () => {
      vi.stubGlobal("window", undefined);
      expect(shouldSkipLocalhostInHttpsBrowser("http://localhost:8010")).toBe(false);
    });

    it("returns false when browser protocol is http:", () => {
      vi.stubGlobal("window", { location: { protocol: "http:" } });
      expect(shouldSkipLocalhostInHttpsBrowser("http://localhost:8010")).toBe(false);
    });

    it("returns true when browser protocol is https: and target is localhost or 127.0.0.1", () => {
      vi.stubGlobal("window", { location: { protocol: "https:" } });
      expect(shouldSkipLocalhostInHttpsBrowser("http://localhost:8010")).toBe(true);
      expect(shouldSkipLocalhostInHttpsBrowser("http://127.0.0.1:8010")).toBe(true);
      expect(shouldSkipLocalhostInHttpsBrowser("http://0.0.0.0:8010")).toBe(true);
    });

    it("returns false when browser protocol is https: and target is a secure production URL", () => {
      vi.stubGlobal("window", { location: { protocol: "https:" } });
      expect(shouldSkipLocalhostInHttpsBrowser("https://api.seedle.eu")).toBe(false);
    });
  });

  describe("Smart HTTPS guard integration", () => {
    it("bypasses fetch and returns typed fallbacks immediately in HTTPS browser with default localhost", async () => {
      vi.stubGlobal("window", { location: { protocol: "https:" } });
      delete process.env.NEXT_PUBLIC_SEEDLE_API_URL;

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const health = await checkBackendHealth();
      expect(health.isOnline).toBe(false);

      const features = await fetchCommunityFeatures();
      expect(features).toEqual(FALLBACK_COMMUNITY_FEATURES);

      const vote = await voteCommunityFeature("SEEDLE-FEAT-001");
      expect(vote.success).toBe(true);
      expect(vote.feature_id).toBe("SEEDLE-FEAT-001");

      const scores = await scoreVarieties({ crop: "winterweizen" });
      expect(scores).toBeNull();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it("falls back gracefully when backend is offline", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const health = await checkBackendHealth();
    expect(health.isOnline).toBe(false);

    const features = await fetchCommunityFeatures();
    expect(features.length).toBeGreaterThanOrEqual(2);
    expect(features[0].feature_id).toBe("SEEDLE-FEAT-001");

    const vote = await voteCommunityFeature("SEEDLE-FEAT-001", "test_farmer", "Great feature");
    expect(vote.success).toBe(true);
    expect(vote.feature_id).toBe("SEEDLE-FEAT-001");

    const scores = await scoreVarieties({ crop: "winterweizen" });
    expect(scores).toBeNull();
  });

  it("handles live backend responses when online", async () => {
    const mockHealth = {
      status: "healthy",
      version: "0.1.0",
      uptime_seconds: 12.34,
      timestamp: new Date().toISOString(),
    };

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/v1/health")) {
        return Promise.resolve(new Response(JSON.stringify(mockHealth), { status: 200 }));
      }
      if (urlStr.includes("/api/v1/community/features")) {
        return Promise.resolve(new Response(JSON.stringify(FALLBACK_COMMUNITY_FEATURES), { status: 200 }));
      }
      if (urlStr.includes("/api/v1/community/vote")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              feature_id: "SEEDLE-FEAT-001",
              upvotes: 143,
              success: true,
              message: "Vote recorded",
            }),
            { status: 200 },
          ),
        );
      }
      if (urlStr.includes("/api/v1/recommendations/score")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              crop: "winterweizen",
              count: 1,
              rankings: [
                {
                  id: "ww_1",
                  name: "Champion",
                  crop: "winterweizen",
                  score: 95.0,
                  rank: 1,
                  trait_breakdown: {},
                },
              ],
              algorithm_version: "seedle-engine-v1",
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    });

    const health = await checkBackendHealth();
    expect(health.isOnline).toBe(true);
    expect(health.health?.status).toBe("healthy");

    const features = await fetchCommunityFeatures();
    expect(features.length).toBe(2);

    const vote = await voteCommunityFeature("SEEDLE-FEAT-001");
    expect(vote.upvotes).toBe(143);

    const scoreResult = await scoreVarieties({ crop: "winterweizen" });
    expect(scoreResult).not.toBeNull();
    expect(scoreResult?.rankings[0].name).toBe("Champion");
  });
});
