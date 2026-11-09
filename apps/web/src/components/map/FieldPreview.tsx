"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { centroid } from "@seedle/core/geo";
import { useEffect, useRef } from "react";
import { loadMaplibre } from "./loadMaplibre";
import { feldFarbe, LUFTBILD } from "./styles";

type Polygon = { type: "Polygon"; coordinates: [number, number][][] };

/** Compact static map preview of a field polygon (non-interactive). */
export function FieldPreview({ geometry, className = "" }: { geometry: Polygon; className?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | null = null;
    let cancelled = false;
    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !container.current) return;
      const c = centroid(geometry);
      const m = new maplibregl.Map({
        container: container.current,
        style: LUFTBILD,
        center: [c.lon, c.lat],
        zoom: 14.6,
        interactive: false,
        attributionControl: { compact: true },
      });
      map = m;
      m.on("load", () => {
        m.addSource("feld", { type: "geojson", data: { type: "Feature", properties: {}, geometry } });
        m.addLayer({ id: "f", type: "fill", source: "feld", paint: { "fill-color": feldFarbe().fill, "fill-opacity": 0.3 } });
        m.addLayer({ id: "l", type: "line", source: "feld", paint: { "line-color": feldFarbe().line, "line-width": 3 } });
        const ring = geometry.coordinates[0]!;
        const lons = ring.map((p) => p[0]);
        const lats = ring.map((p) => p[1]);
        m.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: 40, duration: 0 },
        );
      });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [geometry]);

  return <div ref={container} className={`overflow-hidden rounded-card bg-sand-200 ring-1 ring-line ${className}`} />;
}
