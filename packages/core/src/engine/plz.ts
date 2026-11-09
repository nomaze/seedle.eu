/**
 * Postal code (PLZ) geographic mapping to trial regions and federal states.
 * 2-digit routing prefix table enabling 0ms offline matching.
 */

export interface PlzMatch {
  plz: string;
  regionCode: string;
  regionName: string;
  bundesland: string;
  city: string;
  lat: number;
  lon: number;
  isExactGeocoded?: boolean;
}

export interface PlzZoneInfo {
  regionCode: string;
  regionName: string;
  bundesland: string;
  city: string;
  lat: number;
  lon: number;
}

/**
 * German 2-digit postal routing prefix table (01-99).
 * Maps postal zones to administrative states and agricultural trial regions.
 */
export const PLZ_ZONE_MAP: Record<string, PlzZoneInfo> = {
  // 01-09: Saxony, Saxony-Anhalt, Thuringia
  "01": { regionCode: "SN", regionName: "Sachsen", bundesland: "Sachsen", city: "Dresden / Meißen", lat: 51.0504, lon: 13.7373 },
  "02": { regionCode: "SN", regionName: "Sachsen", bundesland: "Sachsen", city: "Bautzen / Görlitz", lat: 51.1815, lon: 14.4244 },
  "03": { regionCode: "A20", regionName: "Diluviale Böden südl. Ostdeutschland (A20)", bundesland: "Brandenburg", city: "Cottbus / Niederlausitz", lat: 51.7563, lon: 14.3329 },
  "04": { regionCode: "A19", regionName: "Lößstandorte Ost, Oderbruch (A19)", bundesland: "Sachsen", city: "Leipzig / Leipziger Land", lat: 51.3397, lon: 12.3731 },
  "06": { regionCode: "A19", regionName: "Lößstandorte Ost, Oderbruch (A19)", bundesland: "Sachsen-Anhalt", city: "Halle (Saale) / Mitteldeutschland", lat: 51.4828, lon: 11.9698 },
  "07": { regionCode: "A18", regionName: "Übergangslagen Ost (A18)", bundesland: "Thüringen", city: "Gera / Jena / Saale-Holzland", lat: 50.8765, lon: 12.0833 },
  "08": { regionCode: "A18", regionName: "Übergangslagen Ost (A18)", bundesland: "Sachsen", city: "Zwickau / Plauen / Vogtland", lat: 50.7189, lon: 12.4922 },
  "09": { regionCode: "A18", regionName: "Übergangslagen Ost (A18)", bundesland: "Sachsen", city: "Chemnitz / Erzgebirge", lat: 50.8278, lon: 12.9214 },

  // 10-19: Berlin, Brandenburg, Mecklenburg-Vorpommern
  "10": { regionCode: "BB", regionName: "Brandenburg & Berlin", bundesland: "Berlin", city: "Berlin Zentrum", lat: 52.5200, lon: 13.4050 },
  "12": { regionCode: "BB", regionName: "Brandenburg & Berlin", bundesland: "Berlin", city: "Berlin Süd", lat: 52.4439, lon: 13.5284 },
  "13": { regionCode: "BB", regionName: "Brandenburg & Berlin", bundesland: "Berlin", city: "Berlin Nord", lat: 52.5855, lon: 13.3444 },
  "14": { regionCode: "A20", regionName: "Diluviale Böden südl. Ostdeutschland (A20)", bundesland: "Brandenburg", city: "Potsdam / Havelland", lat: 52.3906, lon: 13.0645 },
  "15": { regionCode: "A19", regionName: "Lößstandorte Ost, Oderbruch (A19)", bundesland: "Brandenburg", city: "Frankfurt (Oder) / Oderbruch", lat: 52.3425, lon: 14.5511 },
  "16": { regionCode: "A21", regionName: "Diluviale Böden nördl. Ostdeutschland (A21)", bundesland: "Brandenburg", city: "Eberswalde / Uckermark", lat: 52.8333, lon: 13.8167 },
  "17": { regionCode: "A21", regionName: "Diluviale Böden nördl. Ostdeutschland (A21)", bundesland: "Mecklenburg-Vorpommern", city: "Neubrandenburg / Vorpommern", lat: 53.5566, lon: 13.2612 },
  "18": { regionCode: "MV", regionName: "Mecklenburg-Vorpommern", bundesland: "Mecklenburg-Vorpommern", city: "Rostock / Ostseeküste", lat: 54.0924, lon: 12.1286 },
  "19": { regionCode: "MV", regionName: "Mecklenburg-Vorpommern", bundesland: "Mecklenburg-Vorpommern", city: "Schwerin / Westmecklenburg", lat: 53.6355, lon: 11.4012 },

  // 20-29: Hamburg, Schleswig-Holstein, Niedersachsen
  "20": { regionCode: "SH", regionName: "Schleswig-Holstein & Hamburg", bundesland: "Hamburg", city: "Hamburg Mitte", lat: 53.5511, lon: 9.9937 },
  "21": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Lüneburg / Stade / Elbe-Weser", lat: 53.2464, lon: 10.4115 },
  "22": { regionCode: "SH", regionName: "Schleswig-Holstein", bundesland: "Schleswig-Holstein", city: "Hamburg Nord / Ahrensburg", lat: 53.6702, lon: 10.0232 },
  "23": { regionCode: "SH", regionName: "Schleswig-Holstein", bundesland: "Schleswig-Holstein", city: "Lübeck / Ostholstein", lat: 53.8655, lon: 10.6866 },
  "24": { regionCode: "SH", regionName: "Schleswig-Holstein", bundesland: "Schleswig-Holstein", city: "Kiel / Rendsburg / Flensburg", lat: 54.3233, lon: 10.1228 },
  "25": { regionCode: "SH", regionName: "Schleswig-Holstein", bundesland: "Schleswig-Holstein", city: "Elmshorn / Dithmarschen / Marsch", lat: 54.1203, lon: 9.1123 },
  "26": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Oldenburg / Ostfriesland", lat: 53.1435, lon: 8.2146 },
  "27": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Bremerhaven / Cuxhaven", lat: 53.5414, lon: 8.5809 },
  "28": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Bremen", city: "Bremen / Umland", lat: 53.0793, lon: 8.8017 },
  "29": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Celle / Uelzen / Heide", lat: 52.6247, lon: 10.0814 },

  // 30-39: Niedersachsen, NRW, Hessen, Sachsen-Anhalt
  "30": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Hannover", lat: 52.3759, lon: 9.7320 },
  "31": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Hildesheim / Hameln / Peine", lat: 52.1548, lon: 9.9579 },
  "32": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Herford / Minden / Lippe", lat: 52.1158, lon: 8.6725 },
  "33": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Bielefeld / Paderborn / Gütersloh", lat: 51.7189, lon: 8.7575 },
  "34": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Kassel / Nordhessen", lat: 51.3127, lon: 9.4797 },
  "35": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Gießen / Marburg / Mittelhessen", lat: 50.5841, lon: 8.6784 },
  "36": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Fulda / Bad Hersfeld / Rhön", lat: 50.5528, lon: 9.6756 },
  "37": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Göttingen / Northeim / Holzminden", lat: 51.5413, lon: 9.9158 },
  "38": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Braunschweig / Wolfsburg / Harzvorland", lat: 52.2689, lon: 10.5268 },
  "39": { regionCode: "A19", regionName: "Lößstandorte Ost, Oderbruch (A19)", bundesland: "Sachsen-Anhalt", city: "Magdeburg / Magdeburger Börde", lat: 52.1205, lon: 11.6276 },

  // 40-49: Nordrhein-Westfalen & Niedersachsen
  "40": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Düsseldorf / Mettmann", lat: 51.2277, lon: 6.7735 },
  "41": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Mönchengladbach / Neuss / Niederrhein", lat: 51.1805, lon: 6.4428 },
  "42": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Wuppertal / Solingen / Bergisches Land", lat: 51.2562, lon: 7.1508 },
  "44": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Dortmund / Bochum / Ruhrgebiet Ost", lat: 51.5136, lon: 7.4653 },
  "45": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Essen / Gelsenkirchen / Ruhrgebiet", lat: 51.4556, lon: 7.0116 },
  "46": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Oberhausen / Wesel / Westmünsterland", lat: 51.6567, lon: 6.8592 },
  "47": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Duisburg / Krefeld / Kleve", lat: 51.4344, lon: 6.7623 },
  "48": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Münster / Münsterland / Steinfurt", lat: 51.9607, lon: 7.6261 },
  "49": { regionCode: "NI", regionName: "Niedersachsen", bundesland: "Niedersachsen", city: "Osnabrück / Emsland / Grafschaft Bentheim", lat: 52.2799, lon: 8.0472 },

  // 50-59: NRW & Rheinland-Pfalz
  "50": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Köln / Kölner Bucht", lat: 50.9375, lon: 6.9603 },
  "51": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Leverkusen / Bergisch Gladbach / Oberberg", lat: 51.0459, lon: 7.0192 },
  "52": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Aachen / Düren / Jülicher Börde", lat: 50.7753, lon: 6.0839 },
  "53": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Bonn / Euskirchen / Zülpicher Börde", lat: 50.7374, lon: 7.0982 },
  "54": { regionCode: "RP", regionName: "Rheinland-Pfalz", bundesland: "Rheinland-Pfalz", city: "Trier / Bitburg / Vulkaneifel", lat: 49.7561, lon: 6.6414 },
  "55": { regionCode: "RP", regionName: "Rheinland-Pfalz", bundesland: "Rheinland-Pfalz", city: "Mainz / Bad Kreuznach / Rheinhessen", lat: 49.9929, lon: 8.2473 },
  "56": { regionCode: "RP", regionName: "Rheinland-Pfalz", bundesland: "Rheinland-Pfalz", city: "Koblenz / Neuwied / Westerwald / Hunsrück", lat: 50.3569, lon: 7.5890 },
  "57": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Siegen / Olpe / Südsauerland", lat: 50.8748, lon: 8.0243 },
  "58": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Hagen / Märkischer Kreis / Ennepe", lat: 51.3671, lon: 7.4633 },
  "59": { regionCode: "NRW", regionName: "Nordrhein-Westfalen", bundesland: "Nordrhein-Westfalen", city: "Hamm / Soest / Lippstadt / Soester Börde", lat: 51.5714, lon: 8.1065 },

  // 60-69: Hesse, Rhineland-Palatinate, Saarland, Baden-Wuerttemberg
  "60": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Frankfurt am Main", lat: 50.1109, lon: 8.6821 },
  "61": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Bad Homburg / Friedberg / Wetterau", lat: 50.2289, lon: 8.6105 },
  "63": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Hanau / Offenbach / Main-Kinzig", lat: 50.1328, lon: 8.9169 },
  "64": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Darmstadt / Bergstraße / Odenwald", lat: 49.8728, lon: 8.6512 },
  "65": { regionCode: "HE", regionName: "Hessen", bundesland: "Hessen", city: "Wiesbaden / Rheingau-Taunus / Limburg", lat: 50.0826, lon: 8.2400 },
  "66": { regionCode: "RP", regionName: "Rheinland-Pfalz & Saarland", bundesland: "Saarland", city: "Saarbrücken / Saarpfalz", lat: 49.2402, lon: 6.9969 },
  "67": { regionCode: "RP", regionName: "Rheinland-Pfalz", bundesland: "Rheinland-Pfalz", city: "Ludwigshafen / Kaiserslautern / Vorderpfalz", lat: 49.4774, lon: 8.4452 },
  "68": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Mannheim / Kurpfalz", lat: 49.4875, lon: 8.4660 },
  "69": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Heidelberg / Kraichgau", lat: 49.3988, lon: 8.6724 },

  // 70-79: Baden-Wuerttemberg
  "70": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Stuttgart", lat: 48.7758, lon: 9.1829 },
  "71": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Böblingen / Ludwigsburg / Gäu", lat: 48.6872, lon: 9.0125 },
  "72": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Tübingen / Reutlingen / Neckar-Alb", lat: 48.5216, lon: 9.0576 },
  "73": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Esslingen / Göppingen / Ostalb", lat: 48.7394, lon: 9.3134 },
  "74": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Heilbronn / Franken / Hohenlohe", lat: 49.1427, lon: 9.2109 },
  "75": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Pforzheim / Nordschwarzwald", lat: 48.8932, lon: 8.7050 },
  "76": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Karlsruhe / Mittlerer Oberrhein", lat: 49.0069, lon: 8.4037 },
  "77": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Offenburg / Südlicher Oberrhein", lat: 48.4738, lon: 7.9449 },
  "78": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Villingen-Schwenningen / Konstanz / Bodensee", lat: 48.0588, lon: 8.4604 },
  "79": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Freiburg / Breisgau / Markgräflerland", lat: 47.9990, lon: 7.8421 },

  // 80-89: Bavaria & southern Baden-Wuerttemberg
  "80": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "München", lat: 48.1351, lon: 11.5820 },
  "81": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "München Umland", lat: 48.1158, lon: 11.6025 },
  "82": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Starnberg / Weilheim / Oberland", lat: 47.9984, lon: 11.3418 },
  "83": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Rosenheim / Chiemgau / Inntal", lat: 47.8561, lon: 12.1289 },
  "84": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Landshut / Niederbayern / Rottal", lat: 48.5442, lon: 12.1528 },
  "85": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Freising / Ingolstadt / Hallertau", lat: 48.4028, lon: 11.7489 },
  "86": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Augsburg / Donauwörth / Schwaben", lat: 48.3705, lon: 10.8978 },
  "87": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Kempten / Memmingen / Allgäu", lat: 47.7286, lon: 10.3158 },
  "88": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Ravensburg / Friedrichshafen / Oberschwaben", lat: 47.6544, lon: 9.4797 },
  "89": { regionCode: "BW", regionName: "Baden-Württemberg", bundesland: "Baden-Württemberg", city: "Ulm / Neu-Ulm / Donau-Iller", lat: 48.4011, lon: 9.9876 },

  // 90-99: Bavaria & Thuringia
  "90": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Nürnberg / Fürth / Mittelfranken", lat: 49.4521, lon: 11.0767 },
  "91": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Erlangen / Forchheim / Fränkische Schweiz", lat: 49.5897, lon: 11.0039 },
  "92": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Amberg / Weiden / Oberpfalz", lat: 49.4446, lon: 11.8624 },
  "93": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Regensburg / Straubing / Gäuboden", lat: 49.0134, lon: 12.1016 },
  "94": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Passau / Deggendorf / Bayerischer Wald", lat: 48.5665, lon: 13.4312 },
  "95": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Bayreuth / Hof / Fichtelgebirge", lat: 49.9456, lon: 11.5713 },
  "96": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Bamberg / Coburg / Obermain", lat: 49.8988, lon: 10.9028 },
  "97": { regionCode: "BY", regionName: "Bayern", bundesland: "Bayern", city: "Würzburg / Schweinfurt / Mainfranken", lat: 49.7913, lon: 9.9534 },
  "98": { regionCode: "A18", regionName: "Übergangslagen Ost (A18)", bundesland: "Thüringen", city: "Suhl / Meiningen / Thüringer Wald", lat: 50.6106, lon: 10.6931 },
  "99": { regionCode: "A18", regionName: "Übergangslagen Ost (A18)", bundesland: "Thüringen", city: "Erfurt / Weimar / Thüringer Becken", lat: 50.9848, lon: 11.0299 },
};

/**
 * Fast deterministic offline lookup based on 2 to 5 digits of a postal code.
 */
export function lookupPlzOffline(plz: string): PlzMatch | null {
  const digits = plz.replace(/\D/g, "");
  if (digits.length < 2) return null;

  const prefix = digits.slice(0, 2);
  const info = PLZ_ZONE_MAP[prefix];
  if (!info) return null;

  return {
    plz: digits,
    regionCode: info.regionCode,
    regionName: info.regionName,
    bundesland: info.bundesland,
    city: info.city,
    lat: info.lat,
    lon: info.lon,
    isExactGeocoded: false,
  };
}
