"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

export interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function getClientLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const prefix = `${LANG_COOKIE}=`;
  const cookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  if (!cookie) return null;
  const value = cookie.slice(prefix.length);
  if (value === "de" || value === "en") {
    return value;
  }
  return null;
}

export function LanguageProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  useEffect(() => {
    const clientLocale = getClientLocale();
    if (clientLocale && clientLocale !== initialLocale) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(clientLocale);
      document.documentElement.lang = clientLocale;
    }
  }, [initialLocale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      if (typeof document !== "undefined") {
        document.cookie = `${LANG_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = nextLocale;
      }
      startTransition(() => {
        router.refresh();
      });
    },
    [router],
  );

  const t = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: getDictionary(DEFAULT_LOCALE),
    };
  }
  return ctx;
}

/**
 * Language switch pill button [ DE | EN ] conforming to NoMaze design system.
 */
export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label={locale === "de" ? "Sprache wählen" : "Select language"}
      className="inline-flex h-9 sm:h-10 items-center rounded-full bg-white p-0.5 sm:p-1 ring-1 ring-line shadow-soft"
    >
      <button
        type="button"
        onClick={() => setLocale("de")}
        aria-pressed={locale === "de"}
        aria-label="Deutsch"
        className={`rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold transition ${
          locale === "de"
            ? "bg-leaf-800 text-white shadow-soft"
            : "text-muted hover:text-ink"
        }`}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="English"
        className={`rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold transition ${
          locale === "en"
            ? "bg-leaf-800 text-white shadow-soft"
            : "text-muted hover:text-ink"
        }`}
      >
        EN
      </button>
    </div>
  );
}
