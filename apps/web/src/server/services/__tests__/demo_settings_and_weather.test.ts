import { describe, expect, it, beforeEach } from "vitest";
import { growthStage, FreisingDwdWeatherProvider } from "@seedle/core";
import { DEMO_STANDARD, UMWELT_PRESETS, type DemoEinstellungen } from "@/lib/demo";
import { demoEinstellungen, speichereDemoEinstellungen } from "../../demo";
import { providers } from "../../providers";
import { seedPeterMuellerDemoData } from "../demo-state";
import { listFields } from "../fields";
import { heuteIso, todayView } from "../season";

describe("Demo Settings & DWD Weather Integration (Weihenstephan)", () => {
  beforeEach(async () => {
    // Reset demo settings to baseline standard
    await speichereDemoEinstellungen(DEMO_STANDARD);
    await seedPeterMuellerDemoData();
  });

  describe("1. Demo settings configuration and persistence", () => {
    it("loads defined default state by default (cream brand, saatgutKauf off, spross off, stoebern off, anmeldung off, date 2025-07-15)", async () => {
      const demo = await demoEinstellungen();
      expect(demo.marke).toBe("cream");
      expect(demo.saatgutKauf).toBe(false);
      expect(demo.spross).toBe(false);
      expect(demo.teamAnruf).toBe(true);
      expect(demo.stoebern).toBe(false);
      expect(demo.anmeldung).toBe(false);
      expect(demo.showBackendStatusBadge).toBe(true);
      expect(demo.datum).toBe("2025-07-15");
    });

    it("persists and reads modified settings (brand, feature toggles, date)", async () => {
      const updated: DemoEinstellungen = {
        marke: "sortenkompass",
        saatgutKauf: false,
        spross: false,
        teamAnruf: true,
        stoebern: true,
        anmeldung: true,
        showBackendStatusBadge: false,
        datum: "2025-05-20",
        authModus: "auth0",
      };
      await speichereDemoEinstellungen(updated);

      const demo = await demoEinstellungen();
      expect(demo.marke).toBe("sortenkompass");
      expect(demo.saatgutKauf).toBe(false);
      expect(demo.spross).toBe(false);
      expect(demo.teamAnruf).toBe(true);
      expect(demo.stoebern).toBe(true);
      expect(demo.anmeldung).toBe(true);
      expect(demo.showBackendStatusBadge).toBe(false);
      expect(demo.datum).toBe("2025-05-20");
      expect(demo.authModus).toBe("auth0");
    });

    it("heuteIso() adopts simulated reference date configured in demo settings", async () => {
      await speichereDemoEinstellungen({
        ...DEMO_STANDARD,
        datum: "2025-09-10",
      });

      const iso = await heuteIso();
      expect(iso).toBe("2025-09-10");
    });
  });

  describe("2. Environmental presets & BBCH phenology progression", () => {
    it("generates expected BBCH growth stages across all 5 environmental presets", () => {
      const aussaat = "2025-04-25";

      // 1. Sowing April 25
      const stageAussaat = growthStage(aussaat, "2025-04-25");
      expect(stageAussaat.tageSeitAussaat).toBe(0);
      expect(stageAussaat.bbch).toBeLessThanOrEqual(5);

      // 2. 4-leaf stage May 20
      const stageVierBlatt = growthStage(aussaat, "2025-05-20");
      expect(stageVierBlatt.tageSeitAussaat).toBe(25);
      expect(stageVierBlatt.bbch).toBe(14);
      expect(stageVierBlatt.name).toBe("4-Blatt-Stadium");

      // 3. Flowering July 15
      const stageBluete = growthStage(aussaat, "2025-07-15");
      expect(stageBluete.tageSeitAussaat).toBe(81);
      expect(stageBluete.bbch).toBe(65);
      expect(stageBluete.name).toBe("Blüte");

      // 4. Dough stage September 10
      const stageTeigreife = growthStage(aussaat, "2025-09-10");
      expect(stageTeigreife.tageSeitAussaat).toBe(138);
      expect(stageTeigreife.bbch).toBe(85);
      expect(stageTeigreife.name).toBe("Teigreife");

      // 5. Harvest October 5
      const stageErnte = growthStage(aussaat, "2025-10-05");
      expect(stageErnte.tageSeitAussaat).toBe(163);
      expect(stageErnte.bbch).toBe(99);
      expect(stageErnte.name).toBe("Erntereif");
    });

    it("registers all 5 presets in UMWELT_PRESETS registry", () => {
      expect(UMWELT_PRESETS.length).toBe(5);
      const ids = UMWELT_PRESETS.map((p) => p.id);
      expect(ids).toEqual(["aussaat", "vierblatt", "bluete", "teigreife", "ernte"]);
    });
  });

  describe("3. DWD Freising weather observations & WeatherProvider integration", () => {
    it("providers().weather returns real DWD weather records via WeatherProvider interface", () => {
      const weatherProvider = providers().weather;
      expect(weatherProvider).toBeInstanceOf(FreisingDwdWeatherProvider);

      const forecast = weatherProvider.forecast(
        { lat: 48.403, lon: 11.7289 },
        "2025-07-15",
        7,
      );
      expect(forecast.length).toBe(7);
      expect(forecast[0]?.datum).toBe("2025-07-15");
      expect(forecast[0]?.tMaxC).toBe(26.2);
      expect(forecast[0]?.tMinC).toBe(16.1);
    });

    it("todayView reflects configured demo date and computes BBCH phenology plus DWD forecast", async () => {
      // Set demo date to flowering stage on July 15, 2025
      await speichereDemoEinstellungen({
        ...DEMO_STANDARD,
        datum: "2025-07-15",
      });

      const fields = await listFields("usr_demo_landwirt");
      const voettingField = fields.find((f) => f.id === "fld_demo_voetting");
      expect(voettingField).toBeDefined();

      const view = await todayView(voettingField!);
      expect(view).not.toBeNull();
      expect(view?.heute).toBe("2025-07-15");
      expect(view?.stadium.bbch).toBe(65);
      expect(view?.stadium.name).toBe("Blüte");
      expect(view?.wetter.length).toBe(7);
      expect(view?.wetter[0]?.datum).toBe("2025-07-15");
      expect(view?.wetter[0]?.tMaxC).toBe(26.2);
    });

    it("todayView updates BBCH phenology and weather forecast immediately upon demo date switch", async () => {
      // Switch to harvest date on October 5, 2025
      await speichereDemoEinstellungen({
        ...DEMO_STANDARD,
        datum: "2025-10-05",
      });

      const fields = await listFields("usr_demo_landwirt");
      const voettingField = fields.find((f) => f.id === "fld_demo_voetting");
      const view = await todayView(voettingField!);

      expect(view?.heute).toBe("2025-10-05");
      expect(view?.stadium.bbch).toBe(99);
      expect(view?.stadium.name).toBe("Erntereif");
      expect(view?.wetter[0]?.datum).toBe("2025-10-05");
      expect(view?.wetter[0]?.tMaxC).toBe(14.7);
    });
  });
});
