import type { YearComparison } from "@seedle/core";

/**
 * Five-year historical hindcast comparison: two bars per year (recommended variety
 * and reference benchmark under historical weather), diamonds represent empirical trial means.
 */
export function YearComparisonChart({ jahre, nameA, nameB }: { jahre: YearComparison[]; nameA: string; nameB: string }) {
  const W = 640;
  const H = 250;
  const pad = { l: 8, r: 8, t: 28, b: 48 };
  const werte = jahre.flatMap((j) => [j.empfohlenModell, j.vergleichModell, j.empfohlenVersuch ?? j.empfohlenModell, j.vergleichVersuch ?? j.vergleichModell]);
  const lo = Math.floor((Math.min(...werte) * 0.85) / 10) * 10;
  const hi = Math.ceil((Math.max(...werte) * 1.03) / 10) * 10;
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const slot = (W - pad.l - pad.r) / jahre.length;
  const bar = Math.min(34, slot * 0.28);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Vergleich ${nameA} gegen ${nameB} in den Jahren ${jahre[0]?.jahr} bis ${jahre.at(-1)?.jahr}`}>
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="var(--color-line)" />
        {jahre.map((j, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const a = j.empfohlenModell;
          const b = j.vergleichModell;
          const vorne = a >= b;
          return (
            <g key={j.jahr}>
              <rect x={cx - bar - 2} y={y(a)} width={bar} height={H - pad.b - y(a)} rx="5" fill="var(--color-leaf-500)" />
              <rect x={cx + 2} y={y(b)} width={bar} height={H - pad.b - y(b)} rx="5" fill="var(--color-sand-400)" />
              {j.empfohlenVersuch !== undefined ? (
                <path d={`M ${cx - bar / 2 - 2} ${y(j.empfohlenVersuch) - 6} l 5 6 l -5 6 l -5 -6 z`} fill="var(--color-white)" stroke="var(--color-leaf-800)" strokeWidth="1.5" />
              ) : null}
              {j.vergleichVersuch !== undefined ? (
                <path d={`M ${cx + bar / 2 + 2} ${y(j.vergleichVersuch) - 6} l 5 6 l -5 6 l -5 -6 z`} fill="var(--color-white)" stroke="var(--color-muted)" strokeWidth="1.5" />
              ) : null}
              <text x={cx} y={Math.min(y(a), y(b)) - 9} textAnchor="middle" fontSize="13" fontWeight="600" fill={vorne ? "var(--color-leaf-700)" : "var(--color-muted)"}>
                {vorne ? "+" : "−"}
                {Math.abs(a - b).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %
              </text>
              <text x={cx} y={H - pad.b + 18} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--color-ink)">
                {j.jahr}
              </text>
              <text x={cx} y={H - pad.b + 34} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
                {j.jahrestyp.split(",")[0]}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-leaf-500" /> {nameA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-sand-400" /> {nameB}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M6 0 l5 6 l-5 6 l-5 -6 z" fill="var(--color-white)" stroke="var(--color-ink)" strokeWidth="1.3" />
          </svg>
          Mittel der Versuche an ähnlichen Standorten
        </span>
        <span>Zahl über den Balken: Relativ-Vorsprung in {jahre[0]?.einheit ?? "% Relativ-Index"}</span>
      </figcaption>
    </figure>
  );
}
