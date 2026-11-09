"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Page view telemetry component.
 * Disabled in static showcase to avoid HTTP 405 Method Not Allowed errors.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // Telemetry POST disabled to prevent HTTP 405 errors on static deployments
    void pathname;
  }, [pathname]);
  return null;
}
