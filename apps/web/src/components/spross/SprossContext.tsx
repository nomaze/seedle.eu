"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  ChatMessage,
  CompanionResponse,
  PageViewState,
  SprossUiAction,
} from "@seedle/contracts";
import { getClientLocale } from "../shell/LanguageContext";
import { useOverlays } from "../shell/Overlays";

export type { ChatMessage, CompanionResponse, PageViewState, SprossUiAction };
export type Conversation = CompanionResponse;

export interface SprossChip {
  id: string;
  label: string;
  target?: string;
  href?: string;
  question?: string;
  frage?: string;
  action?: () => void;
  uiAction?: SprossUiAction;
}

export type SprossMood = "ruhig" | "denkt" | "freut";

export interface SprossTargetEntry {
  element: HTMLElement | null;
  onTrigger?: () => void;
  label?: string;
  insight?: string;
}

export interface FocusedElementInfo {
  targetId: string;
  label?: string;
  insight?: string;
}

export type SprossActionHandler = (action: SprossUiAction) => boolean | void;

/**
 * Filters out targets that should not trigger passive hover highlight pulses
 * across large surface areas (e.g., the entire map canvas `field-map`).
 * Direct intentional triggers via chips remain unaffected.
 */
export function isPassiveHoverTarget(id: string | null | undefined): boolean {
  if (!id) return false;
  if (id === "field-map") return false;
  return true;
}

interface SprossContextValue {
  mood: SprossMood;
  setMood: (mood: SprossMood) => void;

  activeHighlight: string | null;
  setHighlight: (target: string | null) => void;

  activeVariety: string | null;
  setActiveVariety: (v: string | null) => void;

  activeRegion: string | null;
  setActiveRegion: (r: string | null) => void;

  pageState: PageViewState;
  setPageState: React.Dispatch<React.SetStateAction<PageViewState>>;
  updatePageState: (partial: Partial<PageViewState>) => void;

  focusedElementInfo: FocusedElementInfo | null;
  setFocusedElementInfo: (info: FocusedElementInfo | null) => void;

  conversation: CompanionResponse | null;
  denkt: boolean;
  fehler: string | null;

  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  toggleChat: () => void;

  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;

  isMemoryOpen: boolean;
  setIsMemoryOpen: (open: boolean) => void;
  toggleMemory: () => void;

  sendMessage: (text: string, seite?: string) => Promise<void>;
  askSpross: (text: string, seite?: string) => void;
  resetConversation: () => Promise<void>;
  focusInput: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;

  registerTarget: (id: string, entry: SprossTargetEntry) => () => void;
  triggerTarget: (targetId: string) => void;

  registerActionHandler: (handler: SprossActionHandler) => () => void;
  registerFilterHandler: (handler: SprossActionHandler) => () => void;
  executeUiAction: (action: SprossUiAction) => void;
}

const SprossCtx = createContext<SprossContextValue | null>(null);

function detectActiveLocale(): "de" | "en" {
  if (typeof document !== "undefined") {
    const cookieLocale = getClientLocale();
    if (cookieLocale) return cookieLocale;
    if (document.documentElement?.lang === "en") return "en";
  }
  return "de";
}

