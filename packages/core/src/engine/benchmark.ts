/**
 * Peer benchmarking engine: constructs encouraging, actionable peer comparison statements.
 *
 * Keeps percentiles objective while framing insights constructively.
 */
import type { BenchmarkResult } from "../domain/types";

export function benchmarkStatement(perzentil: number, anzahl: number, eintraege: number): BenchmarkResult {
  let aussage: string;
  if (perzentil >= 80) {
    aussage = `Du gehörst zu den stärksten ${100 - perzentil + 1} % ähnlicher Betriebe.`;
  } else if (perzentil >= 60) {
    aussage = `Du liegst vor ${perzentil} % ähnlicher Betriebe.`;
  } else if (perzentil >= 40) {
    aussage = "Du bist im starken Mittelfeld ähnlicher Betriebe – mit Luft nach oben.";
  } else if (perzentil >= 20) {
    aussage = "Dein Feld hat Reserven, die andere schon nutzen. Genau da setzen wir an.";
  } else {
    aussage = "Dein Feld hat das größte Potenzial in deiner Vergleichsgruppe. Jeder Schritt zählt jetzt doppelt.";
  }

  const hebel =
    eintraege < 3
      ? "Zwei Fotos pro Woche machen deine Prognose genauer und den Vergleich fairer."
      : perzentil >= 60
        ? "Halte deinen Rhythmus: Deine Beobachtungen machen die Empfehlungen für dich und deine Nachbarn besser."
        : "Der größte Hebel liegt jetzt im Wasser: Schau auf die Beregnungshinweise der nächsten Tage.";

  return { perzentil, anzahlVergleichsbetriebe: anzahl, aussage, hebel };
}
