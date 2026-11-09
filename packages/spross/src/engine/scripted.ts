import type {
  KnowledgeFact,
  KnowledgeTopic,
  PageViewState,
  SprossUiAction,
} from "@seedle/contracts";
import {
  extractImplicitFactsFromInteraction,
  getBreederInsightForVariety,
  VARIETY_BREEDER_PROFILES,
} from "../domain/breeder-knowledge";
import { hashString } from "../utils/hash";

export interface ScriptQuestion {
  key: string;
  topic: KnowledgeTopic;
  jahr?: number;
  frage: string;
  frageEn?: string;
  vorschlaege: string[];
  vorschlaegeEn?: string[];
  alsWissen: (antwort: string) => string;
}

export function scriptQuestions(saison: number): ScriptQuestion[] {
  const letztes = saison - 1;
  const vorletztes = saison - 2;
  return [
    {
      key: `fruchtfolge:${letztes}`,
      topic: "fruchtfolge",
      jahr: letztes,
      frage: `Erzähl mal: Was stand ${letztes} auf deinem Feld?`,
      frageEn: `Tell me: What grew on your field in ${letztes}?`,
      vorschlaege: ["Winterweizen", "Mais", "Raps", "Zuckerrüben", "Gerste"],
      vorschlaegeEn: ["Winter wheat", "Maize", "Rapeseed", "Sugar beet", "Barley"],
      alsWissen: (a) => a,
    },
    {
      key: `fruchtfolge:${vorletztes}`,
      topic: "fruchtfolge",
      jahr: vorletztes,
      frage: `Und ${vorletztes}?`,
      frageEn: `And in ${vorletztes}?`,
      vorschlaege: ["Winterweizen", "Mais", "Raps", "Zuckerrüben", "Gerste"],
      vorschlaegeEn: ["Winter wheat", "Maize", "Rapeseed", "Sugar beet", "Barley"],
      alsWissen: (a) => a,
    },
    {
      key: "sorte",
      topic: "sorte",
      frage: "Wenn du dort schon Mais hattest: Welche Sorte war es, und wie zufrieden warst du damit?",
      frageEn: "If you grew maize there before: Which variety was it, and how satisfied were you?",
      vorschlaege: ["Sehr zufrieden", "Ging so", "Weiß ich nicht mehr"],
      vorschlaegeEn: ["Very satisfied", "It was okay", "Don't remember"],
      alsWissen: (a) => `Zur bisherigen Maissorte: ${a}`,
    },
    {
      key: "erfahrung:gut",
      topic: "erfahrung",
      frage: "Was läuft auf diesem Feld richtig gut? Da bist du der Experte.",
      frageEn: "What works really well on this field? You're the expert.",
      vorschlaege: ["Guter Boden", "Sichere Erträge", "Früh befahrbar"],
      vorschlaegeEn: ["Good soil", "Reliable yields", "Early trafficability"],
      alsWissen: (a) => `Läuft gut: ${a}`,
    },
    {
      key: "erfahrung:schwierig",
      topic: "erfahrung",
      frage: "Und wo hakt es manchmal?",
      frageEn: "And where do challenges sometimes show up?",
      vorschlaege: ["Trockenheit", "Lager", "Wildschäden", "Unkraut", "Staunässe"],
      vorschlaegeEn: ["Drought", "Lodging", "Game damage", "Weeds", "Waterlogging"],
      alsWissen: (a) => `Schwierig: ${a}`,
    },
    {
      key: "bewirtschaftung:beregnung",
      topic: "bewirtschaftung",
      frage: "Kannst du das Feld beregnen? Dann rechne ich dir den Wasserbedarf genauer aus.",
      frageEn: "Can you irrigate this field? That helps me factor water availability more accurately.",
      vorschlaege: ["Ja", "Nein", "Teilweise"],
      vorschlaegeEn: ["Yes", "No", "Partially"],
      alsWissen: (a) => `Beregnung möglich: ${a}`,
    },
    {
      key: "boden:teilflaechen",
      topic: "boden",
      frage: "Gibt es Stellen im Feld, die anders sind, zum Beispiel nasse Senken oder trockene Kuppen?",
      frageEn: "Are there spots in the field that behave differently, such as wet hollows or dry knolls?",
      vorschlaege: ["Ja, nasse Senken", "Ja, trockene Kuppen", "Nein, recht einheitlich"],
      vorschlaegeEn: ["Yes, wet hollows", "Yes, dry knolls", "No, fairly uniform"],
      alsWissen: (a) => `Teilflächen: ${a}`,
    },
  ];
}

