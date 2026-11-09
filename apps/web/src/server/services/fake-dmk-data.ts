import type {
  DmkRegionMeta,
  DmkVarietyDetail,
  RegionalStats,
  RegionalTopVariety,
  BreederOption,
  VarietySearchParams,
  VarietySearchResult,
  DmkBslRow,
  DmkTrialItem,
  DmkTrialRegionSummary,
} from "./dmk";

export const FAKE_REGIONS: DmkRegionMeta[] = [
  {
    region_code: "BY",
    name: "Bayern",
    typ: "bundesland",
    bundeslaender: "BY",
    boden_klima_beschreibung: "Tertiärhügelland, Gäuboden und Fränkische Platten mit wechselnden Niederschlägen.",
    zentroid_lat: 48.9,
    zentroid_lon: 11.4,
    max_standorte: 18,
    isCore: true,
  },
  {
    region_code: "BW",
    name: "Baden-Württemberg",
    typ: "bundesland",
    bundeslaender: "BW",
    boden_klima_beschreibung: "Oberrheingraben, Kraichgau und Neckarbecken; hohe Wärmesummen und trockenwarme Sommer.",
    zentroid_lat: 48.5,
    zentroid_lon: 9.0,
    max_standorte: 14,
    isCore: true,
  },
  {
    region_code: "NI",
    name: "Niedersachsen",
    typ: "bundesland",
    bundeslaender: "NI",
    boden_klima_beschreibung: "Geest- und Marschböden mit atlantisch geprägtem Klima und hohen Grundwasserständen.",
    zentroid_lat: 52.8,
    zentroid_lon: 9.2,
    max_standorte: 16,
    isCore: true,
  },
  {
    region_code: "NRW",
    name: "Nordrhein-Westfalen",
    typ: "bundesland",
    bundeslaender: "NRW",
    boden_klima_beschreibung: "Niederrheinische Bucht und Münsterland mit mildem atlantischem Klima und tiefgründigen Lehmen.",
    zentroid_lat: 51.5,
    zentroid_lon: 7.2,
    max_standorte: 12,
    isCore: true,
  },
  {
    region_code: "HE",
    name: "Hessen",
    typ: "bundesland",
    bundeslaender: "HE",
    boden_klima_beschreibung: "Wetterau und hessische Senken mit fruchtbaren Lössböden und geschützten Tallagen.",
    zentroid_lat: 50.6,
    zentroid_lon: 9.0,
    max_standorte: 10,
    isCore: true,
  },
  {
    region_code: "RP",
    name: "Rheinland-Pfalz",
    typ: "bundesland",
    bundeslaender: "RP",
    boden_klima_beschreibung: "Rheinhessen und Vorderpfalz; sehr warme Gunstlagen mit früher Blüte.",
    zentroid_lat: 49.9,
    zentroid_lon: 7.5,
    max_standorte: 8,
    isCore: true,
  },
  {
    region_code: "SH",
    name: "Schleswig-Holstein",
    typ: "bundesland",
    bundeslaender: "SH",
    boden_klima_beschreibung: "Östliches Hügelland und Marsch mit kühlen Frühjahren und maritimem Spätsommer.",
    zentroid_lat: 54.2,
    zentroid_lon: 9.8,
    max_standorte: 9,
    isCore: true,
  },
  {
    region_code: "MV",
    name: "Mecklenburg-Vorpommern",
    typ: "bundesland",
    bundeslaender: "MV",
    boden_klima_beschreibung: "Ostsee-Küstenraum und Mecklenburgische Seenplatte; gute Böden, Vorsommertrockenheit.",
    zentroid_lat: 53.6,
    zentroid_lon: 12.4,
    max_standorte: 11,
    isCore: true,
  },
  {
    region_code: "BB",
    name: "Brandenburg",
    typ: "bundesland",
    bundeslaender: "BB",
    boden_klima_beschreibung: "Diluviale Sandböden mit kontinentaler Frühsommertrockenheit und hoher Sonneneinstrahlung.",
    zentroid_lat: 52.4,
    zentroid_lon: 13.0,
    max_standorte: 12,
    isCore: true,
  },
  {
    region_code: "ST",
    name: "Sachsen-Anhalt",
    typ: "bundesland",
    bundeslaender: "ST",
    boden_klima_beschreibung: "Magdeburger Börde; tiefgründige Schwarzerden im Regenschatten des Harzes.",
    zentroid_lat: 51.9,
    zentroid_lon: 11.7,
    max_standorte: 11,
    isCore: true,
  },
  {
    region_code: "SN",
    name: "Sachsen",
    typ: "bundesland",
    bundeslaender: "SN",
    boden_klima_beschreibung: "Mittelsächsisches Lösshügelland und Leipziger Tieflandsbucht mit hoher Ackerzahl.",
    zentroid_lat: 51.1,
    zentroid_lon: 13.2,
    max_standorte: 10,
    isCore: true,
  },
  {
    region_code: "TH",
    name: "Thüringen",
    typ: "bundesland",
    bundeslaender: "TH",
    boden_klima_beschreibung: "Thüringer Becken mit kalkhaltigen Böden und warmen Sommern.",
    zentroid_lat: 51.0,
    zentroid_lon: 11.0,
    max_standorte: 8,
    isCore: true,
  },
  {
    region_code: "A18",
    name: "Übergangslagen Ost",
    typ: "naturraum",
    bundeslaender: "BB, MV, ST",
    boden_klima_beschreibung: "Übergangszone zwischen Löss und Sand mit wechselndem Wasserhaltevermögen.",
    zentroid_lat: 52.6,
    zentroid_lon: 12.8,
    max_standorte: 7,
    isCore: true,
  },
  {
    region_code: "A19",
    name: "Lößstandorte Ost, Oderbruch",
    typ: "naturraum",
    bundeslaender: "SN, ST, TH",
    boden_klima_beschreibung: "Löss- und Aueböden mit sehr hohem Ertragspotenzial bei ausreichender Bodenfeuchte.",
    zentroid_lat: 51.6,
    zentroid_lon: 12.5,
    max_standorte: 9,
    isCore: true,
  },
  {
    region_code: "A20",
    name: "Diluviale Böden südl. Ostdeutschland",
    typ: "naturraum",
    bundeslaender: "BB, SN, ST",
    boden_klima_beschreibung: "Leichte diluviale Sandböden; Trockenheitsrisiko in der Kornfüllungsphase.",
    zentroid_lat: 51.8,
    zentroid_lon: 13.5,
    max_standorte: 8,
    isCore: true,
  },
  {
    region_code: "A21",
    name: "Diluviale Böden nördl. Ostdeutschland",
    typ: "naturraum",
    bundeslaender: "BB, MV",
    boden_klima_beschreibung: "Kühle, sandige Grundmoränenstandorte mit später Erwärmung.",
    zentroid_lat: 53.4,
    zentroid_lon: 13.1,
    max_standorte: 8,
    isCore: true,
  },
];

