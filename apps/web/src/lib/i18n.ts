export type Locale = "de" | "en";

export const DEFAULT_LOCALE: Locale = "de";
export const LANG_COOKIE = "sk_lang";

export interface Dictionary {
  brandBar: {
    login: string;
    farm: string;
    aboutUs: string;
    whyWeDoThis: string;
    homeAria: string;
    backendConnected: string;
    backendOffline: string;
  };
  landing: {
    heroTitle1: string;
    heroTitle2: string;
    heroSubtitle: (versuche?: number) => string;
    ctaRecommend: string;
    ctaBrowse: string;
    ctaLogin: string;
    partnersTitle: string;
    partnersNeutrality: string;
    stepsEyebrow: string;
    stepsTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    sprossTitle: string;
    sprossText: string;
    sprossCta: string;
    continueTitle: string;
    continueToday: string;
    continueRanking: string;
    continueVarieties: string;
  };
  spross: {
    ask: string;
    thinking: string;
    alwaysHelpful: string;
    copilot: string;
    companion: string;
    demoTag: string;
    aiTag: string;
    analyzing: string;
    noted: string;
    closeEsc: string;
    callTeam: string;
    inputPlaceholder: string;
    sendAria: string;
    askMobile: string;
    companionMobile: string;
    teamMobile: string;
    closeMobile: string;
    proactive: {
      home: {
        text: string;
        addField: string;
        viewData: string;
      };
      heute: {
        text: string;
        uploadPhoto: string;
        checkFungicide: string;
        fungicideQuestion: string;
      };
      neu: {
        text: string;
        tapMap: string;
        searchLocation: string;
      };
      ranking: {
        text: string;
        whyThisVariety: string;
        whyThisVarietyQuestion: string;
        compareRank2: string;
        compareRank2Question: string;
      };
      sorte: {
        text: string;
        droughtCheck: string;
        droughtQuestion: string;
        maturityYield: string;
        maturityYieldQuestion: string;
      };
      datenWithVariety: {
        text: (variety: string) => string;
        droughtCheck: string;
        droughtQuestion: (variety: string) => string;
        compareBenchmark: string;
        compareBenchmarkQuestion: (variety: string) => string;
      };
      daten: {
        text: string;
        enterPlz: string;
        fieldOnMap: string;
      };
      hof: {
        text: string;
        cropRotation: string;
        cropRotationQuestion: string;
        soilTillage: string;
        soilTillageQuestion: string;
      };
      field: {
        text: string;
        whyThisVariety: string;
        whyThisVarietyQuestion: string;
        sowingDate: string;
        sowingDateQuestion: string;
      };
      fallback: {
        text: string;
        toFields: string;
        trialData: string;
      };
    };
  };
  shell: {
    callTeamDock: string;
    footerOffer: string;
    footerDwd: string;
    footerDemoSettings: string;
    footerAboutUs: string;
    footerWhyWeDoThis: string;
    footerImprint: string;
    footerPrivacy: string;
    footerMapSource: string;
    demoBackendStatusTitle: string;
    demoBackendStatusHelp: string;
  };
}

