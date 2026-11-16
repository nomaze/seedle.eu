import { withBasePath } from "@/lib/basePath";

/**
 * Demo settings: configured brand appearance, active feature toggles,
 * and environmental simulation parameters (target date/season).
 * Configured in `server/demo.ts` and managed via `/demo`.
 */

export const MARKEN = [
  "cream",
  "seedle-feldgruen",
  "seedle-dark",
  "sortenkompass",
  "sortenkompass-blau",
] as const;
export type Marke = (typeof MARKEN)[number];

export interface DemoUmweltPreset {
  id: string;
  label: string;
  datum: string; // ISO yyyy-mm-dd
  bbch: number;
  stadium: string;
  beschreibung: string;
}

export const UMWELT_PRESETS: readonly DemoUmweltPreset[] = [
  {
    id: "aussaat",
    label: "Aussaat (25. April)",
    datum: "2025-04-25",
    bbch: 0,
    stadium: "Keimung & Auflaufen",
    beschreibung: "Saatbett bereiten, Bodenwärme prüfen, Start in die Saison",
  },
  {
    id: "vierblatt",
    label: "4-Blatt (20. Mai)",
    datum: "2025-05-20",
    bbch: 14,
    stadium: "Jugendentwicklung",
    beschreibung: "Zügiges Blattwachstum, Unkrautregulierung und Bestandskontrolle",
  },
  {
    id: "bluete",
    label: "Blüte (15. Juli)",
    datum: "2025-07-15",
    bbch: 65,
    stadium: "Blüte & Befruchtung",
    beschreibung: "Kritische Phase für Wasserversorgung und Hitzetoleranz",
  },
  {
    id: "teigreife",
    label: "Teigreife (10. September)",
    datum: "2025-09-10",
    bbch: 85,
    stadium: "Kornfüllung / Siloreife",
    beschreibung: "Trockensubstanz-Bestimmung und Erntezeitpunkt-Planung",
  },
  {
    id: "ernte",
    label: "Ernte (5. Oktober)",
    datum: "2025-10-05",
    bbch: 99,
    stadium: "Physiologische Reife & Ernte",
    beschreibung: "Körnerdrusch oder Spätsilo, Ertragsabrechnung und Saisonabschluss",
  },
] as const;

export type AuthModus = "fake" | "auth0";

export type DemoEinstellungen = {
  marke: Marke;
  /** "Buy seed" feature and retail dealer inquiry workflows. */
  saatgutKauf: boolean;
  /** Spross companion: header placement, interactive buttons, introduction banner. */
  spross: boolean;
  /** "Call NoMaze Team" action docks and direct consultation dialogs. */
  teamAnruf: boolean;
  /** Public trial data explorer ("Stöbern" / `/daten`) visibility on landing page. */
  stoebern: boolean;
  /** Login, account registration prompts after field selection, and header auth button. */
  anmeldung: boolean;
  /** Show backend connectivity status badge in the header bar. */
  showBackendStatusBadge: boolean;
  /** Active simulation date for forecasts, BBCH stages, and weather (e.g., "2025-07-15"). */
  datum: string;
  /** Authentication mode: Simulated demo login ("fake") or official Auth0 integration ("auth0"). */
  authModus: AuthModus;
};

export const DEMO_STANDARD: DemoEinstellungen = {
  marke: "cream",
  saatgutKauf: false,
  spross: false,
  teamAnruf: true,
  stoebern: false,
  anmeldung: false,
  showBackendStatusBadge: true,
  datum: "2025-07-15",
  authModus: "fake",
};

export const STANDARD_DEMO_EINSTELLUNGEN: DemoEinstellungen = DEMO_STANDARD;

export const MARKEN_INFO: Record<
  Marke | "seedle",
  { name: string; titel: string; demoLabel?: string; beschreibung: string; themeColor: string; icon: string }
> = {
  cream: {
    name: "seedle",
    titel: "seedle",
    demoLabel: "seedle · On Cream (Light Master)",
    beschreibung: "Offizielles Master-Design: Helles Creme (#F5F0E1), Feldgrün (#1F5C3F), Blatt-Akzent (#3F8A4E)",
    themeColor: "#f5f0e1",
    icon: withBasePath("/brand/master-svg/seedle_app-icon_cream.svg"),
  },
  seedle: {
    name: "seedle",
    titel: "seedle",
    demoLabel: "seedle · On Cream (Light Master)",
    beschreibung: "Offizielles Master-Design: Helles Creme (#F5F0E1), Feldgrün (#1F5C3F), Blatt-Akzent (#3F8A4E)",
    themeColor: "#f5f0e1",
    icon: withBasePath("/brand/master-svg/seedle_app-icon_cream.svg"),
  },
  "seedle-feldgruen": {
    name: "seedle Feldgrün",
    titel: "seedle · Field Green (Social Kit)",
    demoLabel: "seedle · Field Green (Social Kit)",
    beschreibung: "Sattes Feldgrün (#1F5C3F), Creme-Typo (#F5F0E1), Weizengold (#D7A774), Keimblatt (#A8D8A0)",
    themeColor: "#1f5c3f",
    icon: withBasePath("/brand/master-svg/seedle_app-icon_field-green.svg"),
  },
  "seedle-dark": {
    name: "seedle Dark",
    titel: "seedle · Dark Executive",
    demoLabel: "seedle · Dark Executive",
    beschreibung: "NoMaze Obsidian (#08100C), Smaragd-Aura (#17462F), Weizengold (#D7A774), Signalorange (#FF7B00)",
    themeColor: "#08100c",
    icon: withBasePath("/brand/master-svg/seedle_app-icon_dark.svg"),
  },
  sortenkompass: {
    name: "Sortenkompass",
    titel: "Sortenkompass (Warm)",
    demoLabel: "Sortenkompass (Warm)",
    beschreibung: "Kompass mit Saatkorn-Nadel, warmes Creme mit Gold",
    themeColor: "#f7f2e7",
    icon: withBasePath("/marke/icon-sortenkompass.svg"),
  },
  "sortenkompass-blau": {
    name: "Sortenkompass Blau",
    titel: "Sortenkompass (Blau)",
    demoLabel: "Sortenkompass (Blau)",
    beschreibung: "Ursprünglicher Auftritt mit Himmelblau und Blattgrün",
    themeColor: "#eef7fd",
    icon: withBasePath("/marke/icon-sortenkompass-blau.svg"),
  },
};