interface RawVarietyData {
  sorte_id: number;
  sorte: string;
  zuechter: string;
  zulassung: string;
  zulassungsjahr: number;
  siloreifezahl: number | null;
  koernerreifezahl: number | null;
  nutzung_silo: number;
  nutzung_koerner: number;
  nutzung_biogas: number;
  hybridtyp: string;
  korntyp: string;
  notiz: string;
  relErtragSilo: number;
  relErtragKorn: number;
}

const RAW_VARIETIES: RawVarietyData[] = [
  {
    sorte_id: 101,
    sorte: "AW Talkrone",
    zuechter: "AckerWerk Genetik",
    zulassung: "DE 2021",
    zulassungsjahr: 2021,
    siloreifezahl: 240,
    koernerreifezahl: 240,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 1,
    hybridtyp: "Dreiweghybride",
    korntyp: "Zahnmais-betont",
    notiz: "Ertragsstarke Doppelnutzung mit synchronisierter Blüte und stabiler Kolbenfüllung bei Trockenstress.",
    relErtragSilo: 104.2,
    relErtragKorn: 103.8,
  },
  {
    sorte_id: 102,
    sorte: "AW Lichtkorn",
    zuechter: "AckerWerk Genetik",
    zulassung: "DE 2020",
    zulassungsjahr: 2020,
    siloreifezahl: 200,
    koernerreifezahl: 200,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Einfachhybride",
    korntyp: "Hartmais-betont",
    notiz: "Frühe Reife mit sehr hoher Kältetoleranz im Auflauf; bewährt in kühlen Übergangslagen.",
    relErtragSilo: 101.5,
    relErtragKorn: 102.1,
  },
  {
    sorte_id: 103,
    sorte: "AW Morgenstern",
    zuechter: "AckerWerk Genetik",
    zulassung: "DE 2021",
    zulassungsjahr: 2021,
    siloreifezahl: 270,
    koernerreifezahl: 270,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 1,
    hybridtyp: "Einfachhybride",
    korntyp: "Zahnmais",
    notiz: "Mittelspäte Ertragssorte mit rascher Wasserabgabe zur Ernte (Dry-Down).",
    relErtragSilo: 105.1,
    relErtragKorn: 106.4,
  },
  {
    sorte_id: 104,
    sorte: "AW Ostwind",
    zuechter: "AckerWerk Genetik",
    zulassung: "DE 2024",
    zulassungsjahr: 2024,
    siloreifezahl: null,
    koernerreifezahl: 300,
    nutzung_silo: 0,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Einfachhybride",
    korntyp: "Zahnmais",
    notiz: "Späte Körnersorte für wärmste Gunstlagen mit maximalem genetischem Ertragspotenzial.",
    relErtragSilo: 100.0,
    relErtragKorn: 108.2,
  },
  {
    sorte_id: 105,
    sorte: "AW Sonnenkraft",
    zuechter: "AckerWerk Genetik",
    zulassung: "DE 2021",
    zulassungsjahr: 2021,
    siloreifezahl: 240,
    koernerreifezahl: null,
    nutzung_silo: 1,
    nutzung_koerner: 0,
    nutzung_biogas: 1,
    hybridtyp: "Dreiweghybride",
    korntyp: "Zwischentyp",
    notiz: "Qualitäts-Silomais mit herausragendem Stärkegehalt und hoher Verdaulichkeit.",
    relErtragSilo: 106.8,
    relErtragKorn: 99.5,
  },
  {
    sorte_id: 106,
    sorte: "FG Nordlicht",
    zuechter: "Feldmark Genetics",
    zulassung: "DE 2019",
    zulassungsjahr: 2019,
    siloreifezahl: 200,
    koernerreifezahl: 200,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Einfachhybride",
    korntyp: "Hartmais",
    notiz: "Robuste Frühreife für norddeutsche Küsten- und Moorgebiete.",
    relErtragSilo: 100.2,
    relErtragKorn: 100.8,
  },
  {
    sorte_id: 107,
    sorte: "FG Kontinent",
    zuechter: "Feldmark Genetics",
    zulassung: "DE 2017",
    zulassungsjahr: 2017,
    siloreifezahl: 250,
    koernerreifezahl: 250,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 1,
    hybridtyp: "Dreiweghybride",
    korntyp: "Zwischentyp",
    notiz: "Langjähriger Verrechnungsstandard mit stabiler Standfestigkeit auf allen Böden.",
    relErtragSilo: 99.8,
    relErtragKorn: 99.4,
  },
  {
    sorte_id: 108,
    sorte: "FG Kornfeld",
    zuechter: "Feldmark Genetics",
    zulassung: "DE 2021",
    zulassungsjahr: 2021,
    siloreifezahl: null,
    koernerreifezahl: 280,
    nutzung_silo: 0,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Einfachhybride",
    korntyp: "Zahnmais",
    notiz: "Ertragsstarke Körnersorte mit hoher Hektoliter- und Tausendkornmasse.",
    relErtragSilo: 101.0,
    relErtragKorn: 104.5,
  },
  {
    sorte_id: 109,
    sorte: "Auenhof Bernstein",
    zuechter: "Auenhof Saatzucht",
    zulassung: "DE 2020",
    zulassungsjahr: 2020,
    siloreifezahl: 230,
    koernerreifezahl: 230,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 1,
    hybridtyp: "Einfachhybride",
    korntyp: "Zwischentyp",
    notiz: "Sehr standfeste mittelfrühe Sorte mit kompakter Wuchshöhe und gesunder Halmbasis.",
    relErtragSilo: 102.7,
    relErtragKorn: 103.1,
  },
  {
    sorte_id: 110,
    sorte: "Auenhof Saphir",
    zuechter: "Auenhof Saatzucht",
    zulassung: "DE 2022",
    zulassungsjahr: 2022,
    siloreifezahl: 260,
    koernerreifezahl: null,
    nutzung_silo: 1,
    nutzung_koerner: 0,
    nutzung_biogas: 1,
    hybridtyp: "Dreiweghybride",
    korntyp: "Zwischentyp",
    notiz: "Massenwüchsiger Silomais mit hohem Gesamttrockenmasseertrag für Biogasanlagen.",
    relErtragSilo: 105.8,
    relErtragKorn: 100.1,
  },
  {
    sorte_id: 111,
    sorte: "Auenhof Klassik",
    zuechter: "Auenhof Saatzucht",
    zulassung: "DE 2016",
    zulassungsjahr: 2016,
    siloreifezahl: 220,
    koernerreifezahl: 220,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Dreiweghybride",
    korntyp: "Hartmais-betont",
    notiz: "Zuverlässiger Allrounder mit hoher Druschfestigkeit und sicherer Abreife.",
    relErtragSilo: 98.9,
    relErtragKorn: 99.2,
  },
  {
    sorte_id: 112,
    sorte: "BS Gipfel",
    zuechter: "Bergland Seeds",
    zulassung: "DE 2020",
    zulassungsjahr: 2020,
    siloreifezahl: 190,
    koernerreifezahl: 190,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Einfachhybride",
    korntyp: "Hartmais",
    notiz: "Extrem frühe Spezialsorte für Berglagen und späte Aussaattermine.",
    relErtragSilo: 101.2,
    relErtragKorn: 101.4,
  },
  {
    sorte_id: 113,
    sorte: "BS Tauern",
    zuechter: "Bergland Seeds",
    zulassung: "DE 2021",
    zulassungsjahr: 2021,
    siloreifezahl: 240,
    koernerreifezahl: null,
    nutzung_silo: 1,
    nutzung_koerner: 0,
    nutzung_biogas: 1,
    hybridtyp: "Einfachhybride",
    korntyp: "Zwischentyp",
    notiz: "Silomais mit robuster Kältetoleranz und gleichmäßiger Kolbenausbildung.",
    relErtragSilo: 103.5,
    relErtragKorn: 100.0,
  },
  {
    sorte_id: 114,
    sorte: "RZ Sonnwend",
    zuechter: "Rheintal Zucht",
    zulassung: "DE 2023",
    zulassungsjahr: 2023,
    siloreifezahl: null,
    koernerreifezahl: 290,
    nutzung_silo: 0,
    nutzung_koerner: 1,
    nutzung_biogas: 0,
    hybridtyp: "Einfachhybride",
    korntyp: "Zahnmais",
    notiz: "Hochleistungshybride für den Körnermaisanbau in sonnigen Tallagen.",
    relErtragSilo: 101.4,
    relErtragKorn: 105.7,
  },
  {
    sorte_id: 115,
    sorte: "RZ Mainau",
    zuechter: "Rheintal Zucht",
    zulassung: "DE 2022",
    zulassungsjahr: 2022,
    siloreifezahl: 260,
    koernerreifezahl: 260,
    nutzung_silo: 1,
    nutzung_koerner: 1,
    nutzung_biogas: 1,
    hybridtyp: "Dreiweghybride",
    korntyp: "Zahnmais-betont",
    notiz: "Höchste Trockentoleranz auf leichten Sandböden; tief reichendes Wurzelsystem.",
    relErtragSilo: 104.9,
    relErtragKorn: 104.3,
  },
];

