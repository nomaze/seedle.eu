/** @vitest-environment jsdom */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepAnalysisBackendBridge } from "@/components/daten/DeepAnalysisBackendBridge";
import {
  findBackendCandidateForVariety,
  formatSeedingRecommendation,
} from "@/components/daten/FieldRankingView";
import { unwrapVarietyDetailPayload } from "@/components/daten/VarietySteckbriefModal";
import { WhereToBuyModal } from "@/components/daten/WhereToBuyModal";
import { collectLocalFieldContext } from "@/components/shell/BugReportWidget";
import {
  checkBackendHealth,
  computeDeterministicBugId,
  computeDeterministicIntakeId,
  fetchRealFieldBoundaryAtPoint,
  fetchVarietyDeepAnalysisFromBackend,
  fetchVarietySuppliersFromBackend,
  flushPendingBugReports,
  flushPendingFieldIntakes,
  getPendingBugReports,
  getPendingFieldIntakes,
  normalizePolygonRing,
  PENDING_BUG_REPORTS_STORAGE_KEY,
  submitBugReport,
  submitFieldIntake,
} from "@/lib/backendClient";
import {
  fetchFieldWeatherHistory10Y,
  fetchLiveFieldIntelligence,
} from "@/lib/fieldWeatherHistory";
import { eur, int, num, signed, signedEur } from "@/lib/format";

function createMockLocalStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    storage: {
      get length() {
        return Object.keys(store).length;
      },
      key: (idx: number) => Object.keys(store)[idx] ?? null,
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) {
          delete store[k];
        }
      },
    },
  };
}

