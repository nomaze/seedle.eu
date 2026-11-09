import { describe, expect, it } from "vitest";
import { lookupPlzOffline, PLZ_ZONE_MAP } from "./plz";

describe("Postal Code Routing & Trial Zone Lookup", () => {
  it("resolves Münster (48149) immediately to North Rhine-Westphalia (NRW)", () => {
    const res = lookupPlzOffline("48149");
    expect(res).not.toBeNull();
    expect(res?.regionCode).toBe("NRW");
    expect(res?.bundesland).toBe("Nordrhein-Westfalen");
    expect(res?.city).toContain("Münster");
    expect(res?.lat).toBeCloseTo(51.96, 1);
    expect(res?.lon).toBeCloseTo(7.62, 1);
  });

  it("resolves Landshut (84036) immediately to Bavaria (BY)", () => {
    const res = lookupPlzOffline("84036");
    expect(res).not.toBeNull();
    expect(res?.regionCode).toBe("BY");
    expect(res?.bundesland).toBe("Bayern");
    expect(res?.city).toContain("Landshut");
    expect(res?.lat).toBeCloseTo(48.54, 1);
    expect(res?.lon).toBeCloseTo(12.15, 1);
  });

  it("resolves Hannover (30159) immediately to Lower Saxony (NI)", () => {
    const res = lookupPlzOffline("30159");
    expect(res).not.toBeNull();
    expect(res?.regionCode).toBe("NI");
    expect(res?.bundesland).toBe("Niedersachsen");
    expect(res?.city).toContain("Hannover");
  });

  it("resolves Magdeburg (39104) and Leipzig (04109) to Loess soils East (A19)", () => {
    const magdeburg = lookupPlzOffline("39104");
    expect(magdeburg?.regionCode).toBe("A19");
    expect(magdeburg?.regionName).toContain("Lößstandorte Ost");

    const leipzig = lookupPlzOffline("04109");
    expect(leipzig?.regionCode).toBe("A19");
  });

  it("resolves Cottbus (03046) to Diluvial soils South (A20)", () => {
    const res = lookupPlzOffline("03046");
    expect(res?.regionCode).toBe("A20");
    expect(res?.regionName).toContain("A20");
  });

  it("resolves Eberswalde / Uckermark (16225) to Diluvial soils North (A21)", () => {
    const res = lookupPlzOffline("16225");
    expect(res?.regionCode).toBe("A21");
    expect(res?.regionName).toContain("A21");
  });

  it("resolves Jena / Thuringia (07743) to Transitional regions East (A18)", () => {
    const res = lookupPlzOffline("07743");
    expect(res?.regionCode).toBe("A18");
    expect(res?.regionName).toContain("A18");
  });

  it("resolves Stuttgart (70173) to Baden-Wuerttemberg (BW)", () => {
    const res = lookupPlzOffline("70173");
    expect(res?.regionCode).toBe("BW");
    expect(res?.bundesland).toBe("Baden-Württemberg");
  });

  it("resolves Kiel (24103) to Schleswig-Holstein (SH)", () => {
    const res = lookupPlzOffline("24103");
    expect(res?.regionCode).toBe("SH");
    expect(res?.bundesland).toBe("Schleswig-Holstein");
  });

  it("resolves Kassel (34117) to Hesse (HE)", () => {
    const res = lookupPlzOffline("34117");
    expect(res?.regionCode).toBe("HE");
    expect(res?.bundesland).toBe("Hessen");
  });

  it("resolves Trier (54290) to Rhineland-Palatinate (RP)", () => {
    const res = lookupPlzOffline("54290");
    expect(res?.regionCode).toBe("RP");
    expect(res?.bundesland).toBe("Rheinland-Pfalz");
  });

  it("resolves Dresden (01067) to Saxony (SN)", () => {
    const res = lookupPlzOffline("01067");
    expect(res).not.toBeNull();
    expect(res?.regionCode).toBe("SN");
    expect(res?.bundesland).toBe("Sachsen");
    expect(res?.city).toContain("Dresden");
  });

  it("resolves Berlin (10115) to Brandenburg & Berlin (BB)", () => {
    const res = lookupPlzOffline("10115");
    expect(res).not.toBeNull();
    expect(res?.regionCode).toBe("BB");
    expect(res?.bundesland).toBe("Berlin");
  });

  it("matches prefix starting from 2 digits and returns null for 1 digit", () => {
    const res2 = lookupPlzOffline("48");
    expect(res2?.regionCode).toBe("NRW");

    const res1 = lookupPlzOffline("4");
    expect(res1).toBeNull();
  });

  it("robustly ignores whitespace and country prefix characters", () => {
    const res = lookupPlzOffline(" D-48149 ");
    expect(res?.regionCode).toBe("NRW");
  });

  it("covers all core routing zones in PLZ_ZONE_MAP", () => {
    const keys = Object.keys(PLZ_ZONE_MAP);
    expect(keys.length).toBeGreaterThan(60);
  });
});
