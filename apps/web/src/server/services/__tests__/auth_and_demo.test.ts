import { describe, expect, it, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/client";
import { requestCode, verifyCode } from "../auth";
import {
  DEMO_FARM_CONFIG,
  DEMO_FARM_ID,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  DEMO_USER_NAME,
  seedPeterMuellerDemoData,
} from "../demo-state";
import { getFarm } from "../farms";
import { getField, listFields, listFieldYears } from "../fields";

describe("Passwordless Authentication & Demo User Peter Müller", () => {
  beforeAll(async () => {
    // Initialize Peter Müller baseline state
    await seedPeterMuellerDemoData();
  });

  describe("1. Passwordless Authentication Request (requestCode)", () => {
    const dummyUser = {
      id: "usr_temp_guest",
      name: null,
      email: null,
      emailVerified: false,
      telefon: null,
    };

    it("rejects invalid email formats", async () => {
      const res = await requestCode(dummyUser, "not-an-email");
      expect(res.ok).toBe(false);
      expect(res.fehler).toContain("nicht vollständig");
    });

    it("requires a mobile phone number when SMS channel is selected", async () => {
      const res = await requestCode(dummyUser, "landwirt@seedle-demo.de", undefined, "sms");
      expect(res.ok).toBe(false);
      expect(res.fehler).toContain("Handynummer");
    });

    it("successfully generates login verification code via email channel", async () => {
      const res = await requestCode(dummyUser, "landwirt@seedle-demo.de", undefined, "email");
      expect(res.ok).toBe(true);
      expect(res.kanal).toBe("email");
      expect(res.devCode).toBeDefined();
    });

    it("successfully generates login verification code via SMS channel when mobile number is provided", async () => {
      const res = await requestCode(
        dummyUser,
        "landwirt@seedle-demo.de",
        "+49 171 1234567",
        "sms",
      );
      expect(res.ok).toBe(true);
      expect(res.kanal).toBe("sms");
      expect(res.telefon).toBe("+49 171 1234567");
      expect(res.devCode).toBeDefined();
    });
  });

  describe("2. Code Verification & Demo Farmer Association (verifyCode)", () => {
    const guestUser = {
      id: "usr_anonym_visitor",
      name: null,
      email: null,
      emailVerified: false,
      telefon: null,
    };

    it("accepts valid verification code and resolves demo user Peter Müller", async () => {
      const res = await verifyCode(guestUser, "beliebig@bauer.de", "123456");
      expect(res.ok).toBe(true);

      const db = await getDb();
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, DEMO_USER_ID))
        .limit(1);

      // Verify Peter Müller record properties
      expect(user).toBeDefined();
      expect(user.id).toBe(DEMO_USER_ID);
      expect(user.name).toBe(DEMO_USER_NAME);
      expect(user.email).toBe(DEMO_USER_EMAIL);
      expect(user.emailVerifiedAt).not.toBeNull();
    });
  });

  describe("3. Peter Müller Baseline State (Freising Farm, 3 Status Parcels, fieldYears 2027)", () => {
    it("maintains exactly 1 farmstead near Freising (postal code 85354, lat ~48.402, lon ~11.728)", async () => {
      const farm = await getFarm(DEMO_USER_ID);
      expect(farm).not.toBeNull();
      expect(farm?.id).toBe(DEMO_FARM_ID);
      expect(farm?.plz).toBe("85354");
      expect(farm?.ort).toBe("Freising");
      expect(farm?.lat).toBeCloseTo(48.402, 2);
      expect(farm?.lon).toBeCloseTo(11.728, 2);
      expect(farm?.name).toBe(DEMO_FARM_CONFIG.name);
    });

    it("maintains exactly 3 sample field parcels near Freising with distinct traffic light status values", async () => {
      const fields = await listFields(DEMO_USER_ID);
      expect(fields.length).toBe(3);

      // All 3 fields belong to the Freising demo farm
      for (const field of fields) {
        expect(field.farmId).toBe(DEMO_FARM_ID);
        expect(field.userId).toBe(DEMO_USER_ID);
        expect(field.lat).toBeGreaterThan(48.3);
        expect(field.lat).toBeLessThan(48.5);
        expect(field.lon).toBeGreaterThan(11.6);
        expect(field.lon).toBeLessThan(11.8);
      }

      // Verify assigned status indicators (status-ok, status-action, status-problem)
      const statuses = fields.map((f) => f.status);
      expect(statuses).toContain("status-ok");
      expect(statuses).toContain("status-action");
      expect(statuses).toContain("status-problem");
    });

    it("contains cultivation records for 2027 across all 3 field parcels", async () => {
      const fields = await listFields(DEMO_USER_ID);
      for (const field of fields) {
        const years = await listFieldYears(field.id);
        const y2027 = years.find((y) => y.jahr === 2027);
        expect(y2027).toBeDefined();
        expect(y2027?.crop).toBe("mais");
      }
    });

    it("retains state across operations until explicitly re-seeded", async () => {
      // Modify parcel name
      const fields = await listFields(DEMO_USER_ID);
      const firstField = fields[0];
      const db = await getDb();
      await db
        .update(schema.fields)
        .set({ name: "Mein Umbenannter Testschlag" })
        .where(eq(schema.fields.id, firstField.id));

      const updated = await getField(DEMO_USER_ID, firstField.id);
      expect(updated?.name).toBe("Mein Umbenannter Testschlag");

      // Re-seed restores baseline demo state
      await seedPeterMuellerDemoData();
      const restored = await getField(DEMO_USER_ID, firstField.id);
      expect(restored?.name).not.toBe("Mein Umbenannter Testschlag");
      expect(restored?.name).toBe(firstField.name);
    });
  });
});