describe("Dual-Mode Online/Offline Contract & Crash-Resilience Suite", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("0. Defensive Number Formatting (format.ts)", () => {
    it("never throws on undefined, null, or NaN inputs in num(), int(), eur(), signed(), and signedEur()", () => {
      expect(num(undefined)).toBe("0");
      expect(num(null)).toBe("0");
      expect(num(Number.NaN)).toBe("0");
      expect(num(104.26, 1)).toBe("104,3");

      expect(int(undefined)).toBe("0");
      expect(int(null)).toBe("0");
      expect(int(Number.NaN)).toBe("0");
      expect(int(1460.4)).toBe("1.460");

      expect(eur(undefined)).toBe("0 €");
      expect(signed(undefined)).toBe("+0");
      expect(signedEur(undefined)).toBe("+0 €");
    });
  });

  describe("1. Modus A — 100 % OHNE Backend (Offline / Connection Refused / Timeout)", () => {
    it("operates 100% crash-free when fetch throws TypeError: Failed to fetch", async () => {
      const { store, storage } = createMockLocalStorage();
      vi.stubGlobal("window", {
        location: {
          protocol: "http:",
          pathname: "/feld/f-hinteracker/ranking",
          search: "",
          href: "http://localhost:3000/feld/f-hinteracker/ranking",
        },
        localStorage: storage,
      });

      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new TypeError("Failed to fetch: ECONNREFUSED 127.0.0.1:8010"),
      );

      // 1. checkBackendHealth returns isOnline: false
      const health = await checkBackendHealth();
      expect(health).toEqual({ isOnline: false });

      // 2. fetchLiveFieldIntelligence falls back cleanly to local calculation (source: "local-fallback")
      const intel = await fetchLiveFieldIntelligence(48.4028, 11.7489, {
        soilType: "sandiger_lehm",
        usage: "silomais",
        areaHa: 14.5,
      });
      expect(intel.source).toBe("local-fallback");
      expect(intel.weatherHistory10y.source).toBe("local-fallback");
      expect(intel.weatherHistory10y.years).toHaveLength(10);
      expect(intel.siteCharacter.traits).toHaveLength(4);
      expect(intel.climateOutlookNextYear.models).toHaveLength(5);

      for (const yr of intel.weatherHistory10y.years) {
        expect(Number.isFinite(yr.precipTotalMm)).toBe(true);
        expect(Number.isFinite(yr.tempMeanC)).toBe(true);
        expect(Number.isFinite(yr.growingDegreeDays)).toBe(true);
        expect(() => yr.precipTotalMm.toLocaleString("de-DE")).not.toThrow();
        expect(() => num(yr.tempMeanC, 1)).not.toThrow();
      }
      for (const tr of intel.siteCharacter.traits) {
        expect(typeof tr.statusLabel).toBe("string");
        expect(tr.statusLabel.length).toBeGreaterThan(0);
        expect(typeof tr.metricValue).toBe("string");
        expect(typeof tr.farmerAdvice).toBe("string");
      }
      for (const m of intel.climateOutlookNextYear.models) {
        expect(typeof m.modelId).toBe("string");
        expect(typeof m.modelName).toBe("string");
        expect(Number.isFinite(m.tempDeltaC)).toBe(true);
        expect(Number.isFinite(m.summerPrecipTrendPct)).toBe(true);
        expect(() => num(m.tempDeltaC, 1)).not.toThrow();
      }

      // 3. submitFieldIntake & submitBugReport queue losslessly with deterministic IDs and deduplicate
      const sampleIntake = {
        field_id: "f-hinteracker",
        area_ha: 14.5,
        lat: 48.4028,
        lon: 11.7489,
        soil_type: "sandiger_lehm",
        crop: "mais",
        usage: "silomais",
        stage: "field_selected" as const,
      };
      const expectedIntakeId = computeDeterministicIntakeId(sampleIntake);
      const sent1 = await submitFieldIntake(sampleIntake);
      const sent2 = await submitFieldIntake(sampleIntake); // duplicate while offline
      expect(sent1).toBe(false);
      expect(sent2).toBe(false);

      const queuedIntakes = getPendingFieldIntakes();
      expect(queuedIntakes).toHaveLength(1);
      expect(queuedIntakes[0]?.intake_id).toBe(expectedIntakeId);

      const sampleBug = {
        comment: "Offline Bug-Meldung im Feldmodus",
        category: "map_field" as const,
        page_url: "http://localhost:3000/feld/neu",
        route_path: "/feld/neu",
        viewport: "1280x800",
        pin_x_pct: 33.5,
        pin_y_pct: 61.2,
      };
      const expectedBugId = computeDeterministicBugId(sampleBug);
      const bugRes1 = await submitBugReport(sampleBug);
      const bugRes2 = await submitBugReport(sampleBug); // duplicate while offline
      expect(bugRes1.saved).toBe(false);
      expect(bugRes1.mode).toBe("local_queue");
      expect(bugRes1.bug_id).toBe(expectedBugId);
      expect(bugRes2.bug_id).toBe(expectedBugId);

      const queuedBugs = getPendingBugReports();
      expect(queuedBugs).toHaveLength(1);
      expect(queuedBugs[0]?.bug_id).toBe(expectedBugId);
      expect(store[PENDING_BUG_REPORTS_STORAGE_KEY]).toBeDefined();

      // 4. fetchRealFieldBoundaryAtPoint, fetchVarietySuppliersFromBackend, unwrapVarietyDetailPayload work offline without crashing
      const boundaryOffline = await fetchRealFieldBoundaryAtPoint(48.4028, 11.7489);
      expect(boundaryOffline).toEqual({ matched: null, neighbors: [] });

      const suppliersOffline = await fetchVarietySuppliersFromBackend("85354", "aw-talkrone");
      expect(suppliersOffline).toBeNull();

      const unwrappedOffline = unwrapVarietyDetailPayload(null);
      expect(unwrappedOffline).toBeNull();

      const whereToBuyOfflineHtml = renderToStaticMarkup(
        React.createElement(WhereToBuyModal, {
          open: true,
          onClose: () => {},
          variety: { id: "aw-talkrone", name: "AW Talkrone", zuechter: "KWS", reifezahl: 240 },
          region: "Bayern",
          schlagName: "Hinteracker",
        }),
      );
      expect(whereToBuyOfflineHtml).toContain("RWA / Raiffeisen Waren-Agrar");
    });

    it("enforces GDPR Art. 5 data minimization in collectLocalFieldContext (only active field profile)", () => {
      const initialProfiles: Record<string, string> = {};
      for (let i = 1; i <= 15; i++) {
        initialProfiles[`seedle_agronomy_profile_v1_foreign-field-${i}`] = JSON.stringify({
          fieldId: `foreign-field-${i}`,
          soilType: "moor",
        });
      }
      initialProfiles["seedle_agronomy_profile_v1_f-hinteracker"] = JSON.stringify({
        fieldId: "f-hinteracker",
        soilType: "sandiger_lehm",
      });

      const { storage } = createMockLocalStorage(initialProfiles);
      vi.stubGlobal("window", {
        location: {
          protocol: "http:",
          pathname: "/feld/f-hinteracker/ranking",
        },
        localStorage: storage,
      });

      const ctx = collectLocalFieldContext("/feld/f-hinteracker/ranking");
      expect(ctx.active_field_id).toBe("f-hinteracker");
      const profiles = ctx.agronomy_profiles as Record<string, unknown> | undefined;
      expect(profiles).toBeDefined();
      expect(Object.keys(profiles!)).toEqual(["seedle_agronomy_profile_v1_f-hinteracker"]);
    });
  });

  describe("2. Modus B — 100 % MIT Backend (Exact Python seedle_backend v0.1 snake_case JSON Responses)", () => {
    it("maps snake_case field-intelligence payload losslessly into finite numbers and source: 'backend-live'", async () => {
      const backendFieldIntelligenceSnakeCase = {
        data_source_mode: "baseline_reference_dataset",
        field_id: "f-hinteracker",
        plz: "85354",
        region_code: "BY",
        lat: 48.4028,
        lon: 11.7489,
        area_ha: 14.5,
        elevation_m: 452,
        usage: "silomais",
        weather_10y: {
          avg_precip_total_mm: 748,
          avg_precip_veg_mm: 344,
          avg_precip_flowering_mm: 136,
          avg_effective_precip_veg_mm: 309,
          avg_temp_mean_c: 9.7,
          avg_temp_veg_mean_c: 16.6,
          avg_growing_degree_days: 1455,
          avg_hot_days_30c: 15,
          drought_years_count: 3,
          disease_pressure_hint:
            "Warmer Standort: Auf Maiszünsler und Kolbenfusarium achten.",
          years: Array.from({ length: 10 }, (_, idx) => ({
            year: 2016 + idx,
            precip_total_mm: 680 + idx * 12,
            summer_precip_mm: 310 + idx * 5,
            precip_flowering_mm: 120 + idx * 3,
            effective_precip_veg_mm: 285 + idx * 4,
            water_balance_mm: -75 + idx * 4,
            heavy_rain_days_25mm: 2,
            temp_mean_c: 9.4 + idx * 0.1,
            temp_veg_mean_c: 16.2 + idx * 0.1,
            temp_max_c: 32.5,
            july_heat_days: 6 + (idx % 4),
            late_frost_days_may: idx % 2 === 0 ? 2 : 0,
            gdd: 1410 + idx * 15,
            year_type: idx === 2 || idx === 6 ? "Trockenjahr" : "Ausgeglichen",
          })),
        },
        site_character: {
          headline: "Ausgeglichener Standort mit guter Wasserführung",
          primary_badge: "Ausgeglichener Gunststandort",
          summer_water_balance_mm: -58,
          july_heat_days_avg: 7,
          recommended_maturity_range: "Reifegruppe S 230 bis S 250",
          traits: [
            {
              id: "water_balance",
              label: "Wasserhaushalt und Trockenstress",
              status_label: "Ausgeglichener Wasserhaushalt",
              tone: "neutral",
              metric_value: "Sommerbilanz minus 58 mm · 3 Trockenjahre in 10 J.",
              farmer_advice: "Wähle ertragsstarke Sorten mit breiter Umweltstabilität.",
            },
            {
              id: "spring_cold",
              label: "Frühjahrserwärmung und Spätfrost",
              status_label: "Normale Frühjahrserwärmung",
              tone: "positive",
              metric_value: "Ø 1,8 Spätfrosttage Apr bis Mai · 1455 °Cd",
              farmer_advice: "Gute Jugendentwicklung sichert den Feldaufgang ab.",
            },
          ],
        },
        climate_outlook_next_year: {
          target_year: 2027,
          consensus_headline:
            "Standort-Risikokorridor (4 von 5 Modellen): Trend zu höheren Wärmesummen",
          consensus_advice:
            "Pflanzenbauliche Einordnung: Hauptsorte mit hoher Trockentoleranz wählen.",
          avg_temp_delta_c: 1.1,
          avg_summer_precip_trend_pct: -6,
          models: [
            {
              model_id: "dwd_gcfs",
              model_name: "DWD Deutschland",
              provider: "Deutscher Wetterdienst",
              temp_delta_c: 1.1,
              summer_precip_trend_pct: -7,
              drought_risk_level: "Mittel",
              season_summary: "Höhere Wärmesummen bei leicht reduziertem Sommerregen",
            },
            {
              model_id: "ecmwf_seas5",
              model_name: "ECMWF Europa",
              provider: "ECMWF",
              temp_delta_c: 1.3,
              summer_precip_trend_pct: -9,
              drought_risk_level: "Erhöht",
              season_summary: "Überdurchschnittliche Wärme im Juli",
            },
          ],
        },
      };

      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(backendFieldIntelligenceSnakeCase), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );

      const live = await fetchLiveFieldIntelligence(48.4028, 11.7489);
      expect(live.source).toBe("backend-live");
      expect(live.elevationM).toBe(452);
      expect(live.avgPrecipTotalMm).toBe(748);
      expect(live.avgGrowingDegreeDays).toBe(1455);

      const y0 = live.weatherHistory10y.years[0]!;
      expect(Number.isFinite(y0.precipTotalMm)).toBe(true);
      expect(y0.precipTotalMm).toBe(680);
      expect(y0.summerPrecipMm).toBe(310);
      expect(y0.waterBalanceMm).toBe(-75);
      expect(y0.tempMeanC).toBe(9.4);
      expect(y0.growingDegreeDays).toBe(1410);
      expect(y0.heatDaysGe30C).toBe(6);
      expect(y0.lateFrostMay).toBe(true);
      expect(y0.yearType).toBe("Ausgeglichen");

      const t0 = live.siteCharacter.traits[0]!;
      expect(t0.statusLabel).toBe("Ausgeglichener Wasserhaushalt");
      expect(t0.metricValue).toContain("Sommerbilanz minus 58 mm");
      expect(t0.farmerAdvice).toContain("Umweltstabilität");

      const m0 = live.climateOutlookNextYear.models[0]!;
      expect(m0.modelId).toBe("dwd_gcfs");
      expect(m0.modelName).toBe("DWD Deutschland");
      expect(m0.institution).toBe("Deutscher Wetterdienst");
      expect(m0.tempDeltaC).toBe(1.1);
      expect(m0.summerPrecipTrendPct).toBe(-7);
      expect(m0.droughtRiskLevel).toBe("Mittel");
      expect(m0.seasonSummary).toContain("Wärmesummen");

      const h10 = await fetchFieldWeatherHistory10Y(48.4028, 11.7489);
      expect(h10.source).toBe("backend-live");
    });

    it("parses snapped_parcel and surrounding_parcels with [lat, lng] coordinates into GeoJSON [lon, lat]", async () => {
      const backendParcelsPayload = {
        lat: 48.4028,
        lng: 11.7489,
        attribution: "Amtliches Feldblockkataster Bayern (InVeKoS)",
        snapped_parcel: {
          parcel_id: "BY-FLIK-001",
          flik: "DEBYLI084001",
          label: "Vöttinger Hauptschlag",
          area_ha: 14.5,
          land_use: "Ackerland",
          // [lat, lng] order where pt[0] > 45 && pt[1] < 20
          polygon: [
            [48.401, 11.746],
            [48.401, 11.751],
            [48.405, 11.751],
            [48.405, 11.746],
            [48.401, 11.746],
          ],
        },
        surrounding_parcels: [
          {
            parcel_id: "BY-FLIK-002",
            flik: "DEBYLI084002",
            label: "Nachbarschlag Nord",
            area_ha: 9.2,
            land_use: "Grünland",
            polygon: [
              [48.406, 11.746],
              [48.406, 11.751],
              [48.409, 11.751],
              [48.409, 11.746],
              [48.406, 11.746],
            ],
          },
        ],
      };

      const ring = normalizePolygonRing(backendParcelsPayload.snapped_parcel.polygon);
      expect(ring).not.toBeNull();
      // First coordinate must be [lon, lat] = [11.746, 48.401]
      expect(ring![0]![0]).toBeCloseTo(11.746, 4);
      expect(ring![0]![1]).toBeCloseTo(48.401, 4);

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(backendParcelsPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const boundary = await fetchRealFieldBoundaryAtPoint(48.4028, 11.7489);
      expect(boundary.matched).not.toBeNull();
      expect(boundary.matched?.id).toBe("BY-FLIK-001");
      expect(boundary.matched?.flik).toBe("DEBYLI084001");
      expect(boundary.matched?.areaHa).toBe(14.5);
      expect(boundary.matched?.polygon.coordinates[0]![0]).toEqual([11.746, 48.401]);
      expect(boundary.neighbors).toHaveLength(1);
      expect(boundary.neighbors[0]?.id).toBe("BY-FLIK-002");
      expect(boundary.neighbors[0]?.polygon.coordinates[0]![0]).toEqual([11.746, 48.406]);
    });

    it("unwraps backend Steckbrief payload (bsl_scores & regional_lsv) without crashing", () => {
      const backendSteckbriefFlat = {
        id: "aw-talkrone",
        sorte_id: 101,
        name: "AW Talkrone",
        breeder: "AckerWerk Genetik",
        fao_s: 240,
        fao_k: 240,
        grain_type: "Zahnmais-betont",
        hybrid_type: "Dreiweghybride",
        release_year: 2021,
        agronomic_summary: "Ertragsstarke Doppelnutzung mit synchronisierter Blüte.",
        bsl_scores: {
          jahr: 2025,
          kaelte: 8,
          lagerneigung: 2,
          stengelfaeule: 2,
          gesamttrockenmasse: 9,
          kornertrag: 8,
          staerkegehalt: 8,
          biogasertrag: 9,
          stay_green: 7,
        },
        regional_lsv: [
          {
            region: "BY",
            region_name: "Bayern",
            years: 4,
            locations: 18,
            rel_yield_pct: 105.4,
            last_year: 2025,
          },
        ],
      };

      const detail = unwrapVarietyDetailPayload(backendSteckbriefFlat, "aw-talkrone");
      expect(detail).not.toBeNull();
      expect(detail?.sorte.sorte).toBe("AW Talkrone");
      expect(detail?.bsl.latest?.kaelte).toBe(8);
      expect(detail?.bsl.latest?.gesamttrockenmasse).toBe(9);
      expect(detail?.trials.byRegion).toHaveLength(1);
      expect(detail?.trials.byRegion[0]?.avg_rel_ertrag).toBe(105.4);
      expect(detail?.trials.totalCount).toBe(18);
    });

    it("maps deep-analysis snake_case fields, WhereToBuy breeder_advisors, and FieldRankingView seeding object & foreign variety guard", async () => {
      let capturedBody: Record<string, unknown> | null = null;
      const backendDeepPayload = {
        variety_id: "aw-talkrone",
        variety_name: "AW Talkrone",
        fao: 240,
        advisor_rationale_text:
          "AW Talkrone liefert auf deinem Standort in 4 von 5 Jahren überdurchschnittliche Kolbenfüllung.",
        soil_and_cultivation_fit: {
          nitrogen_efficiency_text: "Hohe Ausnutzung organischer Güllegaben.",
          water_demand_text: "Sehr geringe Kolbenreduktion bei Julitrockenheit.",
          tillage_and_emergence_text: "Sicherer Auflauf bei Mulchsaat.",
        },
        hindcast_5y: {
          years_ahead_count: 4,
          total_years: 5,
          mean_advantage_pct: 4.2,
          years: [
            {
              year: 2023,
              year_type: "Feuchtes Jahr",
              variety_rel_yield_pct: 105.2,
              benchmark_rel_yield_pct: 100.0,
              delta_pct: 5.2,
              ahead: true,
            },
          ],
        },
        similar_lsv_sites: [
          {
            site_id: "LSV-BY-01",
            name: "Freising-Weihenstephan",
            region: "Bayern",
            distance_km: 6,
            soil_type: "Sandiger Lehm",
            similarity_pct: 96,
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
        capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return new Response(JSON.stringify(backendDeepPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      const deepRes = await fetchVarietyDeepAnalysisFromBackend({
        field_id: "f-hinteracker",
        variety_id: "aw-talkrone",
        variety_name: "AW Talkrone",
        lat: 48.4028,
        lon: 11.7489,
        soil_type: "sandiger_lehm",
        usage: "silomais",
        reifezahl: 240,
      });

      expect(capturedBody).not.toBeNull();
      expect(capturedBody!["reifezahl"]).toBe(240);
      expect(capturedBody!["fao"]).toBe(240);
      expect(deepRes?.advisor_rationale).toContain("AW Talkrone liefert");
      expect(deepRes?.soil_cultivation_fit?.n_efficiency_text).toBe(
        "Hohe Ausnutzung organischer Güllegaben.",
      );
      expect(deepRes?.soil_cultivation_fit?.water_drought_text).toBe(
        "Sehr geringe Kolbenreduktion bei Julitrockenheit.",
      );
      expect(deepRes?.soil_cultivation_fit?.tillage_emergence_text).toBe(
        "Sicherer Auflauf bei Mulchsaat.",
      );
      expect(deepRes?.similar_sites).toHaveLength(1);

      const bridgeHtml = renderToStaticMarkup(
        React.createElement(DeepAnalysisBackendBridge, {
          fieldId: "f-hinteracker",
          fieldLat: 48.4028,
          fieldLon: 11.7489,
          soilType: "Sandiger Lehm",
          usage: "silomais",
          varietyId: "aw-talkrone",
          varietyName: "AW Talkrone",
          reifezahl: 240,
          trockentoleranz: 8,
          jugendentwicklung: 8,
          kaeltetoleranz: 8,
          defaultAdvisorRationale: "Default Rationale",
          jahreVorne: 4,
          mittlererVorsprung: 4.2,
          jahre: [
            {
              jahr: 2023,
              jahrestyp: "Feuchtes Jahr",
              empfohlenModell: 105.2,
              vergleichModell: 100.0,
              anzahlVersuche: 15,
              einheit: "% Relativ-Index",
            },
          ],
          vergleichQuelle: "regionaler-standard",
          vergleichLabel: "LSV-Mittel",
          yieldUnitLabel: "t TM/ha Silomais",
        }),
      );
      expect(bridgeHtml).toContain("Default Rationale");

      // Contract-Fix #6: Seeding object & Foreign variety name protection
      const formattedSeeding = formatSeedingRecommendation(
        {
          recommended_kernels_m2: 8.4,
          seed_units_50k: 17,
          rationale: "Reduzierte Bestandesdichte wegen Sommertrockenheit",
        },
        10,
      );
      expect(formattedSeeding).toContain("8,4 Körner je m²");
      expect(formattedSeeding).toContain("ca. 17 Einheiten Saatgut");

      const mockLocalVariety = {
        rang: 1,
        erwarteterWertEurHa: 2450,
        schlechtesterWertEurHa: 2210,
        besterWertEurHa: 2680,
        abstandZurBestenEurHa: 0,
        saatgutkostenEurHa: 215,
        demodaten: false,
        businessCases: [],
        stabil: true,
        variety: {
          id: "aw-talkrone",
          name: "AW Talkrone",
          breederId: "b1",
          crop: "mais" as const,
          reifezahl: 240,
          zulassungsjahr: 2021,
          kurzbeschreibung: "",
          usages: ["silomais" as const],
          traits: {
            trockentoleranz: 8 as const,
            standfestigkeit: 8 as const,
            jugendentwicklung: 8 as const,
            kaeltetoleranz: 8 as const,
            staengelfaeule: 2 as const,
            blattkrankheiten: 2 as const,
          },
        },
        breeder: { id: "b1", name: "AckerWerk Genetik", logo: "/logo.svg", isPartner: true },
        predictions: [],
        rangJeSzenario: { normal: 1, "trocken-heiss": 1, "feucht-kuehl": 1 },
        gruende: [],
        datenbasis: [],
        belastbarkeit: "hoch" as const,
      };

      const matchedCand = findBackendCandidateForVariety(mockLocalVariety, 0, {
        lat: 48.4028,
        lon: 11.7489,
        portfolio: [
          {
            variety_id: "kws-inteligens",
            name: "KWS Inteligens",
            trial_years_count: 5,
            advisor_rationale:
              "KWS Inteligens überzeugt auf diesem Schlag durch höchste Trockentoleranz.",
          },
        ],
      });
      expect(matchedCand).not.toBeNull();
      expect(matchedCand?.variety_id).toBe("aw-talkrone");
      expect(matchedCand?.advisor_rationale).not.toContain("KWS Inteligens");
      expect(matchedCand?.advisor_rationale).toContain("AW Talkrone");
    });

    it("flushes offline queues with deterministic client IDs and discards 400/422 items without blocking", async () => {
      const { storage } = createMockLocalStorage();
      vi.stubGlobal("window", {
        location: { protocol: "http:" },
        localStorage: storage,
      });

      // Queue 2 intakes and 2 bug reports while offline
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

      await submitFieldIntake({
        field_id: "f-valid",
        area_ha: 12.0,
        lat: 48.4028,
        lon: 11.7489,
        stage: "field_selected",
      });
      await submitFieldIntake({
        field_id: "f-bad-422",
        area_ha: 15.0,
        lat: 48.41,
        lon: 11.75,
        stage: "crop_selected",
      });

      await submitBugReport({
        comment: "Valid queued bug report",
        category: "ui_design",
        page_url: "http://localhost:3000/",
        route_path: "/",
        viewport: "1280x800",
      });
      await submitBugReport({
        comment: "Rejected 422 bug report",
        category: "bug",
        page_url: "http://localhost:3000/",
        route_path: "/",
        viewport: "1280x800",
      });

      expect(getPendingFieldIntakes()).toHaveLength(2);
      expect(getPendingBugReports()).toHaveLength(2);

      const receivedIntakeIds: string[] = [];
      const receivedBugIds: string[] = [];

      // Reconnect: first item returns 200 OK, second item returns 422 Unprocessable Entity
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const urlStr = String(url);
        const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        if (urlStr.includes("/api/v1/mvp/field-intake")) {
          receivedIntakeIds.push(String(body.intake_id ?? ""));
          if (body.field_id === "f-bad-422") {
            return new Response(JSON.stringify({ error: "Validation error" }), { status: 422 });
          }
          return new Response(JSON.stringify({ intake_id: body.intake_id }), { status: 201 });
        }
        if (urlStr.includes("/api/v1/mvp/bug-reports")) {
          receivedBugIds.push(String(body.bug_id ?? ""));
          if (String(body.comment).includes("422")) {
            return new Response(JSON.stringify({ error: "Unprocessable" }), { status: 422 });
          }
          return new Response(JSON.stringify({ saved: true, bug_id: body.bug_id }), {
            status: 201,
          });
        }
        return new Response("OK", { status: 200 });
      });

      const flushedIntakes = await flushPendingFieldIntakes();
      const flushedBugs = await flushPendingBugReports();

      expect(flushedIntakes).toBe(1);
      expect(flushedBugs).toBe(1);
      expect(receivedIntakeIds.every((id) => id.startsWith("intake-"))).toBe(true);
      expect(receivedBugIds.every((id) => id.startsWith("local-bug-"))).toBe(true);

      // Both queues must now be completely empty (422 items were discarded, not kept in remaining)
      expect(getPendingFieldIntakes()).toHaveLength(0);
      expect(getPendingBugReports()).toHaveLength(0);
    });
  });
});
