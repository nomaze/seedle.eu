import { describe, expect, it } from "vitest";
import { createDemoProviders, recommend } from "../index";
import { rankVarieties } from "./ranking";

const providers = createDemoProviders();
const point = { lat: 52.06, lon: 11.44 }; // Magdeburg Loess Plains (Magdeburger Börde)
const field = { id: "test", point, env: providers.environment.environmentAt(point) };

describe("Agronomic Variety Ranking Engine", () => {
  it("sorts descending by expected gross margin value in €/ha", async () => {
    const r = await recommend(providers, field, "koernermais", 2027);
    const values = r.sorten.map((s) => s.erwarteterWertEurHa);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(r.sorten[0]!.rang).toBe(1);
    expect(r.sorten[0]!.abstandZurBestenEurHa).toBe(0);
  });

  it("enforces strict neutrality: breeder commercial partnership does not alter ranking", async () => {
    const r = await recommend(providers, field, "koernermais", 2027);
    const base = {
      varieties: r.sorten.map((s) => s.variety),
      predictions: r.sorten.flatMap((s) => s.predictions),
      scenarios: r.scenarios,
      preise: r.preise,
      usage: "koernermais" as const,
    };
    const original = rankVarieties({ ...base, breeders: providers.catalog.breeders() });
    const invertedPartnerStatus = rankVarieties({
      ...base,
      breeders: providers.catalog.breeders().map((b) => ({ ...b, isPartner: !b.isPartner, name: `X ${b.name}` })),
    });
    expect(invertedPartnerStatus.map((s) => s.variety.id)).toEqual(original.map((s) => s.variety.id));
  });

  it("filters strictly by chosen agronomic usage direction", async () => {
    const r = await recommend(providers, field, "silomais", 2027);
    expect(r.sorten.every((s) => s.variety.usages.includes("silomais"))).toBe(true);
  });

  it("ensures climate scenario probabilities sum to exactly 1.0", () => {
    const sum = providers.climate.scenariosFor(field.env, 2027).reduce((s, x) => s + x.wahrscheinlichkeit, 0);
    expect(sum).toBeCloseTo(1, 6);
  });
});
