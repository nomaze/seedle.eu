import type { CSSProperties, ReactNode } from "react";

/**
 * Graphic motifs: Line art vector illustrations depicting agricultural themes,
 * embedded discreetly in the background and animated on scroll/load.
 * CSS animations configured in app/globals.css ("Motive"). Design specs: docs/DESIGN.md.
 */

export type MotivName = "schlag" | "parzellen" | "wuchs" | "boden" | "steckbrief" | "versuchsplan" | "schlaege";

type MotivProps = { className?: string; beimScrollen?: boolean };

/** Color and stroke properties for line vector groups. */
function linien(farbe: string, staerke?: number): CSSProperties {
  return { "--motiv-farbe": farbe, ...(staerke ? { "--motiv-staerke": staerke } : {}) } as CSSProperties;
}

function Rahmen({ viewBox, className = "", beimScrollen, children }: MotivProps & { viewBox: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden
      focusable="false"
      className={`motiv block h-auto w-full overflow-visible ${beimScrollen ? "motiv-beim-scrollen" : ""} ${className}`}
    >
      {children}
    </svg>
  );
}

function L({ d }: { d: string }) {
  return <path className="motiv-linie" pathLength={1} d={d} />;
}

/** Maize plant in side view; (x, y) marks top-left corner, h is height. */
function Mais({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <svg x={x} y={y} width={h / 3} height={h} viewBox="0 0 100 300" overflow="visible">
      <L d="M50 300 C50 230 51 140 50 44" />
      <L d="M50 44 L50 8 M50 32 L42 12 M50 32 L58 12 M50 24 L40 18 M50 24 L60 18" />
      <L d="M50 262 C34 246 15 245 2 262 C18 254 34 256 50 268" />
      <L d="M50 222 C68 204 86 203 99 218 C84 212 68 216 50 228" />
      <L d="M50 180 C30 158 12 155 1 168 C16 164 32 170 50 186" />
      <L d="M50 138 C72 118 90 118 99 132 C86 127 70 132 50 144" />
      <L d="M50 96 C36 80 24 76 14 82 C26 84 38 90 50 102" />
      <L d="M52 196 C63 181 67 160 62 146 C56 157 52 175 52 196" />
    </svg>
  );
}

/** Juvenile maize plant without tassel or ear. */
function JungerMais({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <svg x={x} y={y} width={h / 3} height={h} viewBox="0 0 100 300" overflow="visible">
      <L d="M50 300 C50 250 50 200 50 164" />
      <L d="M50 262 C34 246 15 245 2 262 C18 254 34 256 50 268" />
      <L d="M50 232 C68 214 86 213 99 228 C84 222 68 226 50 238" />
      <L d="M50 202 C32 182 14 180 4 192 C18 190 34 194 50 208" />
      <L d="M50 168 C42 150 38 140 41 128 C48 138 51 150 50 168" />
    </svg>
  );
}

/** Field parcel top-down view: outline, rows, dimension lines. */
export function MotivSchlag(props: MotivProps) {
  const reihen = Array.from({ length: 9 }, (_, i) => {
    const x0 = 150 + i * 60;
    return `M${x0} ${88 - i * 3} L${x0 + 40} ${582 - i * 3.9}`;
  });
  return (
    <Rahmen viewBox="0 0 800 620" {...props}>
      <path className="motiv-flaeche" d="M90 90 L690 60 L748 548 L130 586 Z" fill="var(--color-leaf-100)" opacity="0.4" />
      <g style={linien("var(--color-leaf-300)", 1.4)}>
        {reihen.map((d) => (
          <L key={d} d={d} />
        ))}
      </g>
      <g style={linien("var(--color-leaf-300)", 2.6)}>
        <L d="M90 90 L690 60 L748 548 L130 586 Z" />
      </g>
      <g style={linien("var(--color-sand-400)", 1.4)}>
        <L d="M90 44 L690 14" />
        <L d="M90 36 L90 52 M690 6 L690 22" />
        <L d="M44 90 L84 586" />
        <L d="M36 90 L52 90 M76 586 L92 586" />
      </g>
    </Rahmen>
  );
}

