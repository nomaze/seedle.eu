"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { lookupPlzOffline } from "@seedle/core";
import {
  areaHa,
  autoFieldPolygon,
  centroid,
  distanceKm,
  hasSelfIntersection,
  isPointInPolygon,
} from "@seedle/core/geo";
import type { FilterSpecification, GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Grid,
  Layers,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Sun,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkBackendHealth,
  fetchRealFieldBoundaryAtPoint,
  flushPendingFieldIntakes,
  type RealFieldParcelInfo,
  sanitizePlainText,
  submitFieldIntake,
} from "@/lib/backendClient";
import {
  loadFieldAgronomyProfile,
  saveFieldAgronomyProfile,
  SOIL_TYPE_LABELS,
  type SoilTypeOption,
  TRAFFICABILITY_LABELS,
  type TrafficabilityOption,
} from "@/lib/fieldAgronomyProfile";
import {
  buildDeterministicWeatherHistory10Y,
  deriveSiteDroughtRiskLevel,
  fetchFieldWeatherHistory10Y,
  type FieldWeatherHistory10Y,
} from "@/lib/fieldWeatherHistory";
import { num } from "@/lib/format";
import { Button, buttonClass } from "../ui/Button";
import { loadMaplibre } from "./loadMaplibre";
import {
  attachMapErrorShield,
  DEUTSCHLAND,
  feldFarbe,
  FIBOA_PMTILES_URL,
  KARTE,
  LUFTBILD,
} from "./styles";

type Polygon = ReturnType<typeof autoFieldPolygon>;
interface SearchHit {
  label: string;
  lat: number;
  lon: number;
}

export interface ReverseLocationMetadata {
  ort: string;
  landkreis: string;
  bundesland: string;
  plz: string;
}

export type FieldEditToolMode = "single" | "merge" | "split";

interface SplitHalfState {
  partA: Polygon;
  partB: Polygon;
  areaA: number;
  areaB: number;
  activeSide: 1 | -1;
}

interface UndoSnapshot {
  polygon: Polygon;
  snappedParcel: RealFieldParcelInfo | null;
  mergedCount: number;
  splitState: SplitHalfState | null;
}

/**
 * Computes the geographic midpoint [lng, lat] between two polygon vertices.
 */
export function computeEdgeMidpoint(
  a: [number, number],
  b: [number, number],
): [number, number] {
  return [
    Math.round(((a[0] + b[0]) / 2) * 1_000_000) / 1_000_000,
    Math.round(((a[1] + b[1]) / 2) * 1_000_000) / 1_000_000,
  ];
}

/**
 * Inserts a new vertex at edge index `edgeIndex` (between vertex `edgeIndex` and `(edgeIndex + 1) % n`)
 * into a closed GeoJSON Polygon ring and returns the updated Polygon.
 */
export function insertVertexOnEdge(
  poly: Polygon,
  edgeIndex: number,
  point?: [number, number],
): Polygon {
  const ring = poly.coordinates[0] ? poly.coordinates[0].slice(0, -1) : [];
  if (ring.length < 3) return poly;
  const idx = ((edgeIndex % ring.length) + ring.length) % ring.length;
  const nextIdx = (idx + 1) % ring.length;
  const mid = point ?? computeEdgeMidpoint(ring[idx]!, ring[nextIdx]!);
  const updated = [...ring.slice(0, idx + 1), mid, ...ring.slice(idx + 1)];
  return {
    type: "Polygon",
    coordinates: [[...updated, updated[0]!]],
  };
}

/**
 * Builds a closed GeoJSON Polygon from an array of freehand [lng, lat] vertices.
 * When fewer than 3 vertices are provided, returns null.
 */
export function buildPolygonFromPoints(points: [number, number][]): Polygon | null {
  if (points.length < 3) return null;
  return {
    type: "Polygon",
    coordinates: [[...points, points[0]!]],
  };
}

function openRingVertices(ring: [number, number][]): [number, number][] {
  if (ring.length === 0) return [];
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (
    ring.length > 1 &&
    Math.abs(first[0] - last[0]) < 1e-9 &&
    Math.abs(first[1] - last[1]) < 1e-9
  ) {
    return ring.slice(0, -1);
  }
  return ring.slice();
}

function ensureClosedRing(ring: [number, number][]): [number, number][] {
  const clean = ring
    .filter((pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
    .map((pt): [number, number] => [Number(pt[0]), Number(pt[1])]);
  if (clean.length === 0) return [];
  const first = clean[0]!;
  const last = clean[clean.length - 1]!;
  if (Math.abs(first[0] - last[0]) > 1e-9 || Math.abs(first[1] - last[1]) > 1e-9) {
    return [...clean, [first[0], first[1]]];
  }
  return clean;
}

/** Computes the perimeter of a polygon in meters. */
export function computePolygonPerimeterMeters(poly: Polygon): number {
  const ring = poly.coordinates[0] ?? [];
  if (ring.length < 4) return 0;
  let totalKm = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i]!;
    const b = ring[i + 1]!;
    totalKm += distanceKm({ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] });
  }
  return Math.round(totalKm * 1000);
}

/**
 * Sutherland-Hodgman half-plane polygon clipping along the infinite line `p1 -> p2`.
 * Used for the 2-click field split tool ("Schlag teilen").
 */
export function clipPolygonByHalfPlane(
  poly: Polygon,
  p1: [number, number],
  p2: [number, number],
  side: 1 | -1 = 1,
): Polygon | null {
  const pts = openRingVertices(poly.coordinates[0] ?? []);
  if (pts.length < 3) return null;

  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const evalSide = (pt: [number, number]): number =>
    (dx * (pt[1] - p1[1]) - dy * (pt[0] - p1[0])) * side;

  const intersect = (a: [number, number], b: [number, number]): [number, number] => {
    const va = evalSide(a);
    const vb = evalSide(b);
    const denom = va - vb;
    if (Math.abs(denom) < 1e-14) return [a[0], a[1]];
    const t = va / denom;
    return [
      Number((a[0] + t * (b[0] - a[0])).toFixed(7)),
      Number((a[1] + t * (b[1] - a[1])).toFixed(7)),
    ];
  };

  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i]!;
    const prev = pts[(i + pts.length - 1) % pts.length]!;
    const currIn = evalSide(curr) >= -1e-12;
    const prevIn = evalSide(prev) >= -1e-12;

    if (currIn) {
      if (!prevIn) {
        out.push(intersect(prev, curr));
      }
      out.push([curr[0], curr[1]]);
    } else if (prevIn) {
      out.push(intersect(prev, curr));
    }
  }

  const cleaned: [number, number][] = [];
  for (const pt of out) {
    const last = cleaned[cleaned.length - 1];
    if (!last || Math.hypot(pt[0] - last[0], pt[1] - last[1]) > 1e-8) {
      cleaned.push(pt);
    }
  }
  if (cleaned.length < 3) return null;
  return {
    type: "Polygon",
    coordinates: [ensureClosedRing(cleaned)],
  };
}

function ensureCCWRing(pts: [number, number][]): [number, number][] {
  let signed = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    signed += a[0] * b[1] - b[0] * a[1];
  }
  return signed < 0 ? pts.slice().reverse() : pts.slice();
}

function simplifyRingCollinearAndSpikes(
  pts: [number, number][],
  removeCollinear = true,
): [number, number][] {
  const out = pts.slice();
  const minDist = 0.000035;
  let changed = true;
  while (changed && out.length > 3) {
    changed = false;
    for (let k = 0; k < out.length; k++) {
      const prev = out[(k + out.length - 1) % out.length]!;
      const curr = out[k]!;
      const next = out[(k + 1) % out.length]!;

      const dPrev = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
      const dNext = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
      const dSpan = Math.hypot(next[0] - prev[0], next[1] - prev[1]);

      // Remove duplicate vertices or hairpin spikes
      if (dPrev < minDist || dNext < minDist || dSpan < minDist) {
        out.splice(k, 1);
        changed = true;
        break;
      }

      const ux = curr[0] - prev[0];
      const uy = curr[1] - prev[1];
      const vx = next[0] - curr[0];
      const vy = next[1] - curr[1];
      const lenU = Math.hypot(ux, uy);
      const lenV = Math.hypot(vx, vy);
      if (lenU > 0 && lenV > 0) {
        const cosAngle = (ux * vx + uy * vy) / (lenU * lenV);
        const sinAngle = Math.abs(ux * vy - uy * vx) / (lenU * lenV);
        // Hairpin backtrack (180 degree reversal)
        if (cosAngle < -0.965) {
          out.splice(k, 1);
          changed = true;
          break;
        }
        // Collinear intermediate vertex along a straight edge (e.g. MVT tile seam endpoint)
        if (removeCollinear && cosAngle > 0.9985 && sinAngle < 0.045) {
          out.splice(k, 1);
          changed = true;
          break;
        }
      }
    }
  }
  return out;
}

function findBestAntiParallelSeam(
  ringA: [number, number][],
  ringB: [number, number][],
): { edgeI: number; edgeJ: number; perpDist: number } | null {
  let bestEdgeI = -1;
  let bestEdgeJ = -1;
  let bestPerpDist = 0;
  let bestSeamScore = Infinity;

  for (let i = 0; i < ringA.length; i++) {
    const a0 = ringA[i]!;
    const a1 = ringA[(i + 1) % ringA.length]!;
    const vAx = a1[0] - a0[0];
    const vAy = a1[1] - a0[1];
    const lenA = Math.hypot(vAx, vAy);
    if (lenA < 0.00004) continue;
    const uAx = vAx / lenA;
    const uAy = vAy / lenA;

    for (let j = 0; j < ringB.length; j++) {
      const b0 = ringB[j]!;
      const b1 = ringB[(j + 1) % ringB.length]!;
      // Opposite vector on B: from b1 to b0
      const vBx = b0[0] - b1[0];
      const vBy = b0[1] - b1[1];
      const lenB = Math.hypot(vBx, vBy);
      if (lenB < 0.00004) continue;

      const cosAnti = (vAx * vBx + vAy * vBy) / (lenA * lenB);
      if (cosAnti < 0.85) continue;

      const dStart = Math.hypot(a0[0] - b1[0], a0[1] - b1[1]);
      const dEnd = Math.hypot(a1[0] - b0[0], a1[1] - b0[1]);
      const midAx = (a0[0] + a1[0]) / 2;
      const midAy = (a0[1] + a1[1]) / 2;
      const perpDist =
        Math.abs(vBx * (midAy - b1[1]) - vBy * (midAx - b1[0])) / lenB;

      // Also compute 1D projection overlap along edgeA to catch unequal-length collinear MVT tile-cut edges
      const projB1 = (b1[0] - a0[0]) * uAx + (b1[1] - a0[1]) * uAy;
      const projB0 = (b0[0] - a0[0]) * uAx + (b0[1] - a0[1]) * uAy;
      const minProjB = Math.min(projB0, projB1);
      const maxProjB = Math.max(projB0, projB1);
      const overlapLen = Math.max(0, Math.min(lenA, maxProjB) - Math.max(0, minProjB));
      const minEdgeLen = Math.min(lenA, lenB);
      const hasStrongCollinearOverlap =
        overlapLen >= minEdgeLen * 0.45 && perpDist <= 0.0008;

      const maxAllowedEndpointGap = Math.max(0.0028, minEdgeLen * 0.85);
      if (
        ((dStart <= maxAllowedEndpointGap && dEnd <= maxAllowedEndpointGap) ||
          hasStrongCollinearOverlap) &&
        perpDist <= 0.0028
      ) {
        const score = dStart + dEnd + perpDist * 6 - overlapLen * 2;
        if (score < bestSeamScore) {
          bestSeamScore = score;
          bestEdgeI = i;
          bestEdgeJ = j;
          bestPerpDist = perpDist;
        }
      }
    }
  }

  return bestEdgeI !== -1 && bestEdgeJ !== -1
    ? { edgeI: bestEdgeI, edgeJ: bestEdgeJ, perpDist: bestPerpDist }
    : null;
}

/**
 * Merges two adjacent or tile-clipped field polygons into a single outer boundary polygon.
 * First detects shared anti-parallel seam edges (such as MVT vector tile cut lines or shared parcel borders),
 * trims any overlapping MVT tile-buffer strip along the exact mid-seam line, and removes the interior cut edge completely.
 *
 * Both input rings are normalized to the same winding order (CCW) before splicing. To prevent figure-8 /
 * self-intersecting butterfly polygons from opposite traversal directions, both traversal directions of ring B
 * (normal and reversed) are evaluated and the non-self-intersecting outer perimeter with the largest enclosed
 * area is selected.
 */