function generateBslHistory(v: RawVarietyData): DmkBslRow[] {
  const years = [2021, 2022, 2023, 2024, 2025].filter((y) => y >= v.zulassungsjahr);
  if (years.length === 0) years.push(2025);

  return years.map((yr, idx) => ({
    id: v.sorte_id * 100 + idx,
    sorte_id: v.sorte_id,
    sorte: v.sorte,
    bsl_jahr: yr,
    fahnenschieben: 4 + (v.sorte_id % 3),
    weibliche_bluete_datum: 4 + (v.sorte_id % 3),
    pflanzenlaenge: 6 + (v.sorte_id % 3),
    kaelte: v.korntyp.includes("Hartmais") ? 8 : 6,
    lagerneigung: 2 + (v.sorte_id % 2),
    lagerneigung_k: 2 + (v.sorte_id % 2),
    bestockung: 2,
    stengelfaeule: 2 + (v.sorte_id % 3),
    stengelfaeule_k: 2 + (v.sorte_id % 3),
    gesamttrockenmasse: Math.min(9, Math.round(v.relErtragSilo / 12)),
    kolbentrockenmasse: Math.min(9, Math.round((v.relErtragSilo + v.relErtragKorn) / 24)),
    trockenkolbenanteil: 7,
    staerkegehalt: 6 + (v.sorte_id % 3),
    verdaulichkeit: 6 + (v.sorte_id % 3),
    kornertrag: Math.min(9, Math.round(v.relErtragKorn / 12)),
    tausendkornmasse: 6 + (v.sorte_id % 2),
    abreifegrad_der_blaetter: 5,
    biogasausbeute: 7,
    biogasertrag: Math.min(9, Math.round(v.relErtragSilo / 12)),
  }));
}

