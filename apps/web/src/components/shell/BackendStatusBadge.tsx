"use client";

import Link from "next/link";
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
 * Renders a clean status dot (green/red) without visible text clutter in the header.
 * Links directly to /demo settings so testers and farmers can toggle or inspect it.
 */
export function BackendStatusBadge({
  initialHealth,
  alwaysShow = false,
}: BackendStatusBadgeProps = {}) {
  const { showBackendStatusBadge } = useDemo();
  const shouldRender = alwaysShow || showBackendStatusBadge;
  const { t, locale } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(
    Boolean(initialHealth && initialHealth.status === "healthy"),
  );
  const [health, setHealth] = useState<BackendHealthResponse | null>(initialHealth ?? null);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    let isMounted = true;
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

    return () => {
      isMounted = false;
    };
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const isConnected = isOnline && health?.status === "healthy";
  const disconnectedLabelDe =
    "Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte";
  const disconnectedLabelEn = "Offline mode (no backend) · Showing demo estimates";
  const label = isConnected
    ? t.brandBar.backendConnected
    : locale === "de"
      ? disconnectedLabelDe
      : disconnectedLabelEn;

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
        data-testid={isConnected ? undefined : "backend-disconnected-red-alert"}
        className={`size-2.5 shrink-0 rounded-full ${
          isConnected ? "bg-status-ok" : "bg-[#e05a47]"
        }`}
      />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
