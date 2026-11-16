import { afterEach, describe, expect, it, vi } from "vitest";
import {
  capPolygonGeoJsonVertices,
  checkBackendHealth,
  FALLBACK_COMMUNITY_FEATURES,
  fetchCommunityFeatures,
  fetchFieldIntelligenceFromBackend,
  type FieldIntakePayload,
  flushPendingBugReports,
  flushPendingFieldIntakes,
  getBackendBaseUrl,
  getPendingBugReports,
  getPendingFieldIntakes,
  MAX_PENDING_BUG_REPORTS,
  MAX_PENDING_INTAKES,
  MAX_POLYGON_VERTICES,
  PENDING_BUG_REPORTS_STORAGE_KEY,
  PENDING_INTAKES_STORAGE_KEY,
  sanitizeBugReportPayload,
  sanitizeFieldIntakePayload,
  sanitizePlainText,
  scoreVarieties,
  shouldSkipLocalhostInHttpsBrowser,
  submitBugReport,
  submitFieldIntake,
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

  it("submits field intake to /api/v1/mvp/field-intake when online and queues to localStorage when offline", async () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("window", {
      location: { protocol: "http:" },
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
      },
    });

    const samplePayload: FieldIntakePayload = {
      field_id: "f-hinteracker",
      fiboa_id: "DE-BY-084-001",
      collection: "fiboa / InVeKoS",
      area_ha: 14.5,
      perimeter_m: 1520,
      lat: 48.4028,
      lon: 11.7489,
      elevation_m: 448,
      soil_type: "sandiger_lehm",
      ackerzahl: 62,
      farmer_soil_override: true,
      irrigated: false,
      cold_site: false,
      weather_summary: {
        avg_precip_total_mm: 760,
        avg_precip_veg_mm: 350,
        avg_precip_flowering_mm: 138,
        avg_effective_precip_veg_mm: 312,
        avg_gdd: 1460,
        drought_years_count: 2,
        site_badge: "Ausgeglichener Gunststandort",
      },
      crop: "mais",
      usage: "silomais",
      risk_portfolio_size: 2,
      selected_variety_ids: ["aw-talkrone", "fg-kontinent"],
      stage: "variety_selected",
    };

    // 1. Online POST succeeds
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    const ok = await submitFieldIntake(samplePayload);
    expect(ok).toBe(true);
    expect(getPendingFieldIntakes()).toHaveLength(0);

    // 2. Offline POST queues into localStorage under seedle.pending_intakes
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Offline"));
    const queued = await submitFieldIntake({
      ...samplePayload,
      stage: "field_selected",
    });
    expect(queued).toBe(false);
    expect(store[PENDING_INTAKES_STORAGE_KEY]).toBeDefined();
    const pending = getPendingFieldIntakes();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.stage).toBe("field_selected");
    expect(pending[0]?.farmer_soil_override).toBe(true);
  });

  describe("Security & Adversarial Hardening (OWASP Input Validation, XSS, GeoJSON Cap & Queue Flush)", () => {
    it("1. deterministically rejects NaN, Infinity, and out-of-bounds coordinates, area_ha, or ackerzahl", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      expect(
        sanitizeFieldIntakePayload({
          lat: Number.NaN,
          lon: 11.7,
          area_ha: 10,
          stage: "field_selected",
        }),
      ).toBeNull();

      expect(
        sanitizeFieldIntakePayload({
          lat: 48.4,
          lon: Number.POSITIVE_INFINITY,
          area_ha: 10,
          stage: "field_selected",
        }),
      ).toBeNull();

      expect(
        sanitizeFieldIntakePayload({
          lat: 95.0, // > 90
          lon: 11.7,
          area_ha: 10,
          stage: "field_selected",
        }),
      ).toBeNull();

      expect(
        sanitizeFieldIntakePayload({
          lat: 48.4,
          lon: -195.0, // < -180
          area_ha: 10,
          stage: "field_selected",
        }),
      ).toBeNull();

      expect(
        sanitizeFieldIntakePayload({
          lat: 48.4,
          lon: 11.7,
          area_ha: -5, // < 0.01
          stage: "field_selected",
        }),
      ).toBeNull();

      expect(
        sanitizeFieldIntakePayload({
          lat: 48.4,
          lon: 11.7,
          area_ha: 25000, // > 10000
          stage: "field_selected",
        }),
      ).toBeNull();

      expect(
        sanitizeFieldIntakePayload({
          lat: 48.4,
          lon: 11.7,
          area_ha: 10,
          ackerzahl: 999, // > 120
          stage: "soil_adjusted",
        }),
      ).toBeNull();

      const invalidSent = await submitFieldIntake({
        lat: Number.NaN,
        lon: 11.7,
        area_ha: 10,
        stage: "field_selected",
      });
      expect(invalidSent).toBe(false);

      const invalidIntel = await fetchFieldIntelligenceFromBackend({
        lat: 999,
        lon: 11.7,
      });
      expect(invalidIntel).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("2. strips XSS script tags, HTML angle brackets, and ASCII control characters from FieldIntakePayload", () => {
      const dirty = "\u0000\u0007<script>alert('xss')</script>Schlag <b>Nord</b>\u001F";
      expect(sanitizePlainText(dirty)).toBe("Schlag Nord");
      expect(sanitizePlainText("X".repeat(250), 120)).toHaveLength(120);

      const sanitized = sanitizeFieldIntakePayload({
        field_id: "<script>evil()</script>f-101\u0000",
        fiboa_id: "<img src=x onerror=alert(1)>DE-BY-123",
        collection: "fiboa\u0008 <svg onload=x()>",
        soil_type: "sandiger_lehm<script>x</script>",
        crop: "<b>mais</b>",
        usage: "silomais<iframe src=x>",
        area_ha: 12.4,
        lat: 48.4028,
        lon: 11.7489,
        selected_variety_ids: ["<script>bad</script>aw-talkrone", "fg-kontinent"],
        stage: "variety_selected",
      });

      expect(sanitized).not.toBeNull();
      expect(sanitized?.field_id).toBe("f-101");
      expect(sanitized?.fiboa_id).toBe("DE-BY-123");
      expect(sanitized?.collection).toBe("fiboa");
      expect(sanitized?.soil_type).toBe("sandiger_lehm");
      expect(sanitized?.crop).toBe("mais");
      expect(sanitized?.usage).toBe("silomais");
      expect(sanitized?.selected_variety_ids).toEqual(["aw-talkrone", "fg-kontinent"]);
    });

    it("3. caps oversized GeoJSON polygons at 500 vertices and guards localStorage against prototype pollution and >25 items", () => {
      // Build a 1,200-vertex polygon bomb
      const hugeRing: [number, number][] = [];
      for (let i = 0; i < 1200; i++) {
        const angle = (i / 1200) * Math.PI * 2;
        hugeRing.push([11.7 + Math.cos(angle) * 0.01, 48.4 + Math.sin(angle) * 0.01]);
      }
      hugeRing.push(hugeRing[0]!);

      const capped = capPolygonGeoJsonVertices({
        type: "Polygon",
        coordinates: [hugeRing],
      }) as { type: string; coordinates: [number, number][][] };

      expect(capped).toBeDefined();
      expect(capped.type).toBe("Polygon");
      expect(capped.coordinates[0]!.length).toBeLessThanOrEqual(MAX_POLYGON_VERTICES);

      // Prototype-pollution & 25-entry cap in getPendingFieldIntakes
      const store: Record<string, string> = {};
      vi.stubGlobal("window", {
        location: { protocol: "http:" },
        localStorage: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
        },
      });

      const fortyItems = Array.from({ length: 40 }, (_, idx) => ({
        field_id: `f-${idx}`,
        area_ha: 10,
        lat: 48.4,
        lon: 11.7,
        stage: "field_selected",
      }));
      store[PENDING_INTAKES_STORAGE_KEY] = JSON.stringify([
        ...fortyItems,
        JSON.parse('{"__proto__":{"polluted":true},"lat":48.4,"lon":11.7,"area_ha":5,"stage":"field_selected"}'),
        { lat: "NaN", lon: 11.7, area_ha: 5, stage: "field_selected" },
      ]);

      const pending = getPendingFieldIntakes();
      expect(pending.length).toBeLessThanOrEqual(MAX_PENDING_INTAKES);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("4. flushes queued offline field intakes via flushPendingFieldIntakes() and fetches live field intelligence", async () => {
      const store: Record<string, string> = {};
      vi.stubGlobal("window", {
        location: { protocol: "http:" },
        localStorage: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
        },
      });

      // Seed 2 offline items in localStorage
      store[PENDING_INTAKES_STORAGE_KEY] = JSON.stringify([
        {
          field_id: "f-1",
          area_ha: 8.5,
          lat: 48.4,
          lon: 11.7,
          stage: "field_selected",
        },
        {
          field_id: "f-1",
          area_ha: 8.5,
          lat: 48.4,
          lon: 11.7,
          crop: "mais",
          usage: "silomais",
          stage: "crop_selected",
        },
      ]);

      vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/v1/mvp/field-intake")) {
          return Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
        }
        if (urlStr.includes("/api/v1/mvp/field-intelligence")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                lat: 48.4,
                lon: 11.7,
                site_badge: "Ausgeglichener Gunststandort",
                recommended_kernels_per_m2: 9.2,
              }),
              { status: 200 },
            ),
          );
        }
        return Promise.resolve(new Response("Not Found", { status: 404 }));
      });

      const flushed = await flushPendingFieldIntakes();
      expect(flushed).toBe(2);
      expect(getPendingFieldIntakes()).toHaveLength(0);

      const intel = await fetchFieldIntelligenceFromBackend({
        lat: 48.4,
        lon: 11.7,
        area_ha: 8.5,
        soil_type: "sandiger_lehm",
        usage: "silomais",
      });
      expect(intel).not.toBeNull();
      expect(intel?.site_badge).toBe("Ausgeglichener Gunststandort");
    });

    it("5. submits bug reports to /api/v1/mvp/bug-reports, queues up to 15 offline reports, and flushes them", async () => {
      const store: Record<string, string> = {};
      vi.stubGlobal("window", {
        location: { protocol: "http:" },
        localStorage: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
        },
      });

      const validReport = {
        comment: "<script>bad()</script>Die Schlaggrenze im Norden prüfen",
        category: "map_field" as const,
        page_url: "http://localhost:3000/feld/neu",
        route_path: "/feld/neu",
        viewport: "1440x900",
        pin_x_pct: 42.5,
        pin_y_pct: 61.2,
        screenshot_data_url:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8efPmfQYACTgF2f6k5AAAAABJRU5ErkJggg==",
        context_json: { field_id: "f-hinteracker" },
      };

      const cleaned = sanitizeBugReportPayload(validReport);
      expect(cleaned?.comment).toBe("Die Schlaggrenze im Norden prüfen");
      expect(cleaned?.pin_x_pct).toBe(42.5);
      expect(cleaned?.pin_y_pct).toBe(61.2);

      // 1. Online submission succeeds
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            saved: true,
            bug_id: "bug_20261113_001",
            vault_md_path: "operations/bug_reports/bug_20261113_001.md",
          }),
          { status: 200 },
        ),
      );
      const resOnline = await submitBugReport(validReport);
      expect(resOnline.saved).toBe(true);
      expect(resOnline.bug_id).toBe("bug_20261113_001");
      expect(resOnline.vault_md_path).toContain("operations/bug_reports");

      // 2. Offline submission queues into seedle.pending_bug_reports (capped at 15)
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Offline"));
      const resOffline = await submitBugReport(validReport);
      expect(resOffline.saved).toBe(false);
      expect(store[PENDING_BUG_REPORTS_STORAGE_KEY]).toBeDefined();
      expect(getPendingBugReports()).toHaveLength(1);
      expect(MAX_PENDING_BUG_REPORTS).toBe(15);

      // 3. Flush replays queued report to backend
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true }), { status: 200 }),
      );
      const flushedBugs = await flushPendingBugReports();
      expect(flushedBugs).toBe(1);
      expect(getPendingBugReports()).toHaveLength(0);
    });
  });
});
