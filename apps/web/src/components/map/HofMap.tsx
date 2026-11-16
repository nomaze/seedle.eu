"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Polygon } from "@seedle/core";
import { areaHa, centroid, distanceKm } from "@seedle/core/geo";
import { Home } from "lucide-react";
import type { FilterSpecification, GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusShape } from "@/components/ui/StatusMarker";
import { REAL_FREISING_FIBOA_CLUSTER_IDS } from "@/server/db/real-freising-fiboa-fields";
import {
  buildFiboaIdFilterExpression,
  extractFiboaFeatureId,
  stitchPolygonRingsList,
} from "./FieldPicker";
import { loadMaplibre } from "./loadMaplibre";
import {
  attachMapErrorShield,
  DEUTSCHLAND,
  FIBOA_PMTILES_URL,
  LUFTBILD,
  themaFarbe,
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

interface FiboaCandidateParcel {
  fiboaId: string;
  rings: [number, number][][];
  polygon: Polygon;
  center: { lat: number; lon: number };
  areaHa: number;
}

function minBoundaryDistanceDeg(polyA: Polygon, polyB: Polygon): number {
  const ringA = polyA.coordinates[0] ?? [];
  const ringB = polyB.coordinates[0] ?? [];
  let minD = Infinity;
  for (let i = 0; i < ringA.length; i++) {
    const a = ringA[i]!;
    for (let j = 0; j < ringB.length; j++) {
      const b = ringB[j]!;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d < minD) minD = d;
    }
  }
  return minD;
}

/**
 * Queries the loaded `fiboa-fields` vector tiles in `HofMap` and builds contiguous,
 * non-overlapping field blocks by merging adjacent sub-parcels around each farm field's anchor point.
 * Eliminates small-parcel patchwork ("Flickenteppich") and snaps every farm field 100% flush
 * to the official `fiboa` satellite field edges.
 */
