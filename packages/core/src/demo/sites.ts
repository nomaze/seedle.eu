/**
 * DEMO FIXTURES: Agricultural trial locations.
 *
 * Real geographic coordinates combined with plausible regional environmental parameters
 * to support environmental similarity evaluations.
 */
import type { SiteEnvironment, SoilType, TrialSite, TrialType } from "../domain/types";

interface SiteSeed {
  id: string;
  name: string;
  gebiet: string;
  lat: number;
  lon: number;
  typ: TrialType;
  ackerzahl: number;
  bodenart: SoilType;
  niederschlag: number;
  temperatur: number;
  hoehe: number;
  region: string;
}

const SEEDS: SiteSeed[] = [
  { id: "cloppenburg", name: "Cloppenburg", gebiet: "Niedersachsen", lat: 52.85, lon: 8.05, typ: "LSV", ackerzahl: 35, bodenart: "lehmiger Sand", niederschlag: 760, temperatur: 9.6, hoehe: 40, region: "Weser-Ems" },
  { id: "vechta", name: "Vechta", gebiet: "Niedersachsen", lat: 52.73, lon: 8.29, typ: "LSV", ackerzahl: 38, bodenart: "lehmiger Sand", niederschlag: 720, temperatur: 9.7, hoehe: 40, region: "Weser-Ems" },
  { id: "uelzen", name: "Uelzen", gebiet: "Niedersachsen", lat: 52.97, lon: 10.56, typ: "LSV", ackerzahl: 32, bodenart: "Sand", niederschlag: 650, temperatur: 9.3, hoehe: 50, region: "Lüneburger Heide" },
  { id: "hildesheim", name: "Hildesheim", gebiet: "Niedersachsen", lat: 52.15, lon: 9.95, typ: "BSV", ackerzahl: 85, bodenart: "Löss", niederschlag: 650, temperatur: 9.6, hoehe: 90, region: "Hildesheimer Börde" },
  { id: "wolfenbuettel", name: "Wolfenbüttel", gebiet: "Niedersachsen", lat: 52.16, lon: 10.53, typ: "LSV", ackerzahl: 80, bodenart: "Löss", niederschlag: 620, temperatur: 9.5, hoehe: 85, region: "Braunschweiger Land" },
  { id: "rendsburg", name: "Rendsburg", gebiet: "Schleswig-Holstein", lat: 54.3, lon: 9.66, typ: "LSV", ackerzahl: 45, bodenart: "sandiger Lehm", niederschlag: 820, temperatur: 8.9, hoehe: 10, region: "Schleswig-Holsteinische Geest" },
  { id: "husum", name: "Husum", gebiet: "Schleswig-Holstein", lat: 54.48, lon: 9.05, typ: "LSV", ackerzahl: 55, bodenart: "toniger Lehm", niederschlag: 850, temperatur: 9.0, hoehe: 3, region: "Nordfriesische Marsch" },
  { id: "guestrow", name: "Güstrow", gebiet: "Mecklenburg-Vorpommern", lat: 53.79, lon: 12.17, typ: "BSV", ackerzahl: 48, bodenart: "sandiger Lehm", niederschlag: 580, temperatur: 8.9, hoehe: 15, region: "Mecklenburgisches Hügelland" },
  { id: "neubrandenburg", name: "Neubrandenburg", gebiet: "Mecklenburg-Vorpommern", lat: 53.56, lon: 13.26, typ: "LSV", ackerzahl: 45, bodenart: "sandiger Lehm", niederschlag: 570, temperatur: 8.8, hoehe: 20, region: "Mecklenburgische Seenplatte" },
  { id: "prenzlau", name: "Prenzlau", gebiet: "Brandenburg", lat: 53.31, lon: 13.86, typ: "LSV", ackerzahl: 52, bodenart: "sandiger Lehm", niederschlag: 520, temperatur: 9.0, hoehe: 30, region: "Uckermark" },
  { id: "luebben", name: "Lübben", gebiet: "Brandenburg", lat: 51.94, lon: 13.89, typ: "LSV", ackerzahl: 28, bodenart: "Sand", niederschlag: 560, temperatur: 9.6, hoehe: 50, region: "Spreewald" },
  { id: "wanzleben", name: "Wanzleben", gebiet: "Sachsen-Anhalt", lat: 52.06, lon: 11.44, typ: "BSV", ackerzahl: 92, bodenart: "Löss", niederschlag: 500, temperatur: 9.6, hoehe: 100, region: "Magdeburger Börde" },
  { id: "bernburg", name: "Bernburg", gebiet: "Sachsen-Anhalt", lat: 51.79, lon: 11.74, typ: "LSV", ackerzahl: 88, bodenart: "Löss", niederschlag: 470, temperatur: 9.8, hoehe: 80, region: "Mitteldeutsches Trockengebiet" },
  { id: "halle", name: "Halle", gebiet: "Sachsen-Anhalt", lat: 51.48, lon: 11.97, typ: "LSV", ackerzahl: 75, bodenart: "Löss", niederschlag: 490, temperatur: 9.9, hoehe: 100, region: "Mitteldeutsches Trockengebiet" },
  { id: "erfurt", name: "Erfurt", gebiet: "Thüringen", lat: 50.98, lon: 11.03, typ: "BSV", ackerzahl: 70, bodenart: "Löss", niederschlag: 520, temperatur: 9.2, hoehe: 220, region: "Thüringer Becken" },
  { id: "nossen", name: "Nossen", gebiet: "Sachsen", lat: 51.06, lon: 13.3, typ: "LSV", ackerzahl: 62, bodenart: "Lehm", niederschlag: 690, temperatur: 8.9, hoehe: 270, region: "Mittelsächsisches Lösshügelland" },
  { id: "wurzen", name: "Wurzen", gebiet: "Sachsen", lat: 51.37, lon: 12.74, typ: "LSV", ackerzahl: 60, bodenart: "sandiger Lehm", niederschlag: 600, temperatur: 9.4, hoehe: 130, region: "Leipziger Land" },
  { id: "muenster", name: "Münster", gebiet: "Nordrhein-Westfalen", lat: 51.96, lon: 7.63, typ: "LSV", ackerzahl: 50, bodenart: "sandiger Lehm", niederschlag: 790, temperatur: 10.2, hoehe: 60, region: "Münsterland" },
  { id: "kleve", name: "Kleve", gebiet: "Nordrhein-Westfalen", lat: 51.79, lon: 6.14, typ: "LSV", ackerzahl: 55, bodenart: "sandiger Lehm", niederschlag: 780, temperatur: 10.5, hoehe: 20, region: "Niederrhein" },
  { id: "soest", name: "Soest", gebiet: "Nordrhein-Westfalen", lat: 51.57, lon: 8.11, typ: "BSV", ackerzahl: 75, bodenart: "Löss", niederschlag: 760, temperatur: 9.9, hoehe: 100, region: "Soester Börde" },
  { id: "euskirchen", name: "Euskirchen", gebiet: "Nordrhein-Westfalen", lat: 50.66, lon: 6.79, typ: "LSV", ackerzahl: 70, bodenart: "Löss", niederschlag: 650, temperatur: 10.1, hoehe: 160, region: "Zülpicher Börde" },
  { id: "fritzlar", name: "Fritzlar", gebiet: "Hessen", lat: 51.13, lon: 9.27, typ: "LSV", ackerzahl: 72, bodenart: "Löss", niederschlag: 640, temperatur: 9.3, hoehe: 200, region: "Nordhessisches Bergland" },
  { id: "giessen", name: "Gießen", gebiet: "Hessen", lat: 50.58, lon: 8.68, typ: "LSV", ackerzahl: 60, bodenart: "Lehm", niederschlag: 650, temperatur: 9.6, hoehe: 160, region: "Wetterau" },
  { id: "speyer", name: "Speyer", gebiet: "Rheinland-Pfalz", lat: 49.32, lon: 8.43, typ: "BSV", ackerzahl: 55, bodenart: "sandiger Lehm", niederschlag: 600, temperatur: 11.0, hoehe: 100, region: "Vorderpfalz" },
  { id: "emmendingen", name: "Emmendingen", gebiet: "Baden-Württemberg", lat: 48.12, lon: 7.85, typ: "LSV", ackerzahl: 65, bodenart: "Lehm", niederschlag: 880, temperatur: 11.2, hoehe: 200, region: "Südlicher Oberrhein" },
  { id: "wuerzburg", name: "Würzburg", gebiet: "Bayern", lat: 49.79, lon: 9.95, typ: "LSV", ackerzahl: 65, bodenart: "Lehm", niederschlag: 580, temperatur: 10.0, hoehe: 250, region: "Mainfranken" },
  { id: "bamberg", name: "Bamberg", gebiet: "Bayern", lat: 49.89, lon: 10.89, typ: "LSV", ackerzahl: 50, bodenart: "sandiger Lehm", niederschlag: 650, temperatur: 9.2, hoehe: 250, region: "Oberfranken" },
  { id: "straubing", name: "Straubing", gebiet: "Bayern", lat: 48.88, lon: 12.57, typ: "BSV", ackerzahl: 82, bodenart: "Löss", niederschlag: 730, temperatur: 9.2, hoehe: 330, region: "Gäuboden" },
  { id: "landshut", name: "Landshut", gebiet: "Bayern", lat: 48.54, lon: 12.15, typ: "LSV", ackerzahl: 68, bodenart: "Lehm", niederschlag: 800, temperatur: 8.9, hoehe: 400, region: "Tertiärhügelland" },
  { id: "augsburg", name: "Augsburg", gebiet: "Bayern", lat: 48.37, lon: 10.9, typ: "LSV", ackerzahl: 55, bodenart: "Lehm", niederschlag: 830, temperatur: 8.8, hoehe: 490, region: "Schwäbisches Lechfeld" },
  { id: "kempten", name: "Kempten", gebiet: "Bayern", lat: 47.73, lon: 10.31, typ: "LSV", ackerzahl: 45, bodenart: "Lehm", niederschlag: 1250, temperatur: 7.8, hoehe: 690, region: "Allgäu" },
  { id: "rosenheim", name: "Rosenheim", gebiet: "Bayern", lat: 47.86, lon: 12.12, typ: "LSV", ackerzahl: 50, bodenart: "Lehm", niederschlag: 1100, temperatur: 8.6, hoehe: 450, region: "Voralpenland" },
  { id: "ulm", name: "Ulm", gebiet: "Baden-Württemberg", lat: 48.4, lon: 9.99, typ: "BSV", ackerzahl: 55, bodenart: "Lehm", niederschlag: 760, temperatur: 8.7, hoehe: 500, region: "Schwäbische Alb (Rand)" },
  { id: "crailsheim", name: "Crailsheim", gebiet: "Baden-Württemberg", lat: 49.13, lon: 10.07, typ: "LSV", ackerzahl: 58, bodenart: "toniger Lehm", niederschlag: 780, temperatur: 8.7, hoehe: 410, region: "Hohenlohe" },
  // Official EU variety trials in neighbouring countries
  { id: "colmar", name: "Colmar", gebiet: "Frankreich (Elsass)", lat: 48.08, lon: 7.36, typ: "EU", ackerzahl: 62, bodenart: "Lehm", niederschlag: 620, temperatur: 11.0, hoehe: 190, region: "Oberelsass" },
  { id: "tulln", name: "Tulln", gebiet: "Österreich", lat: 48.33, lon: 16.05, typ: "EU", ackerzahl: 70, bodenart: "Löss", niederschlag: 600, temperatur: 10.2, hoehe: 180, region: "Tullnerfeld" },
  { id: "wageningen", name: "Wageningen", gebiet: "Niederlande", lat: 51.97, lon: 5.67, typ: "EU", ackerzahl: 55, bodenart: "sandiger Lehm", niederschlag: 830, temperatur: 10.4, hoehe: 10, region: "Gelderse Vallei" },
  { id: "poznan", name: "Poznań", gebiet: "Polen", lat: 52.41, lon: 16.93, typ: "EU", ackerzahl: 45, bodenart: "lehmiger Sand", niederschlag: 520, temperatur: 9.1, hoehe: 80, region: "Großpolen" },
];

/** Computes heat sum from mean annual temperature and longitude (eastern sites have warmer summers). */
export function waermesummeAus(temperaturC: number, lon: number): number {
  const kontinental = lon > 11.5 ? 50 : 0;
  return Math.round(1450 + (temperaturC - 9) * 190 + kontinental);
}

/** Fraction of annual precipitation occurring April-September. */
export function vegetationsAnteil(lat: number, lon: number): number {
  if (lat < 49.5) return 0.6;
  if (lon > 11.5) return 0.55;
  return 0.5;
}

function toEnv(s: SiteSeed): SiteEnvironment {
  return {
    ackerzahl: s.ackerzahl,
    bodenart: s.bodenart,
    niederschlagJahrMm: s.niederschlag,
    niederschlagVegetationMm: Math.round(s.niederschlag * vegetationsAnteil(s.lat, s.lon)),
    temperaturC: s.temperatur,
    waermesumme: waermesummeAus(s.temperatur, s.lon),
    hoeheM: s.hoehe,
    region: s.region,
  };
}

export const DEMO_SITES: TrialSite[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  gebiet: s.gebiet,
  point: { lat: s.lat, lon: s.lon },
  trialType: s.typ,
  env: toEnv(s),
}));
