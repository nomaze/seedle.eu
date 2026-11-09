/**
 * DEMO FIXTURES: Breeders and corn varieties.
 *
 * Synthetic neutral sample varieties and breeders demonstrating the UI
 * and recommendation engine.
 *
 * `DEMO_GENETICS` contains hidden variety parameters used by the demo
 * prediction model (model.ts). In production, these parameters originate
 * from the NoMaze Prediction API.
 */
import type { Breeder, Variety } from "../domain/types";

export const DEMO_BREEDERS: Breeder[] = [
  { id: "ackerwerk", name: "AckerWerk Genetik", logo: "/partner/ackerwerk.svg", isPartner: true },
  { id: "feldmark", name: "Feldmark Genetics", logo: "/partner/feldmark.svg", isPartner: true },
  { id: "auenhof", name: "Auenhof Saatzucht", logo: "/partner/auenhof.svg", isPartner: true },
  { id: "bergland", name: "Bergland Seeds", logo: "/partner/bergland.svg", isPartner: true },
  // Non-partner: demonstrates that variety ranking treats all varieties neutrally.
  { id: "rheintal", name: "Rheintal Zucht", logo: "/partner/rheintal.svg", isPartner: false },
];

export const DEMO_VARIETIES: Variety[] = [
  {
    id: "aw-lichtkorn",
    name: "AW Lichtkorn",
    breederId: "ackerwerk",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 200,
    zulassungsjahr: 2020,
    traits: { standfestigkeit: 7, jugendentwicklung: 8, trockentoleranz: 6, kaeltetoleranz: 9, staengelfaeule: 3, blattkrankheiten: 3 },
    kurzbeschreibung: "Frühe Sorte mit zügiger Jugendentwicklung, gemacht für kühle Lagen.",
  },
  {
    id: "aw-talkrone",
    name: "AW Talkrone",
    breederId: "ackerwerk",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 240,
    zulassungsjahr: 2021,
    traits: { standfestigkeit: 8, jugendentwicklung: 7, trockentoleranz: 8, kaeltetoleranz: 6, staengelfaeule: 2, blattkrankheiten: 3 },
    kurzbeschreibung: "Mittelfrühe Doppelnutzungssorte mit hoher Trockentoleranz.",
  },
  {
    id: "aw-morgenstern",
    name: "AW Morgenstern",
    breederId: "ackerwerk",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 270,
    zulassungsjahr: 2021,
    traits: { standfestigkeit: 7, jugendentwicklung: 6, trockentoleranz: 7, kaeltetoleranz: 5, staengelfaeule: 3, blattkrankheiten: 2 },
    kurzbeschreibung: "Ertragsstarke Sorte für warme Lagen, gibt Wasser schnell ab.",
  },
  {
    id: "aw-ostwind",
    name: "AW Ostwind",
    breederId: "ackerwerk",
    crop: "mais",
    usages: ["koernermais"],
    reifezahl: 300,
    zulassungsjahr: 2024,
    traits: { standfestigkeit: 6, jugendentwicklung: 6, trockentoleranz: 7, kaeltetoleranz: 4, staengelfaeule: 3, blattkrankheiten: 3 },
    kurzbeschreibung: "Neue späte Körnersorte für die wärmsten Lagen.",
  },
  {
    id: "aw-sonnenkraft",
    name: "AW Sonnenkraft",
    breederId: "ackerwerk",
    crop: "mais",
    usages: ["silomais"],
    reifezahl: 240,
    zulassungsjahr: 2021,
    traits: { standfestigkeit: 7, jugendentwicklung: 7, trockentoleranz: 7, kaeltetoleranz: 7, staengelfaeule: 2, blattkrankheiten: 3 },
    kurzbeschreibung: "Silomais mit hohem Stärkegehalt und guter Verdaulichkeit.",
  },
  {
    id: "fg-nordlicht",
    name: "FG Nordlicht",
    breederId: "feldmark",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 200,
    zulassungsjahr: 2019,
    traits: { standfestigkeit: 6, jugendentwicklung: 7, trockentoleranz: 5, kaeltetoleranz: 7, staengelfaeule: 4, blattkrankheiten: 4 },
    kurzbeschreibung: "Frühe, unkomplizierte Sorte für den Norden.",
  },
  {
    id: "fg-kontinent",
    name: "FG Kontinent",
    breederId: "feldmark",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 250,
    zulassungsjahr: 2017,
    traits: { standfestigkeit: 6, jugendentwicklung: 6, trockentoleranz: 5, kaeltetoleranz: 5, staengelfaeule: 4, blattkrankheiten: 5 },
    kurzbeschreibung: "Bewährte mittelfrühe Sorte, seit Jahren im Anbau.",
  },
  {
    id: "fg-kornfeld",
    name: "FG Kornfeld",
    breederId: "feldmark",
    crop: "mais",
    usages: ["koernermais"],
    reifezahl: 280,
    zulassungsjahr: 2021,
    traits: { standfestigkeit: 7, jugendentwicklung: 5, trockentoleranz: 6, kaeltetoleranz: 4, staengelfaeule: 3, blattkrankheiten: 4 },
    kurzbeschreibung: "Mittelspäte Körnersorte mit hohem Ertragspotenzial.",
  },
  {
    id: "ah-bernstein",
    name: "Auenhof Bernstein",
    breederId: "auenhof",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 230,
    zulassungsjahr: 2020,
    traits: { standfestigkeit: 8, jugendentwicklung: 6, trockentoleranz: 6, kaeltetoleranz: 6, staengelfaeule: 3, blattkrankheiten: 4 },
    kurzbeschreibung: "Sehr standfeste mittelfrühe Sorte.",
  },
  {
    id: "ah-saphir",
    name: "Auenhof Saphir",
    breederId: "auenhof",
    crop: "mais",
    usages: ["silomais"],
    reifezahl: 260,
    zulassungsjahr: 2022,
    traits: { standfestigkeit: 6, jugendentwicklung: 7, trockentoleranz: 6, kaeltetoleranz: 5, staengelfaeule: 3, blattkrankheiten: 3 },
    kurzbeschreibung: "Massenwüchsiger Silomais für gute Standorte.",
  },
  {
    id: "ah-klassik",
    name: "Auenhof Klassik",
    breederId: "auenhof",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 220,
    zulassungsjahr: 2016,
    traits: { standfestigkeit: 6, jugendentwicklung: 6, trockentoleranz: 5, kaeltetoleranz: 6, staengelfaeule: 5, blattkrankheiten: 5 },
    kurzbeschreibung: "Der frühe Klassiker, auf vielen Betrieben gesetzt.",
  },
  {
    id: "bs-gipfel",
    name: "BS Gipfel",
    breederId: "bergland",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 190,
    zulassungsjahr: 2020,
    traits: { standfestigkeit: 6, jugendentwicklung: 8, trockentoleranz: 4, kaeltetoleranz: 9, staengelfaeule: 4, blattkrankheiten: 4 },
    kurzbeschreibung: "Sehr frühe, kältetolerante Sorte für Höhenlagen.",
  },
  {
    id: "bs-tauern",
    name: "BS Tauern",
    breederId: "bergland",
    crop: "mais",
    usages: ["silomais"],
    reifezahl: 240,
    zulassungsjahr: 2021,
    traits: { standfestigkeit: 7, jugendentwicklung: 7, trockentoleranz: 5, kaeltetoleranz: 7, staengelfaeule: 3, blattkrankheiten: 4 },
    kurzbeschreibung: "Silomais mit sicherer Jugendentwicklung.",
  },
  {
    id: "rz-sonnwend",
    name: "RZ Sonnwend",
    breederId: "rheintal",
    crop: "mais",
    usages: ["koernermais"],
    reifezahl: 290,
    zulassungsjahr: 2023,
    traits: { standfestigkeit: 7, jugendentwicklung: 6, trockentoleranz: 8, kaeltetoleranz: 4, staengelfaeule: 3, blattkrankheiten: 3 },
    kurzbeschreibung: "Mittelspäte Körnersorte mit hoher Trockentoleranz.",
  },
  {
    id: "rz-mainau",
    name: "RZ Mainau",
    breederId: "rheintal",
    crop: "mais",
    usages: ["koernermais", "silomais"],
    reifezahl: 260,
    zulassungsjahr: 2022,
    traits: { standfestigkeit: 7, jugendentwicklung: 6, trockentoleranz: 9, kaeltetoleranz: 5, staengelfaeule: 3, blattkrankheiten: 4 },
    kurzbeschreibung: "Sehr trockentolerante Sorte für leichte Standorte.",
  },
];

