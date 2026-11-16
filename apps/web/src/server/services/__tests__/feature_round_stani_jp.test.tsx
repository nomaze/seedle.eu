/** @vitest-environment jsdom */
import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it, vi, beforeAll } from "vitest";
import StartPage from "@/app/page";
import { Hof } from "@/app/hof/page";
import UeberUnsPage from "@/app/ueber-uns/page";
import WarumKostenlosPage from "@/app/warum-kostenlos/page";
import WarumWirDasMachenPage from "@/app/warum-wir-das-machen/page";
import { Anbau } from "@/app/feld/[fieldId]/anbau/page";
import { Sorte } from "@/app/feld/[fieldId]/sorte/[varietyId]/page";
import { Kaufen } from "@/app/feld/[fieldId]/kaufen/[varietyId]/page";
import { BrandBar } from "@/components/shell/BrandBar";
import { Footer } from "@/components/shell/Footer";
import { LanguageProvider } from "@/components/shell/LanguageContext";
import { DemoProvider } from "@/components/shell/DemoContext";
import { OverlayProvider } from "@/components/shell/Overlays";
import { SprossProvider } from "@/components/spross/SprossContext";
import { DEMO_STANDARD } from "@/lib/demo";
import { getDictionary } from "@/lib/i18n";
import {
  createDefaultAgronomyProfile,
  formatAgronomyRecapSummary,
  loadFieldAgronomyProfile,
  SOIL_TYPE_LABELS,
  TILLAGE_BIOLOGY_HINT,
} from "@/lib/fieldAgronomyProfile";
import {
  findParcelAtPoint,
  hasSelfIntersection,
  surroundingFieldParcels,
} from "@seedle/core/geo";
import { KARTE, LUFTBILD } from "@/components/map/styles";
import { FieldPicker } from "@/components/map/FieldPicker";
import { AnbauCropUsageSection } from "@/components/feld/AnbauCropUsageSection";
import { BodenProfileForm } from "@/components/feld/BodenProfileForm";
import { WichtigProfileForm } from "@/components/feld/WichtigProfileForm";
import {
  buildAgronomicRiskPortfolio,
  buildDeterministicThreeModelBreakdown,
  computeSeedUnitsForHa,
  computeSiteAdaptedSeedingRate,
  DEMO_VARIETIES_BY_CROP,
  deriveVarietyTrialProvenance,
  FieldRankingView,
  getFilteredVarietiesForCrop,
  getKnownVarietyCountForCrop,
  getUsageBiologyFocusText,
  rankVarietiesByStrategyAxis,
  WarmerStartView,
} from "@/components/daten/FieldRankingView";
import { PreviousVarietyPicker } from "@/components/ui/PreviousVarietyPicker";
import { inMemoryStore } from "@/server/db/in-memory-store";
import {
  unwrapVarietyDetailPayload,
  VarietySteckbriefModal,
} from "@/components/daten/VarietySteckbriefModal";
import { VarietyCompareModal } from "@/components/daten/VarietyCompareModal";
import { WhereToBuyModal } from "@/components/daten/WhereToBuyModal";
import {
  BugReportWidget,
  captureInstantPageScreenshot,
  collectLocalFieldContext,
} from "@/components/shell/BugReportWidget";
import { HofActionPanel } from "@/components/hof/HofActionPanel";
import { ManageFieldForm } from "@/components/hof/ManageFieldForm";
import { EditFarmForm } from "@/components/hof/EditFarmForm";
import { fakeVarietyDetail } from "@/server/services/fake-dmk-data";
import {
  checkBackendHealth,
  fetchFieldIntelligenceFromBackend,
  fetchVarietyDeepAnalysisFromBackend,
  fetchVarietySteckbriefFromBackend,
  fetchVarietySuppliersFromBackend,
  submitBugReport,
} from "@/lib/backendClient";
import { requireField } from "@/server/pages";
import { recommendationFor } from "@/server/services/recommendations";
import { DEMO_USER_ID, seedPeterMuellerDemoData } from "../demo-state";
import * as sessionModule from "../../session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams("usage=koernermais"),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider value={DEMO_STANDARD}>
      <LanguageProvider initialLocale="de">
        <OverlayProvider>
          <SprossProvider>{children}</SprossProvider>
        </OverlayProvider>
      </LanguageProvider>
    </DemoProvider>
  );
}

