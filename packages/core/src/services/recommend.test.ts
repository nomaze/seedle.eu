import { describe, expect, it } from "vitest";
import { createDemoProviders, explain, recommend } from "../index";

const providers = createDemoProviders();

describe("Recommendation & Agronomic Explanation Service", () => {
  const point = { lat: 48.88, lon: 12.57 }; // Lower Bavarian Gäuboden
  const field = { id: "f1", point, env: providers.environment.environmentAt(point) };

  it("benchmarks against previous farm variety across 5 retrospective years", async () => {
    const top = (await recommend(providers, field, "koernermais", 2027)).sorten[0]!;
    const e = await explain(providers, {
      field,
      varietyId: top.variety.id,
      usage: "koernermais",
      bisherigeSorteId: "fg-kontinent",
      saison: 2027,
    });
    expect(e.vergleich.quelle).toBe("bisherige-sorte");
    expect(e.jahre).toHaveLength(5);
    expect(e.aehnlicheStandorte.length).toBeGreaterThanOrEqual(4);
    expect(e.gruende.length).toBeGreaterThan(0);
    expect(e.datenbasis.length).toBeGreaterThan(0);
  });

  it("falls back to regional standard variety when previous farm variety is omitted", async () => {
    const e = await explain(providers, { field, varietyId: "aw-talkrone", usage: "koernermais", saison: 2027 });
    expect(e.vergleich.quelle).toBe("regionaler-standard");
    expect(e.vergleich.variety?.id).not.toBe("aw-talkrone");
  });

  it("guarantees deterministic repeatable recommendations for identical field inputs", async () => {
    const a = await recommend(providers, field, "silomais", 2027);
    const b = await recommend(providers, field, "silomais", 2027);
    expect(a.sorten.map((s) => s.erwarteterWertEurHa)).toEqual(b.sorten.map((s) => s.erwarteterWertEurHa));
  });
});