export interface ScriptedReply {
  text: string;
  askedKey?: string;
  vorschlaege: string[];
  fact?: KnowledgeFact;
  extraFacts?: KnowledgeFact[];
  uiActions?: SprossUiAction[];
}

const DANKE_DE = [
  "Danke, notiert.",
  "Gut zu wissen!",
  "Das merk ich mir.",
  "Danke dir, das hilft mir.",
  "Spannend, danke!",
];

const DANKE_EN = [
  "Thanks, noted.",
  "Good to know!",
  "I'll remember that.",
  "Thanks, that helps me tailor your ranking.",
  "Great insight, thank you!",
];

export function openingMessage(
  saison: number,
  bekannteKeys: Set<string>,
  locale: "de" | "en" = "de"
): ScriptedReply {
  const next = nextQuestion(saison, bekannteKeys);
  if (locale === "en") {
    const introEn =
      "Hi, I'm Spross. I help you find the best variety for your field—and I love learning from you, because you know your soil better than any model.";
    return next
      ? {
          text: `${introEn}\n\n${next.frageEn ?? next.frage}`,
          askedKey: next.key,
          vorschlaege: next.vorschlaegeEn ?? next.vorschlaege,
        }
      : {
          text: `${introEn}\n\nAsk me anything about your varieties or current view.`,
          vorschlaege: ["Why this variety?", "Filter for drought year"],
        };
  }

  const intro =
    "Hallo, ich bin Spross. Ich helfe dir, die beste Sorte für dein Feld zu finden. Und ich lerne gern von dir, denn du kennst dein Feld besser als jedes Modell.";
  return next
    ? { text: `${intro}\n\n${next.frage}`, askedKey: next.key, vorschlaege: next.vorschlaege }
    : {
        text: `${intro}\n\nFrag mich gern alles zu deinen Sorten.`,
        vorschlaege: ["Warum diese Sorte?", "Wie rechnet ihr?"],
      };
}

function buildKnownFactReference(
  knownFacts: KnowledgeFact[] | undefined,
  locale: "de" | "en"
): string {
  if (!knownFacts || knownFacts.length === 0) return "";
  const latest = knownFacts[0]!;
  if (locale === "en") {
    return ` Because you mentioned "${latest.text}", I'm weighing that directly in this recommendation.`;
  }
  return ` Weil du bereits erwähnt hast (${latest.text}), berücksichtige ich das direkt bei dieser Einschätzung.`;
}

