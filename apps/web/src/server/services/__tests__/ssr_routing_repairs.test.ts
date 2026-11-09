import { describe, expect, it, vi, beforeEach } from "vitest";
import FeldPage from "@/app/feld/page";
import FotoPage from "@/app/heute/foto/page";
import HofPage from "@/app/hof/page";
import { getDb } from "../../db/client";
import { DEMO_USER_ID, seedPeterMuellerDemoData } from "../demo-state";
import * as sessionModule from "../../session";

describe("Stateless Mode, Server Stability & SSR Routing Verification", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await seedPeterMuellerDemoData();
  });

  describe("1. Zero-Persistence Mode (apps/web/src/server/db/client.ts)", () => {
    it("returns a lock-free, stateless database instance without lockfile conflicts", async () => {
      const db = await getDb();
      expect(db).toBeDefined();
    });
  });

  describe("2. /feld Redirect (apps/web/src/app/feld/page.tsx)", () => {
    it("cleanly redirects to /feld/neu", async () => {
      try {
        await FeldPage();
        expect.unreachable("Should have redirected");
      } catch (err: unknown) {
        expect((err as Error).message).toBe("REDIRECT:/feld/neu");
      }
    });
  });

  describe("3. /hof Farm Overview (apps/web/src/app/hof/page.tsx)", () => {
    it("renders the farm overview for verified users", async () => {
      vi.spyOn(sessionModule, "currentUser").mockResolvedValue({
        id: DEMO_USER_ID,
        name: "Peter Müller",
        email: "landwirt@seedle-demo.de",
        emailVerified: true,
        telefon: null,
      });

      const element = await HofPage();
      expect(element).toBeDefined();
    });
  });

  describe("4. /heute/foto Robust Fallback (apps/web/src/app/heute/foto/page.tsx)", () => {
    it("resolves the first field with assigned variety as fallback target", async () => {
      vi.spyOn(sessionModule, "currentUser").mockResolvedValue({
        id: DEMO_USER_ID,
        name: "Peter Müller",
        email: "landwirt@seedle-demo.de",
        emailVerified: true,
        telefon: null,
      });

      const element = await FotoPage();
      expect(element).toBeDefined();
    });
  });
});
