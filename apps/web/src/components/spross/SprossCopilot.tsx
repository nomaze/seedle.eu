"use client";

import type {
  KnownFactSummary,
  PageViewState,
  SprossUiAction,
} from "@seedle/contracts";
import { getBreederInsightForVariety } from "@seedle/spross/breeder-knowledge";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Minus,
  Phone,
  RotateCcw,
  Send,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { useDemo } from "../shell/DemoContext";
import { useLanguage } from "../shell/LanguageContext";
import { useOverlays } from "../shell/Overlays";
import { buttonClass } from "../ui/Button";
import { SprossAvatar } from "./SprossAvatar";
import {
  useSpross,
  type FocusedElementInfo,
  type SprossChip,
} from "./SprossContext";

const keinAbo = () => () => {};

export interface SprossProactiveResult {
  proactiveText: string;
  proactiveChips: SprossChip[];
  stepLabel: string;
  nextBestAction: string;
  breederImpulse: string | null;
  focusedHint: string | null;
  memoryHint: string | null;
  missingInfoHint: string | null;
}

export function getSprossProactiveContent({
  pathname,
  activeVariety,
  triggerTarget,
  locale = "de",
  pageState,
  activeTargetId,
  focusedElementInfo,
  knownFactsSummary,
}: {
  pathname: string;
  activeVariety: string | null;
  triggerTarget: (targetId: string) => void;
  locale?: Locale;
  pageState?: PageViewState;
  activeTargetId?: string | null;
  focusedElementInfo?: FocusedElementInfo | null;
  knownFactsSummary?: KnownFactSummary[];
}): SprossProactiveResult {
  const p = getDictionary(locale).spross.proactive;
  const isEn = locale === "en";

  const candidateVariety =
    activeVariety || pageState?.visibleVarieties?.[0] || null;
  const breederInsight = candidateVariety
    ? getBreederInsightForVariety(candidateVariety, locale)
    : null;
  const breederImpulse = breederInsight ? breederInsight.summary : null;

  const targetId = focusedElementInfo?.targetId ?? activeTargetId ?? null;
  let focusedHint: string | null = null;
  if (targetId) {
    const label = focusedElementInfo?.label || targetId;
    if (focusedElementInfo?.insight) {
      focusedHint = focusedElementInfo.insight;
    } else if (targetId === "ranking-winner") {
      focusedHint = isEn
        ? "Top recommendation card: click 'View profile' or ask me why this hybrid leads on your soil."
        : "Empfehlungskarte Platz 1: Öffne den Steckbrief oder frag mich, warum diese Genetik hier vorne liegt.";
    } else if (targetId === "plz-input") {
      focusedHint = isEn
        ? "Enter your postal code (e.g. 85354 or 29525) to load official regional LSV trials."
        : "Gib deine 5-stellige PLZ ein, um direkt die amtlichen LSV-Versuche deiner Region zu laden.";
    } else if (targetId === "field-map" || targetId === "feld-button") {
      focusedHint = isEn
        ? 'Click "Personal Recommendation" to select your parcel on the map.'
        : 'Klicke auf „Persönliche Empfehlung“, um deinen Schlag auf der Karte zu wählen.';
    } else if (targetId === "daten-button") {
      focusedHint = isEn
        ? 'Click "Browse" to explore official regional trial data.'
        : 'Klicke auf „Stöbern“, um direkt in den amtlichen Versuchsdaten zu suchen.';
    } else {
      focusedHint = isEn ? `Active focus: ${label}` : `Im Fokus: ${label}`;
    }
  }

  const memoryHint =
    knownFactsSummary && knownFactsSummary.length > 0
      ? isEn
        ? `${knownFactsSummary.length} farm fact${knownFactsSummary.length === 1 ? "" : "s"} active (${knownFactsSummary[0]!.label}: ${knownFactsSummary[0]!.text})`
        : `${knownFactsSummary.length} Hof-Fakt${knownFactsSummary.length === 1 ? "" : "en"} aktiv (${knownFactsSummary[0]!.label}: ${knownFactsSummary[0]!.text})`
      : null;

  const missingInfoHint =
    pageState?.missingInfo && pageState.missingInfo.length > 0
      ? pageState.missingInfo[0]!
      : null;

  const buildResult = (
    proactiveText: string,
    proactiveChips: SprossChip[],
    defaultStepDe: string,
    defaultStepEn: string,
    defaultNextDe: string,
    defaultNextEn: string
  ): SprossProactiveResult => ({
    proactiveText,
    proactiveChips,
    stepLabel:
      pageState?.stepLabel || (isEn ? defaultStepEn : defaultStepDe),
    nextBestAction:
      pageState?.nextBestAction || (isEn ? defaultNextEn : defaultNextDe),
    breederImpulse,
    focusedHint,
    memoryHint,
    missingInfoHint,
  });

  // 1. Landing page
  if (pathname === "/") {
    return buildResult(
      p.home.text,
      [
        { id: "start-feld", label: p.home.addField, href: "/feld/neu", target: "feld-button" },
        { id: "start-daten", label: p.home.viewData, href: "/daten", target: "daten-button" },
      ],
      "Start · Übersicht",
      "Start · Overview",
      "Auf „Persönliche Empfehlung“ oder „Stöbern“ klicken",
      'Click "Personal Recommendation" or "Browse"'
    );
  }

  // 2. Daily field overview route (In-season monitoring)
  if (pathname?.startsWith("/heute")) {
    return buildResult(
      p.heute.text,
      [
        {
          id: "foto-auftrag",
          label: p.heute.uploadPhoto,
          target: "foto-upload",
          action: () => {
            triggerTarget("foto-upload");
            const el = document.getElementById("foto-upload");
            el?.scrollIntoView({ behavior: "smooth" });
          },
        },
        {
          id: "fungizid",
          label: p.heute.checkFungicide,
          question: p.heute.fungicideQuestion,
        },
      ],
      "Saisonbegleitung · Dein Feld heute",
      "Season Companion · Field Today",
      "Wetterrisiko prüfen oder Bestandsfoto hochladen",
      "Check weather risk or upload a crop photo"
    );
  }

  // 3. /feld/neu (New field setup)
  if (pathname === "/feld/neu" || pathname?.startsWith("/feld/neu")) {
    return buildResult(
      p.neu.text,
      [
        {
          id: "neu-karte",
          label: p.neu.tapMap,
          target: "field-map",
          action: () => triggerTarget("field-map"),
        },
        {
          id: "neu-ort",
          label: p.neu.searchLocation,
          target: "ort-search",
          action: () => triggerTarget("ort-search"),
        },
      ],
      "Schritt 1/3 · Schlag auf Karte wählen",
      "Step 1/3 · Select parcel on map",
      "Auf deinen Schlag tippen oder Ort suchen",
      "Tap your parcel on the map or search for your town"
    );
  }

  // 4. Ranking view
  if (pathname?.includes("/ranking")) {
    const scenarioNote =
      pageState?.activeScenario && pageState.activeScenario !== "gewichtet"
        ? isEn
          ? ` (Scenario: ${pageState.activeScenario})`
          : ` (Szenario: ${pageState.activeScenario})`
        : "";
    return buildResult(
      p.ranking.text,
      [
        {
          id: "rank-warum",
          label: p.ranking.whyThisVariety,
          question: p.ranking.whyThisVarietyQuestion,
          target: "ranking-winner",
        },
        {
          id: "rank-platz2",
          label: p.ranking.compareRank2,
          question: p.ranking.compareRank2Question,
        },
      ],
      `Schritt 3/3 · Sorten-Ranking${scenarioNote}`,
      `Step 3/3 · Variety Ranking${scenarioNote}`,
      "Klimaszenario (z. B. Trockenjahr) testen oder Steckbrief öffnen",
      "Test climate scenario (e.g. Drought Year) or open variety profile"
    );
  }

  // 5. Single variety in field context
  if (pathname?.includes("/sorte/")) {
    return buildResult(
      p.sorte.text,
      [
        {
          id: "sorte-trocken",
          label: p.sorte.droughtCheck,
          question: p.sorte.droughtQuestion,
        },
        {
          id: "sorte-ertrag",
          label: p.sorte.maturityYield,
          question: p.sorte.maturityYieldQuestion,
        },
      ],
      "Sorten-Tiefenanalyse",
      "Variety Deep Dive",
      "Trockenstress-Mechanismus und Reifezahl mit deinem Hof abgleichen",
      "Match drought-stress mechanism and maturity to your farm"
    );
  }

  // 6. Trial data with active variety (e.g. variety profile open)
  if (pathname?.startsWith("/daten") && activeVariety) {
    return buildResult(
      p.datenWithVariety.text(activeVariety),
      [
        {
          id: "daten-trocken",
          label: p.datenWithVariety.droughtCheck,
          question: p.datenWithVariety.droughtQuestion(activeVariety),
        },
        {
          id: "daten-benchmark",
          label: p.datenWithVariety.compareBenchmark,
          question: p.datenWithVariety.compareBenchmarkQuestion(activeVariety),
        },
      ],
      `Steckbrief · ${activeVariety}`,
      `Variety Profile · ${activeVariety}`,
      `Züchterprofil von ${activeVariety} mit AW Talkrone vergleichen`,
      `Compare breeder profile of ${activeVariety} with AW Talkrone`
    );
  }

  // 7. General trial data view
  if (pathname?.startsWith("/daten")) {
    return buildResult(
      p.daten.text,
      [
        {
          id: "daten-plz",
          label: p.daten.enterPlz,
          target: "plz-input",
          action: () => {
            triggerTarget("plz-input");
            const el = document.querySelector<HTMLInputElement>("#plz-input");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.focus();
            }
          },
        },
        { id: "daten-feld", label: p.daten.fieldOnMap, href: "/feld/neu", target: "feld-button" },
      ],
      "Amtliche LSV-Versuchsdaten",
      "Official LSV Trial Data",
      "PLZ eingeben oder nach Nutzung (Silo/Körner) und Züchter filtern",
      "Enter postal code or filter by usage (Silage/Grain) and breeder"
    );
  }

  // 8. Farm overview and knowledge base
  if (pathname === "/hof" || pathname?.startsWith("/hof")) {
    return buildResult(
      p.hof.text,
      [
        {
          id: "hof-fruchtfolge",
          label: p.hof.cropRotation,
          question: p.hof.cropRotationQuestion,
        },
        {
          id: "hof-boden",
          label: p.hof.soilTillage,
          question: p.hof.soilTillageQuestion,
        },
      ],
      "Mein Hof & Wissensbasis",
      "My Farm & Knowledge Base",
      "Fruchtfolge oder Risikofokus ergänzen",
      "Add crop rotation or risk focus"
    );
  }

  // 9. /feld/[id] (Field overview and season evaluation)
  if (pathname?.startsWith("/feld/")) {
    return buildResult(
      p.field.text,
      [
        {
          id: "empfehlung-begruenden",
          label: p.field.whyThisVariety,
          question: p.field.whyThisVarietyQuestion,
        },
        {
          id: "aussaat-termin",
          label: p.field.sowingDate,
          question: p.field.sowingDateQuestion,
        },
      ],
      "Schritt 2/3 · Schlagdaten & Nutzung",
      "Step 2/3 · Parcel Data & Usage",
      "Nutzung wählen und persönliches Sorten-Ranking berechnen",
      "Select usage and calculate personal variety ranking"
    );
  }

  // Standard fallback for other routes
  return buildResult(
    p.fallback.text,
    [
      { id: "std-feld", label: p.fallback.toFields, href: "/feld" },
      { id: "std-daten", label: p.fallback.trialData, href: "/daten" },
    ],
    "Sortenkompass · Co-Pilot",
    "Variety Compass · Copilot",
    "Schlag auswählen oder Versuchsdaten vergleichen",
    "Select a parcel or compare trial data"
  );
}