function createDefaultConversation(): CompanionResponse {
  return {
    messages: [
      {
        id: "msg_init",
        role: "assistant",
        text: "Hallo! Ich bin Spross, dein Feldbegleiter auf seedle.eu. Wie kann ich dir helfen?",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    vorschlaege: ["Trockenheits-Check", "Sorten vergleichen"],
    modus: "skript",
    uiActions: [],
    knownFactsSummary: [],
  };
}

export function SprossProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mood, setMood] = useState<SprossMood>("ruhig");
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [activeVariety, setActiveVariety] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageViewState>({
    route: pathname || "/",
  });
  const [focusedElementInfo, setFocusedElementInfo] =
    useState<FocusedElementInfo | null>(null);

  const [conversation, setConversation] = useState<CompanionResponse | null>(
    () => createDefaultConversation(),
  );
  const [denkt, setDenkt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [isChatOpen, _setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const freutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const registryRef = useRef<Map<string, SprossTargetEntry>>(new Map());
  const actionHandlersRef = useRef<Set<SprossActionHandler>>(new Set());

  const flashFreut = useCallback(() => {
    setMood("freut");
    if (freutTimerRef.current) clearTimeout(freutTimerRef.current);
    freutTimerRef.current = setTimeout(() => {
      setMood("ruhig");
    }, 2500);
  }, []);

  const updatePageState = useCallback((partial: Partial<PageViewState>) => {
    setPageState((prev) => {
      let changed = false;
      for (const [key, value] of Object.entries(partial)) {
        if (JSON.stringify((prev as Record<string, unknown>)[key]) !== JSON.stringify(value)) {
          changed = true;
          break;
        }
      }
      if (!changed) return prev;
      return {
        ...prev,
        ...partial,
      };
    });
  }, []);

  // Synchronize route and scan available [data-spross-target] elements on page navigation
  useEffect(() => {
    if (typeof document === "undefined") return;
    const scanTargets = () => {
      const nodes = document.querySelectorAll<HTMLElement>("[data-spross-target]");
      const ids = Array.from(nodes)
        .map((n) => n.getAttribute("data-spross-target"))
        .filter((id): id is string => Boolean(id));
      const uniqueIds = Array.from(new Set([...ids, ...registryRef.current.keys()])).slice(
        0,
        30
      );
      setPageState((prev) => ({
        ...prev,
        route: pathname || prev.route || "/",
        availableTargets: uniqueIds,
      }));
    };

    scanTargets();
    const tId = setTimeout(scanTargets, 350);
    return () => clearTimeout(tId);
  }, [pathname]);

  // Highlight target element with pulse in DOM
  useEffect(() => {
    if (typeof document === "undefined") return;
    const selector = "[data-spross-highlight='true']";
    const existing = document.querySelectorAll(selector);
    existing.forEach((el) => {
      el.removeAttribute("data-spross-highlight");
    });

    if (!activeHighlight) return;

    const targets = document.querySelectorAll(`[data-spross-target="${activeHighlight}"]`);
    targets.forEach((el) => {
      el.setAttribute("data-spross-highlight", "true");
    });

    return () => {
      targets.forEach((el) => {
        el.removeAttribute("data-spross-highlight");
      });
    };
  }, [activeHighlight]);

  // Bidirectional highlighting & element focus radar
  useEffect(() => {
    if (typeof document === "undefined") return;
    function handleMouseOver(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-spross-target]"
      );
      if (target) {
        const id = target.getAttribute("data-spross-target");
        if (id) {
          // Exclude field-map from passive hover pulse
          if (!isPassiveHoverTarget(id)) return;
          setActiveHighlight(id);
          const regEntry = registryRef.current.get(id);
          const label =
            target.getAttribute("data-spross-label") ||
            regEntry?.label ||
            target.getAttribute("aria-label") ||
            target.innerText?.trim().slice(0, 60) ||
            undefined;
          const insight =
            target.getAttribute("data-spross-insight") || regEntry?.insight || undefined;
          setFocusedElementInfo({ targetId: id, label, insight });
        }
      }
    }
    function handleMouseOut(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-spross-target]"
      );
      if (target) {
        const id = target.getAttribute("data-spross-target");
        if (id) {
          if (!isPassiveHoverTarget(id)) return;
          setActiveHighlight((curr) => (curr === id ? null : curr));
        }
      }
    }
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  // Component registration in Target Registry
  const registerTarget = useCallback((id: string, entry: SprossTargetEntry) => {
    registryRef.current.set(id, entry);
    return () => {
      registryRef.current.delete(id);
    };
  }, []);

  // Target trigger: smooth scroll, focus, and pulse highlight. Never invoke el.click() automatically.
  const triggerTarget = useCallback((targetId: string) => {
    setActiveHighlight(targetId);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setActiveHighlight((curr) => (curr === targetId ? null : curr));
    }, 3500);

    const entry = registryRef.current.get(targetId);
    if (entry) {
      if (entry.element) {
        entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
        if (entry.element.tagName === "INPUT" || entry.element.tagName === "SELECT" || entry.element.tagName === "TEXTAREA") {
          entry.element.focus();
        }
      }
      if (entry.onTrigger) {
        entry.onTrigger();
      }
      return;
    }

    if (typeof document !== "undefined") {
      const el = document.querySelector<HTMLElement>(`[data-spross-target="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
          el.focus();
        }
      }
    }
  }, []);

  // Action / Filter Handler Registry for live views
  const registerActionHandler = useCallback((handler: SprossActionHandler) => {
    actionHandlersRef.current.add(handler);
    return () => {
      actionHandlersRef.current.delete(handler);
    };
  }, []);

  const executeUiAction = useCallback(
    (action: SprossUiAction) => {
      let handled = false;
      for (const handler of actionHandlersRef.current) {
        try {
          const res = handler(action);
          if (res === true) {
            handled = true;
          }
        } catch (err) {
          console.warn("[spross] Error executing UI action handler:", err);
        }
      }

      if (action.type === "highlight_target" && action.target) {
        triggerTarget(action.target);
        flashFreut();
        return;
      }

      if (action.type === "navigate" && action.href) {
        router.push(action.href);
        flashFreut();
        return;
      }

      if (handled) {
        if (action.target) {
          setActiveHighlight(action.target);
          if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = setTimeout(() => {
            setActiveHighlight(null);
          }, 2800);
        }
        flashFreut();
        return;
      }

      // Fallback for scenario/sorting changes or URL parameters
      if (action.type === "select_scenario" || action.filterKey === "sortierung") {
        const scenarioVal = action.target || action.filterValue || "trocken";
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.pathname.includes("/ranking")) {
            if (scenarioVal === "gewichtet") {
              url.searchParams.delete("sortierung");
            } else {
              url.searchParams.set("sortierung", scenarioVal);
            }
            router.push(`${url.pathname}${url.search}`);
            flashFreut();
            return;
          }
        }
      }

      if (action.target) {
        triggerTarget(action.target);
      } else if (action.href) {
        router.push(action.href);
      }
      flashFreut();
    },
    [flashFreut, router, triggerTarget]
  );

  const focusInput = useCallback(() => {
    setIsMinimized(false);
    setTimeout(() => {
      if (typeof document !== "undefined") {
        const inputs = document.querySelectorAll<HTMLInputElement>(
          'input[data-spross-input="true"]'
        );
        for (const input of inputs) {
          if (input.offsetParent !== null) {
            input.focus();
            return;
          }
        }
      }
      inputRef.current?.focus();
    }, 50);
  }, []);

  const sendMessage = useCallback(
    async (rawText: string, seite?: string) => {
      const clean = rawText.trim();
      if (!clean || denkt) return;

      const locale = detectActiveLocale();
      const currentRoute =
        seite ||
        pageState.route ||
        (typeof window !== "undefined" ? window.location.pathname : undefined);

      setFehler(null);
      setDenkt(true);
      setMood("denkt");

      setConversation((c) =>
        c
          ? {
              ...c,
              vorschlaege: [],
              messages: [
                ...c.messages,
                {
                  id: `tmp-${Date.now()}`,
                  role: "user",
                  text: clean,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : {
              messages: [
                {
                  id: `tmp-${Date.now()}`,
                  role: "user",
                  text: clean,
                  createdAt: new Date().toISOString(),
                },
              ],
              vorschlaege: [],
              modus: "skript",
            }
      );

      try {
        const res = await fetch("/api/v1/companion", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: clean,
            seite: currentRoute,
            activeVariety: activeVariety ?? undefined,
            activeRegion: activeRegion ?? undefined,
            locale,
            pageState: {
              ...pageState,
              route: currentRoute,
            },
          }),
        });

        if (!res.ok) throw new Error("Fehler beim Senden");
        const updated: CompanionResponse = await res.json();
        setConversation(updated);

        // On chat response: NEVER navigate automatically to another page.
        // Only highlight in-page targets or apply in-page filter handlers if registered on current view.
        if (updated.uiActions && updated.uiActions.length > 0) {
          const firstAction = updated.uiActions[0]!;
          if (firstAction.type === "highlight_target" && firstAction.target) {
            triggerTarget(firstAction.target);
          } else if (firstAction.type === "set_filter") {
            for (const handler of actionHandlersRef.current) {
              try {
                handler(firstAction);
              } catch {
                // ignore
              }
            }
          }
        }

        flashFreut();
      } catch {
        setFehler(
          locale === "en"
            ? "Spross is currently unreachable. Please try again in a moment!"
            : "Spross ist gerade nicht erreichbar. Versuch es gleich nochmal!"
        );
        setMood("ruhig");
      } finally {
        setDenkt(false);
      }
    },
    [denkt, activeVariety, activeRegion, pageState, flashFreut, triggerTarget]
  );

  const resetConversation = useCallback(async () => {
    const locale = detectActiveLocale();
    try {
      setDenkt(true);
      const res = await fetch(`/api/v1/companion?locale=${locale}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const fresh: CompanionResponse = await res.json();
        setConversation(fresh);
        flashFreut();
      }
    } catch {
      // Ignore network error on reset
    } finally {
      setDenkt(false);
    }
  }, [flashFreut]);

  const setIsChatOpen = useCallback((open: boolean) => {
    _setIsChatOpen(open);
    if (open) {
      setIsMinimized(false);
    }
  }, []);

  const toggleChat = useCallback(() => {
    _setIsChatOpen((o) => {
      if (!o) setIsMinimized(false);
      return !o;
    });
  }, []);

  const toggleMemory = useCallback(() => {
    setIsMemoryOpen((o) => {
      if (!o) setIsMinimized(false);
      return !o;
    });
  }, []);

  const askSpross = useCallback(
    (text: string, seite?: string) => {
      setIsMinimized(false);
      _setIsChatOpen(true);
      void sendMessage(text, seite);
    },
    [sendMessage]
  );

  const { offen, sprossFrage, frageVerbraucht, schliesse } = useOverlays();
  useEffect(() => {
    if (offen === "spross") {
      const timer = setTimeout(() => {
        setIsMinimized(false);
        _setIsChatOpen(true);
        if (sprossFrage) {
          const q = sprossFrage;
          frageVerbraucht();
          void sendMessage(q);
        } else {
          focusInput();
        }
        schliesse();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [offen, sprossFrage, frageVerbraucht, schliesse, sendMessage, focusInput]);

  const value: SprossContextValue = {
    mood,
    setMood,
    activeHighlight,
    setHighlight: setActiveHighlight,
    activeVariety,
    setActiveVariety,
    activeRegion,
    setActiveRegion,
    pageState,
    setPageState,
    updatePageState,
    focusedElementInfo,
    setFocusedElementInfo,
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
    registerTarget,
    triggerTarget,
    registerActionHandler,
    registerFilterHandler: registerActionHandler,
    executeUiAction,
  };

  return <SprossCtx.Provider value={value}>{children}</SprossCtx.Provider>;
}

export function useSpross(): SprossContextValue {
  const ctx = useContext(SprossCtx);
  if (!ctx) throw new Error("useSpross muss innerhalb eines SprossProviders verwendet werden.");
  return ctx;
}
