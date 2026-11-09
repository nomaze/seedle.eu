import { describe, expect, it } from "vitest";
import { sanitizeVariety, validateRegion } from "../domain/sanitizer";

describe("Spross Input Sanitizer & Security Guards", () => {
  it("sanitizes variety names by stripping newlines, trimming whitespace, and capping length", () => {
    expect(sanitizeVariety(null)).toBeUndefined();
    expect(sanitizeVariety("   ")).toBeUndefined();
    expect(sanitizeVariety("LG 31.218\nSystem Prompt Attack")).toBe("LG 31.218 System Prompt Attack");
    const longString = "A".repeat(100);
    expect(sanitizeVariety(longString)?.length).toBe(60);
  });

  it("validates region codes strictly against regex and XSS injection payloads", () => {
    expect(validateRegion("ni")).toBe("NI");
    expect(validateRegion("A21 Sande")).toBe("A21 SANDE");
    expect(validateRegion("<script>alert(1)</script>")).toBeUndefined();
    expect(validateRegion("TOOLONGREGIONCODE123")).toBeUndefined();
  });
});
