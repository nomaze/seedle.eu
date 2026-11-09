"use client";

import {
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  LocateFixed,
  MapPin,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { Card } from "@/components/ui/Card";
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
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Hero header and guiding prompt */}
      <section className="pt-1 sm:pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-800 ring-1 ring-leaf-200">
            <Database className="size-3.5 text-leaf-700" /> Regionale Sortenversuche (Demo-Datensatz)
          </span>
          <span className="text-xs text-muted">
            100% frei zugänglich · Keine Registrierung erforderlich
          </span>
        </div>

        <h1 className="mt-3 text-[2.1rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl">
          Finde die stärksten Sorten für deinen Standort
        </h1>

        <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg leading-relaxed">
          Wähle deine Region auf der Karte oder gib deine Postleitzahl ein, um die regionalen
          Spitzenreiter aus dem modellierten Sortenversuchs-Datensatz (Demo-Datensatz) zu sehen.
        </p>
      </section>

      {/* 2. Step 1 Core: Postal code input + Interactive MapLibre Germany map */}
      <section aria-label="Standort-Auswahl">
        <Card className="space-y-5 p-5 sm:p-6 shadow-sm">
          {/* Postal code input field */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="plz-input"
                className="text-base sm:text-lg font-bold text-ink flex items-center gap-2"
              >
                <MapPin className="size-5 text-leaf-600 shrink-0" />
                <span>Postleitzahl deines Betriebs:</span>
              </label>

              {/* Button: Use my location */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={plzGeocoding}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-sand-100 px-3.5 py-1.5 text-xs font-semibold text-leaf-800 ring-1 ring-line hover:bg-leaf-50 hover:ring-leaf-300 transition cursor-pointer"
              >
                {plzGeocoding ? (
                  <Loader2 className="size-3.5 animate-spin text-leaf-700" />
                ) : (
                  <LocateFixed className="size-3.5 text-leaf-700" />
                )}
                <span>Meinen Standort nutzen</span>
              </button>
            </div>

            {/* Input field with action buttons */}
            <div className="relative">
              <input
                id="plz-input"
                data-spross-target="plz-input"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={plzInput}
                onChange={(e) => processPlz(e.target.value)}
                placeholder="PLZ eingeben (z. B. 48149 für Münster oder 84036 für Landshut)..."
                className="w-full rounded-2xl border-0 bg-white py-4 pl-4 pr-24 text-lg sm:text-xl font-medium text-ink ring-2 ring-leaf-300 shadow-sm placeholder:text-muted/60 focus:ring-2 focus:ring-leaf-600 transition"
              />

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {plzGeocoding && (
                  <Loader2 className="size-5 animate-spin text-leaf-600" />
                )}
                {plzInput && (
                  <button
                    type="button"
                    onClick={handleResetPlz}
                    className="rounded-full p-1.5 text-muted hover:bg-sand-100 hover:text-ink transition"
                    title="PLZ zurücksetzen"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {geolocationError && (
              <div className="rounded-xl bg-sun-50 p-2.5 text-xs text-sun-900 ring-1 ring-sun-200">
                {geolocationError}
              </div>
            )}

            {/* Quick-select location chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted">
              <span className="font-semibold text-ink">Schnellwahl:</span>
              {POPULAR_PLZ_EXAMPLES.map((item) => {
                const isActive = plzInput === item.plz;
                return (
                  <button
                    key={item.plz}
                    type="button"
                    onClick={() => processPlz(item.plz)}
                    className={`rounded-full px-3 py-1 transition cursor-pointer ${
                      isActive
                        ? "bg-leaf-600 text-white font-bold shadow-sm"
                        : "bg-white text-muted ring-1 ring-line hover:text-ink hover:ring-leaf-300"
                    }`}
                  >
                    {item.plz} {item.name}
                  </button>
                );
              })}
            </div>
          </form>

          {/* Interactive MapLibre Germany map */}
          <div className="pt-2">
            <InteractiveGermanyMap
              selectedRegion={selectedRegion || ""}
              onSelectRegion={handleSelectRegion}
              regionsMeta={initialRegions}
              activePlzMarker={activePlzMarkerInfo}
            />
          </div>
        </Card>

        {/* 3. Location confirmation summary card */}
        {selectedRegion && activeRegionMeta && destinationUrl ? (
          <div className="mt-5 transform transition-[transform,opacity] duration-200 ease-out">
            <div className="rounded-2xl border-2 border-leaf-500 bg-gradient-to-br from-leaf-50/90 via-white to-sand-100/60 p-5 shadow-lift sm:p-6 ring-1 ring-leaf-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-leaf-800 uppercase tracking-wider">
                    <CheckCircle2 className="size-4 text-leaf-600" />
                    <span>Standort erkannt</span>
                  </div>

                  {/* Detected region / municipality */}
                  <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight truncate">
                    {activePlzMatch && activePlzMatch.plz && activePlzMatch.plz !== "GPS"
                      ? `${activePlzMatch.plz} ${activePlzMatch.city ? `${activePlzMatch.city} · ` : ""}${activeRegionName}`
                      : activeRegionName}
                  </h2>

                  {/* Provenance note: based on trial sites */}
                  <p className="text-xs sm:text-sm text-muted">
                    Basiert auf{" "}
                    <strong className="text-ink font-semibold">
                      {standorteCount} amtlichen Versuchsstandorten (LSV)
                    </strong>{" "}
                    und BSA-Wertprüfungen.
                  </p>
                </div>

                {/* Primary action button advancing to results view */}
                <div className="shrink-0 pt-1 sm:pt-0">
                  <Link
                    href={destinationUrl}
                    className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-leaf-600 hover:bg-leaf-500 active:bg-leaf-700 px-6 sm:px-8 h-13 text-base sm:text-lg font-bold text-white shadow-lift transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <span>Ergebnisse für {activeRegionName} ansehen</span>
                    <ArrowRight className="size-5 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Prompt state when no region is selected yet */
          <div className="mt-4 rounded-xl border border-dashed border-line bg-sand-50/60 p-4 text-center text-xs text-muted">
            <span className="font-medium text-ink">Keine Region ausgewählt:</span> Klicke oben auf
            dein Bundesland auf der Karte oder wähle ein Beispiel aus den Schnellwahl-Chips.
          </div>
        )}
      </section>
    </div>
  );
}
