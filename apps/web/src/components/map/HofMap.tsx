"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Polygon } from "@seedle/core";
import { Home } from "lucide-react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadMaplibre } from "./loadMaplibre";
import { DEUTSCHLAND, KARTE, themaFarbe } from "./styles";

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

export function HofMap({ farm, fields, className = "", onSelectField }: HofMapProps) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
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
      for (const field of fields) {
        if (field.geometry?.coordinates) {
          for (const ring of field.geometry.coordinates) {
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
        style: KARTE,
        center: defaultCenter,
        zoom: points.length > 0 ? 14 : DEUTSCHLAND.zoom,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });

      currentMap = m;
      map.current = m;

      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      let initialLoaded = false;

      m.on("style.load", () => {
        if (cancelled) return;

        // Create parcel GeoJSON source (re-attached after basemap style switches)
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

            const padLon = Math.max((maxLon - minLon) * 0.18, 0.003);
            const padLat = Math.max((maxLat - minLat) * 0.18, 0.003);

            m.fitBounds(
              [
                [minLon - padLon, minLat - padLat],
                [maxLon + padLon, maxLat + padLat],
              ],
              { padding: 48, duration: 0, maxZoom: 16 },
            );
          }

          setMapReady(true);
        }
      });

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
  }, [farm.lat, farm.lon, farm.name, fields, router]);

  // Update field layer on data modifications
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const src = map.current.getSource("hof-schlaege") as GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson);
    }
  }, [geojson, mapReady]);

  return (
    <div className={`relative overflow-hidden rounded-card bg-sand-200 ring-1 ring-line ${className}`}>
      <div ref={container} className="h-full min-h-[360px] w-full" />

      {/* Map legend anchored bottom-right */}
      <div className="absolute bottom-3 right-3 z-10 rounded-xl bg-white/92 px-3 py-2 shadow-soft ring-1 ring-line/80 backdrop-blur text-xs">
        <div className="font-semibold text-ink mb-1.5 flex items-center gap-1.5">
          <Home className="size-3.5 text-leaf-700" />
          <span>Hof & Schläge</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-ok border border-status-ok-border" />
            <span>Alles im Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-action border border-status-action-border" />
            <span>Aktion nötig</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-problem border border-status-problem-border" />
            <span>Problem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-status-urgent border border-status-urgent-border" />
            <span>Dringend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