function generateTrials(v: RawVarietyData): { byRegion: DmkTrialRegionSummary[]; recentTrials: DmkTrialItem[] } {
  const byRegion: DmkTrialRegionSummary[] = FAKE_REGIONS.map((r, rIdx) => {
    const regionalRel = Math.round((v.relErtragSilo + (rIdx % 5) - 2) * 10) / 10;
    return {
      region: r.region_code,
      region_name: r.name,
      anzahl_jahre: 4,
      total_orte: r.max_standorte ?? 10,
      avg_rel_ertrag: regionalRel,
      avg_gtm_dt: Math.round(regionalRel * 1.95 * 10) / 10,
      avg_ke_dt: v.nutzung_koerner ? Math.round(regionalRel * 1.05 * 10) / 10 : null,
      letztes_jahr: 2025,
    };
  });

  const recentTrials: DmkTrialItem[] = [
    {
      jahr: 2025,
      region: "BY",
      region_name: "Bayern",
      versuchsart: "LSV",
      nutzung: v.nutzung_silo ? "silo" : "koerner",
      merkmal: "ertrag_rel",
      merkmal_name: "Ertrag relativ",
      einheit: "%",
      wert_absolut: null,
      wert_relativ: v.relErtragSilo,
      anzahl_orte: 18,
    },
    {
      jahr: 2024,
      region: "BY",
      region_name: "Bayern",
      versuchsart: "LSV",
      nutzung: v.nutzung_silo ? "silo" : "koerner",
      merkmal: "ertrag_rel",
      merkmal_name: "Ertrag relativ",
      einheit: "%",
      wert_absolut: null,
      wert_relativ: v.relErtragSilo - 0.8,
      anzahl_orte: 17,
    },
    {
      jahr: 2025,
      region: "NI",
      region_name: "Niedersachsen",
      versuchsart: "LSV",
      nutzung: "silo",
      merkmal: "ertrag_rel",
      merkmal_name: "Ertrag relativ",
      einheit: "%",
      wert_absolut: null,
      wert_relativ: v.relErtragSilo + 0.4,
      anzahl_orte: 15,
    },
  ];

  return { byRegion, recentTrials };
}