function resolveContiguousFiboaClustersForFarm(
  m: MlMap,
  fields: HofMapField[],
): {
  selectedFiboaIds: string[];
  fiboaIdToFieldId: Map<string, string>;
  snappedFeatures: Array<{
    type: "Feature";
    id: string;
    properties: {
      id: string;
      name: string;
      status: string;
      areaHa: number;
      crop: string;
      usage: string;
    };
    geometry: Polygon;
  }>;
} | null {
  const rawFeatures: Array<{
    id?: string | number;
    properties?: Record<string, unknown>;
    geometry?: { type?: string; coordinates?: unknown };
  }> = [];

  try {
    if (m.getLayer?.("fiboa-fields-fill")) {
      const rendered = m.queryRenderedFeatures?.(undefined, {
        layers: ["fiboa-fields-fill"],
      });
      if (Array.isArray(rendered)) rawFeatures.push(...rendered);
    }
  } catch {
    // Ignore in headless test mocks
  }

  try {
    const sourceFeats = m.querySourceFeatures?.("fiboa-fields", {
      sourceLayer: "fields",
    });
    if (Array.isArray(sourceFeats)) rawFeatures.push(...sourceFeats);
  } catch {
    // Ignore in headless test mocks
  }

  if (rawFeatures.length === 0) return null;

  // Group outer rings by fiboa feature ID so MVT tile-split fragments of the same parcel are unified first
  const ringsByFiboaId = new Map<string, [number, number][][]>();
  for (const feat of rawFeatures) {
    if (!feat?.geometry) continue;
    const fid = extractFiboaFeatureId(feat);
    if (!fid) continue;
    const geom = feat.geometry;
    const list = ringsByFiboaId.get(fid) ?? [];
    if (geom.type === "Polygon" && Array.isArray(geom.coordinates) && geom.coordinates[0]) {
      list.push(geom.coordinates[0] as [number, number][]);
    } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      for (const polyCoords of geom.coordinates as unknown[][]) {
        if (Array.isArray(polyCoords) && polyCoords[0]) {
          list.push(polyCoords[0] as [number, number][]);
        }
      }
    }
    if (list.length > 0) {
      ringsByFiboaId.set(fid, list);
    }
  }

  const candidates: FiboaCandidateParcel[] = [];
  for (const [fiboaId, rings] of ringsByFiboaId.entries()) {
    const stitched = stitchPolygonRingsList(rings);
    if (!stitched) continue;
    const ha = areaHa(stitched);
    if (!Number.isFinite(ha) || ha < 0.25 || ha > 65) continue;
    candidates.push({
      fiboaId,
      rings,
      polygon: stitched,
      center: centroid(stitched),
      areaHa: ha,
    });
  }

  if (candidates.length === 0) return null;

  const usedFiboaIds = new Set<string>();
  const selectedFiboaIds: string[] = [];
  const fiboaIdToFieldId = new Map<string, string>();
  const snappedFeatures: Array<{
    type: "Feature";
    id: string;
    properties: {
      id: string;
      name: string;
      status: string;
      areaHa: number;
      crop: string;
      usage: string;
    };
    geometry: Polygon;
  }> = [];

  for (const f of fields) {
    const targetCenter = centroid(f.geometry);
    const targetHa = Math.max(8, f.areaHa || 14);

    // 1. Pick the unused fiboa parcel closest to this farm field's anchor point (preferring parcels >= 1.5 ha)
    const available = candidates.filter((c) => !usedFiboaIds.has(c.fiboaId));
    if (available.length === 0) {
      snappedFeatures.push({
        type: "Feature",
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
      });
      continue;
    }

    available.sort((a, b) => {
      const dA = distanceKm(targetCenter, a.center) - (a.areaHa >= 2.0 ? 0.08 : 0);
      const dB = distanceKm(targetCenter, b.center) - (b.areaHa >= 2.0 ? 0.08 : 0);
      return dA - dB;
    });

    const seed = available[0]!;
    const cluster: FiboaCandidateParcel[] = [seed];
    usedFiboaIds.add(seed.fiboaId);
    selectedFiboaIds.push(seed.fiboaId);
    fiboaIdToFieldId.set(seed.fiboaId, f.id);
    let clusterHa = seed.areaHa;

    // 2. Contiguous Cluster-Merge: greedily merge directly adjacent sub-parcels (sharing an edge / < ~30m gap)
    // until the block reaches a realistic contiguous block size (~targetHa), preventing any patchwork!
    for (let step = 0; step < 6 && clusterHa < targetHa * 0.88; step++) {
      let bestNeighbor: FiboaCandidateParcel | null = null;
      let bestScore = Infinity;

      for (const cand of candidates) {
        if (usedFiboaIds.has(cand.fiboaId)) continue;
        if (clusterHa + cand.areaHa > targetHa * 1.45 && cluster.length >= 2) continue;

        // Minimum vertex-to-vertex boundary distance to any parcel already in the cluster
        let minEdgeGapDeg = Infinity;
        for (const member of cluster) {
          const gap = minBoundaryDistanceDeg(member.polygon, cand.polygon);
          if (gap < minEdgeGapDeg) minEdgeGapDeg = gap;
        }

        // Only merge parcels that directly adjoin the block (gap <= 0.00032 deg ≈ 28 m across a field track)
        if (minEdgeGapDeg <= 0.00032) {
          const distToSeedKm = distanceKm(seed.center, cand.center);
          const score = minEdgeGapDeg * 1000 + distToSeedKm * 0.4;
          if (score < bestScore) {
            bestScore = score;
            bestNeighbor = cand;
          }
        }
      }

      if (!bestNeighbor) break;
      cluster.push(bestNeighbor);
      usedFiboaIds.add(bestNeighbor.fiboaId);
      selectedFiboaIds.push(bestNeighbor.fiboaId);
      fiboaIdToFieldId.set(bestNeighbor.fiboaId, f.id);
      clusterHa += bestNeighbor.areaHa;
    }

    const allClusterRings = cluster.flatMap((c) => c.rings);
    const mergedGeometry = stitchPolygonRingsList(allClusterRings) ?? seed.polygon;

    snappedFeatures.push({
      type: "Feature",
      id: f.id,
      properties: {
        id: f.id,
        name: f.name,
        status: f.status ?? "status-ok",
        areaHa: f.areaHa,
        crop: f.crop ?? "Mais",
        usage: f.usage ?? "",
      },
      geometry: mergedGeometry,
    });
  }

  return {
    selectedFiboaIds,
    fiboaIdToFieldId,
    snappedFeatures,
  };
}