export const DICT: Record<Locale, Dictionary> = {
  de: {
    brandBar: {
      login: "Anmelden",
      farm: "Mein Hof",
      aboutUs: "Über uns",
      whyWeDoThis: "Warum kostenlos?",
      homeAria: "Zur Startseite",
      backendConnected: "Backend verbunden",
      backendOffline: "Momentan ohne Backend (Test-Modus)",
    },
    landing: {
      heroTitle1: "Dein Feld.",
      heroTitle2: "Deine beste Sorte.",
      heroSubtitle: () =>
        "Wir liefern dir feldgenaue Sorten- und Anbauempfehlungen für deinen eigenen Schlag, unabhängig, praxisnah und auf Basis echter Standort- und Züchtungsmodelle.",
      ctaRecommend: "Persönliche Empfehlung",
      ctaBrowse: "Stöbern",
      ctaLogin: "Schon dabei? Anmelden",
      partnersTitle: "Mit Sorten und Daten von",
      partnersNeutrality:
        "Partner haben keinen Einfluss auf das Ranking. Es zählt nur, was auf deinem Feld am meisten bringt.",
      stepsEyebrow: "So funktioniert es",
      stepsTitle: "In drei Schritten\nzur Sorte",
      step1Title: "Feld wählen",
      step1Desc: "Ein Tipp auf die Karte genügt. Boden, Regen und Wärme deines Standorts kennen wir.",
      step2Title: "Sorten vergleichen",
      step2Desc: "Das Ranking für 2027, gerechnet über drei Klimaszenarien. Zu jeder Sorte steht, warum.",
      step3Title: "Saison begleiten",
      step3Desc: "Jeden Tag sehen, wie sich dein Mais macht: Wetter, Hinweise, Fotos und dein Fortschritt.",
      sprossTitle: "Hallo, ich bin Spross.",
      sprossText:
        "Ich helfe dir bei der Sortenwahl und lerne gern von dir: Was lief auf deinem Feld gut, was nicht? Du kennst es besser als jedes Modell. Und wenn du lieber mit einem Menschen sprichst, ist das NoMaze-Feldteam immer erreichbar.",
      sprossCta: "Sag Spross Hallo",
      continueTitle: "Weiter mit deinem Feld",
      continueToday: "Dein Feld heute",
      continueRanking: "Zum Ranking",
      continueVarieties: "Sorten finden",
    },
    spross: {
      ask: "Frag Spross",
      thinking: "denkt nach …",
      alwaysHelpful: "Immer hilfsbereit",
      copilot: "Co-Pilot",
      companion: "Feldbegleiter",
      demoTag: "Feldbegleiter · Demo",
      aiTag: "Feldbegleiter · KI",
      analyzing: "analysiert …",
      noted: "Notiert: ",
      closeEsc: "Verlauf schließen (Esc)",
      callTeam: "NoMaze-Team anrufen",
      inputPlaceholder: "Frag Spross...",
      sendAria: "Nachricht senden",
      askMobile: "Frag Spross …",
      companionMobile: "Feldbegleiter",
      teamMobile: "Team",
      closeMobile: "Schließen",
      proactive: {
        home: {
          text: "Hi! Ich sehe, du bist neu hier. Klicke auf **„Persönliche Empfehlung“**, um dein Feld auf der Karte zu wählen, oder auf **„Stöbern“** für die amtlichen Versuchsdaten.",
          addField: "Persönliche Empfehlung",
          viewData: "Stöbern",
        },
        heute: {
          text: "Wir beobachten das **Wetter** und das **Schadrisiko** für deine Bestände. Klicke unten auf **„Foto machen“** oder stelle mir Fragen zum aktuellen Feldzustand.",
          uploadPhoto: "Foto machen",
          checkFungicide: "Fungizid-Bedarf prüfen",
          fungicideQuestion: "Gibt es aktuellen Behandlungsbedarf für Krankheiten oder Pilze bei diesem Wetter?",
        },
        neu: {
          text: "Tippe einfach auf deinen Schlag auf der Karte oder such nach deinem Ort. Ich ermittle danach automatisch Bodengüte und Wetterhistorie.",
          tapMap: "Auf Karte tippen",
          searchLocation: "Ort oder Postleitzahl",
        },
        ranking: {
          text: "Hier ist dein standortspezifisches Ranking. Die Empfehlung basiert auf deinen Bodendaten und Klimaszenarien.",
          whyThisVariety: "Steckbrief ansehen",
          whyThisVarietyQuestion: "Warum liegt die erstplatzierte Sorte auf Platz 1?",
          compareRank2: "Mit Platz 2 vergleichen",
          compareRank2Question: "Was unterscheidet Platz 1 und Platz 2 auf meinem Standort?",
        },
        sorte: {
          text: "Ich kenne die Versuchsergebnisse und Standorteigenschaften dieser Sorte im Detail.",
          droughtCheck: "Trockenheits-Check",
          droughtQuestion: "Wie schlägt sich diese Sorte in extrem trockenen Jahren?",
          maturityYield: "Reife & Relativ-Index",
          maturityYieldQuestion: "Passt die Reifezahl zu meinem Aussaat- und Erntefenster?",
        },
        datenWithVariety: {
          text: (variety: string) =>
            `Du schaust dir **${variety}** an! Soll ich dir zeigen, wie stabil die Sorte bei Trockenheit war, oder wie sie im Vergleich zu AW Talkrone dasteht?`,
          droughtCheck: "Trockenheits-Check",
          droughtQuestion: (variety: string) => `Wie schneidet ${variety} bei Trockenheit und Hitze ab?`,
          compareBenchmark: "Mit AckerWerk vergleichen",
          compareBenchmarkQuestion: (variety: string) => `Wie steht ${variety} im Vergleich zu AW Talkrone da?`,
        },
        daten: {
          text: "Du bist in den Versuchsdaten. Gib oben deine PLZ ein oder klicke auf **„Meinen Standort nutzen“**!",
          enterPlz: "PLZ eingeben",
          fieldOnMap: "Persönliche Empfehlung",
        },
        hof: {
          text: "Hier laufen alle Daten deines Betriebs zusammen. Je mehr ich über deine Bewirtschaftung lerne, desto schärfer wird meine Empfehlung.",
          cropRotation: "Fruchtfolge erzählen",
          cropRotationQuestion: "Welche Früchte standen in den letzten 3 Jahren auf meinen Schlägen?",
          soilTillage: "Boden & Bearbeitung",
          soilTillageQuestion: "Ich möchte dir von meinen Bodenverhältnissen und meiner Bodenbearbeitung erzählen.",
        },
        field: {
          text: "Hier siehst du die Auswertung für deinen Schlag. Möchtest du eine Empfehlung begründet haben oder Saatgut vorbestellen?",
          whyThisVariety: "Warum diese Sorte?",
          whyThisVarietyQuestion: "Warum ist diese Sorte auf Platz 1 für meinen Schlag?",
          sowingDate: "Optimaler Aussaattermin?",
          sowingDateQuestion: "Wann ist basierend auf Bodentemperatur und Wetter der optimale Aussaattermin?",
        },
        fallback: {
          text: "Hallo! Ich bin Spross, dein Feldbegleiter. Frag mich jederzeit zu Sorten, Böden und deinen Schlägen.",
          toFields: "Persönliche Empfehlung",
          trialData: "Stöbern",
        },
      },
    },
    shell: {
      callTeamDock: "NoMaze-Team anrufen",
      footerOffer: "Ein Angebot von NoMaze · für Landwirte kostenlos",
      footerDwd: "DWD Open Data (Freising)",
      footerDemoSettings: "Demo-Einstellungen",
      footerAboutUs: "Über uns",
      footerWhyWeDoThis: "Warum kostenlos?",
      footerImprint: "Impressum",
      footerPrivacy: "Datenschutz",
      footerMapSource:
        "Kartendaten: © OpenStreetMap-Mitwirkende (ODbL) · Kartenstil: OpenFreeMap · Luftbild: Esri World Imagery · Feldgrenzen: © Geobasisdaten / InVeKoS der Länder (dl-de/by-2-0, CC-BY 4.0) via fiboa · Wetter: Open-Meteo (CC-BY-4.0)",
      demoBackendStatusTitle: "Backend-Status im Header anzeigen",
      demoBackendStatusHelp:
        "Zeigt oben in der Kopfleiste an, ob die App lokal ohne Backend (Test-Modus) oder mit verbundenem Backend läuft.",
    },
  },
  en: {
    brandBar: {
      login: "Sign In",
      farm: "My Farm",
      aboutUs: "About us",
      whyWeDoThis: "Why is it free?",
      homeAria: "To homepage",
      backendConnected: "Backend connected",
      backendOffline: "Offline mode (no backend)",
    },
    landing: {
      heroTitle1: "Your field.",
      heroTitle2: "Your best variety.",
      heroSubtitle: () =>
        "Field-specific variety and cultivation recommendations tailored to your exact field and growing conditions.",
      ctaRecommend: "Personal Recommendation",
      ctaBrowse: "Browse",
      ctaLogin: "Already registered? Sign in",
      partnersTitle: "With varieties and data from",
      partnersNeutrality:
        "Partners have no influence on the ranking. What matters most is what performs best on your field.",
      stepsEyebrow: "How it works",
      stepsTitle: "In three steps\nto your variety",
      step1Title: "Select field",
      step1Desc: "Just tap on the map. We analyze your soil, rainfall, and local temperature.",
      step2Title: "Compare varieties",
      step2Desc: "The 2027 ranking calculated across three climate scenarios with clear rationales for each variety.",
      step3Title: "Season companion",
      step3Desc: "Track your crop every day: weather, recommendations, photos, and your progress.",
      sprossTitle: "Hello, I'm Spross.",
      sprossText:
        "I help you choose the right variety and learn from you: What worked well on your field, what didn't? You know it better than any model. And if you prefer talking to a person, the NoMaze field team is always here for you.",
      sprossCta: "Say hello to Spross",
      continueTitle: "Continue with your field",
      continueToday: "Your field today",
      continueRanking: "To ranking",
      continueVarieties: "Find varieties",
    },
    spross: {
      ask: "Ask Spross",
      thinking: "thinking …",
      alwaysHelpful: "Always helpful",
      copilot: "Copilot",
      companion: "Field companion",
      demoTag: "Field companion · Demo",
      aiTag: "Field companion · AI",
      analyzing: "analyzing …",
      noted: "Noted: ",
      closeEsc: "Close chat (Esc)",
      callTeam: "Call NoMaze team",
      inputPlaceholder: "Ask Spross...",
      sendAria: "Send message",
      askMobile: "Ask Spross …",
      companionMobile: "Field companion",
      teamMobile: "Team",
      closeMobile: "Close",
      proactive: {
        home: {
          text: "Hi! I see you're new here. Click **\"Personal Recommendation\"** to select your field on the map, or **\"Browse\"** for official trial data.",
          addField: "Personal Recommendation",
          viewData: "Browse",
        },
        heute: {
          text: "We monitor the **weather** and **risk of damage** for your crops. Click **\"Take photo\"** below or ask me about current field conditions.",
          uploadPhoto: "Take photo",
          checkFungicide: "Check fungicide demand",
          fungicideQuestion: "Is there an urgent need for treatment against diseases or fungi given this weather?",
        },
        neu: {
          text: "Simply tap on your parcel on the map or search for your town. I will automatically determine soil quality and weather history.",
          tapMap: "Tap on map",
          searchLocation: "Town or postal code",
        },
        ranking: {
          text: "Here is your location-specific ranking. The recommendation is based on your soil data and climate scenarios.",
          whyThisVariety: "View profile",
          whyThisVarietyQuestion: "Why is the top variety ranked #1?",
          compareRank2: "Compare with 2nd place",
          compareRank2Question: "What is the difference between 1st and 2nd place for my location?",
        },
        sorte: {
          text: "I know the trial results and site characteristics of this variety in detail.",
          droughtCheck: "Drought check",
          droughtQuestion: "How does this variety perform in extremely dry years?",
          maturityYield: "Maturity & index",
          maturityYieldQuestion: "Does the maturity rating match my sowing and harvest window?",
        },
        datenWithVariety: {
          text: (variety: string) =>
            `You are looking at **${variety}**! Shall I show you how resilient it is in drought, or compare it to AW Talkrone?`,
          droughtCheck: "Drought check",
          droughtQuestion: (variety: string) => `How does ${variety} perform in drought and heat?`,
          compareBenchmark: "Compare with AckerWerk",
          compareBenchmarkQuestion: (variety: string) => `How does ${variety} compare to AW Talkrone?`,
        },
        daten: {
          text: "You are exploring trial data. Enter your postal code above or click **\"Use my location\"**!",
          enterPlz: "Enter postal code",
          fieldOnMap: "Personal Recommendation",
        },
        hof: {
          text: "This is where all your farm data converges. The more I learn about your practices, the more tailored my recommendations become.",
          cropRotation: "Tell crop rotation",
          cropRotationQuestion: "Which crops were planted on my parcels in the last 3 years?",
          soilTillage: "Soil & tillage",
          soilTillageQuestion: "I want to tell you about my soil conditions and tillage practices.",
        },
        field: {
          text: "Here is the evaluation for your parcel. Would you like an explanation of the recommendation or preorder seed?",
          whyThisVariety: "Why this variety?",
          whyThisVarietyQuestion: "Why is this variety ranked #1 for my parcel?",
          sowingDate: "Optimal sowing date?",
          sowingDateQuestion: "When is the optimal sowing date based on soil temperature and weather?",
        },
        fallback: {
          text: "Hello! I'm Spross, your field companion. Ask me anytime about varieties, soils, and your fields.",
          toFields: "Personal Recommendation",
          trialData: "Browse",
        },
      },
    },
    shell: {
      callTeamDock: "Call NoMaze team",
      footerOffer: "Provided by NoMaze · free for farmers",
      footerDwd: "DWD Open Data (Freising)",
      footerDemoSettings: "Demo Settings",
      footerAboutUs: "About us",
      footerWhyWeDoThis: "Why is it free?",
      footerImprint: "Imprint",
      footerPrivacy: "Privacy Policy",
      footerMapSource:
        "Map data: © OpenStreetMap contributors (ODbL) · Map style: OpenFreeMap · Satellite: Esri World Imagery · Field boundaries: © Geobasisdaten / InVeKoS (dl-de/by-2-0, CC-BY 4.0) via fiboa · Weather: Open-Meteo (CC-BY-4.0)",
      demoBackendStatusTitle: "Show backend status in header",
      demoBackendStatusHelp:
        "Displays a badge in the top navigation indicating whether the app is running without a backend (test mode) or connected to the backend.",
    },
  },
};

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return DICT[locale] ?? DICT[DEFAULT_LOCALE];
}
