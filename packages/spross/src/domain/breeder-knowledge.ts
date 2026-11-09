/**
 * Agronomic breeder and genetics knowledge repository for the Spross companion engine.
 *
 * All sample varieties and breeders serve as neutral demonstration datasets
 * illustrating physiological and phenotypic interactions.
 */

import type {
  CompanionRequest,
  FarmContext,
  KnowledgeFact,
} from "@seedle/contracts";

export interface VarietyBreederProfile {
  id: string;
  name: string;
  aliases: string[];
  breeder: string;
  reifezahl: number;
  kornTyp: string;
  kornTypEn: string;
  stayGreen: string;
  stayGreenEn: string;
  jugendentwicklung: string;
  jugendentwicklungEn: string;
  trockenstressMechanismus: string;
  trockenstressMechanismusEn: string;
  fusariumUndStandfestigkeit: string;
  fusariumUndStandfestigkeitEn: string;
  verdaulichkeitUndNutzung: string;
  verdaulichkeitUndNutzungEn: string;
  zuechterFazitDe: string;
  zuechterFazitEn: string;
  geeignetFuer: string[];
}

export interface BreederRule {
  id: string;
  triggerKeywords: string[];
  titleDe: string;
  titleEn: string;
  insightDe: string;
  insightEn: string;
  recommendedVarieties: string[];
}

