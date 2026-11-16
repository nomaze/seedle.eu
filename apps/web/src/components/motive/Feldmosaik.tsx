import { type CSSProperties, useId } from "react";

/**
 * Self-drawing field mosaic: fields seen from above as line art (boundaries, tramlines,
 * farm track) with one highlighted field — "your field". Lines draw themselves on load
 * through the `.motiv` animation in globals.css; with reduced motion they are simply shown.
 * Colours come from the motif role tokens (--color-motif, -accent, -soil, -fill).
 */

type Punkt = [number, number];

interface Mosaik {
  felder: Punkt[][];
  deckkraft: number[];
  hervor: Punkt[];
  gassen: { feld: Punkt[]; linien: string[] }[];
  weg: string;
}

const VARIANTEN = {
  /** Wide band, e.g. the landing page hero across the full width. */
  band: { w: 1440, h: 420, spalten: 9, zeilen: 3, hx: 6, hy: 1, grenze: 1.8, gasse: 1.1, weg: 3, feld: 3.6 },
  /** Page background, anchored bottom right behind the content. */
  seite: { w: 640, h: 440, spalten: 5, zeilen: 3, hx: 2, hy: 1, grenze: 1.5, gasse: 1, weg: 2.4, feld: 3 },
  /** Flat panel inside content, e.g. "Echter Acker" next to the lab drawing or beside a call to action. */
  flach: { w: 640, h: 300, spalten: 5, zeilen: 2, hx: 2, hy: 1, grenze: 1.6, gasse: 1, weg: 2.6, feld: 3.2 },
} as const;

/** Seeded pseudo-random numbers: the same seed draws the same mosaic on server and client. */
function zufall(seed: number) {
  let s = Math.abs(Math.round(seed)) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pfad(p: Punkt[]): string {
  return `${p.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
}

/** Parallel tramlines across a field's bounding circle; the field's clip path trims them. */
function fahrgassen(feld: Punkt[], winkel: number, abstand: number): string[] {
  const xs = feld.map((p) => p[0]);
  const ys = feld.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const r = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;
  const a = (winkel * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  const [nx, ny] = [-dy, dx];
  const linien: string[] = [];
  for (let t = -r; t <= r; t += abstand) {
    const px = cx + nx * t;
    const py = cy + ny * t;
    linien.push(
      `M${(px - dx * r).toFixed(1)} ${(py - dy * r).toFixed(1)} L${(px + dx * r).toFixed(1)} ${(py + dy * r).toFixed(1)}`,
    );
  }
  return linien;
}

function mosaik(v: (typeof VARIANTEN)[keyof typeof VARIANTEN], seed: number): Mosaik {
  const r = zufall(seed);
  const { w, h, spalten, zeilen, hx, hy } = v;
  const versatz = 16;
  const ecken: Punkt[][] = [];
  for (let y = 0; y <= zeilen; y++) {
    const reihe: Punkt[] = [];
    for (let x = 0; x <= spalten; x++) {
      const jx = x === 0 || x === spalten ? 0 : (r() - 0.5) * (w / spalten) * 0.45;
      const jy = y === 0 || y === zeilen ? 0 : (r() - 0.5) * (h / zeilen) * 0.35;
      reihe.push([(x * w) / spalten + jx + y * versatz - (versatz * zeilen) / 2, (y * h) / zeilen + jy]);
    }
    ecken.push(reihe);
  }

  const felder: Punkt[][] = [];
  const deckkraft: number[] = [];
  const gassen: Mosaik["gassen"] = [];
  let hervor: Punkt[] = [];
  for (let y = 0; y < zeilen; y++) {
    for (let x = 0; x < spalten; x++) {
      const feld: Punkt[] = [ecken[y]![x]!, ecken[y]![x + 1]!, ecken[y + 1]![x + 1]!, ecken[y + 1]![x]!];
      felder.push(feld);
      deckkraft.push(0.12 + r() * 0.4);
      const istHervor = x === hx && y === hy;
      if (istHervor) hervor = feld;
      if (istHervor || (x + y * 2 + seed) % 3 === 0) {
        gassen.push({ feld, linien: fahrgassen(feld, (r() - 0.5) * 120, istHervor ? 14 : 18) });
      }
    }
  }

  const weg = `M0 ${(h * 0.68).toFixed(0)} C ${(w * 0.28).toFixed(0)} ${(h * 0.55).toFixed(0)}, ${(w * 0.55).toFixed(0)} ${(h * 0.86).toFixed(0)}, ${w} ${(h * 0.64).toFixed(0)}`;
  return { felder, deckkraft, hervor, gassen, weg };
}

function linien(farbe: string, staerke: number, verzoegerung = 0): CSSProperties {
  return {
    "--motiv-farbe": farbe,
    "--motiv-staerke": staerke,
    ...(verzoegerung ? { animationDelay: `${verzoegerung}s` } : {}),
  } as CSSProperties;
}

function L({ d }: { d: string }) {
  return <path className="motiv-linie" pathLength={1} d={d} />;
}

export function MotivFeldmosaik({
  variante = "seite",
  seed = 11,
  className = "",
}: {
  variante?: keyof typeof VARIANTEN;
  seed?: number;
  className?: string;
}) {
  const v = VARIANTEN[variante];
  const m = mosaik(v, seed);
  const clipId = `feldmosaik-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${v.w} ${v.h}`}
      preserveAspectRatio={variante === "band" ? "xMidYMid slice" : "xMidYMid meet"}
      aria-hidden
      focusable="false"
      className={`motiv block overflow-hidden ${className}`}
    >
      <defs>
        {m.gassen.map((g, i) => (
          <clipPath key={i} id={`${clipId}-${i}`}>
            <path d={pfad(g.feld)} />
          </clipPath>
        ))}
      </defs>

      {/* Soft fills fade in: every field a little different, your field strongest */}
      {m.felder.map((f, i) => (
        <path key={`f${i}`} className="motiv-flaeche" d={pfad(f)} fill="var(--color-motif-fill)" opacity={m.deckkraft[i]} />
      ))}
      <path className="motiv-flaeche" d={pfad(m.hervor)} fill="var(--color-motif-fill)" opacity="0.9" />

      {/* Field boundaries */}
      <g style={linien("var(--color-motif)", v.grenze)}>
        {m.felder.map((f, i) => (
          <L key={i} d={pfad(f)} />
        ))}
      </g>

      {/* Farm track */}
      <g className="motiv" style={linien("var(--color-motif-soil)", v.weg, 0.2)}>
        <L d={m.weg} />
      </g>

      {/* Tramlines, trimmed to their field */}
      <g className="motiv" style={linien("var(--color-motif)", v.gasse, 0.5)}>
        {m.gassen.map((g, i) => (
          <g key={i} clipPath={`url(#${clipId}-${i})`}>
            {g.linien.map((d) => (
              <L key={d} d={d} />
            ))}
          </g>
        ))}
      </g>

      {/* Your field: strong outline drawn last */}
      <g className="motiv" style={linien("var(--color-motif-accent)", v.feld, 0.9)}>
        <L d={pfad(m.hervor)} />
      </g>
    </svg>
  );
}

