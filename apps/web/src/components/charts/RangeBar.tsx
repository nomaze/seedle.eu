/**
 * Variety margin spread across climate scenarios (worst-case to best-case),
 * featuring a center marker for expected value. `skala` normalizes across all varieties.
 */
export function RangeBar({
  lo,
  hi,
  mitte,
  skala,
  label,
}: {
  lo: number;
  hi: number;
  mitte: number;
  skala: [number, number];
  label?: string;
}) {
  const [a, b] = skala;
  const pos = (x: number) => `${Math.max(0, Math.min(100, ((x - a) / Math.max(b - a, 1)) * 100))}%`;
  return (
    <div className="w-full" role="img" aria-label={label ?? `Spanne von ${Math.round(lo)} bis ${Math.round(hi)} €`}>
      <div className="relative h-2 bg-data-track">
        <div className="absolute inset-y-0 bg-data/30" style={{ left: pos(lo), right: `calc(100% - ${pos(hi)})` }} />
        <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas bg-data" style={{ left: pos(mitte) }} />
      </div>
    </div>
  );
}
