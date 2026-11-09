import { describe, expect, it, vi } from "vitest";
import { getSprossProactiveContent } from "../SprossCopilot";

describe("Spross Copilot Proactive Context & Interactive Targets", () => {
  it("Landing page (/): provides interactive target controls for field button and catalog browse button", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toContain("Hi! Ich sehe, du bist neu hier");
    expect(content.proactiveChips).toHaveLength(2);

    const feldChip = content.proactiveChips.find((c) => c.id === "start-feld");
    expect(feldChip).toBeDefined();
    expect(feldChip?.label).toBe("Persönliche Empfehlung");
    expect(feldChip?.target).toBe("feld-button");
    expect(feldChip?.href).toBe("/feld/neu");

    const datenChip = content.proactiveChips.find((c) => c.id === "start-daten");
    expect(datenChip).toBeDefined();
    expect(datenChip?.label).toBe("Stöbern");
    expect(datenChip?.target).toBe("daten-button");
    expect(datenChip?.href).toBe("/daten");
  });

  it("New field (/feld/neu): provides map navigation and location search with triggerTarget actions", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/feld/neu",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toBe(
      "Tippe einfach auf deinen Schlag auf der Karte oder such nach deinem Ort. Ich ermittle danach automatisch Bodengüte und Wetterhistorie.",
    );
    expect(content.proactiveChips).toHaveLength(2);

    const mapChip = content.proactiveChips.find((c) => c.id === "neu-karte");
    expect(mapChip).toBeDefined();
    expect(mapChip?.label).toBe("Auf Karte tippen");
    expect(mapChip?.target).toBe("field-map");
    expect(mapChip?.action).toBeDefined();
    mapChip?.action?.();
    expect(triggerMock).toHaveBeenCalledWith("field-map");

    const ortChip = content.proactiveChips.find((c) => c.id === "neu-ort");
    expect(ortChip).toBeDefined();
    expect(ortChip?.label).toBe("Ort oder Postleitzahl");
    expect(ortChip?.target).toBe("ort-search");
    expect(ortChip?.action).toBeDefined();
    ortChip?.action?.();
    expect(triggerMock).toHaveBeenCalledWith("ort-search");
  });

  it("Trial data (/daten) with active variety: benchmark comparison and drought stress check", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/daten/by-sued",
      activeVariety: "FG 31.256",
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toContain("FG 31.256");
    expect(content.proactiveText).toContain("AW Talkrone");
    expect(content.proactiveChips).toHaveLength(2);

    const trockenChip = content.proactiveChips.find((c) => c.id === "daten-trocken");
    expect(trockenChip).toBeDefined();
    expect(trockenChip?.label).toBe("Trockenheits-Check");
    expect(trockenChip?.question).toBe("Wie schneidet FG 31.256 bei Trockenheit und Hitze ab?");

    const benchmarkChip = content.proactiveChips.find((c) => c.id === "daten-benchmark");
    expect(benchmarkChip).toBeDefined();
    expect(benchmarkChip?.label).toBe("Mit AckerWerk vergleichen");
    expect(benchmarkChip?.question).toBe("Wie steht FG 31.256 im Vergleich zu AW Talkrone da?");
  });

  it("Trial data (/daten) without active variety: postal code focus and field action button", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/daten",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toContain("Du bist in den Versuchsdaten. Gib oben deine PLZ ein");
    expect(content.proactiveChips).toHaveLength(2);

    const plzChip = content.proactiveChips.find((c) => c.id === "daten-plz");
    expect(plzChip).toBeDefined();
    expect(plzChip?.label).toBe("PLZ eingeben");
    expect(plzChip?.target).toBe("plz-input");
    expect(plzChip?.action).toBeDefined();

    const feldChip = content.proactiveChips.find((c) => c.id === "daten-feld");
    expect(feldChip).toBeDefined();
    expect(feldChip?.label).toBe("Persönliche Empfehlung");
    expect(feldChip?.target).toBe("feld-button");
    expect(feldChip?.href).toBe("/feld/neu");
  });

  it("Ranking view (/feld/[id]/ranking): winner rationale with ranking-winner target and 2nd-place comparison", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/feld/fld_abc123/ranking",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toBe(
      "Hier ist dein standortspezifisches Ranking. Die Empfehlung basiert auf deinen Bodendaten und Klimaszenarien.",
    );
    expect(content.proactiveChips).toHaveLength(2);

    const warumChip = content.proactiveChips.find((c) => c.id === "rank-warum");
    expect(warumChip).toBeDefined();
    expect(warumChip?.label).toBe("Steckbrief ansehen");
    expect(warumChip?.target).toBe("ranking-winner");
    expect(warumChip?.question).toBe("Warum liegt die erstplatzierte Sorte auf Platz 1?");

    const platz2Chip = content.proactiveChips.find((c) => c.id === "rank-platz2");
    expect(platz2Chip).toBeDefined();
    expect(platz2Chip?.label).toBe("Mit Platz 2 vergleichen");
    expect(platz2Chip?.question).toBe("Was unterscheidet Platz 1 und Platz 2 auf meinem Standort?");
  });

  it("Variety profile view (/feld/[id]/sorte/[varietyId]): drought tolerance check and maturity index", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/feld/fld_abc123/sorte/var_xyz",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toBe(
      "Ich kenne die Versuchsergebnisse und Standorteigenschaften dieser Sorte im Detail.",
    );
    expect(content.proactiveChips).toHaveLength(2);

    const trockenChip = content.proactiveChips.find((c) => c.id === "sorte-trocken");
    expect(trockenChip).toBeDefined();
    expect(trockenChip?.label).toBe("Trockenheits-Check");
    expect(trockenChip?.question).toBe("Wie schlägt sich diese Sorte in extrem trockenen Jahren?");

    const ertragChip = content.proactiveChips.find((c) => c.id === "sorte-ertrag");
    expect(ertragChip).toBeDefined();
    expect(ertragChip?.label).toBe("Reife & Relativ-Index");
    expect(ertragChip?.question).toBe("Passt die Reifezahl zu meinem Aussaat- und Erntefenster?");
  });

  it("My Farm (/hof): crop rotation and soil tillage knowledge acquisition prompts", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/hof",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toBe(
      "Hier laufen alle Daten deines Betriebs zusammen. Je mehr ich über deine Bewirtschaftung lerne, desto schärfer wird meine Empfehlung.",
    );
    expect(content.proactiveChips).toHaveLength(2);

    const fruchtfolgeChip = content.proactiveChips.find((c) => c.id === "hof-fruchtfolge");
    expect(fruchtfolgeChip).toBeDefined();
    expect(fruchtfolgeChip?.label).toBe("Fruchtfolge erzählen");
    expect(fruchtfolgeChip?.question).toBe("Welche Früchte standen in den letzten 3 Jahren auf meinen Schlägen?");

    const bodenChip = content.proactiveChips.find((c) => c.id === "hof-boden");
    expect(bodenChip).toBeDefined();
    expect(bodenChip?.label).toBe("Boden & Bearbeitung");
    expect(bodenChip?.question).toBe(
      "Ich möchte dir von meinen Bodenverhältnissen und meiner Bodenbearbeitung erzählen.",
    );
  });

  it("Route /heute: retains photo upload task and fungicide demand review", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/heute",
      activeVariety: null,
      triggerTarget: triggerMock,
    });

    expect(content.proactiveText).toContain("Wir beobachten das **Wetter** und das **Schadrisiko**");
    expect(content.proactiveChips).toHaveLength(2);

    const fotoChip = content.proactiveChips.find((c) => c.id === "foto-auftrag");
    expect(fotoChip).toBeDefined();
    expect(fotoChip?.label).toBe("Foto machen");
    expect(fotoChip?.target).toBe("foto-upload");

    const fungizidChip = content.proactiveChips.find((c) => c.id === "fungizid");
    expect(fungizidChip).toBeDefined();
    expect(fungizidChip?.label).toBe("Fungizid-Bedarf prüfen");
    expect(fungizidChip?.question).toBe(
      "Gibt es aktuellen Behandlungsbedarf für Krankheiten oder Pilze bei diesem Wetter?",
    );
  });

  it("Spross 2.0: delivers breeder impulse, live page state, element focus, and farm memory summary", () => {
    const triggerMock = vi.fn();
    const content = getSprossProactiveContent({
      pathname: "/feld/fld_1/ranking",
      activeVariety: "AW Talkrone",
      triggerTarget: triggerMock,
      locale: "de",
      pageState: {
        route: "/feld/fld_1/ranking",
        stepLabel: "Schritt 3/3: Sorten-Ranking",
        nextBestAction: "AW Talkrone im Trockenjahr prüfen",
        activeScenario: "trocken",
        visibleVarieties: ["AW Talkrone", "AW Lichtkorn"],
        missingInfo: ["Bisherige Sorte fehlt noch"],
      },
      focusedElementInfo: {
        targetId: "ranking-winner",
        label: "Empfehlung Platz 1",
      },
      knownFactsSummary: [
        {
          topic: "risikofokus",
          label: "Risikofokus",
          text: "Trockenstress-Absicherung wichtig",
        },
      ],
    });

    expect(content.stepLabel).toBe("Schritt 3/3: Sorten-Ranking");
    expect(content.nextBestAction).toContain("Talkrone");
    expect(content.breederImpulse).toContain("AW Talkrone");
    expect(content.breederImpulse).toContain("Stay-Green");
    expect(content.focusedHint).toContain("Empfehlungskarte Platz 1");
    expect(content.memoryHint).toContain("1 Hof-Fakt aktiv");
    expect(content.missingInfoHint).toBe("Bisherige Sorte fehlt noch");
  });
});
