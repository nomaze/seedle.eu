"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemo } from "./DemoContext";
import { useLanguage } from "./LanguageContext";
import { checkBackendHealth, type BackendHealthResponse } from "@/lib/backendClient";

export interface BackendStatusBadgeProps {
  initialHealth?: BackendHealthResponse | null;
}

/**
 * Top navigation status badge displaying backend connectivity state.
 * Links directly to /demo settings so testers and farmers can toggle or inspect it.
 */
export function BackendStatusBadge({ initialHealth }: BackendStatusBadgeProps = {}) {
  const { showBackendStatusBadge } = useDemo();
  const { t, locale } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(Boolean(initialHealth && initialHealth.status === "healthy"));
  const [health, setHealth] = useState<BackendHealthResponse | null>(initialHealth ?? null);

  useEffect(() => {
    if (!showBackendStatusBadge) {
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
  }, [showBackendStatusBadge]);

  if (!showBackendStatusBadge) {
    return null;
  }

  const isConnected = isOnline && health?.status === "healthy";
  const fullLabel = isConnected ? t.brandBar.backendConnected : t.brandBar.backendOffline;
  const mobileLabel = isConnected
    ? locale === "de"
      ? "Verbunden"
      : "Online"
    : locale === "de"
      ? "Test-Modus"
      : "Offline";

  return (
    <Link
      href="/demo"
      data-testid="backend-status-badge"
      title={fullLabel}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium transition shadow-soft focus-visible:outline-2 focus-visible:outline-leaf-500 ${
        isConnected
          ? "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-100"
          : "bg-bee-soft text-bee-text ring-1 ring-bee/20 hover:bg-bee-soft/80"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full shrink-0 ${
          isConnected ? "bg-status-ok animate-pulse" : "bg-bee"
        }`}
      />
      <span className="hidden sm:inline">{fullLabel}</span>
      <span className="sm:hidden">{mobileLabel}</span>
    </Link>
  );
}