export const FAKE_VARIETY_DETAILS: DmkVarietyDetail[] = RAW_VARIETIES.map((v) => {
  const bslHistory = generateBslHistory(v);
  const trials = generateTrials(v);

  return {
    sorte: {
      sorte_id: v.sorte_id,
      sorte: v.sorte,
      zuechter: v.zuechter,
      zulassung: v.zulassung,
      zulassungsjahr: v.zulassungsjahr,
      zulassungsland: "DE",
      siloreifezahl: v.siloreifezahl,
      koernerreifezahl: v.koernerreifezahl,
      nutzung_silo: v.nutzung_silo,
      nutzung_koerner: v.nutzung_koerner,
      nutzung_biogas: v.nutzung_biogas,
      hybridtyp: v.hybridtyp,
      korntyp: v.korntyp,
      in_aktueller_bsl: 1,
      notiz: v.notiz,
    },
    bsl: {
      latest: bslHistory[bslHistory.length - 1] ?? null,
      history: bslHistory,
    },
    trials: {
      totalCount: trials.recentTrials.length * 6,
      byRegion: trials.byRegion,
      recentTrials: trials.recentTrials,
    },
  };
});

export function fakeSearchVarieties(params: VarietySearchParams): VarietySearchResult {
  let list = FAKE_VARIETY_DETAILS.map((d) => ({
    sorte_id: d.sorte.sorte_id,
    sorte: d.sorte.sorte,
    zuechter: d.sorte.zuechter,
    zulassung: d.sorte.zulassung,
    zulassungsjahr: d.sorte.zulassungsjahr,
    zulassungsland: d.sorte.zulassungsland,
    siloreifezahl: d.sorte.siloreifezahl,
    koernerreifezahl: d.sorte.koernerreifezahl,
    nutzung_silo: d.sorte.nutzung_silo,
    nutzung_koerner: d.sorte.nutzung_koerner,
    nutzung_biogas: d.sorte.nutzung_biogas,
    in_aktueller_bsl: d.sorte.in_aktueller_bsl,
    anzahl_versuche: d.trials.totalCount,
  }));

  if (params.q) {
    const qLower = params.q.toLowerCase();
    list = list.filter(
      (item) =>
        item.sorte.toLowerCase().includes(qLower) ||
        (item.zuechter && item.zuechter.toLowerCase().includes(qLower))
    );
  }

  if (params.zuechter) {
    const zLower = params.zuechter.toLowerCase();
    list = list.filter((item) => item.zuechter?.toLowerCase() === zLower);
  }

  if (params.nutzung === "silo") {
    list = list.filter((item) => item.nutzung_silo === 1);
  } else if (params.nutzung === "koerner") {
    list = list.filter((item) => item.nutzung_koerner === 1);
  }

  if (params.reifegruppe && params.reifegruppe !== "alle") {
    list = list.filter((item) => {
      const rz = item.siloreifezahl ?? item.koernerreifezahl ?? 240;
      if (params.reifegruppe === "frueh") return rz <= 220;
      if (params.reifegruppe === "mittelfrueh") return rz > 220 && rz <= 250;
      if (params.reifegruppe === "spaet") return rz > 250;
      return true;
    });
  }

  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;
  const items = list.slice(offset, offset + limit);

  return {
    total: list.length,
    items,
    limit,
    offset,
  };
}

