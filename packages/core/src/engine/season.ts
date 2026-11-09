/**
 * In-season accompaniment: growth stages (BBCH), daily operational hints, and photo tasks.
 *
 * Plant protection policy: informational guidance only. Official plant protection recommendations
 * require certification under § 9 PflSchG. Therefore, plant health hints reference human consultation.
 */
import type { FieldHint, GrowthStage, WeatherDay } from "../domain/types";

const DAY_MS = 86_400_000;

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${fromIso}T12:00:00Z`)) / DAY_MS);
}

/** Computes approximate maize phenological growth stage (BBCH scale) from days after sowing. */
export function growthStage(aussaatIso: string, heuteIso: string): GrowthStage {
  const d = daysBetween(aussaatIso, heuteIso);
  const fortschritt = Math.max(0, Math.min(1, d / 160));
  const stage = (bbch: number, name: string): GrowthStage => ({ bbch, name, fortschritt, tageSeitAussaat: d });

  if (d < 0) return stage(0, "Vor der Aussaat");
  if (d < 10) return stage(5, "Keimung");
  if (d < 14) return stage(10, "Auflaufen");
  if (d < 50) {
    const blatt = Math.min(9, 1 + Math.floor((d - 13) / 3.7));
    return stage(10 + blatt, `${blatt}-Blatt-Stadium`);
  }
  if (d < 70) return stage(32 + Math.floor((d - 50) / 4), "Längenwachstum");
  if (d < 80) return stage(55, "Fahnenschieben");
  if (d < 92) return stage(65, "Blüte");
  if (d < 110) return stage(73, "Milchreife");
  if (d < 145) return stage(85, "Teigreife");
  if (d < 160) return stage(87, "Physiologische Reife");
  return stage(99, "Erntereif");
}

export interface HintInput {
  heuteIso: string;
  stadium: GrowthStage;
  vorhersage: WeatherDay[];
}

/**
 * Returns prioritized actionable field hints for the current date.
 */
export function hintsForToday({ heuteIso, stadium, vorhersage }: HintInput): FieldHint[] {
  const hints: FieldHint[] = [];
  const woche = vorhersage.slice(0, 7);
  const regenSumme = woche.reduce((s, d) => s + d.niederschlagMm, 0);
  const heisseTage = woche.filter((d) => d.tMaxC >= 28).length;
  const tMax = Math.max(...woche.map((d) => d.tMaxC));
  const regenTage = woche.filter((d) => d.niederschlagMm >= 1).length;
  const mittelTMax = woche.reduce((s, d) => s + d.tMaxC, 0) / Math.max(woche.length, 1);
  const kritisch = stadium.bbch >= 51 && stadium.bbch <= 69;

  if (stadium.bbch >= 12 && regenSumme < 12 && heisseTage >= 2) {
    hints.push({
      id: "wasser",
      art: "wasser",
      titel: kritisch ? "Jetzt zählt jeder Liter" : "Trockene, warme Woche",
      text: `In den nächsten 7 Tagen fallen nur ${fmt(regenSumme)} mm bei bis zu ${tMax} °C. ${
        kritisch ? "Rund um die Blüte entscheidet Wasser über den Kornansatz." : "Dein Mais wächst jetzt schnell und braucht viel Wasser."
      }`,
      naechsterSchritt: "Wenn du beregnen kannst: diese Woche einplanen, am besten früh morgens.",
      menschFragen: false,
      dringlichkeit: kritisch ? "heute" : "diese-woche",
    });
  }

  if (stadium.bbch >= 30 && regenTage >= 3 && mittelTMax >= 18 && mittelTMax <= 27) {
    hints.push({
      id: "blattkrankheiten",
      art: "krankheit",
      titel: "Feucht-warm: Blätter im Blick behalten",
      text: "Mehrere Regentage bei milden Temperaturen sind gute Bedingungen für Blattkrankheiten wie Turcicum.",
      naechsterSchritt: "Schau dir am Wochenende die unteren Blätter an und mach ein Foto. Wir sagen dir, was es ist.",
      menschFragen: true,
      dringlichkeit: "diese-woche",
    });
  }

  const md = heuteIso.slice(5);
  if (md >= "06-15" && md <= "07-31" && stadium.bbch >= 30) {
    hints.push({
      id: "maiszuensler",
      art: "schaedling",
      titel: "Der Maiszünsler fliegt",
      text: "In deiner Region beginnt jetzt der Flug des Maiszünslers. Die Eiablage folgt in den nächsten Tagen.",
      naechsterSchritt: "Ob und wie du reagierst, besprich mit dem NoMaze-Team. Wir haben die Flugdaten im Blick.",
      menschFragen: true,
      dringlichkeit: "im-blick",
    });
  }

  if (hints.length === 0) {
    hints.push({
      id: "wachstum",
      art: "wachstum",
      titel: "Gute Bedingungen",
      text: `Dein Mais ist im Stadium „${stadium.name}“ und hat, was er braucht.`,
      naechsterSchritt: "Heute ist nichts zu tun. Ein Foto hilft uns trotzdem, die Prognose zu schärfen.",
      menschFragen: false,
      dringlichkeit: "im-blick",
    });
  }

  const order = { heute: 0, "diese-woche": 1, "im-blick": 2 } as const;
  return hints.sort((a, b) => order[a.dringlichkeit] - order[b.dringlichkeit]);
}

/** Returns photographic documentation instructions matched to current growth stage. */
export function photoTask(stadium: GrowthStage): { titel: string; anleitung: string } {
  if (stadium.bbch < 10) return { titel: "Saatbett", anleitung: "Fotografiere den Boden an einer typischen Stelle, aus Hüfthöhe." };
  if (stadium.bbch < 20)
    return { titel: "Jungpflanzen", anleitung: "Fotografiere drei Pflanzen von oben, so dass alle Blätter zu sehen sind." };
  if (stadium.bbch < 51)
    return { titel: "Bestand und Blätter", anleitung: "Ein Foto der Reihe aus Kniehöhe und eins von einem unteren Blatt aus der Nähe." };
  if (stadium.bbch < 70) return { titel: "Fahne und Kolben", anleitung: "Fotografiere eine Fahne und einen Kolben mit Narbenfäden." };
  return { titel: "Kolben", anleitung: "Brich einen Kolben auf und fotografiere die Körner von der Seite." };
}

const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString("de-DE");