/**
 * Self-drawing lab trial: two benches of identical small parcels with straight rows,
 * the uniform counterpart to the field mosaic ("Labor-Versuch" vs. "Echter Acker").
 */
export function MotivLabor({ className = "" }: { className?: string }) {
  const W = 640;
  const H = 300;
  const spalten = 6;
  const zeilen = 2;
  const rand = 16;
  const bw = (W - rand * (spalten + 1)) / spalten;
  const bh = (H - rand * (zeilen + 1)) / zeilen;
  const parzellen: string[] = [];
  const reihen: string[] = [];
  for (let y = 0; y < zeilen; y++) {
    for (let x = 0; x < spalten; x++) {
      const x0 = rand + x * (bw + rand);
      const y0 = rand + y * (bh + rand);
      parzellen.push(`M${x0.toFixed(0)} ${y0.toFixed(0)}H${(x0 + bw).toFixed(0)}V${(y0 + bh).toFixed(0)}H${x0.toFixed(0)}Z`);
      for (let k = 1; k < 5; k++) {
        const xx = x0 + (k * bw) / 5;
        reihen.push(`M${xx.toFixed(0)} ${(y0 + 8).toFixed(0)}V${(y0 + bh - 8).toFixed(0)}`);
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false" className={`motiv block overflow-hidden ${className}`}>
      <g style={linien("var(--color-motif)", 1.6)}>
        {parzellen.map((d) => (
          <L key={d} d={d} />
        ))}
      </g>
      <g className="motiv" style={linien("var(--color-motif)", 1, 0.5)}>
        {reihen.map((d) => (
          <L key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
