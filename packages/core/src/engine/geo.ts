/**
 * Field geometry functions: geodesic distance, polygon area, and automatic boundary generator.
 */
import type { GeoPoint, Polygon } from "../domain/types";
import { rng } from "./random";

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two geographic coordinates in kilometers (Haversine formula). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return (2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))) / 1000;
}

/** Displaces a point by dx/dy meters (East/North). Accurate for agricultural field scales. */
function offset(p: GeoPoint, dxM: number, dyM: number): [number, number] {
  const dLat = dyM / EARTH_RADIUS_M;
  const dLon = dxM / (EARTH_RADIUS_M * Math.cos(toRad(p.lat)));
  return [p.lon + (dLon * 180) / Math.PI, p.lat + (dLat * 180) / Math.PI];
}

/**
 * Generates a plausible field boundary polygon around a center coordinate (approx. 5-10 ha).
 * Farmers can adjust corner vertices subsequently in the UI.
 */
export function autoFieldPolygon(center: GeoPoint): Polygon {
  const random = rng(`feld:${center.lat.toFixed(5)}:${center.lon.toFixed(5)}`);
  const lengthM = 260 + random() * 140;
  const widthM = 180 + random() * 90;
  const angle = (random() - 0.5) * (Math.PI / 3);
  const corners: [number, number][] = [
    [-lengthM / 2, -widthM / 2],
    [lengthM / 2, -widthM / 2],
    [lengthM / 2, widthM / 2],
    [-lengthM / 2, widthM / 2],
  ].map(([x, y]) => {
    const rx = x! * Math.cos(angle) - y! * Math.sin(angle);
    const ry = x! * Math.sin(angle) + y! * Math.cos(angle);
    return offset(center, rx, ry);
  });
  return { type: "Polygon", coordinates: [[...corners, corners[0]!]] };
}

/** Calculates spherical polygon surface area in hectares. */
export function areaHa(polygon: Polygon): number {
  const ring = polygon.coordinates[0] ?? [];
  if (ring.length < 4) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i]!;
    const [lon2, lat2] = ring[i + 1]!;
    sum += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  const m2 = Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
  return m2 / 10_000;
}

/** Computes arithmetic centroid of the polygon ring vertices. */
export function centroid(polygon: Polygon): GeoPoint {
  const ring = (polygon.coordinates[0] ?? []).slice(0, -1);
  const n = Math.max(ring.length, 1);
  const lon = ring.reduce((s, c) => s + c[0], 0) / n;
  const lat = ring.reduce((s, c) => s + c[1], 0) / n;
  return { lat, lon };
}
