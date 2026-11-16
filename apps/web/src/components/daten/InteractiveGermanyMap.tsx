"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, Marker } from "maplibre-gl";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadMaplibre } from "@/components/map/loadMaplibre";
import {
  attachMapErrorShield,
  DEUTSCHLAND,
  KARTE,
  LUFTBILD,
  themaFarbe,
} from "@/components/map/styles";
import type { DmkRegionMeta } from "@/server/services/dmk";
import regionsGeoJson from "./regions-geojson.json";
import { segmentClass } from "@/components/ui/Choice";

export interface ActivePlzMarkerInfo {
  plz: string;
  city: string;
  lat: number;
  lon: number;
  regionCode: string;
}

export interface RegionCentroidDef {
  code: string;
  name: string;
  shortLabel: string;
  category: "bundesland" | "naturraum";
  lat: number;
  lon: number;
  badgeText: string;
}

export const CORE_REGION_DEFS: RegionCentroidDef[] = [
  // 1. Schleswig-Holstein
  {
    code: "SH",
    name: "Schleswig-Holstein",
    shortLabel: "SH",
    category: "bundesland",
    lat: 54.2194,
    lon: 9.6961,
    badgeText: "Küste & Marsch",
  },
  // 2. Mecklenburg-Western Pomerania
  {
    code: "MV",
    name: "Mecklenburg-Vorpommern",
    shortLabel: "MV",
    category: "bundesland",
    lat: 53.6127,
    lon: 12.4296,
    badgeText: "Ostseeküste & Jungmoräne",
  },
  // 3. Lower Saxony
  {
    code: "NI",
    name: "Niedersachsen",
    shortLabel: "NI",
    category: "bundesland",
    lat: 52.6367,
    lon: 9.8451,
    badgeText: "Geest, Marsch & Börde",
  },
  // 4. North Rhine-Westphalia
  {
    code: "NRW",
    name: "Nordrhein-Westfalen",
    shortLabel: "NRW",
    category: "bundesland",
    lat: 51.4332,
    lon: 7.6616,
    badgeText: "Rheinland & Westfalen",
  },
  // 5. Hesse
  {
    code: "HE",
    name: "Hessen",
    shortLabel: "HE",
    category: "bundesland",
    lat: 50.6521,
    lon: 9.1624,
    badgeText: "Wetterau & Bergland",
  },
  // 6. Rhineland-Palatinate
  {
    code: "RP",
    name: "Rheinland-Pfalz",
    shortLabel: "RP",
    category: "bundesland",
    lat: 49.9137,
    lon: 7.4549,
    badgeText: "Rheintal & Pfalz",
  },
  // 7. Baden-Wuerttemberg
  {
    code: "BW",
    name: "Baden-Württemberg",
    shortLabel: "BW",
    category: "bundesland",
    lat: 48.6616,
    lon: 9.3501,
    badgeText: "Oberrhein & Gäu",
  },
  // 8. Bavaria
  {
    code: "BY",
    name: "Bayern",
    shortLabel: "BY",
    category: "bundesland",
    lat: 48.7904,
    lon: 11.4979,
    badgeText: "Donau, Gäuboden & Franken",
  },
  // 9. A21: Diluvial soils northern East Germany
  {
    code: "A21",
    name: "Diluviale Böden nördl. Ostdeutschland",
    shortLabel: "A21 Sande",
    category: "naturraum",
    lat: 53.20,
    lon: 13.00,
    badgeText: "Naturraum A21 · Sande Nord",
  },
  // 10. A20: Diluvial soils southern East Germany
  {
    code: "A20",
    name: "Diluviale Böden südl. Ostdeutschland",
    shortLabel: "A20 Diluvial",
    category: "naturraum",
    lat: 51.70,
    lon: 13.50,
    badgeText: "Naturraum A20 · Diluvial Süd",
  },
  // 11. A19: Loess locations East, Oderbruch
  {
    code: "A19",
    name: "Lößstandorte Ost, Oderbruch",
    shortLabel: "A19 Löß",
    category: "naturraum",
    lat: 51.50,
    lon: 12.80,
    badgeText: "Naturraum A19 · Löß & Börde",
  },
  // 12. A18: Transitional regions East
  {
    code: "A18",
    name: "Übergangslagen Ost",
    shortLabel: "A18 Übergang",
    category: "naturraum",
    lat: 50.85,
    lon: 12.20,
    badgeText: "Naturraum A18 · Übergangslagen",
  },
];

/** Segmented control (design system): rectangular segments side by side, active one in the selected role. */
const SEGMENT_GROUP = "inline-flex flex-wrap gap-1.5";


