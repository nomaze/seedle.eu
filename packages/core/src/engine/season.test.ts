import { describe, expect, it } from "vitest";
import { benchmarkStatement } from "./benchmark";
import { areaHa, autoFieldPolygon } from "./geo";
import { growthStage, hintsForToday } from "./season";

describe("Season & Phenology Engine", () => {
  it("determines growth stage from days elapsed since sowing", () => {
    expect(growthStage("2027-04-25", "2027-04-20").name).toBe("Vor der Aussaat");
    expect(growthStage("2027-04-25", "2027-06-01").name).toMatch(/Blatt-Stadium/);
    expect(growthStage("2027-04-25", "2027-07-20").name).toBe("Blüte");
  });

  it("always provides at least one daily agronomic recommendation hint", () => {
    const hints = hintsForToday({
      heuteIso: "2027-05-10",
      stadium: growthStage("2027-04-25", "2027-05-10"),
      vorhersage: [],
    });
    expect(hints.length).toBeGreaterThan(0);
  });

  it("always flags plant protection topics for human expert consultation", () => {
    const vorhersage = Array.from({ length: 7 }, (_, i) => ({
      datum: `2027-06-${20 + i}`,
      tMinC: 14,
      tMaxC: 23,
      niederschlagMm: 4,
      lage: "regen" as const,
    }));
    const hints = hintsForToday({ heuteIso: "2027-06-20", stadium: growthStage("2027-04-25", "2027-06-20"), vorhersage });
    const ps = hints.filter((h) => h.art === "krankheit" || h.art === "schaedling");
    expect(ps.length).toBeGreaterThan(0);
    expect(ps.every((h) => h.menschFragen)).toBe(true);
  });
});

describe("Field Geometry", () => {
  it("generates field boundary polygons within plausible size bounds", () => {
    const ha = areaHa(autoFieldPolygon({ lat: 52.1, lon: 10.2 }));
    expect(ha).toBeGreaterThan(4);
    expect(ha).toBeLessThan(12);
  });
});

describe("Peer Farm Benchmarking", () => {
  it("formulates constructive feedback without negative shaming terminology", () => {
    for (const p of [3, 15, 30, 50, 70, 90]) {
      const s = benchmarkStatement(p, 80, 0).aussage;
      expect(s).not.toMatch(/schlecht|hinter|unter dem|schwach/i);
    }
  });
});
