import "server-only";

import {
  FAKE_REGIONS,
  fakeBreedersList,
  fakeRegionalStats,
  fakeSearchVarieties,
  fakeVarietyDetail,
} from "./fake-dmk-data";

export interface DmkRegionMeta {
  region_code: string;
  name: string;
  typ: "bundesland" | "kammer" | "naturraum" | "eup";
  bundeslaender: string;
  boden_klima_beschreibung: string;
  zentroid_lat: number;
  zentroid_lon: number;
  max_standorte?: number;
  isCore?: boolean;
}

export interface RegionalTotals {
  datenpunkte: number;
  anzahl_sorten: number;
  anzahl_jahre: number;
  min_jahr: number;
  max_jahr: number;
  summe_standortmessungen: number;
  max_standorte: number;
}

export interface RegionalAverages {
  silomais: {
    avg_gtm_dt: number | null;
    avg_tsg_prozent: number | null;
    messungen_gtm: number;
  };
  koernermais: {
    avg_ke_dt: number | null;
    avg_tsg_prozent: number | null;
    messungen_ke: number;
  };
}

export interface RegionalTopVariety {
  sorte_id: number;
  sorte: string;
  zuechter: string | null;
  siloreifezahl: number | null;
  koernerreifezahl: number | null;
  reife_anzeige?: string | null;
  reifegruppe_stufe?: "frueh" | "mittelfrueh" | "spaet";
  zulassungsjahr: number | null;
  nutzung?: "silo" | "koerner";
  jahre_anzahl: number;
  total_orte: number;
  avg_rel_ertrag: number | null;
  avg_gtm_dt: number | null;
  avg_ke_dt: number | null;
  avg_tsg: number | null;
  letztes_jahr: number;
}

export interface RegionalStats {
  region: DmkRegionMeta;
  totals: RegionalTotals;
  averages: RegionalAverages;
  topSorten: RegionalTopVariety[];
  topSortenSilo: RegionalTopVariety[];
  topSortenKoerner: RegionalTopVariety[];
}

export interface DmkVarietyItem {
  sorte_id: number;
  sorte: string;
  zuechter: string | null;
  zulassung: string | null;
  zulassungsjahr: number | null;
  zulassungsland: string | null;
  siloreifezahl: number | null;
  koernerreifezahl: number | null;
  nutzung_silo: number;
  nutzung_koerner: number;
  nutzung_biogas: number;
  in_aktueller_bsl: number;
  anzahl_versuche?: number;
}

export interface VarietySearchParams {
  q?: string;
  zuechter?: string;
  nutzung?: "alle" | "silo" | "koerner";
  reifegruppe?: "alle" | "frueh" | "mittelfrueh" | "spaet";
  region?: string;
  limit?: number;
  offset?: number;
}

export interface VarietySearchResult {
  total: number;
  items: DmkVarietyItem[];
  limit: number;
  offset: number;
}

export interface DmkBslRow {
  id: number;
  sorte_id: number;
  sorte: string;
  bsl_jahr: number;
  fahnenschieben: number | null;
  weibliche_bluete_datum: number | null;
  pflanzenlaenge: number | null;
  kaelte: number | null;
  lagerneigung: number | null;
  lagerneigung_k: number | null;
  bestockung: number | null;
  stengelfaeule: number | null;
  stengelfaeule_k: number | null;
  gesamttrockenmasse: number | null;
  kolbentrockenmasse: number | null;
  trockenkolbenanteil: number | null;
  staerkegehalt: number | null;
  verdaulichkeit: number | null;
  kornertrag: number | null;
  tausendkornmasse: number | null;
  abreifegrad_der_blaetter: number | null;
  biogasausbeute: number | null;
  biogasertrag: number | null;
}

export interface DmkTrialItem {
  jahr: number;
  region: string;
  region_name: string;
  versuchsart: string;
  nutzung: string;
  merkmal: string;
  merkmal_name: string | null;
  einheit: string | null;
  wert_absolut: number | null;
  wert_relativ: number | null;
  anzahl_orte: number;
}

export interface DmkTrialRegionSummary {
  region: string;
  region_name: string;
  anzahl_jahre: number;
  total_orte: number;
  avg_rel_ertrag: number | null;
  avg_gtm_dt: number | null;
  avg_ke_dt: number | null;
  letztes_jahr: number;
}

export interface DmkVarietyDetail {
  sorte: {
    sorte_id: number;
    sorte: string;
    zuechter: string | null;
    zulassung: string | null;
    zulassungsjahr: number | null;
    zulassungsland: string | null;
    siloreifezahl: number | null;
    koernerreifezahl: number | null;
    nutzung_silo: number;
    nutzung_koerner: number;
    nutzung_biogas: number;
    hybridtyp: string | null;
    korntyp: string | null;
    in_aktueller_bsl: number;
    notiz: string | null;
  };
  bsl: {
    latest: DmkBslRow | null;
    history: DmkBslRow[];
  };
  trials: {
    totalCount: number;
    byRegion: DmkTrialRegionSummary[];
    recentTrials: DmkTrialItem[];
  };
}

export interface BreederOption {
  name: string;
  count: number;
}

export function normalizeRegionCode(code: string): string {
  const c = code.trim().toUpperCase();
  if (c === "NW") return "NRW";
  return c;
}

export function getDmkRegions(): DmkRegionMeta[] {
  return FAKE_REGIONS;
}

export function getDmkRegionByCode(code: string): DmkRegionMeta | null {
  const normalized = normalizeRegionCode(code);
  const found = FAKE_REGIONS.find((r) => r.region_code === normalized);
  return found ?? null;
}

export function getRegionalStats(regionCode: string): RegionalStats | null {
  const normalized = normalizeRegionCode(regionCode);
  return fakeRegionalStats(normalized);
}

export function getBreedersList(): BreederOption[] {
  return fakeBreedersList();
}

export function searchDmkVarieties(params: VarietySearchParams): VarietySearchResult {
  return fakeSearchVarieties(params);
}

export function getDmkVarietyDetail(idOrName: string | number): DmkVarietyDetail | null {
  return fakeVarietyDetail(idOrName);
}
