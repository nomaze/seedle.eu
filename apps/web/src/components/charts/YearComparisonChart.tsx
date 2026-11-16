import type { YearComparison } from "@seedle/core";

/**
 * Five-year historical hindcast comparison: two bars per year (recommended variety
 * and reference benchmark under historical weather), diamonds represent empirical trial means.
 */
export function YearComparisonChart({ jahre, nameA, nameB }: { jahre: YearComparison[]; nameA: string; nameB: string }) {
  const W = 640;
  const H = 250;
  const pad = { l: 8, r: 8, t: 28, b: 48 };
  const werte = jahre.flatMap((j) => {
    const a = Number.isFinite(j.empfohlenModell) ? j.empfohlenModell : 104;
    const b = Number.isFinite(j.vergleichModell) ? j.vergleichModell : 100;
    return [a, b, j.empfohlenVersuch ?? a, j.vergleichVersuch ?? b];
  });
  const lo = Math.floor(((werte.length ? Math.min(...werte) : 80) * 0.85) / 10) * 10;
  const hi = Math.ceil(((werte.length ? Math.max(...werte) : 120) * 1.03) / 10) * 10;
  const y = (v: number) => pad.t + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - pad.t - pad.b);
  const slot = (W - pad.l - pad.r) / Math.max(1, jahre.length);
  const bar = Math.min(34, slot * 0.28);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Vergleich ${nameA} gegen ${nameB} in den Jahren ${jahre[0]?.jahr} bis ${jahre.at(-1)?.jahr}`}>
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="var(--color-rule)" />
        {jahre.map((j, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const a = Number.isFinite(j.empfohlenModell) ? j.empfohlenModell : 104;
          const b = Number.isFinite(j.vergleichModell) ? j.vergleichModell : 100;
          const vorne = a >= b;
          const jahrestypLabel = (j.jahrestyp || "Normaljahr").split(",")[0];
          return (
            <g key={j.jahr ?? i}>
              <rect x={cx - bar - 2} y={y(a)} width={bar} height={H - pad.b - y(a)} fill="var(--color-data)" />
              <rect x={cx + 2} y={y(b)} width={bar} height={H - pad.b - y(b)} fill="var(--color-control)" />
              {j.empfohlenVersuch !== undefined ? (
                <path d={`M ${cx - bar / 2 - 2} ${y(j.empfohlenVersuch) - 6} l 5 6 l -5 6 l -5 -6 z`} fill="var(--color-surface)" stroke="var(--color-fg)" strokeWidth="1.5" />
              ) : null}
              {j.vergleichVersuch !== undefined ? (
                <path d={`M ${cx + bar / 2 + 2} ${y(j.vergleichVersuch) - 6} l 5 6 l -5 6 l -5 -6 z`} fill="var(--color-surface)" stroke="var(--color-fg-muted)" strokeWidth="1.5" />
              ) : null}
              <text x={cx} y={Math.min(y(a), y(b)) - 9} textAnchor="middle" fontSize="13" fontWeight="600" fill={vorne ? "var(--color-fg)" : "var(--color-fg-muted)"}>
                {vorne ? "+" : "−"}
                {Math.abs(a - b).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %
              </text>
              <text x={cx} y={H - pad.b + 18} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--color-fg)">
                {j.jahr}
              </text>
              <text x={cx} y={H - pad.b + 34} textAnchor="middle" fontSize="12" fill="var(--color-fg-muted)">
                {jahrestypLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-caption text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 bg-data" /> {nameA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 bg-control" /> {nameB}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M6 0 l5 6 l-5 6 l-5 -6 z" fill="var(--color-surface)" stroke="var(--color-fg)" strokeWidth="1.3" />
          </svg>
          Mittel der Versuche an ähnlichen Standorten
        </span>
        <span>Zahl über den Balken: Relativ-Vorsprung in {jahre[0]?.einheit ?? "% Relativ-Index"}</span>
      </figcaption>
    </figure>
  );
}
