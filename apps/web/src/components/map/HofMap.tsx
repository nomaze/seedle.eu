"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Polygon } from "@seedle/core";
import { centroid } from "@seedle/core/geo";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { num } from "@/lib/format";
import { loadMaplibre } from "./loadMaplibre";
import {
  attachMapErrorShield,
  DEUTSCHLAND,
  FIBOA_PMTILES_URL,
  LUFTBILD,
} from "./styles";

export interface HofMapField {
  id: string;
  name: string;
  status?: "status-ok" | "status-action" | "status-problem" | "status-urgent";
  areaHa: number;
  geometry: Polygon;
  crop?: string | null;
  usage?: string | null;
  selectedVarietyId?: string | null;
}

export interface HofMapFarm {
  id?: string;
  name: string;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface HofMapProps {
  farm: HofMapFarm;
  fields: HofMapField[];
  className?: string;
  onSelectField?: (fieldId: string) => void;
}

/**
 * Computes the exact bounding box `[minLon, minLat, maxLon, maxLat]` across all field polygon vertices.
 */
export function computeFieldsBoundingBox(
  fields: HofMapField[],
): [number, number, number, number] | null {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let count = 0;

  for (const f of fields) {
    const rings = f.geometry?.coordinates;
    if (!Array.isArray(rings)) continue;
    for (const ring of rings) {
      if (!Array.isArray(ring)) continue;
      for (const pt of ring) {
        const lon = Number(pt?.[0]);
        const lat = Number(pt?.[1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        count++;
      }
    }
  }

  if (count === 0) return null;
  return [minLon, minLat, maxLon, maxLat];
}

export function HofMap({ farm, fields, className = "", onSelectField }: HofMapProps) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);
  const onSelectFieldRef = useRef(onSelectField);
  useEffect(() => {
    onSelectFieldRef.current = onSelectField;
  }, [onSelectField]);

  const [mapReady, setMapReady] = useState(false);

  // Single canonical GeoJSON parcel data collection for the 7 disjoint DEBYLI farm fields
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: fields.map((f) => ({
        type: "Feature" as const,
        id: f.id,
        properties: {
          id: f.id,
          name: f.name,
          status: f.status ?? "status-ok",
          areaHa: f.areaHa,
          crop: f.crop ?? "Mais",
          usage: f.usage ?? "",
        },
        geometry: f.geometry,
      })),
    }),
    [fields],
  );

  const geojsonRef = useRef(geojson);
  useEffect(() => {
    geojsonRef.current = geojson;
  }, [geojson]);

  // Initialize MapLibre map instance
  useEffect(() => {
    let cancelled = false;
    let currentMap: MlMap | null = null;

    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !container.current) return;

      const bbox = computeFieldsBoundingBox(fieldsRef.current);
      // 0.125 expansion on each side of 1.0 span = 0.125 / 1.25 = exact 10% margin on left, right, top, and bottom
      const initialBounds: [[number, number], [number, number]] | undefined = bbox
        ? (() => {
            const [minLon, minLat, maxLon, maxLat] = bbox;
            const lonSpan = Math.max(0.002, maxLon - minLon);
            const latSpan = Math.max(0.002, maxLat - minLat);
            return [
              [minLon - lonSpan * 0.125, minLat - latSpan * 0.125],
              [maxLon + lonSpan * 0.125, maxLat + latSpan * 0.125],
            ];
          })()
        : undefined;

      const defaultCenter: [number, number] = bbox
        ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
        : farm.lon != null && farm.lat != null
          ? [farm.lon, farm.lat]
          : DEUTSCHLAND.center;

      const m = new maplibregl.Map({
        container: container.current,
        style: LUFTBILD,
        center: defaultCenter,
        zoom: bbox ? 14.1 : DEUTSCHLAND.zoom,
        ...(initialBounds
          ? { bounds: initialBounds, fitBoundsOptions: { padding: 0 } }
          : {}),
        canvasContextAttributes: { preserveDrawingBuffer: true },
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });

      currentMap = m;
      map.current = m;
      attachMapErrorShield(m);
      try {
        m.getCanvas()?.setAttribute("tabindex", "-1");
      } catch {
        // Ignore in headless test mocks
      }

      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const fitToExactTenPercentMargin = () => {
        const currentBbox = computeFieldsBoundingBox(fieldsRef.current);
        if (!currentBbox || !container.current) return;
        const [minLon, minLat, maxLon, maxLat] = currentBbox;
        const w = container.current.clientWidth || 800;
        const h = container.current.clientHeight || 520;
        const padX = Math.max(24, Math.round(w * 0.1));
        const padY = Math.max(24, Math.round(h * 0.1));

        try {
          m.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            {
              padding: { left: padX, right: padX, top: padY, bottom: padY },
              duration: 0,
              maxZoom: 16.5,
            },
          );
        } catch {
          // Fallback for mock map instances in unit tests that only accept numeric padding
          m.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            { padding: padX, duration: 0, maxZoom: 16.5 },
          );
        }
      };

      let initialLoaded = false;

      m.on("style.load", () => {
        if (cancelled) return;

        // 1. Subtle background fiboa cadastral grid (no selected-fill overlay so zero double-drawing occurs)
        if (!m.getSource("fiboa-fields")) {
          m.addSource("fiboa-fields", {
            type: "vector",
            url: FIBOA_PMTILES_URL,
          });
          m.addLayer({
            id: "fiboa-fields-outline",
            type: "line",
            source: "fiboa-fields",
            "source-layer": "fields",
            minzoom: 11,
            paint: {
              "line-color": "#d6b388",
              "line-width": 1.0,
              "line-opacity": 0.22,
            },
          });
        }

        // 2. Single canonical GeoJSON source for the 7 disjoint farm fields with high-contrast white halo
        if (!m.getSource("hof-schlaege")) {
          m.addSource("hof-schlaege", {
            type: "geojson",
            data: geojsonRef.current,
          });

          // Vibrant, high-contrast status fill colors on dark satellite imagery
          m.addLayer({
            id: "hof-schlaege-fill",
            type: "fill",
            source: "hof-schlaege",
            paint: {
              "fill-color": [
                "match",
                ["get", "status"],
                "status-action",
                "#f59e0b",
                "status-problem",
                "#f97316",
                "status-urgent",
                "#ef4444",
                "#10b981",
              ],
              "fill-opacity": 0.54,
            },
          });

          // White outer contrast halo so every field stands out razor-sharply against dark aerial imagery
          m.addLayer({
            id: "hof-schlaege-halo",
            type: "line",
            source: "hof-schlaege",
            paint: {
              "line-color": "#ffffff",
              "line-width": 6.5,
              "line-opacity": 0.92,
            },
          });

          // Crisp inner status outline inside the white halo
          m.addLayer({
            id: "hof-schlaege-line",
            type: "line",
            source: "hof-schlaege",
            paint: {
              "line-color": [
                "match",
                ["get", "status"],
                "status-action",
                "#b45309",
                "status-problem",
                "#c2410c",
                "status-urgent",
                "#b91c1c",
                "#047857",
              ],
              "line-width": 3.2,
            },
          });
        }

        if (!initialLoaded) {
          initialLoaded = true;

          // Clear any existing markers before placing field badges
          for (const mk of markers.current) mk.remove();
          markers.current = [];

          // Place a compact, high-contrast label badge ("Name · XX,X ha") at the center of each disjoint field
          for (const f of fieldsRef.current) {
            const c = centroid(f.geometry);
            if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;

            const badgeEl = document.createElement("button");
            badgeEl.type = "button";
            badgeEl.className =
              "hof-schlag-badge cursor-pointer rounded-control border border-white/85 bg-[#142018]/92 px-2 py-0.5 text-[11px] font-bold text-white shadow-lift whitespace-nowrap transition-transform hover:scale-105";
            badgeEl.textContent = `${f.name} · ${num(f.areaHa)} ha`;
            badgeEl.addEventListener("click", (ev) => {
              ev.stopPropagation();
              if (onSelectFieldRef.current) {
                onSelectFieldRef.current(f.id);
              } else {
                router.push(`/feld/${f.id}`);
              }
            });

            const fieldMarker = new maplibregl.Marker({
              element: badgeEl,
              anchor: "center",
            })
              .setLngLat([c.lon, c.lat])
              .addTo(m);
            markers.current.push(fieldMarker);
          }

          fitToExactTenPercentMargin();
          setMapReady(true);
        }
      });

      m.on("resize", fitToExactTenPercentMargin);

      // Cursor pointer on field hover
      m.on("mouseenter", "hof-schlaege-fill", () => {
        m.getCanvas().style.cursor = "pointer";
      });

      m.on("mouseleave", "hof-schlaege-fill", () => {
        m.getCanvas().style.cursor = "";
      });

      // Field parcel click handler: navigate to field details or trigger selection callback
      m.on("click", "hof-schlaege-fill", (e) => {
        if (!e.features || !e.features[0]) return;
        const fieldId = e.features[0].properties?.id;
        if (fieldId) {
          if (onSelectFieldRef.current) {
            onSelectFieldRef.current(fieldId);
          } else {
            router.push(`/feld/${fieldId}`);
          }
        }
      });
    })();

    return () => {
      cancelled = true;
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      currentMap?.remove();
      map.current = null;
    };
  }, [farm.lat, farm.lon, farm.name, router]);

  // Update field layer on data modifications
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const src = map.current.getSource("hof-schlaege") as GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson);
    }
  }, [geojson, mapReady]);

  return (
    <div className="space-y-2.5">
      <div
        ref={container}
        data-testid="hof-map-container"
        data-spross-target="hof-map"
        className={`relative w-full overflow-hidden rounded-card border border-control bg-data-track ${
          className || "h-[360px] sm:h-[440px]"
        }`}
      />

      {/* Compact map legend below the frame */}
      <div
        aria-label="Karten-Legende"
        className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-caption text-fg-muted"
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-xs border-2 border-white bg-[#10b981] shadow-xs"
          />
          <span>Alles im Plan</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-xs border-2 border-white bg-[#f59e0b] shadow-xs"
          />
          <span>Aktion nötig</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-xs border-2 border-white bg-[#f97316] shadow-xs"
          />
          <span>Sortenwahl offen</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-xs border-2 border-white bg-[#ef4444] shadow-xs"
          />
          <span>Dringend</span>
        </span>
      </div>
    </div>
  );
}
