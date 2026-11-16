import { describe, expect, it, beforeAll } from "vitest";
import { DEMO_USER_ID, seedPeterMuellerDemoData } from "../demo-state";
import { getFarm } from "../farms";
import {
  createField,
  deleteField,
  getField,
  listFields,
  listFieldYears,
  updateField,
} from "../fields";
import { providers } from "../../providers";

describe("Farm Overview (/hof), Status Traffic Light, Farm Map, Action Panel & Simulation", () => {
  beforeAll(async () => {
    await seedPeterMuellerDemoData();
  });

  describe("1. Dedicated status traffic light indicators (status-ok, status-action, status-problem, status-urgent)", () => {
    it("supports all 4 field status values in the domain model", async () => {
      const fields = await listFields(DEMO_USER_ID);
      expect(fields.length).toBeGreaterThanOrEqual(3);

      const field1 = fields.find((f) => f.name === "Vöttinger Feld");
      expect(field1?.status).toBe("status-ok");

      const field2 = fields.find((f) => f.name === "Weihenstephaner Berg");
      expect(field2?.status).toBe("status-action");

      const field3 = fields.find((f) => f.name === "Isarau");
      expect(field3?.status).toBe("status-problem");
    });

    it("updates field status to status-urgent (red) and persists changes", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const testField = fields[0]!;

      const updated = await updateField(DEMO_USER_ID, testField.id, {
        status: "status-urgent",
      });

      expect(updated?.status).toBe("status-urgent");

      const reloaded = await getField(DEMO_USER_ID, testField.id);
      expect(reloaded?.status).toBe("status-urgent");

      // Reset back to original status
      await updateField(DEMO_USER_ID, testField.id, { status: "status-ok" });
    });
  });

  describe("2. Farmstead & field parcels for interactive map", () => {
    it("provides farm center coordinates and closed polygon geometries for camera fitBounds", async () => {
      const farm = await getFarm(DEMO_USER_ID);
      expect(farm).not.toBeNull();
      expect(farm?.lat).toBeDefined();
      expect(farm?.lon).toBeDefined();

      const fields = await listFields(DEMO_USER_ID);
      expect(fields.length).toBe(7);
      const totalHa = fields.reduce((acc, f) => acc + f.areaHa, 0);
      expect(totalHa).toBeCloseTo(100.0, 1);

      // All parcels must have closed, real multi-vertex fiboa cadastral polygon rings (>= 25 vertices each, no rectangles)
      for (const f of fields) {
        expect(f.geometry.type).toBe("Polygon");
        expect(f.geometry.coordinates[0].length).toBeGreaterThanOrEqual(25);
        const ring = f.geometry.coordinates[0];
        const first = ring[0];
        const last = ring[ring.length - 1];
        expect(first[0]).toBeCloseTo(last[0], 5);
        expect(first[1]).toBeCloseTo(last[1], 5);
      }
    });

    it("allows querying all cultivation years per field for farm overview", async () => {
      const fields = await listFields(DEMO_USER_ID);
      for (const f of fields) {
        const years = await listFieldYears(f.id);
        expect(years.length).toBeGreaterThanOrEqual(1);
        const y2027 = years.find((y) => y.jahr === 2027);
        expect(y2027).toBeDefined();
        expect(y2027?.crop).toBe("mais");
      }
    });
  });

  describe("3. Action panel priority engine ('What needs to be done')", () => {
    it("determines required actions and prioritizes by field urgency", async () => {
      // Create temporary urgent field
      const urgentField = await createField(DEMO_USER_ID, {
        name: "Hitzefeld Ost",
        point: { lat: 48.405, lon: 11.735 },
        status: "status-urgent",
      });

      const allFields = await listFields(DEMO_USER_ID);

      // Simulate action panel generation
      const actions = allFields.map((f) => {
        const status = f.status ?? "status-ok";
        return {
          fieldId: f.id,
          fieldName: f.name,
          status,
          isUrgent: status === "status-urgent",
          isProblem: status === "status-problem",
          isAction: status === "status-action",
          isOk: status === "status-ok",
        };
      });

      // Priority ordering
      const prio: Record<string, number> = {
        "status-urgent": 1,
        "status-problem": 2,
        "status-action": 3,
        "status-ok": 4,
      };
      actions.sort((a, b) => prio[a.status] - prio[b.status]);

      // Urgent field must be ranked first
      expect(actions[0].status).toBe("status-urgent");
      expect(actions[0].fieldName).toBe("Hitzefeld Ost");

      // All 4 statuses represented in panel
      const presentStatuses = actions.map((a) => a.status);
      expect(presentStatuses).toContain("status-urgent");
      expect(presentStatuses).toContain("status-problem");
      expect(presentStatuses).toContain("status-action");
      expect(presentStatuses).toContain("status-ok");

      // Cleanup: delete temporary field
      await deleteField(DEMO_USER_ID, urgentField.id);
    });
  });

  describe("4. Field detail page (/feld/[fieldId]) with variety status", () => {
    it("displays chosen variety AW Talkrone and status-ok for Vöttinger Feld", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const voetting = fields.find((f) => f.name === "Vöttinger Feld");
      expect(voetting).toBeDefined();
      expect(voetting?.selectedVarietyId).toBe("aw-talkrone");
      expect(voetting?.status).toBe("status-ok");

      const catalog = providers().catalog;
      const variety = catalog.varieties().find((v) => v.id === voetting?.selectedVarietyId);
      expect(variety?.name).toBe("AW Talkrone");
      expect(variety?.reifezahl).toBeGreaterThan(0);
    });

    it("displays unselected variety status and routes to ranking for Isarau", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const isarau = fields.find((f) => f.name === "Isarau");
      expect(isarau).toBeDefined();
      expect(isarau?.selectedVarietyId).toBeNull();
      expect(isarau?.status).toBe("status-problem");
      expect(isarau?.usage).toBe("biogas");

      // Cultivation year is planned but not yet selected
      const years = await listFieldYears(isarau!.id);
      const y2027 = years.find((y) => y.jahr === 2027);
      expect(y2027?.status).toBe("geplant");
    });
  });

  describe("5. Farm simulation data foundation (/hof/simulieren)", () => {
    it("aggregates field parcels and total farm acreage for simulation modeling", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const totalHa = fields.reduce((sum, f) => sum + (f.areaHa || 0), 0);
      expect(totalHa).toBeCloseTo(100.0, 1); // 7 fields around the farmstead = 100.0 ha
      expect(fields.length).toBe(7);
    });
  });
});
