import {
  KNOWLEDGE_TOPIC_LABEL,
  type FarmContext,
  type KnowledgeTopic,
} from "@seedle/contracts";
import { getRelevantBreederKnowledge } from "./breeder-knowledge";

export const SPROSS_SYSTEM_PROMPT = `Du bist Spross 2.0, der digitale Live-Page-Co-Pilot und Züchterwissens-Begleiter von NoMaze. Du bist ein gekeimtes Samenkorn mit einem ersten Blatt: freundlich, neugierig, bodenständig und fachlich präzise. Du bist eine KI und gibst dich nie als Mensch aus.

Du sprichst mit Landwirtinnen und Landwirten in Deutschland (auf Deutsch per Du, oder auf Englisch, wenn locale="en" aktiv ist). Sie kennen ihre Felder besser als jedes Modell. Du belehrst nicht und bevormundest nicht; du fragst nach, hörst zu und verknüpfst ihr Hofwissen mit tiefem Züchterwissen.

Deine vier Kernaufgaben:
1. Live Page Co-Pilot sein: Du siehst genau, auf welcher Seite und in welchem Schritt sich der Landwirt befindet, welche Filter oder Klimaszenarien aktiv sind und welche Sorten gerade sichtbar sind. Wenn er etwas filtern, vergleichen, ein Szenario umschalten oder den nächsten Schritt gehen möchte, erklärst du es kurz und gibst passende UI-Aktionen (uiActions) zurück.
2. Züchterwissen (Breeder Intelligence) einbringen: Erkläre Sorten nicht nur über Euro/ha, sondern über ihre echte Agronomie und Genetik (Zahnmais vs. Hartmais, Blühsynchronisation bei Hitze, Stay-Green, Jugendentwicklung bei kühlen Frühjahren, Dry-Down / Wasserabgabe, Kolbenfusarium, Restpflanzenverdaulichkeit).
3. Langzeitgedächtnis aktiv nutzen & aufbauen: Beziehe dich natürlich auf bereits gespeicherte Hof-Fakten („Weil du erwähnt hast, dass dein Standort nicht beregnet wird..."). Sammle beiläufig neues Erfahrungswissen (Fruchtfolge, Sortenerfahrungen, Boden, Beregnung, Risikofokus, Züchter-Präferenzen). Stell pro Antwort höchstens eine Rückfrage, und frag nichts, was im Kontext schon steht.
4. Klarer Abgrenzungsrahmen & Seriosität: Nenne NIEMALS absolute Erträge in dt/ha oder dt TM/ha (das wirkt unseriös). Sprich immer von Rangplätzen (Platz 1, Platz 2), Relativ-Erträgen in Prozent (%) gegenüber dem Standort-Mittel und BSA-Eigenschaftsnoten (1 bis 9). Bei Pflanzenschutz und Düngung nennst du keine Mittel, Aufwandmengen oder Behandlungsentscheidungen, sondern verweist an das NoMaze-Team. Biete keine Versicherungen oder ungebetenen Zusatzprodukte an.

Stil: kompakt (zwei bis vier Sätze), warm, bodenständig und konkret auf die aktuelle Ansicht bezogen.`;

/**
 * Assembles the deterministic contextual prompt for the LLM runtime from FarmContext,
 * incorporating active page state, multi-year crop history (fieldYears), and breeder insights.
 */
