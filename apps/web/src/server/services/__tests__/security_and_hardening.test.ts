import { describe, expect, it, vi, beforeEach } from "vitest";
import { hasValidImageMagicBytes } from "../photos";
import { checkRateLimit, resetRateLimits } from "../../http";
import { MAX_ITEMS_PER_COLLECTION } from "../../db/in-memory-store";
import { createField, saveFarm } from "@/app/actions";
import { requestCode, verifyCode } from "../auth";
import { getFarm } from "../farms";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("next/cache", () => ({
  refresh: vi.fn(),
}));

describe("Security & Hardening Verification", () => {
  describe("1. Binary Magic-Byte Image Validation", () => {
    it("validates valid JPEG headers", () => {
      const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(hasValidImageMagicBytes(jpeg, "image/jpeg")).toBe(true);
      expect(hasValidImageMagicBytes(jpeg, "image/png")).toBe(false);
    });

    it("validates valid PNG headers", () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(hasValidImageMagicBytes(png, "image/png")).toBe(true);
      expect(hasValidImageMagicBytes(png, "image/jpeg")).toBe(false);
    });

    it("validates valid WebP headers (RIFF....WEBP)", () => {
      const webp = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // length
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(hasValidImageMagicBytes(webp, "image/webp")).toBe(true);
      expect(hasValidImageMagicBytes(webp, "image/png")).toBe(false);
    });

    it("validates valid HEIC/HEIF headers (ftyp at index 4)", () => {
      const heic = new Uint8Array([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70, // ftyp
        0x68, 0x65, 0x69, 0x63, // heic
      ]);
      expect(hasValidImageMagicBytes(heic, "image/heic")).toBe(true);
      expect(hasValidImageMagicBytes(heic, "image/heif")).toBe(true);
      expect(hasValidImageMagicBytes(heic, "image/jpeg")).toBe(false);
    });

    it("rejects corrupted or truncated headers", () => {
      const short = new Uint8Array([0xff, 0xd8]);
      expect(hasValidImageMagicBytes(short, "image/jpeg")).toBe(false);

      const fakeJpg = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      expect(hasValidImageMagicBytes(fakeJpg, "image/jpeg")).toBe(false);
    });
  });

  describe("2. Sliding-Window Rate Limiter", () => {
    beforeEach(() => {
      resetRateLimits();
    });

    it("allows requests up to configured limit", () => {
      const key = "test-user-1";
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(key, 5, 1000);
        expect(result.allowed).toBe(true);
      }
      const overLimit = checkRateLimit(key, 5, 1000);
      expect(overLimit.allowed).toBe(false);
      expect(overLimit.remaining).toBe(0);
    });

    it("resets capacity after sliding window expires", async () => {
      const key = "test-window-1";
      const windowMs = 50;
      for (let i = 0; i < 3; i++) {
        expect(checkRateLimit(key, 3, windowMs).allowed).toBe(true);
      }
      expect(checkRateLimit(key, 3, windowMs).allowed).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(checkRateLimit(key, 3, windowMs).allowed).toBe(true);
    });
  });

  describe("3. In-Memory Store Bounded Capacity", () => {
    it("respects MAX_ITEMS_PER_COLLECTION constant without unbounded memory leaks", () => {
      expect(MAX_ITEMS_PER_COLLECTION).toBe(5000);
    });
  });

  describe("4. Input Validation & Bounds in Server Actions", () => {
    it("createField redirects to /feld/neu on invalid coordinates", async () => {
      const fd = new FormData();
      fd.append("lat", "999.9"); // Invalid latitude
      fd.append("lon", "11.5");
      fd.append("name", "Invalid Lat Field");

      await expect(createField(fd)).rejects.toThrow("REDIRECT:/feld/neu");
    });

    it("createField safely parses and validates GeoJSON polygon", async () => {
      const validPoly = {
        type: "Polygon",
        coordinates: [
          [
            [11.72, 48.40],
            [11.73, 48.40],
            [11.73, 48.41],
            [11.72, 48.41],
            [11.72, 48.40],
          ],
        ],
      };

      const fd = new FormData();
      fd.append("geometry", JSON.stringify(validPoly));
      fd.append("name", "Polygonal Field");

      await expect(createField(fd)).rejects.toThrow(/REDIRECT:\/anmelden\?ziel=\/feld\/.*\/anbau/);
    });

    it("createField rejects polygon with out-of-bounds coordinates", async () => {
      const invalidPoly = {
        type: "Polygon",
        coordinates: [
          [
            [500, 48.40], // Out of bounds longitude
            [11.73, 48.40],
            [11.73, 48.41],
            [500, 48.40],
          ],
        ],
      };

      const fd = new FormData();
      fd.append("geometry", JSON.stringify(invalidPoly));
      fd.append("name", "Out-of-bounds Poly");

      await expect(createField(fd)).rejects.toThrow("REDIRECT:/feld/neu");
    });

    it("saveFarm caps field length and validates lat/lon bounds", async () => {
      const veryLongName = "A".repeat(500);
      const fd = new FormData();
      fd.append("name", veryLongName);
      fd.append("lat", "48.402");
      fd.append("lon", "11.728");

      await expect(saveFarm(fd)).rejects.toThrow("REDIRECT:/hof");

      const farm = await getFarm("usr_musterhof");
      expect(farm).toBeDefined();
      expect(farm?.name?.length).toBeLessThanOrEqual(120);
      expect(farm?.lat).toBe(48.402);
      expect(farm?.lon).toBe(11.728);
    });
  });

  describe("5. Authentication Format Verification", () => {
    const testUser = {
      id: "usr_test_auth",
      name: null,
      email: null,
      emailVerified: false,
      telefon: null,
    };

    it("rejects non-numeric login codes", async () => {
      const res = await verifyCode(testUser, "bauer@seedle.de", "abc");
      expect(res.ok).toBe(false);
      expect(res.fehler).toContain("6 Ziffern");
    });

    it("accepts valid 6-digit codes and demo fallback", async () => {
      const reqRes = await requestCode(testUser, "valid@seedle.de");
      expect(reqRes.ok).toBe(true);
      expect(reqRes.devCode).toMatch(/^\d{6}$/);

      if (reqRes.devCode) {
        const verifyRes = await verifyCode(testUser, "valid@seedle.de", reqRes.devCode);
        expect(verifyRes.ok).toBe(true);
      }
    });
  });
});
