/**
 * Business case calculator per variety and climate scenario: net margin per hectare.
 *
 * Fully transparent calculation model enabling verification by farmers.
 * Net Margin = Revenue - Seed Costs - Drying Costs.
 * Fixed overheads (fertilization, fieldwork) are constant across varieties and do not alter ranking.
 */
import type { BusinessCase, PhenotypePrediction, PriceSheet, Usage } from "../domain/types";

export const KORNFEUCHTE_BASIS = 14;
export const STAERKE_BASIS = 32;

export function businessCase(
  prediction: PhenotypePrediction,
  usage: Usage,
  preise: PriceSheet,
): BusinessCase {
  const saatgutPreis = preise.saatgutEurJeEinheit[prediction.varietyId] ?? 0;
  const saatgutEurHa = saatgutPreis * preise.einheitenJeHa[usage];

  let erloesEurHa = 0;
  let trocknungEurHa = 0;

  if (usage === "koernermais") {
    const ertrag = prediction.kornertragDtHa ?? 0;
    const feuchte = prediction.kornfeuchteProzent ?? KORNFEUCHTE_BASIS;
    erloesEurHa = ertrag * preise.kornpreisEurDt;
    trocknungEurHa =
      ertrag * Math.max(0, feuchte - KORNFEUCHTE_BASIS) * preise.trocknungEurJeDtUndProzent;
  } else {
    const tm = prediction.trockenmasseDtHa ?? 0;
    const staerke = prediction.staerkeProzent ?? STAERKE_BASIS;
    const preisJeDt = preise.silomaisEurDtTm + (staerke - STAERKE_BASIS) * preise.staerkeZuschlagEurDtTm;
    erloesEurHa = tm * preisJeDt;
  }

  return {
    scenarioId: prediction.scenarioId,
    erloesEurHa: round(erloesEurHa),
    saatgutEurHa: round(saatgutEurHa),
    trocknungEurHa: round(trocknungEurHa),
    wertEurHa: round(erloesEurHa - saatgutEurHa - trocknungEurHa),
  };
}

const round = (x: number) => Math.round(x);
