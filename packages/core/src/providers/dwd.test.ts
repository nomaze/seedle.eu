import { describe, expect, it } from "vitest";
import {
  FreisingDwdWeatherProvider,
  createFreisingDwdWeatherProvider,
  parseDwdCsv,
  recordToWeatherDay,
} from "./dwd";
import { FREISING_2025_RECORDS } from "./freising-2025-data";

describe("FreisingDwdWeatherProvider & DWD 2025 Data", () => {
  it("contains 365 daily weather records for 2025", () => {
    expect(FREISING_2025_RECORDS.length).toBe(365);
    expect(FREISING_2025_RECORDS[0]?.datum).toBe("2025-01-01");
    expect(FREISING_2025_RECORDS[364]?.datum).toBe("2025-12-31");
  });

  it("provides correct DWD observation values for 2025 key phenology days", () => {
    const provider = new FreisingDwdWeatherProvider();

    // 1. Sowing 2025-04-25
    const aussaatRec = provider.getRecord("2025-04-25");
    expect(aussaatRec).toBeDefined();
    expect(aussaatRec?.tMinC).toBe(8.9);
    expect(aussaatRec?.tMaxC).toBe(18.0);

    // 2. 4-leaf stage 2025-05-20
    const vierBlattRec = provider.getRecord("2025-05-20");
    expect(vierBlattRec).toBeDefined();
    expect(vierBlattRec?.tMaxC).toBe(24.6);
    expect(vierBlattRec?.sonnenstunden).toBe(14.3);

    // 3. Flowering 2025-07-15
    const blueteRec = provider.getRecord("2025-07-15");
    expect(blueteRec).toBeDefined();
    expect(blueteRec?.tMaxC).toBe(26.2);
    expect(blueteRec?.tMinC).toBe(16.1);

    // 4. Dough stage 2025-09-10
    const teigRec = provider.getRecord("2025-09-10");
    expect(teigRec).toBeDefined();
    expect(teigRec?.tMaxC).toBe(19.3);

    // 5. Harvest 2025-10-05
    const ernteRec = provider.getRecord("2025-10-05");
    expect(ernteRec).toBeDefined();
    expect(ernteRec?.tMaxC).toBe(14.7);
  });

  it("generates 7-day forecast from specified date", () => {
    const provider = createFreisingDwdWeatherProvider();
    const point = { lat: 48.403, lon: 11.7289 };
    const forecast = provider.forecast(point, "2025-07-15", 7);

    expect(forecast.length).toBe(7);
    expect(forecast[0]?.datum).toBe("2025-07-15");
    expect(forecast[6]?.datum).toBe("2025-07-21");
    expect(forecast[0]?.tMaxC).toBe(26.2);
    expect(["sonnig", "heiter", "wolkig", "regen", "gewitter"]).toContain(forecast[0]?.lage);
  });

  it("supports date projection onto target season year (e.g. 2027)", () => {
    const provider = new FreisingDwdWeatherProvider();
    const point = { lat: 48.4, lon: 11.7 };
    const forecast = provider.forecast(point, "2027-07-15", 3);

    expect(forecast.length).toBe(3);
    expect(forecast[0]?.datum).toBe("2027-07-15");
    // Values match July 15 baseline from Freising observation series
    expect(forecast[0]?.tMaxC).toBe(26.2);
    expect(forecast[1]?.datum).toBe("2027-07-16");
  });

  it("returns retrospective weather history window", () => {
    const provider = new FreisingDwdWeatherProvider();
    const point = { lat: 48.4, lon: 11.7 };
    const hist = provider.history(point, "2025-07-15", 5);

    expect(hist.length).toBe(5);
    expect(hist[4]?.datum).toBe("2025-07-15");
    expect(hist[0]?.datum).toBe("2025-07-11");
  });

  it("correctly parses DWD CSV dataset rows", () => {
    const sampleCsv = `Datum,Tmin,Tmax,Tavg,Niederschlag,Sonnenstunden
2025-05-01,5.2,16.4,11.0,0.0,8.2
2025-05-02,7.1,19.8,13.5,2.4,4.1`;

    const parsed = parseDwdCsv(sampleCsv);
    expect(parsed.length).toBe(2);
    expect(parsed[0]?.datum).toBe("2025-05-01");
    expect(parsed[0]?.tMinC).toBe(5.2);
    expect(parsed[0]?.tMaxC).toBe(16.4);
    expect(parsed[1]?.niederschlagMm).toBe(2.4);

    const weatherDay = recordToWeatherDay(parsed[0]!);
    expect(weatherDay.datum).toBe("2025-05-01");
    expect(weatherDay.tMaxC).toBe(16.4);
    expect(weatherDay.lage).toBe("sonnig");
  });
});
