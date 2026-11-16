"use client";

import {
  ArrowRight,
  Database,
  Loader2,
  LocateFixed,
  MapPin,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useSpross } from "@/components/spross/SprossContext";
import { buttonClass } from "@/components/ui/Button";
import { StatusMarker } from "@/components/ui/StatusMarker";
import {
  lookupPlzNominatim,
  lookupPlzOffline,
  POPULAR_PLZ_EXAMPLES,
  type PlzMatch,
} from "@/lib/plz";
import type { DmkRegionMeta } from "@/server/services/dmk";
import {
  InteractiveGermanyMap,
  type ActivePlzMarkerInfo,
} from "./InteractiveGermanyMap";

interface StandortWahlViewProps {
  initialRegions: DmkRegionMeta[];
  initialPlz?: string;
  defaultRegion?: string | null;
}

export function StandortWahlView({
  initialRegions,
  initialPlz = "",
  defaultRegion = null,
}: StandortWahlViewProps) {
  const router = useRouter();

  // Postal code input state
  const [plzInput, setPlzInput] = useState<string>(initialPlz);
  const [activePlzMatch, setActivePlzMatch] = useState<PlzMatch | null>(() =>
    initialPlz && initialPlz.length >= 2 ? lookupPlzOffline(initialPlz) : null,
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(() => {
    if (initialPlz && initialPlz.length >= 2) {
      const match = lookupPlzOffline(initialPlz);
      if (match) return match.regionCode;
    }
    return defaultRegion;
  });

  const [plzGeocoding, setPlzGeocoding] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const nominatimAbortRef = useRef<AbortController | null>(null);

  // Synchronize with Spross companion context
  const { setActiveRegion } = useSpross();
  useEffect(() => {
    setActiveRegion(selectedRegion);
    return () => setActiveRegion(null);
  }, [selectedRegion, setActiveRegion]);

  // Memoize postal code marker for MapLibre Germany map
  const activePlzMarkerInfo = useMemo<ActivePlzMarkerInfo | null>(() => {
    if (!activePlzMatch || activePlzMatch.plz.length !== 5) {
      return null;
    }
    return {
      plz: activePlzMatch.plz,
      city: activePlzMatch.city,
      lat: activePlzMatch.lat,
      lon: activePlzMatch.lon,
      regionCode: activePlzMatch.regionCode,
    };
  }, [activePlzMatch]);

  // Select region directly (e.g., click on map polygon)
  const handleSelectRegion = useCallback((code: string, newPlz?: string) => {
    const cleanCode = code.toUpperCase();
    setSelectedRegion(cleanCode);
    if (!newPlz) {
      // If clicked without postal code and previous postal code match no longer corresponds, reset match
      setActivePlzMatch((prev) => (prev && prev.regionCode === cleanCode ? prev : null));
    }
  }, []);

  // Parse postal code input (0ms local offline lookup only; Nominatim is never called on keystroke)
  const processPlz = useCallback(
    (inputVal: string) => {
      const digits = inputVal.replace(/\D/g, "").slice(0, 5);
      setPlzInput(digits);
      setGeolocationError(null);

      if (nominatimAbortRef.current) {
        nominatimAbortRef.current.abort();
        nominatimAbortRef.current = null;
      }

      if (digits.length === 0) {
        setActivePlzMatch(null);
        setSelectedRegion(null);
        return;
      }

      const offlineMatch = lookupPlzOffline(digits);
      if (!offlineMatch) {
        setActivePlzMatch(null);
        return;
      }

      setActivePlzMatch(offlineMatch);
      setSelectedRegion(offlineMatch.regionCode);
    },
    [],
  );

  // Explicit Nominatim refinement triggered only upon user submission
  const refinePlzViaNominatim = useCallback(async (digits: string) => {
    if (digits.length !== 5) return;
    if (nominatimAbortRef.current) {
      nominatimAbortRef.current.abort();
    }
    const ctrl = new AbortController();
    nominatimAbortRef.current = ctrl;
    setPlzGeocoding(true);
    try {
      const refinedMatch = await lookupPlzNominatim(digits, ctrl.signal);
      if (refinedMatch) {
        setActivePlzMatch(refinedMatch);
        setSelectedRegion(refinedMatch.regionCode);
      }
    } catch {
      // Fallback retains offline match
    } finally {
      setPlzGeocoding(false);
    }
  }, []);

  // Determine farmer location (Geolocation API)
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Standortermittlung wird von diesem Browser nicht unterstützt.");
      return;
    }

    setPlzGeocoding(true);
    setGeolocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&accept-language=de`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const postcode = data.address?.postcode?.replace(/\D/g, "").slice(0, 5);
            if (postcode && postcode.length === 5) {
              setPlzInput(postcode);
              processPlz(postcode);
              return;
            }
          }
        } catch {
          // Fallback below
        }

        // Fallback: nearest region by geographic distance
        let nearestCode = "NI";
        let minDist = Infinity;
        for (const reg of initialRegions) {
          if (reg.zentroid_lat && reg.zentroid_lon) {
            const d = Math.hypot(reg.zentroid_lon - longitude, reg.zentroid_lat - latitude);
            if (d < minDist) {
              minDist = d;
              nearestCode = reg.region_code;
            }
          }
        }

        const match: PlzMatch = {
          plz: "GPS",
          regionCode: nearestCode,
          regionName: initialRegions.find((r) => r.region_code === nearestCode)?.name || nearestCode,
          bundesland: nearestCode,
          city: "Mein Standort",
          lat: latitude,
          lon: longitude,
          isExactGeocoded: true,
        };
        setActivePlzMatch(match);
        setSelectedRegion(nearestCode);
        setPlzGeocoding(false);
      },
      () => {
        setGeolocationError("Standort nicht freigegeben. Bitte gib deine PLZ manuell ein.");
        setPlzGeocoding(false);
      },
      { timeout: 8000 },
    );
  }, [initialRegions, processPlz]);

  const handleResetPlz = useCallback(() => {
    setPlzInput("");
    setActivePlzMatch(null);
    setGeolocationError(null);
    setSelectedRegion(null);
  }, []);

  // Metadata for recognized or chosen region
  const activeRegionMeta = useMemo(() => {
    if (!selectedRegion) return null;
    return initialRegions.find(
      (r) =>
        r.region_code.toUpperCase() === selectedRegion.toUpperCase() ||
        (selectedRegion === "NW" && r.region_code === "NRW"),
    );
  }, [initialRegions, selectedRegion]);

  const activeRegionName = activeRegionMeta?.name || selectedRegion || "";
  const standorteCount = activeRegionMeta?.max_standorte || 12;

  // Destination URL for confirmation button
  const destinationUrl = useMemo(() => {
    if (!selectedRegion) return "";
    const regCode = selectedRegion.toLowerCase();
    const query = new URLSearchParams();
    if (activePlzMatch && activePlzMatch.plz && activePlzMatch.plz !== "GPS") {
      query.set("plz", activePlzMatch.plz);
    }
    const qs = query.toString();
    return `/daten/${encodeURIComponent(regCode)}${qs ? `?${qs}` : ""}`;
  }, [selectedRegion, activePlzMatch]);

  // Form submission handler (Enter key on postal code input)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plzInput.length === 5) {
      await refinePlzViaNominatim(plzInput);
    }
    if (destinationUrl) {
      router.push(destinationUrl);
    }
  };

  return (
    <div>
      {/* 1. Page header: meta line, title, lead */}
      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <Database className="size-4 shrink-0 text-link" aria-hidden />
            <span>Regionale Sortenversuche (Demo-Datensatz)</span>
            <span aria-hidden>·</span>
            <span>100% frei zugänglich · Keine Registrierung erforderlich</span>
          </span>
        }
        title="Finde die stärksten Sorten für deinen Standort"
        lead={
          <>
            Wähle deine Region auf der Karte oder gib deine Postleitzahl ein, um die regionalen
            Spitzenreiter aus dem modellierten Sortenversuchs-Datensatz (Demo-Datensatz) zu sehen.
          </>
        }
      />

      {/* 2. Postal code input + interactive MapLibre Germany map */}
      <section
        aria-label="Standort-Auswahl"
        className="grid grid-cols-1 items-start gap-x-12 gap-y-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr]"
      >
        {/* Postal code input field */}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-rule pt-5 lg:col-span-5 lg:col-start-1 lg:row-start-1 xl:col-span-4"
        >
          <label
            htmlFor="plz-input"
            className="flex items-center gap-2 text-subheading text-fg"
          >
            <MapPin className="size-5 shrink-0 text-link" aria-hidden />
            <span>Postleitzahl deines Betriebs:</span>
          </label>

          {/* Input field with action buttons */}
          <div className="relative max-w-measure">
            <input
              id="plz-input"
              data-spross-target="plz-input"
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={plzInput}
              onChange={(e) => processPlz(e.target.value)}
              placeholder="PLZ eingeben (z. B. 48149 für Münster oder 84036 für Landshut)..."
              className="h-control w-full rounded-control border border-control bg-surface pl-4 pr-20 text-lead tabular-nums text-fg placeholder:text-body placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {plzGeocoding && (
                <Loader2 className="size-5 animate-spin text-link" aria-hidden />
              )}
              {plzInput && (
                <button
                  type="button"
                  onClick={handleResetPlz}
                  className="flex size-9 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-highlight hover:text-fg"
                  title="PLZ zurücksetzen"
                  aria-label="PLZ zurücksetzen"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Button: Use my location */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={plzGeocoding}
            className={buttonClass("quiet", "sm", "-ml-3 cursor-pointer")}
          >
            {plzGeocoding ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="size-4" aria-hidden />
            )}
            <span>Meinen Standort nutzen</span>
          </button>

          {geolocationError && (
            <p role="alert">
              <StatusMarker status="status-problem" label={geolocationError} />
            </p>
          )}

          {/* Quick-select locations as text links */}
          <p className="text-small leading-8 text-fg-muted">
            <span className="mr-1 font-semibold text-fg">Schnellwahl:</span>
            {POPULAR_PLZ_EXAMPLES.map((item, i) => {
              const isActive = plzInput === item.plz;
              return (
                <span key={item.plz}>
                  <button
                    type="button"
                    onClick={() => processPlz(item.plz)}
                    aria-pressed={isActive}
                    className={`cursor-pointer whitespace-nowrap rounded-control py-1.5 tabular-nums underline-offset-4 transition-colors ${
                      isActive
                        ? "font-semibold text-fg"
                        : "text-link hover:underline"
                    }`}
                  >
                    {item.plz} {item.name}
                  </button>
                  {i < POPULAR_PLZ_EXAMPLES.length - 1 ? <span aria-hidden className="text-fg-muted"> · </span> : null}
                </span>
              );
            })}
          </p>
        </form>

        {/* Interactive MapLibre Germany map */}
        <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 xl:col-span-8 xl:col-start-5">
          <InteractiveGermanyMap
            selectedRegion={selectedRegion || ""}
            onSelectRegion={handleSelectRegion}
            regionsMeta={initialRegions}
            activePlzMarker={activePlzMarkerInfo}
          />
        </div>

        {/* 3. Location confirmation */}
        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2 xl:col-span-4">
          {selectedRegion && activeRegionMeta && destinationUrl ? (
            <div className="space-y-4 border-t border-rule pt-5">
              <div className="space-y-1.5 min-w-0">
                <StatusMarker status="status-ok" label="Standort erkannt" />

                {/* Detected region / municipality */}
                <h2 className="text-heading text-fg">
                  {activePlzMatch && activePlzMatch.plz && activePlzMatch.plz !== "GPS"
                    ? `${activePlzMatch.plz} ${activePlzMatch.city ? `${activePlzMatch.city} · ` : ""}${activeRegionName}`
                    : activeRegionName}
                </h2>

                {/* Provenance note: based on trial sites */}
                <p className="text-small text-fg-muted">
                  Basiert auf{" "}
                  <strong className="font-semibold text-fg">
                    {standorteCount} amtlichen Versuchsstandorten (LSV)
                  </strong>{" "}
                  und BSA-Wertprüfungen.
                </p>
              </div>

              {/* Primary action advancing to results view */}
              <Link
                href={destinationUrl}
                className={buttonClass("primary", "md", "w-full sm:w-auto")}
              >
                <span>Ergebnisse für {activeRegionName} ansehen</span>
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ) : (
            /* Prompt state when no region is selected yet */
            <p className="border-t border-divider pt-4 text-small text-fg-muted">
              <span className="font-semibold text-fg">Keine Region ausgewählt:</span> Klicke oben auf
              dein Bundesland auf der Karte oder wähle ein Beispiel aus den Schnellwahl-Chips.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
