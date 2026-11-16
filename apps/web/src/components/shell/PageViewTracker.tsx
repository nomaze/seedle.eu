"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function forceScrollToPageTop(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  // Preserve intentional in-page anchor jumps when a URL hash fragment is present
  if (window.location.hash && window.location.hash.length > 1) {
    return;
  }
  try {
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      document.activeElement.blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch {
    window.scrollTo(0, 0);
  }
}

/**
 * Global scroll-to-top guard on route transitions.
 * Ensures every page navigation starts cleanly at the top of the document (`scrollTop = 0`)
 * instead of retaining mid-page scroll offsets from previous views or Suspense boundaries.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      // Ignore if history.scrollRestoration is read-only
    }

    forceScrollToPageTop();
    const rafId = window.requestAnimationFrame(() => {
      forceScrollToPageTop();
    });
    const timerId = window.setTimeout(() => {
      forceScrollToPageTop();
    }, 60);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [pathname]);

  return null;
}
