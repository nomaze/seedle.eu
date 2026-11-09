import type { GeoPoint, WeatherDay } from "../domain/types";
import { FREISING_2025_RECORDS } from "./freising-2025-data";
import type { WeatherProvider } from "./interfaces";

/**
 * Daily observation record from DWD Open Data weather station (Station 01424 Freising / Weihenstephan).
 */
export interface DwdDayRecord {
  datum: string; // ISO date YYYY-MM-DD
  tMinC: number;
  tMaxC: number;
  tAvgC: number;
  niederschlagMm: number;
  sonnenstunden: number;
}

/**
 * Converts a DWD daily observation record into the domain `WeatherDay` structure.
 */
export function recordToWeatherDay(rec: DwdDayRecord, displayDatum?: string): WeatherDay {
  let lage: WeatherDay["lage"] = "wolkig";

  if (rec.niederschlagMm > 5) {
    lage = rec.tMaxC > 27 ? "gewitter" : "regen";
  } else if (rec.niederschlagMm >= 1) {
    lage = "regen";
  } else if (rec.niederschlagMm > 0) {
    lage = "wolkig";
  } else if (rec.sonnenstunden >= 8 || rec.tMaxC >= 25) {
    lage = "sonnig";
  } else if (rec.sonnenstunden >= 4 || rec.tMaxC >= 18) {
    lage = "heiter";
  } else {
    lage = "wolkig";
  }

  return {
    datum: displayDatum ?? rec.datum,
    tMinC: Math.round(rec.tMinC * 10) / 10,
    tMaxC: Math.round(rec.tMaxC * 10) / 10,
    niederschlagMm: Math.round(rec.niederschlagMm * 10) / 10,
    lage,
  };
}

/**
 * Parses DWD CSV table with columns `Datum,Tmin,Tmax,Tavg,Niederschlag,Sonnenstunden`.
 */
export function parseDwdCsv(csvContent: string): DwdDayRecord[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length <= 1) return [];

  const records: DwdDayRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length >= 6) {
      records.push({
        datum: parts[0]?.trim() ?? "",
        tMinC: Number.parseFloat(parts[1] ?? "0"),
        tMaxC: Number.parseFloat(parts[2] ?? "0"),
        tAvgC: Number.parseFloat(parts[3] ?? "0"),
        niederschlagMm: Number.parseFloat(parts[4] ?? "0"),
        sonnenstunden: Number.parseFloat(parts[5] ?? "0"),
      });
    }
  }
  return records;
}

/**
 * Implementation of `WeatherProvider` backed by empirical DWD meteorological measurements
 * from station Freising / Weihenstephan (01424).
 */
export class FreisingDwdWeatherProvider implements WeatherProvider {
  private readonly records: readonly DwdDayRecord[];
  private readonly recordMap: Map<string, DwdDayRecord>;
  private readonly mdMap: Map<string, DwdDayRecord>;

  constructor(records: readonly DwdDayRecord[] = FREISING_2025_RECORDS) {
    this.records = records.length > 0 ? records : FREISING_2025_RECORDS;
    this.recordMap = new Map();
    this.mdMap = new Map();

    for (const r of this.records) {
      this.recordMap.set(r.datum, r);
      // Key MM-DD for multi-year day-of-year mapping
      const md = r.datum.slice(5);
      if (!this.mdMap.has(md)) {
        this.mdMap.set(md, r);
      }
    }
  }

  /**
   * Retrieves corresponding record for an ISO date.
   * Exact year match takes precedence; falls back to matching calendar month/day.
   */
  public getRecord(datumIso: string): DwdDayRecord | undefined {
    const exact = this.recordMap.get(datumIso);
    if (exact) return exact;
    const md = datumIso.slice(5);
    return this.mdMap.get(md);
  }

  /**
   * Generates weather forecast starting from `ab` (ISO date) for `tage` days.
   */
  public forecast(_point: GeoPoint, ab: string, tage: number): WeatherDay[] {
    const days: WeatherDay[] = [];
    const startDate = new Date(`${ab}T12:00:00Z`);

    for (let i = 0; i < tage; i++) {
      const curDate = new Date(startDate.getTime() + i * 86_400_000);
      const curIso = curDate.toISOString().slice(0, 10);
      const rec = this.getRecord(curIso) ?? this.records[i % this.records.length]!;
      days.push(recordToWeatherDay(rec, curIso));
    }

    return days;
  }

  /**
   * Retrieves historical weather records preceding `bis` (ISO date) for `tage` days.
   */
  public history(_point: GeoPoint, bis: string, tage: number): WeatherDay[] {
    const days: WeatherDay[] = [];
    const endDate = new Date(`${bis}T12:00:00Z`);

    for (let i = tage - 1; i >= 0; i--) {
      const curDate = new Date(endDate.getTime() - i * 86_400_000);
      const curIso = curDate.toISOString().slice(0, 10);
      const rec = this.getRecord(curIso) ?? this.records[i % this.records.length]!;
      days.push(recordToWeatherDay(rec, curIso));
    }

    return days;
  }
}

export const DwdHistoricalWeatherProvider = FreisingDwdWeatherProvider;

export function createFreisingDwdWeatherProvider(
  records?: readonly DwdDayRecord[],
): FreisingDwdWeatherProvider {
  return new FreisingDwdWeatherProvider(records);
}