describe("Feature Round Stani, JP & KWS-Max (SEEDLE-FEAT-003 to SEEDLE-FEAT-007)", () => {
  beforeAll(async () => {
    await seedPeterMuellerDemoData();
    vi.spyOn(sessionModule, "currentUser").mockResolvedValue({
      id: DEMO_USER_ID,
      name: "Peter Müller",
      email: "peter@seedle-demo.de",
      emailVerified: true,
      telefon: null,
    });
  });

  describe("1. SEEDLE-FEAT-004 & SEEDLE-FEAT-007 (A1): Header Tabs, /ueber-uns & /warum-wir-das-machen Trust Pages", () => {
    it("removes '3.042' trial count from heroSubtitle (DE & EN) and places 3-step section in upper fold", async () => {
      const deDict = getDictionary("de");
      const enDict = getDictionary("en");
      expect(deDict.landing.heroSubtitle()).not.toContain("3.042");
      expect(enDict.landing.heroSubtitle()).not.toContain("3,042");
      expect(deDict.brandBar.whyWeDoThis).toBe("Warum kostenlos?");
      expect(enDict.brandBar.whyWeDoThis).toBe("Why is it free?");

      const pageElement = await StartPage();
      const html = renderToStaticMarkup(<TestProviders>{pageElement}</TestProviders>);

      expect(html).not.toContain("3.042");
      expect(html).toContain("In drei Schritten");
      const stepsIdx = html.indexOf("In drei Schritten");
      expect(stepsIdx).toBeGreaterThan(0);
    });

    it("adds 'Über uns' and 'Warum kostenlos?' links to BrandBar and Footer", () => {
      const barHtml = renderToStaticMarkup(
        <TestProviders>
          <BrandBar
            user={{
              id: "u1",
              name: "Peter",
              email: "p@s.de",
              emailVerified: true,
              telefon: null,
            }}
          />
        </TestProviders>,
      );
      expect(barHtml).toContain('href="/hof"');
      expect(barHtml).toContain("Mein Hof");
      expect(barHtml).toContain('href="/ueber-uns"');
      expect(barHtml).toContain("Über uns");
      expect(barHtml).toContain('href="/warum-wir-das-machen"');
      expect(barHtml).toContain("Warum kostenlos?");

      const footerHtml = renderToStaticMarkup(
        <TestProviders>
          <Footer />
        </TestProviders>,
      );
      expect(footerHtml).toContain('href="/ueber-uns"');
      expect(footerHtml).toContain("Über uns");
      expect(footerHtml).toContain('href="/warum-wir-das-machen"');
      expect(footerHtml).toContain("Warum kostenlos?");
    });

    it("renders /ueber-uns with personal founder stories, Weihenstephan 2022 origin, and Munich team while omitting the removed track-record/association claims", () => {
      const html = renderToStaticMarkup(
        <TestProviders>
          <UeberUnsPage />
        </TestProviders>,
      );

      expect(html).toContain("Über uns · NoMaze GmbH aus München");
      expect(html).toContain("Von der Raumfahrt und KI-Forschung auf deinen Acker.");
      expect(html).toContain("Wer wir sind: Züchter-Wissen direkt für deinen Acker.");
      expect(html).toContain("NoMaze");
      // Removed track-record / association claims must not appear on /ueber-uns
      expect(html).not.toContain("Weltweit im Einsatz · 3 Kontinente");
      expect(html).not.toContain("Bewährt in der Spitzenzüchtung");
      expect(html).not.toContain("3 der 7 größten Pflanzenzüchter der Welt");
      expect(html).not.toContain("Verankert in den Verbänden der Saatgutbranche");
      expect(html).not.toContain("International Seed Federation");
      expect(html).not.toContain("Deutsches Maiskomitee e.V.");
      expect(html).not.toContain("KWS");
      expect(html).not.toContain("Namdhari Seeds");
      expect(html).not.toContain("Limagrain");
      expect(html).toContain("Jean-Pascal Lutze");
      expect(html).toContain("/team/jean-pascal-lutze.jpg");
      expect(html).toContain("Mechatroniker");
      expect(html).toContain("Robotics, Cognition, Intelligence");
      expect(html).toContain("DLR");
      expect(html).toContain("On-Orbit Assembly");
      expect(html).toContain("Finn Gaida");
      expect(html).toContain("/team/finn-gaida.jpg");
      expect(html).not.toContain("/team/finn-gaida.svg");
      expect(html).toContain("Kaia Health");
      expect(html).toContain("Mit 14 Jahren");
      expect(html).not.toContain("Stanislaw");
      expect(html).not.toContain("Praxis &amp; Ackerbau im direkten Dialog");
      expect(html).toContain("Vom Impuls in Weihenstephan (2022) zu Seedle");
      expect(html).toContain("Macht doch mal was wirklich Sinnvolles mit eurer Technologie!");
      expect(html).toContain("Kreuzungsvorhersagen mit Umweltinteraktion");
      expect(html).toContain("Genetik-Experten");
      expect(html).toContain("Mathematiker");
      expect(html).toContain("Physiker");
      expect(html).toContain("Robotiker");
      expect(html).toContain("Biologen");
      expect(html).toContain("Teste es jetzt auf deinem eigenen Schlag");
      expect(html).toContain('href="/feld/neu"');
    });

    it("renders /warum-wir-das-machen with neuromarketing trust architecture, G×E×M deep dive, and privacy firewall", () => {
      const html = renderToStaticMarkup(
        <TestProviders>
          <WarumWirDasMachenPage />
        </TestProviders>,
      );

      expect(html).toContain("Warum kostenlos? · Offene Karten &amp; Geschäftsmodell");
      expect(html).toContain("Warum Seedle für Landwirte heute und in Zukunft 0 € kostet.");
      expect(html).toContain("Wo ist der Haken?");
      expect(html).toContain("Pflanzenzüchter");
      expect(html).toContain("Biologicals");
      expect(html).toContain("Chemicals");
      expect(html).toContain("Der faire Wert-Kreislauf");
      // The value loop is drawn natively with 4 stations and 4 directed arrows (including return loop to NoMaze).
      expect(html).toContain('data-testid="fair-value-loop-diagram"');
      expect(html).toContain("Pflanzenzüchter");
      expect(html).toContain("B2B-Forschungsbudget");
      expect(html).toContain('data-testid="kreislauf-arrow-1-reverse"');
      expect(html).toContain("Vorhersagen (G×E-Vorhersagen für die Züchtung)");
      expect(html).toContain("NoMaze liefert präzise In-Silico-Vorhersagen zurück an die Züchter");
      expect(html).toContain("NoMaze Forschung");
      expect(html).toContain("NoMaze In-Silico");
      expect(html).toContain("Finanziert &amp; baut Seedle");
      expect(html).toContain("Seedle Plattform");
      expect(html).toContain("Nutzt den Landwirten (0 €)");
      expect(html).toContain("Landwirte in der Praxis");
      expect(html).toContain("Spielen anonymisierte G×E-Felddaten zurück zu NoMaze");
      expect(html).toContain('data-testid="kreislauf-return-arrow-svg"');
      expect(html).toContain("Anonymisierte Pflanzen- &amp; Umwelt-Erkenntnisse schließen die Labor-Feld-Lücke");
      expect(html).toContain("G × E × M");
      expect(html).toContain("Labor-Versuch");
      expect(html).toContain("Echter Acker");
      expect(html).toContain("P = G");
      expect(html).toContain("Pflanzen-Biologie JA · Private Betriebsdaten NEIN");
      expect(html).not.toContain(
        "Kein Züchter und kein Chemie-/Biologicals-Hersteller kann sich bei Seedle einen besseren Platz im Sorten-Ranking kaufen.",
      );
      expect(html).toContain("alle kommenden Tools für Landwirte auf Seedle");
      expect(html).toContain("Jean-Pascal, Stani &amp; Finn");
      expect(html).toContain('href="/feld/neu"');
      expect(html).not.toContain("—");
      expect(html).not.toContain("–");

      const aliasHtml = renderToStaticMarkup(
        <TestProviders>
          <WarumKostenlosPage />
        </TestProviders>,
      );
      expect(aliasHtml).toContain("Warum Seedle für Landwirte heute und in Zukunft 0 € kostet.");
    });
  });

  describe("2. SEEDLE-FEAT-007 (A2): /anbau 2-Step Crop Selection (Unselected on Start -> Click Mais -> 3 Usage Cards) without Auto-Knowledge Box", () => {
    it("starts with no crop pre-selected, omits the auto-detected field knowledge box, keeps non-maize preview crops non-selectable, and reveals the 3 maize usage cards (Körnermais, Silomais, Biogasmais) when Mais is selected", async () => {
      const el = await Anbau({
        params: Promise.resolve({ fieldId: "f-hinteracker" }),
      });
      const initialHtml = renderToStaticMarkup(<TestProviders>{el}</TestProviders>);

      // Auto field knowledge box must be completely removed on /anbau
      expect(initialHtml).not.toContain("Was wir bereits automatisch über dein Feld wissen");
      expect(initialHtml).toContain('data-testid="crop-card-mais"');
      expect(initialHtml).toContain('aria-checked="false"');
      expect(initialHtml).toContain('role="radiogroup"');
      expect(initialHtml).not.toContain('data-testid="maize-usage-options-card"');

      // Maize is the only selectable crop; preview crops remain read-only and cannot be co-selected
      for (const crop of [
        "Winterweizen",
        "Sonnenblumen",
        "Winterraps",
        "Wintergerste",
        "Zuckerrüben",
        "Sojabohnen",
        "Körnererbse / Ackerbohne",
      ]) {
        expect(initialHtml).toContain(crop);
      }
      expect(initialHtml).toContain("Bald verfügbar");
      expect(initialHtml).toContain('data-testid="preview-crop-card-winterweizen"');
      expect(initialHtml).toContain('data-testid="preview-crop-card-sonnenblumen"');
      expect(initialHtml).toContain('data-testid="preview-crop-card-winterraps"');
      expect(initialHtml).toContain('data-testid="preview-crop-card-wintergerste"');
      expect(initialHtml).toContain('data-testid="preview-crop-card-zuckerr-ben"');
      expect(initialHtml).toContain('aria-disabled="true"');
      expect(initialHtml).not.toContain('data-testid="crop-waitlist-winterweizen"');

      // Step 2: once Mais is clicked, the 3 usage cards pop up with strict single-select radio semantics
      const selectedHtml = renderToStaticMarkup(
        <TestProviders>
          <AnbauCropUsageSection
            fieldId="f-hinteracker"
            fieldName="Hinteracker"
            areaHa={14.5}
            defaultCropSelected="mais"
          />
        </TestProviders>,
      );
      expect(selectedHtml).toContain('data-testid="crop-card-mais"');
      expect(selectedHtml).toContain('aria-checked="true"');
      expect(selectedHtml).toContain('data-testid="maize-usage-options-card"');
      expect(selectedHtml).toContain('aria-label="Nutzungsrichtung für Mais"');
      expect(selectedHtml).toContain('data-testid="usage-option-koernermais"');
      expect(selectedHtml).toContain('data-testid="usage-option-silomais"');
      expect(selectedHtml).toContain('data-testid="usage-option-biogasmais"');
      expect(selectedHtml).toContain('role="radio"');
      expect(selectedHtml).toContain("/feld/f-hinteracker/ranking?usage=koernermais");
      expect(selectedHtml).toContain("/feld/f-hinteracker/ranking?usage=silomais");
      expect(selectedHtml).toContain("/feld/f-hinteracker/ranking?usage=biogasmais");
      expect(selectedHtml).toContain(
        "Biogasmais (Maximale Biogas- &amp; Methanausbeute / TM-Ertrag)",
      );
      // Preview crops remain non-selectable alongside selected maize
      expect(selectedHtml).toContain('data-testid="preview-crop-card-winterweizen"');
      expect(selectedHtml).toContain('aria-disabled="true"');
    });
  });

  describe("3. SEEDLE-FEAT-005 & SEEDLE-FEAT-007 (A3): Funnel Pages /boden & /wichtig + Complete Removal of 'Rote Gebiete'", () => {
    it("renders /boden with auto-detected soil/nFK and 1-click farmer chips, and completely removes 'Rote Gebiete'", () => {
      const html = renderToStaticMarkup(
        <BodenProfileForm
          fieldId="f-hinteracker"
          fieldName="Hinteracker"
          areaHa={14.5}
          initialUsage="koernermais"
        />,
      );

      expect(html).toContain("✓ Automatisch aus Standortdaten ermittelt — anpassbar");
      expect(html).not.toContain("Rotes Gebiet");
      expect(html).not.toContain("Rote Gebiete");
      expect(html).not.toContain("§ 13a");
      expect(html).toContain("Rindergülle");
      expect(html).toContain("Bodenlebewesen- &amp; Regenwurm-Aktivitäts-Hinweis:");
      expect(html).toContain("Keine Bewässerung (Regenfeldbau)");
      expect(html).toContain("Winterweizen");
      expect(html).toContain("Leguminosen-Mischung (N-fixierend)");
    });

    it("renders /wichtig with strategy cards, FAO maturity groups, sowing/harvest windows, priorities, and reference variety", () => {
      const html = renderToStaticMarkup(
        <WichtigProfileForm fieldId="f-hinteracker" initialUsage="biogasmais" />,
      );

      expect(html).toContain("Stabilität (Sichere Bank)");
      expect(html).toContain("Plastizität (High-Performer)");
      expect(html).toContain("Ausgewogener Mix");
      expect(html).toContain("Früh (S 190–220");
      expect(html).toContain("Standfestigkeit (Kein Lager vor der Ernte)");
      expect(html).toContain("Trockenstress- &amp; Hitzetoleranz");
      expect(html).toContain("Meine Sorten für 2027 berechnen →");
    });

    it("formats agronomy recap summary accurately without any Red-Zone string", () => {
      const profile = createDefaultAgronomyProfile("f-hinteracker", "biogasmais");
      const summary = formatAgronomyRecapSummary(profile);
      expect(summary).toContain(SOIL_TYPE_LABELS.sandiger_lehm.short);
      expect(summary).toContain("Regenfeldbau");
      expect(summary).not.toContain("Rotes Gebiet");
      expect(TILLAGE_BIOLOGY_HINT.direktsaat.biologyHint).toContain("Regenwurm-Aktivität");
    });
  });

  describe("4. SEEDLE-FEAT-007 (A4 & A5): 90% Weather Confidence, Compact Maturity Badge, Advisor Rationale, 3-Stage Risk Slider & Kitchen Table PDF Sheet", () => {
    it("renders FieldRankingView with 90% weather confidence, compact maturity badge, advisor rationale, 3-stage risk slider (75/25 default), and KitchenTablePrintSheet", async () => {
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();

      const html = renderToStaticMarkup(
        <TestProviders>
          <FieldRankingView
            field={{ ...field, usage: "biogasmais" }}
            rec={rec!}
            sortierung="gewichtet"
          />
        </TestProviders>,
      );

      // Weather scenario tabs and 10Y weather banner are omitted from the main ranking view so the risk slider and recommended varieties sit directly at the top
      expect(html).not.toContain("Dein Wunsch-Szenario (aus deinen Angaben)");
      expect(html).not.toContain('data-testid="ranking-weather-10y-section"');

      // No Red Zone anywhere
      expect(html).not.toContain("Rotes Gebiet");

      // Compact maturity badge & prominent Advisor Rationale
      expect(html).toContain('data-testid="compact-maturity-badge"');
      expect(html).toContain("Warum genau diese Sorte auf deinem Feld gewinnt (Berater-Begründung)");
      expect(html).toContain("Auch wenn eine andere Sorte auf dem Papier 1 Note mehr Rohertrag hat");

      // 2D axes + decoupled variety count controls
      expect(html).toContain(
        "Wie risikofreudig bist du bei der Sortenwahl? (Risikostreuung auf deinem Betrieb)",
      );
      expect(html).toContain('data-testid="risk-appetite-slider"');
      expect(html).toContain('data-testid="strategy-axis-stability"');
      expect(html).toContain('data-testid="strategy-axis-balanced"');
      expect(html).toContain('data-testid="strategy-axis-performance"');
      expect(html).toContain('data-testid="xy-cell-3-stability"');
      expect(html).toContain('data-testid="xy-cell-2-balanced"');
      expect(html).toContain('data-testid="xy-cell-1-performance"');
      expect(html).toContain('data-testid="variety-xy-scatter-plot"');
      expect(html).toContain(
        "1. X-Achse: Stabilität → Plastizität (Umweltreaktion)",
      );
      expect(html).toContain(
        "2. Y-Achse: Konservativ (viele Daten) ↔ Offensiv (weniger Daten)",
      );
      expect(html).toContain("3. Anzahl Sorten auf deinen Schlägen");
      expect(html).toContain("Konservativ (viele Daten)");
      expect(html).toContain("Offensiv (weniger Daten)");
      expect(html).toContain("1 Sorte (100 %)");
      expect(html).toContain("2 Sorten (75 % / 25 %)");
      expect(html).toContain("3 Sorten (50 % / 30 % / 20 %)");
      expect(html).toContain('data-testid="variety-provenance-badge"');
      expect(html).toContain("↑ Konservativ (Viele Daten &amp; Prüfjahre)");
      expect(html).toContain("↓ Offensiv (Weniger Daten · Neue Züchtung)");
      expect(html).toContain("← Stabilität (Ertragstreu)");
      expect(html).toContain("Plastizität (Spitzenertrag) →");
      expect(html).toContain(
        "X-Achse: <strong class=\"text-fg\">Stabilität → Plastizität (Umweltreaktion)</strong>",
      );
      expect(html).toContain(
        "Y-Achse: <strong class=\"text-fg\">Konservativ (viele Daten) ↔ Offensiv (weniger Daten)</strong>",
      );
      expect(html).toContain("75 % Bewährte Hauptsorte (Platz 1)");
      expect(html).toContain("25 % Neuer Zuchtfortschritt (Platz 2)");

      // Verify rankVarietiesByStrategyAxis shifts #1 winner between stability and peak performance
      const baseV = rec!.sorten[0]!;
      const stabilityChamp = {
        ...baseV,
        variety: {
          ...baseV.variety,
          id: "v-stability",
          name: "StabiMais 220",
          reifezahl: 220,
          zulassungsjahr: 2021,
          traits: {
            ...baseV.variety.traits,
            trockentoleranz: 9 as const,
            standfestigkeit: 9 as const,
            jugendentwicklung: 9 as const,
            staengelfaeule: 1 as const,
          },
        },
        predictions: baseV.predictions.map((p) => ({
          ...p,
          trockenmasseDtHa: 195,
          kornertragDtHa: 118,
        })),
      };
      const performanceChamp = {
        ...baseV,
        variety: {
          ...baseV.variety,
          id: "v-performance",
          name: "TurboErtrag 260",
          reifezahl: 260,
          zulassungsjahr: 2025,
          traits: {
            ...baseV.variety.traits,
            trockentoleranz: 5 as const,
            standfestigkeit: 6 as const,
            jugendentwicklung: 6 as const,
            staengelfaeule: 4 as const,
          },
        },
        predictions: baseV.predictions.map((p) => ({
          ...p,
          trockenmasseDtHa: 242,
          kornertragDtHa: 148,
        })),
      };
      const stabilityRanked = rankVarietiesByStrategyAxis(
        [performanceChamp, stabilityChamp],
        "silomais",
        "gewichtet",
        rec!.scenarios,
        "stability",
        "conservative",
      );
      const performanceRanked = rankVarietiesByStrategyAxis(
        [stabilityChamp, performanceChamp],
        "silomais",
        "gewichtet",
        rec!.scenarios,
        "performance",
        "offensive",
      );
      expect(stabilityRanked[0]!.variety.id).toBe("v-stability");
      expect(performanceRanked[0]!.variety.id).toBe("v-performance");

      // PDF Export button & Print Sheet
      expect(html).toContain('data-testid="print-pdf-button"');
      expect(html).toContain("PDF Export");
      expect(html).toContain('data-testid="kitchen-table-print-sheet"');
      expect(html).toContain("Seedle Hof-Empfehlung 2027");
      expect(html).toContain("Für deinen Schlag ausgewählt (Im Hof sichern)");
      // WarmerStartView and the "Weitere Sorten vergleichen oder komplettes LSV-Prüffeld durchstöbern" block are omitted from "Deine Sorte 2027"
      expect(html).not.toContain("Schneller Einstieg – was hast du bisher angebaut?");
      expect(html).not.toContain('data-testid="warmer-start-view"');
      expect(html).not.toContain("Weitere Sorten vergleichen oder komplettes LSV-Prüffeld durchstöbern");
      expect(html).not.toContain('data-testid="compare-with-farm-variety-btn"');
      expect(html).not.toContain('data-testid="toggle-all-lsv-varieties-btn"');

      // Biological maturity staggering, usage biology focus & seed units (50,000 kernels/bag)
      expect(html).toContain('data-testid="maturity-stagger-badge"');
      expect(html).toContain(
        "Reife und Blüte versetzt zur Hauptsorte · Breiteres Erntefenster",
      );
      expect(html).toContain('data-testid="usage-biology-focus"');
      expect(html).toContain(
        "Fokus auf maximale Gesamttrockenmasse und Methanausbeute je Hektar",
      );
      expect(html).toContain('data-testid="seed-units-badge"');
      expect(html).toContain("Saatgutbedarf: ca.");
      expect(html).toContain("Einheiten (Säcke zu 50.000 Körnern)");
      expect(html).toContain('data-testid="site-adapted-seeding-rate"');
      expect(html).toContain("Empfohlene Aussaatstärke auf diesem Schlag:");
      expect(html).toContain("Körner je m² · ca.");
      expect(html).toContain("Einheiten Saatgut");

      // 3-Model Ensemble Evaluation & Decision Tree Breakdown
      expect(html).toContain("3-Modell-Prüfung &amp; Entscheidungsbaum einblenden");
      expect(html).toContain('data-testid="three-model-breakdown-box"');
      expect(html).toContain("Modell 1 · Pflanzenbau-Wissensbaum");
      expect(html).toContain("Modell 2 · Statistisches LSV-GxE-Modell");
      expect(html).toContain("Modell 3 · Nichtlineares ML-Interaktionsmodell");
      expect(html).toContain("Modell-Konsens:");

      const breakdown = buildDeterministicThreeModelBreakdown(
        rec!.sorten[0]!,
        106,
        "biogasmais",
        createDefaultAgronomyProfile("f-hinteracker", "biogasmais"),
        {
          lat: 48.4028,
          lon: 11.7489,
          elevationM: 470,
          source: "regional-climatology",
          years: [],
          avgPrecipTotalMm: 760,
          avgPrecipVegMm: 350,
          avgPrecipFloweringMm: 138,
          avgEffectivePrecipVegMm: 312,
          avgTempMeanC: 9.8,
          avgTempVegMeanC: 16.7,
          avgGrowingDegreeDays: 1460,
          avgHotDays30C: 14,
          droughtYearsCount: 2,
          diseasePressureHint: "Ausgeglichener Standort",
          siteCharacter: {
            headline: "Ausgeglichener Standort",
            primaryBadge: "Ausgeglichener Gunststandort",
            summerWaterBalanceMm: -65,
            julyHeatDaysAvg: 7,
            recommendedMaturityRange: "Reifegruppe S 230 bis S 250",
            traits: [],
          },
          climateOutlookNextYear: {
            targetYear: 2027,
            consensusHeadline: "Standort-Risikokorridor",
            consensusAdvice: "Pflanzenbauliche Einordnung",
            avgTempDeltaC: 1.0,
            avgSummerPrecipTrendPct: -7,
            models: [],
          },
        },
      );
      expect(breakdown.knowledge_tree_score).toBeGreaterThanOrEqual(76);
      expect(breakdown.statistical_gxe_score).toBeGreaterThanOrEqual(75);
      expect(breakdown.ml_ensemble_score).toBeGreaterThanOrEqual(77);
      expect(breakdown.model_agreement_pct).toBeGreaterThanOrEqual(84);
      expect(breakdown.decision_tree_path).toHaveLength(3);
      expect(breakdown.top_drivers).toHaveLength(3);

      const drySeeding = computeSiteAdaptedSeedingRate(
        10,
        "silomais",
        "Trockenstress-Standort",
      );
      const wetSeeding = computeSiteAdaptedSeedingRate(
        10,
        "silomais",
        "Feuchter Ertragsstandort",
      );
      expect(drySeeding.kernelsPerM2Formatted).toBe("8,4");
      expect(wetSeeding.kernelsPerM2Formatted).toBe("9,8");
      expect(drySeeding.seedUnits).toBeLessThan(wetSeeding.seedUnits);

      // Direct unit checks for computeSeedUnitsForHa, getUsageBiologyFocusText, and buildAgronomicRiskPortfolio
      expect(computeSeedUnitsForHa(7.5, "koernermais")).toEqual({
        seedUnits: 13,
        seedsPerM2Label: "8,5 Körner/m²",
        unitsPerHa: 1.7,
      });
      expect(computeSeedUnitsForHa(7.5, "silomais")).toEqual({
        seedUnits: 14,
        seedsPerM2Label: "9,2 Körner/m²",
        unitsPerHa: 1.84,
      });
      expect(getUsageBiologyFocusText("koernermais")).toContain("Dry Down");
      expect(getUsageBiologyFocusText("silomais")).toContain("Stay Green");

      const mockRanked = [
        {
          ...rec!.sorten[0]!,
          variety: { ...rec!.sorten[0]!.variety, id: "v1", reifezahl: 240 },
        },
        {
          ...rec!.sorten[0]!,
          variety: { ...rec!.sorten[0]!.variety, id: "v2-same-fao", reifezahl: 240 },
        },
        {
          ...rec!.sorten[0]!,
          variety: { ...rec!.sorten[0]!.variety, id: "v3-staggered", reifezahl: 220 },
        },
      ];
      const portfolio2 = buildAgronomicRiskPortfolio(mockRanked, 2);
      expect(portfolio2).toHaveLength(2);
      expect(portfolio2[0]!.variety.id).toBe("v1");
      expect(portfolio2[1]!.variety.id).toBe("v3-staggered");
      expect(
        Math.abs(portfolio2[1]!.variety.reifezahl - portfolio2[0]!.variety.reifezahl),
      ).toBeGreaterThanOrEqual(10);
    });

    // @vitest-environment jsdom
    it("A2: keeps scatter plot variety coordinates invariant across X-axis, Y-axis, and 1-3 variety switches", async () => {
      const React = await import("react");
      const { act } = React;
      const { createRoot } = await import("react-dom/client");
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();

      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(
          <TestProviders>
            <FieldRankingView
              field={{ ...field, usage: "biogasmais" }}
              rec={rec!}
              sortierung="gewichtet"
            />
          </TestProviders>,
        );
      });

      const scatter = container.querySelector('[data-testid="variety-xy-scatter-plot"]');
      expect(scatter).not.toBeNull();

      const sampleButton = scatter!.querySelector("button[data-variety-id]") as HTMLButtonElement | null;
      expect(sampleButton).not.toBeNull();
      const varietyId = sampleButton!.getAttribute("data-variety-id");
      expect(varietyId).toBeTruthy();

      const readCoords = (): { x: string | null; y: string | null } => {
        const btn = scatter!.querySelector(
          `button[data-variety-id="${varietyId}"]`,
        ) as HTMLButtonElement | null;
        expect(btn).not.toBeNull();
        return {
          x: btn!.getAttribute("data-scatter-x"),
          y: btn!.getAttribute("data-scatter-y"),
        };
      };

      const initial = readCoords();
      expect(initial.x).not.toBeNull();
      expect(initial.y).not.toBeNull();

      const clickTestId = async (testId: string): Promise<void> => {
        const el = container.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
        expect(el).not.toBeNull();
        await act(async () => {
          (el as HTMLButtonElement).click();
        });
      };

      for (const testId of [
        "strategy-axis-stability",
        "strategy-axis-balanced",
        "strategy-axis-performance",
        "confidence-axis-conservative",
        "confidence-axis-offensive",
        "confidence-axis-balanced",
        "risk-level-btn-1",
        "risk-level-btn-3",
        "risk-level-btn-2",
      ]) {
        await clickTestId(testId);
        const coords = readCoords();
        expect(coords.x).toBe(initial.x);
        expect(coords.y).toBe(initial.y);
      }

      await act(async () => {
        root.unmount();
      });
      container.remove();
    });
  });

  describe("5. SEEDLE-FEAT-006: Steckbrief Unwrap Fix, Compare Modal, WhereToBuy & Euro-Free Deep Analysis", () => {
    it("safely unwraps { detail: DmkVarietyDetail } and direct DmkVarietyDetail in unwrapVarietyDetailPayload", () => {
      const mockDetail = {
        sorte: { sorte_id: 101, sorte: "AW Talkrone", zuechter: "AckerWerk Genetik" },
        bsl: { latest: null, history: [] },
        trials: { totalCount: 18, byRegion: [], recentTrials: [] },
      };

      const wrapped = unwrapVarietyDetailPayload({ detail: mockDetail });
      expect(wrapped?.sorte.sorte).toBe("AW Talkrone");

      const direct = unwrapVarietyDetailPayload(mockDetail);
      expect(direct?.sorte.sorte).toBe("AW Talkrone");

      const empty = unwrapVarietyDetailPayload({ detail: null });
      expect(empty).toBeNull();
    });

    it("renders VarietyCompareModal side-by-side comparison matrix", () => {
      const html = renderToStaticMarkup(
        <VarietyCompareModal
          open={true}
          onClose={() => {}}
          fieldName="Hinteracker"
          comparedIds={["aw-talkrone", "fg-kontinent"]}
          onToggleCompareId={() => {}}
          allVarieties={[
            {
              id: "aw-talkrone",
              rang: 1,
              name: "AW Talkrone",
              zuechter: "AckerWerk Genetik",
              reifezahl: 240,
              relErtragNormal: 106,
              relErtragTrocken: 105,
              relErtragKuehl: 103,
              standfestigkeit: 8,
              trockentoleranz: 8,
              jugendentwicklung: 8,
              krankheitsresistenz: 8,
              soilSuitabilityLabel: "Sehr gut für Sandiger Lehm",
            },
            {
              id: "fg-kontinent",
              rang: 2,
              name: "FG Kontinent",
              zuechter: "Feldmark Genetics",
              reifezahl: 250,
              relErtragNormal: 100,
              relErtragTrocken: 98,
              relErtragKuehl: 101,
              standfestigkeit: 8,
              trockentoleranz: 7,
              jugendentwicklung: 7,
              krankheitsresistenz: 7,
              soilSuitabilityLabel: "Gute Eignung",
              isReference: true,
            },
          ]}
        />,
      );

      expect(html).toContain("Sorten direkt nebeneinander vergleichen");
      expect(html).toContain("AW Talkrone");
      expect(html).toContain("FG Kontinent");
      expect(html).toContain("S 240 / K 240");
      expect(html).toContain("106 %");
    });

    it("renders WhereToBuyModal and /kaufen/[varietyId] page with regional agricultural trade & breeder advisors", async () => {
      const modalHtml = renderToStaticMarkup(
        <WhereToBuyModal
          open={true}
          onClose={() => {}}
          variety={{ id: "aw-talkrone", name: "AW Talkrone", zuechter: "KWS", reifezahl: 240 }}
          region="Bayern"
          schlagName="Hinteracker"
        />,
      );
      expect(modalHtml).toContain("RWA / Raiffeisen Waren-Agrar");
      expect(modalHtml).toContain("BayWa Agrar");
      expect(modalHtml).toContain("AGRAVIS Raiffeisen");
      expect(modalHtml).toContain("Verfügbarkeit anfragen");
      expect(modalHtml).toContain("Rückruf-Anfrage");

      const pageEl = await Kaufen({
        params: Promise.resolve({ fieldId: "f-hinteracker", varietyId: "aw-talkrone" }),
      });
      const pageHtml = renderToStaticMarkup(<TestProviders>{pageEl}</TestProviders>);
      expect(pageHtml).toContain("Wo kann ich „AW Talkrone“ kaufen?");
      expect(pageHtml).toContain("Regionaler Agrarhandel / Genossenschaft vor Ort");
    });

    it("removes all Euro (€) and Red-Zone values from the Agronomic Deep Analysis page (/sorte/[varietyId]) and includes 90% confidence + PDF print button", async () => {
      const el = await Sorte({
        params: Promise.resolve({ fieldId: "f-hinteracker", varietyId: "aw-talkrone" }),
      });
      const html = renderToStaticMarkup(<TestProviders>{el}</TestProviders>);

      expect(html).not.toContain("Wert je ha");
      expect(html).not.toContain("€");
      expect(html).not.toContain("Roten Gebiet");
      expect(html).not.toContain("Rotes Gebiet");
      expect(html).toContain(
        "✓ 90 % Standort- &amp; Wetter-Konfidenz (Mehrjähriges DWD- &amp; LSV-Profil)",
      );
      expect(html).toContain('data-testid="print-pdf-button"');
      expect(html).toContain(
        "Wie hätte diese Sorte in den letzten Jahren auf deinem Standort performt?",
      );
      expect(html).toContain("Passung zu deinen Boden- &amp; Anbauangaben");
      expect(html).toContain("Wo kann ich diese Sorte kaufen?");
    });
  });

  describe("6. Audit Hardening (Pass 1–3) & Cadastral Feldkarte / 1-Click Parcel Snap", () => {
    it("sanitizes corrupted or array-shaped localStorage in loadFieldAgronomyProfile without crashing", () => {
      const store: Record<string, string> = {};
      const origWindow = globalThis.window;
      // Provide minimal window.localStorage stub with corrupted payloads
      (globalThis as unknown as { window: unknown }).window = {
        localStorage: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
        },
      };

      try {
        // Case 1: Array stored instead of object
        store["seedle_agronomy_profile_v1_f-corrupt"] = JSON.stringify([1, 2, 3]);
        const p1 = loadFieldAgronomyProfile("f-corrupt", "koernermais");
        expect(p1.soilType).toBe("sandiger_lehm");
        expect(p1.usage).toBe("koernermais");

        // Case 2: Invalid enum values, NaN numbers, non-string referenceVariety
        store["seedle_agronomy_profile_v1_f-corrupt"] = JSON.stringify({
          soilType: "invalid_soil",
          trafficability: 999,
          tillage: null,
          strategy: "invalid_strat",
          humusPercent: "not-a-number",
          nfkMm: -50,
          referenceVariety: { bad: true },
          priorities: ["standfestigkeit", "invalid_prio", 42],
          riskAppetite: 99,
        });
        const p2 = loadFieldAgronomyProfile("f-corrupt", "biogasmais");
        expect(p2.soilType).toBe("sandiger_lehm");
        expect(p2.trafficability).toBe("normal");
        expect(p2.tillage).toBe("grubber");
        expect(p2.strategy).toBe("ausgewogen");
        expect(p2.humusPercent).toBe(2.2);
        expect(p2.nfkMm).toBe(165);
        expect(p2.referenceVariety).toBe("AW Talkrone");
        expect(p2.priorities).toEqual(["standfestigkeit"]);
        expect(p2.riskAppetite).toBe(2);
      } finally {
        (globalThis as unknown as { window: unknown }).window = origWindow;
      }
    });

    it("detects polygon self-intersection (bowtie), generates deterministic surroundingFieldParcels with FLIK IDs, and snaps via findParcelAtPoint", () => {
      const validPoly = {
        type: "Polygon" as const,
        coordinates: [
          [
            [11.74, 48.4] as [number, number],
            [11.75, 48.4] as [number, number],
            [11.75, 48.41] as [number, number],
            [11.74, 48.41] as [number, number],
            [11.74, 48.4] as [number, number],
          ],
        ],
      };
      const bowtiePoly = {
        type: "Polygon" as const,
        coordinates: [
          [
            [11.74, 48.4] as [number, number],
            [11.75, 48.41] as [number, number],
            [11.75, 48.4] as [number, number],
            [11.74, 48.41] as [number, number],
            [11.74, 48.4] as [number, number],
          ],
        ],
      };
      expect(hasSelfIntersection(validPoly)).toBe(false);
      expect(hasSelfIntersection(bowtiePoly)).toBe(true);

      const center = { lat: 48.4028, lon: 11.7489 };
      const parcelsA = surroundingFieldParcels(center);
      const parcelsB = surroundingFieldParcels(center);
      expect(parcelsA.length).toBeGreaterThanOrEqual(8);
      expect(parcelsA[0]!.flik).toMatch(/^FLIK DE-BY-084/);
      expect(parcelsA[0]!.flik).toBe(parcelsB[0]!.flik);
      expect(parcelsA[0]!.areaHa).toBeGreaterThanOrEqual(4.5);
      expect(parcelsA[0]!.areaHa).toBeLessThanOrEqual(24.0);
      expect(hasSelfIntersection(parcelsA[0]!.polygon)).toBe(false);

      const snapped = findParcelAtPoint(center, parcelsA);
      expect(snapped).not.toBeNull();
      expect(snapped?.id).toBe(parcelsA[0]!.id);
    });

    it("uses real Esri World Imagery raster style for LUFTBILD (!== KARTE) and renders Feldkarte toggle in FieldPicker", () => {
      expect(LUFTBILD).not.toEqual(KARTE);
      expect(typeof LUFTBILD).toBe("object");

      const pickerHtml = renderToStaticMarkup(
        <TestProviders>
          <FieldPicker mode="neu" />
        </TestProviders>,
      );
      expect(pickerHtml).toContain('data-testid="flurkarte-toggle-btn"');
      expect(pickerHtml).toContain("Feldkarte / Schläge an");
      expect(pickerHtml).toContain("1-Klick Ackerschlag-Snap");
    });

    it("handles FieldRankingView gracefully with 0 varieties (empty state) and 1 variety (no duplicate variety in portfolio)", async () => {
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();

      // 0 varieties -> renders recap banner + empty state instead of blank screen
      const emptyHtml = renderToStaticMarkup(
        <TestProviders>
          <FieldRankingView
            field={field}
            rec={{ ...rec!, sorten: [] }}
            sortierung="gewichtet"
          />
        </TestProviders>,
      );
      expect(emptyHtml).toContain("Dein Schlag-Profil");
      expect(emptyHtml).toContain("Keine Sorten für dieses Anbaugebiet verfügbar.");

      // 1 variety -> renders 100% single variety instead of duplicating #1 as 75% + 25%
      const singleVariety = rec!.sorten.slice(0, 1);
      const singleHtml = renderToStaticMarkup(
        <TestProviders>
          <FieldRankingView
            field={field}
            rec={{ ...rec!, sorten: singleVariety }}
            sortierung="gewichtet"
          />
        </TestProviders>,
      );
      expect(singleHtml).toContain("100 % Bewährte Hauptsorte (Sichere Bank)");
      expect(singleHtml).not.toContain("25 % Neuer Zuchtfortschritt (Platz 2)");
    });

    it("Stresstest 1 (Rapid-Click Matrix Torture Test): shifts cleanly between multi-year proven varieties and fresh breeding progress across 12 rapid transitions", async () => {
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();
      const sorten = rec!.sorten;

      const stabilityRanked = rankVarietiesByStrategyAxis(
        sorten,
        "koernermais",
        "gewichtet",
        rec!.scenarios,
        "stability",
        "conservative",
      );
      const balancedRanked = rankVarietiesByStrategyAxis(
        sorten,
        "koernermais",
        "gewichtet",
        rec!.scenarios,
        "balanced",
        "balanced",
      );
      const performanceRanked = rankVarietiesByStrategyAxis(
        sorten,
        "koernermais",
        "gewichtet",
        rec!.scenarios,
        "performance",
        "offensive",
      );

      const topStabilityProv = deriveVarietyTrialProvenance(stabilityRanked[0]!);
      const topPerformanceProv = deriveVarietyTrialProvenance(performanceRanked[0]!);

      // Stability + Conservative prioritizes multi-year tested varieties with higher trialYearsCount
      expect(topStabilityProv.trialYearsCount).toBeGreaterThanOrEqual(
        topPerformanceProv.trialYearsCount,
      );
      expect(topStabilityProv.provenanceBadge).toContain("Prüfjahre");

      // Simulate 12 rapid matrix transitions including duplicate clicks and verify deduplication + portfolio invariants
      const clickSequence: Array<{
        axis: "stability" | "balanced" | "performance";
        count: 1 | 2 | 3;
      }> = [
        { axis: "balanced", count: 2 }, // initial duplicate -> skipped
        { axis: "stability", count: 2 },
        { axis: "stability", count: 2 }, // duplicate -> skipped
        { axis: "stability", count: 1 },
        { axis: "stability", count: 3 },
        { axis: "performance", count: 3 },
        { axis: "performance", count: 3 }, // duplicate -> skipped
        { axis: "performance", count: 2 },
        { axis: "performance", count: 1 },
        { axis: "balanced", count: 3 },
        { axis: "balanced", count: 1 },
        { axis: "balanced", count: 2 },
      ];

      let lastKey = "balanced:2";
      let networkCallCount = 0;

      for (const step of clickSequence) {
        const key = `${step.axis}:${step.count}`;
        if (key === lastKey) {
          continue;
        }
        lastKey = key;
        networkCallCount += 1;

        const rankedForStep =
          step.axis === "stability"
            ? stabilityRanked
            : step.axis === "performance"
              ? performanceRanked
              : balancedRanked;
        const portfolio = buildAgronomicRiskPortfolio(rankedForStep, step.count);
        expect(portfolio.length).toBe(step.count);
        const uniqueIds = new Set(portfolio.map((p) => p.variety.id));
        expect(uniqueIds.size).toBe(portfolio.length);
      }

      // Out of 12 rapid clicks, 3 were identical consecutive clicks and must be suppressed
      expect(networkCallCount).toBe(9);
    });

    it("Stresstest 2 (Degenerate Single-Variety & Identical-Score SVG NaN Guard Test): never emits NaN or undefined in variety-xy-scatter-plot", async () => {
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();

      // Case A: Single variety
      const singleHtml = renderToStaticMarkup(
        <TestProviders>
          <FieldRankingView
            field={field}
            rec={{ ...rec!, sorten: rec!.sorten.slice(0, 1) }}
            sortierung="gewichtet"
          />
        </TestProviders>,
      );
      expect(singleHtml).toContain('data-testid="variety-xy-scatter-plot"');
      expect(singleHtml).not.toContain("NaN");
      expect(singleHtml).not.toContain("undefined");

      // Case B: 3 varieties with identical scores, identical releaseYear, and degenerate NaN numbers
      const base = rec!.sorten[0]!;
      const degenerateVarieties = [0, 1, 2].map((i) => ({
        ...base,
        rang: i + 1,
        relErtrag: 102,
        szenarioErtrag: {
          normal: 102,
          "trocken-heiss": 102,
          "kuehl-feucht": 102,
        },
        variety: {
          ...base.variety,
          id: `v-degenerate-${i}`,
          name: `Testsorte ${i + 1}`,
          zulassungsjahr: i === 2 ? Number.NaN : 2023,
          reifezahl: 240,
          traits: {
            ...base.variety.traits,
            trockentoleranz: 7 as const,
            standfestigkeit: 7 as const,
            jugendentwicklung: 7 as const,
          },
        },
      }));

      const degenerateHtml = renderToStaticMarkup(
        <TestProviders>
          <FieldRankingView
            field={field}
            rec={{ ...rec!, sorten: degenerateVarieties }}
            sortierung="gewichtet"
          />
        </TestProviders>,
      );
      expect(degenerateHtml).toContain('data-testid="variety-xy-scatter-plot"');
      expect(degenerateHtml).not.toContain("NaN");
      expect(degenerateHtml).not.toContain("undefined");
    });

    it("Stresstest 3 (Concurrent InMemoryStore Write Torture Test): handles 25 parallel disk persistence writes without ENOENT race crashes", async () => {
      const { field } = await requireField("f-hinteracker");
      const existing = inMemoryStore.getField("usr_demo_landwirt", field.id);
      expect(existing).not.toBeNull();

      const tasks = Array.from({ length: 25 }, (_, idx) =>
        Promise.resolve().then(() => {
          inMemoryStore.setField({
            ...existing!,
            selectedVarietyId: idx % 2 === 0 ? "aw-talkrone" : "aw-lichtkorn",
            updatedAt: new Date(),
          });
          inMemoryStore.saveToDiskIfAvailable(true);
        }),
      );

      await expect(Promise.all(tasks)).resolves.toHaveLength(25);
      const after = inMemoryStore.getField("usr_demo_landwirt", field.id);
      expect(after).not.toBeNull();
      expect(["aw-talkrone", "aw-lichtkorn"]).toContain(after?.selectedVarietyId);
    });

    it("selects crop first with variety counts behind every crop and strictly filters varieties by crop in WarmerStartView and PreviousVarietyPicker", () => {
      // 1. Deterministic variety counts per crop
      expect(getKnownVarietyCountForCrop("silomais")).toBe(
        DEMO_VARIETIES_BY_CROP.silomais.varieties.length,
      );
      expect(getKnownVarietyCountForCrop("winterweizen")).toBe(
        DEMO_VARIETIES_BY_CROP.winterweizen.varieties.length,
      );
      expect(getKnownVarietyCountForCrop("wintergerste")).toBe(
        DEMO_VARIETIES_BY_CROP.wintergerste.varieties.length,
      );
      expect(getKnownVarietyCountForCrop("winterraps")).toBe(
        DEMO_VARIETIES_BY_CROP.winterraps.varieties.length,
      );

      // 2. Strict filtering by crop (no maize varieties when Winterweizen is selected, and vice versa)
      const weizenFilter = getFilteredVarietiesForCrop("winterweizen");
      expect(weizenFilter.cropLabel).toBe("Winterweizen");
      expect(weizenFilter.knownCount).toBe(8);
      expect(weizenFilter.bestsellers.every((v) => v.crop === "winterweizen")).toBe(true);
      expect(weizenFilter.filteredCatalog.every((v) => v.crop === "winterweizen")).toBe(true);
      expect(weizenFilter.filteredCatalog.some((v) => v.name === "RGT Reform")).toBe(true);
      expect(weizenFilter.filteredCatalog.some((v) => v.name === "AW Talkrone")).toBe(false);

      const gersteFilter = getFilteredVarietiesForCrop("wintergerste");
      expect(gersteFilter.cropLabel).toBe("Wintergerste");
      expect(gersteFilter.knownCount).toBe(6);
      expect(gersteFilter.bestsellers.every((v) => v.crop === "wintergerste")).toBe(true);
      expect(gersteFilter.filteredCatalog.some((v) => v.name === "KWS Tardis")).toBe(true);

      // 3. WarmerStartView renders crop buttons with counts and strict filter summary
      const warmerHtml = renderToStaticMarkup(
        <WarmerStartView fieldId="f-hinteracker" initialCrop="winterweizen" />,
      );
      expect(warmerHtml).toContain("Schneller Einstieg – was hast du bisher angebaut?");
      expect(warmerHtml).toContain("Winterweizen (8 Sorten)");
      expect(warmerHtml).toContain("Wintergerste (6 Sorten)");
      expect(warmerHtml).toContain("Winterraps (6 Sorten)");
      expect(warmerHtml).toContain("Silomais / Biogasmais (12 Sorten)");
      expect(warmerHtml).toContain("Körnermais (12 Sorten)");
      expect(warmerHtml).toContain("Gefiltert auf Winterweizen (8 bekannte Sorten)");
      expect(warmerHtml).toContain("RGT Reform");
      expect(warmerHtml).not.toContain("AW Sonnenkraft");

      // 4. PreviousVarietyPicker also shows crop buttons with counts and strict filter summary
      const pickerHtml = renderToStaticMarkup(
        <PreviousVarietyPicker
          fieldId="f-hinteracker"
          optionen={[]}
          initialCrop="wintergerste"
        />,
      );
      expect(pickerHtml).toContain("1. Zuerst Kultur wählen (Anzahl bekannter Sorten je Kultur)");
      expect(pickerHtml).toContain("Wintergerste (6 Sorten)");
      expect(pickerHtml).toContain("Gefiltert auf Wintergerste (6 bekannte Sorten)");
      expect(pickerHtml).toContain("KWS Tardis");
    });

    it("prevents SSR/Client hydration mismatch on FieldRankingView, BodenProfileForm, and WichtigProfileForm when window.localStorage has a non-default previousCrop ('Silomais / Biogasmais')", async () => {
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();

      const origWindow = globalThis.window;

      try {
        // 1. Server render (typeof window === "undefined")
        (globalThis as unknown as { window: unknown }).window = undefined;
        const ssrRankingHtml = renderToString(
          <TestProviders>
            <FieldRankingView
              field={field}
              rec={rec!}
              sortierung="gewichtet"
            />
          </TestProviders>,
        );
        const ssrBodenHtml = renderToString(
          <BodenProfileForm
            fieldId={field.id}
            fieldName={field.name}
            areaHa={field.areaHa}
            initialUsage="silomais"
          />,
        );
        const ssrWichtigHtml = renderToString(
          <WichtigProfileForm fieldId={field.id} initialUsage="silomais" />,
        );

        // 2. First Client render during hydration with diverging localStorage ("Silomais / Biogasmais" / "maize_silage")
        const store: Record<string, string> = {
          [`seedle_agronomy_profile_v1_${field.id}`]: JSON.stringify({
            fieldId: field.id,
            usage: "silomais",
            soilType: "sand",
            humusPercent: 1.5,
            nfkMm: 95,
            trafficability: "spaet",
            organicFertilizers: ["Schweinegülle"],
            nutrientStatus: "pk_knapp",
            tillage: "pflug",
            irrigationPossible: true,
            irrigationPeriod: "Ganzjährig bedarfsgerecht",
            previousCrop: "Silomais / Biogasmais",
            catchCrop: "Keine",
            fieldNotes: "Abweichender Client-State",
            strategy: "stabilitaet",
            maturityGroup: "frueh",
            sowingWindow: "frueh",
            harvestWindow: "frueh",
            priorities: ["trockenstress"],
            referenceVariety: "Auenhof Saphir",
            experienceNotes: "",
            riskAppetite: 1,
            updatedAt: "2026-11-16T08:00:00.000Z",
          }),
        };
        (globalThis as unknown as { window: unknown }).window = {
          location: { href: "http://localhost:3000/feld/f-hinteracker/ranking", protocol: "http:" },
          localStorage: {
            getItem: (k: string) => store[k] ?? null,
            setItem: (k: string, v: string) => {
              store[k] = v;
            },
          },
        };

        const clientHydrationRankingHtml = renderToString(
          <TestProviders>
            <FieldRankingView
              field={field}
              rec={rec!}
              sortierung="gewichtet"
            />
          </TestProviders>,
        );
        const clientHydrationBodenHtml = renderToString(
          <BodenProfileForm
            fieldId={field.id}
            fieldName={field.name}
            areaHa={field.areaHa}
            initialUsage="silomais"
          />,
        );
        const clientHydrationWichtigHtml = renderToString(
          <WichtigProfileForm fieldId={field.id} initialUsage="silomais" />,
        );

        // Server HTML and initial client hydration render must match 1:1 (both render "Winterweizen" before useEffect runs)
        expect(clientHydrationRankingHtml).toBe(ssrRankingHtml);
        expect(clientHydrationRankingHtml).toContain("Winterweizen");
        expect(clientHydrationRankingHtml).not.toContain("Silomais / Biogasmais");
        expect(clientHydrationBodenHtml).toBe(ssrBodenHtml);
        expect(clientHydrationWichtigHtml).toBe(ssrWichtigHtml);
      } finally {
        (globalThis as unknown as { window: unknown }).window = origWindow;
      }
    });
  });

  describe("7. 3-Pass All-Buttons Standalone Click Audit (Zero Backend)", () => {
    it("Pass 1 (Global Navigation, Trust Pages, /hof & BugReportWidget without Backend): all header links, /hof forms, and offline bug report queuing work with 0 errors", async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch: ECONNREFUSED 127.0.0.1:8010"));

      try {
        // 1. Backend health check returns offline gracefully without throwing
        const healthRes = await checkBackendHealth();
        expect(healthRes.isOnline).toBe(false);

        // 2. BrandBar renders Logo (/), Mein Hof (/hof), Über uns (/ueber-uns), Warum kostenlos? (/warum-wir-das-machen), and red disconnected alert (/demo)
        const brandHtml = renderToStaticMarkup(
          <TestProviders>
            <BrandBar />
          </TestProviders>,
        );
        expect(brandHtml).toContain('href="/"');
        expect(brandHtml).toContain('href="/hof"');
        expect(brandHtml).toContain('href="/ueber-uns"');
        expect(brandHtml).toContain('href="/warum-wir-das-machen"');
        expect(brandHtml).toContain('href="/demo"');
        expect(brandHtml).toContain('data-testid="backend-disconnected-red-alert"');
        expect(brandHtml).toContain(
          "Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte",
        );

        // 3. BugReportWidget renders top-right trigger and saves bug report to localStorage when backend is offline
        const bugWidgetHtml = renderToStaticMarkup(
          <TestProviders>
            <BugReportWidget />
          </TestProviders>,
        );
        expect(bugWidgetHtml).toContain('data-testid="open-bug-report-btn"');
        expect(bugWidgetHtml).toContain("Feedback melden");
        expect(bugWidgetHtml).not.toContain("Shade");
        expect(bugWidgetHtml).not.toContain("operations/bug_reports");

        const snapUrl = captureInstantPageScreenshot({ xPct: 45, yPct: 55 });
        expect(snapUrl.startsWith("data:image/png;base64,")).toBe(true);
        const ctxJson = collectLocalFieldContext();
        expect(typeof ctxJson).toBe("object");

        const bugRes = await submitBugReport({
          comment: "Standalone Klick-Test ohne Backend",
          category: "ui_design",
          page_url: "http://localhost:3000/hof",
          route_path: "/hof",
          viewport: "1280x800",
          pin_x_pct: 45,
          pin_y_pct: 55,
          screenshot_data_url: snapUrl,
          context_json: ctxJson,
        });
        expect(bugRes.saved).toBe(false);
        expect(bugRes.bug_id).toContain("local-");

        // 4. /hof components (HofActionPanel, ManageFieldForm, EditFarmForm) render all action links and buttons cleanly
        const { field } = await requireField("f-hinteracker");
        const hofHtml = renderToStaticMarkup(
          <TestProviders>
            <HofActionPanel
              fields={[
                {
                  id: field.id,
                  name: field.name,
                  status: "status-problem",
                  areaHa: field.areaHa,
                  crop: "mais",
                  usage: "koernermais",
                  geometry: field.geometry,
                },
              ]}
            />
            <ManageFieldForm fieldId={field.id} defaultName={field.name} />
            <EditFarmForm
              farm={{
                name: "Betrieb Peter Müller",
                strasse: "Vöttinger Str. 42",
                plz: "85354",
                ort: "Freising",
              }}
            />
          </TestProviders>,
        );
        expect(hofHtml).toContain("Zum Sorten-Ranking");
        expect(hofHtml).toContain("Umbenennen");
        expect(hofHtml).toContain("Schlag löschen");
        expect(hofHtml).toContain("Speichern");
        expect(hofHtml).not.toContain("—");
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("Pass 2 (FieldPicker Map Tools & AnbauCropUsageSection Buttons without Backend): all map tools, soil/weather disclosures, maize-only crop selection, 3 usage radios, and 7 non-selectable preview crops work with 0 errors", async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch: ECONNREFUSED 127.0.0.1:8010"));

      try {
        const { field } = await requireField("f-hinteracker");
        // 1. FieldPicker with initial polygon and both Steckbrief and 10Y Weather expanded renders all map tools, red offline alert, 5 soil buttons, and 5 climate models
        const pickerFullHtml = renderToStaticMarkup(
          <TestProviders>
            <FieldPicker
              mode="neu"
              initial={field.geometry}
              defaultSteckbriefOpen={true}
              defaultWeatherOpen={true}
            />
          </TestProviders>,
        );
        expect(pickerFullHtml).toContain('data-testid="backend-disconnected-red-alert"');
        expect(pickerFullHtml).toContain('data-testid="flurkarte-toggle-btn"');
        expect(pickerFullHtml).toContain('data-testid="merge-neighbor-btn"');
        expect(pickerFullHtml).toContain('data-testid="split-field-btn"');
        expect(pickerFullHtml).toContain('data-testid="toggle-field-steckbrief-btn"');
        expect(pickerFullHtml).toContain('data-testid="toggle-field-weather-10y-btn"');
        expect(pickerFullHtml).toContain('data-testid="expanded-field-steckbrief"');
        expect(pickerFullHtml).toContain('data-testid="field-weather-10y-section"');
        expect(pickerFullHtml).toContain("Sandboden");
        expect(pickerFullHtml).toContain("Sandiger Lehm");
        expect(pickerFullHtml).toContain("Lehmboden");
        expect(pickerFullHtml).toContain("Toniger Lehm");
        expect(pickerFullHtml).toContain("Moorboden");
        expect(pickerFullHtml).toContain("DWD Deutschland");
        expect(pickerFullHtml).toContain("ECMWF Europa");

        // 2. AnbauCropUsageSection: maize-only single-select crop, 3 usage radios, and 7 non-selectable preview crops
        const anbauHtml = renderToStaticMarkup(
          <TestProviders>
            <AnbauCropUsageSection
              fieldId="f-hinteracker"
              fieldName="Vöttinger Feld"
              areaHa={14.5}
              defaultCropSelected="mais"
            />
          </TestProviders>,
        );
        expect(anbauHtml).toContain('data-testid="crop-card-mais"');
        expect(anbauHtml).toContain('aria-checked="true"');
        expect(anbauHtml).toContain('data-testid="maize-usage-options-card"');
        expect(anbauHtml).toContain('data-testid="usage-option-koernermais"');
        expect(anbauHtml).toContain('data-testid="usage-option-silomais"');
        expect(anbauHtml).toContain('data-testid="usage-option-biogasmais"');
        expect(anbauHtml).toContain('/feld/f-hinteracker/ranking?usage=koernermais');
        expect(anbauHtml).toContain('/feld/f-hinteracker/ranking?usage=silomais');
        expect(anbauHtml).toContain('/feld/f-hinteracker/ranking?usage=biogasmais');
        // Non-maize preview crops are read-only and cannot be co-selected alongside maize
        expect(anbauHtml).toContain('data-testid="preview-crop-card-sonnenblumen"');
        expect(anbauHtml).toContain('data-testid="preview-crop-card-winterweizen"');
        expect(anbauHtml).toContain('data-testid="preview-crop-card-wintergerste"');
        expect(anbauHtml).toContain('data-testid="preview-crop-card-winterraps"');
        expect(anbauHtml).toContain('data-testid="preview-crop-card-zuckerr-ben"');
        expect(anbauHtml).toContain('data-testid="preview-crop-card-sojabohnen"');
        expect(anbauHtml).toContain('data-testid="preview-crop-card-k-rnererbse-ackerbohne"');
        expect(anbauHtml).toContain('aria-disabled="true"');
        expect(anbauHtml).toContain("Bald verfügbar");
        expect(anbauHtml).not.toContain('data-testid="crop-waitlist-sonnenblumen"');
        expect(anbauHtml).not.toContain('data-testid="crop-waitlist-winterweizen"');
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("Pass 3 (FieldRankingView, VarietySteckbriefModal, WhereToBuyModal, VarietyCompareModal & DeepAnalysis without Backend): every variety has a complete dummy Steckbrief and all modals/buttons work with 0 errors", async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch: ECONNREFUSED 127.0.0.1:8010"));

      try {
        const { field } = await requireField("f-hinteracker");
        const rec = await recommendationFor(field);
        expect(rec).not.toBeNull();

        // 1. Verify all 4 backend client functions degrade to null cleanly when backend is offline
        await expect(
          fetchFieldIntelligenceFromBackend({ lat: field.lat, lon: field.lon }),
        ).resolves.toBeNull();
        await expect(
          fetchVarietyDeepAnalysisFromBackend({
            variety_id: "aw-talkrone",
            lat: field.lat,
            lon: field.lon,
          }),
        ).resolves.toBeNull();
        await expect(
          fetchVarietySteckbriefFromBackend("aw-talkrone", "AW Talkrone"),
        ).resolves.toBeNull();
        await expect(
          fetchVarietySuppliersFromBackend("85354", "aw-talkrone"),
        ).resolves.toBeNull();

        // 2. Verify EVERY variety in rec.sorten AND dynamic slugs ("kws-stabilo", "agrogant", "ah-bernstein") return a complete Steckbrief via VarietySteckbriefModal without "Steckbrief für diese Sorte aktuell noch nicht hinterlegt"
        const allIdsToVerify = [
          ...rec!.sorten.map((s) => ({ id: s.variety.id, name: s.variety.name })),
          { id: "kws-stabilo", name: "KWS Stabilo" },
          { id: "agrogant", name: "Agrogant" },
        ];

        for (const item of allIdsToVerify) {
          const detail = fakeVarietyDetail(item.id);
          expect(detail).not.toBeNull();
          expect(detail?.sorte.sorte.length).toBeGreaterThan(0);
          expect(detail?.bsl.latest).not.toBeNull();

          const modalHtml = renderToStaticMarkup(
            <TestProviders>
              <VarietySteckbriefModal
                varietyId={item.id}
                onClose={() => {}}
                initialFlaecheHa={field.areaHa}
                schlagName={field.name}
                fieldId={field.id}
                fallbackVariety={{ name: item.name, reifezahl: 240, zulassungsjahr: 2021 }}
              />
            </TestProviders>,
          );
          expect(modalHtml).toContain("Offizieller Sortensteckbrief");
          expect(modalHtml).not.toContain(
            "Steckbrief für diese Sorte aktuell noch nicht hinterlegt",
          );
        }

        // 3. Verify WhereToBuyModal and VarietyCompareModal render all buttons and data cleanly when backend is offline
        const buyHtml = renderToStaticMarkup(
          <TestProviders>
            <WhereToBuyModal
              open={true}
              onClose={() => {}}
              variety={{
                id: "aw-talkrone",
                name: "AW Talkrone",
                zuechter: "AckerWerk Genetik",
                reifezahl: 240,
              }}
              region="Tertiärhügelland"
              schlagName={field.name}
            />
          </TestProviders>,
        );
        expect(buyHtml).toContain("RWA / Raiffeisen Waren-Agrar");
        expect(buyHtml).toContain("BayWa Agrar / Raiffeisen Ware");
        expect(buyHtml).toContain("Verfügbarkeit anfragen");
        expect(buyHtml).toContain("Rückruf-Anfrage");

        const compareHtml = renderToStaticMarkup(
          <TestProviders>
            <VarietyCompareModal
              open={true}
              onClose={() => {}}
              allVarieties={rec!.sorten.slice(0, 3).map((s, i) => ({
                id: s.variety.id,
                rang: i + 1,
                name: s.variety.name,
                zuechter: s.breeder.name,
                reifezahl: s.variety.reifezahl,
                relErtragNormal: 104,
                relErtragTrocken: 102,
                relErtragKuehl: 101,
                standfestigkeit: s.variety.traits.standfestigkeit,
                trockentoleranz: s.variety.traits.trockentoleranz,
                jugendentwicklung: s.variety.traits.jugendentwicklung,
                krankheitsresistenz: 10 - s.variety.traits.staengelfaeule,
                soilSuitabilityLabel: "Sehr gut geeignet",
                isReference: i === 1,
              }))}
              comparedIds={rec!.sorten.slice(0, 2).map((s) => s.variety.id)}
              onToggleCompareId={() => {}}
              fieldName={field.name}
            />
          </TestProviders>,
        );
        expect(compareHtml).toContain("Direkter 1:1 Sorten-Vergleich");
        expect(compareHtml).toContain("Reifezahl (S / K)");
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("Whole-Farm Flow (100,0 ha from /hof -> /anbau -> FieldRankingView): renders 'Aktuelles · Sortenempfehlung für 2027 steht noch aus' card on /hof and calculates 75,0 ha / 25,0 ha across all 100,0 ha", async () => {
      const hofElement = await Hof({
        user: {
          id: DEMO_USER_ID,
          name: "Peter Müller",
          email: "peter@seedle-demo.de",
          emailVerified: true,
          telefon: null,
        },
      });
      const hofHtml = renderToStaticMarkup(<TestProviders>{hofElement}</TestProviders>);
      expect(hofHtml).toContain('data-testid="hof-aktuelles-card"');
      expect(hofHtml).toContain("Sortenempfehlung für 2027 steht noch aus");
      expect(hofHtml).toContain("Sortenempfehlung 2027 für alle 100 ha starten");
      expect(hofHtml).toContain("scope=farm&amp;totalHa=100&amp;fieldsCount=7");

      // Step 2: /anbau in farm scope (100 ha across 7 fields)
      const anbauFarmHtml = renderToStaticMarkup(
        <TestProviders>
          <AnbauCropUsageSection
            fieldId="f-hinteracker"
            fieldName="Vöttinger Feld"
            areaHa={14.5}
            defaultCropSelected="mais"
            scope="farm"
            totalHaOverride={100}
            fieldsCount={7}
          />
        </TestProviders>,
      );
      expect(anbauFarmHtml).toContain('data-testid="anbau-farm-scope-banner"');
      expect(anbauFarmHtml).toContain("Gesamter Betrieb · 100 ha Gesamtfläche (7 Schläge)");
      expect(anbauFarmHtml).toContain(
        "/feld/f-hinteracker/ranking?usage=koernermais&amp;scope=farm&amp;totalHa=100&amp;fieldsCount=7",
      );

      // Step 3: FieldRankingView in farm scope (100 ha across 7 fields -> 75 ha + 25 ha)
      const { field } = await requireField("f-hinteracker");
      const rec = await recommendationFor(field);
      expect(rec).not.toBeNull();

      const rankingFarmHtml = renderToStaticMarkup(
        <TestProviders>
          <FieldRankingView
            field={field}
            rec={rec!}
            sortierung="gewichtet"
            scope="farm"
            totalFarmHa={100}
            farmFieldsCount={7}
          />
        </TestProviders>,
      );
      expect(rankingFarmHtml).toContain('data-testid="ranking-farm-scope-banner"');
      expect(rankingFarmHtml).toContain(
        "Sortenempfehlung 2027 für deinen gesamten Betrieb · 100 ha Gesamtfläche (7 Schläge)",
      );
      expect(rankingFarmHtml).toContain("75 ha · 75 %");
      expect(rankingFarmHtml).toContain("25 ha · 25 %");
    });
  });
});
