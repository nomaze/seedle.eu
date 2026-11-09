import { describe, expect, it, beforeAll } from "vitest";
import { getDb, schema } from "../../db/client";
import { getFarm, getOrCreateFarm, updateFarm } from "../farms";
import {
  createField,
  deleteField,
  deleteFieldYear,
  getField,
  getFieldWithYears,
  getFieldYear,
  listFields,
  listFieldsForFarm,
  listFieldYears,
  renameField,
  setFieldYear,
  updateField,
} from "../fields";

const TEST_USER_ID = "usr_test_farmer_1";
const OTHER_USER_ID = "usr_test_farmer_2";

describe("Farmstead & Parcel Cultivation Service (Farm, Fields, Yearly Cultivation)", () => {
  beforeAll(async () => {
    const db = await getDb();
    // Seed isolated test users
    await db
      .insert(schema.users)
      .values([
        { id: TEST_USER_ID, email: "bauer.1@example.de" },
        { id: OTHER_USER_ID, email: "bauer.2@example.de" },
      ])
      .onConflictDoNothing();
  });

  describe("1. Farmstead (Farm)", () => {
    it("automatically creates a default farmstead for a new user", async () => {
      const farm = await getOrCreateFarm(TEST_USER_ID);
      expect(farm).toBeDefined();
      expect(farm.userId).toBe(TEST_USER_ID);
      expect(farm.name).toBe("Mein Hof");
      expect(farm.id.startsWith("frm_")).toBe(true);

      const found = await getFarm(TEST_USER_ID);
      expect(found?.id).toBe(farm.id);
    });

    it("updates farm address and coordinates via postal code lookup", async () => {
      const updated = await updateFarm(TEST_USER_ID, {
        name: "Biohof Sonnenschein",
        strasse: "Feldweg 5",
        plz: "39104", // Magdeburg
        ort: "Magdeburg",
      });

      expect(updated.name).toBe("Biohof Sonnenschein");
      expect(updated.strasse).toBe("Feldweg 5");
      expect(updated.plz).toBe("39104");
      expect(updated.ort).toBe("Magdeburg");
      expect(updated.lat).toBeGreaterThan(50);
      expect(updated.lon).toBeGreaterThan(10);
    });
  });

  describe("2. Field Parcels (Fields) - CRUD Operations", () => {
    let createdFieldId: string;

    it("creates field parcel (createField) with automatic farm association and status indicator", async () => {
      const farm = await getOrCreateFarm(TEST_USER_ID);

      const field = await createField(TEST_USER_ID, {
        name: "Nordacker",
        point: { lat: 52.13, lon: 11.62 },
        crop: "mais",
        usage: "silomais",
      });

      expect(field).toBeDefined();
      expect(field.id.startsWith("fld_")).toBe(true);
      expect(field.name).toBe("Nordacker");
      expect(field.userId).toBe(TEST_USER_ID);
      expect(field.farmId).toBe(farm.id);
      expect(field.status).toBe("status-ok");
      expect(field.areaHa).toBeGreaterThan(0);
      expect(field.geometry.type).toBe("Polygon");
      expect(field.env.region).toBeDefined();

      createdFieldId = field.id;
    });

    it("retrieves field parcel via getField and listFields with backward compatibility", async () => {
      const field = await getField(TEST_USER_ID, createdFieldId);
      expect(field).not.toBeNull();
      expect(field?.id).toBe(createdFieldId);
      expect(field?.name).toBe("Nordacker");

      const fields = await listFields(TEST_USER_ID);
      expect(fields.some((f) => f.id === createdFieldId)).toBe(true);

      const farm = await getOrCreateFarm(TEST_USER_ID);
      const farmFields = await listFieldsForFarm(farm.id);
      expect(farmFields.some((f) => f.id === createdFieldId)).toBe(true);
    });

    it("renames a field parcel (renameField)", async () => {
      const renamed = await renameField(TEST_USER_ID, createdFieldId, "Nordacker Am Wald");
      expect(renamed).not.toBeNull();
      expect(renamed?.name).toBe("Nordacker Am Wald");

      const check = await getField(TEST_USER_ID, createdFieldId);
      expect(check?.name).toBe("Nordacker Am Wald");
    });

    it("ignores whitespace-only empty names during renameField", async () => {
      const ignored = await renameField(TEST_USER_ID, createdFieldId, "   ");
      expect(ignored).toBeNull();
      const check = await getField(TEST_USER_ID, createdFieldId);
      expect(check?.name).toBe("Nordacker Am Wald");
    });

    it("updates field status indicator (updateField)", async () => {
      const updated = await updateField(TEST_USER_ID, createdFieldId, {
        status: "status-problem",
      });
      expect(updated?.status).toBe("status-problem");
    });

    it("enforces tenant boundary by preventing unauthorized access to other farmers' fields", async () => {
      const unauthorized = await getField(OTHER_USER_ID, createdFieldId);
      expect(unauthorized).toBeNull();

      const renameAttempt = await renameField(OTHER_USER_ID, createdFieldId, "Hacked");
      expect(renameAttempt).toBeNull();

      const deleteAttempt = await deleteField(OTHER_USER_ID, createdFieldId);
      expect(deleteAttempt).toBe(false);
    });

    it("deletes field parcel (deleteField) along with dependent records", async () => {
      const deleted = await deleteField(TEST_USER_ID, createdFieldId);
      expect(deleted).toBe(true);

      const check = await getField(TEST_USER_ID, createdFieldId);
      expect(check).toBeNull();

      // Second deletion returns false
      const again = await deleteField(TEST_USER_ID, createdFieldId);
      expect(again).toBe(false);
    });

    it("recovers gracefully from non-existent farmId by falling back to user's default farm", async () => {
      const userFarm = await getOrCreateFarm(TEST_USER_ID);
      const field = await createField(TEST_USER_ID, {
        name: "Field with invalid farmId",
        point: { lat: 48.4, lon: 11.7 },
        farmId: "frm_non_existent_12345",
      });

      expect(field).toBeDefined();
      expect(field.farmId).toBe(userFarm.id);
      await deleteField(TEST_USER_ID, field.id);
    });

    it("throws a clear error on invalid NaN coordinates", async () => {
      await expect(
        createField(TEST_USER_ID, {
          name: "Corrupt coordinates",
          point: { lat: NaN, lon: 11.7 },
        })
      ).rejects.toThrow("Ungültige Koordinaten für das Feld.");
    });
  });

  describe("3. Cultivation planning per field and season (fieldYears)", () => {
    let fieldId: string;

    beforeAll(async () => {
      const f = await createField(TEST_USER_ID, {
        name: "Südfeld",
        point: { lat: 52.14, lon: 11.63 },
        crop: "mais",
        usage: "koernermais",
      });
      fieldId = f.id;
    });

    it("creates initial yearly cultivation record upon field parcel creation", async () => {
      const years = await listFieldYears(fieldId);
      expect(years.length).toBeGreaterThanOrEqual(1);

      const plan2027 = years.find((y) => y.jahr === 2027);
      expect(plan2027).toBeDefined();
      expect(plan2027?.crop).toBe("mais");
      expect(plan2027?.usage).toBe("koernermais");
      expect(plan2027?.status).toBe("geplant");
    });

    it("schedules cultivation for subsequent years and updates status (setFieldYear)", async () => {
      // Update 2027 to 'gewaehlt'
      const y2027 = await setFieldYear(fieldId, 2027, {
        varietyId: "var_p8834",
        varietyText: "P8834",
        status: "gewaehlt",
      });
      expect(y2027.status).toBe("gewaehlt");
      expect(y2027.varietyId).toBe("var_p8834");

      // Set 2027 to 'gekauft'
      const y2027Purchased = await setFieldYear(fieldId, 2027, {
        status: "gekauft",
      });
      expect(y2027Purchased.status).toBe("gekauft");

      // Schedule subsequent year 2028
      const y2028 = await setFieldYear(fieldId, 2028, {
        crop: "mais",
        usage: "silomais",
        status: "geplant",
      });
      expect(y2028.jahr).toBe(2028);
      expect(y2028.crop).toBe("mais");
      expect(y2028.status).toBe("geplant");

      const all = await listFieldYears(fieldId);
      expect(all.length).toBe(2);
      expect(all[0].jahr).toBe(2028); // Descending order
      expect(all[1].jahr).toBe(2027);
    });

    it("retrieves parcel along with all cultivation years via getFieldWithYears", async () => {
      const res = await getFieldWithYears(TEST_USER_ID, fieldId);
      expect(res).not.toBeNull();
      expect(res?.field.id).toBe(fieldId);
      expect(res?.years.length).toBe(2);
    });

    it("deletes a specified cultivation year (deleteFieldYear)", async () => {
      const ok = await deleteFieldYear(fieldId, 2028);
      expect(ok).toBe(true);

      const check = await getFieldYear(fieldId, 2028);
      expect(check).toBeNull();

      const remaining = await listFieldYears(fieldId);
      expect(remaining.length).toBe(1);
      expect(remaining[0].jahr).toBe(2027);
    });
  });
});