export function scriptedReply(input: {
  text: string;
  saison: number;
  askedKey?: string;
  bekannteKeys: Set<string>;
  activeVariety?: string;
  activeRegion?: string;
  locale?: "de" | "en";
  pageState?: PageViewState;
  knownFacts?: KnowledgeFact[];
}): ScriptedReply {
  const locale = input.locale ?? "de";
  const isEn = locale === "en";
  const t = input.text.toLowerCase();
  const visibleFirst = input.pageState?.visibleVarieties?.[0];
  const variety = input.activeVariety || visibleFirst || (isEn ? "this variety" : "diese Sorte");
  const implicitFacts = extractImplicitFactsFromInteraction(
    {
      text: input.text,
      locale,
      pageState: input.pageState,
      activeVariety: input.activeVariety,
    },
    input.knownFacts ?? []
  );
  const firstImplicit = implicitFacts[0];
  const restImplicit = implicitFacts.slice(1);
  const memoryRef = buildKnownFactReference(input.knownFacts, locale);

  // 1. Human advisor / phone callback (backward compatible with existing test assertions)
  if (/(anruf|telefon|mensch|berater|sprechen|reden|human|call|advisor)/.test(t)) {
    return {
      text: isEn
        ? 'Sure! In the bottom right under "Call NoMaze Team" you can reach us directly or request a callback. A human advisor is always here for you.'
        : "Klar! Unten rechts bei „NoMaze-Team anrufen“ erreichst du uns direkt, oder du lässt dich zurückrufen. Ein Mensch ist immer für dich da.",
      vorschlaege: [],
    };
  }

  // 2. Cost / pricing of platform
  if (/(kosten|preis.*plattform|kostenlos|bezahlen|free|price of platform)/.test(t)) {
    return {
      text: isEn
        ? "It is completely free for you—today and in the future."
        : "Für dich ist das kostenlos, heute und auch später.",
      vorschlaege: [],
    };
  }

  // 3. UI control: Next best action / process step orientation
  if (
    /(was kann ich.*machen|was soll ich.*machen|nächster schritt|next step|what can i do|what should i do|orientier|wo bin ich|wie weiter|hilfe auf dieser seite)/.test(
      t
    )
  ) {
    const route = input.pageState?.route || "/";
    if (route === "/") {
      return {
        text: isEn
          ? 'You are on the start page. Click **"Personal Recommendation"** to select your field on the map, or **"Browse"** to explore official regional trial data.'
          : 'Du bist auf der Startseite. Klicke links auf „Persönliche Empfehlung“, um dein Feld auf der Karte zu wählen, oder auf „Stöbern“, um direkt in den amtlichen Versuchsdaten zu suchen.',
        vorschlaege: isEn
          ? ["Personal Recommendation", "Browse", "Is this free?"]
          : ["Persönliche Empfehlung", "Stöbern", "Ist das kostenlos?"],
        uiActions: [
          {
            type: "highlight_target",
            label: isEn ? "Show: Personal Recommendation" : "Zeigen: Persönliche Empfehlung",
            target: "feld-button",
          },
          {
            type: "highlight_target",
            label: isEn ? "Show: Browse" : "Zeigen: Stöbern",
            target: "daten-button",
          },
        ],
        fact: firstImplicit,
        extraFacts: restImplicit,
      };
    }

    const step = input.pageState?.stepLabel ?? (isEn ? "Variety Overview" : "Sortenübersicht");
    const nextAction =
      input.pageState?.nextBestAction ??
      (isEn
        ? 'Click "View profile" or "Choose this variety", or switch the climate scenario above.'
        : 'Klicke auf „Steckbrief ansehen“ oder „Diese Sorte wählen“, oder teste oben das Klimaszenario „Trockenjahr“.');
    const missing =
      input.pageState?.missingInfo && input.pageState.missingInfo.length > 0
        ? isEn
          ? ` Still open: ${input.pageState.missingInfo.join(", ")}.`
          : ` Noch offen: ${input.pageState.missingInfo.join(", ")}.`
        : "";

    const actions: SprossUiAction[] = [];
    if (input.pageState?.availableTargets?.length) {
      actions.push({
        type: "highlight_target",
        label: isEn ? `Show: ${step}` : `Fokus zeigen: ${step}`,
        target: input.pageState.availableTargets[0],
      });
    } else {
      actions.push({
        type: "select_scenario",
        label: isEn ? "Test Drought Scenario" : "Trockenjahr-Szenario testen",
        target: "trocken",
      });
    }

    return {
      text: isEn
        ? `You are currently in "${step}". Recommended next step: ${nextAction}${missing}`
        : `Du bist gerade im Schritt „${step}“. Mein Tipp als nächster Schritt: ${nextAction}${missing}`,
      vorschlaege: isEn
        ? ["Filter for drought year", "Show AckerWerk varieties", "Why does #1 win?"]
        : ["Filter auf Trockenjahr", "Zeig mir AckerWerk Sorten", "Warum gewinnt Platz 1?"],
      uiActions: actions,
      fact: firstImplicit,
      extraFacts: restImplicit,
    };
  }

  // 4. UI control: Apply filters and switch climate scenarios
  const knownBreeders = [
    { id: "ackerwerk", name: "AckerWerk Genetik", short: "AckerWerk" },
    { id: "feldmark", name: "Feldmark Genetics", short: "Feldmark" },
    { id: "auenhof", name: "Auenhof Saatzucht", short: "Auenhof" },
    { id: "bergland", name: "Bergland Seeds", short: "Bergland" },
    { id: "rheintal", name: "Rheintal Zucht", short: "Rheintal" },
  ];
  const matchedBreeder = knownBreeders.find(
    (b) => t.includes(b.id) || t.includes(b.short.toLowerCase()) || t.includes(b.name.toLowerCase())
  );

  if (
    /(filter|filtern|szenario|scenario|silomais filtern|körnermais filtern|auf silomais|auf körnermais|steckbrief öffnen|open detail|open profile)/.test(
      t
    ) ||
    matchedBreeder
  ) {
    const uiActions: SprossUiAction[] = [];
    let actionReplyDe = "";
    let actionReplyEn = "";

    if (/(trocken|drought|hitze)/.test(t)) {
      uiActions.push({
        type: "select_scenario",
        label: isEn ? "Activate Drought Scenario" : "Klimaszenario: Trockenjahr",
        target: "trocken",
      });
      actionReplyDe =
        "Ich schalte dir das Klimaszenario auf „Trockenjahr“ um. Dort siehst du sofort, wie Sorten mit starkem Stay-Green und tiefer Wurzelarchitektur wie AW Talkrone (+84 €/ha Puffer) oder RZ Mainau den Ertrag absichern.";
      actionReplyEn =
        'I can switch your climate scenario to "Drought Year". You will immediately see how hybrids with strong stay-green and deep roots like AW Talkrone or RZ Mainau protect your yield.';
    } else if (/(kühl|kalt|cold|nass)/.test(t)) {
      uiActions.push({
        type: "select_scenario",
        label: isEn ? "Activate Cool Year Scenario" : "Klimaszenario: Kühles Jahr",
        target: "kuehl",
      });
      actionReplyDe =
        "Hier ist die Umschaltung auf das Szenario „Kühles Jahr“. Achte besonders auf Hartmais-betonte Sorten mit hoher Jugendkältetoleranz wie AW Lichtkorn (Note 9) und AW Edelkorn.";
      actionReplyEn =
        'Here is the switch for the "Cool Year" scenario. Watch for flint-leaning varieties with high early cold tolerance like AW Lichtkorn (score 9) and AW Edelkorn.';
    } else if (matchedBreeder) {
      uiActions.push({
        type: "set_filter",
        label: isEn ? `Filter breeder: ${matchedBreeder.short}` : `Züchter filtern: ${matchedBreeder.short}`,
        filterKey: "zuechter",
        filterValue: matchedBreeder.id,
      });
      if (matchedBreeder.id === "ackerwerk") {
        actionReplyDe =
          "Ich filtere die Ansicht auf AckerWerk-Sorten. AckerWerk deckt von AW Lichtkorn (FAO 200, Kälte-Profi) über AW Talkrone und AW Sonnenkraft (FAO 240) bis AW Morgenstern (FAO 270, schnelles Dry-Down) alle Reifegruppen ab.";
        actionReplyEn =
          "Filtering the view to AckerWerk varieties. AckerWerk covers all maturity groups from AW Lichtkorn (FAO 200, cold specialist) to AW Talkrone and AW Sonnenkraft (FAO 240) up to AW Morgenstern (FAO 270).";
      } else {
        actionReplyDe = `Ich filtere die Ansicht auf Sorten von ${matchedBreeder.name}.`;
        actionReplyEn = `Filtering the view to varieties from ${matchedBreeder.name}.`;
      }
    } else if (/(silo|silage)/.test(t)) {
      uiActions.push({
        type: "set_filter",
        label: isEn ? "Filter usage: Silage maize" : "Nutzung: Silomais",
        filterKey: "usage",
        filterValue: "silomais",
      });
      actionReplyDe =
        "Ich setze den Nutzungsfilter auf Silomais. Damit rücken Stärkegehalt und Restpflanzenverdaulichkeit (z. B. AW Sonnenkraft mit +2,0 %-Pkt. Stärke und AW Talkrone) in den Fokus.";
      actionReplyEn =
        "Setting the usage filter to silage maize, focusing on starch content and stover digestibility (e.g., AW Sonnenkraft with +2.0 pt starch and AW Talkrone).";
    } else if (/(körner|koerner|korn|grain)/.test(t)) {
      uiActions.push({
        type: "set_filter",
        label: isEn ? "Filter usage: Grain maize" : "Nutzung: Körnermais",
        filterKey: "usage",
        filterValue: "koernermais",
      });
      actionReplyDe =
        "Ich stelle den Filter auf Körnermais. Hier zählen vor allem Kornertrag, Standfestigkeit und schnelle Wasserabgabe (Dry-Down) zur Senkung der Trocknungskosten.";
      actionReplyEn =
        "Setting the filter to grain maize, prioritizing grain yield, standability, and fast dry-down to reduce drying costs.";
    } else if (/(steckbrief|detail|profile)/.test(t)) {
      const targetVar = input.activeVariety || visibleFirst || "aw-talkrone";
      uiActions.push({
        type: "open_variety_detail",
        label: isEn ? `Open profile: ${targetVar}` : `Steckbrief öffnen: ${targetVar}`,
        varietyId: targetVar.toLowerCase().replace(/\s+/g, "-"),
      });
      actionReplyDe = `Ich öffne dir den Detail-Steckbrief für ${targetVar}, damit du Reifezahl, Resistenzen und das Züchterprofil direkt prüfen kannst.`;
      actionReplyEn = `Opening the variety profile for ${targetVar} so you can inspect maturity, resistances, and breeder traits.`;
    } else {
      uiActions.push({
        type: "set_filter",
        label: isEn ? "Reset / Adjust Filters" : "Filter anpassen",
        filterKey: "sortierung",
        filterValue: "mehrwert",
      });
      actionReplyDe = "Ich habe dir die passende Filter-Aktion direkt unter dieser Nachricht bereitgestellt.";
      actionReplyEn = "I've prepared the matching filter action right below this message.";
    }

    return {
      text: `${isEn ? actionReplyEn : actionReplyDe}${memoryRef}`,
      vorschlaege: isEn
        ? ["Compare top varieties", "Tell me about Stay-Green", "Next step on this page"]
        : ["Sorten vergleichen", "Was bedeutet Stay-Green?", "Was ist der nächste Schritt?"],
      uiActions,
      fact: firstImplicit,
      extraFacts: restImplicit,
    };
  }

  // 5. Specific breeder genetics (stay-green, dent/flint, early vigor, dry-down, fusarium)
  if (
    /(stay-green|stay green|zahnmais|hartmais|flint|dent|jugendentwicklung|kältetoleranz|kaeltetoleranz|fusarium|stängelfäule|staengelfaeule|dry-down|drydown|verdaulichkeit|züchterwissen|genetik|blühsynchronisation)/.test(
      t
    )
  ) {
    const matchedProfile =
      VARIETY_BREEDER_PROFILES.find((p) => p.aliases.some((a) => t.includes(a)))?.name ??
      input.activeVariety ??
      visibleFirst ??
      "AW Talkrone";
    const insight = getBreederInsightForVariety(matchedProfile, locale);

    if (insight) {
      const text = isEn
        ? `${insight.summary} Genetics: ${insight.details.kornTyp} Stay-Green: ${insight.details.stayGreen} Cold vigor: ${insight.details.jugendentwicklung}${memoryRef}`
        : `${insight.summary} Genetik: ${insight.details.kornTyp}. Stay-Green: ${insight.details.stayGreen} Jugendentwicklung: ${insight.details.jugendentwicklung}${memoryRef}`;

      return {
        text,
        vorschlaege: isEn
          ? [`Open ${insight.profile.name} profile`, "How does it handle drought?", "Filter for AckerWerk"]
          : [`Steckbrief ${insight.profile.name}`, "Wie schneidet sie bei Trockenheit ab?", "Zeig mir AckerWerk Sorten"],
        uiActions: [
          {
            type: "open_variety_detail",
            label: isEn ? `Profile: ${insight.profile.name}` : `Steckbrief: ${insight.profile.name}`,
            varietyId: insight.profile.id,
          },
        ],
        fact: firstImplicit,
        extraFacts: restImplicit,
      };
    }
  }

  // 6. Drought / stress tolerance inquiry
  if (t.includes("trocken") || t.includes("trockenheit") || t.includes("drought")) {
    const breederInfo = getBreederInsightForVariety(variety, locale);
    if (isEn) {
      return {
        text: `In dry trial years, ${variety} showed above-average stress tolerance and reliable ear fill. ${
          breederInfo ? breederInfo.details.trockenstress : "Leaves roll comparatively late so the stover stays vital longer and buffers yield loss."
        }${memoryRef}`,
        vorschlaege: ["Compare with AW Talkrone", "Activate Drought Scenario"],
        uiActions: [
          {
            type: "select_scenario",
            label: "Activate Drought Scenario",
            target: "trocken",
          },
        ],
        fact: firstImplicit,
        extraFacts: restImplicit,
      };
    }

    const extraBreederSentence = breederInfo
      ? ` Aus Züchtersicht hilft dabei: ${breederInfo.details.trockenstress}`
      : "";

    return {
      text: `Im trockenen Versuchsjahr zeigte ${variety} eine überdurchschnittliche Stresstoleranz und solide Kolbenfüllung. Die Blätter rollen vergleichsweise spät, sodass die Restpflanze länger vital bleibt und Ertragsverluste gedämpft werden.${extraBreederSentence}${memoryRef}`,
      vorschlaege: ["Mit AW Talkrone vergleichen", "Wie schneidet sie beim Ertrag ab?"],
      uiActions: [
        {
          type: "select_scenario",
          label: "Trockenjahr-Szenario aktivieren",
          target: "trocken",
        },
      ],
      fact: firstImplicit,
      extraFacts: restImplicit,
    };
  }

  // 7. Direct variety lookup or comparison
  const explicitProfile = VARIETY_BREEDER_PROFILES.find((p) =>
    p.aliases.some((a) => t.includes(a))
  );
  if (
    t.includes("ackerwerk") ||
    t.includes("talkrone") ||
    explicitProfile ||
    ((t.includes("vergleich") || t.includes("compare")) && input.activeVariety)
  ) {
    const targetName = explicitProfile?.name || variety;
    const insight = getBreederInsightForVariety(targetName, locale);

    if (isEn) {
      return {
        text: `In direct comparison: ${targetName} shows brisk early vigor and scores well under drought stress, while AW Talkrone combines synchronized flowering with high starch content. ${
          insight ? insight.summary : ""
        }${memoryRef}`,
        vorschlaege: ["Drought check", "View field on map"],
        uiActions: [
          {
            type: "open_variety_detail",
            label: `Open ${targetName}`,
            varietyId: insight?.profile.id ?? "aw-talkrone",
          },
        ],
        fact: firstImplicit,
        extraFacts: restImplicit,
      };
    }

    return {
      text: `Im direkten Vergleich: ${variety} zeigt eine zügigere Jugendentwicklung und punktet bei Trockenstress, während AW Talkrone im reinen Stärkegehalt leicht führt. Auf wechselnden Böden gleicht ${variety} Ertragsschwankungen besonders gut aus.${
        insight ? ` Züchter-Fokus zu ${insight.profile.name}: ${insight.summary}` : ""
      }${memoryRef}`,
      vorschlaege: ["Trockenheits-Check", "Feld auf der Karte ansehen"],
      uiActions: [
        {
          type: "open_variety_detail",
          label: `Steckbrief ${insight?.profile.name ?? "AW Talkrone"}`,
          varietyId: insight?.profile.id ?? "aw-talkrone",
        },
      ],
      fact: firstImplicit,
      extraFacts: restImplicit,
    };
  }

  // 8. Why rank #1 wins
  if (
    t.includes("gewinnt") ||
    t.includes("sieger") ||
    t.includes("warum genau diese sorte") ||
    t.includes("why does #1 win")
  ) {
    return {
      text: isEn
        ? `Based on your soil score and regional heat sum, this leader achieves the highest calculated added value (+84 €/ha). Especially when summer rain is erratic, its flowering synchronization buffers risk most reliably.${memoryRef}`
        : `Auf deinen Bodenwerten und der regionalen Wärmesumme erzielt dieser Sieger den höchsten berechneten Mehrwert (+84 €/ha). Vor allem bei unbeständigem Sommerregen federt er Risiken am zuverlässigsten ab.${memoryRef}`,
      vorschlaege: isEn
        ? ["Compare with #2", "View maturity details"]
        : ["Mit Platz 2 vergleichen", "Details zur Abreife ansehen"],
      fact: firstImplicit,
      extraFacts: restImplicit,
    };
  }

  // 9. General explanation inquiry
  if (/(warum|wieso|weshalb|erklär|wie rechnet|why|how do you calculate)/.test(t)) {
    return {
      text: isEn
        ? 'On every variety card under "Why we expect this", you can see what drives the recommendation: your site data, trials on comparable soils, breeder genetics, and the 2027 climate scenarios. Just tap a variety in the ranking.'
        : "Auf jeder Sortenseite steht unter „Warum wir das annehmen“, worauf die Empfehlung beruht: deine Standortdaten, Versuche an ähnlichen Standorten und die Klimaszenarien für 2027. Tipp einfach auf eine Sorte im Ranking.",
      vorschlaege: [],
      fact: firstImplicit,
      extraFacts: restImplicit,
    };
  }

  // 10. Dialog questionnaire catalog & progressive knowledge extraction
  const questions = scriptQuestions(input.saison);
  const asked = questions.find((q) => q.key === input.askedKey);
  const known = new Set(input.bekannteKeys);
  let fact: KnowledgeFact | undefined;

  if (asked) {
    fact = { topic: asked.topic, jahr: asked.jahr, text: asked.alsWissen(input.text.trim()) };
    known.add(asked.key);
  } else if (firstImplicit) {
    fact = firstImplicit;
  } else if (input.text.trim().length > 12) {
    fact = { topic: "sonstiges", text: input.text.trim() };
  }

  const dankePool = isEn ? DANKE_EN : DANKE_DE;
  const danke = dankePool[hashString(input.text) % dankePool.length]!;
  const next = nextQuestion(input.saison, known);
  if (next) {
    return {
      text: `${danke} ${isEn ? (next.frageEn ?? next.frage) : next.frage}`,
      askedKey: next.key,
      vorschlaege: isEn ? (next.vorschlaegeEn ?? next.vorschlaege) : next.vorschlaege,
      fact,
      extraFacts: restImplicit,
    };
  }
  return {
    text: isEn
      ? `${danke} Now I know your field really well. Ask me anything about your varieties, breeder genetics, or filters on this page.`
      : `${danke} Damit kenne ich dein Feld schon richtig gut. Frag mich gern alles zu deinen Sorten, oder ruf das Team an, wenn du lieber sprichst.`,
    vorschlaege: isEn
      ? ["Why this variety?", "Talk to a human"]
      : ["Warum diese Sorte?", "Mit einem Menschen sprechen"],
    fact,
    extraFacts: restImplicit,
  };
}

function nextQuestion(saison: number, bekannteKeys: Set<string>): ScriptQuestion | undefined {
  return scriptQuestions(saison).find((q) => !bekannteKeys.has(q.key));
}

export function knownKeysFromFacts(
  facts: { topic: string; jahr?: number | null; text: string }[],
  saison: number
): Set<string> {
  const keys = new Set<string>();
  for (const q of scriptQuestions(saison)) {
    const hit = facts.some((f) => {
      if (f.topic !== q.topic) return false;
      if (q.jahr !== undefined) return f.jahr === q.jahr;
      if (q.key === "erfahrung:gut") return f.text.startsWith("Läuft gut");
      if (q.key === "erfahrung:schwierig") return f.text.startsWith("Schwierig");
      if (q.key === "bewirtschaftung:beregnung") return /beregn/i.test(f.text);
      return true;
    });
    if (hit) keys.add(q.key);
  }
  return keys;
}