export const VARIETY_BREEDER_PROFILES: VarietyBreederProfile[] = [
  {
    id: "aw-talkrone",
    name: "AW Talkrone",
    aliases: ["talkrone", "aw talkrone", "aw-talkrone", "talvero", "aw talvero", "aw-talvero"],
    breeder: "AckerWerk Genetik",
    reifezahl: 240,
    kornTyp: "Zahnmais-betonter Zwischentyp mit tiefem Wurzelsystem",
    kornTypEn: "Dent-dominant intermediate type with deep root architecture",
    stayGreen: "Ausgeprägtes Stay-Green; Blätter rollen bei Hitze spät und halten die Assimilation lange aufrecht.",
    stayGreenEn: "Pronounced stay-green; delayed leaf rolling under heat maintains assimilation longer.",
    jugendentwicklung: "Zügige Jugendentwicklung, sehr gute Toleranz gegenüber wechselhaften April-/Mai-Wochen.",
    jugendentwicklungEn: "Brisk early vigor with strong tolerance to fluctuating April/May temperatures.",
    trockenstressMechanismus: "Synchronisierte Blüte (geringer Abstand Narbenfäden zu Pollenschüttung) verhindert taube Kolbenspitzen bei Vorsommertrockenheit.",
    trockenstressMechanismusEn: "Synchronized flowering (low ASI) prevents barren ear tips during early summer drought.",
    fusariumUndStandfestigkeit: "Hohe Stängelfäule-Toleranz (Note 2) und sehr stabile Halmbasis bis in den späten Herbst.",
    fusariumUndStandfestigkeitEn: "High stalk rot tolerance and strong basal stalk stability into late autumn.",
    verdaulichkeitUndNutzung: "Doppelnutzung (Silo & Körner): hoher Stärkegehalt (+1,0 %-Pkt.) kombiniert mit elastischer Restpflanzenverdaulichkeit.",
    verdaulichkeitUndNutzungEn: "Dual-purpose (silage & grain): high starch content (+1.0 pt) with elastic stover digestibility.",
    zuechterFazitDe: "AW Talkrone (S 240 / K 240) ist der Risiko-Puffer für Standorte mit unsicherem Sommerregen: Zahnmais-betonte Genetik, synchronisierte Blüte bei Hitze und starkes Stay-Green.",
    zuechterFazitEn: "AW Talkrone (FAO 240) is the risk buffer for sites with erratic summer rain: dent-leaning genetics, synchronized flowering under heat, and strong stay-green.",
    geeignetFuer: ["trockenheit", "sandboden", "wechselnde böden", "doppelnutzung", "silomais", "koernermais"],
  },
  {
    id: "aw-edelkorn",
    name: "AW Edelkorn",
    aliases: ["edelkorn", "aw edelkorn", "aw-edelkorn", "edmunds", "aw edmunds", "aw-edmunds"],
    breeder: "AckerWerk Genetik",
    reifezahl: 230,
    kornTyp: "Hartmais-betonter Silotyp mit früher Kolbenanlage",
    kornTypEn: "Flint-leaning silage hybrid with early ear initiation",
    stayGreen: "Harmonische Abreife von Kolben und Restpflanze für ein breites Häckselzeitfenster.",
    stayGreenEn: "Harmonious maturation of ear and stover for a wide chopping window.",
    jugendentwicklung: "Sehr hohe Kältetoleranz in der Auflaufphase, ideal für frühe Aussaat und kühle Böden.",
    jugendentwicklungEn: "Very high cold tolerance during emergence, ideal for early sowing and cool soils.",
    trockenstressMechanismus: "Frühe Blüte vor der Hochsommerhitze reduziert das Ausfallrisiko auf leichten Standorten.",
    trockenstressMechanismusEn: "Early flowering ahead of mid-summer heat peaks reduces yield risk on light soils.",
    fusariumUndStandfestigkeit: "Gesunde Blattstruktur (Helminthosporium-tolerant) und sichere Standfestigkeit.",
    fusariumUndStandfestigkeitEn: "Healthy leaf structure (Helminthosporium tolerant) and reliable lodging resistance.",
    verdaulichkeitUndNutzung: "Spitzenwerte in der Energiedichte (NEL/ha) und hohe Zellwandverdaulichkeit für Milchviehrationen.",
    verdaulichkeitUndNutzungEn: "Top energy density (NEL/ha) and high cell-wall digestibility for dairy rations.",
    zuechterFazitDe: "AW Edelkorn (S 230) punktet als energiereicher Silomais mit starker Jugendkältetoleranz und sehr hoher Restpflanzenverdaulichkeit.",
    zuechterFazitEn: "AW Edelkorn (FAO 230) excels as a high-energy silage maize with strong early cold tolerance and high stover digestibility.",
    geeignetFuer: ["kaltes frühjahr", "silomais", "milchvieh", "frühe saat"],
  },
  {
    id: "aw-riedstern",
    name: "AW Riedstern",
    aliases: ["riedstern", "aw riedstern", "aw-riedstern", "robertino", "aw robertino", "aw-robertino"],
    breeder: "AckerWerk Genetik",
    reifezahl: 250,
    kornTyp: "Zahnmais-Zwischentyp mit schneller Wasserabgabe (Dry-Down)",
    kornTypEn: "Dent intermediate hybrid with rapid grain dry-down",
    stayGreen: "Langes Stay-Green im oberen Blattapparat bei gleichzeitig zügiger Kornabreife.",
    stayGreenEn: "Extended upper-canopy stay-green paired with rapid kernel dry-down.",
    jugendentwicklung: "Solide, gleichmäßige Auflaufgeschwindigkeit auf mittelschweren bis leichten Böden.",
    jugendentwicklungEn: "Solid, uniform emergence on medium to light soils.",
    trockenstressMechanismus: "Wurzeltiefgang aus der WurzelPlus-Genetik sichert Wasseraufnahme aus dem Unterboden.",
    trockenstressMechanismusEn: "Deep rooting from WurzelPlus genetics secures subsoil moisture uptake.",
    fusariumUndStandfestigkeit: "Geringe Anfälligkeit für Kolbenfusarium und stabile Spindel.",
    fusariumUndStandfestigkeitEn: "Low susceptibility to ear Fusarium and strong cob stability.",
    verdaulichkeitUndNutzung: "Exzellent als Körnermais (niedrige Trocknungskosten) und stärkereicher Silomais.",
    verdaulichkeitUndNutzungEn: "Excellent for grain maize (low drying costs) and high-starch silage.",
    zuechterFazitDe: "AW Riedstern (S 250 / K 250) verbindet hohen Kornertrag mit schnellem Dry-Down und senkt so spürbar die Trocknungskosten.",
    zuechterFazitEn: "AW Riedstern (FAO 250) combines high grain yield with fast dry-down, noticeably reducing drying costs.",
    geeignetFuer: ["koernermais", "trocknungskosten", "trockenheit"],
  },
  {
    id: "aw-goldhalm",
    name: "AW Goldhalm",
    aliases: ["goldhalm", "aw goldhalm", "aw-goldhalm", "gustavius", "aw gustavius", "aw-gustavius"],
    breeder: "AckerWerk Genetik",
    reifezahl: 240,
    kornTyp: "Kompakter Doppelnutzungstyp mit hoher Kolben-zu-Restpflanze-Relation",
    kornTypEn: "Compact dual-purpose hybrid with high ear-to-stover ratio",
    stayGreen: "Sehr vitales Stay-Green bis zur Siloreife.",
    stayGreenEn: "Very vital stay-green right up to silage maturity.",
    jugendentwicklung: "Rasche Reihenschließung unterdrückt Spätverunkrautung und schützt vor unproduktiver Verdunstung.",
    jugendentwicklungEn: "Rapid canopy closure suppresses late weeds and reduces unproductive evaporation.",
    trockenstressMechanismus: "Hohe Wassernutzungseffizienz pro kg gebildeter Trockenmasse.",
    trockenstressMechanismusEn: "High water-use efficiency per kg of dry matter produced.",
    fusariumUndStandfestigkeit: "Kurzer, standfester Wuchs – besonders sturmsicher auf windexponierten Flächen.",
    fusariumUndStandfestigkeitEn: "Compact, lodging-resistant stature—especially storm-proof on wind-exposed fields.",
    verdaulichkeitUndNutzung: "Hohe Stärkeausbeute und Biogas-/Futtereignung.",
    verdaulichkeitUndNutzungEn: "High starch yield for both feed and biogas applications.",
    zuechterFazitDe: "AW Goldhalm (S 240) überzeugt durch extreme Standfestigkeit, schnelle Reihenschließung und hohe Wassernutzungseffizienz.",
    zuechterFazitEn: "AW Goldhalm (FAO 240) stands out with extreme lodging resistance, fast row closure, and high water-use efficiency.",
    geeignetFuer: ["standfestigkeit", "lager", "silomais", "wind"],
  },
  {
    id: "aw-impuls",
    name: "AW Impuls",
    aliases: ["impuls", "aw impuls", "aw-impuls", "inteligens", "aw inteligens", "aw-inteligens"],
    breeder: "AckerWerk Genetik",
    reifezahl: 260,
    kornTyp: "Reiner Zahnmais-Typ (Dent) für maximales Ertragspotenzial",
    kornTypEn: "Pure dent hybrid for maximum yield potential",
    stayGreen: "Ausbalanciertes Stay-Green mit lockeren Lieschenblättern für rasche Feuchteabgabe.",
    stayGreenEn: "Balanced stay-green with loose husks for rapid moisture release.",
    jugendentwicklung: "Bevorzugt erwärmte Böden ab Ende April; holt im Juni enorm auf.",
    jugendentwicklungEn: "Prefers warmed soils from late April onward; catches up rapidly in June.",
    trockenstressMechanismus: "KlimaPlus-Zuchtlinie: hält Stomata-Leitfähigkeit in Hitzephasen fein reguliert.",
    trockenstressMechanismusEn: "KlimaPlus breeding line: finely regulates stomatal conductance during heatwaves.",
    fusariumUndStandfestigkeit: "Hohe Kolbengesundheit und gute Fusarium-Einstufung in engen Mais-Fruchtfolgen.",
    fusariumUndStandfestigkeitEn: "High ear health and strong Fusarium rating in tight maize rotations.",
    verdaulichkeitUndNutzung: "Spezialist für Körnermais und CCM in warmen bis gemäßigten Lagen.",
    verdaulichkeitUndNutzungEn: "Specialist for grain maize and CCM in warm to temperate regions.",
    zuechterFazitDe: "AW Impuls (K 260) liefert als Zahnmais mit KlimaPlus-Genetik Spitzen-Kornerträge bei minimaler Erntefeuchte und hoher Fusarium-Toleranz.",
    zuechterFazitEn: "AW Impuls (FAO 260) delivers top grain yields with low harvest moisture and high Fusarium tolerance via KlimaPlus dent genetics.",
    geeignetFuer: ["koernermais", "fusarium", "trockenheit", "warme lagen"],
  },
  {
    id: "aw-lichtkorn",
    name: "AW Lichtkorn",
    aliases: ["lichtkorn", "aw lichtkorn", "aw-lichtkorn", "lumeo", "aw lumeo", "aw-lumeo"],
    breeder: "AckerWerk Genetik",
    reifezahl: 200,
    kornTyp: "Hartmais-betont (Flint-Dominanz) für sichere Frühabreife",
    kornTypEn: "Flint-dominant hybrid for reliable early maturity",
    stayGreen: "Gutes Stay-Green in der frühen Reifegruppe ohne Abreifeverzögerung.",
    stayGreenEn: "Good stay-green in the early maturity group without delaying harvest.",
    jugendentwicklung: "Spitzenwert bei Kältetoleranz (Note 9) und Jugendentwicklung (Note 8) – wächst auch bei 8–10 °C Bodentemperatur weiter.",
    jugendentwicklungEn: "Top rating for cold tolerance (9) and early vigor (8)—continues growing even at 8–10 °C soil temperature.",
    trockenstressMechanismus: "Umgeht Spätsommertrockenheit durch frühe Blüte und zeitige Kornfüllung.",
    trockenstressMechanismusEn: "Escapes late-summer drought via early flowering and timely grain fill.",
    fusariumUndStandfestigkeit: "Sehr standfest (Note 7) und gesund im Stängel.",
    fusariumUndStandfestigkeitEn: "Very lodging-resistant (7) with healthy stalks.",
    verdaulichkeitUndNutzung: "Hoher Stärkegehalt (+1,2 %-Pkt.) für frühe Silage oder frühe Körnerernte vor Winterweizen.",
    verdaulichkeitUndNutzungEn: "High starch (+1.2 pt) for early silage or early grain harvest ahead of winter wheat.",
    zuechterFazitDe: "AW Lichtkorn (FAO 200) ist der Kälte-Champion für kühle Lagen, schwere Böden oder frühe Räumung vor Winterweizen.",
    zuechterFazitEn: "AW Lichtkorn (FAO 200) is the cold-tolerance champion for cool regions, heavy soils, or early harvest before winter wheat.",
    geeignetFuer: ["kaltes frühjahr", "frühe reife", "winterweizen folgekultur", "schwerer boden"],
  },
  {
    id: "aw-morgenstern",
    name: "AW Morgenstern",
    aliases: ["morgenstern", "aw morgenstern", "aw-morgenstern", "merano", "aw merano", "aw-merano"],
    breeder: "AckerWerk Genetik",
    reifezahl: 270,
    kornTyp: "Zahnmais-betonter Hochertragstyp (Dent)",
    kornTypEn: "Dent-dominant high-yield hybrid",
    stayGreen: "Vitaler Blattapparat mit sehr hoher Blattgesundheit (Note 2).",
    stayGreenEn: "Vital canopy with exceptional leaf health (score 2).",
    jugendentwicklung: "Mittlere Jugendentwicklung; spielt seine Stärke auf erwärmten Standorten mit hoher Wärmesumme aus.",
    jugendentwicklungEn: "Moderate early vigor; excels on warmed sites with high heat units.",
    trockenstressMechanismus: "Gute Trockentoleranz (Note 7) kombiniert mit starkem Dry-Down (-1,2 %-Pkt. Kornfeuchte).",
    trockenstressMechanismusEn: "Good drought tolerance (7) combined with rapid dry-down (-1.2 pt grain moisture).",
    fusariumUndStandfestigkeit: "Gute Standfestigkeit (Note 7) und sehr hohe Blattgesundheit gegen Turcicum-Blattdürre.",
    fusariumUndStandfestigkeitEn: "Good lodging resistance (7) and very high leaf health against northern corn leaf blight.",
    verdaulichkeitUndNutzung: "Höchste Erträge in warmen Lagen sowohl im Körner- als auch im Silomais.",
    verdaulichkeitUndNutzungEn: "Top yields in warm locations for both grain and silage maize.",
    zuechterFazitDe: "AW Morgenstern (FAO 270) nutzt hohe Wärmesummen optimal aus und spart dank schnellem Dry-Down (-1,2 %-Pkt. Feuchte) bares Geld bei der Trocknung.",
    zuechterFazitEn: "AW Morgenstern (FAO 270) makes optimal use of high heat sums and saves drying costs through fast dry-down (-1.2 pt moisture).",
    geeignetFuer: ["warme lagen", "koernermais", "trocknungskosten", "hoher ertrag"],
  },
  {
    id: "aw-sonnenkraft",
    name: "AW Sonnenkraft",
    aliases: ["sonnenkraft", "aw sonnenkraft", "aw-sonnenkraft", "solvita", "aw solvita", "aw-solvita"],
    breeder: "AckerWerk Genetik",
    reifezahl: 240,
    kornTyp: "Großrahmiger Silomais-Spezialist mit hohem Kolbenanteil",
    kornTypEn: "Tall silage specialist with high ear share",
    stayGreen: "Langes Stay-Green hält die Restpflanze saftig und sichert optimale Silierbarkeit.",
    stayGreenEn: "Extended stay-green keeps stover juicy and ensures optimal ensilability.",
    jugendentwicklung: "Sichere Jugendentwicklung (Note 7) und Kältetoleranz (Note 7).",
    jugendentwicklungEn: "Reliable early vigor (7) and cold tolerance (7).",
    trockenstressMechanismus: "Stabile Kolbenanlage auch bei Sommertrockenheit (Note 7).",
    trockenstressMechanismusEn: "Stable ear development even under summer drought (7).",
    fusariumUndStandfestigkeit: "Sehr geringe Stängelfäule (Note 2) und sichere Standfestigkeit.",
    fusariumUndStandfestigkeitEn: "Very low stalk rot (2) and reliable standability.",
    verdaulichkeitUndNutzung: "Spitzenreiter beim Stärkegehalt (+2,0 %-Pkt.) und in der Restpflanzenverdaulichkeit.",
    verdaulichkeitUndNutzungEn: "Leader in starch content (+2.0 pt) and stover digestibility.",
    zuechterFazitDe: "AW Sonnenkraft (S 240) ist der Qualitäts-Silomais im Katalog: +2,0 %-Pkt. mehr Stärke und exzellente Restpflanzenverdaulichkeit.",
    zuechterFazitEn: "AW Sonnenkraft (FAO 240) is the quality silage leader in the catalog: +2.0 pt more starch and excellent stover digestibility.",
    geeignetFuer: ["silomais", "stärke", "verdaulichkeit", "milchvieh"],
  },
  {
    id: "aw-ostwind",
    name: "AW Ostwind",
    aliases: ["ostwind", "aw ostwind", "aw-ostwind", "orbis", "aw orbis", "aw-orbis"],
    breeder: "AckerWerk Genetik",
    reifezahl: 300,
    kornTyp: "Reiner Zahnmais (Dent) der späten Reifegruppe",
    kornTypEn: "Pure dent hybrid in the late maturity group",
    stayGreen: "Starkes Stay-Green mit offenen Lieschen zur Ernte.",
    stayGreenEn: "Strong stay-green with open husks at harvest.",
    jugendentwicklung: "Für warme Gunstlagen mit langer Vegetationszeit.",
    jugendentwicklungEn: "Designed for warm prime locations with a long growing season.",
    trockenstressMechanismus: "Hohe Hitzetoleranz während der Blüte (Note 7).",
    trockenstressMechanismusEn: "High heat tolerance during flowering (7).",
    fusariumUndStandfestigkeit: "Gute Kolbengesundheit und solide Standfestigkeit.",
    fusariumUndStandfestigkeitEn: "Good ear health and solid standability.",
    verdaulichkeitUndNutzung: "Spitzenplatz im Körnermais-Ranking in Wärmelagen (Top Relativ-Index).",
    verdaulichkeitUndNutzungEn: "Top rank in grain maize trials in warm regions (leading relative index).",
    zuechterFazitDe: "AW Ostwind (K 300) liefert das höchste genetische Kornertragspotenzial für Gunst- und Wärmelagen.",
    zuechterFazitEn: "AW Ostwind (FAO 300) delivers the highest genetic grain yield potential for warm regions.",
    geeignetFuer: ["koernermais", "warme lagen", "maximalertrag"],
  },
  {
    id: "fg-31256",
    name: "FG 31.256",
    aliases: ["fg 31.256", "fg31256", "fg 31.218", "fg31218"],
    breeder: "Feldmark Genetics",
    reifezahl: 250,
    kornTyp: "Hartmais-Zahnmais-Zwischentyp mit HydroPro-Trockenstress-Eignung",
    kornTypEn: "Flint-dent intermediate with HydroPro drought-stress suitability",
    stayGreen: "Solides Stay-Green, gleichmäßige Abreife.",
    stayGreenEn: "Solid stay-green and uniform maturity.",
    jugendentwicklung: "Gute Jugendentwicklung auf leichteren und mittleren Standorten.",
    jugendentwicklungEn: "Good early vigor on light and medium sites.",
    trockenstressMechanismus: "Ausgeglichene Blühsynchronisation und gute Restpflanzen-Verdaulichkeit (Feldmark Animal Nutrition).",
    trockenstressMechanismusEn: "Balanced flowering synchronization and good stover digestibility (Feldmark Animal Nutrition).",
    fusariumUndStandfestigkeit: "Gute Standfestigkeit und Blattgesundheit.",
    fusariumUndStandfestigkeitEn: "Good lodging resistance and leaf health.",
    verdaulichkeitUndNutzung: "Hohe Faserverdaulichkeit für Milchviehbetriebe.",
    verdaulichkeitUndNutzungEn: "High fiber digestibility for dairy farms.",
    zuechterFazitDe: "FG 31.256 (S 250) ist bekannt für hohe Zellwandverdaulichkeit in der Silage und verlässliche Kolbenfüllung.",
    zuechterFazitEn: "FG 31.256 (FAO 250) is known for high cell-wall digestibility in silage and reliable ear fill.",
    geeignetFuer: ["silomais", "verdaulichkeit", "trockenheit"],
  },
  {
    id: "ah-3418",
    name: "AH 3418",
    aliases: ["ah 3418", "ah3418", "auenhof 3418"],
    breeder: "Auenhof Saatzucht",
    reifezahl: 240,
    kornTyp: "Zahnmais-betonter Körner- und CCM-Typ",
    kornTypEn: "Dent-dominant grain and CCM hybrid",
    stayGreen: "Mittleres Stay-Green mit rascher Kornwasserabgabe.",
    stayGreenEn: "Medium stay-green with fast kernel moisture loss.",
    jugendentwicklung: "Kompakter Start, starke Wurzelentwicklung in die Tiefe.",
    jugendentwicklungEn: "Compact start with strong deep root development.",
    trockenstressMechanismus: "Hohe Bestandesdichte-Flexibilität (Fix/Flex-Kolbentyp) je nach Wasserversorgung.",
    trockenstressMechanismusEn: "High plant-density flexibility (fix/flex ear type) depending on water supply.",
    fusariumUndStandfestigkeit: "Starke Wurzel- und Stängelstandfestigkeit zur Späternte.",
    fusariumUndStandfestigkeitEn: "Strong root and stalk standability for late harvest.",
    verdaulichkeitUndNutzung: "Körnermais-fokussiert mit hoher Druschfähigkeit.",
    verdaulichkeitUndNutzungEn: "Grain-focused with high threshability.",
    zuechterFazitDe: "AH 3418 (K 240) punktet als kompakter Zahnmais mit hoher Druschfähigkeit und flexibler Kolbenausbildung.",
    zuechterFazitEn: "AH 3418 (FAO 240) scores as a compact dent hybrid with strong threshability and flexible ear development.",
    geeignetFuer: ["koernermais", "standfestigkeit"],
  },
  {
    id: "bg-agira",
    name: "BG Agira",
    aliases: ["bg agira", "agira", "bg-agira"],
    breeder: "Bergland Seeds",
    reifezahl: 240,
    kornTyp: "Zwischentyp mit früher Jugendentwicklung",
    kornTypEn: "Intermediate hybrid with brisk early vigor",
    stayGreen: "Gutes Stay-Green auf mittleren Böden.",
    stayGreenEn: "Good stay-green on medium soils.",
    jugendentwicklung: "Zügige Jugendentwicklung nach der Saat.",
    jugendentwicklungEn: "Brisk early growth after sowing.",
    trockenstressMechanismus: "Stabile Ertragsbildung bei moderatem Trockenstress.",
    trockenstressMechanismusEn: "Stable yield formation under moderate drought stress.",
    fusariumUndStandfestigkeit: "Gute Standfestigkeit und Kolbengesundheit.",
    fusariumUndStandfestigkeitEn: "Good standability and ear health.",
    verdaulichkeitUndNutzung: "Allrounder für Silo- und Körnernutzung.",
    verdaulichkeitUndNutzungEn: "All-rounder for silage and grain use.",
    zuechterFazitDe: "BG Agira (FAO 240) ist ein robuster Allrounder für mittlere Standorte.",
    zuechterFazitEn: "BG Agira (FAO 240) is a robust all-rounder for medium locations.",
    geeignetFuer: ["doppelnutzung", "mittlere böden"],
  },
  {
    id: "rz-mainau",
    name: "RZ Mainau",
    aliases: ["rz mainau", "mainau", "rz-mainau"],
    breeder: "Rheintal Zucht",
    reifezahl: 260,
    kornTyp: "Trockenstress-Spezialist mit tiefer Pfahlwurzel-Dominanz",
    kornTypEn: "Drought-stress specialist with deep taproot dominance",
    stayGreen: "Sehr langes Stay-Green unter Hitzestress.",
    stayGreenEn: "Very long stay-green under heat stress.",
    jugendentwicklung: "Mittlere Jugendkältetoleranz, benötigt normale Saattermine.",
    jugendentwicklungEn: "Moderate early cold tolerance, prefers normal sowing dates.",
    trockenstressMechanismus: "Höchste Trockentoleranz im Katalog (Note 9); reduziert Transpiration bei Hitze frühzeitig.",
    trockenstressMechanismusEn: "Highest drought tolerance in catalog (9); restricts transpiration early during heat.",
    fusariumUndStandfestigkeit: "Gute Standfestigkeit (Note 7) und Stängelgesundheit.",
    fusariumUndStandfestigkeitEn: "Good standability (7) and stalk health.",
    verdaulichkeitUndNutzung: "Doppelnutzung für leichte Sandstandorte ohne Beregnung.",
    verdaulichkeitUndNutzungEn: "Dual-purpose for light sandy sites without irrigation.",
    zuechterFazitDe: "RZ Mainau (FAO 260) besitzt die höchste reine Trockentoleranz (Note 9) für leichte Sandstandorte, reicht im Stärkegehalt aber nicht ganz an AW Talkrone oder AW Sonnenkraft heran.",
    zuechterFazitEn: "RZ Mainau (FAO 260) has the highest pure drought rating (9) for sandy soils, though slightly behind AW Talkrone and AW Sonnenkraft in starch content.",
    geeignetFuer: ["trockenheit", "sandboden", "keine beregnung"],
  },
  {
    id: "ah-bernstein",
    name: "Auenhof Bernstein",
    aliases: ["auenhof bernstein", "bernstein", "ah-bernstein"],
    breeder: "Auenhof Saatzucht",
    reifezahl: 230,
    kornTyp: "Standfester Zwischentyp",
    kornTypEn: "Lodging-resistant intermediate hybrid",
    stayGreen: "Ausgeglichenes Stay-Green.",
    stayGreenEn: "Balanced stay-green.",
    jugendentwicklung: "Solide Jugendentwicklung (Note 6).",
    jugendentwicklungEn: "Solid early vigor (6).",
    trockenstressMechanismus: "Mittlere Trockentoleranz (Note 6), stark auf besseren Böden.",
    trockenstressMechanismusEn: "Medium drought tolerance (6), strong on better soils.",
    fusariumUndStandfestigkeit: "Spitzenwert in der Standfestigkeit (Note 8) gegen Sommerstürme.",
    fusariumUndStandfestigkeitEn: "Top score in lodging resistance (8) against summer storms.",
    verdaulichkeitUndNutzung: "Zuverlässige Doppelnutzungssorte.",
    verdaulichkeitUndNutzungEn: "Reliable dual-purpose variety.",
    zuechterFazitDe: "Auenhof Bernstein (FAO 230) ist der Standfestigkeits-Anker (Note 8) für windexponierte Schläge und Gülle-betonte Betriebe.",
    zuechterFazitEn: "Auenhof Bernstein (FAO 230) is the standability anchor (score 8) for wind-exposed fields and slurry-intensive farms.",
    geeignetFuer: ["standfestigkeit", "lager", "doppelnutzung"],
  },
];