/*
 * Building blocks of the Spross overlay (design system): rectangular actions with radius-control,
 * outlined in the action or control role, never pills; flat content on surface inside the panel.
 */
const AKTION = "inline-flex h-control-sm items-center gap-1.5 rounded-control px-3 text-small font-semibold transition-colors";
const AKTION_KLEIN = "inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-caption font-semibold transition-colors";
const EINGABE =
  "flex items-center gap-2 rounded-control border border-control bg-surface pl-3 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus";
const SENDEN =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control bg-action text-fg-inverse transition-colors hover:bg-action-hover disabled:pointer-events-none disabled:opacity-30";
const FEHLER = "border-l-4 border-status-urgent py-1 pl-3 text-small font-semibold text-status-urgent-text";

export function SprossCopilot() {
  const pathname = usePathname();
  const router = useRouter();
  const { spross, teamAnruf } = useDemo();
  const { locale, t } = useLanguage();

  const {
    mood,
    activeHighlight,
    setHighlight,
    activeVariety,
    pageState,
    focusedElementInfo,
    conversation,
    denkt,
    fehler,
    isChatOpen,
    setIsChatOpen,
    toggleChat,
    isMinimized,
    setIsMinimized,
    isMemoryOpen,
    setIsMemoryOpen,
    toggleMemory,
    sendMessage,
    askSpross,
    resetConversation,
    focusInput,
    inputRef,
    triggerTarget,
    executeUiAction,
  } = useSpross();

  const { oeffne } = useOverlays();
  const [inputText, setInputText] = useState("");
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  const hydriert = useSyncExternalStore(keinAbo, () => true, () => false);

  const desktopChatScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileChatScrollRef = useRef<HTMLDivElement | null>(null);

  // Floating Copilot HUD on scroll (desktop)
  useEffect(() => {
    function handleScroll() {
      setIsScrolledPast(window.scrollY > 340);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut: Escape key closes active chat or knowledge view
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isMemoryOpen) {
          setIsMemoryOpen(false);
        } else if (isChatOpen) {
          setIsChatOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatOpen, isMemoryOpen, setIsChatOpen, setIsMemoryOpen]);

  // Automatic highlight focus on route entry (e.g. postal code input on /daten)
  useEffect(() => {
    if (pathname === "/daten" && !activeVariety) {
      setHighlight("plz-input");
      const tId = setTimeout(() => {
        setHighlight(null);
      }, 3500);
      return () => {
        clearTimeout(tId);
        setHighlight(null);
      };
    }
  }, [pathname, activeVariety, setHighlight]);

  // Auto-scroll chat message container to latest bottom message
  useEffect(() => {
    if (isChatOpen) {
      const scrollDesktop = desktopChatScrollRef.current;
      if (scrollDesktop) {
        scrollDesktop.scrollTo({
          top: scrollDesktop.scrollHeight,
          behavior: "smooth",
        });
      }
      const scrollMobile = mobileChatScrollRef.current;
      if (scrollMobile) {
        scrollMobile.scrollTo({
          top: scrollMobile.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [conversation?.messages, denkt, isChatOpen]);

  const knownFactsSummary = useMemo(
    () => conversation?.knownFactsSummary ?? [],
    [conversation?.knownFactsSummary]
  );

  const {
    proactiveText,
    proactiveChips,
    stepLabel,
    nextBestAction,
    breederImpulse,
    focusedHint,
    missingInfoHint,
  } = useMemo(
    () =>
      getSprossProactiveContent({
        pathname,
        activeVariety,
        triggerTarget,
        locale,
        pageState,
        activeTargetId: activeHighlight,
        focusedElementInfo,
        knownFactsSummary,
      }),
    [
      pathname,
      activeVariety,
      triggerTarget,
      locale,
      pageState,
      activeHighlight,
      focusedElementInfo,
      knownFactsSummary,
    ]
  );

  const visibleBreederInsights = useMemo(() => {
    const names = [
      ...(activeVariety ? [activeVariety] : []),
      ...(pageState?.visibleVarieties ?? []),
    ];
    const unique: { name: string; summary: string; kornTyp: string }[] = [];
    const seen = new Set<string>();
    for (const n of names) {
      const info = getBreederInsightForVariety(n, locale);
      if (info && !seen.has(info.profile.id)) {
        seen.add(info.profile.id);
        unique.push({
          name: info.profile.name,
          summary: info.summary,
          kornTyp: info.details.kornTyp,
        });
        if (unique.length >= 3) break;
      }
    }
    return unique;
  }, [activeVariety, pageState?.visibleVarieties, locale]);

  const handleChipClick = useCallback(
    (chip: SprossChip) => {
      if (chip.uiAction) {
        executeUiAction(chip.uiAction);
        return;
      }
      if (chip.action) {
        chip.action();
        return;
      }
      const q = chip.frage || chip.question;
      if (q) {
        if (chip.target) triggerTarget(chip.target);
        askSpross(q, pathname);
        return;
      }
      if (chip.target) {
        const existsOnPage =
          typeof document !== "undefined" &&
          Boolean(document.querySelector(`[data-spross-target="${chip.target}"]`));
        if (existsOnPage || !chip.href) {
          triggerTarget(chip.target);
          return;
        }
      }
      if (chip.href) {
        router.push(chip.href);
      }
    },
    [askSpross, executeUiAction, pathname, router, triggerTarget]
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || denkt) return;
    setInputText("");
    setIsChatOpen(true);
    await sendMessage(clean, pathname);
  };

  const messageCount = conversation?.messages.length ?? 0;
  const hasUserMessages =
    (conversation?.messages.filter((m) => m.role === "user").length ?? 0) > 0;
  const latestUiActions: SprossUiAction[] = conversation?.uiActions ?? [];

  if (!spross) return null;

  const statusPunkt = (groesse: string) => (
    <span
      className={`absolute -bottom-0.5 -right-0.5 ${groesse} rounded-full ring-2 ring-surface ${
        denkt ? "bg-status-problem" : "bg-status-ok"
      }`}
    />
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 0. FLOATING COPILOT HUD ON SCROLL (Desktop, when header is out of view)   */}
      {/* ========================================================================= */}
      {isScrolledPast && !isChatOpen && !isMinimized && (
        <div
          aria-label="Spross Live HUD"
          className="print-hide fixed top-3 right-5 z-40 hidden max-w-md items-center gap-3 rounded-panel border border-divider bg-surface px-3 py-2 shadow-lift lg:flex"
        >
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsChatOpen(true);
            }}
            aria-label={t.spross.ask}
            className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <SprossAvatar size={30} mood={denkt ? "denkt" : mood} />
            {statusPunkt("size-2.5")}
          </button>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2 text-caption text-fg-muted">
              <span className="truncate font-semibold">{stepLabel}</span>
              {knownFactsSummary.length > 0 && (
                <span className="shrink-0 tabular-nums">
                  · {knownFactsSummary.length}{" "}
                  {locale === "en" ? "facts" : "Fakten"}
                </span>
              )}
            </div>
            <p className="truncate text-small text-fg">
              {focusedHint ||
                (activeVariety
                  ? `${activeVariety}: ${breederImpulse ?? nextBestAction}`
                  : nextBestAction)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {proactiveChips[0] && (
              <button
                type="button"
                onClick={() => handleChipClick(proactiveChips[0]!)}
                className={`${AKTION_KLEIN} cursor-pointer bg-action text-fg-inverse hover:bg-action-hover`}
              >
                {proactiveChips[0].label}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setIsChatOpen(true);
                focusInput();
              }}
              className={`${AKTION_KLEIN} cursor-pointer text-link ring-1 ring-inset ring-control hover:bg-action-subtle`}
            >
              {locale === "en" ? "Ask →" : "Fragen →"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DESKTOP: Spross panel (>= 1024px)                                      */}
      {/* Overlay on surface with shadow-lift, max-h 61.8vh, flat content inside.   */}
      {/* Input row anchored at bottom (follows conversation downward)               */}
      {/* ========================================================================= */}
      {isMinimized ? (
        <aside
          aria-label="Spross KI-Copilot"
          className="spross-bereich fixed top-3 right-5 z-40 hidden lg:block"
        >
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="group flex cursor-pointer items-center gap-3 rounded-panel border border-divider bg-surface px-3 py-2 shadow-lift transition-colors hover:bg-highlight"
          >
            <span className="relative flex size-8 items-center justify-center rounded-full">
              <SprossAvatar size={28} mood={denkt ? "denkt" : mood} />
              {statusPunkt("size-2")}
            </span>
            <div className="text-left">
              <span className="block text-small font-semibold leading-tight text-fg">
                {t.spross.ask}
              </span>
              <span className="block text-caption leading-tight text-fg-muted">
                {denkt ? t.spross.thinking : stepLabel}
              </span>
            </div>
            <ChevronDown className="size-4 text-fg-muted transition-colors group-hover:text-fg" aria-hidden />
          </button>
        </aside>
      ) : (
        <aside
          aria-label="Spross KI-Copilot"
          className="spross-bereich fixed top-0 right-0 z-40 hidden max-h-[61.8vh] w-[420px] rounded-bl-panel border-b border-l border-divider bg-surface shadow-lift lg:flex lg:flex-col"
          data-offen={isChatOpen || isMemoryOpen ? "true" : "false"}
        >
          {/* Flex container: header + context zone + scrollable chat + bottom input */}
          <div className="flex max-h-[61.8vh] min-h-0 flex-col gap-4 px-5 py-4">
            {/* 1. Header (shrink-0) */}
            <div className="flex shrink-0 items-center justify-between border-b border-divider pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-8 items-center justify-center rounded-full">
                  <SprossAvatar size={28} mood={denkt ? "denkt" : mood} />
                  {statusPunkt("size-2")}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-small font-bold leading-none text-fg">
                      Spross
                    </span>
                    <span suppressHydrationWarning className="text-caption font-semibold text-fg-muted">
                      {t.spross.copilot}
                    </span>
                  </div>
                  <span suppressHydrationWarning className="text-caption text-fg-muted">
                    {denkt
                      ? t.spross.analyzing
                      : !hydriert || !conversation
                        ? t.spross.companion
                        : conversation.modus === "skript"
                          ? t.spross.demoTag
                          : t.spross.aiTag}
                  </span>
                </div>
              </div>

              {/* Control action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMemory}
                  aria-pressed={isMemoryOpen}
                  title={
                    locale === "en"
                      ? "Open Farm & Breeder Knowledge"
                      : "Hof- & Züchterwissen öffnen"
                  }
                  className={`${AKTION_KLEIN} cursor-pointer ${
                    isMemoryOpen
                      ? "bg-selected text-on-selected"
                      : "text-link ring-1 ring-inset ring-control hover:bg-action-subtle"
                  }`}
                >
                  <span>
                    {knownFactsSummary.length > 0
                      ? locale === "en"
                        ? `Memory (${knownFactsSummary.length})`
                        : `Hofwissen (${knownFactsSummary.length})`
                      : locale === "en"
                        ? "Memory"
                        : "Hofwissen"}
                  </span>
                </button>

                {hasUserMessages && (
                  <button
                    type="button"
                    onClick={toggleChat}
                    aria-pressed={isChatOpen}
                    title={
                      isChatOpen
                        ? locale === "en"
                          ? "Collapse history"
                          : "Verlauf zuklappen"
                        : locale === "en"
                          ? "View history"
                          : "Verlauf ansehen"
                    }
                    className={`${AKTION_KLEIN} cursor-pointer tabular-nums ${
                      isChatOpen
                        ? "bg-selected text-on-selected"
                        : "text-link ring-1 ring-inset ring-control hover:bg-action-subtle"
                    }`}
                  >
                    <MessageSquare className="size-3.5" aria-hidden />
                    <span>{messageCount}</span>
                    {isChatOpen ? (
                      <ChevronUp className="size-3.5" aria-hidden />
                    ) : (
                      <ChevronDown className="size-3.5" aria-hidden />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title={locale === "en" ? "Minimize" : "Minimieren"}
                  aria-label={locale === "en" ? "Minimize" : "Minimieren"}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-action-subtle hover:text-fg"
                >
                  <Minus className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            {/* Optional farm & breeder knowledge (shrink-0), flat between hairlines */}
            {isMemoryOpen && (
              <div className="shrink-0 space-y-3 border-b border-divider pb-4 text-small">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fg">
                    {locale === "en"
                      ? "Farm Memory & Breeder Knowledge"
                      : "Hofwissen & Züchterprofil"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void resetConversation()}
                    title={
                      locale === "en"
                        ? "Reset chat history (keeps learned facts)"
                        : "Chat-Verlauf zurücksetzen (behält Hofwissen)"
                    }
                    className={`${AKTION_KLEIN} cursor-pointer text-link hover:bg-action-subtle`}
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    <span>{locale === "en" ? "Reset Chat" : "Chat-Reset"}</span>
                  </button>
                </div>

                <div>
                  <div className="mb-1 text-caption font-semibold text-fg-muted">
                    {locale === "en"
                      ? "Saved Farm Context"
                      : "Gespeicherte Hof-Angaben"}
                  </div>
                  {knownFactsSummary.length === 0 ? (
                    <p className="text-fg-muted">
                      {locale === "en"
                        ? "Tell me about your soil, crop rotation, irrigation, or drought experience—I'll note it automatically."
                        : "Erzähl mir von deiner Fruchtfolge, Bodenart, Beregnung oder Trockenheits-Erfahrung – ich notiere es automatisch."}
                    </p>
                  ) : (
                    <ul className="max-h-24 divide-y divide-divider overflow-y-auto border-t border-divider pr-1">
                      {knownFactsSummary.map((fact, idx) => (
                        <li
                          key={`${fact.topic}-${idx}`}
                          className="flex items-baseline gap-2 py-1.5 text-fg"
                        >
                          <span className="shrink-0 text-caption font-semibold text-link">
                            {fact.label}
                            {fact.jahr ? ` ${fact.jahr}` : ""}
                          </span>
                          <span>{fact.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {visibleBreederInsights.length > 0 && (
                  <div className="border-t border-divider pt-3">
                    <div className="mb-1 text-caption font-semibold text-fg-muted">
                      {locale === "en"
                        ? "Active Variety Genetics"
                        : "Züchterprofil zur aktuellen Ansicht"}
                    </div>
                    <div className="space-y-1.5">
                      {visibleBreederInsights.slice(0, 2).map((b) => (
                        <p key={b.name} className="text-fg-muted">
                          <span className="font-semibold text-fg">{b.name}:</span>{" "}
                          <span>{b.summary}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Page orientation & quick actions (shrink-0) */}
            <div className="shrink-0 space-y-3 text-small text-fg">
              <div className="flex items-center justify-between gap-2 text-caption">
                <span className="truncate font-semibold text-fg-muted">
                  {stepLabel}
                </span>
                {missingInfoHint && (
                  <span className="max-w-[190px] truncate text-fg-muted">
                    {missingInfoHint}
                  </span>
                )}
              </div>

              <div>
                <FormattedProactiveText text={proactiveText} />
              </div>

              {activeVariety && breederImpulse && (
                <p className="border-l-2 border-divider pl-3 text-fg-muted">
                  <span className="font-semibold text-fg">
                    {locale === "en" ? "Breeder Profile: " : "Züchterwissen: "}
                  </span>
                  <span>{breederImpulse}</span>
                </p>
              )}

              {focusedHint && (
                <div className="flex items-center gap-1.5 font-semibold text-link">
                  <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{focusedHint}</span>
                </div>
              )}

              {/* Context-synchronized quick actions */}
              {proactiveChips && proactiveChips.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-divider pt-3">
                  {proactiveChips.map((chip: SprossChip) => {
                    const isTargetActive =
                      chip.target && activeHighlight === chip.target;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onMouseEnter={() =>
                          chip.target && setHighlight(chip.target)
                        }
                        onMouseLeave={() => setHighlight(null)}
                        onClick={() => handleChipClick(chip)}
                        className={`${AKTION} cursor-pointer ${
                          isTargetActive
                            ? "bg-selected text-on-selected"
                            : "text-link ring-1 ring-inset ring-action hover:bg-action-subtle"
                        }`}
                      >
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Direct page control actions (when chat is collapsed) */}
              {!isChatOpen && latestUiActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {latestUiActions.map((act, idx) => (
                    <button
                      key={`${act.type}-${act.label}-${idx}`}
                      type="button"
                      onClick={() => executeUiAction(act)}
                      className={`${AKTION} cursor-pointer bg-action text-fg-inverse hover:bg-action-hover`}
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Scrollable chat history (flex-1 min-h-0) */}
            {isChatOpen && (
              <div
                ref={desktopChatScrollRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto border-t border-divider py-3 pr-1 text-small [scrollbar-width:thin]"
              >
                {conversation?.messages.map((m) =>
                  m.role === "assistant" ? (
                    <div key={m.id} className="flex items-start gap-2">
                      <SprossAvatar size={22} className="mt-0.5 shrink-0" />
                      <div className="max-w-[85%] space-y-2">
                        <div className="whitespace-pre-line text-fg">
                          {m.text}
                        </div>
                        {m.savedFacts?.map((fact) => (
                          <div
                            key={fact}
                            className="flex items-start gap-1.5 text-caption font-semibold text-status-ok-text"
                          >
                            <Check className="mt-0.5 size-3.5 shrink-0 text-status-ok" aria-hidden />
                            <span>
                              {t.spross.noted}
                              {fact}
                            </span>
                          </div>
                        ))}
                        {m.uiActions && m.uiActions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {m.uiActions.map((act, idx) => (
                              <button
                                key={`${m.id}-act-${idx}`}
                                type="button"
                                onClick={() => executeUiAction(act)}
                                className={`${AKTION} cursor-pointer bg-action text-fg-inverse hover:bg-action-hover`}
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="size-3.5" aria-hidden />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-line rounded-control bg-highlight px-3 py-2 text-fg">
                        {m.text}
                      </div>
                    </div>
                  )
                )}

                {denkt && (
                  <div className="flex items-center gap-2 py-1 text-fg-muted">
                    <SprossAvatar size={20} mood="denkt" />
                    <span>
                      {locale === "en"
                        ? "Spross is thinking …"
                        : "Spross denkt nach …"}
                    </span>
                  </div>
                )}

                {fehler && (
                  <div className={FEHLER}>
                    {fehler}
                  </div>
                )}
              </div>
            )}

            {/* 4. Bottom input row & suggested prompts (shrink-0 mt-auto) */}
            <div className="mt-auto shrink-0 space-y-2">
              {/* Suggested response prompts directly above input */}
              {isChatOpen &&
                conversation &&
                conversation.vorschlaege.length > 0 &&
                !denkt && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {conversation.vorschlaege.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => sendMessage(v, pathname)}
                        className={`${AKTION_KLEIN} cursor-pointer text-fg ring-1 ring-inset ring-control hover:bg-action-subtle`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

              {/* Input form anchored at bottom */}
              <form onSubmit={handleFormSubmit} className={EINGABE}>
                <input
                  ref={inputRef}
                  data-spross-input="true"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.spross.inputPlaceholder}
                  disabled={denkt}
                  className="h-10 min-w-0 flex-1 bg-transparent text-small text-fg outline-none placeholder:text-fg-muted disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || denkt}
                  aria-label={t.spross.sendAria}
                  className={SENDEN}
                >
                  <Send className="size-4" aria-hidden />
                </button>
              </form>

              {/* Footer row below input when conversation is open */}
              {isChatOpen && (
                <div className="flex items-center justify-between pt-0.5 text-caption">
                  <div className="flex items-center gap-3">
                    {teamAnruf && (
                      <button
                        type="button"
                        onClick={() => oeffne("anruf")}
                        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-link hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        <span>{t.spross.callTeam}</span>
                      </button>
                    )}
                    {hasUserMessages && (
                      <button
                        type="button"
                        onClick={() => void resetConversation()}
                        className="inline-flex cursor-pointer items-center gap-1 text-fg-muted transition-colors hover:text-fg"
                      >
                        <RotateCcw className="size-3.5" aria-hidden />
                        <span>{locale === "en" ? "Reset" : "Neu starten"}</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="cursor-pointer font-semibold text-fg-muted transition-colors hover:text-fg"
                  >
                    {t.spross.closeEsc}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE: Bottom dock (< 1024px)                                         */}
      {/* ========================================================================= */}
      {!isChatOpen && (
        <nav
          aria-label="Spross Leiste"
          className="print-hide fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-surface shadow-lift lg:hidden"
        >
          <div className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(true);
                }}
                className="flex min-h-touch flex-1 items-center gap-2.5 rounded-control py-1 pl-1 pr-3 text-left transition-colors hover:bg-action-subtle"
              >
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full">
                  <SprossAvatar size={28} mood={denkt ? "denkt" : mood} />
                  {statusPunkt("size-2")}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-small font-semibold leading-tight text-fg">
                    {t.spross.askMobile}
                  </span>
                  <span className="block truncate text-caption leading-tight text-fg-muted">
                    {denkt ? t.spross.thinking : stepLabel}
                  </span>
                </div>
              </button>

              {teamAnruf ? (
                <button
                  type="button"
                  onClick={() => oeffne("anruf")}
                  className={buttonClass("secondary", "sm", "shrink-0 px-3")}
                >
                  <Phone className="size-4" aria-hidden />
                  <span>{t.spross.teamMobile}</span>
                </button>
              ) : null}
            </div>
          </div>
        </nav>
      )}

      {/* Mobile drawer */}
      {isChatOpen && (
        <div
          className="print-hide fixed inset-0 z-50 flex flex-col justify-end bg-scrim lg:hidden"
          onClick={() => setIsChatOpen(false)}
        >
          <div
            className="relative flex max-h-[86dvh] w-full flex-col rounded-t-panel bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-panel border-b border-divider bg-surface px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-9 items-center justify-center rounded-full">
                  <SprossAvatar size={30} mood={denkt ? "denkt" : mood} />
                  {statusPunkt("size-2.5")}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-small font-bold text-fg">Spross</span>
                    <span className="text-caption font-semibold text-fg-muted">
                      {t.spross.copilot}
                    </span>
                  </div>
                  <span className="text-caption text-fg-muted">
                    {denkt
                      ? t.spross.analyzing
                      : !hydriert || !conversation
                        ? t.spross.companion
                        : conversation.modus === "skript"
                          ? t.spross.demoTag
                          : t.spross.aiTag}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                aria-label={locale === "en" ? "Close history" : "Verlauf schließen"}
                className="flex size-touch items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-action-subtle hover:text-fg"
              >
                <ChevronDown className="size-5" aria-hidden />
              </button>
            </div>

            {/* Mobile chat messages & proactive content */}
            <div
              ref={mobileChatScrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-small [scrollbar-width:thin]"
            >
              {/* Mobile proactive context, flat */}
              <div className="space-y-3 border-b border-divider pb-4 text-fg">
                <div className="truncate text-caption font-semibold text-fg-muted">
                  {stepLabel}
                </div>

                <div>
                  <FormattedProactiveText text={proactiveText} />
                </div>

                {activeVariety && breederImpulse && (
                  <p className="border-l-2 border-divider pl-3 text-fg-muted">
                    <span className="font-semibold text-fg">
                      {locale === "en" ? "Breeder Profile: " : "Züchterwissen: "}
                    </span>
                    <span>{breederImpulse}</span>
                  </p>
                )}

                {proactiveChips && proactiveChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {proactiveChips.map((chip: SprossChip) => {
                      const isTargetActive =
                        chip.target && activeHighlight === chip.target;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className={`${AKTION} ${
                            isTargetActive
                              ? "bg-selected text-on-selected"
                              : "text-link ring-1 ring-inset ring-action hover:bg-action-subtle"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile chat message list */}
              {conversation?.messages.map((m) =>
                m.role === "assistant" ? (
                  <div key={m.id} className="flex items-start gap-2">
                    <SprossAvatar size={22} className="mt-0.5 shrink-0" />
                    <div className="max-w-[85%] space-y-2">
                      <div className="whitespace-pre-line text-fg">
                        {m.text}
                      </div>
                      {m.savedFacts?.map((fact) => (
                        <div
                          key={fact}
                          className="flex items-start gap-1.5 text-caption font-semibold text-status-ok-text"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0 text-status-ok" aria-hidden />
                          <span>
                            {t.spross.noted}
                            {fact}
                          </span>
                        </div>
                      ))}
                      {m.uiActions && m.uiActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {m.uiActions.map((act, idx) => (
                            <button
                              key={`${m.id}-mob-act-${idx}`}
                              type="button"
                              onClick={() => executeUiAction(act)}
                              className={`${AKTION} bg-action text-fg-inverse hover:bg-action-hover`}
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="size-3.5" aria-hidden />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-line rounded-control bg-highlight px-3 py-2 text-fg">
                      {m.text}
                    </div>
                  </div>
                )
              )}

              {denkt && (
                <div className="flex items-center gap-2 text-fg-muted">
                  <SprossAvatar size={20} mood="denkt" />
                  <span>
                    {locale === "en"
                      ? "Spross is thinking …"
                      : "Spross denkt nach …"}
                  </span>
                </div>
              )}

              {fehler && (
                <div className={FEHLER}>
                  {fehler}
                </div>
              )}
            </div>

            {/* Mobile input row (anchored at bottom) */}
            <div className="space-y-2 border-t border-divider bg-surface px-5 pb-1 pt-3">
              {conversation && conversation.vorschlaege.length > 0 && !denkt && (
                <div className="flex flex-wrap gap-2">
                  {conversation.vorschlaege.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => sendMessage(v, pathname)}
                      className={`${AKTION_KLEIN} text-fg ring-1 ring-inset ring-control hover:bg-action-subtle`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className={EINGABE}>
                <input
                  data-spross-input="true"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.spross.inputPlaceholder}
                  disabled={denkt}
                  className="h-11 min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-muted disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || denkt}
                  aria-label={t.spross.sendAria}
                  className={SENDEN}
                >
                  <Send className="size-4" aria-hidden />
                </button>
              </form>
              <div className="flex items-center justify-between text-caption">
                {teamAnruf ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChatOpen(false);
                      oeffne("anruf");
                    }}
                    className="inline-flex min-h-touch items-center gap-1 font-semibold text-link hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    <span>{t.spross.callTeam}</span>
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="min-h-touch font-semibold text-fg-muted hover:text-fg"
                >
                  {t.spross.closeMobile}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Helper function to render bold markdown (**text**) in body strings. */
function FormattedProactiveText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-fg">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}
