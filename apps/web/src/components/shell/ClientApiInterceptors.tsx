"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { getActiveAccessToken } from "@/lib/auth-config";
import {
  FAKE_REGIONS,
  fakeBreedersList,
  fakeRegionalStats,
  fakeSearchVarieties,
  fakeVarietyDetail,
} from "@/server/services/fake-dmk-data";

const UNSAFE_URL_CHARS_RE = /[\x00-\x1f\x7f\\]/;

function extractRequestUrlString(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/**
 * Determines whether a fetch request targets the application's own `/api/v1/` backend.
 * Rejects all third-party origins (e.g., nominatim.openstreetmap.org, tiles.openfreemap.org),
 * protocol-relative URLs (`//...`), and non-API paths so bearer tokens are never leaked.
 */
export function isOwnApiRequest(
  input: RequestInfo | URL,
  currentOrigin?: string,
): boolean {
  const urlStr = extractRequestUrlString(input).trim();
  if (!urlStr || urlStr.startsWith("//") || UNSAFE_URL_CHARS_RE.test(urlStr)) {
    return false;
  }

  try {
    const baseOrigin =
      currentOrigin ||
      (typeof window !== "undefined" &&
      window.location?.origin &&
      window.location.origin !== "null"
        ? window.location.origin
        : "https://seedle.eu");

    const configuredApiOriginRaw = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
    let configuredApiOrigin: string | null = null;
    if (configuredApiOriginRaw) {
      try {
        configuredApiOrigin = new URL(configuredApiOriginRaw).origin;
      } catch {
        configuredApiOrigin = null;
      }
    }

    const parsed = new URL(urlStr, baseOrigin);
    const isAllowedOrigin =
      parsed.origin === baseOrigin ||
      (configuredApiOrigin !== null && parsed.origin === configuredApiOrigin);

    if (!isAllowedOrigin) {
      return false;
    }

    return (
      parsed.pathname.startsWith("/api/v1/") &&
      !parsed.pathname.startsWith("//") &&
      !UNSAFE_URL_CHARS_RE.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

function buildStaticFallbackResponse(
  urlStr: string,
  baseOrigin: string,
  method: string,
  bodyRaw?: BodyInit | null,
): Response | null {
  try {
    const url = new URL(urlStr, baseOrigin);
    const pathname = url.pathname;

    // 1. /api/v1/daten
    if (pathname === "/api/v1/daten") {
      const view = url.searchParams.get("view");
      if (view === "variety") {
        const id = url.searchParams.get("id") || "";
        const detail = fakeVarietyDetail(id);
        return new Response(JSON.stringify({ detail }), {
          status: detail ? 200 : 404,
          headers: { "content-type": "application/json" },
        });
      }
      if (view === "regional") {
        const reg = url.searchParams.get("region") || "BY";
        const stats = fakeRegionalStats(reg);
        return new Response(JSON.stringify({ stats }), {
          status: stats ? 200 : 404,
          headers: { "content-type": "application/json" },
        });
      }
      if (view === "meta") {
        return new Response(
          JSON.stringify({ regions: FAKE_REGIONS, breeders: fakeBreedersList() }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      const q = url.searchParams.get("q") || undefined;
      const zuechter = url.searchParams.get("zuechter") || undefined;
      const nutzung =
        (url.searchParams.get("nutzung") as "alle" | "silo" | "koerner") ||
        undefined;
      const reifegruppe =
        (url.searchParams.get("reifegruppe") as
          | "alle"
          | "frueh"
          | "mittelfrueh"
          | "spaet") || undefined;
      const region = url.searchParams.get("region") || undefined;
      const limit = url.searchParams.get("limit")
        ? Number(url.searchParams.get("limit"))
        : 25;
      const offset = url.searchParams.get("offset")
        ? Number(url.searchParams.get("offset"))
        : 0;

      const res = fakeSearchVarieties({
        q,
        zuechter,
        nutzung,
        reifegruppe,
        region,
        limit,
        offset,
      });
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // 2. /api/v1/companion
    if (pathname === "/api/v1/companion") {
      const mockConv = {
        messages: [
          {
            id: "msg_init",
            role: "assistant",
            text: "Hallo! Ich bin Spross, dein Feldbegleiter auf seedle.eu. Wie kann ich dir helfen?",
            createdAt: new Date().toISOString(),
          },
        ],
        vorschlaege: ["Trockenheits-Check", "Sorten vergleichen"],
        modus: "skript",
        uiActions: [],
        knownFactsSummary: [],
      };
      return new Response(JSON.stringify(mockConv), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // 3. /api/v1/fields
    if (pathname === "/api/v1/fields" && method === "POST") {
      let customName = "Hinteracker";
      if (typeof bodyRaw === "string") {
        try {
          const parsed: unknown = JSON.parse(bodyRaw);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            "name" in parsed &&
            typeof parsed.name === "string" &&
            parsed.name.trim()
          ) {
            customName = parsed.name.trim();
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("seedle_custom_field", bodyRaw);
          }
        } catch {
          // Ignore invalid JSON body
        }
      }
      return new Response(
        JSON.stringify({
          feld: {
            id: "f-hinteracker",
            name: customName,
            areaHa: 14.5,
            status: "status-ok",
          },
          user: { id: "usr_musterhof", emailVerified: true },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    }

    // 4. Stubs: Events, Callbacks, Knowledge, Auth, Fields
    if (
      pathname.startsWith("/api/v1/events") ||
      pathname.startsWith("/api/v1/callbacks") ||
      pathname.startsWith("/api/v1/knowledge") ||
      pathname.startsWith("/api/v1/auth") ||
      pathname.startsWith("/api/v1/fields")
    ) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  } catch {
    // Ignore local fallback construction errors
  }
  return null;
}

/**
 * Creates a fetch wrapper that attaches `Authorization: Bearer <token>` strictly to
 * own `/api/v1/*` requests and never leaks credentials to third-party endpoints.
 */
export function createApiInterceptorFetch(
  originalFetch: typeof fetch,
  currentOrigin?: string,
): typeof fetch {
  return async function interceptedFetch(
    this: unknown,
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const finalInit: RequestInit = init ? { ...init } : {};
    const ownApi = isOwnApiRequest(input, currentOrigin);

    if (ownApi) {
      const token = getActiveAccessToken();
      if (token) {
        const headers = new Headers(finalInit.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        finalInit.headers = headers;
      }

      const baseOrigin =
        currentOrigin ||
        (typeof window !== "undefined" &&
        window.location?.origin &&
        window.location.origin !== "null"
          ? window.location.origin
          : "https://seedle.eu");
      const urlStr = extractRequestUrlString(input);
      const method = (finalInit.method ?? "GET").toUpperCase();
      const parsedPathname = (() => {
        try {
          return new URL(urlStr, baseOrigin).pathname;
        } catch {
          return "";
        }
      })();

      // Resolve client-side mock endpoints directly without triggering 404s in browser DevTools
      const isDirectClientMockRoute =
        parsedPathname === "/api/v1/companion" ||
        parsedPathname === "/api/v1/daten" ||
        parsedPathname.startsWith("/api/v1/events") ||
        parsedPathname.startsWith("/api/v1/callbacks") ||
        parsedPathname.startsWith("/api/v1/knowledge") ||
        parsedPathname.startsWith("/api/v1/auth");

      if (isDirectClientMockRoute && !currentOrigin) {
        const directFallback = buildStaticFallbackResponse(
          urlStr,
          baseOrigin,
          method,
          finalInit.body,
        );
        if (directFallback) {
          return directFallback;
        }
      }

      const upstream = await Promise.resolve(
        originalFetch.apply(this, [input, finalInit]),
      ).catch(() => null);

      if (upstream instanceof Response && upstream.ok) {
        return upstream;
      }

      const fallback = buildStaticFallbackResponse(
        urlStr,
        baseOrigin,
        method,
        finalInit.body,
      );
      if (fallback) {
        return fallback;
      }

      if (upstream instanceof Response) {
        return upstream;
      }
    }

    return originalFetch.apply(this, [input, finalInit]);
  };
}

let isWindowFetchIntercepted = false;

function ensureWindowFetchIntercepted(): void {
  if (typeof window === "undefined" || isWindowFetchIntercepted) return;
  isWindowFetchIntercepted = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = createApiInterceptorFetch(originalFetch);
}

if (typeof window !== "undefined") {
  ensureWindowFetchIntercepted();
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Intercepts client-side fetch calls to /api/v1/* in browser environments,
 * automatically attaching Authorization: Bearer <token> if present,
 * serving mock data for static GitHub Pages and standalone development,
 * and resetting scroll position to the top on every route change.
 */
export function ClientApiInterceptors() {
  const pathname = usePathname();
  ensureWindowFetchIntercepted();

  useEffect(() => {
    ensureWindowFetchIntercepted();
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (window.location.hash && window.location.hash.length > 1) return;
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