interface InteractiveGermanyMapProps {
  selectedRegion: string;
  onSelectRegion: (regionCode: string) => void;
  regionsMeta?: DmkRegionMeta[];
  activePlzMarker?: ActivePlzMarkerInfo | null;
  className?: string;
}

export function InteractiveGermanyMap({
  selectedRegion,
  onSelectRegion,
  regionsMeta = [],
  activePlzMarker = null,
  className = "",
}: InteractiveGermanyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const centroidMarkersRef = useRef<Marker[]>([]);
  const plzMarkerRef = useRef<Marker | null>(null);
  const selectedRegionRef = useRef<string>(selectedRegion);

  const [stil, setStil] = useState<"karte" | "luftbild">("luftbild");
  const [filterTab, setFilterTab] = useState<"alle" | "bundesland" | "naturraum">("alle");
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Synchronize ref safely in effect
  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  // Fast metadata index lookup
  const metaMap = useMemo(() => {
    const map = new Map<string, DmkRegionMeta>();
    for (const r of regionsMeta) {
      map.set(r.region_code.toUpperCase(), r);
    }
    return map;
  }, [regionsMeta]);

  const activeRegionDef = useMemo<RegionCentroidDef>(() => {
    const fromCore = CORE_REGION_DEFS.find(
      (r) => r.code.toUpperCase() === selectedRegion.toUpperCase(),
    );
    if (fromCore) return fromCore;

    const meta = metaMap.get(selectedRegion.toUpperCase());
    if (meta) {
      return {
        code: meta.region_code,
        name: meta.name,
        shortLabel: meta.region_code,
        category: meta.typ === "naturraum" ? "naturraum" : "bundesland",
        lat: meta.zentroid_lat || 51.1657,
        lon: meta.zentroid_lon || 10.4515,
        badgeText: meta.boden_klima_beschreibung || meta.name,
      };
    }

    return (
      CORE_REGION_DEFS.find((r) => r.code === "NI") ??
      CORE_REGION_DEFS[2]!
    );
  }, [selectedRegion, metaMap]);

  const hoveredDef = useMemo<RegionCentroidDef | null>(() => {
    if (!hoveredRegion) return null;
    const fromCore = CORE_REGION_DEFS.find(
      (r) => r.code.toUpperCase() === hoveredRegion.toUpperCase(),
    );
    if (fromCore) return fromCore;

    const meta = metaMap.get(hoveredRegion.toUpperCase());
    if (meta) {
      return {
        code: meta.region_code,
        name: meta.name,
        shortLabel: meta.region_code,
        category: meta.typ === "naturraum" ? "naturraum" : "bundesland",
        lat: meta.zentroid_lat || 51.1657,
        lon: meta.zentroid_lon || 10.4515,
        badgeText: meta.boden_klima_beschreibung || meta.name,
      };
    }

    return null;
  }, [hoveredRegion, metaMap]);

  const displayedPills = useMemo(() => {
    if (filterTab === "bundesland") return CORE_REGION_DEFS.filter((r) => r.category === "bundesland");
    if (filterTab === "naturraum") return CORE_REGION_DEFS.filter((r) => r.category === "naturraum");
    return CORE_REGION_DEFS;
  }, [filterTab]);

  // Register GeoJSON layers
  const setupLayers = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;

    if (!m.getSource("dmk-regions")) {
      m.addSource("dmk-regions", {
        type: "geojson",
        data: regionsGeoJson as unknown as GeoJSON.FeatureCollection,
      });
    }

    if (!m.getLayer("regions-fill")) {
      m.addLayer({
        id: "regions-fill",
        type: "fill",
        source: "dmk-regions",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "region_code"], selectedRegionRef.current],
            themaFarbe("leaf-500", "#4f9a5f"),
            ["==", ["get", "typ"], "naturraum"],
            themaFarbe("kernel-dark", "#7d5532"),
            themaFarbe("leaf-400", "#7dbe72"),
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "region_code"], selectedRegionRef.current],
            0.42,
            ["==", ["get", "typ"], "naturraum"],
            0.22,
            0.14,
          ],
        },
      });
    }

    if (!m.getLayer("regions-line")) {
      m.addLayer({
        id: "regions-line",
        type: "line",
        source: "dmk-regions",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "region_code"], selectedRegionRef.current],
            themaFarbe("leaf-900", "#17462f"),
            ["==", ["get", "typ"], "naturraum"],
            themaFarbe("kernel-dark", "#6b4a2b"),
            themaFarbe("leaf-700", "#2c7a52"),
          ],
          "line-width": [
            "case",
            ["==", ["get", "region_code"], selectedRegionRef.current],
            3.0,
            1.2,
          ],
          "line-opacity": 0.85,
        },
      });
    }
  }, []);

  // Initialize MapLibre map instance
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = await loadMaplibre();
        if (cancelled || !containerRef.current) return;

        const m = new maplibregl.Map({
          container: containerRef.current,
          style: stil === "luftbild" ? LUFTBILD : KARTE,
          center: activePlzMarker
            ? [activePlzMarker.lon, activePlzMarker.lat]
            : DEUTSCHLAND.center,
          zoom: activePlzMarker ? 8 : 5.4,
          minZoom: 4.2,
          maxZoom: 15,
          maxBounds: [
            [2.5, 46.5],
            [18.0, 56.5],
          ],
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });

        attachMapErrorShield(m);

        m.on("style.load", () => {
          setupLayers();
          setMapReady(true);
        });

        // Click handler for region polygon
        m.on("click", "regions-fill", (e) => {
          if (e.features && e.features[0]) {
            const code = e.features[0].properties?.region_code;
            if (code) {
              onSelectRegion(String(code));
            }
          }
        });

        // Mouse hover effects on map polygons
        m.on("mousemove", "regions-fill", (e) => {
          if (e.features && e.features[0]) {
            m.getCanvas().style.cursor = "pointer";
            const code = e.features[0].properties?.region_code;
            if (code) setHoveredRegion(String(code));
          }
        });

        m.on("mouseleave", "regions-fill", () => {
          m.getCanvas().style.cursor = "";
          setHoveredRegion(null);
        });

        // General click handler: select nearest centroid if clicked outside polygon
        m.on("click", (e) => {
          const bbox: [[number, number], [number, number]] = [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5],
          ];
          const features = m.queryRenderedFeatures(bbox, { layers: ["regions-fill"] });
          if (!features || features.length === 0) {
            // Locate closest centroid
            let closest: RegionCentroidDef | null = null;
            let minDist = Infinity;
            for (const r of CORE_REGION_DEFS) {
              const d = Math.hypot(r.lon - e.lngLat.lng, r.lat - e.lngLat.lat);
              if (d < minDist) {
                minDist = d;
                closest = r;
              }
            }
            if (closest && minDist < 2.0) {
              onSelectRegion(closest.code);
            }
          }
        });

        mapRef.current = m;
      } catch (err) {
        console.error("MapLibre initialization error:", err);
        setMapError("Kartenansicht konnte nicht initialisiert werden.");
      }
    })();

    return () => {
      cancelled = true;
      centroidMarkersRef.current.forEach((mk) => mk.remove());
      centroidMarkersRef.current = [];
      if (plzMarkerRef.current) {
        plzMarkerRef.current.remove();
        plzMarkerRef.current = null;
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Style switch (vector map vs satellite)
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    m.setStyle(stil === "luftbild" ? LUFTBILD : KARTE);
  }, [stil]);

  // Dynamically update polygon fill and outline on region change
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !m.isStyleLoaded() || !m.getLayer("regions-fill")) return;

    try {
      m.setPaintProperty("regions-fill", "fill-color", [
        "case",
        ["==", ["get", "region_code"], selectedRegion],
        themaFarbe("leaf-500", "#4f9a5f"),
        ["==", ["get", "typ"], "naturraum"],
        themaFarbe("kernel-dark", "#7d5532"),
        themaFarbe("leaf-400", "#7dbe72"),
      ]);

      m.setPaintProperty("regions-fill", "fill-opacity", [
        "case",
        ["==", ["get", "region_code"], selectedRegion],
        0.42,
        ["==", ["get", "typ"], "naturraum"],
        0.22,
        0.14,
      ]);

      m.setPaintProperty("regions-line", "line-color", [
        "case",
        ["==", ["get", "region_code"], selectedRegion],
        themaFarbe("leaf-900", "#17462f"),
        ["==", ["get", "typ"], "naturraum"],
        themaFarbe("kernel-dark", "#6b4a2b"),
        themaFarbe("leaf-700", "#2c7a52"),
      ]);

      m.setPaintProperty("regions-line", "line-width", [
        "case",
        ["==", ["get", "region_code"], selectedRegion],
        3.0,
        1.2,
      ]);
    } catch {
      // Style may still be loading
    }
  }, [selectedRegion, mapReady]);

  // Mount interactive centroid markers on map canvas
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !mapReady) return;

    let cancelled = false;

    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !mapRef.current) return;

      centroidMarkersRef.current.forEach((mk) => mk.remove());
      centroidMarkersRef.current = [];

      CORE_REGION_DEFS.forEach((reg) => {
        const isSelected = reg.code === selectedRegion;
        const isNaturraum = reg.category === "naturraum";

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `Region ${reg.name} (${reg.code})`);
        el.className = isSelected
          ? "z-20 cursor-pointer rounded-control bg-selected px-2.5 py-1 text-caption font-bold text-on-selected ring-2 ring-canvas transition-colors"
          : isNaturraum
            ? "cursor-pointer rounded-control bg-surface px-2 py-0.5 text-caption font-semibold text-fg-muted ring-1 ring-control transition-colors hover:bg-highlight hover:text-fg"
            : "cursor-pointer rounded-control bg-surface px-2 py-0.5 text-caption font-semibold text-fg ring-1 ring-control transition-colors hover:bg-action-subtle hover:text-link";

        const labelSpan = document.createElement("span");
        labelSpan.className = "tabular-nums";
        labelSpan.textContent = reg.shortLabel;
        el.appendChild(labelSpan);
        el.onclick = (e) => {
          e.stopPropagation();
          onSelectRegion(reg.code);
        };

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([reg.lon, reg.lat])
          .addTo(mapRef.current!);

        centroidMarkersRef.current.push(marker);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedRegion, mapReady, onSelectRegion]);

  // Set animated postal code marker and fly-to center camera
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;

    if (!activePlzMarker) {
      if (plzMarkerRef.current) {
        plzMarkerRef.current.remove();
        plzMarkerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !mapRef.current) return;

      if (plzMarkerRef.current) {
        plzMarkerRef.current.remove();
        plzMarkerRef.current = null;
      }

      // Animated DOM marker with ping wave and municipality label (XSS-safe via textContent)
      const el = document.createElement("div");
      el.className = "group flex flex-col items-center pointer-events-none select-none z-30";

      const badge = document.createElement("div");
      badge.className =
        "relative flex items-center gap-1.5 rounded-control bg-selected px-2.5 py-1 text-caption font-bold text-on-selected shadow-lift ring-2 ring-canvas";

      const ping = document.createElement("span");
      ping.className = "size-1.5 rounded-full bg-on-selected";
      badge.appendChild(ping);

      const label = document.createElement("span");
      label.className = "tabular-nums";
      label.textContent = `📍 ${activePlzMarker.plz} ${activePlzMarker.city || ""}`.trimEnd();
      badge.appendChild(label);

      const pointer = document.createElement("div");
      pointer.className = "size-2 -mt-1 rotate-45 bg-selected";

      const wave = document.createElement("div");
      wave.className =
        "mt-0.5 size-3 rounded-full border-2 border-canvas bg-selected";

      el.appendChild(badge);
      el.appendChild(pointer);
      el.appendChild(wave);

      const mk = new maplibregl.Marker({ element: el })
        .setLngLat([activePlzMarker.lon, activePlzMarker.lat])
        .addTo(mapRef.current);

      plzMarkerRef.current = mk;

      // Smooth camera fly-to animation to farmer's location
      mapRef.current.flyTo({
        center: [activePlzMarker.lon, activePlzMarker.lat],
        zoom: 8.5,
        duration: 1200,
        essential: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [activePlzMarker]);

  const resetZoom = () => {
    mapRef.current?.flyTo({
      center: DEUTSCHLAND.center,
      zoom: 5.4,
      duration: 800,
    });
  };

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map header with style toggle controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-small font-semibold text-fg">
          Regionale Sortenversuche (Demo-Datensatz)
        </span>

        {/* Map controls toolbar */}
        <div className="flex items-center gap-2">
          {/* Basemap / aerial toggle (segmented control) */}
          <div className={SEGMENT_GROUP}>
            <button
              type="button"
              onClick={() => setStil("karte")}
              aria-pressed={stil === "karte"}
              className={segmentClass(stil === "karte")}
            >
              Karte
            </button>
            <button
              type="button"
              onClick={() => setStil("luftbild")}
              aria-pressed={stil === "luftbild"}
              className={segmentClass(stil === "luftbild")}
            >
              Satellit
            </button>
          </div>

          {/* Reset camera view to entire country */}
          <button
            type="button"
            onClick={resetZoom}
            title="Ganz Deutschland anzeigen"
            className="inline-flex h-control-sm items-center gap-1.5 rounded-control px-3 text-small font-semibold text-link transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Ganz Deutschland</span>
          </button>
        </div>
      </div>

      {/* Main map container (MapLibre GL) */}
      <div className="relative overflow-hidden rounded-panel border border-control bg-highlight">
        <div
          ref={containerRef}
          className="h-[400px] sm:h-[480px] w-full"
          aria-label="Interaktive MapLibre Deutschlandkarte - Regionale Sortenversuche (Demo-Datensatz)"
        />

        {/* Fallback message for WebGL issues */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas p-4 text-center">
            <div className="max-w-md text-small text-fg">
              <div className="font-bold">Interaktive Kartenansicht geladen</div>
              <p className="mt-1 text-caption text-fg-muted">
                Wähle deine Versuchsregion über die Buttons unter der Karte aus.
              </p>
            </div>
          </div>
        )}

        {/* Zoom controls top-right */}
        <div className="absolute right-3 top-3 z-10 flex flex-col divide-y divide-divider overflow-hidden rounded-panel border border-control bg-surface shadow-lift">
          <button
            type="button"
            onClick={zoomIn}
            className="flex size-9 items-center justify-center text-fg transition-colors hover:bg-action-subtle hover:text-link"
            title="Vergrößern"
            aria-label="Vergrößern"
          >
            <ZoomIn className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="flex size-9 items-center justify-center text-fg transition-colors hover:bg-action-subtle hover:text-link"
            title="Verkleinern"
            aria-label="Verkleinern"
          >
            <ZoomOut className="size-4" aria-hidden />
          </button>
        </div>

        {/* Live status label anchored bottom-left above map */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
          <div className="rounded-panel border border-control bg-surface px-3 py-1.5 text-caption shadow-lift">
            <span className="font-semibold text-fg">{activeRegionDef.name}</span>
            <span className="mx-1.5 text-fg-muted">·</span>
            <span className="font-bold tabular-nums text-link">{activeRegionDef.code}</span>
            {activePlzMarker && (
              <>
                <span className="mx-1.5 text-fg-muted">·</span>
                <span className="tabular-nums text-fg-muted">PLZ {activePlzMarker.plz}</span>
              </>
            )}
          </div>
          {hoveredDef && hoveredDef.code !== activeRegionDef.code && (
            <div className="hidden sm:block rounded-panel bg-selected px-3 py-1.5 text-caption text-on-selected shadow-lift">
              <span>{hoveredDef.name} ({hoveredDef.shortLabel})</span>
            </div>
          )}
        </div>
      </div>

      {/* Segmented filter for the region list */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className={SEGMENT_GROUP}>
          <button
            type="button"
            onClick={() => setFilterTab("alle")}
            aria-pressed={filterTab === "alle"}
            className={segmentClass(filterTab === "alle")}
          >
            Alle 12 Regionen
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("bundesland")}
            aria-pressed={filterTab === "bundesland"}
            className={segmentClass(filterTab === "bundesland")}
          >
            Bundesländer
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("naturraum")}
            aria-pressed={filterTab === "naturraum"}
            className={segmentClass(filterTab === "naturraum")}
          >
            Naturräume Ost (A18–A21)
          </button>
        </div>

        <span className="text-caption text-fg-muted">
          {metaMap.get(activeRegionDef.code)?.boden_klima_beschreibung
            ? `Region: ${metaMap.get(activeRegionDef.code)?.boden_klima_beschreibung}`
            : "💡 Klick auf Karte oder Button wählt Region direkt aus"}
        </span>
      </div>

      {/* Region list: selectable rows, the active one set in the selected role */}
      <div className="grid grid-cols-2 gap-x-2 border-t border-divider pt-2 sm:grid-cols-3 xl:grid-cols-4">
        {displayedPills.map((reg) => {
          const isSelected = selectedRegion === reg.code;
          const isNaturraum = reg.category === "naturraum";
          return (
            <button
              key={reg.code}
              type="button"
              onClick={() => onSelectRegion(reg.code)}
              aria-pressed={isSelected}
              className={`flex min-h-touch items-center gap-1.5 rounded-control px-2.5 text-left text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                isSelected
                  ? "bg-selected text-on-selected"
                  : isNaturraum
                    ? "text-fg hover:bg-highlight"
                    : "text-link hover:bg-action-subtle"
              }`}
            >
              <span className="font-bold tabular-nums">{reg.shortLabel}</span>
              <span className={`hidden truncate sm:inline ${isSelected ? "" : "text-fg-muted"}`}>· {reg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Cartographic source attribution */}
      <p className="text-caption text-fg-muted">
        Kartendaten: © OpenStreetMap-Mitwirkende (ODbL) · Kartenstil: OpenFreeMap
      </p>
    </div>
  );
}