/** Varieties serving as regional standards when previous variety is unknown. */
export const DEMO_STANDARD_VARIETY_IDS = ["ah-klassik", "fg-kontinent"];

/**
 * Hidden variety traits for the demo model.
 * g      - grain yield level in dt/ha relative to mean
 * gSilo  - silage yield level in dt DM/ha relative to mean
 * dS     - drought stress sensitivity (negative = tolerant)
 * cS     - cold sensitivity (negative = tolerant)
 * fBias  - deviation in harvest grain moisture in percentage points
 * starch - deviation in starch content in percentage points
 */
export interface DemoGenetics {
  g: number;
  gSilo: number;
  dS: number;
  cS: number;
  fBias: number;
  starch: number;
}

export const DEMO_GENETICS: Record<string, DemoGenetics> = {
  "aw-lichtkorn": { g: 8.5, gSilo: 12, dS: -0.2, cS: -1.0, fBias: -0.8, starch: 1.2 },
  "aw-talkrone": { g: 9, gSilo: 14, dS: -0.6, cS: -0.2, fBias: -0.5, starch: 1.0 },
  "aw-morgenstern": { g: 10, gSilo: 15, dS: -0.35, cS: 0, fBias: -1.2, starch: 0 },
  "aw-ostwind": { g: 11.5, gSilo: 0, dS: -0.3, cS: 0.3, fBias: -0.6, starch: 0 },
  "aw-sonnenkraft": { g: 0, gSilo: 17, dS: -0.4, cS: -0.3, fBias: 0, starch: 2.0 },
  "fg-nordlicht": { g: 3.5, gSilo: 5, dS: 0.1, cS: -0.5, fBias: 0, starch: 0.3 },
  "fg-kontinent": { g: 0, gSilo: 0, dS: 0.25, cS: 0, fBias: 0.5, starch: -0.3 },
  "fg-kornfeld": { g: 6, gSilo: 0, dS: 0, cS: 0.2, fBias: 1.2, starch: 0 },
  "ah-bernstein": { g: 5, gSilo: 7, dS: 0, cS: -0.1, fBias: 0.2, starch: 0.4 },
  "ah-saphir": { g: 0, gSilo: 12, dS: 0.1, cS: 0, fBias: 0, starch: 0.2 },
  "ah-klassik": { g: -1, gSilo: -2, dS: 0.2, cS: -0.2, fBias: 0.3, starch: -0.5 },
  "bs-gipfel": { g: 2, gSilo: 3, dS: 0.4, cS: -0.9, fBias: -0.3, starch: 0.5 },
  "bs-tauern": { g: 0, gSilo: 9, dS: 0.1, cS: -0.5, fBias: 0, starch: 0 },
  "rz-sonnwend": { g: 8, gSilo: 0, dS: -0.4, cS: 0.5, fBias: 1.5, starch: 0 },
  "rz-mainau": { g: 6, gSilo: 8, dS: -0.75, cS: 0, fBias: 0.4, starch: 0 },
};

/** Seed prices per unit (50,000 kernels) in EUR. */
export const DEMO_SEED_PRICES: Record<string, number> = {
  "aw-lichtkorn": 132,
  "aw-talkrone": 136,
  "aw-morgenstern": 139,
  "aw-ostwind": 142,
  "aw-sonnenkraft": 134,
  "fg-nordlicht": 112,
  "fg-kontinent": 109,
  "fg-kornfeld": 124,
  "ah-bernstein": 118,
  "ah-saphir": 121,
  "ah-klassik": 104,
  "bs-gipfel": 114,
  "bs-tauern": 117,
  "rz-sonnwend": 126,
  "rz-mainau": 122,
};
