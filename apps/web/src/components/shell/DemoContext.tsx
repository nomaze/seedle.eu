"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_STANDARD,
  MARKEN,
  STANDARD_DEMO_EINSTELLUNGEN,
  type DemoEinstellungen,
  type Marke,
} from "@/lib/demo";

export { STANDARD_DEMO_EINSTELLUNGEN };

export const LOCAL_STORAGE_MARKE_KEY = "seedle_active_marke";
export const LOCAL_STORAGE_DEMO_KEY = "seedle_demo_settings_v3";
export const LOCAL_STORAGE_SHOW_BACKEND_BADGE_KEY = "seedle_show_backend_badge";

export interface DemoContextValue extends DemoEinstellungen {
  setMarke: (marke: Marke) => void;
  updateDemo: (partial: Partial<DemoEinstellungen>) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  ...DEMO_STANDARD,
  setMarke: () => {},
  updateDemo: () => {},
  resetDemo: () => {},
});

/** Passes demo settings down the component hierarchy. */
export function DemoProvider({ value: initialValue, children }: { value: DemoEinstellungen; children: ReactNode }) {
  const [demo, setDemo] = useState<DemoEinstellungen>(initialValue);

  // Check for persisted demo settings in localStorage after mounting
  useEffect(() => {
    try {
      let savedSettings: Partial<DemoEinstellungen> = {};
      const rawSettings = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
      if (rawSettings) {
        try {
          savedSettings = JSON.parse(rawSettings);
        } catch {
          // JSON parsing error fallback
        }
      }

      const rawMarke = localStorage.getItem(LOCAL_STORAGE_MARKE_KEY) || savedSettings.marke;
      const savedMarke = rawMarke === "seedle" ? "cream" : rawMarke;
      const validMarke =
        savedMarke && (MARKEN as readonly string[]).includes(savedMarke)
          ? (savedMarke as Marke)
          : undefined;

      const savedBadgeRaw = localStorage.getItem(LOCAL_STORAGE_SHOW_BACKEND_BADGE_KEY);
      let savedBadge: boolean | undefined = undefined;
      if (savedBadgeRaw !== null) {
        savedBadge = savedBadgeRaw === "true";
      } else if (savedSettings.showBackendStatusBadge !== undefined) {
        savedBadge = savedSettings.showBackendStatusBadge;
      }

      const hasSettings = Object.keys(savedSettings).length > 0;
      if (hasSettings || validMarke || savedBadge !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDemo((prev) => {
          const next: DemoEinstellungen = {
            ...DEMO_STANDARD,
            ...prev,
            ...savedSettings,
            ...(validMarke ? { marke: validMarke } : {}),
            ...(savedBadge !== undefined ? { showBackendStatusBadge: savedBadge } : {}),
          };
          if (typeof document !== "undefined") {
            document.documentElement.dataset.marke = next.marke;
            document.documentElement.dataset.brand = next.marke;
          }
          return next;
        });
      } else if (typeof document !== "undefined") {
        document.documentElement.dataset.marke = initialValue.marke;
        document.documentElement.dataset.brand = initialValue.marke;
      }
    } catch {
      // localStorage not available
    }
  }, [initialValue.marke]);

  const setMarke = useCallback((newMarke: Marke) => {
    setDemo((prev) => {
      const next = { ...prev, marke: newMarke };
      try {
        localStorage.setItem(LOCAL_STORAGE_MARKE_KEY, newMarke);
        const existing = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
          LOCAL_STORAGE_DEMO_KEY,
          JSON.stringify({ ...parsed, marke: newMarke }),
        );
        if (typeof document !== "undefined") {
          document.documentElement.dataset.marke = newMarke;
          document.documentElement.dataset.brand = newMarke;
        }
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, []);

  const updateDemo = useCallback((partial: Partial<DemoEinstellungen>) => {
    setDemo((prev) => {
      const next = { ...prev, ...partial };
      try {
        if (partial.marke) {
          localStorage.setItem(LOCAL_STORAGE_MARKE_KEY, partial.marke);
          if (typeof document !== "undefined") {
            document.documentElement.dataset.marke = partial.marke;
            document.documentElement.dataset.brand = partial.marke;
          }
        }
        if (partial.showBackendStatusBadge !== undefined) {
          localStorage.setItem(LOCAL_STORAGE_SHOW_BACKEND_BADGE_KEY, String(partial.showBackendStatusBadge));
        }
        const existing = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
          LOCAL_STORAGE_DEMO_KEY,
          JSON.stringify({ ...parsed, ...partial }),
        );
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, []);

  const resetDemo = useCallback(() => {
    setDemo(DEMO_STANDARD);
    try {
      localStorage.setItem(LOCAL_STORAGE_MARKE_KEY, DEMO_STANDARD.marke);
      localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(DEMO_STANDARD));
      localStorage.setItem(LOCAL_STORAGE_SHOW_BACKEND_BADGE_KEY, String(DEMO_STANDARD.showBackendStatusBadge));
      if (typeof document !== "undefined") {
        document.documentElement.dataset.marke = DEMO_STANDARD.marke;
        document.documentElement.dataset.brand = DEMO_STANDARD.marke;
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const contextValue = useMemo<DemoContextValue>(
    () => ({
      ...demo,
      setMarke,
      updateDemo,
      resetDemo,
    }),
    [demo, setMarke, updateDemo, resetDemo],
  );

  return <DemoContext.Provider value={contextValue}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  return useContext(DemoContext);
}

/** Conditionally renders children only when corresponding feature toggle is active in demo settings. */
export function NurMit({
  funktion,
  children,
}: {
  funktion: "saatgutKauf" | "spross" | "teamAnruf" | "stoebern" | "anmeldung";
  children: ReactNode;
}) {
  return useDemo()[funktion] ? <>{children}</> : null;
}