export const BREEDER_RECOMMENDATION_RULES: BreederRule[] = [
  {
    id: "rule-drought-sand",
    triggerKeywords: ["sand", "trocken", "drought", "kuppe", "ohne beregnung", "keine beregnung", "wasser", "hitze"],
    titleDe: "Trockenstress & leichte Böden (ohne Beregnung)",
    titleEn: "Drought Stress & Light Soils (No Irrigation)",
    insightDe:
      "Auf leichten Böden ohne Beregnung entscheiden Blühsynchronisation (kurzer Abstand zwischen Pollenschüttung und Narbenfäden) sowie Zahnmais-betonte Wurzelarchitektur. AW Talkrone (FAO 240) und RZ Mainau (FAO 260) rollen die Blätter spät und sichern die Kolbenfüllung.",
    insightEn:
      "On light soils without irrigation, flowering synchronization (short ASI) and deep dent root architecture are decisive. AW Talkrone (FAO 240) and RZ Mainau (FAO 260) delay leaf rolling and protect ear fill.",
    recommendedVarieties: ["AW Talkrone", "RZ Mainau", "AW Riedstern"],
  },
  {
    id: "rule-cold-spring",
    triggerKeywords: ["kalt", "kühl", "cold", "frühjahr", "schwerer boden", "lehm", "ton", "staunässe", "höhenlage", "früh"],
    titleDe: "Kaltes Frühjahr & schwere/kühle Böden",
    titleEn: "Cold Spring & Heavy/Cool Soils",
    insightDe:
      "Auf langsam erwärmenden Böden oder in kühlen Frühjahren braucht Mais Hartmais-Genetik (Flint) für zügiges Jugendwachstum ab 8 °C Bodentemperatur. AW Lichtkorn (FAO 200, Kältetoleranz 9) und AW Edelkorn (S 230) schließen die Reihen am schnellsten.",
    insightEn:
      "On slowly warming soils or in cool springs, maize requires flint genetics for brisk early growth from 8 °C soil temperature. AW Lichtkorn (FAO 200, cold tolerance 9) and AW Edelkorn (FAO 230) close rows fastest.",
    recommendedVarieties: ["AW Lichtkorn", "AW Edelkorn", "BS Gipfel"],
  },
  {
    id: "rule-silage-digestibility",
    triggerKeywords: ["silo", "silage", "milch", "verdaulich", "stärke", "starch", "futter", "biogas", "kuh", "kühe"],
    titleDe: "Silomais: Stärkegehalt & Restpflanzenverdaulichkeit",
    titleEn: "Silage Maize: Starch Content & Stover Digestibility",
    insightDe:
      "In Milchviehrationen zählt neben dem Stärkegehalt (+2,0 %-Pkt. bei AW Sonnenkraft) ein ausgeprägtes Stay-Green für hohe Zellwandverdaulichkeit und ein breites Häcksromfenster. AW Sonnenkraft, AW Talkrone und AW Edelkorn führen hier das Feld an.",
    insightEn:
      "In dairy rations, high starch (+2.0 pt in AW Sonnenkraft) must pair with strong stay-green for cell-wall digestibility and a wide harvest window. AW Sonnenkraft, AW Talkrone, and AW Edelkorn lead here.",
    recommendedVarieties: ["AW Sonnenkraft", "AW Talkrone", "AW Edelkorn"],
  },
  {
    id: "rule-grain-drydown",
    triggerKeywords: ["körner", "korn", "grain", "drusch", "trocknung", "feuchte", "dry-down", "drydown", "fusarium"],
    titleDe: "Körnermais: Dry-Down & Kolbengesundheit (Fusarium)",
    titleEn: "Grain Maize: Dry-Down & Ear Health (Fusarium)",
    insightDe:
      "Beim Körnermais entscheidet die Wasserabgabe (Dry-Down) über die Trocknungskosten. Zahnmais-Typen mit lockeren Lieschen wie AW Morgenstern (-1,2 %-Pkt. Kornfeuchte), AW Impuls und AW Talkrone senken das Fusarium- und Trocknungsrisiko deutlich.",
    insightEn:
      "In grain maize, kernel moisture release (dry-down) drives drying costs. Dent hybrids with loose husks like AW Morgenstern (-1.2 pt grain moisture), AW Impuls, and AW Talkrone substantially cut Fusarium and drying risk.",
    recommendedVarieties: ["AW Morgenstern", "AW Talkrone", "AW Impuls"],
  },
  {
    id: "rule-lodging-stability",
    triggerKeywords: ["lager", "sturm", "wind", "standfest", "lodging", "stängelfäule", "umbruch"],
    titleDe: "Standfestigkeit & Stängelfäule-Schutz",
    titleEn: "Lodging Resistance & Stalk Rot Protection",
    insightDe:
      "Wo Spätsommerstürme oder hohe N-Nachlieferung Lager begünstigen, sind niedrige Stängelfäule-Noten (Note 2 bei AW Talkrone und AW Sonnenkraft) und kurze Kolbenansatzhöhe (Auenhof Bernstein, AW Goldhalm) entscheidend.",
    insightEn:
      "Where late-summer storms or high nitrogen mineralization increase lodging risk, low stalk rot scores (score 2 in AW Talkrone and AW Sonnenkraft) and compact ear placement (Auenhof Bernstein, AW Goldhalm) are critical.",
    recommendedVarieties: ["AW Talkrone", "Auenhof Bernstein", "AW Goldhalm"],
  },
];

