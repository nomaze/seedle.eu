"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "./DemoContext";
import { useLanguage } from "./LanguageContext";
import { checkBackendHealth, type BackendHealthResponse } from "@/lib/backendClient";

export interface BackendStatusBadgeProps {
  initialHealth?: BackendHealthResponse | null;
  alwaysShow?: boolean;
}

/**
 * Top navigation or demo-footer status badge displaying backend connectivity state.
 * When connected, renders a clean green status dot.
 * When disconnected, renders a prominent red alert badge ("Kein Backend verbunden")
 * and re-checks connectivity every 4000 ms, on window focus, and on route changes.
 * Links directly to /demo settings so testers and farmers can toggle or inspect it.
 */
export function BackendStatusBadge({
  initialHealth,
  alwaysShow = false,
}: BackendStatusBadgeProps = {}) {
  const { showBackendStatusBadge } = useDemo();
  const shouldRender = alwaysShow || showBackendStatusBadge;
  const { t, locale } = useLanguage();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState<boolean>(
    Boolean(initialHealth && initialHealth.status === "healthy"),
  );
  const [health, setHealth] = useState<BackendHealthResponse | null>(initialHealth ?? null);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    let isMounted = true;
    const verifyHealth = () => {
      void checkBackendHealth().then((result) => {
        if (!isMounted) return;
        if (result.isOnline && result.health?.status === "healthy") {
          setIsOnline(true);
          setHealth(result.health);
        } else {
          setIsOnline(false);
          setHealth(null);
        }
      });
    };

    verifyHealth();

    const intervalId =
      typeof window !== "undefined" ? window.setInterval(verifyHealth, 4000) : undefined;
    if (typeof window !== "undefined") {
      window.addEventListener("focus", verifyHealth);
    }

    return () => {
      isMounted = false;
      if (intervalId !== undefined && typeof window !== "undefined") {
        window.clearInterval(intervalId);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", verifyHealth);
      }
    };
  }, [shouldRender, pathname]);

  if (!shouldRender) {
    return null;
  }

  const isConnected = isOnline && health?.status === "healthy";
  const disconnectedLabelDe =
    "Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte";
  const disconnectedLabelEn = "Offline mode (no backend) · Showing demo estimates";
  const shortOfflineBadgeLabel =
    locale === "de" ? "Kein Backend verbunden" : "No backend connected";
  const label = isConnected
    ? t.brandBar.backendConnected
    : locale === "de"
      ? disconnectedLabelDe
      : disconnectedLabelEn;

  if (!isConnected) {
    return (
      <Link
        href="/demo"
        data-testid="backend-status-badge"
        title={label}
        aria-label={label}
        className="inline-flex min-h-touch shrink-0 items-center justify-center rounded-control p-1 transition-opacity hover:opacity-80"
      >
        <span
          data-testid="backend-disconnected-red-alert"
          className="inline-flex items-center gap-1.5 bg-[#fdf2f0] text-[#b42318] border border-[#e05a47] px-2.5 py-1 rounded-control text-caption font-semibold"
        >
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-[#e05a47]" />
          <span>{shortOfflineBadgeLabel}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/demo"
      data-testid="backend-status-badge"
      title={label}
      aria-label={label}
      className="inline-flex min-h-touch shrink-0 items-center justify-center rounded-control p-1 transition-opacity hover:opacity-80"
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full bg-status-ok"
      />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
