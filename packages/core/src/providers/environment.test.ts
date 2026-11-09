import { describe, expect, it } from "vitest";
import { createDemoProviders } from "../index";

describe("EnvironmentProvider boundary checking & fallback resilience", () => {
  const providers = createDemoProviders();

  it("returns valid environmental parameters for typical coordinates in Germany", () => {
    const env = providers.environment.environmentAt({ lat: 48.4, lon: 11.7 });
    expect(env).toBeDefined();
    expect(Number.isFinite(env.ackerzahl)).toBe(true);
    expect(env.ackerzahl).toBeGreaterThanOrEqual(18);
    expect(env.ackerzahl).toBeLessThanOrEqual(98);
    expect(Number.isFinite(env.niederschlagJahrMm)).toBe(true);
    expect(Number.isFinite(env.temperaturC)).toBe(true);
    expect(typeof env.bodenart).toBe("string");
    expect(typeof env.region).toBe("string");
  });

  it("safely returns fallback environment without exceptions on NaN coordinates", () => {
    expect(() => {
      const env = providers.environment.environmentAt({ lat: NaN, lon: 11.7 });
      expect(env).toBeDefined();
      expect(Number.isFinite(env.ackerzahl)).toBe(true);
      expect(env.region).toBe("Deutschland");
    }).not.toThrow();
  });

  it("falls back to default environment for coordinates outside geographic bounds", () => {
    expect(() => {
      const env = providers.environment.environmentAt({ lat: 120, lon: 300 });
      expect(env).toBeDefined();
      expect(env.region).toBe("Deutschland");
    }).not.toThrow();
  });

  it("robustly returns fallback environment for null or undefined input", () => {
    expect(() => {
      // @ts-expect-error Testing defensive runtime handling
      const env = providers.environment.environmentAt(null);
      expect(env).toBeDefined();
      expect(env.region).toBe("Deutschland");
    }).not.toThrow();
  });
});