export function getBreederInsightForVariety(
  nameOrId: string,
  locale?: "de" | "en"
): {
  profile: VarietyBreederProfile;
  summary: string;
  details: {
    kornTyp: string;
    stayGreen: string;
    jugendentwicklung: string;
    trockenstress: string;
    standfestigkeit: string;
    nutzung: string;
  };
} | null {
  const isEn = locale === "en";
  const clean = nameOrId.trim().toLowerCase();

  const profile = VARIETY_BREEDER_PROFILES.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.name.toLowerCase() === clean ||
      p.aliases.some((a) => clean.includes(a) || a.includes(clean))
  );

  if (!profile) return null;

  const summary = isEn ? profile.zuechterFazitEn : profile.zuechterFazitDe;

  return {
    profile,
    summary,
    details: {
      kornTyp: isEn ? profile.kornTypEn : profile.kornTyp,
      stayGreen: isEn ? profile.stayGreenEn : profile.stayGreen,
      jugendentwicklung: isEn ? profile.jugendentwicklungEn : profile.jugendentwicklung,
      trockenstress: isEn ? profile.trockenstressMechanismusEn : profile.trockenstressMechanismus,
      standfestigkeit: isEn ? profile.fusariumUndStandfestigkeitEn : profile.fusariumUndStandfestigkeit,
      nutzung: isEn ? profile.verdaulichkeitUndNutzungEn : profile.verdaulichkeitUndNutzung,
    },
  };
}