/** Side-by-side variety plots with signs, as seen at field demonstration days. */
export function MotivParzellen(props: MotivProps) {
  const parzellen = [20, 170, 320, 470];
  const balken = [60, 50, 42, 34];
  return (
    <Rahmen viewBox="0 0 600 260" {...props}>
      <g style={linien("var(--color-leaf-300)")}>
        <L d="M0 250 L600 250" />
      </g>
      {parzellen.map((x, i) => (
        <g key={x}>
          <Mais x={x + 10} y={40 - (i % 2) * 8} h={210 + (i % 2) * 8} />
          <Mais x={x + 56} y={32 + (i % 3) * 6} h={218 - (i % 3) * 6} />
        </g>
      ))}
      {parzellen.map((x, i) => (
        <g key={`schild-${x}`}>
          <rect className="motiv-flaeche" x={x + 20} y={168} width={94} height={46} rx={4} fill="var(--color-white)" opacity="0.85" />
          <g style={linien("var(--color-sand-400)")}>
            <L d={`M${x + 20} 168 H${x + 114} V214 H${x + 20} Z M${x + 67} 214 V250`} />
          </g>
          <g className="motiv-flaeche">
            <rect x={x + 34} y={180} width={40} height={5} rx={2.5} fill="var(--color-sand-400)" />
            <rect
              x={x + 34}
              y={193}
              width={balken[i]}
              height={9}
              rx={4.5}
              fill={i === 0 ? "var(--color-poppy)" : "var(--color-sand-400)"}
              opacity={i === 0 ? 0.75 : 1}
            />
          </g>
        </g>
      ))}
    </Rahmen>
  );
}

/** Phenological growth stages from emergence to physiological maturity. */
export function MotivWuchs(props: MotivProps) {
  return (
    <Rahmen viewBox="0 0 560 260" {...props}>
      <L d="M0 256 L560 256" />
      <L d="M40 256 L40 244 C40 238 43 234 48 232" />
      <JungerMais x={110} y={186} h={70} />
      <JungerMais x={220} y={132} h={124} />
      <Mais x={340} y={60} h={196} />
      <Mais x={460} y={20} h={236} />
    </Rahmen>
  );
}

