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

  return (
    <>
      {/* ========================================================================= */}
      {/* 0. FLOATING COPILOT HUD ON SCROLL (Desktop, when header is out of view)   */}
      {/* ========================================================================= */}
      {isScrolledPast && !isChatOpen && !isMinimized && (
        <div
          aria-label="Spross Live HUD"
          className="fixed top-[13px] right-[21px] z-40 hidden lg:flex items-center gap-[13px] rounded-[21px] border border-leaf-300/90 bg-white/95 px-[13px] py-[8px] shadow-lift backdrop-blur-md animate-fade-in max-w-md"
        >
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsChatOpen(true);
            }}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-leaf-50 ring-1 ring-leaf-200 cursor-pointer"
          >
            <SprossAvatar size={26} mood={denkt ? "denkt" : mood} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-[8px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-leaf-700 truncate">
                {stepLabel}
              </span>
              {knownFactsSummary.length > 0 && (
                <span className="rounded-full bg-leaf-100 px-1.5 py-0.2 text-[9px] font-semibold text-leaf-800">
                  {knownFactsSummary.length}{" "}
                  {locale === "en" ? "facts" : "Fakten"}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-ink truncate">
              {focusedHint ||
                (activeVariety
                  ? `${activeVariety}: ${breederImpulse ?? nextBestAction}`
                  : nextBestAction)}
            </p>
          </div>

          <div className="flex items-center gap-[8px] shrink-0">
            {proactiveChips[0] && (
              <button
                type="button"
                onClick={() => handleChipClick(proactiveChips[0]!)}
                className="rounded-full bg-leaf-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-leaf-700 transition cursor-pointer"
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
              className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-ink ring-1 ring-line hover:bg-leaf-50 transition cursor-pointer"
            >
              {locale === "en" ? "Ask →" : "Fragen →"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DESKTOP: Spross panel (>= 1024px)                                      */}
      {/* Golden ratio: max-h-[61.8vh], Fibonacci spacing (8/13/21/34px)            */}
      {/* Input row anchored at bottom (follows conversation downward)               */}
      {/* ========================================================================= */}
      {isMinimized ? (
        <aside
          aria-label="Spross KI-Copilot"
          className="fixed top-[13px] right-[21px] z-40 hidden lg:block"
        >
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="group flex items-center gap-[13px] rounded-full border border-leaf-200/90 bg-white/95 px-[13px] py-[8px] shadow-lift backdrop-blur-md transition hover:-translate-y-0.5 hover:ring-2 hover:ring-leaf-400 cursor-pointer"
          >
            <span className="relative flex size-8 items-center justify-center rounded-full bg-leaf-50 ring-1 ring-leaf-200">
              <SprossAvatar size={26} mood={denkt ? "denkt" : mood} />
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <div className="text-left">
              <span className="block text-xs font-bold leading-tight text-ink">
                {t.spross.ask}
              </span>
              <span className="block text-[10px] leading-tight text-muted">
                {denkt ? t.spross.thinking : stepLabel}
              </span>
            </div>
            <ChevronDown className="size-4 text-muted transition group-hover:text-ink" />
          </button>
        </aside>
      ) : (
        <aside
          aria-label="Spross KI-Copilot"
          className="spross-bereich fixed top-0 right-0 z-40 hidden w-[420px] max-h-[61.8vh] lg:flex lg:flex-col"
          data-offen={isChatOpen || isMemoryOpen ? "true" : "false"}
        >
          {/* Architectural shell with golden ratio corner curves */}
          <div className="spross-rahmen" aria-hidden="true">
            <div className="spross-flaeche" />
          </div>

          {/* Flex container: upper context zone (~38.2%) + scrollable chat (~61.8%) + bottom input */}
          <div className="relative z-10 flex flex-col max-h-[61.8vh] min-h-0 px-[21px] pt-[13px] pb-[13px] gap-[13px]">
            {/* 1. Header (shrink-0) */}
            <div className="shrink-0 flex items-center justify-between pb-[8px] border-b border-leaf-200/50">
              <div className="flex items-center gap-[8px]">
                <div className="relative flex size-8 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-leaf-200">
                  <SprossAvatar size={26} mood={denkt ? "denkt" : mood} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-white ${
                      denkt ? "bg-amber-400 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold leading-none text-ink">
                      Spross
                    </span>
                    <span suppressHydrationWarning className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-semibold text-leaf-800">
                      {t.spross.copilot}
                    </span>
                  </div>
                  <span suppressHydrationWarning className="text-[10px] leading-none text-muted">
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
                  title={
                    locale === "en"
                      ? "Open Farm & Breeder Knowledge"
                      : "Hof- & Züchterwissen öffnen"
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                    isMemoryOpen
                      ? "bg-leaf-700 text-white"
                      : "bg-white/90 text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100"
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
                    title={
                      isChatOpen
                        ? locale === "en"
                          ? "Collapse history"
                          : "Verlauf zuklappen"
                        : locale === "en"
                          ? "View history"
                          : "Verlauf ansehen"
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition cursor-pointer ${
                      isChatOpen
                        ? "bg-leaf-600 text-white"
                        : "bg-white/90 text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100"
                    }`}
                  >
                    <MessageSquare className="size-3" />
                    <span>{messageCount}</span>
                    {isChatOpen ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title={locale === "en" ? "Minimize" : "Minimieren"}
                  className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-leaf-100/60 hover:text-ink transition cursor-pointer"
                >
                  <Minus className="size-4" />
                </button>
              </div>
            </div>

            {/* Optional farm & breeder knowledge panel (shrink-0) */}
            {isMemoryOpen && (
              <div className="shrink-0 rounded-[13px] border border-leaf-300 bg-white/95 p-[13px] text-xs shadow-soft space-y-[8px] animate-rise">
                <div className="flex items-center justify-between border-b border-line pb-[8px]">
                  <span className="font-bold text-leaf-800">
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
                    className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-muted hover:text-ink transition cursor-pointer"
                  >
                    <RotateCcw className="size-2.5" />
                    <span>{locale === "en" ? "Reset Chat" : "Chat-Reset"}</span>
                  </button>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    {locale === "en"
                      ? "Saved Farm Context"
                      : "Gespeicherte Hof-Angaben"}
                  </div>
                  {knownFactsSummary.length === 0 ? (
                    <p className="text-[11px] text-muted leading-[1.618]">
                      {locale === "en"
                        ? "Tell me about your soil, crop rotation, irrigation, or drought experience—I'll note it automatically."
                        : "Erzähl mir von deiner Fruchtfolge, Bodenart, Beregnung oder Trockenheits-Erfahrung – ich notiere es automatisch."}
                    </p>
                  ) : (
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {knownFactsSummary.map((fact, idx) => (
                        <div
                          key={`${fact.topic}-${idx}`}
                          className="flex items-start gap-1.5 rounded-[8px] bg-leaf-50/80 px-2 py-1 text-[11px] text-ink ring-1 ring-leaf-200/70"
                        >
                          <span className="shrink-0 rounded bg-leaf-200/70 px-1.5 py-0.2 text-[9px] font-bold text-leaf-900">
                            {fact.label}
                            {fact.jahr ? ` ${fact.jahr}` : ""}
                          </span>
                          <span className="leading-[1.618]">{fact.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {visibleBreederInsights.length > 0 && (
                  <div className="pt-[8px] border-t border-line/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-leaf-700 mb-1">
                      {locale === "en"
                        ? "Active Variety Genetics"
                        : "Züchterprofil zur aktuellen Ansicht"}
                    </div>
                    <div className="space-y-1">
                      {visibleBreederInsights.slice(0, 2).map((b) => (
                        <div
                          key={b.name}
                          className="rounded-[8px] bg-sand-50 px-2 py-1 text-[11px] leading-[1.618] ring-1 ring-line"
                        >
                          <span className="font-bold text-ink">{b.name}:</span>{" "}
                          <span className="text-ink/85">{b.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Page orientation & chips (upper ~38.2% zone, shrink-0) */}
            <div className="shrink-0 rounded-[13px] border border-leaf-200/80 bg-gradient-to-br from-leaf-50/90 to-sand-100/50 p-[13px] text-xs leading-[1.618] text-ink/90 shadow-soft space-y-[8px]">
              <div className="flex items-center justify-between gap-2 pb-[6px] border-b border-leaf-200/50 text-[10px]">
                <span className="font-bold uppercase tracking-wider text-leaf-800 truncate">
                  {stepLabel}
                </span>
                {missingInfoHint && (
                  <span className="rounded-full bg-sand-200/80 px-2 py-0.2 font-semibold text-ink truncate max-w-[190px]">
                    {missingInfoHint}
                  </span>
                )}
              </div>

              <div className="text-xs leading-[1.618] text-ink/95">
                <FormattedProactiveText text={proactiveText} />
              </div>

              {activeVariety && breederImpulse && (
                <div className="rounded-[8px] bg-white/90 px-[10px] py-[6px] text-[11px] leading-[1.618] text-ink ring-1 ring-leaf-200/80">
                  <span className="font-bold text-leaf-800">
                    {locale === "en" ? "Breeder Profile: " : "Züchterwissen: "}
                  </span>
                  <span>{breederImpulse}</span>
                </div>
              )}

              {focusedHint && (
                <div className="flex items-center gap-1.5 rounded-[8px] bg-leaf-100/80 px-[10px] py-[6px] text-[11px] font-medium text-leaf-900">
                  <ArrowRight className="size-3 shrink-0 text-leaf-700" />
                  <span className="truncate">{focusedHint}</span>
                </div>
              )}

              {/* Context-synchronized action chips */}
              {proactiveChips && proactiveChips.length > 0 && (
                <div className="flex flex-wrap gap-[8px] pt-[8px] border-t border-leaf-200/40">
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
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ${
                          isTargetActive
                            ? "bg-red-500 text-white ring-2 ring-red-400"
                            : "bg-white text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100 hover:ring-leaf-400"
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
                <div className="flex flex-wrap gap-[8px] pt-1">
                  {latestUiActions.map((act, idx) => (
                    <button
                      key={`${act.type}-${act.label}-${idx}`}
                      type="button"
                      onClick={() => executeUiAction(act)}
                      className="inline-flex items-center gap-1 rounded-full bg-leaf-700 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-leaf-800 transition cursor-pointer"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="size-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Scrollable chat history (lower ~61.8% zone, flex-1 min-h-0) */}
            {isChatOpen && (
              <div
                ref={desktopChatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto space-y-[13px] pr-1 py-1 text-xs sm:text-sm border-t border-line/70 [scrollbar-width:thin]"
              >
                {conversation?.messages.map((m) =>
                  m.role === "assistant" ? (
                    <div key={m.id} className="flex items-start gap-[8px]">
                      <SprossAvatar size={22} className="mt-1 shrink-0" />
                      <div className="max-w-[85%] space-y-[8px]">
                        <div className="whitespace-pre-line rounded-[13px] rounded-tl-xs bg-sand-100/85 px-[13px] py-[8px] leading-[1.618] text-ink shadow-soft ring-1 ring-line">
                          {m.text}
                        </div>
                        {m.savedFacts?.map((fact) => (
                          <div
                            key={fact}
                            className="flex items-start gap-1.5 rounded-[8px] bg-leaf-50 px-2.5 py-1 text-[11px] font-medium leading-[1.618] text-leaf-800 ring-1 ring-leaf-200"
                          >
                            <Check className="mt-0.5 size-3 shrink-0 text-leaf-600" />
                            <span>
                              {t.spross.noted}
                              {fact}
                            </span>
                          </div>
                        ))}
                        {m.uiActions && m.uiActions.length > 0 && (
                          <div className="flex flex-wrap gap-[8px] pt-0.5">
                            {m.uiActions.map((act, idx) => (
                              <button
                                key={`${m.id}-act-${idx}`}
                                type="button"
                                onClick={() => executeUiAction(act)}
                                className="inline-flex items-center gap-1 rounded-full bg-leaf-700 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-leaf-800 transition cursor-pointer"
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="size-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-line rounded-[13px] rounded-tr-xs bg-leaf-600 px-[13px] py-[8px] leading-[1.618] text-white shadow-soft">
                        {m.text}
                      </div>
                    </div>
                  )
                )}

                {denkt && (
                  <div className="flex items-center gap-2 text-xs text-muted py-1">
                    <SprossAvatar size={20} mood="denkt" />
                    <span>
                      {locale === "en"
                        ? "Spross is thinking …"
                        : "Spross denkt nach …"}
                    </span>
                  </div>
                )}

                {fehler && (
                  <div className="rounded-[8px] bg-red-50 p-2 text-xs text-red-700 ring-1 ring-red-200">
                    {fehler}
                  </div>
                )}
              </div>
            )}

            {/* 4. Bottom input row & suggested prompts (shrink-0 mt-auto) */}
            <div className="shrink-0 mt-auto space-y-[8px]">
              {/* Suggested response prompts directly above input */}
              {isChatOpen &&
                conversation &&
                conversation.vorschlaege.length > 0 &&
                !denkt && (
                  <div className="flex flex-wrap gap-[8px] pt-1">
                    {conversation.vorschlaege.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => sendMessage(v, pathname)}
                        className="rounded-full bg-leaf-50 px-2.5 py-1 text-[11px] font-medium text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100 transition cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

              {/* Input form anchored at bottom */}
              <form
                onSubmit={handleFormSubmit}
                className="flex items-center gap-[8px] rounded-[13px] border border-line bg-white px-[13px] py-1 shadow-sm transition focus-within:border-leaf-500 focus-within:ring-2 focus-within:ring-leaf-200"
              >
                <input
                  ref={inputRef}
                  data-spross-input="true"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.spross.inputPlaceholder}
                  disabled={denkt}
                  className="h-8 min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-ink outline-none placeholder:text-muted/60 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || denkt}
                  aria-label={t.spross.sendAria}
                  className="flex size-7 items-center justify-center rounded-[8px] bg-leaf-600 text-white shadow-soft transition hover:bg-leaf-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
                >
                  <Send className="size-3.5" />
                </button>
              </form>

              {/* Footer row below input when conversation is open */}
              {isChatOpen && (
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div className="flex items-center gap-3">
                    {teamAnruf && (
                      <button
                        type="button"
                        onClick={() => oeffne("anruf")}
                        className="inline-flex items-center gap-1 font-medium text-leaf-800 hover:underline cursor-pointer"
                      >
                        <Phone className="size-3" />
                        <span>{t.spross.callTeam}</span>
                      </button>
                    )}
                    {hasUserMessages && (
                      <button
                        type="button"
                        onClick={() => void resetConversation()}
                        className="inline-flex items-center gap-1 text-muted hover:text-ink transition cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>{locale === "en" ? "Reset" : "Neu starten"}</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="text-muted hover:text-ink font-medium transition cursor-pointer"
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
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        >
          <div className="spross-leiste-flaeche absolute inset-0 pointer-events-none shadow-lift" />
          <div className="relative z-10 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(true);
                }}
                className="flex flex-1 items-center gap-2.5 rounded-full bg-leaf-50/90 py-2 pl-2.5 pr-4 ring-1 ring-leaf-200 shadow-soft transition active:scale-95"
              >
                <span className="relative flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-leaf-200">
                  <SprossAvatar size={24} mood={denkt ? "denkt" : mood} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-white ${
                      denkt ? "bg-amber-400 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                </span>
                <div className="text-left min-w-0 flex-1">
                  <span className="block text-xs font-bold leading-tight text-ink truncate">
                    {t.spross.askMobile}
                  </span>
                  <span className="block text-[10px] leading-tight text-muted truncate">
                    {denkt ? t.spross.thinking : stepLabel}
                  </span>
                </div>
              </button>

              {teamAnruf ? (
                <button
                  type="button"
                  onClick={() => oeffne("anruf")}
                  className="flex h-11 items-center gap-1.5 rounded-full bg-leaf-800 px-3.5 text-xs font-semibold text-white shadow-soft transition active:scale-95"
                >
                  <Phone className="size-3.5" aria-hidden />
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
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsChatOpen(false)}
        >
          <div
            className="relative flex max-h-[86dvh] w-full flex-col rounded-t-[21px] bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-rise"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line px-[21px] py-[13px] bg-white/95 rounded-t-[21px] backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-9 items-center justify-center rounded-full bg-leaf-50 ring-1 ring-leaf-200">
                  <SprossAvatar size={28} mood={denkt ? "denkt" : mood} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${
                      denkt ? "bg-amber-400 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-ink">Spross</span>
                    <span className="rounded-full bg-leaf-100 px-1.5 py-0.5 text-[10px] font-semibold text-leaf-800">
                      {t.spross.copilot}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted">
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
                className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-leaf-100 hover:text-ink transition"
              >
                <ChevronDown className="size-5" />
              </button>
            </div>

            {/* Mobile chat messages & proactive content */}
            <div
              ref={mobileChatScrollRef}
              className="flex-1 overflow-y-auto px-[21px] py-[13px] space-y-[13px] [scrollbar-width:thin]"
            >
              {/* Mobile proactive speech bubble */}
              <div className="relative rounded-[13px] border border-leaf-200/80 bg-gradient-to-br from-leaf-50/90 to-sand-100/50 p-[13px] text-xs leading-[1.618] text-ink/90 shadow-soft space-y-[8px]">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-leaf-200/40 text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-leaf-800 truncate">
                    {stepLabel}
                  </span>
                </div>

                <div className="leading-[1.618]">
                  <FormattedProactiveText text={proactiveText} />
                </div>

                {activeVariety && breederImpulse && (
                  <div className="rounded-[8px] bg-white/85 px-2.5 py-1.5 text-[11px] leading-[1.618] text-ink ring-1 ring-leaf-200/80">
                    <span className="font-bold text-leaf-800">
                      {locale === "en" ? "Breeder Profile: " : "Züchterwissen: "}
                    </span>
                    <span>{breederImpulse}</span>
                  </div>
                )}

                {proactiveChips && proactiveChips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-[8px] pt-1.5 border-t border-leaf-200/40">
                    {proactiveChips.map((chip: SprossChip) => {
                      const isTargetActive =
                        chip.target && activeHighlight === chip.target;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm active:scale-95 transition ${
                            isTargetActive
                              ? "bg-red-500 text-white ring-2 ring-red-400"
                              : "bg-white text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100"
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
                  <div key={m.id} className="flex items-start gap-[8px]">
                    <SprossAvatar size={22} className="mt-1 shrink-0" />
                    <div className="max-w-[85%] space-y-[8px]">
                      <div className="whitespace-pre-line rounded-[13px] rounded-tl-xs bg-sand-100/85 px-[13px] py-[8px] leading-[1.618] text-ink shadow-soft ring-1 ring-line text-xs sm:text-sm">
                        {m.text}
                      </div>
                      {m.savedFacts?.map((fact) => (
                        <div
                          key={fact}
                          className="flex items-start gap-1.5 rounded-[8px] bg-leaf-50 px-2.5 py-1 text-[11px] font-medium leading-[1.618] text-leaf-800 ring-1 ring-leaf-200"
                        >
                          <Check className="mt-0.5 size-3 shrink-0 text-leaf-600" />
                          <span>
                            {t.spross.noted}
                            {fact}
                          </span>
                        </div>
                      ))}
                      {m.uiActions && m.uiActions.length > 0 && (
                        <div className="flex flex-wrap gap-[8px] pt-0.5">
                          {m.uiActions.map((act, idx) => (
                            <button
                              key={`${m.id}-mob-act-${idx}`}
                              type="button"
                              onClick={() => executeUiAction(act)}
                              className="inline-flex items-center gap-1 rounded-full bg-leaf-700 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-leaf-800 transition"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="size-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-line rounded-[13px] rounded-tr-xs bg-leaf-600 px-[13px] py-[8px] leading-[1.618] text-white shadow-soft text-xs sm:text-sm">
                      {m.text}
                    </div>
                  </div>
                )
              )}

              {denkt && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <SprossAvatar size={20} mood="denkt" />
                  <span>
                    {locale === "en"
                      ? "Spross is thinking …"
                      : "Spross denkt nach …"}
                  </span>
                </div>
              )}

              {fehler && (
                <div className="rounded-[8px] bg-red-50 p-2 text-xs text-red-700 ring-1 ring-red-200">
                  {fehler}
                </div>
              )}
            </div>

            {/* Mobile input row (anchored at bottom) */}
            <div className="border-t border-line px-[21px] pt-[8px] pb-1 bg-white space-y-[8px]">
              {conversation && conversation.vorschlaege.length > 0 && !denkt && (
                <div className="flex flex-wrap gap-[8px]">
                  {conversation.vorschlaege.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => sendMessage(v, pathname)}
                      className="rounded-full bg-leaf-50 px-2.5 py-1 text-[11px] font-medium text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100 transition"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleFormSubmit}
                className="flex items-center gap-[8px] rounded-[13px] border border-line bg-white px-[13px] py-1 shadow-sm focus-within:border-leaf-500 focus-within:ring-2 focus-within:ring-leaf-200"
              >
                <input
                  data-spross-input="true"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.spross.inputPlaceholder}
                  disabled={denkt}
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/60 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || denkt}
                  aria-label={t.spross.sendAria}
                  className="flex size-8 items-center justify-center rounded-[8px] bg-leaf-600 text-white shadow-soft transition hover:bg-leaf-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                >
                  <Send className="size-4" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[11px]">
                {teamAnruf ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChatOpen(false);
                      oeffne("anruf");
                    }}
                    className="inline-flex items-center gap-1 font-medium text-leaf-800 hover:underline"
                  >
                    <Phone className="size-3" />
                    <span>{t.spross.callTeam}</span>
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="text-muted hover:text-ink font-medium"
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
            <strong key={index} className="font-bold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}
