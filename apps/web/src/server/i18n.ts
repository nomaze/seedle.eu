import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, type Locale } from "@/lib/i18n";

/**
 * Resolves active locale from the `sk_lang` cookie.
 * Defaults to `DEFAULT_LOCALE` ("de") when cookie is missing or invalid.
 */
export async function getServerLocale(): Promise<Locale> {
  // During static export or production build prerendering without inbound HTTP requests,
  // cookies() is unavailable and invoking it would abort static generation.
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  ) {
    return DEFAULT_LOCALE;
  }

  try {
    if (typeof cookies !== "function") {
      return DEFAULT_LOCALE;
    }
    const cookieStore = await cookies();
    const value = cookieStore?.get?.(LANG_COOKIE)?.value;
    if (value === "de" || value === "en") {
      return value;
    }
  } catch {
    // Safe fallback for static rendering or test environments
    return DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}