export function fakeRegionalStats(regionCode: string): RegionalStats | null {
  const reg = FAKE_REGIONS.find((r) => r.region_code === regionCode);
  if (!reg) return null;

  const topSorten: RegionalTopVariety[] = RAW_VARIETIES.map((v) => {
    const reifegruppe_stufe: "frueh" | "mittelfrueh" | "spaet" =
      (v.siloreifezahl ?? 240) <= 220
        ? "frueh"
        : (v.siloreifezahl ?? 240) <= 250
        ? "mittelfrueh"
        : "spaet";

    return {
      sorte_id: v.sorte_id,
      sorte: v.sorte,
      zuechter: v.zuechter,
      siloreifezahl: v.siloreifezahl,
      koernerreifezahl: v.koernerreifezahl,
      reife_anzeige: v.siloreifezahl ? `S ${v.siloreifezahl}` : `K ${v.koernerreifezahl}`,
      reifegruppe_stufe,
      zulassungsjahr: v.zulassungsjahr,
      nutzung: v.nutzung_silo ? ("silo" as const) : ("koerner" as const),
      jahre_anzahl: 4,
      total_orte: reg.max_standorte ?? 12,
      avg_rel_ertrag: v.relErtragSilo,
      avg_gtm_dt: Math.round(v.relErtragSilo * 1.95 * 10) / 10,
      avg_ke_dt: v.nutzung_koerner ? Math.round(v.relErtragKorn * 1.05 * 10) / 10 : null,
      avg_tsg: 34.2,
      letztes_jahr: 2025,
    };
  }).sort((a, b) => (b.avg_rel_ertrag ?? 0) - (a.avg_rel_ertrag ?? 0));

  const topSortenSilo = topSorten.filter((s) => {
    const raw = RAW_VARIETIES.find((r) => r.sorte_id === s.sorte_id);
    return raw?.nutzung_silo === 1;
  });

  const topSortenKoerner = topSorten.filter((s) => {
    const raw = RAW_VARIETIES.find((r) => r.sorte_id === s.sorte_id);
    return raw?.nutzung_koerner === 1;
  });

  return {
    region: reg,
    totals: {
      datenpunkte: 1240,
      anzahl_sorten: RAW_VARIETIES.length,
      anzahl_jahre: 5,
      min_jahr: 2021,
      max_jahr: 2025,
      summe_standortmessungen: (reg.max_standorte ?? 12) * 48,
      max_standorte: reg.max_standorte ?? 12,
    },
    averages: {
      silomais: {
        avg_gtm_dt: 198.4,
        avg_tsg_prozent: 34.6,
        messungen_gtm: 480,
      },
      koernermais: {
        avg_ke_dt: 108.2,
        avg_tsg_prozent: 68.4,
        messungen_ke: 320,
      },
    },
    topSorten,
    topSortenSilo,
    topSortenKoerner,
  };
}

export function fakeBreedersList(): BreederOption[] {
  const counts: Record<string, number> = {};
  for (const v of RAW_VARIETIES) {
    counts[v.zuechter] = (counts[v.zuechter] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

export function fakeVarietyDetail(idOrName: string | number): DmkVarietyDetail | null {
  const norm = String(idOrName).trim().toLowerCase();
  const found = FAKE_VARIETY_DETAILS.find(
    (d) =>
      String(d.sorte.sorte_id) === norm ||
      d.sorte.sorte.toLowerCase() === norm ||
      d.sorte.sorte.toLowerCase().replace(/\s+/g, "-") === norm
  );
  return found ? JSON.parse(JSON.stringify(found)) : null;
}
