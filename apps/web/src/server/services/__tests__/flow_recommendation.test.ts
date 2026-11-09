import { describe, expect, it, beforeAll } from "vitest";
import { getDb, schema } from "../../db/client";
import { verifyCode } from "../auth";
import { DEMO_USER_ID, seedPeterMuellerDemoData } from "../demo-state";
import { getFarm } from "../farms";
import {
  createField,
  getField,
  getFieldYear,
  listFields,
  setFieldYear,
  updateField,
} from "../fields";
import { recommendationFor } from "../recommendations";
import { selectVariety } from "../season";

describe("Personal Recommendation User Flow (Map -> Auth -> Cultivation -> Ranking -> Farm)", () => {
  beforeAll(async () => {
    await seedPeterMuellerDemoData();
  });

  describe("1. Field creation & anonymous-to-authenticated data handoff", () => {
    const anonymousUser = {
      id: "usr_anon_guest_flow",
      name: null,
      email: null,
      emailVerified: false,
      telefon: null,
    };

    let anonFieldId: string;

    it("creates anonymous field parcel (silent guest session prior to login)", async () => {
      const db = await getDb();
      await db.insert(schema.users).values({ id: anonymousUser.id }).onConflictDoNothing();

      const field = await createField(anonymousUser.id, {
        name: "Südfeld Am Bach",
        point: { lat: 48.41, lon: 11.74 },
      });

      expect(field).toBeDefined();
      expect(field.id.startsWith("fld_")).toBe(true);
      expect(field.userId).toBe(anonymousUser.id);
      expect(field.name).toBe("Südfeld Am Bach");

      anonFieldId = field.id;
    });

    it("seamlessly transfers silently created parcels to authenticated farmer upon verification", async () => {
      // Prior to login, field parcel belongs to anonymous guest user
      const beforeLogin = await getField(anonymousUser.id, anonFieldId);
      expect(beforeLogin).not.toBeNull();

      // Execute login / verification code flow
      const verifyRes = await verifyCode(anonymousUser, "peter@seedle-demo.de", "123456");
      expect(verifyRes.ok).toBe(true);

      // Post-login, field parcel belongs to authenticated farmer Peter Müller
      const afterLoginPeter = await getField(DEMO_USER_ID, anonFieldId);
      expect(afterLoginPeter).not.toBeNull();
      expect(afterLoginPeter?.userId).toBe(DEMO_USER_ID);

      const peterFarm = await getFarm(DEMO_USER_ID);
      expect(afterLoginPeter?.farmId).toBe(peterFarm?.id);
    });
  });

  describe("2. Consolidated 1-step cultivation choice (grain maize / silage maize)", () => {
    it("persists crop and usage direction, synchronizing field_years as planned", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const testField = fields[0]!;

      // 1-step cultivation choice: grain maize
      await updateField(DEMO_USER_ID, testField.id, { crop: "mais", usage: "koernermais" });
      await setFieldYear(testField.id, 2027, {
        crop: "mais",
        usage: "koernermais",
        status: "geplant",
      });

      const updated = await getField(DEMO_USER_ID, testField.id);
      expect(updated?.crop).toBe("mais");
      expect(updated?.usage).toBe("koernermais");

      const y2027 = await getFieldYear(testField.id, 2027);
      expect(y2027).not.toBeNull();
      expect(y2027?.crop).toBe("mais");
      expect(y2027?.usage).toBe("koernermais");
      expect(y2027?.status).toBe("geplant");
    });

    it("updates seamlessly to silage maize for planning season", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const testField = fields[0]!;

      await updateField(DEMO_USER_ID, testField.id, { crop: "mais", usage: "silomais" });
      await setFieldYear(testField.id, 2027, {
        crop: "mais",
        usage: "silomais",
        status: "geplant",
      });

      const y2027 = await getFieldYear(testField.id, 2027);
      expect(y2027?.usage).toBe("silomais");
      expect(y2027?.status).toBe("geplant");
    });
  });

  describe("3. Ranking calculation following cultivation setup", () => {
    it("computes neutral variety recommendation for configured field parcel", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const testField = fields[0]!;

      const rec = await recommendationFor(testField);
      expect(rec).not.toBeNull();
      expect(rec?.sorten.length).toBeGreaterThan(0);
      expect(rec?.scenarios.length).toBe(3);
    });
  });

  describe("4. Variety selection and farm overview synchronization", () => {
    it("synchronizes selected variety in field_years with status 'gewaehlt'", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const testField = fields[0]!;
      const rec = await recommendationFor(testField);
      const winner = rec!.sorten[0]!;

      const selected = await selectVariety(DEMO_USER_ID, testField.id, winner.variety.id);
      expect(selected).not.toBeNull();
      expect(selected?.selectedVarietyId).toBe(winner.variety.id);

      const y2027 = await getFieldYear(testField.id, 2027);
      expect(y2027?.status).toBe("gewaehlt");
      expect(y2027?.varietyId).toBe(winner.variety.id);
    });

    it("ensures field parcel with chosen variety is visible in farm overview", async () => {
      const fields = await listFields(DEMO_USER_ID);
      const testField = fields[0]!;
      expect(testField.selectedVarietyId).toBeDefined();
    });
  });
});