/** Soil profile with soil horizons and rooting system. */
export function MotivBoden(props: MotivProps) {
  const wurzeln = [
    "M240 40 C 232 62, 248 80, 236 108 M240 40 C 254 60, 262 74, 266 96 M240 40 C 226 54, 218 68, 214 88",
    "M560 40 C 552 66, 568 88, 556 120 M560 40 C 576 58, 584 76, 590 98",
    "M880 40 C 872 64, 890 84, 878 116 M880 40 C 866 56, 858 72, 856 92 M880 40 C 896 60, 902 72, 908 94",
    "M1200 40 C 1192 62, 1206 82, 1196 110 M1200 40 C 1214 58, 1222 72, 1226 92",
  ];
  const kruemel = [
    [120, 104, 2],
    [420, 62, 1.6],
    [700, 110, 2.2],
    [1010, 70, 1.6],
    [1320, 112, 2],
    [330, 150, 2.4],
    [780, 152, 1.8],
    [1110, 148, 2.4],
  ];
  return (
    <Rahmen viewBox="0 0 1440 170" {...props}>
      <g style={linien("var(--color-leaf-400)", 2.2)}>
        <L d="M0 40 L1440 40" />
      </g>
      <g style={linien("var(--color-leaf-300)", 1.2)}>
        <L d="M0 86 C 360 80, 1080 92, 1440 84" />
        <L d="M0 130 C 360 136, 1080 124, 1440 132" />
      </g>
      <g style={linien("var(--color-leaf-400)", 1.3)}>
        {wurzeln.map((d) => (
          <L key={d} d={d} />
        ))}
      </g>
      <g className="motiv-flaeche" fill="var(--color-leaf-300)" opacity="0.6">
        {kruemel.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </Rahmen>
  );
}

/** Seed bag label tag: variety specification profile. */
export function MotivSteckbrief(props: MotivProps) {
  return (
    <Rahmen viewBox="0 0 320 440" {...props}>
      <path
        className="motiv-flaeche"
        d="M70 60 L250 60 L290 100 L290 410 L30 410 L30 100 Z"
        fill="var(--color-sand-100)"
        opacity="0.8"
      />
      <g style={linien("var(--color-sand-400)", 2)}>
        <L d="M70 60 L250 60 L290 100 L290 410 L30 410 L30 100 Z" />
        <L d="M160 92 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0" />
        <L d="M160 82 C 150 50, 176 30, 166 0" />
      </g>
      <g style={linien("var(--color-leaf-300)", 2)}>
        <L d="M60 150 H200" />
        <L d="M60 200 H260 M60 236 H230 M60 272 H250 M60 308 H210" />
      </g>
      <rect className="motiv-flaeche" x="60" y="344" width="200" height="38" rx="6" fill="var(--color-leaf-100)" />
    </Rahmen>
  );
}

/** Trial field with replicated plot layouts. */
export function MotivVersuchsplan(props: MotivProps) {
  const spalten = 8;
  const zeilen = 3;
  const parzellen = [];
  for (let z = 0; z < zeilen; z++) {
    for (let s = 0; s < spalten; s++) {
      parzellen.push({ x: 60 + s * 62, y: 70 + z * 92, hervor: (s * 3 + z * 5) % 7 === 0 });
    }
  }
  return (
    <Rahmen viewBox="0 0 620 380" {...props}>
      <g className="motiv-flaeche">
        {parzellen
          .filter((p) => p.hervor)
          .map((p) => (
            <rect key={`f-${p.x}-${p.y}`} x={p.x} y={p.y} width={52} height={80} rx={3} fill="var(--color-leaf-100)" />
          ))}
      </g>
      <g style={linien("var(--color-leaf-300)", 1.4)}>
        {parzellen.map((p) => (
          <L key={`${p.x}-${p.y}`} d={`M${p.x} ${p.y} h52 v80 h-52 Z`} />
        ))}
      </g>
      <g style={linien("var(--color-sand-400)", 1.4)}>
        <L d="M40 50 H580 V360 H40 Z" />
        <L d="M60 30 H548 M60 24 V36 M548 24 V36" />
      </g>
    </Rahmen>
  );
}

/** Farm field boundaries with field access track. */
export function MotivSchlaege(props: MotivProps) {
  return (
    <Rahmen viewBox="0 0 640 420" {...props}>
      <g className="motiv-flaeche" fill="var(--color-leaf-100)" opacity="0.5">
        <path d="M40 60 L260 40 L280 190 L60 210 Z" />
        <path d="M330 70 L590 50 L600 170 L350 200 Z" />
        <path d="M80 260 L300 240 L320 390 L100 400 Z" />
      </g>
      <g style={linien("var(--color-leaf-300)", 2.2)}>
        <L d="M40 60 L260 40 L280 190 L60 210 Z" />
        <L d="M330 70 L590 50 L600 170 L350 200 Z" />
        <L d="M80 260 L300 240 L320 390 L100 400 Z" />
        <L d="M370 250 L580 236 L600 380 L360 396 Z" />
      </g>
      <g style={linien("var(--color-sand-400)", 2.4)}>
        <L d="M0 225 C 160 222, 300 226, 330 222 S 520 214, 640 216" />
        <L d="M310 0 C 312 80, 318 160, 325 225" />
      </g>
    </Rahmen>
  );
}

export const MOTIVE: Record<MotivName, (props: MotivProps) => ReactNode> = {
  schlag: MotivSchlag,
  parzellen: MotivParzellen,
  wuchs: MotivWuchs,
  boden: MotivBoden,
  steckbrief: MotivSteckbrief,
  versuchsplan: MotivVersuchsplan,
  schlaege: MotivSchlaege,
};