export function buildContextPrompt(ctx: FarmContext, userText?: string): string {
  const locale = ctx.locale ?? "de";
  const lines: string[] = [
    `# Kontext (heute: ${ctx.heuteIso}, Planungssaison ${ctx.saison}, Sprache/Locale: ${locale})`,
  ];

  if (locale === "en") {
    lines.push(
      "WICHTIG: Der Nutzer verwendet die englische Oberfläche (locale=en). Antworte auf Englisch (inklusive vorschlaege und uiActions-Labels)!"
    );
  }

  const route = ctx.pageState?.route ?? ctx.seite;
  if (route) {
    lines.push(`Aktuelle Seite / Route: ${route}`);
  }
  if (ctx.pageState?.stepLabel) {
    lines.push(`Aktueller Prozessschritt auf der Seite: ${ctx.pageState.stepLabel}`);
  }
  if (ctx.pageState?.nextBestAction) {
    lines.push(`Empfohlener nächster Schritt auf der Seite: ${ctx.pageState.nextBestAction}`);
  }
  if (ctx.pageState?.activeScenario) {
    lines.push(`Aktives Klimaszenario auf der Seite: ${ctx.pageState.activeScenario}`);
  }
  if (ctx.pageState?.activeFilters && Object.keys(ctx.pageState.activeFilters).length > 0) {
    const filterPairs = Object.entries(ctx.pageState.activeFilters)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    lines.push(`Aktive Filter auf der Seite: ${filterPairs}`);
  }
  if (ctx.pageState?.visibleVarieties && ctx.pageState.visibleVarieties.length > 0) {
    lines.push(`Gerade auf dem Bildschirm sichtbare Sorten: ${ctx.pageState.visibleVarieties.join(", ")}`);
  }
  if (ctx.pageState?.availableTargets && ctx.pageState.availableTargets.length > 0) {
    lines.push(`Steuerbare UI-Elemente auf dieser Seite: ${ctx.pageState.availableTargets.join(", ")}`);
  }
  if (ctx.pageState?.missingInfo && ctx.pageState.missingInfo.length > 0) {
    lines.push(`Noch fehlende Angaben auf dieser Seite: ${ctx.pageState.missingInfo.join(", ")}`);
  }

  if (ctx.activeRegion) {
    lines.push(`Der Landwirt betrachtet Versuchsdaten für die Region / Bundesland: ${ctx.activeRegion}.`);
  }
  if (ctx.activeVariety) {
    lines.push(
      `Der Landwirt hat aktuell die Sorte „${ctx.activeVariety}“ im Steckbrief geöffnet. Beziehe dich bei Fragen bevorzugt auf diese Sorte, ihre Züchter-Genetik, Trockenheitsstabilität und den Vergleich mit Mitbewerbern.`
    );
  }

  if (ctx.farm) {
    const ortInfo = [ctx.farm.plz, ctx.farm.ort].filter(Boolean).join(" ");
    lines.push(`Hof: „${ctx.farm.name}“${ortInfo ? ` (${ortInfo})` : ""}`);
  }

  if (ctx.fields.length === 0) {
    lines.push(
      "Er hat noch kein Feld angelegt. Auf der Startseite (/) heißt der Hauptbutton „Persönliche Empfehlung“ (target: feld-button) und der zweite Button „Stöbern“ (target: daten-button). Auf /feld/neu heißt der Button nach Kartenklick „Weiter mit diesem Feld“. Auf /daten heißt das Eingabefeld „Postleitzahl deines Betriebs“ (target: plz-input) und der GPS-Button „Meinen Standort nutzen“. Nenne immer exakt die echten Button-Namen der aktuellen Seite!"
    );
  }

  for (const f of ctx.fields.slice(0, 5)) {
    lines.push(
      `\n## Feld „${f.name}“ (${f.areaHa} ha${f.region ? `, ${f.region}` : ""})`,
      `Ackerzahl ${f.ackerzahl ?? "unbekannt"}, Bodenart ${f.bodenart ?? "unbekannt"}, Sommerregen ${f.niederschlagVegetationMm ?? "?"} mm, Jahresmittel ${f.temperaturC ?? "?"} °C, Wärmesumme ${f.waermesumme ?? "?"} Gradtage, ${f.hoeheM ?? "?"} m.`
    );
    if (f.usage) lines.push(`Nutzung: ${f.usage}.`);
    if (f.previousVariety) lines.push(`Bisherige Sorte: ${f.previousVariety}.`);
    if (f.selectedVariety) lines.push(`Gewählte Sorte für ${ctx.saison}: ${f.selectedVariety}.`);
    if (f.fieldYears && f.fieldYears.length > 0) {
      const rotation = f.fieldYears
        .map(
          (fy) =>
            `${fy.jahr}: ${fy.crop}${fy.varietyText || fy.varietyId ? ` (${fy.varietyText ?? fy.varietyId})` : ""} [${fy.status}]`
        )
        .join(", ");
      lines.push(`Mehrjährige Anbauhistorie (Fruchtfolge): ${rotation}.`);
    }
    if (f.topRecommendations && f.topRecommendations.length > 0) {
      lines.push(`Ranking ${ctx.saison}: ${f.topRecommendations.join("; ")}.`);
    }
  }

  if (ctx.knownFacts.length > 0) {
    lines.push("\n## Gespeichertes Hofwissen (nutze dies aktiv in deiner Argumentation!)");
    for (const fact of ctx.knownFacts.slice(0, 30)) {
      const topicLabel = KNOWLEDGE_TOPIC_LABEL[fact.topic as KnowledgeTopic] ?? fact.topic;
      const jahrSuffix = fact.jahr ? ` ${fact.jahr}` : "";
      lines.push(`- ${topicLabel}${jahrSuffix}: ${fact.text}`);
    }
  }

  const breederInsights = getRelevantBreederKnowledge(ctx, userText);
  if (breederInsights.length > 0) {
    lines.push("\n## Fachliches Züchterwissen & Sortengenetik (Breeder Knowledge)");
    for (const insight of breederInsights) {
      lines.push(`- ${insight}`);
    }
  }

  lines.push(
    "\nAlle Versuchs-, Wetter- und Modelldaten sind derzeit Demodaten. Wenn er sich nach der Herkunft erkundigt, sag das offen."
  );
  return lines.join("\n");
}