export function mergeTwoPolygonsIntoOne(polyA: Polygon, polyB: Polygon): Polygon {
  const rawA = ensureCCWRing(openRingVertices(polyA.coordinates[0] ?? []));
  const rawBBase = ensureCCWRing(openRingVertices(polyB.coordinates[0] ?? []));
  if (rawA.length < 3) return polyB;
  if (rawBBase.length < 3) return polyA;

  // Check if polyA and polyB are duplicate copies of the exact same polygon fragment
  const cA = centroid(polyA);
  const cB = centroid(polyB);
  const haA = areaHa(polyA);
  const haB = areaHa(polyB);
  if (
    Math.hypot(cA.lon - cB.lon, cA.lat - cB.lat) < 0.00002 &&
    Math.abs(haA - haB) / Math.max(0.01, haA, haB) < 0.02
  ) {
    return polyA;
  }

  const mergeWithOrientedRings = (
    ringAInput: [number, number][],
    ringBInput: [number, number][],
  ): Polygon => {
    let ringA = simplifyRingCollinearAndSpikes(ringAInput, true);
    let ringB = simplifyRingCollinearAndSpikes(ringBInput, true);
    if (ringA.length < 3) return polyB;
    if (ringB.length < 3) return polyA;

    let seam = findBestAntiParallelSeam(ringA, ringB);

    // If the two fragments overlap across an MVT tile buffer strip (perpDist > 0.000015),
    // trim both polygons to the exact mid-seam line so they meet with zero overlap.
    if (seam && seam.perpDist > 0.000015) {
      const a0 = ringA[seam.edgeI]!;
      const a1 = ringA[(seam.edgeI + 1) % ringA.length]!;
      const b0 = ringB[seam.edgeJ]!;
      const b1 = ringB[(seam.edgeJ + 1) % ringB.length]!;
      const mid0: [number, number] = [(a0[0] + b1[0]) / 2, (a0[1] + b1[1]) / 2];
      const mid1: [number, number] = [(a1[0] + b0[0]) / 2, (a1[1] + b0[1]) / 2];
      const clippedA = clipPolygonByHalfPlane(
        { type: "Polygon", coordinates: [ensureClosedRing(ringA)] },
        mid0,
        mid1,
        1,
      );
      const clippedB = clipPolygonByHalfPlane(
        { type: "Polygon", coordinates: [ensureClosedRing(ringB)] },
        mid0,
        mid1,
        -1,
      );
      if (
        clippedA &&
        clippedB &&
        areaHa(clippedA) > haA * 0.5 &&
        areaHa(clippedB) > haB * 0.5
      ) {
        ringA = simplifyRingCollinearAndSpikes(
          ensureCCWRing(openRingVertices(clippedA.coordinates[0] ?? [])),
          true,
        );
        ringB = simplifyRingCollinearAndSpikes(
          ensureCCWRing(openRingVertices(clippedB.coordinates[0] ?? [])),
          true,
        );
        seam = findBestAntiParallelSeam(ringA, ringB);
      }
    }

    if (seam) {
      const { edgeI: bestEdgeI, edgeJ: bestEdgeJ } = seam;
      // Walk ringA excluding edge bestEdgeI (starts at (bestEdgeI + 1) % nA, ends at bestEdgeI)
      const pathA: [number, number][] = [];
      for (let k = 1; k <= ringA.length; k++) {
        pathA.push(ringA[(bestEdgeI + k) % ringA.length]!);
      }
      // Walk ringB excluding edge bestEdgeJ (starts at (bestEdgeJ + 1) % nB, ends at bestEdgeJ)
      const pathB: [number, number][] = [];
      for (let k = 1; k <= ringB.length; k++) {
        pathB.push(ringB[(bestEdgeJ + k) % ringB.length]!);
      }

      // Weld seam junction 1: end of pathA (a0) meets start of pathB (b1)
      const a0 = pathA[pathA.length - 1]!;
      const b1 = pathB[0]!;
      if (Math.hypot(a0[0] - b1[0], a0[1] - b1[1]) < 0.0028) {
        pathA[pathA.length - 1] = [
          Number(((a0[0] + b1[0]) / 2).toFixed(7)),
          Number(((a0[1] + b1[1]) / 2).toFixed(7)),
        ];
        pathB.shift();
      }

      // Weld seam junction 2: end of pathB (b0) meets start of pathA (a1)
      if (pathB.length > 0 && pathA.length > 0) {
        const b0 = pathB[pathB.length - 1]!;
        const a1 = pathA[0]!;
        if (Math.hypot(b0[0] - a1[0], b0[1] - a1[1]) < 0.0028) {
          pathA[0] = [
            Number(((b0[0] + a1[0]) / 2).toFixed(7)),
            Number(((b0[1] + a1[1]) / 2).toFixed(7)),
          ];
          pathB.pop();
        }
      }

      const spliced = simplifyRingCollinearAndSpikes([...pathA, ...pathB], true);
      if (spliced.length >= 3) {
        return {
          type: "Polygon",
          coordinates: [ensureClosedRing(spliced)],
        };
      }
    }

    // 2. Fallback when rings touch at a single vertex or narrow bridge
    let bestI = 0;
    let bestJ = 0;
    let bestDist = Infinity;
    for (let i = 0; i < ringA.length; i++) {
      for (let j = 0; j < ringB.length; j++) {
        const d = Math.hypot(ringA[i]![0] - ringB[j]![0], ringA[i]![1] - ringB[j]![1]);
        if (d < bestDist) {
          bestDist = d;
          bestI = i;
          bestJ = j;
        }
      }
    }

    const rotA = [...ringA.slice(bestI), ...ringA.slice(0, bestI)];
    const rotB = [...ringB.slice(bestJ), ...ringB.slice(0, bestJ)];
    const combined = simplifyRingCollinearAndSpikes([...rotA, ...rotB], false);

    return {
      type: "Polygon",
      coordinates: [ensureClosedRing(combined.length >= 3 ? combined : rawA)],
    };
  };

  // Normalize both input rings to the same winding order (CCW) before splicing,
  // then evaluate both traversal directions of ring B to avoid figure-8 / self-intersections.
  const ringACcw = rawA.slice();
  const ringBCcw = rawBBase.slice();
  const ringBReversed = rawBBase.slice().reverse();

  const candidates: Polygon[] = [
    mergeWithOrientedRings(ringACcw, ringBCcw),
    mergeWithOrientedRings(ringACcw, ringBReversed),
  ];

  const validNonSelfIntersecting = candidates.filter(
    (candidate) =>
      (candidate.coordinates[0]?.length ?? 0) >= 4 && !hasSelfIntersection(candidate),
  );

  const pickLargest = (polys: Polygon[]): Polygon =>
    polys.reduce((best, current) => (areaHa(current) > areaHa(best) ? current : best));

  if (validNonSelfIntersecting.length > 0) {
    return pickLargest(validNonSelfIntersecting);
  }

  const validCandidates = candidates.filter((candidate) => (candidate.coordinates[0]?.length ?? 0) >= 4);
  if (validCandidates.length > 0) {
    return pickLargest(validCandidates);
  }

  return candidates[0] ?? polyA;
}

/**
 * Stitches an array of outer rings (e.g. multiple MVT vector tile fragments of the same field)
 * into a single unified outer boundary Polygon without internal tile-cut lines.
 */
export function stitchPolygonRingsList(rings: [number, number][][]): Polygon | null {
  const validRings = rings
    .map((r) => ensureClosedRing(r))
    .filter((r) => r.length >= 4);
  if (validRings.length === 0) return null;

  // Deduplicate identical tile fragments from overlapping zoom/source queries
  const uniquePolys: Polygon[] = [];
  for (const r of validRings) {
    const candidatePoly: Polygon = { type: "Polygon", coordinates: [r] };
    const c = centroid(candidatePoly);
    const ha = areaHa(candidatePoly);
    if (ha < 0.001) continue;
    const isDup = uniquePolys.some((existing) => {
      const ec = centroid(existing);
      const eha = areaHa(existing);
      return (
        Math.hypot(c.lon - ec.lon, c.lat - ec.lat) < 0.00002 &&
        Math.abs(ha - eha) / Math.max(0.01, ha, eha) < 0.02
      );
    });
    if (!isDup) {
      uniquePolys.push(candidatePoly);
    }
  }

  if (uniquePolys.length === 0) {
    return { type: "Polygon", coordinates: [validRings[0]!] };
  }
  uniquePolys.sort((a, b) => areaHa(b) - areaHa(a));

  let merged = uniquePolys[0]!;
  const remaining = uniquePolys.slice(1);

  while (remaining.length > 0) {
    // Pick the fragment whose centroid is closest to the current merged polygon
    const mc = centroid(merged);
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const rc = centroid(remaining[i]!);
      const d = Math.hypot(mc.lon - rc.lon, mc.lat - rc.lat);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const nextFragment = remaining.splice(bestIdx, 1)[0]!;
    merged = mergeTwoPolygonsIntoOne(merged, nextFragment);
  }

  return merged;
}

export function buildFiboaIdFilterExpression(ids: string[]): FilterSpecification {
  if (ids.length === 0) {
    return ["==", ["get", "id"], "__NONE__"] as unknown as FilterSpecification;
  }
  return [
    "any",
    ["in", ["to-string", ["coalesce", ["get", "id"], ""]], ["literal", ids]],
    ["in", ["to-string", ["coalesce", ["get", "flik"], ""]], ["literal", ids]],
    ["in", ["to-string", ["coalesce", ["get", "FLIK"], ""]], ["literal", ids]],
    ["in", ["to-string", ["coalesce", ["id"], ""]], ["literal", ids]],
  ] as unknown as FilterSpecification;
}

export function extractFiboaFeatureId(feat: {
  id?: string | number;
  properties?: Record<string, unknown>;
}): string | null {
  const props = feat.properties ?? {};
  const fid =
    props.id ??
    props.flik ??
    props.FLIK ??
    props.field_id ??
    props.fiboa_id ??
    feat.id;
  return fid !== undefined && fid !== null && String(fid).length > 0 ? String(fid) : null;
}

function buildRealNeighborsFeatureCollection(parcels: RealFieldParcelInfo[]) {
  return {
    type: "FeatureCollection" as const,
    features: parcels.map((parcel) => ({
      type: "Feature" as const,
      id: parcel.id,
      properties: {
        id: parcel.id,
        flik: parcel.flik,
        sourceLabel: parcel.sourceLabel,
        landuseLabel: parcel.landuseLabel,
        areaHa: parcel.areaHa,
      },
      geometry: parcel.polygon,
    })),
  };
}

export function extractFiboaFeatureParcel(
  m: MlMap,
  feat: {
    id?: string | number;
    properties?: Record<string, unknown>;
    geometry?: { type?: string; coordinates?: unknown };
  },
): RealFieldParcelInfo | null {
  const props = feat.properties ?? {};
  const fid =
    props.id ??
    props.flik ??
    props.FLIK ??
    props.field_id ??
    props.fiboa_id ??
    feat.id;
  const fidStr = fid !== undefined && fid !== null ? String(fid) : null;

  const candidateGeoms: Array<{ type?: string; coordinates?: unknown }> = feat.geometry
    ? [feat.geometry]
    : [];

  const matchesFeatureId = (candidate: {
    id?: string | number;
    properties?: Record<string, unknown>;
  }): boolean => {
    if (!fidStr) return false;
    const cProps = candidate.properties ?? {};
    const cIds = [
      cProps.id,
      cProps.flik,
      cProps.FLIK,
      cProps.field_id,
      cProps.fiboa_id,
      candidate.id,
    ];
    return cIds.some((val) => val !== undefined && val !== null && String(val) === fidStr);
  };

  if (fidStr) {
    // 1. Query all rendered features across the entire viewport for matching fid (catches adjacent vector tiles)
    try {
      const targetLayers = ["fiboa-fields-fill", "fiboa-fields-outline"].filter((l) =>
        Boolean(m.getLayer?.(l)),
      );
      if (targetLayers.length > 0) {
        const renderedMatches = m.queryRenderedFeatures(undefined, {
          layers: targetLayers,
        });
        for (const rf of renderedMatches ?? []) {
          if (matchesFeatureId(rf) && rf.geometry) {
            candidateGeoms.push(rf.geometry);
          }
        }
      }
    } catch {
      // Ignore if queryRenderedFeatures is unsupported in test mock
    }

    // 2. Query source features by filter and JS fallback
    try {
      const sourceFiltered = m.querySourceFeatures("fiboa-fields", {
        sourceLayer: "fields",
        filter: buildFiboaIdFilterExpression([fidStr]),
      });
      for (const sf of sourceFiltered ?? []) {
        if (sf.geometry) {
          candidateGeoms.push(sf.geometry);
        }
      }
    } catch {
      // Ignore if sourceLayer filter query is unsupported in current mock/context
    }

    try {
      const allSourceFeatures = m.querySourceFeatures("fiboa-fields", {
        sourceLayer: "fields",
      });
      for (const sf of allSourceFeatures ?? []) {
        if (matchesFeatureId(sf) && sf.geometry) {
          candidateGeoms.push(sf.geometry);
        }
      }
    } catch {
      // Ignore if unrestricted querySourceFeatures is unsupported in test mock
    }
  }

  const collectOuterRingsFromGeoms = (
    geoms: Array<{ type?: string; coordinates?: unknown }>,
  ): [number, number][][] => {
    const rings: [number, number][][] = [];
    for (const geom of geoms) {
      if (!geom || !Array.isArray(geom.coordinates)) continue;
      if (geom.type === "Polygon" && geom.coordinates.length > 0) {
        const r = ensureClosedRing((geom.coordinates[0] ?? []) as [number, number][]);
        if (r.length >= 4) rings.push(r);
      } else if (geom.type === "MultiPolygon") {
        for (const polyCoords of geom.coordinates as unknown[][]) {
          if (Array.isArray(polyCoords) && polyCoords.length > 0) {
            const r = ensureClosedRing((polyCoords[0] ?? []) as [number, number][]);
            if (r.length >= 4) rings.push(r);
          }
        }
      }
    }
    return rings;
  };

  const allOuterRings = collectOuterRingsFromGeoms(candidateGeoms);
  let primaryPoly = stitchPolygonRingsList(allOuterRings);
  if (!primaryPoly) return null;

  let officialHa: number | null = null;
  if (props["metrics:area"] !== undefined) {
    const parsed = Number(props["metrics:area"]);
    if (Number.isFinite(parsed) && parsed > 0) {
      officialHa = parsed > 500 ? parsed / 10000.0 : parsed;
    }
  } else if (props.area !== undefined) {
    const parsed = Number(props.area);
    if (Number.isFinite(parsed) && parsed > 0) {
      officialHa = parsed > 500 ? parsed / 10000.0 : parsed;
    }
  }

  // 3. Geometric tile-seam recovery: if the stitched polygon is still smaller than 85% of the official
  // `metrics:area` (or if an adjacent vector tile fragment had a mutated/numeric MVT tile feature id),
  // scan all loaded features in `fiboa-fields` for any fragment that shares an anti-parallel MVT tile-cut seam
  // and equivalent `metrics:area` / `collection` metadata, and stitch it into the full field boundary.
  const currentCalcHa = areaHa(primaryPoly);
  if (officialHa === null || currentCalcHa < officialHa * 0.92) {
    try {
      const poolFeatures: Array<{
        id?: string | number;
        properties?: Record<string, unknown>;
        geometry?: { type?: string; coordinates?: unknown };
      }> = [];
      try {
        const srcAll = m.querySourceFeatures?.("fiboa-fields", {
          sourceLayer: "fields",
        });
        if (Array.isArray(srcAll)) poolFeatures.push(...srcAll);
      } catch {
        // Ignore
      }
      try {
        if (m.getLayer?.("fiboa-fields-fill")) {
          const rendAll = m.queryRenderedFeatures?.(undefined, {
            layers: ["fiboa-fields-fill"],
          });
          if (Array.isArray(rendAll)) poolFeatures.push(...rendAll);
        }
      } catch {
        // Ignore
      }

      const targetCollection = String(props.collection ?? "");
      const baseRing = simplifyRingCollinearAndSpikes(
        ensureCCWRing(openRingVertices(primaryPoly.coordinates[0] ?? [])),
        true,
      );

      for (const cand of poolFeatures) {
        if (!cand?.geometry) continue;
        const cProps = cand.properties ?? {};
        // If officialHa is known on both, require matching area metadata within 3% so neighboring distinct fields are never merged
        if (officialHa !== null && cProps["metrics:area"] !== undefined) {
          const candRawArea = Number(cProps["metrics:area"]);
          const candHa =
            Number.isFinite(candRawArea) && candRawArea > 0
              ? candRawArea > 500
                ? candRawArea / 10000.0
                : candRawArea
              : null;
          if (candHa !== null && Math.abs(candHa - officialHa) / officialHa > 0.03) {
            continue;
          }
        } else if (!matchesFeatureId(cand)) {
          continue;
        }
        if (
          targetCollection &&
          cProps.collection &&
          String(cProps.collection) !== targetCollection
        ) {
          continue;
        }

        const candRings = collectOuterRingsFromGeoms([cand.geometry]);
        for (const cr of candRings) {
          const cleanCr = simplifyRingCollinearAndSpikes(
            ensureCCWRing(openRingVertices(cr)),
            true,
          );
          if (cleanCr.length < 3) continue;
          const seam = findBestAntiParallelSeam(baseRing, cleanCr);
          // Only auto-stitch across axis-aligned MVT tile cut seams (vertical Δlon ≈ 0 or horizontal Δlat ≈ 0) or exact ID match
          if (seam) {
            const s0 = baseRing[seam.edgeI]!;
            const s1 = baseRing[(seam.edgeI + 1) % baseRing.length]!;
            const isAxisAlignedTileCut =
              Math.abs(s1[0] - s0[0]) < 0.00018 || Math.abs(s1[1] - s0[1]) < 0.00018;
            if (isAxisAlignedTileCut || matchesFeatureId(cand)) {
              allOuterRings.push(cr);
            }
          }
        }
      }

      if (allOuterRings.length > 1) {
        const restitched = stitchPolygonRingsList(allOuterRings);
        if (restitched && areaHa(restitched) >= currentCalcHa) {
          primaryPoly = restitched;
        }
      }
    } catch {
      // Ignore geometric recovery errors in mock environments
    }
  }

  const primaryRing = primaryPoly.coordinates[0] ?? [];

  const calcHa = Math.round(areaHa(primaryPoly) * 10) / 10;
  const displayHa =
    officialHa !== null && officialHa > 0 ? Math.round(officialHa * 10) / 10 : calcHa;

  const fieldIdStr = String(fid || `fiboa-${Date.now()}`);
  const collectionStr = String(props.collection || props.source || "fiboa / InVeKoS");
  const cropStr = String(
    props["crop:name"] ||
      props["hcat:name"] ||
      props.crop_name ||
      props["crop:code"] ||
      "Ackerland (Farmland)",
  );

  return {
    id: fieldIdStr,
    flik: fieldIdStr,
    sourceLabel: `Amtlicher Schlag (${collectionStr} · ${fieldIdStr})`,
    landuseLabel: cropStr,
    areaHa: displayHa,
    vertexCount: Math.max(0, primaryRing.length - 1),
    polygon: primaryPoly,
  };
}