export function HofMap({ farm, fields, className = "", onSelectField }: HofMapProps) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const fiboaIdToFieldIdRef = useRef<Map<string, string>>(new Map());
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);
  const onSelectFieldRef = useRef(onSelectField);
  useEffect(() => {
    onSelectFieldRef.current = onSelectField;
  }, [onSelectField]);

  const [mapReady, setMapReady] = useState(false);

  // GeoJSON parcel data collection
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

      // Collect all coordinate points for fitBounds: farm center and field boundaries
      const points: [number, number][] = [];
      if (farm.lat != null && farm.lon != null) {
        points.push([farm.lon, farm.lat]);
      }
      for (const feat of geojsonRef.current.features) {
        if (feat.geometry?.coordinates) {
          for (const ring of feat.geometry.coordinates) {
            for (const pt of ring) {
              points.push([pt[0], pt[1]]);
            }
          }
        }
      }

      const defaultCenter: [number, number] =
        farm.lon != null && farm.lat != null ? [farm.lon, farm.lat] : DEUTSCHLAND.center;

      const m = new maplibregl.Map({
        container: container.current,
        style: LUFTBILD,
        center: defaultCenter,
        zoom: points.length > 0 ? 14 : DEUTSCHLAND.zoom,
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

      let initialLoaded = false;

      m.on("style.load", () => {
        if (cancelled) return;

        // 1. Official fiboa PMTiles Vector Field Layer (subtle cadastral outlines + strong highlight on selected farm blocks)
        if (!m.getSource("fiboa-fields")) {
          m.addSource("fiboa-fields", {
            type: "vector",
            url: FIBOA_PMTILES_URL,
          });
          m.addLayer({
            id: "fiboa-fields-fill",
            type: "fill",
            source: "fiboa-fields",
            "source-layer": "fields",
            minzoom: 11,
            paint: {
              "fill-color": "#ffffff",
              "fill-opacity": 0.04,
            },
          });
          m.addLayer({
            id: "fiboa-fields-outline",
            type: "line",
            source: "fiboa-fields",
            "source-layer": "fields",
            minzoom: 11,
            paint: {
              "line-color": "#c9945f",
              "line-width": 1.2,
              "line-opacity": 0.65,
            },
          });
          m.addLayer({
            id: "fiboa-fields-selected-fill",
            type: "fill",
            source: "fiboa-fields",
            "source-layer": "fields",
            minzoom: 11,
            filter: ["==", ["get", "id"], "__NONE__"] as unknown as FilterSpecification,
            paint: {
              "fill-color": "#2c7a52",
              "fill-opacity": 0.22,
            },
          });
          m.addLayer({
            id: "fiboa-fields-selected-outline",
            type: "line",
            source: "fiboa-fields",
            "source-layer": "fields",
            minzoom: 11,
            filter: ["==", ["get", "id"], "__NONE__"] as unknown as FilterSpecification,
            paint: {
              "line-color": "#ffffff",
              "line-width": 2.2,
              "line-opacity": 0.9,
            },
          });
          // Immediately apply the known official DEBYLI fiboa cluster IDs on frame 1
          const initialFiboaIds: string[] = [];
          const initialMap = new Map<string, string>();
          for (const f of fieldsRef.current) {
            const clusterIds = REAL_FREISING_FIBOA_CLUSTER_IDS[f.id] ?? [];
            for (const fid of clusterIds) {
              initialFiboaIds.push(fid);
              initialMap.set(fid, f.id);
            }
          }
          if (initialFiboaIds.length > 0) {
            fiboaIdToFieldIdRef.current = initialMap;
            const initFilter = buildFiboaIdFilterExpression(initialFiboaIds);
            try {
              m.setFilter("fiboa-fields-selected-fill", initFilter);
              m.setFilter("fiboa-fields-selected-outline", initFilter);
            } catch {
              // Ignore in headless test mocks
            }
          }
        }

        // 2. Create parcel GeoJSON source (re-attached after basemap style switches)
        if (!m.getSource("hof-schlaege")) {
          m.addSource("hof-schlaege", {
            type: "geojson",
            data: geojsonRef.current,
          });

          const cOk = themaFarbe("status-ok", "#15803d");
          const cAction = themaFarbe("status-action", "#1d4ed8");
          const cProblem = themaFarbe("status-problem", "#b45309");
          const cUrgent = themaFarbe("status-urgent", "#b91c1c");

          const borderOk = themaFarbe("status-ok-border", "#14532d");
          const borderAction = themaFarbe("status-action-border", "#1e40af");
          const borderProblem = themaFarbe("status-problem-border", "#78350f");
          const borderUrgent = themaFarbe("status-urgent-border", "#7f1d1d");

          // Parcel fill paint by field status
          m.addLayer({
            id: "hof-schlaege-fill",
            type: "fill",
            source: "hof-schlaege",
            paint: {
              "fill-color": [
                "match",
                ["get", "status"],
                "status-action",
                cAction,
                "status-problem",
                cProblem,
                "status-urgent",
                cUrgent,
                cOk,
              ],
              "fill-opacity": 0.45,
            },
          });

          // Parcel boundary outline in status color
          m.addLayer({
            id: "hof-schlaege-line",
            type: "line",
            source: "hof-schlaege",
            paint: {
              "line-color": [
                "match",
                ["get", "status"],
                "status-action",
                borderAction,
                "status-problem",
                borderProblem,
                "status-urgent",
                borderUrgent,
                borderOk,
              ],
              "line-width": 3,
            },
          });
        }

        if (!initialLoaded) {
          initialLoaded = true;

          // Farm center marker pin
          if (farm.lat != null && farm.lon != null) {
            const el = document.createElement("div");
            el.className = "hofstelle-marker group cursor-pointer flex flex-col items-center";

            const iconWrapper = document.createElement("div");
            iconWrapper.className =
              "relative flex items-center justify-center size-9 rounded-full bg-white text-leaf-800 shadow-lift ring-2 ring-leaf-800 hover:scale-110 transition-transform";

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("class", "size-5");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("stroke-width", "2");
            svg.setAttribute("stroke-linecap", "round");
            svg.setAttribute("stroke-linejoin", "round");

            const pathDoor = document.createElementNS(svgNS, "path");
            pathDoor.setAttribute("d", "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8");
            const pathHouse = document.createElementNS(svgNS, "path");
            pathHouse.setAttribute(
              "d",
              "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
            );
            svg.appendChild(pathDoor);
            svg.appendChild(pathHouse);

            const pingContainer = document.createElement("span");
            pingContainer.className = "absolute -top-1 -right-1 flex size-3";

            const pingWave = document.createElement("span");
            pingWave.className =
              "animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf-400 opacity-75";
            const pingDot = document.createElement("span");
            pingDot.className = "relative inline-flex rounded-full size-3 bg-leaf-600";

            pingContainer.appendChild(pingWave);
            pingContainer.appendChild(pingDot);

            iconWrapper.appendChild(svg);
            iconWrapper.appendChild(pingContainer);

            const labelEl = document.createElement("div");
            labelEl.className =
              "mt-1 rounded-full bg-leaf-900/90 text-white px-2.5 py-0.5 text-xs font-semibold shadow whitespace-nowrap";
            labelEl.textContent = farm.name || "Hofstelle";

            el.appendChild(iconWrapper);
            el.appendChild(labelEl);

            const farmMarker = new maplibregl.Marker({ element: el })
              .setLngLat([farm.lon, farm.lat])
              .addTo(m);
            markers.current.push(farmMarker);
          }

          // Compute bounding box and fit camera to show farmyard and all fields
          if (points.length > 0) {
            const lons = points.map((p) => p[0]);
            const lats = points.map((p) => p[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            const padLon = Math.max((maxLon - minLon) * 0.14, 0.0022);
            const padLat = Math.max((maxLat - minLat) * 0.14, 0.0022);

            m.fitBounds(
              [
                [minLon - padLon, minLat - padLat],
                [maxLon + padLon, maxLat + padLat],
              ],
              { padding: 40, duration: 0, maxZoom: 15.2 },
            );
          }

          setMapReady(true);
        }
      });

      const applyLiveFiboaClusters = () => {
        if (cancelled) return;
        const resolved = resolveContiguousFiboaClustersForFarm(m, fieldsRef.current);
        if (!resolved || resolved.selectedFiboaIds.length === 0) return;

        fiboaIdToFieldIdRef.current = resolved.fiboaIdToFieldId;
        const filterExpr = buildFiboaIdFilterExpression(resolved.selectedFiboaIds);
        try {
          if (m.getLayer("fiboa-fields-selected-fill")) {
            m.setFilter("fiboa-fields-selected-fill", filterExpr);
          }
          if (m.getLayer("fiboa-fields-selected-outline")) {
            m.setFilter("fiboa-fields-selected-outline", filterExpr);
          }
        } catch {
          // Ignore in headless test mocks
        }

        const src = m.getSource("hof-schlaege") as GeoJSONSource | undefined;
        src?.setData({
          type: "FeatureCollection",
          features: resolved.snappedFeatures,
        });
      };

      m.on("idle", applyLiveFiboaClusters);

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

      m.on("click", "fiboa-fields-selected-fill", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const fid = extractFiboaFeatureId(
          feat as unknown as { id?: string | number; properties?: Record<string, unknown> },
        );
        const mappedFieldId = fid ? fiboaIdToFieldIdRef.current.get(fid) : undefined;
        if (mappedFieldId) {
          if (onSelectFieldRef.current) {
            onSelectFieldRef.current(mappedFieldId);
          } else {
            router.push(`/feld/${mappedFieldId}`);
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
    <div className={`relative overflow-hidden rounded-panel border border-control bg-data-track ${className}`}>
      <div ref={container} className="h-full min-h-[360px] w-full" />

      {/* Map legend anchored bottom-right: status as shape plus word (Feldfarben) */}
      <div className="absolute bottom-3 right-3 z-10 rounded-panel border border-control bg-surface px-3 py-2 text-caption">
        <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-fg">
          <Home className="size-3.5 text-link" aria-hidden />
          <span>Hof & Schläge</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-fg">
          <div className="flex items-center gap-1.5">
            <StatusShape status="status-ok" size={10} />
            <span>Alles im Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusShape status="status-action" size={10} />
            <span>Aktion nötig</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusShape status="status-problem" size={10} />
            <span>Problem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusShape status="status-urgent" size={10} />
            <span>Dringend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
