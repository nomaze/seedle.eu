/**
 * Field geometry functions: geodesic distance, polygon area, self-intersection check,
 * official field block / parcel mosaic generator (`surroundingFieldParcels`),
 * 1-click parcel snap (`findParcelAtPoint`), and automatic boundary generator.
 */
import type { GeoPoint, Polygon } from "../domain/types";
import { rng } from "./random";

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface FieldParcelBlock {
  id: string;
  flik: string;
  label: string;
  areaHa: number;
  polygon: Polygon;
}

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
  return [
    Math.round((p.lon + (dLon * 180) / Math.PI) * 1_000_000) / 1_000_000,
    Math.round((p.lat + (dLat * 180) / Math.PI) * 1_000_000) / 1_000_000,
  ];
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
  if (ring.length === 0) return { lat: 48.4, lon: 11.7 };
  const n = ring.length;
  const lon = ring.reduce((s, c) => s + c[0], 0) / n;
  const lat = ring.reduce((s, c) => s + c[1], 0) / n;
  return { lat, lon };
}

function ccw(a: [number, number], b: [number, number], c: [number, number]): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsProperlyIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
): boolean {
  const d1 = ccw(p3, p4, p1);
  const d2 = ccw(p3, p4, p2);
  const d3 = ccw(p1, p2, p3);
  const d4 = ccw(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * Deterministically checks whether any non-adjacent edges of the polygon cross each other
 * (bowtie / hourglass self-intersection detection).
 */
export function hasSelfIntersection(polygon: Polygon): boolean {
  const ring = (polygon.coordinates[0] ?? []).slice(0, -1);
  const n = ring.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a1 = ring[i]!;
    const a2 = ring[(i + 1) % n]!;
    for (let j = i + 2; j < n; j++) {
      // Skip adjacent edges sharing the first/last vertex
      if (i === 0 && j === n - 1) continue;
      const b1 = ring[j]!;
      const b2 = ring[(j + 1) % n]!;
      if (segmentsProperlyIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

const PARCEL_FIELD_NAMES = [
  "Hauptschlag Mitte",
  "Mühlacker West",
  "Südhang am Weg",
  "Hinteracker Nord",
  "Auenfeld Ost",
  "Kirchfeld",
  "Waldrandschlag",
  "Brückenacker",
  "Lerchenfeld",
  "Talwiese Acker",
] as const;

/**
 * Generates a realistic, deterministic cadastral mosaic of 9 adjacent agricultural field parcels
 * (`surroundingFieldParcels`) around `center` using a grid-snapped seeded RNG.
 * Each parcel has 5 to 6 vertices, realistic size between 4.5 ha and 24.0 ha, and an official
 * FLIK field block identifier (`FLIK DE-BY-...`), with the central parcel enclosing `center`.
 */
export function surroundingFieldParcels(center: GeoPoint): FieldParcelBlock[] {
  // Snap center to ~1.1 km grid so nearby clicks share a consistent local cadastral mosaic
  const gridLat = Math.round(center.lat * 100) / 100;
  const gridLon = Math.round(center.lon * 100) / 100;
  const gridCenter: GeoPoint = { lat: gridLat, lon: gridLon };
  const random = rng(`flurkarte:${gridLat.toFixed(2)}:${gridLon.toFixed(2)}`);

  const stateCode = center.lat > 52 ? "NI" : center.lat > 50 ? "HE" : "BY";
  const parcels: FieldParcelBlock[] = [];

  // 3x3 mosaic of agricultural parcels around center (9 blocks, center at index 4)
  const offsets: [number, number][] = [
    [0, 0],
    [-340, 0],
    [340, 0],
    [0, 270],
    [0, -270],
    [-340, 270],
    [340, 270],
    [-340, -270],
    [340, -270],
  ];

  offsets.forEach(([ox, oy], idx) => {
    // Ensure index 0 directly encloses the requested `center` point
    const blockCenter: GeoPoint =
      idx === 0
        ? center
        : {
            lat: offset(gridCenter, ox, oy)[1],
            lon: offset(gridCenter, ox, oy)[0],
          };

    const halfW = 125 + random() * 55; // width 250m - 360m
    const halfH = 95 + random() * 45; // height 190m - 280m
    const rot = (random() - 0.5) * 0.28; // gentle agricultural field orientation

    // 5 or 6 vertices (pentagon/hexagon typical for real cadastral field blocks)
    const localPts: [number, number][] = [
      [-halfW, -halfH * 0.92],
      [halfW * 0.15, -halfH * (1.02 + random() * 0.08)],
      [halfW, -halfH * 0.85],
      [halfW * (0.94 + random() * 0.1), halfH * 0.88],
      [halfW * 0.05, halfH * (1.0 + random() * 0.08)],
      [-halfW * 0.96, halfH * 0.9],
    ];

    const ring: [number, number][] = localPts.map(([lx, ly]) => {
      const rx = lx * Math.cos(rot) - ly * Math.sin(rot);
      const ry = lx * Math.sin(rot) + ly * Math.cos(rot);
      return offset(blockCenter, rx, ry);
    });

    const poly: Polygon = {
      type: "Polygon",
      coordinates: [[...ring, ring[0]!]],
    };

    const rawHa = Math.round(areaHa(poly) * 10) / 10;
    const clampedHa = Math.max(4.5, Math.min(24.0, rawHa));
    const flikNum = Math.floor(100000 + random() * 899999);
    const flik = `FLIK DE-${stateCode}-084${flikNum}`;
    const label = PARCEL_FIELD_NAMES[idx % PARCEL_FIELD_NAMES.length]!;

    parcels.push({
      id: `parcel-${idx + 1}-${flikNum}`,
      flik,
      label,
      areaHa: clampedHa,
      polygon: poly,
    });
  });

  return parcels;
}

/** Ray-casting point-in-polygon check for a closed GeoJSON Polygon. */
export function isPointInPolygon(point: GeoPoint, polygon: Polygon): boolean {
  const ring = polygon.coordinates[0] ?? [];
  if (ring.length < 4) return false;
  const x = point.lon;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    const xi = ring[i]![0];
    const yi = ring[i]![1];
    const xj = ring[j]![0];
    const yj = ring[j]![1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Finds the parcel enclosing `point` via ray-casting, or falls back to the nearest parcel
 * within 0.6 km so a 1-click on any field block in the Feldkarte snaps cleanly.
 */
export function findParcelAtPoint(
  point: GeoPoint,
  parcels: FieldParcelBlock[],
): FieldParcelBlock | null {
  if (parcels.length === 0) return null;
  for (const parcel of parcels) {
    if (isPointInPolygon(point, parcel.polygon)) {
      return parcel;
    }
  }
  let best: FieldParcelBlock | null = null;
  let bestDist = Infinity;
  for (const parcel of parcels) {
    const c = centroid(parcel.polygon);
    const d = distanceKm(point, c);
    if (d < bestDist) {
      bestDist = d;
      best = parcel;
    }
  }
  return bestDist <= 0.65 ? best : parcels[0]!;
}