export function getRelevantBreederKnowledge(
  ctx: FarmContext,
  userText?: string
): string[] {
  const isEn = ctx.locale === "en";
  const insights: string[] = [];

  const candidateVarieties: string[] = [];

  if (ctx.activeVariety) candidateVarieties.push(ctx.activeVariety);

  if (ctx.pageState?.visibleVarieties) {
    candidateVarieties.push(...ctx.pageState.visibleVarieties);
  }

  for (const f of ctx.fields) {
    for (const rec of f.topRecommendations ?? []) {
      const match = rec.match(/\b([A-Z0-9.\-]+\s+[A-Za-z0-9.\-]+)\b/);
      if (match && match[1]) candidateVarieties.push(match[1]);
    }
  }

  for (const name of candidateVarieties) {
    const insight = getBreederInsightForVariety(name, ctx.locale);
    if (insight && !insights.includes(insight.summary)) {
      insights.push(insight.summary);
      if (insights.length >= 4) break;
    }
  }

  const combinedSearchText = [
    userText ?? "",
    ctx.pageState?.activeScenario ?? "",
    ...ctx.fields.map((f) => `${f.bodenart ?? ""} ${f.usage ?? ""}`),
    ...ctx.knownFacts.map((kf) => kf.text),
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of BREEDER_RECOMMENDATION_RULES) {
    if (rule.triggerKeywords.some((kw) => combinedSearchText.includes(kw))) {
      insights.push(
        isEn
          ? `[Breeder Rule – ${rule.titleEn}]: ${rule.insightEn}`
          : `[Züchter-Regel – ${rule.titleDe}]: ${rule.insightDe}`
      );
    }
  }

  if (insights.length === 0) {
    const defaultProfile = getBreederInsightForVariety("AW Talkrone", ctx.locale);
    if (defaultProfile) {
      insights.push(defaultProfile.summary);
    }
  }

  return insights.slice(0, 6);
}