/**
 * Interactive field selector with Official `fiboa` PMTiles Vector Field Layer,
 * subtle white hover, strong terracotta selection highlight, 0-ms Parcel Snap,
 * expandable Field Steckbrief with direct soil/elevation adjustments,
 * Multi-Field Merge, 2-Click Field Split, and Multi-Vertex Polygon Editor.
 */
export function FieldPicker({
  mode = "neu",
  fieldId,
  initial,
  initialName,
  defaultWeatherOpen = false,
  defaultSteckbriefOpen = false,
}: {
  mode?: "neu" | "anpassen";
  fieldId?: string;
  initial?: Polygon;
  initialName?: string;
  defaultWeatherOpen?: boolean;
  defaultSteckbriefOpen?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const midpointMarkers = useRef<Marker[]>([]);
  const freehandMarkers = useRef<Marker[]>([]);
  const splitMarkers = useRef<Marker[]>([]);
  const polygonRef = useRef<Polygon | null>(initial ?? null);
  const snapRequestIdRef = useRef(0);
  const fiboaMetaLockedRef = useRef(false);
  const selectedFiboaIdsRef = useRef<string[]>([]);
  const reverseGeocodeCtrlRef = useRef<AbortController | null>(null);

  const [polygon, setPolygon] = useState<Polygon | null>(initial ?? null);
  const [anpassen, setAnpassen] = useState(false);
  const anpassenRef = useRef(false);
  const [mapMode, setMapMode] = useState<"satellit" | "karte">("satellit");
  const [flurkarteAktiv, setFlurkarteAktiv] = useState(true);
  const flurkarteAktivRef = useRef(true);
  const realNeighborsRef = useRef<RealFieldParcelInfo[]>([]);
  const [snappedParcel, setSnappedParcel] = useState<RealFieldParcelInfo | null>(null);
  const snappedParcelRef = useRef<RealFieldParcelInfo | null>(null);
  const [locationMeta, setLocationMeta] = useState<ReverseLocationMetadata | null>(null);

  // Expandable Field Steckbrief & 10Y weather are collapsed by default so the main CTA is immediately visible
  const [steckbriefOpen, setSteckbriefOpen] = useState(defaultSteckbriefOpen);
  const [weather10YOpen, setWeather10YOpen] = useState(defaultWeatherOpen);
  const [weatherHistory, setWeatherHistory] = useState<FieldWeatherHistory10Y>(() => {
    const start = initial ? centroid(initial) : { lat: 48.4028, lon: 11.7489 };
    return buildDeterministicWeatherHistory10Y(start.lat, start.lon);
  });
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    void checkBackendHealth().then((res) => {
      if (!active) return;
      setIsBackendConnected(Boolean(res.isOnline && res.health?.status === "healthy"));
    });
    return () => {
      active = false;
    };
  }, []);
  const [soilType, setSoilType] = useState<SoilTypeOption>("sandiger_lehm");
  const [ackerzahl, setAckerzahl] = useState<number>(62);
  const [nfkMm, setNfkMm] = useState<number>(165);
  const [trafficability, setTrafficability] = useState<TrafficabilityOption>("normal");
  const [irrigationPossible, setIrrigationPossible] = useState<boolean>(false);
  const [farmerSoilOverride, setFarmerSoilOverride] = useState<boolean>(false);

  // Merge, Split & Undo state
  const [toolMode, setToolMode] = useState<FieldEditToolMode>("single");
  const toolModeRef = useRef<FieldEditToolMode>("single");
  const [mergedCount, setMergedCount] = useState(1);
  const mergedCountRef = useRef(1);
  const [splitPointA, setSplitPointA] = useState<[number, number] | null>(null);
  const splitPointARef = useRef<[number, number] | null>(null);
  const [splitState, setSplitState] = useState<SplitHalfState | null>(null);
  const splitStateRef = useRef<SplitHalfState | null>(null);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const undoStackRef = useRef<UndoSnapshot[]>([]);

  const [customDrawMode, setCustomDrawMode] = useState(false);
  const customDrawModeRef = useRef(false);
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const customPointsRef = useRef<[number, number][]>([]);

  const [name, setName] = useState(initialName ?? "");
  const nameRef = useRef(initialName ?? "");
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState<SearchHit[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const busy = isSaving;
  const [fehler, setFehler] = useState<string | null>(null);
  const [zoomHinweis, setZoomHinweis] = useState(false);
  const [feldVersion, setFeldVersion] = useState(0);

  const clearSplitLineAndMarkers = useCallback((): void => {
    splitPointARef.current = null;
    setSplitPointA(null);
    splitMarkers.current.forEach((mk) => mk.remove());
    splitMarkers.current = [];
    const splitSrc = map.current?.getSource("split-line") as GeoJSONSource | undefined;
    splitSrc?.setData({ type: "FeatureCollection", features: [] });
  }, []);

  const clearAllMarkers = useCallback((): void => {
    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    midpointMarkers.current.forEach((mk) => mk.remove());
    midpointMarkers.current = [];
    freehandMarkers.current.forEach((mk) => mk.remove());
    freehandMarkers.current = [];
  }, []);

  const pushUndo = useCallback((): void => {
    const currPoly = polygonRef.current;
    if (!currPoly) return;
    const snap: UndoSnapshot = {
      polygon: currPoly,
      snappedParcel: snappedParcelRef.current,
      mergedCount: mergedCountRef.current,
      splitState: splitStateRef.current,
    };
    const nextStack = [...undoStackRef.current.slice(-19), snap];
    undoStackRef.current = nextStack;
    setUndoStack(nextStack);
  }, []);

  const updateSnappedParcelState = useCallback((next: RealFieldParcelInfo | null): void => {
    snappedParcelRef.current = next;
    setSnappedParcel(next);
  }, []);

  const syncSelectedFiboaHighlight = useCallback((ids: string[]): void => {
    selectedFiboaIdsRef.current = ids;
    const m = map.current;
    if (!m) return;
    const filterExpr = buildFiboaIdFilterExpression(ids);
    try {
      if (m.getLayer("fiboa-fields-selected-fill")) {
        m.setFilter("fiboa-fields-selected-fill", filterExpr);
      }
      if (m.getLayer("fiboa-fields-selected-outline")) {
        m.setFilter("fiboa-fields-selected-outline", filterExpr);
      }
    } catch {
      // Ignore if mock map does not implement setFilter
    }
  }, []);

  const zeichne = useCallback((p: Polygon | null, forceGeoJsonOverlay = false): void => {
    void forceGeoJsonOverlay;
    polygonRef.current = p;
    setPolygon(p);
    const src = map.current?.getSource("feld") as GeoJSONSource | undefined;
    // Always populate the `feld` GeoJSON source with the stitched `p` polygon so the unified outer boundary
    // is rendered across tile seams even if an adjacent vector tile only loaded partially or has a different feature ID.
    src?.setData(
      p
        ? { type: "Feature", properties: {}, geometry: p }
        : { type: "FeatureCollection", features: [] },
    );
  }, []);

  const syncRealNeighborsLayer = useCallback((neighbors: RealFieldParcelInfo[]): void => {
    realNeighborsRef.current = neighbors;
    const src = map.current?.getSource("flurkarte-parcels") as GeoJSONSource | undefined;
    if (src) {
      src.setData(
        flurkarteAktivRef.current && neighbors.length > 0
          ? buildRealNeighborsFeatureCollection(neighbors)
          : { type: "FeatureCollection", features: [] },
      );
    }
  }, []);

  const ebenen = useCallback((): void => {
    const m = map.current;
    if (!m) return;

    // 1. Official fiboa PMTiles vector source & layers
    // Hover uses a gentle soft white highlight (never harsh red), while the selected field uses strong terracotta/coral
    if (!m.getSource("fiboa-fields")) {
      m.addSource("fiboa-fields", {
        type: "vector",
        url: FIBOA_PMTILES_URL,
      });
      const vis = flurkarteAktivRef.current ? "visible" : "none";
      m.addLayer({
        id: "fiboa-fields-fill",
        type: "fill",
        source: "fiboa-fields",
        "source-layer": "fields",
        minzoom: 11,
        layout: { visibility: vis },
        paint: {
          "fill-color": "#2c7a52",
          "fill-opacity": 0.06,
        },
      });
      m.addLayer({
        id: "fiboa-fields-hover",
        type: "fill",
        source: "fiboa-fields",
        "source-layer": "fields",
        minzoom: 11,
        layout: { visibility: vis },
        filter: ["==", ["get", "id"], "__NONE__"],
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.14,
        },
      });
      m.addLayer({
        id: "fiboa-fields-hover-outline",
        type: "line",
        source: "fiboa-fields",
        "source-layer": "fields",
        minzoom: 11,
        layout: { visibility: vis },
        filter: ["==", ["get", "id"], "__NONE__"],
        paint: {
          "line-color": "rgba(255, 255, 255, 0.65)",
          "line-width": 1.5,
        },
      });
      m.addLayer({
        id: "fiboa-fields-outline",
        type: "line",
        source: "fiboa-fields",
        "source-layer": "fields",
        minzoom: 11.5,
        layout: { visibility: vis },
        paint: {
          "line-color": "#c9945f",
          "line-width": 1.4,
          "line-opacity": 0.78,
        },
      });
      // Keep selected fiboa vector layers for ID/filter compatibility but render invisibly.
      // The unified GeoJSON `feld-flaeche` / `feld-rand` layers are the single source of truth
      // for the red selection fill and outline to prevent double-stacked shading and MVT tile-buffer overlaps.
      m.addLayer({
        id: "fiboa-fields-selected-fill",
        type: "fill",
        source: "fiboa-fields",
        "source-layer": "fields",
        minzoom: 11,
        layout: { visibility: vis },
        filter: ["==", ["get", "id"], "__NONE__"],
        paint: {
          "fill-color": feldFarbe().fill,
          "fill-opacity": 0,
        },
      });
      m.addLayer({
        id: "fiboa-fields-selected-outline",
        type: "line",
        source: "fiboa-fields",
        "source-layer": "fields",
        minzoom: 11,
        layout: { visibility: vis },
        filter: ["==", ["get", "id"], "__NONE__"],
        paint: {
          "line-color": "#e05a47",
          "line-width": 3,
          "line-opacity": 0,
        },
      });
      syncSelectedFiboaHighlight(selectedFiboaIdsRef.current);
    }

    // 2. Fallback neighbor outlines source
    if (!m.getSource("flurkarte-parcels")) {
      m.addSource("flurkarte-parcels", {
        type: "geojson",
        data:
          flurkarteAktivRef.current && realNeighborsRef.current.length > 0
            ? buildRealNeighborsFeatureCollection(realNeighborsRef.current)
            : { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "flurkarte-parcels-fill",
        type: "fill",
        source: "flurkarte-parcels",
        paint: {
          "fill-color": "#2c7a52",
          "fill-opacity": 0.08,
        },
      });
      m.addLayer({
        id: "flurkarte-parcels-line",
        type: "line",
        source: "flurkarte-parcels",
        paint: {
          "line-color": "#c9945f",
          "line-width": 1.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.75,
        },
      });
    }

    // 3. Active selected field polygon source & layers (prominent terracotta/coral highlight)
    if (!m.getSource("feld")) {
      const p = polygonRef.current;
      m.addSource("feld", {
        type: "geojson",
        data: p
          ? { type: "Feature", properties: {}, geometry: p }
          : { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "feld-flaeche",
        type: "fill",
        source: "feld",
        paint: { "fill-color": feldFarbe().fill, "fill-opacity": 0.34 },
      });
      m.addLayer({
        id: "feld-rand",
        type: "line",
        source: "feld",
        paint: { "line-color": "#e05a47", "line-width": 3 },
      });
    }

    // 4. Split line preview source & layer
    if (!m.getSource("split-line")) {
      m.addSource("split-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "split-line-layer",
        type: "line",
        source: "split-line",
        paint: {
          "line-color": "#c8432b",
          "line-width": 2.5,
          "line-dasharray": [2, 2],
        },
      });
    }
  }, [syncSelectedFiboaHighlight]);

  const applySelectedParcel = useCallback(
    (parcel: RealFieldParcelInfo, isMergeClick: boolean, isFiboaOfficial = false): void => {
      if (isFiboaOfficial) {
        fiboaMetaLockedRef.current = true;
      }
      if (isMergeClick && polygonRef.current) {
        pushUndo();
        const prevHa =
          snappedParcelRef.current?.areaHa ??
          Math.round(areaHa(polygonRef.current) * 10) / 10;
        const combinedPoly = mergeTwoPolygonsIntoOne(polygonRef.current, parcel.polygon);
        const combinedHa = isFiboaOfficial
          ? Math.round((prevHa + parcel.areaHa) * 10) / 10
          : Math.round(areaHa(combinedPoly) * 10) / 10;
        const nextCount = mergedCountRef.current + 1;
        mergedCountRef.current = nextCount;
        setMergedCount(nextCount);
        splitStateRef.current = null;
        setSplitState(null);
        if (isFiboaOfficial) {
          const nextIds = Array.from(new Set([...selectedFiboaIdsRef.current, parcel.id]));
          syncSelectedFiboaHighlight(nextIds);
          anpassenRef.current = false;
          setAnpassen(false);
        }
        const ring = combinedPoly.coordinates[0] ?? [];
        updateSnappedParcelState({
          id: `${snappedParcelRef.current?.id ?? "feld"}+${parcel.id}`,
          flik: `${snappedParcelRef.current?.flik ?? "Schlag"} + ${parcel.flik}`,
          sourceLabel: `${nextCount} Schläge verbunden (${parcel.sourceLabel})`,
          landuseLabel: parcel.landuseLabel,
          areaHa: combinedHa,
          vertexCount: Math.max(0, ring.length - 1),
          polygon: combinedPoly,
        });
        zeichne(combinedPoly, !isFiboaOfficial);
        setFeldVersion((v) => v + 1);
      } else {
        if (polygonRef.current) {
          pushUndo();
        }
        mergedCountRef.current = 1;
        setMergedCount(1);
        splitStateRef.current = null;
        setSplitState(null);
        anpassenRef.current = false;
        setAnpassen(false);
        syncSelectedFiboaHighlight(isFiboaOfficial ? [parcel.id] : []);
        updateSnappedParcelState(parcel);
        zeichne(parcel.polygon, !isFiboaOfficial);
        setFeldVersion((v) => v + 1);
      }
    },
    [pushUndo, syncSelectedFiboaHighlight, updateSnappedParcelState, zeichne],
  );

  const triggerReverseGeocode = useCallback((lat: number, lon: number, cancelled: boolean): void => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    reverseGeocodeCtrlRef.current?.abort();
    const ctrl = new AbortController();
    reverseGeocodeCtrlRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 2500);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=de`,
      { signal: ctrl.signal },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        clearTimeout(timer);
        if (cancelled || ctrl.signal.aborted || !data?.address) return;
        const ort = sanitizePlainText(
          data.address.village ||
            data.address.town ||
            data.address.city ||
            data.address.municipality ||
            data.address.suburb ||
            data.address.county ||
            "",
          80,
        );
        const landkreis = sanitizePlainText(
          data.address.county || data.address.municipality || "",
          80,
        );
        const bundesland = sanitizePlainText(data.address.state || "", 80);
        const plz = sanitizePlainText(data.address.postcode || "", 20);

        setLocationMeta({
          ort,
          landkreis,
          bundesland,
          plz,
        });

        if (ort && !nameRef.current.trim()) {
          const generatedName = sanitizePlainText(`Schlag ${ort}`, 80);
          setName(generatedName);
          nameRef.current = generatedName;
        }
      })
      .catch(() => {
        clearTimeout(timer);
      });
  }, []);

  // Initialize map canvas once and clean up all markers on unmount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !container.current) return;
      const start = initial ? centroid(initial) : null;
      const m = new maplibregl.Map({
        container: container.current,
        style: LUFTBILD,
        center: start ? [start.lon, start.lat] : DEUTSCHLAND.center,
        zoom: start ? 15 : DEUTSCHLAND.zoom,
        maxZoom: 22,
        canvasContextAttributes: { preserveDrawingBuffer: true },
        attributionControl: { compact: true },
      });
      attachMapErrorShield(m);
      try {
        m.getCanvas()?.setAttribute("tabindex", "-1");
      } catch {
        // Ignore in headless test mocks
      }
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      m.on("style.load", ebenen);

      // Subtle white hover highlight over official fiboa PMTiles fields
      m.on("mousemove", "fiboa-fields-fill", (e) => {
        if (e.features && e.features.length > 0) {
          m.getCanvas().style.cursor = toolModeRef.current === "split" ? "crosshair" : "pointer";
          const hitProps = e.features[0]?.properties ?? {};
          const fid = String(
            hitProps.id ?? hitProps.flik ?? hitProps.FLIK ?? e.features[0]?.id ?? "__NONE__",
          );
          const hoverFilter = buildFiboaIdFilterExpression(fid === "__NONE__" ? [] : [fid]);
          if (m.getLayer("fiboa-fields-hover")) {
            m.setFilter("fiboa-fields-hover", hoverFilter);
          }
          if (m.getLayer("fiboa-fields-hover-outline")) {
            m.setFilter("fiboa-fields-hover-outline", hoverFilter);
          }
        }
      });

      m.on("mouseleave", "fiboa-fields-fill", () => {
        m.getCanvas().style.cursor = "";
        if (m.getLayer("fiboa-fields-hover")) {
          m.setFilter("fiboa-fields-hover", ["==", ["get", "id"], "__NONE__"]);
        }
        if (m.getLayer("fiboa-fields-hover-outline")) {
          m.setFilter("fiboa-fields-hover-outline", ["==", ["get", "id"], "__NONE__"]);
        }
      });

      m.on("mousemove", (e) => {
        if (toolModeRef.current === "split" && splitPointARef.current) {
          const splitSrc = m.getSource("split-line") as GeoJSONSource | undefined;
          splitSrc?.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: [splitPointARef.current, [e.lngLat.lng, e.lngLat.lat]],
                },
              },
            ],
          });
        }
      });

      m.on("click", (e) => {
        try {
          const lngLat = e.lngLat?.wrap ? e.lngLat.wrap() : e.lngLat;
          const lat = Number(lngLat.lat);
          const lon = Number(lngLat.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

          // 1. Freehand point-by-point polygon drawing mode
          if (customDrawModeRef.current) {
            const nextPts: [number, number][] = [
              ...customPointsRef.current,
              [lon, lat],
            ];
            customPointsRef.current = nextPts;
            setCustomPoints(nextPts);
            fiboaMetaLockedRef.current = false;
            updateSnappedParcelState(null);
            setFehler(null);
            const built = buildPolygonFromPoints(nextPts);
            zeichne(built);
            setFeldVersion((v) => v + 1);
            return;
          }

          // 2. Two-Click Split Mode ("Schlag teilen")
          if (toolModeRef.current === "split" && polygonRef.current) {
            const pt: [number, number] = [lon, lat];
            if (!splitPointARef.current) {
              splitPointARef.current = pt;
              setSplitPointA(pt);
              splitMarkers.current.forEach((mk) => mk.remove());
              const mkA = new maplibregl.Marker({ color: "#c8432b" }).setLngLat(pt).addTo(m);
              splitMarkers.current = [mkA];
              setFehler(null);
              return;
            }

            const pA = splitPointARef.current;
            const pB = pt;
            const partA = clipPolygonByHalfPlane(polygonRef.current, pA, pB, 1);
            const partB = clipPolygonByHalfPlane(polygonRef.current, pA, pB, -1);
            clearSplitLineAndMarkers();

            if (!partA || !partB || areaHa(partA) < 0.01 || areaHa(partB) < 0.01) {
              setFehler(
                "Die Schnittlinie hat den Schlag nicht geteilt. Bitte setze beide Punkte außerhalb oder an gegenüberliegenden Kanten des Schlags.",
              );
              return;
            }

            pushUndo();
            const aHa = Math.round(areaHa(partA) * 10) / 10;
            const bHa = Math.round(areaHa(partB) * 10) / 10;
            const nextSplit: SplitHalfState = {
              partA,
              partB,
              areaA: aHa,
              areaB: bHa,
              activeSide: 1,
            };
            splitStateRef.current = nextSplit;
            setSplitState(nextSplit);
            toolModeRef.current = "single";
            setToolMode("single");
            syncSelectedFiboaHighlight([]);
            anpassenRef.current = true;
            setAnpassen(true);
            zeichne(partA, true);
            setFehler(null);
            setFeldVersion((v) => v + 1);
            return;
          }

          if (mode === "anpassen") return;

          if (m.getZoom() < 12.2) {
            setZoomHinweis(true);
            m.flyTo({ center: [lon, lat], zoom: 15.5 });
            return;
          }
          setZoomHinweis(false);

          const isMergeClick =
            toolModeRef.current === "merge" ||
            Boolean((e.originalEvent as MouseEvent | undefined)?.shiftKey);

          // 3. 0-ms official fiboa PMTiles vector feature lookup directly under cursor
          const trySelectFiboaFeatureAtClick = (): boolean => {
            if (!flurkarteAktivRef.current || !m.getLayer("fiboa-fields-fill") || !e.point) {
              return false;
            }
            const rendered = m.queryRenderedFeatures(e.point, {
              layers: ["fiboa-fields-fill"],
            });
            if (rendered && rendered.length > 0) {
              const hitFeature = rendered[0]!;
              const extracted = extractFiboaFeatureParcel(m, hitFeature);
              if (extracted) {
                const reqId = ++snapRequestIdRef.current;
                setFehler(null);
                applySelectedParcel(extracted, isMergeClick, true);
                triggerReverseGeocode(lat, lon, cancelled);

                // If an adjacent vector tile was still streaming in at the instant of the click,
                // re-stitch when the map reaches idle or sourcedata arrives so multi-tile parcels are 100% complete.
                if (!isMergeClick) {
                  const reStitchIfComplete = () => {
                    if (cancelled || reqId !== snapRequestIdRef.current) return;
                    const reExtracted = extractFiboaFeatureParcel(m, hitFeature);
                    if (
                      reExtracted &&
                      polygonRef.current &&
                      areaHa(reExtracted.polygon) > areaHa(polygonRef.current) * 1.03
                    ) {
                      updateSnappedParcelState(reExtracted);
                      zeichne(reExtracted.polygon);
                      setFeldVersion((v) => v + 1);
                    }
                  };
                  m.once("idle", reStitchIfComplete);
                  setTimeout(reStitchIfComplete, 180);
                  setTimeout(reStitchIfComplete, 550);
                }

                // Also query public geodata / OSM Overpass in the background if the MVT fragment is smaller than 90% of its official metrics:area
                const rawMetricArea = Number(
                  (hitFeature.properties ?? {})["metrics:area"] ??
                    (hitFeature.properties ?? {}).area ??
                    0,
                );
                const expectedOfficialHa =
                  Number.isFinite(rawMetricArea) && rawMetricArea > 0
                    ? rawMetricArea > 500
                      ? rawMetricArea / 10000.0
                      : rawMetricArea
                    : null;
                if (
                  !isMergeClick &&
                  (expectedOfficialHa === null ||
                    areaHa(extracted.polygon) < expectedOfficialHa * 0.92)
                ) {
                  void fetchRealFieldBoundaryAtPoint(lat, lon)
                    .then((lookup) => {
                      if (cancelled || reqId !== snapRequestIdRef.current) return;
                      if (
                        lookup.matched &&
                        polygonRef.current &&
                        areaHa(lookup.matched.polygon) >
                          areaHa(polygonRef.current) * 1.15
                      ) {
                        const fused = stitchPolygonRingsList([
                          polygonRef.current.coordinates[0] ?? [],
                          lookup.matched.polygon.coordinates[0] ?? [],
                        ]);
                        const fullPoly =
                          fused && areaHa(fused) >= areaHa(lookup.matched.polygon)
                            ? fused
                            : lookup.matched.polygon;
                        const fullRing = fullPoly.coordinates[0] ?? [];
                        const nextParcel: RealFieldParcelInfo = {
                          ...extracted,
                          areaHa:
                            expectedOfficialHa !== null && expectedOfficialHa > 0
                              ? Math.round(expectedOfficialHa * 10) / 10
                              : Math.round(areaHa(fullPoly) * 10) / 10,
                          vertexCount: Math.max(0, fullRing.length - 1),
                          polygon: fullPoly,
                        };
                        updateSnappedParcelState(nextParcel);
                        zeichne(fullPoly);
                        setFeldVersion((v) => v + 1);
                      }
                    })
                    .catch(() => {
                      // Ignore background enrichment errors
                    });
                }
                return true;
              }
            }
            return false;
          };

          if (trySelectFiboaFeatureAtClick()) {
            return;
          }

          // 4. Check cached neighbor parcels
          const clickedCachedNeighbor = realNeighborsRef.current.find((np) =>
            isPointInPolygon({ lat, lon }, np.polygon),
          );
          if (clickedCachedNeighbor) {
            snapRequestIdRef.current += 1;
            setFehler(null);
            applySelectedParcel(clickedCachedNeighbor, isMergeClick, false);
            return;
          }

          // 5. Wait briefly for fiboa PMTiles vector tiles if still loading, then query public geodata.
          // Never overwrite an already locked official fiboa selection with a synthetic fallback rectangle.
          const currentReqId = ++snapRequestIdRef.current;
          setFehler(null);
          triggerReverseGeocode(lat, lon, cancelled);

          void (async () => {
            if (!m.loaded()) {
              await new Promise<void>((resolve) => {
                const timeout = setTimeout(resolve, 260);
                m.once("idle", () => {
                  clearTimeout(timeout);
                  resolve();
                });
              });
              if (cancelled || currentReqId !== snapRequestIdRef.current) return;
              if (trySelectFiboaFeatureAtClick()) return;
            }

            const lookup = await fetchRealFieldBoundaryAtPoint(lat, lon);
            if (cancelled || currentReqId !== snapRequestIdRef.current) return;

            if (lookup.matched) {
              syncRealNeighborsLayer(lookup.neighbors);
              applySelectedParcel(lookup.matched, isMergeClick, false);
            } else if (!fiboaMetaLockedRef.current && !polygonRef.current) {
              const fallbackPoly = autoFieldPolygon({ lat, lon });
              const fallbackRing = fallbackPoly.coordinates[0] ?? [];
              const fallbackParcel: RealFieldParcelInfo = {
                id: `local-${Date.now()}`,
                flik: "Manuelle Schlaggrenze",
                sourceLabel: "Satelliten-Schlagabgrenzung (manuell feinjustierbar)",
                landuseLabel: "Ackerland (Farmland)",
                areaHa: Math.round(areaHa(fallbackPoly) * 10) / 10,
                vertexCount: Math.max(0, fallbackRing.length - 1),
                polygon: fallbackPoly,
              };
              syncRealNeighborsLayer(lookup.neighbors);
              applySelectedParcel(fallbackParcel, isMergeClick, false);
            }
          })();
        } catch (err) {
          console.error("[FieldPicker] map click handler error:", err);
          setFehler("Feldgrenze konnte nicht automatisch platziert werden. Bitte tippe erneut.");
        }
      });
      m.once("load", () => setFeldVersion((v) => v + 1));
      map.current = m;
    })();
    return () => {
      cancelled = true;
      reverseGeocodeCtrlRef.current?.abort();
      clearAllMarkers();
      clearSplitLineAndMarkers();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Multi-Vertex Editor: Draggable green corner vertices + Midpoint '+' handles on every edge
  useEffect(() => {
    let cancelled = false;
    clearAllMarkers();

    if (!map.current) return;

    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !map.current) return;

      if (customDrawMode && customPoints.length > 0 && customPoints.length < 3) {
        freehandMarkers.current = customPoints.map((pt, idx) => {
          const el = document.createElement("div");
          el.className =
            "size-5 rounded-full border-[3px] border-white bg-leaf-600 shadow-md cursor-pointer";
          el.title = `Eckpunkt ${idx + 1}`;
          return new maplibregl.Marker({ element: el })
            .setLngLat(pt)
            .addTo(map.current!);
        });
        return;
      }

      if (!anpassen || !polygonRef.current) return;

      const ring = polygonRef.current.coordinates[0]!.slice(0, -1);
      if (ring.length < 3) return;

      markers.current = ring.map((corner, i) => {
        const el = document.createElement("div");
        el.className =
          "size-5 rounded-full border-[3px] border-white bg-leaf-600 shadow-md cursor-grab active:cursor-grabbing";
        el.title = `Eckpunkt ${i + 1} ziehen`;
        el.setAttribute("data-vertex-index", String(i));
        const mk = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat(corner as [number, number])
          .addTo(map.current!);

        mk.on("drag", () => {
          const current = polygonRef.current;
          if (!current) return;
          if (selectedFiboaIdsRef.current.length > 0) {
            syncSelectedFiboaHighlight([]);
          }
          const pos = mk.getLngLat();
          const next = current.coordinates[0]!
            .slice(0, -1)
            .map((c, j) => (j === i ? ([pos.lng, pos.lat] as [number, number]) : c));
          zeichne({ type: "Polygon", coordinates: [[...next, next[0]!]] });
          if (customDrawModeRef.current) {
            customPointsRef.current = next;
            setCustomPoints(next);
          }
          const prevEdgeIdx = (i - 1 + next.length) % next.length;
          const currEdgeIdx = i;
          const nextIdx = (i + 1) % next.length;
          if (midpointMarkers.current[prevEdgeIdx]) {
            midpointMarkers.current[prevEdgeIdx]!.setLngLat(
              computeEdgeMidpoint(next[prevEdgeIdx]!, next[i]!),
            );
          }
          if (midpointMarkers.current[currEdgeIdx]) {
            midpointMarkers.current[currEdgeIdx]!.setLngLat(
              computeEdgeMidpoint(next[i]!, next[nextIdx]!),
            );
          }
        });

        return mk;
      });

      midpointMarkers.current = ring.map((corner, edgeIdx) => {
        const nextCorner = ring[(edgeIdx + 1) % ring.length]!;
        const mid = computeEdgeMidpoint(corner, nextCorner);
        const el = document.createElement("button");
        el.type = "button";
        el.className =
          "flex size-5 items-center justify-center rounded-full border-2 border-white bg-leaf-700/80 text-[11px] font-bold leading-none text-white shadow-sm backdrop-blur-xs hover:bg-leaf-600 cursor-pointer";
        el.textContent = "+";
        el.title = "Zwischenpunkt antippen oder ziehen, um eine neue Ecke einzufügen";
        el.setAttribute("aria-label", `Neuen Eckpunkt auf Kante ${edgeIdx + 1} einfügen`);

        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const current = polygonRef.current;
          if (!current) return;
          pushUndo();
          const updated = insertVertexOnEdge(current, edgeIdx);
          zeichne(updated);
          if (customDrawModeRef.current) {
            const nextPts = updated.coordinates[0]!.slice(0, -1);
            customPointsRef.current = nextPts;
            setCustomPoints(nextPts);
          }
          setFeldVersion((v) => v + 1);
        });

        const midMk = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat(mid)
          .addTo(map.current!);

        midMk.on("dragend", () => {
          const current = polygonRef.current;
          if (!current) return;
          pushUndo();
          const pos = midMk.getLngLat();
          const updated = insertVertexOnEdge(current, edgeIdx, [pos.lng, pos.lat]);
          zeichne(updated);
          if (customDrawModeRef.current) {
            const nextPts = updated.coordinates[0]!.slice(0, -1);
            customPointsRef.current = nextPts;
            setCustomPoints(nextPts);
          }
          setFeldVersion((v) => v + 1);
        });

        return midMk;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anpassen, feldVersion, customDrawMode, customPoints.length]);

  // Fetch 10-year historical weather series (2016 to 2025) whenever a field polygon is active
  useEffect(() => {
    void flushPendingFieldIntakes();
    const activePoly = polygonRef.current;
    if (!activePoly) return;
    const zentrum = centroid(activePoly);
    if (!Number.isFinite(zentrum.lat) || !Number.isFinite(zentrum.lon)) return;
    let active = true;
    const ctrl = new AbortController();
    void fetchFieldWeatherHistory10Y(zentrum.lat, zentrum.lon, ctrl.signal).then((history) => {
      if (active && !ctrl.signal.aborted) {
        setWeatherHistory(history);
      }
    });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [feldVersion]);

  function toggleFlurkarte(): void {
    const next = !flurkarteAktivRef.current;
    flurkarteAktivRef.current = next;
    setFlurkarteAktiv(next);
    const m = map.current;
    if (!m) return;
    const vis = next ? "visible" : "none";
    [
      "fiboa-fields-fill",
      "fiboa-fields-hover",
      "fiboa-fields-hover-outline",
      "fiboa-fields-outline",
      "fiboa-fields-selected-fill",
      "fiboa-fields-selected-outline",
    ].forEach((layerId) => {
      if (m.getLayer(layerId)) {
        m.setLayoutProperty(layerId, "visibility", vis);
      }
    });
    const src = m.getSource("flurkarte-parcels") as GeoJSONSource | undefined;
    if (src) {
      src.setData(
        next && realNeighborsRef.current.length > 0
          ? buildRealNeighborsFeatureCollection(realNeighborsRef.current)
          : { type: "FeatureCollection", features: [] },
      );
    }
  }

  function wechsleWerkzeugModus(nextMode: FieldEditToolMode): void {
    const target = toolModeRef.current === nextMode ? "single" : nextMode;
    toolModeRef.current = target;
    setToolMode(target);
    clearSplitLineAndMarkers();
    setFehler(null);
  }

  function wechselSpaltHaelfte(): void {
    const st = splitStateRef.current;
    if (!st) return;
    pushUndo();
    const nextSide: 1 | -1 = st.activeSide === 1 ? -1 : 1;
    const updated: SplitHalfState = { ...st, activeSide: nextSide };
    splitStateRef.current = updated;
    setSplitState(updated);
    zeichne(nextSide === 1 ? updated.partA : updated.partB);
    setFeldVersion((v) => v + 1);
  }

  function aktionRueckgaengig(): void {
    if (customDrawModeRef.current && customPointsRef.current.length > 0) {
      const nextPts = customPointsRef.current.slice(0, -1);
      customPointsRef.current = nextPts;
      setCustomPoints(nextPts);
      const built = buildPolygonFromPoints(nextPts);
      zeichne(built);
      setFeldVersion((v) => v + 1);
      return;
    }

    if (undoStackRef.current.length > 0) {
      const prev = undoStackRef.current[undoStackRef.current.length - 1]!;
      const rest = undoStackRef.current.slice(0, -1);
      undoStackRef.current = rest;
      setUndoStack(rest);
      mergedCountRef.current = prev.mergedCount;
      setMergedCount(prev.mergedCount);
      splitStateRef.current = prev.splitState;
      setSplitState(prev.splitState);
      updateSnappedParcelState(prev.snappedParcel);
      clearSplitLineAndMarkers();
      zeichne(prev.polygon);
      setFeldVersion((v) => v + 1);
      return;
    }

    const current = polygonRef.current;
    if (!current) return;
    const ring = current.coordinates[0]!.slice(0, -1);
    if (ring.length <= 3) {
      setFehler("Ein Schlag benötigt mindestens 3 Eckpunkte.");
      return;
    }
    const nextRing = ring.slice(0, -1);
    zeichne({
      type: "Polygon",
      coordinates: [[...nextRing, nextRing[0]!]],
    });
    setFeldVersion((v) => v + 1);
  }

  function starteFreiesZeichnen(): void {
    customDrawModeRef.current = true;
    setCustomDrawMode(true);
    customPointsRef.current = [];
    setCustomPoints([]);
    toolModeRef.current = "single";
    setToolMode("single");
    clearSplitLineAndMarkers();
    fiboaMetaLockedRef.current = false;
    syncSelectedFiboaHighlight([]);
    updateSnappedParcelState(null);
    anpassenRef.current = true;
    setAnpassen(true);
    zeichne(null, true);
    setFehler(null);
    setFeldVersion((v) => v + 1);
  }

  function beendeFreiesZeichnen(): void {
    customDrawModeRef.current = false;
    setCustomDrawMode(false);
    setFeldVersion((v) => v + 1);
  }

  function fuegeZwischenpunktHinzu(): void {
    const current = polygonRef.current;
    if (!current) return;
    pushUndo();
    const updated = insertVertexOnEdge(current, 0);
    anpassenRef.current = true;
    setAnpassen(true);
    zeichne(updated, true);
    setFeldVersion((v) => v + 1);
  }

  function dispatchFieldIntake(
    stage: "field_selected" | "soil_adjusted",
    overrides?: {
      fieldIdOverride?: string;
      soilTypeOverride?: SoilTypeOption;
      ackerzahlOverride?: number;
      irrigatedOverride?: boolean;
      trafficabilityOverride?: TrafficabilityOption;
      soilOverridden?: boolean;
    },
  ): void {
    const p = polygonRef.current;
    if (!p) return;
    const c = centroid(p);
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) return;
    const nextSoil = overrides?.soilTypeOverride ?? soilType;
    const nextAz = overrides?.ackerzahlOverride ?? ackerzahl;
    const nextIrr = overrides?.irrigatedOverride ?? irrigationPossible;
    const nextTraff = overrides?.trafficabilityOverride ?? trafficability;
    const isCold =
      nextTraff === "spaet" ||
      weatherHistory.siteCharacter.primaryBadge === "Kühle Höhen- oder Spätfrostlage";

    const officialArea =
      !anpassenRef.current &&
      snappedParcelRef.current?.areaHa &&
      snappedParcelRef.current.areaHa > 0
        ? snappedParcelRef.current.areaHa
        : Math.round(areaHa(p) * 10) / 10;

    void submitFieldIntake({
      field_id: overrides?.fieldIdOverride ?? fieldId,
      fiboa_id: snappedParcelRef.current?.flik ?? null,
      collection: snappedParcelRef.current?.sourceLabel ?? "fiboa / InVeKoS",
      polygon_geojson: p,
      area_ha: officialArea,
      perimeter_m: computePolygonPerimeterMeters(p),
      lat: c.lat,
      lon: c.lon,
      elevation_m: weatherHistory.elevationM,
      soil_type: nextSoil,
      ackerzahl: nextAz,
      farmer_soil_override: overrides?.soilOverridden ?? farmerSoilOverride,
      irrigated: nextIrr,
      cold_site: isCold,
      weather_summary: {
        avg_precip_total_mm: weatherHistory.avgPrecipTotalMm,
        avg_precip_veg_mm: weatherHistory.avgPrecipVegMm,
        avg_precip_flowering_mm: weatherHistory.avgPrecipFloweringMm,
        avg_effective_precip_veg_mm: weatherHistory.avgEffectivePrecipVegMm,
        avg_gdd: weatherHistory.avgGrowingDegreeDays,
        drought_years_count: weatherHistory.droughtYearsCount,
        site_badge: weatherHistory.siteCharacter.primaryBadge,
      },
      stage,
    });
  }

  function handleSoilTypeChange(nextSoil: SoilTypeOption): void {
    const meta = SOIL_TYPE_LABELS[nextSoil];
    setSoilType(nextSoil);
    setNfkMm(meta.defaultNfkMm);
    const defaultAz =
      nextSoil === "sand"
        ? 34
        : nextSoil === "sandiger_lehm"
          ? 58
          : nextSoil === "lehm"
            ? 74
            : nextSoil === "toniger_lehm"
              ? 68
              : 45;
    setAckerzahl(defaultAz);
    setFarmerSoilOverride(true);
    dispatchFieldIntake("soil_adjusted", {
      soilTypeOverride: nextSoil,
      ackerzahlOverride: defaultAz,
      soilOverridden: true,
    });
  }

  async function fuehreSucheAus(): Promise<void> {
    const q = suche.trim();
    if (q.length < 2) return;

    const offlinePlz = lookupPlzOffline(q);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=de&limit=5&accept-language=de&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        if (offlinePlz) {
          setTreffer([
            {
              label: `${offlinePlz.plz} ${offlinePlz.city} (${offlinePlz.bundesland})`,
              lat: offlinePlz.lat,
              lon: offlinePlz.lon,
            },
          ]);
        }
        return;
      }
      const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      if (Array.isArray(data) && data.length > 0) {
        setTreffer(
          data.map((d) => ({
            label: d.display_name.split(",").slice(0, 3).join(","),
            lat: Number(d.lat),
            lon: Number(d.lon),
          })),
        );
      } else if (offlinePlz) {
        setTreffer([
          {
            label: `${offlinePlz.plz} ${offlinePlz.city} (${offlinePlz.bundesland})`,
            lat: offlinePlz.lat,
            lon: offlinePlz.lon,
          },
        ]);
      }
    } catch {
      clearTimeout(timer);
      if (offlinePlz) {
        setTreffer([
          {
            label: `${offlinePlz.plz} ${offlinePlz.city} (${offlinePlz.bundesland})`,
            lat: offlinePlz.lat,
            lon: offlinePlz.lon,
          },
        ]);
      }
    }
  }

  // Flying to a location only zooms the camera to the official fiboa field layer
  // and NEVER places a synthetic backup rectangle over the map.
  function geheZu(lat: number, lon: number, zoom = 15.5): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    snapRequestIdRef.current += 1;
    map.current?.flyTo({ center: [lon, lat], zoom });
    setTreffer([]);
  }

  function meinStandort(): void {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setFehler(
        "Standortermittlung wird von deinem Browser nicht unterstützt. Bitte nutze die Ortssuche.",
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => geheZu(pos.coords.latitude, pos.coords.longitude, 15.5),
      () => setFehler("Dein Standort ist nicht freigegeben. Such einfach nach deinem Ort."),
      { timeout: 10000, enableHighAccuracy: false },
    );
  }

  function wechsleKartenModus(nextMode: "satellit" | "karte"): void {
    setMapMode(nextMode);
    const m = map.current;
    if (!m) return;
    m.setStyle(nextMode === "satellit" ? LUFTBILD : KARTE);
    m.once("style.load", () => {
      ebenen();
      setFeldVersion((v) => v + 1);
    });
  }

  async function weiter(): Promise<void> {
    const p = polygonRef.current;
    if (!p) {
      setFehler("Bitte tippe zuerst auf die Karte, um dein Feld auszuwählen.");
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    setFehler(null);
    try {
      const c = centroid(p);
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) {
        setFehler("Ungültige Koordinaten für das gewählte Feld. Bitte tippe erneut auf die Karte.");
        setIsSaving(false);
        return;
      }
      const fieldName = name.trim() || undefined;
      const res =
        mode === "neu"
          ? await fetch("/api/v1/fields", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ lat: c.lat, lon: c.lon, name: fieldName, geometry: p }),
            })
          : await fetch(`/api/v1/fields/${fieldId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ geometry: p, name: fieldName }),
            });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const rawErr = typeof data?.fehler === "string" ? sanitizePlainText(data.fehler, 140) : "";
        const isSafeUserMsg =
          rawErr.length > 0 &&
          !rawErr.includes("http://") &&
          !rawErr.includes("https://") &&
          !rawErr.includes("/Users/") &&
          !rawErr.includes("node_modules");
        setFehler(
          isSafeUserMsg
            ? rawErr
            : "Das Feld konnte nicht gespeichert werden. Bitte versuche es erneut.",
        );
        setIsSaving(false);
        return;
      }
      if (mode === "neu") {
        if (!data?.feld?.id) {
          setFehler(
            "Feld wurde angelegt, aber es konnte keine ID ermittelt werden. Bitte lade die Seite neu.",
          );
          setIsSaving(false);
          return;
        }
        // Persist any expert site adjustments into the field agronomy profile store
        const targetId = String(data.feld.id);
        const existingProfile = loadFieldAgronomyProfile(targetId, "silomais");
        saveFieldAgronomyProfile({
          ...existingProfile,
          fieldId: targetId,
          soilType,
          humusPercent: SOIL_TYPE_LABELS[soilType].defaultHumus,
          nfkMm,
          trafficability,
          irrigationPossible,
        });
        dispatchFieldIntake("field_selected", { fieldIdOverride: targetId });
        router.push(`/feld/${targetId}/anbau`);
      } else {
        if (fieldId) {
          const existingProfile = loadFieldAgronomyProfile(fieldId, "silomais");
          saveFieldAgronomyProfile({
            ...existingProfile,
            fieldId,
            soilType,
            humusPercent: SOIL_TYPE_LABELS[soilType].defaultHumus,
            nfkMm,
            trafficability,
            irrigationPossible,
          });
          dispatchFieldIntake("field_selected", { fieldIdOverride: fieldId });
        }
        router.push(`/feld/${fieldId}`);
      }
    } catch (err) {
      console.error("[FieldPicker] weiter() failed:", err);
      setFehler("Netzwerkfehler beim Speichern. Bitte prüfe deine Verbindung und versuche es erneut.");
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  }

  const ha = polygon
    ? !anpassen && snappedParcel?.areaHa && snappedParcel.areaHa > 0
      ? snappedParcel.areaHa
      : areaHa(polygon)
    : 0;
  const perimeterM = polygon ? computePolygonPerimeterMeters(polygon) : 0;
  const vertexCount = polygon ? Math.max(0, polygon.coordinates[0]!.length - 1) : customPoints.length;
  const isSelfIntersecting = polygon ? hasSelfIntersection(polygon) : false;
  const trockenstressRisiko = deriveSiteDroughtRiskLevel(weatherHistory, nfkMm);
  const soilMeta = SOIL_TYPE_LABELS[soilType];
  const standortDisplay = locationMeta
    ? [
        locationMeta.plz ? `${locationMeta.plz} ${locationMeta.ort}` : locationMeta.ort,
        locationMeta.landkreis,
        locationMeta.bundesland,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Standort aus Schlagkoordinate";

  return (
    <div className="space-y-4">
      <div className="relative isolate overflow-hidden rounded-card border border-control">
        <div
          ref={container}
          data-spross-target="field-map"
          className="relative h-[56vh] min-h-[340px] w-full bg-data-track"
        />

        {mode === "neu" ? (
          <div className="absolute left-3 right-14 top-3 z-40 sm:right-auto sm:w-96">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fuehreSucheAus();
              }}
              className="flex items-center gap-1 rounded-panel border border-control bg-surface pl-2 pr-1"
            >
              <button
                type="submit"
                aria-label="Ort suchen"
                className="flex size-9 items-center justify-center rounded-control text-fg-muted hover:text-link"
              >
                <Search className="size-4 shrink-0" aria-hidden="true" />
              </button>
              <input
                data-spross-target="ort-search"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void fuehreSucheAus();
                  }
                }}
                placeholder="Ort oder Postleitzahl"
                aria-label="Ort suchen"
                className="h-11 min-w-0 flex-1 bg-transparent text-body text-fg outline-none"
              />
              <button
                type="button"
                onClick={meinStandort}
                aria-label="Mein Standort"
                className="flex size-9 items-center justify-center rounded-control text-link hover:bg-action-subtle"
              >
                <LocateFixed className="size-4" aria-hidden="true" />
              </button>
            </form>
            {treffer.length > 0 ? (
              <ul className="mt-2 divide-y divide-divider overflow-hidden rounded-panel border border-control bg-surface">
                {treffer.map((t) => (
                  <li key={`${t.lat},${t.lon}`}>
                    <button
                      type="button"
                      onClick={() => geheZu(t.lat, t.lon)}
                      className="flex min-h-touch w-full items-center gap-2 px-3 py-2.5 text-left text-small text-fg hover:bg-highlight"
                    >
                      <MapPin className="size-4 shrink-0 text-link" aria-hidden="true" /> {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {/* Satellite / Map view switcher, Official fiboa PMTiles Feldkarte toggle & boundary orientation notice */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1 rounded-panel border border-control bg-surface p-1">
              <button
                type="button"
                onClick={() => wechsleKartenModus("satellit")}
                aria-pressed={mapMode === "satellit"}
                className={`inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-small font-semibold transition-colors cursor-pointer ${
                  mapMode === "satellit"
                    ? "bg-selected text-on-selected"
                    : "text-fg hover:bg-highlight"
                }`}
              >
                <Layers className="size-3.5" aria-hidden="true" />
                Satellit
              </button>
              <button
                type="button"
                onClick={() => wechsleKartenModus("karte")}
                aria-pressed={mapMode === "karte"}
                className={`inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-small font-semibold transition-colors cursor-pointer ${
                  mapMode === "karte"
                    ? "bg-selected text-on-selected"
                    : "text-fg hover:bg-highlight"
                }`}
              >
                Karte
              </button>
            </div>

            <button
              type="button"
              data-testid="flurkarte-toggle-btn"
              onClick={toggleFlurkarte}
              aria-pressed={flurkarteAktiv}
              className={`inline-flex h-11 items-center gap-1.5 rounded-panel border px-3.5 text-small font-semibold transition-colors cursor-pointer ${
                flurkarteAktiv
                  ? "border-selected bg-selected text-on-selected"
                  : "border-control bg-surface text-fg hover:bg-highlight"
              }`}
            >
              <Grid className="size-3.5" aria-hidden="true" />
              <span>{flurkarteAktiv ? "Feldkarte / Schläge an" : "Feldkarte / Schläge aus"}</span>
            </button>
          </div>

          <div className="pointer-events-auto rounded-panel border border-control bg-surface px-3 py-1.5 text-caption font-medium text-fg">
            {customDrawMode
              ? `Freies Zeichnen aktiv (${customPoints.length} ${customPoints.length === 1 ? "Punkt" : "Punkte"} gesetzt, mindestens 3 für Fläche)`
              : toolMode === "split"
                ? splitPointA
                  ? "Schlag teilen (Schritt 2/2): Zweiten Punkt auf der gegenüberliegenden Kante antippen"
                  : "Schlag teilen (Schritt 1/2): Ersten Schnittpunkt am Feldrand antippen"
                : toolMode === "merge"
                  ? "Nachbarschlag dazunehmen aktiv: Weiteren angrenzenden Schlag auf der Karte antippen"
                  : polygon
                    ? anpassen
                      ? `${vertexCount} Eckpunkte aktiv · Grüne Punkte ziehen oder „+“ auf Kante für mehr Ecken`
                      : "Amtlicher Schlag ausgewählt · Klicke unten auf „Grenze anpassen“ für Korrekturen"
                    : "Feldgrenzen-Orientierung aktiv · 1-Klick Ackerschlag-Snap"}
          </div>
        </div>
      </div>

      {/* Self-intersection warning banner */}
      {isSelfIntersecting ? (
        <div
          role="alert"
          data-testid="self-intersection-warning"
          className="flex items-start gap-2.5 border-l-4 border-status-problem py-1 pl-3 text-small font-semibold text-status-problem-text"
        >
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-status-problem" aria-hidden="true" />
          <span>
            Hinweis: Zwei Feldlinien überkreuzen sich. Bitte zieh den Eckpunkt wieder nach außen.
          </span>
        </div>
      ) : null}

      {/* Multi-Vertex Toolbar when custom drawing is active */}
      {customDrawMode && !polygon ? (
        <div className="border-t border-divider pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-measure text-body text-fg">
              <strong className="font-semibold">Punkte selbst setzen:</strong> Tippe
              nacheinander die Ecken deines Schlags auf der Karte ab ({customPoints.length} von mindestens 3
              Ecken gesetzt).
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={customPoints.length === 0}
                onClick={aktionRueckgaengig}
                className={buttonClass("secondary", "sm")}
              >
                <Undo2 className="size-3.5" aria-hidden="true" /> Letzten Punkt rückgängig
              </button>
              <button
                type="button"
                onClick={beendeFreiesZeichnen}
                className={buttonClass("quiet", "sm")}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" /> Abbrechen
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {polygon ? (
        <div className="space-y-4 pt-1">
          {/* 1. Right-aligned compact map editing toolbar directly under the bottom-right corner of the map */}
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              data-testid="merge-neighbor-btn"
              onClick={() => wechsleWerkzeugModus("merge")}
              aria-pressed={toolMode === "merge"}
              className={`inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                toolMode === "merge"
                  ? "bg-selected text-on-selected ring-selected"
                  : "bg-surface text-fg ring-control hover:bg-highlight"
              }`}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Nachbarschlag dazunehmen</span>
            </button>

            <button
              type="button"
              data-testid="split-field-btn"
              onClick={() => wechsleWerkzeugModus("split")}
              aria-pressed={toolMode === "split"}
              className={`inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                toolMode === "split"
                  ? "bg-selected text-on-selected ring-selected"
                  : "bg-surface text-fg ring-control hover:bg-highlight"
              }`}
            >
              <Scissors className="size-3.5" aria-hidden="true" />
              <span>Schlag teilen</span>
            </button>

            {splitState ? (
              <button
                type="button"
                data-testid="swap-split-half-btn"
                onClick={wechselSpaltHaelfte}
                className={buttonClass("secondary", "sm")}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>
                  Andere Hälfte wählen (
                  {num(splitState.activeSide === 1 ? splitState.areaB : splitState.areaA)} ha)
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                const next = !anpassenRef.current;
                anpassenRef.current = next;
                setAnpassen(next);
                zeichne(polygonRef.current, next);
              }}
              aria-pressed={anpassen}
              className={`inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                anpassen
                  ? "bg-selected text-on-selected ring-selected"
                  : "bg-surface text-fg ring-control hover:bg-highlight"
              }`}
            >
              <Pencil className="size-3.5" aria-hidden="true" />{" "}
              {anpassen ? "Grenze anpassen (aktiv)" : "Grenze anpassen"}
            </button>

            {anpassen ? (
              <button
                type="button"
                onClick={fuegeZwischenpunktHinzu}
                className={buttonClass("secondary", "sm")}
                title="Weiteren Eckpunkt auf der Kante einfügen"
              >
                <Plus className="size-3.5" aria-hidden="true" /> Eckpunkt einfügen
              </button>
            ) : null}

            <button
              type="button"
              onClick={starteFreiesZeichnen}
              className="inline-flex h-9 items-center gap-1.5 rounded-control bg-surface px-3 text-caption font-semibold text-fg ring-1 ring-inset ring-control transition-colors hover:bg-highlight cursor-pointer"
            >
              <span>Eckpunkte neu antippen</span>
            </button>

            {undoStack.length > 0 || vertexCount > 3 ? (
              <button
                type="button"
                data-testid="undo-field-action-btn"
                onClick={aktionRueckgaengig}
                className="inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-caption font-semibold text-fg-muted transition-colors hover:bg-highlight hover:text-fg cursor-pointer"
              >
                <Undo2 className="size-3.5" aria-hidden="true" /> Rückgängig
              </button>
            ) : null}
          </div>

          {/* 2. Ultra-Lean Primary Flow Card: Hectares + Optional Name + Immediate Primary CTA Button */}
          <div
            data-testid="real-field-info-panel"
            className="rounded-panel border border-control bg-surface p-5 space-y-5"
          >
            {!isBackendConnected && weatherHistory.source !== "backend-live" ? (
              <div
                role="alert"
                data-testid="backend-disconnected-red-alert"
                className="flex items-center gap-2.5 rounded-control border-2 border-[#e05a47] bg-[#fdf2f0] px-3.5 py-2.5 text-small font-bold text-[#b42318]"
              >
                <AlertTriangle className="size-4 shrink-0 text-[#b42318]" aria-hidden="true" />
                <span>
                  Kein Backend verbunden · Klickdummy zeigt aktuell Demo- und Schätzwerte
                </span>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-small text-fg-muted">
                  <span>
                    Dein Feld ·{" "}
                    <span className="font-semibold text-fg tabular-nums">{vertexCount} Eckpunkte</span>
                    {mergedCount > 1 ? (
                      <span className="ml-2 font-semibold text-fg tabular-nums">
                        · {mergedCount} Teilflächen kombiniert
                      </span>
                    ) : null}
                  </span>
                  {snappedParcel ? (
                    <span
                      data-testid="snapped-flik-badge"
                      className="inline-flex items-center gap-1 text-caption font-semibold text-link tabular-nums"
                    >
                      <Check className="size-3.5" aria-hidden="true" />
                      <span>{snappedParcel.sourceLabel}</span>
                    </span>
                  ) : null}
                </div>

                <div className="text-figure-l text-fg tabular-nums">
                  ≈ {num(ha)} ha{" "}
                  <span className="text-small font-normal tracking-normal text-fg-muted">
                    · {standortDisplay}
                  </span>
                </div>

                {zoomHinweis ? (
                  <p className="text-small text-fg-muted">Zoom ruhig näher ran und prüf die Grenze.</p>
                ) : null}
              </div>

              <label className="block w-full lg:max-w-xs">
                <span className="block text-small font-semibold text-fg">
                  Wie nennst du das Feld? (freiwillig)
                </span>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    nameRef.current = e.target.value;
                  }}
                  placeholder="z. B. Großer Schlag"
                  maxLength={80}
                  className="mt-1.5 h-control w-full rounded-control border border-control bg-canvas px-3 text-body text-fg"
                />
              </label>
            </div>

            {/* Primary Main Action Button directly underneath the hectare display */}
            <div className="pt-1">
              <Button onClick={weiter} disabled={busy} className="w-full sm:w-auto">
                {busy
                  ? "Wird gespeichert …"
                  : mode === "neu"
                    ? "Feld übernehmen und Kultur wählen · Weiter mit diesem Feld"
                    : "Grenze speichern"}
              </Button>
            </div>

            {/* 3. Calm Collapsed Disclosure Bar for Site Profile & 10-Year Weather */}
            <div className="flex flex-wrap items-center gap-2.5 border-t border-divider pt-4">
              <button
                type="button"
                data-testid="toggle-field-steckbrief-btn"
                aria-expanded={steckbriefOpen}
                onClick={() => setSteckbriefOpen((o) => !o)}
                className={buttonClass("secondary", "sm")}
              >
                {steckbriefOpen ? (
                  <ChevronUp className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4" aria-hidden="true" />
                )}
                <span>
                  Standortwerte und Bodenprofil aufklappen (Bodenart · Ackerzahl · Höhenlage)
                </span>
              </button>

              <button
                type="button"
                data-testid="toggle-field-weather-10y-btn"
                aria-expanded={weather10YOpen}
                onClick={() => setWeather10YOpen((o) => !o)}
                className={buttonClass("secondary", "sm")}
              >
                <CloudRain className="size-4 text-rain" aria-hidden="true" />
                <span>10 Jahre Schlagwetter und Klimamodelle aufklappen (2016 bis 2025)</span>
                {weather10YOpen ? (
                  <ChevronUp className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* 10-Year Historical Field Weather Breakdown (2016 to 2025) */}
            {weather10YOpen ? (
              <div
                data-testid="field-weather-10y-section"
                className="space-y-5 border-t border-rule pt-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-subheading text-fg">
                      10 Jahre Schlagwetter auf deinem Feld (2016 bis 2025)
                    </h3>
                    <p className="max-w-measure text-small text-fg-muted">
                      Echte mehrjährige Wetterreihe für deinen Schlag mit Jahresniederschlag,
                      Sommerregen von Mai bis September, Wärmesumme und Trockenjahren.
                    </p>
                  </div>
                  <span className="text-caption font-semibold text-link tabular-nums">
                    {weatherHistory.source === "backend-live"
                      ? "Live Backend & Wetterarchiv 2016 bis 2025"
                      : weatherHistory.source === "dwd-era5-live"
                        ? "Live Wetterarchiv 2016 bis 2025"
                        : "Standort Klimareihe 2016 bis 2025 (Fallback)"}
                  </span>
                </div>

                {/* 4 Key Metric Cards (10-Year Average 2016 to 2025) */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-panel border border-control bg-canvas p-3.5">
                    <div className="flex items-center gap-1.5 text-caption font-semibold text-fg-muted">
                      <CloudRain className="size-3.5 text-rain" aria-hidden="true" />
                      <span>Ø Jahresregen (2016 bis 2025)</span>
                    </div>
                    <div className="mt-1 text-figure-m text-fg tabular-nums">
                      {weatherHistory.avgPrecipTotalMm} mm
                    </div>
                    <div className="mt-0.5 text-caption text-fg-muted tabular-nums">
                      Mai bis Sept: {weatherHistory.avgPrecipVegMm} mm (pflanzenverfügbar{" "}
                      {weatherHistory.avgEffectivePrecipVegMm} mm · Blüteregen Juli{" "}
                      {weatherHistory.avgPrecipFloweringMm} mm)
                    </div>
                  </div>

                  <div className="rounded-panel border border-control bg-canvas p-3.5">
                    <div className="flex items-center gap-1.5 text-caption font-semibold text-fg-muted">
                      <Sun className="size-3.5 text-sunshine" aria-hidden="true" />
                      <span>Ø Temperatur Jahr (2016 bis 2025)</span>
                    </div>
                    <div className="mt-1 text-figure-m text-fg tabular-nums">
                      {num(weatherHistory.avgTempMeanC, 1)} °C
                    </div>
                    <div className="mt-0.5 text-caption text-fg-muted tabular-nums">
                      Mai bis Sept: {num(weatherHistory.avgTempVegMeanC, 1)} °C
                    </div>
                  </div>

                  <div className="rounded-panel border border-control bg-canvas p-3.5">
                    <div className="text-caption font-semibold text-fg-muted">
                      Ø Mais Wärmesumme (Apr bis Okt)
                    </div>
                    <div className="mt-1 text-figure-m text-fg tabular-nums">
                      {num(weatherHistory.avgGrowingDegreeDays, 0)} °Cd
                    </div>
                    <div className="mt-0.5 text-caption text-fg-muted">
                      Wärmeangebot für sichere Abreife
                    </div>
                  </div>

                  <div className="rounded-panel border border-control bg-canvas p-3.5">
                    <div className="text-caption font-semibold text-fg-muted">
                      Trockenjahre &amp; Hitzetage (≥ 30 °C)
                    </div>
                    <div className="mt-1 text-figure-m text-fg tabular-nums">
                      {weatherHistory.droughtYearsCount} von 10 Jahren
                    </div>
                    <div className="mt-0.5 text-caption text-fg-muted tabular-nums">
                      Ø {weatherHistory.avgHotDays30C} Hitzetage ab 30 °C pro Jahr
                    </div>
                  </div>
                </div>

                {/* Block A: Site Character of this Field (4 Agronomic Traits) */}
                <div
                  data-testid="field-site-character-box"
                  className="rounded-panel border border-rule bg-surface p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-small font-bold text-fg">
                          Standort-Charakter deines Schlags
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-control px-2.5 py-0.5 text-caption font-semibold ${
                            weatherHistory.siteCharacter.primaryBadge === "Trockenstress-Standort" ||
                            weatherHistory.siteCharacter.primaryBadge ===
                              "Kühle Höhen- oder Spätfrostlage"
                              ? "bg-status-problem/15 text-status-problem-text"
                              : "bg-selected text-on-selected"
                          }`}
                        >
                          {weatherHistory.siteCharacter.primaryBadge}
                        </span>
                      </div>
                      <p className="text-body font-semibold text-fg">
                        {weatherHistory.siteCharacter.headline}
                      </p>
                    </div>
                    <div className="rounded-control border border-control bg-canvas px-3 py-1.5 text-caption font-semibold text-link tabular-nums">
                      Empfohlene Reife: {weatherHistory.siteCharacter.recommendedMaturityRange}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {weatherHistory.siteCharacter.traits.map((trait) => (
                      <div
                        key={trait.id}
                        className="rounded-panel border border-control bg-canvas p-3.5 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-caption font-bold text-fg">{trait.label}</span>
                          <span
                            className={`text-caption font-semibold ${
                              trait.tone === "warning"
                                ? "text-status-problem-text"
                                : trait.tone === "positive"
                                  ? "text-link"
                                  : "text-fg-muted"
                            }`}
                          >
                            {trait.statusLabel}
                          </span>
                        </div>
                        <div className="text-small font-semibold text-fg tabular-nums">
                          {trait.metricValue}
                        </div>
                        <p className="text-caption text-fg-muted">{trait.farmerAdvice}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-divider bg-canvas px-3.5 py-2.5 text-caption text-fg">
                    <span className="font-semibold">{weatherHistory.diseasePressureHint}</span>
                    <span className="font-semibold text-fg-muted tabular-nums">
                      Blüteregen Juli: Ø {weatherHistory.avgPrecipFloweringMm} mm ·
                      Pflanzenverfügbarer Sommerregen: Ø {weatherHistory.avgEffectivePrecipVegMm} mm
                    </span>
                  </div>
                </div>

                {/* Block B: Climate Outlook for the Next Cultivation Year (5 Models Compared) */}
                <div
                  data-testid="field-climate-outlook-box"
                  className="rounded-panel border border-rule bg-surface p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-small font-bold text-fg">
                          Klima-Ausblick für das nächste Anbaujahr (5 Modelle im Vergleich)
                        </h4>
                        <span className="rounded-control border border-control bg-canvas px-2.5 py-0.5 text-caption font-semibold text-link tabular-nums">
                          Ernte {weatherHistory.climateOutlookNextYear.targetYear}
                        </span>
                      </div>
                      <p className="text-body font-semibold text-fg">
                        {weatherHistory.climateOutlookNextYear.consensusHeadline}
                      </p>
                      <p className="max-w-measure text-small text-fg-muted">
                        {weatherHistory.climateOutlookNextYear.consensusAdvice}
                      </p>
                    </div>
                    <div className="rounded-control border border-control bg-canvas px-3 py-1.5 text-caption font-semibold text-fg tabular-nums">
                      Modellmittel: +{num(weatherHistory.climateOutlookNextYear.avgTempDeltaC, 1)} °C ·{" "}
                      {weatherHistory.climateOutlookNextYear.avgSummerPrecipTrendPct < 0
                        ? `Sommerregen minus ${Math.abs(weatherHistory.climateOutlookNextYear.avgSummerPrecipTrendPct)} %`
                        : `Sommerregen +${weatherHistory.climateOutlookNextYear.avgSummerPrecipTrendPct} %`}
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                    {weatherHistory.climateOutlookNextYear.models.map((m) => (
                      <div
                        key={m.modelId}
                        className="flex flex-col justify-between rounded-panel border border-control bg-canvas p-3 space-y-2"
                      >
                        <div className="space-y-1">
                          <div className="text-caption font-bold text-fg">{m.modelName}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-small font-bold text-fg tabular-nums">
                            <span>+{num(m.tempDeltaC, 1)} °C</span>
                            <span>·</span>
                            <span>
                              {m.summerPrecipTrendPct < 0
                                ? `minus ${Math.abs(m.summerPrecipTrendPct)} %`
                                : `+${m.summerPrecipTrendPct} %`}{" "}
                              Regen
                            </span>
                          </div>
                        </div>

                        <p className="text-caption text-fg-muted">{m.seasonSummary}</p>

                        <div className="border-t border-divider pt-1.5 text-[11px] font-semibold tabular-nums">
                          <span className="text-fg-muted">Trockenstress-Risiko: </span>
                          <span
                            className={
                              m.droughtRiskLevel === "Erhöht"
                                ? "text-status-problem-text"
                                : m.droughtRiskLevel === "Mittel"
                                  ? "text-fg"
                                  : "text-link"
                            }
                          >
                            {m.droughtRiskLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual 10-Year Column Chart (2016 to 2025 side by side) */}
                <div className="rounded-panel border border-control bg-canvas p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-small font-semibold text-fg">
                      Jahresverlauf 2016 bis 2025 (Gesamtregen, Sommerregen Mai bis Sept und Temperatur)
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-caption text-fg-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-control bg-data" />
                        <span>Normal oder feuchtes Jahr</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-control bg-status-problem" />
                        <span>Trockenjahr</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 pt-2 sm:grid-cols-10">
                    {weatherHistory.years.map((yr) => {
                      const maxScaleMm = Math.max(
                        950,
                        ...weatherHistory.years.map((item) => item.precipTotalMm),
                      );
                      const totalHeightPct = Math.max(
                        18,
                        Math.min(100, Math.round((yr.precipTotalMm / maxScaleMm) * 100)),
                      );
                      const vegSharePct = Math.max(
                        20,
                        Math.min(100, Math.round((yr.precipVegMm / Math.max(1, yr.precipTotalMm)) * 100)),
                      );
                      const isDrought = yr.yearType === "Trockenjahr";

                      return (
                        <div
                          key={yr.year}
                          className="flex flex-col items-center rounded-control border border-divider bg-surface p-2 text-center"
                        >
                          <div className="text-caption font-bold text-fg tabular-nums">
                            {yr.year}
                          </div>
                          <div className="text-caption text-fg-muted tabular-nums">
                            {num(yr.tempMeanC, 1)} °C
                          </div>

                          <div className="my-2 flex h-24 w-full items-end justify-center rounded-control bg-data-track p-1">
                            <div
                              style={{ height: `${totalHeightPct}%` }}
                              className={`relative flex w-full items-end overflow-hidden rounded-control ${
                                isDrought ? "bg-status-problem/35" : "bg-data/35"
                              }`}
                              title={`${yr.year}: ${yr.precipTotalMm} mm Gesamtregen, ${yr.precipVegMm} mm Mai bis Sept`}
                            >
                              <div
                                style={{ height: `${vegSharePct}%` }}
                                className={`w-full ${
                                  isDrought ? "bg-status-problem" : "bg-data"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="text-caption font-bold text-fg tabular-nums">
                            {yr.precipTotalMm} mm
                          </div>
                          <div className="text-[11px] text-fg-muted tabular-nums">
                            Mai bis Sept {yr.precipVegMm} mm
                          </div>
                          <div
                            className={`mt-1 text-[11px] font-semibold ${
                              isDrought ? "text-status-problem-text" : "text-link"
                            }`}
                          >
                            {yr.yearType}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Full Year-by-Year Table (2016 to 2025) */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-small">
                    <thead>
                      <tr className="border-b border-rule text-caption font-semibold text-fg-muted">
                        <th className="py-2 pr-3">Jahr</th>
                        <th className="py-2 px-3 text-right">Regen Gesamt</th>
                        <th className="py-2 px-3 text-right">Regen Mai bis Sept</th>
                        <th className="py-2 px-3 text-right">Blüteregen Juli</th>
                        <th className="py-2 px-3 text-right">Ø Temp Jahr</th>
                        <th className="py-2 px-3 text-right">Ø Temp Mai bis Sept</th>
                        <th className="py-2 px-3 text-right">Wärmesumme</th>
                        <th className="py-2 px-3 text-right">Hitzetage, Spätfrost &amp; Starkregen</th>
                        <th className="py-2 pl-3">Einordnung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {weatherHistory.years.map((yr) => {
                        const isDrought = yr.yearType === "Trockenjahr";
                        return (
                          <tr key={yr.year} className="hover:bg-highlight">
                            <td className="py-2 pr-3 font-bold text-fg tabular-nums">
                              {yr.year}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-fg tabular-nums">
                              {yr.precipTotalMm} mm
                            </td>
                            <td className="py-2 px-3 text-right text-fg tabular-nums">
                              {yr.precipVegMm} mm (nutzbar {yr.effectivePrecipVegMm} mm)
                            </td>
                            <td className="py-2 px-3 text-right text-fg tabular-nums">
                              {yr.precipFloweringMm} mm
                            </td>
                            <td className="py-2 px-3 text-right text-fg tabular-nums">
                              {num(yr.tempMeanC, 1)} °C
                            </td>
                            <td className="py-2 px-3 text-right text-fg tabular-nums">
                              {num(yr.tempVegMeanC, 1)} °C
                            </td>
                            <td className="py-2 px-3 text-right text-fg tabular-nums">
                              {num(yr.growingDegreeDays, 0)} °Cd
                            </td>
                            <td className="py-2 px-3 text-right text-fg tabular-nums">
                              {yr.hotDays30C} Tage ≥ 30 °C · {yr.lateFrostDays} Spätfrost ·{" "}
                              {yr.heavyRainDays25Mm} Starkregentage
                            </td>
                            <td
                              className={`py-2 pl-3 font-semibold ${
                                isDrought ? "text-status-problem-text" : "text-fg"
                              }`}
                            >
                              {yr.yearType}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Expandable Full Field Steckbrief + Direct Expert Soil & Climate Adjustments */}
            {steckbriefOpen ? (
              <div
                data-testid="expanded-field-steckbrief"
                className="space-y-6 border-t border-rule pt-5"
              >
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* 1. Official Cadastral Geometry */}
                  <div className="space-y-2 border-b border-divider pb-4 lg:border-b-0 lg:border-r lg:pr-6">
                    <h3 className="text-subheading text-fg">
                      1. Amtliche Schlaggeometrie &amp; Kataster (fiboa / InVeKoS)
                    </h3>
                    <dl className="space-y-1.5 text-small">
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Amtliche Schlag-ID (FLIK)</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">
                          {snappedParcel?.flik ?? "Flurstück lokal"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Echte Fläche</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">{num(ha)} ha</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Schlagumfang &amp; Ecken</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">
                          {perimeterM} m · {vertexCount} Eckpunkte
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Datensatz &amp; Kultur</dt>
                        <dd className="m-0 font-semibold text-fg text-right">
                          {snappedParcel?.landuseLabel ?? "Ackerland"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* 2. Soil & Water Capacity */}
                  <div className="space-y-2 border-b border-divider pb-4 lg:border-b-0 lg:border-r lg:pr-6">
                    <h3 className="text-subheading text-fg">
                      2. Boden &amp; Wasserspeicher (Standortmodell &amp; BÜK200)
                    </h3>
                    <dl className="space-y-1.5 text-small">
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Bodenart</dt>
                        <dd className="m-0 font-semibold text-fg">{soilMeta.label}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Ackerzahl / Bodenpunkte</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">{ackerzahl} Punkte</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Nutzbare Feldkapazität (nFK)</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">ca. {nfkMm} mm</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Befahrbarkeit im Frühjahr</dt>
                        <dd className="m-0 font-semibold text-fg">
                          {TRAFFICABILITY_LABELS[trafficability]}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* 3. Terrain & Local Agro-Climate */}
                  <div className="space-y-2">
                    <h3 className="text-subheading text-fg">
                      3. Gelände &amp; Lokales Agrarklima (DGM &amp; DWD-Langzeitdaten)
                    </h3>
                    <dl className="space-y-1.5 text-small">
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Höhenlage</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">
                          {weatherHistory.elevationM} m ü. NN
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Jahresniederschlag (DWD)</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">
                          ca. {weatherHistory.avgPrecipTotalMm} mm
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Trockenstress-Risiko</dt>
                        <dd className="m-0 font-semibold text-fg">
                          {trockenstressRisiko}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-fg-muted">Empfohlene Reifezahl-Spanne</dt>
                        <dd className="m-0 font-semibold text-fg tabular-nums">
                          {weatherHistory.siteCharacter.recommendedMaturityRange}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* 4. Direct Expert Adjustments right on the field */}
                <div className="border-t border-divider pt-4 space-y-4">
                  <div className="text-small font-semibold text-fg">
                    4. Direkte Anpassung (Expertenmodus direkt für diesen Schlag, wird im Hof gespeichert)
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <span className="block text-caption font-semibold text-fg-muted">
                        Bodenart anpassen
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(SOIL_TYPE_LABELS) as SoilTypeOption[]).map((st) => {
                          const active = soilType === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              aria-pressed={active}
                              onClick={() => handleSoilTypeChange(st)}
                              className={`rounded-control px-2.5 py-1 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                                active
                                  ? "bg-selected text-on-selected ring-selected"
                                  : "bg-canvas text-fg ring-control hover:bg-highlight"
                              }`}
                            >
                              {SOIL_TYPE_LABELS[st].short}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="picker-ackerzahl-range"
                        className="block text-caption font-semibold text-fg-muted"
                      >
                        Ackerzahl / Bodenpunkte:{" "}
                        <strong className="text-fg tabular-nums">{ackerzahl}</strong>
                      </label>
                      <input
                        id="picker-ackerzahl-range"
                        type="range"
                        min={20}
                        max={100}
                        step={2}
                        value={ackerzahl}
                        onChange={(e) => {
                          const nextAz = Number(e.target.value);
                          setAckerzahl(nextAz);
                          setFarmerSoilOverride(true);
                          dispatchFieldIntake("soil_adjusted", {
                            ackerzahlOverride: nextAz,
                            soilOverridden: true,
                          });
                        }}
                        className="w-full accent-action cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-caption font-semibold text-fg-muted">
                        Wasserversorgung &amp; Frühjahrserwärmung
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          aria-pressed={!irrigationPossible}
                          onClick={() => {
                            setIrrigationPossible(false);
                            setFarmerSoilOverride(true);
                            dispatchFieldIntake("soil_adjusted", {
                              irrigatedOverride: false,
                              soilOverridden: true,
                            });
                          }}
                          className={`rounded-control px-2.5 py-1 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                            !irrigationPossible
                              ? "bg-selected text-on-selected ring-selected"
                              : "bg-canvas text-fg ring-control hover:bg-highlight"
                          }`}
                        >
                          Regenfeldbau
                        </button>
                        <button
                          type="button"
                          aria-pressed={irrigationPossible}
                          onClick={() => {
                            setIrrigationPossible(true);
                            setFarmerSoilOverride(true);
                            dispatchFieldIntake("soil_adjusted", {
                              irrigatedOverride: true,
                              soilOverridden: true,
                            });
                          }}
                          className={`rounded-control px-2.5 py-1 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                            irrigationPossible
                              ? "bg-selected text-on-selected ring-selected"
                              : "bg-canvas text-fg ring-control hover:bg-highlight"
                          }`}
                        >
                          Bewässerung möglich
                        </button>
                        <button
                          type="button"
                          aria-pressed={trafficability === "spaet"}
                          onClick={() => {
                            const nextTraff: TrafficabilityOption =
                              trafficability === "spaet" ? "normal" : "spaet";
                            setTrafficability(nextTraff);
                            setFarmerSoilOverride(true);
                            dispatchFieldIntake("soil_adjusted", {
                              trafficabilityOverride: nextTraff,
                              soilOverridden: true,
                            });
                          }}
                          className={`rounded-control px-2.5 py-1 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                            trafficability === "spaet"
                              ? "bg-selected text-on-selected ring-selected"
                              : "bg-canvas text-fg ring-control hover:bg-highlight"
                          }`}
                        >
                          Kühle / späte Lage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {fehler ? (
            <p className="text-small font-semibold text-status-urgent-text" role="alert">
              {fehler}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-2 text-body text-fg-muted">
          <div className="flex max-w-measure items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-link" aria-hidden="true" />
            <span>
              Such deinen Ort und tipp dann auf dein Feld. Wir laden live die echte Schlaggrenze aus den amtlichen Geodaten.
            </span>
            {fehler ? (
              <span className="font-semibold text-status-urgent-text" role="alert">
                {" "}
                {fehler}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={starteFreiesZeichnen}
            className={buttonClass("secondary", "sm")}
          >
            <Pencil className="size-3.5" aria-hidden="true" /> Eckpunkte neu antippen
          </button>
        </div>
      )}
    </div>
  );
}
