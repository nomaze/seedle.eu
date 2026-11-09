"use client";

import { usePathname } from "next/navigation";
import { MOTIVE, type MotivName } from "./Motive";

/**
 * Maps active routes to contextual background illustration motifs.
 * Map-heavy pages omit motifs to prioritize cartographic clarity.
 */
function motivFuer(pfad: string): MotivName | null {
  if (pfad === "/" || pfad === "/feld/neu" || pfad.endsWith("/grenze")) return null;
  if (pfad.endsWith("/ranking")) return "parzellen";
  if (pfad.includes("/sorte/")) return "steckbrief";
  if (pfad.startsWith("/heute")) return "wuchs";
  if (pfad.startsWith("/hof")) return "schlaege";
  if (pfad.startsWith("/daten")) return "versuchsplan";
  if (pfad.startsWith("/feld/")) return "schlag";
  return "boden";
}

/** Background illustration motif anchored bottom-right behind content. */
export function SeitenMotiv() {
  const pfad = usePathname();
  const name = motivFuer(pfad);
  if (!name) return null;
  const Motiv = MOTIVE[name];
  const breit = name === "boden";
  return (
    <div
      aria-hidden
      className={
        breit
          ? "pointer-events-none fixed inset-x-0 bottom-[14vh] -z-10 opacity-80"
          : "pointer-events-none fixed -right-[18vw] bottom-[16vh] -z-10 w-[86vw] opacity-60 sm:-right-[3vw] sm:bottom-[12vh] sm:w-[min(42vw,560px)] sm:opacity-100"
      }
    >
      {/* Key triggers re-drawing animation on client navigation */}
      <Motiv key={pfad} />
    </div>
  );
}