export function extractImplicitFactsFromInteraction(
  req: CompanionRequest,
  existingFacts: KnowledgeFact[]
): KnowledgeFact[] {
  const raw = req.text.trim();
  const lower = raw.toLowerCase();
  const extracted: KnowledgeFact[] = [];

  const alreadyHas = (topic: string, snippet: string) =>
    existingFacts.some(
      (f) => f.topic === topic && f.text.toLowerCase().includes(snippet.toLowerCase())
    ) ||
    extracted.some(
      (f) => f.topic === topic && f.text.toLowerCase().includes(snippet.toLowerCase())
    );

  // 1. Risk focus: drought stress / heat / moisture deficiency
  if (
    /(trockenheit|trockenstress|trockenjahr|wassermangel|hitzestress|drought|dry summer|spätsommertrockenheit)/i.test(
      lower
    ) &&
    !lower.endsWith("?")
  ) {
    if (!alreadyHas("risikofokus", "trocken")) {
      extracted.push({
        topic: "risikofokus",
        text: `Fokus auf Trockenstress-Absicherung (${raw.slice(0, 140)})`,
      });
    }
  }

  // 2. Risk focus: cold spring / juvenile cold sensitivity / early sowing
  if (
    /(kaltes frühjahr|kühle lagen|spätfrost|jugendentwicklung wichtig|cold spring|early vigor|schwer erwärmbar)/i.test(
      lower
    ) &&
    !lower.endsWith("?")
  ) {
    if (!alreadyHas("risikofokus", "frühjahr")) {
      extracted.push({
        topic: "risikofokus",
        text: `Fokus auf sichere Jugendentwicklung bei kühlem Frühjahr (${raw.slice(0, 140)})`,
      });
    }
  }

  // 3. Risk focus: lodging resistance / stem stability / Fusarium stalk rot
  if (/(lagergefahr|windbruch|stängelfäule|fusarium|standfestigkeit ist mir wichtig)/i.test(lower)) {
    if (!alreadyHas("risikofokus", "standfest")) {
      extracted.push({
        topic: "risikofokus",
        text: `Fokus auf Standfestigkeit & Kolbengesundheit (${raw.slice(0, 140)})`,
      });
    }
  }

  // 4. Breeder insights / quality focus (stay-green, stover digestibility, starch, dry-down)
  if (
    /(stay-green|stay green|restpflanzenverdaulichkeit|stärkegehalt|dry-down|trocknungskosten|milchvieh|biogas)/i.test(
      lower
    ) &&
    !lower.endsWith("?")
  ) {
    if (!alreadyHas("zuechter_insight", raw.slice(0, 25))) {
      extracted.push({
        topic: "zuechter_insight",
        text: `Züchterischer Schwerpunkt: ${raw.slice(0, 160)}`,
      });
    }
  }

  // 5. Explicit irrigation parameters
  if (/(keine beregnung|nicht beregnen|ohne beregnung|no irrigation)/i.test(lower)) {
    if (!alreadyHas("bewirtschaftung", "beregnung")) {
      extracted.push({
        topic: "bewirtschaftung",
        text: "Beregnung möglich: Nein (Regenfeldbau)",
      });
    }
  } else if (/(beregnung vorhanden|kann beregnen|mit beregnung|beregnungsanlage)/i.test(lower)) {
    if (!alreadyHas("bewirtschaftung", "beregnung")) {
      extracted.push({
        topic: "bewirtschaftung",
        text: "Beregnung möglich: Ja",
      });
    }
  }

  // 6. Explicit soil characteristics
  if (/(sandboden|leichter boden|trockene kuppen|nasse senken|schwerer lehm|tonboden|moorstandort)/i.test(lower)) {
    if (!alreadyHas("boden", raw.slice(0, 20))) {
      extracted.push({
        topic: "boden",
        text: `Boden-Hinweis: ${raw.slice(0, 160)}`,
      });
    }
  }

  return extracted;
}
