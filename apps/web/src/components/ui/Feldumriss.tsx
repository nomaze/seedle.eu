import type { Polygon } from "@seedle/core";

/**
 * The real outline of a field as its icon, drawn from its boundary (design system "Feldumriss").
 * North up, aspect ratio kept, no fill. Falls back to a neutral quadrilateral without geometry.
 */
const FALLBACK = "M0.15 0.25 L0.68 0.1 L0.9 0.42 L0.75 0.88 L0.2 0.8 Z";

function outlinePath(geometry: Polygon | null | undefined, size: number, pad: number): string {
  const ring = geometry?.coordinates?.[0];
  if (!ring || ring.length < 3) {
    return FALLBACK.replace(/[\d.]+/g, (n) => String(Math.round((Number(n) * (size - 2 * pad) + pad) * 100) / 100));
  }
  const lat0 = ring.reduce((s, p) => s + (p[1] ?? 0), 0) / ring.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const pts = ring.map((p) => [(p[0] ?? 0) * k, -(p[1] ?? 0)] as const);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX || 1e-9;
  const h = Math.max(...ys) - minY || 1e-9;
  const inner = size - 2 * pad;
  const scale = inner / Math.max(w, h);
  const offX = pad + (inner - w * scale) / 2;
  const offY = pad + (inner - h * scale) / 2;
  return (
    pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${(offX + (x - minX) * scale).toFixed(2)} ${(offY + (y - minY) * scale).toFixed(2)}`)
      .join(" ") + " Z"
  );
}

export function Feldumriss({
  geometry,
  size = 32,
  strokeWidth = 2,
  className = "text-link",
}: {
  geometry?: Polygon | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const pad = strokeWidth + 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className={`shrink-0 ${className}`}>
      <path
        d={outlinePath(geometry, size, pad)}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
